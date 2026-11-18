import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import ApiError from '../utils/apiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsDir = path.join(__dirname, '..', 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function fileFilter(req, file, cb) {
    if (ALLOWED_MIME.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(ApiError.badRequest('Profile image must be a JPG, PNG, GIF or WEBP image.'));
    }
}

const MAX_BYTES = 2 * 1024 * 1024;

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_BYTES },
});

// Single-file upload for field `image`, translating multer errors to 400s.
export function uploadProfileImage(req, res, next) {
    upload.single('image')(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(ApiError.badRequest('Profile image must be 2 MB or smaller.'));
        }
        if (err instanceof multer.MulterError) {
            return next(ApiError.badRequest(err.message));
        }
        return next(err);
    });
}
