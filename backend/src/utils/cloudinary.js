import { v2 as cloudinary } from "cloudinary"
import { unlink } from "node:fs/promises"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null

    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("File is uploaded on cloudinary", response.secure_url)
        return response
    } catch (error) {
        console.error("Cloudinary upload failed:", error)
        return null
    } finally {
        try {
            await unlink(localFilePath)
        } catch (error) {
            // The temp file may already be gone; report other cleanup failures.
            if (error.code !== "ENOENT") {
                console.error("Temporary file cleanup failed:", error)
            }
        }
    }
}

const deleteOnCloudinary = async (publicId) => {
    try {
        if (!publicId) return null
        const response = await cloudinary.uploader.destroy(publicId)
        console.log("File is deleted from cloudinary", response.result)
        return response
    } catch (error) {
        console.error("Cloudinary deletion failed:", error);
        return null;
    }
}


export { uploadOnCloudinary, deleteOnCloudinary }
