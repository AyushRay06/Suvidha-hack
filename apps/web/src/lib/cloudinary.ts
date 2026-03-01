/**
 * Cloudinary Image Upload Utility
 * 
 * This utility provides client-side image upload functionality to Cloudinary.
 * It uses unsigned uploads for simplicity and security.
 */

interface CloudinaryUploadResponse {
    secure_url: string;
    public_id: string;
    [key: string]: any;
}

/**
 * Upload an image file to Cloudinary
 * @param file - The image file to upload
 * @returns Promise resolving to the Cloudinary image URL
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error(
            "Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file."
        );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        throw new Error("Image size must be less than 5MB");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "grievances"); // Organize uploads in a folder

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Upload failed");
        }

        const data: CloudinaryUploadResponse = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error instanceof Error
            ? error
            : new Error("Failed to upload image");
    }
}

/**
 * Get a transformed Cloudinary URL with specific dimensions
 * @param url - Original Cloudinary URL
 * @param width - Desired width
 * @param height - Desired height
 * @returns Transformed URL
 */
export function getTransformedImageUrl(
    url: string,
    width: number,
    height: number
): string {
    if (!url || !url.includes("cloudinary.com")) {
        return url;
    }

    // Insert transformation parameters into the URL
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;

    return `${parts[0]}/upload/w_${width},h_${height},c_fill/${parts[1]}`;
}
