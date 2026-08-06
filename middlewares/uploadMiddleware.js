import multer from 'multer';
import AppError from '../utils/appError.js';

// Keep files in memory as Buffers (required for Cloudinary stream uploads)
const multerStorage = multer.memoryStorage();

// Validate that uploaded files are actually images
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Configure the generic Multer upload instance
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum file size
  },
});

export default upload;
