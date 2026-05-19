/* eslint-disable no-unused-vars */

// Type augmentation for Express.Request to include custom auth properties
declare module 'express' {
  interface Request {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    ipHash?: string;
  }
}
