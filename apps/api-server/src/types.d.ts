/* eslint-disable no-unused-vars */

import 'express';

// Type augmentation for Express.Request to include custom auth properties
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
      ipHash?: string;
    }
  }
}
