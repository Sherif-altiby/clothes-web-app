import { RequestHandler } from "express";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { ApiError } from "../../shared/utils/ApiError";
 
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per image

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, "Only JPEG, PNG and WEBP images are allowed"));
    }
};

// Files stay in memory (req.file.buffer) and are streamed straight to Cloudinary,
// so nothing is written to disk.
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});

// Turns Multer errors (file too large, too many files, wrong field name)
// into ApiErrors so the client gets a 400 instead of a 500.
const handleMulterErrors =
    (middleware: RequestHandler): RequestHandler =>
    (req, res, next) => {
        middleware(req, res, (err?: unknown) => {
            if (err instanceof multer.MulterError) {
                return next(new ApiError(400, err.message));
            }
            next(err);
        });
    };

/** One image. Available as `req.file`. */
export const uploadSingle = (fieldName: string) => handleMulterErrors(upload.single(fieldName));

/** Many images. Available as `req.files` (array). */
export const uploadMultiple = (fieldName: string, maxCount = 10) =>
    handleMulterErrors(upload.array(fieldName, maxCount));