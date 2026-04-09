const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if not exists
const uploadDirs = ['uploads/categories', 'uploads/services', 'uploads/shops', 'uploads/documents', 'uploads/profilePictures'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Dynamic storage based on folder
const getStorage = (folder) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `uploads/${folder}`);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, folder + '-' + uniqueSuffix + ext);
    }
  });
};

// File filter - only images and PDFs
const fileFilter = (req, file, cb) => {
  // For images
  const imageTypes = /jpeg|jpg|png|gif|webp|jfif/;
  // For documents
  const documentTypes = /pdf|doc|docx|txt/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  // Check if it's an image
  if (imageTypes.test(extname) && imageTypes.test(mimetype)) {
    return cb(null, true);
  }

  // Check if it's a document
  if (documentTypes.test(extname)) {
    return cb(null, true);
  }

  cb(new Error('Only image and PDF files are allowed!'));
};

// Create upload instances
const uploadCategory = multer({
  storage: getStorage('categories'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

const uploadService = multer({
  storage: getStorage('services'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

const uploadShop = multer({
  storage: getStorage('shops'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

const uploadDocument = multer({
  storage: getStorage('documents'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|txt|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, TXT and image files are allowed!'));
    }
  }
});

const uploadProfilePicture = multer({
  storage: getStorage('profilePictures'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter
});

module.exports = {
  uploadCategory,
  uploadService,
  uploadShop,
  uploadDocument,
  uploadProfilePicture
};