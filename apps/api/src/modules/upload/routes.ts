import { Router } from 'express';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

// Create uploads directory
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(console.error);

// Upload schema for base64 encoded images
const uploadSchema = z.object({
    filename: z.string(),
    contentType: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/),
    base64Data: z.string(),
});

// Upload single image (base64 encoded)
router.post('/image', async (req: AuthReq, res, next) => {
    try {
        const { filename, contentType, base64Data } = uploadSchema.parse(req.body);

        // Generate unique filename
        const ext = contentType.split('/')[1];
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, uniqueName);

        // Decode and save file
        const buffer = Buffer.from(base64Data, 'base64');

        // Validate file size (max 5MB)
        if (buffer.length > 5 * 1024 * 1024) {
            throw new ApiError('File size must be less than 5MB', 400);
        }

        await fs.writeFile(filePath, buffer);

        // Return URL path (relative to server)
        const imageUrl = `/uploads/${uniqueName}`;

        res.status(201).json({
            success: true,
            data: {
                url: imageUrl,
                filename: uniqueName,
                originalName: filename,
                size: buffer.length,
            },
            message: 'Image uploaded successfully',
        });
    } catch (error) {
        next(error);
    }
});

// Get image by filename
router.get('/image/:filename', async (req, res, next) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(UPLOADS_DIR, filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            throw new ApiError('Image not found', 404);
        }

        // Determine content type
        const ext = path.extname(filename).toLowerCase();
        const contentTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
        };

        res.contentType(contentTypes[ext] || 'application/octet-stream');
        res.sendFile(filePath);
    } catch (error) {
        next(error);
    }
});

export default router;
