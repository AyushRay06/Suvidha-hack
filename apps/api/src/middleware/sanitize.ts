import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize string values in request body to prevent basic XSS.
 * Strips HTML tags from all string fields recursively.
 */
function stripHtml(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/<[^>]*>/g, '').trim();
  }
  if (Array.isArray(value)) {
    return value.map(stripHtml);
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = stripHtml(val);
    }
    return sanitized;
  }
  return value;
}

/**
 * Middleware: Sanitize request body to remove HTML tags from strings.
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = stripHtml(req.body);
  }
  next();
};

/**
 * Middleware: Validate x-kiosk-id header if present.
 * Rejects requests with invalid kiosk IDs (must be alphanumeric + hyphens, max 64 chars).
 */
export const validateKioskId = (req: Request, res: Response, next: NextFunction) => {
  const kioskId = req.headers['x-kiosk-id'];

  if (kioskId) {
    const id = Array.isArray(kioskId) ? kioskId[0] : kioskId;
    // Allow alphanumeric, hyphens, underscores — max 64 chars
    const isValid = /^[a-zA-Z0-9_-]{1,64}$/.test(id);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid x-kiosk-id header format',
      });
    }
  }

  next();
};
