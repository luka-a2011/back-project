const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
   cloudinary,
   params: {
       folder: "uploads",
       allowed_formats: ["jpg", "png", "svg", "jpeg"]
   }
});

const upload = multer({ storage });

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary delete:", result);
    } catch (error) {
        console.log("Cloudinary delete error:", error);
    }
};

module.exports = { upload, deleteFromCloudinary };
