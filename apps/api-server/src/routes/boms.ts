import { Router, Request, Response, NextFunction } from 'express';
import * as bomRepo from '../repositories/boms';
import { authMiddleware, requireRole } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../errors';

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
      const bom = await bomRepo.getBomById(req.params.bomId);
      if (!bom) {
        throw new NotFoundError('BOM not found');
      }

      const items = await bomRepo.getBomItems(req.params.bomId);

      res.json({
        data: {
          ...bom,
          items,
        },
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
      const { partNumber, revision } = req.body;

      if (!partNumber || !revision) {
        throw new ValidationError('partNumber and revision are required');
      }

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
      const bom = await bomRepo.updateBom(req.params.bomId, req.body);
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
