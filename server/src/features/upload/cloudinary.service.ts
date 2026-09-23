import { UploadApiResponse } from "cloudinary";
import cloudinary from "./cloudinary";
import { ApiError } from "../../shared/utils/ApiError";


type MulterFile = Express.Multer.File;

export interface UploadedImage {
    url: string;
    publicId: string; // keep this in your DB, you need it to delete the image later
    width: number;
    height: number;
    format: string;
    bytes: number;
}

export interface UploadOptions {
    folder?: string;
}

const DEFAULT_FOLDER = "uploads";

const uploadBuffer = (buffer: Buffer, folder: string) =>
    new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
                if (error || !result) {
                    return reject(error ?? new Error("Empty response from Cloudinary"));
                }
                resolve(result);
            }
        );

        stream.end(buffer);
    });

const toUploadedImage = (r: UploadApiResponse): UploadedImage => ({
    url: r.secure_url,
    publicId: r.public_id,
    width: r.width,
    height: r.height,
    format: r.format,
    bytes: r.bytes,
});

// Cloudinary sometimes rejects with a plain object ({ message, http_code }) instead of an Error
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "object" && error !== null && "message" in error) {
        return String((error as { message: unknown }).message);
    }
    return String(error);
};

// Always logs the real error on the server.
// The client only sees the details outside production, so you never leak internals.
const buildUploadError = (error: unknown, fallback: string) => {
    console.error("Cloudinary upload error:", error);

    const message =
        process.env.NODE_ENV === "production" ? fallback : `${fallback}: ${getErrorMessage(error)}`;

    return new ApiError(502, message);
};

/**
 * Upload one image  -> returns one UploadedImage
 * Upload an array   -> returns UploadedImage[] (same order as the input)
 *
 * If any image in an array fails, the ones that already succeeded are deleted
 * from Cloudinary and an error is thrown, so you never end up with orphans.
 */
export function uploadToCloudinary(file: MulterFile, options?: UploadOptions): Promise<UploadedImage>;
export function uploadToCloudinary(files: MulterFile[], options?: UploadOptions): Promise<UploadedImage[]>;
export async function uploadToCloudinary(
    input: MulterFile | MulterFile[],
    options: UploadOptions = {}
): Promise<UploadedImage | UploadedImage[]> {
    const folder = options.folder ?? DEFAULT_FOLDER;

    // Single image
    if (!Array.isArray(input)) {
        try {
            return toUploadedImage(await uploadBuffer(input.buffer, folder));
        } catch (error) {
            throw buildUploadError(error, "Image upload failed");
        }
    }

    // Multiple images
    if (input.length === 0) {
        throw new ApiError(400, "No images provided");
    }

    const results = await Promise.allSettled(input.map((file) => uploadBuffer(file.buffer, folder)));

    const succeeded = results
        .filter((r): r is PromiseFulfilledResult<UploadApiResponse> => r.status === "fulfilled")
        .map((r) => r.value);

    if (succeeded.length !== input.length) {
        const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

        failures.forEach((f) => console.error("Cloudinary upload error:", f.reason));

        await deleteFromCloudinary(succeeded.map((r) => r.public_id)).catch(() => undefined);

        throw buildUploadError(failures[0].reason, "Failed to upload one or more images");
    }

    return succeeded.map(toUploadedImage);
}

/** Delete one image (publicId) or many (publicId[]). */
export const deleteFromCloudinary = async (publicIds: string | string[]): Promise<void> => {
    const ids = Array.isArray(publicIds) ? publicIds : [publicIds];

    if (ids.length === 0) return;

    await cloudinary.api.delete_resources(ids);
};