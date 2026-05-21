import { Router, Request, Response, NextFunction } from 'express';
import * as bomRepo from '../repositories/boms';
import { authMiddleware, requireRole } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../errors';
import { createBOMSchema, updateBOMSchema } from '../utils/validation-schemas';
import { csvEscape, csvSafeValue, getSafeFilename } from '../utils/csv';

const router = Router();

// List all BOMs
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const boms = await bomRepo.listBoms(limit, offset);
      res.json({
        data: boms,
        limit,
        offset,
        total: boms.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Get BOM by ID with items
router.get(
  '/:bomId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bom = await bomRepo.getBomWithItems(req.params.bomId);
      if (!bom) {
        throw new NotFoundError('BOM not found');
      }

      res.json({
        data: bom,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Create new BOM
router.post(
  '/',
  authMiddleware,
  requireRole('admin', 'supervisor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validation = createBOMSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError(
          `Invalid request: ${validation.error.errors.map((e) => `${e.path.join('.')} - ${e.message}`).join('; ')}`
        );
      }

      const { partNumber, revision } = validation.data;

      const existing = await bomRepo.getBomByPartNumber(partNumber);
      if (existing) {
        throw new ValidationError('BOM with this part number already exists');
      }

      const bom = await bomRepo.createBom({
        partNumber,
        revision,
        createdBy: req.userId!,
      });

      res.status(201).json({ data: bom });
    } catch (err) {
      next(err);
    }
  }
);

// Update BOM
router.patch(
  '/:bomId',
  authMiddleware,
  requireRole('admin', 'supervisor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validation = updateBOMSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError(
          `Invalid request: ${validation.error.errors.map((e) => `${e.path.join('.')} - ${e.message}`).join('; ')}`
        );
      }

      const bom = await bomRepo.updateBom(req.params.bomId, validation.data);
      if (!bom) {
        throw new NotFoundError('BOM not found');
      }

      res.json({ data: bom });
    } catch (err) {
      next(err);
    }
  }
);

// Delete BOM (soft delete)
router.delete(
  '/:bomId',
  authMiddleware,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bom = await bomRepo.deleteBom(req.params.bomId);
      if (!bom) {
        throw new NotFoundError('BOM not found');
      }

      res.json({ data: bom, message: 'BOM deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// Add item to BOM
router.post(
  '/:bomId/items',
  authMiddleware,
  requireRole('admin', 'supervisor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bom = await bomRepo.getBomById(req.params.bomId);
      if (!bom) {
        throw new NotFoundError('BOM not found');
      }

      const { feederSlot, internalPartNumber, mpn1, quantity } = req.body;

      if (!feederSlot || !internalPartNumber || !quantity) {
        throw new ValidationError('feederSlot, internalPartNumber, and quantity are required');
      }

      const item = await bomRepo.addBomItem({
        bomId: req.params.bomId,
        feederSlot,
        internalPartNumber,
        mpn1: mpn1 || null,
        quantity,
      });

      res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  }
);

// Import BOM items from CSV (development/production-safe)
router.post(
  '/:bomId/import',
  authMiddleware,
  requireRole('admin', 'supervisor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { csv } = req.body;
      if (!csv || typeof csv !== 'string') {
        throw new ValidationError('CSV payload is required in the `csv` body field');
      }

      const inserted = await bomRepo.importBomItemsFromCsv(req.params.bomId, csv, req.userId!);

      res.status(201).json({ data: inserted, inserted: inserted.length });
    } catch (err) {
      next(err);
    }
  }
);

// Delete BOM item
router.delete(
  '/:bomId/items/:itemId',
  authMiddleware,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await bomRepo.deleteBomItem(req.params.itemId);
      if (!item) {
        throw new NotFoundError('Item not found');
      }

      res.json({ data: item, message: 'Item deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

// Export BOM as CSV
router.get(
  '/:bomId/export',
  authMiddleware,
  requireRole('admin', 'supervisor', 'qa'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bom = await bomRepo.getBomWithItems(req.params.bomId);
      if (!bom) {
        throw new NotFoundError('BOM not found');
      }

      const rows: string[] = [];
      // Header
      rows.push(['feederSlot', 'internalPartNumber', 'mpn1', 'quantity', 'createdAt'].join(','));

      for (const itemRaw of bom.items || []) {
        const item = itemRaw || {} as any;
        rows.push([
          csvEscape(csvSafeValue(item.feederSlot ? String(item.feederSlot) : '') ?? ''),
          csvEscape(csvSafeValue(item.internalPartNumber ? String(item.internalPartNumber) : '') ?? ''),
          csvEscape(csvSafeValue(item.mpn1 ? String(item.mpn1) : '') ?? ''),
          csvEscape(csvSafeValue(String(item.quantity ?? '0')) ?? ''),
          csvEscape(csvSafeValue(item.createdAt ? new Date(item.createdAt).toISOString() : '') ?? ''),
        ].join(','));
      }

      const csvContent = rows.join('\r\n');
      const filename = getSafeFilename(`${bom.partNumber || 'bom'}_${req.params.bomId}.csv`);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (err) {
      next(err);
    }
  }
);
