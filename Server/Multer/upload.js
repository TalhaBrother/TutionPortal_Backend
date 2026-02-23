import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../Cloudinary/config.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "users",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

export default upload;
