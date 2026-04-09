const express = require('express');
const router = express.Router();
const { uploadDocument } = require('../middleware/upload'); 
const {
  uploadDocument: uploadDocumentController,
  getUserDocuments,
  getDocumentById,
  updateSelectedPages,
  deleteDocument
} = require('../controllers/documentController');
const verifyToken = require('../middleware/auth');

// All routes are protected
router.post('/upload', 
  verifyToken, 
  uploadDocument.single('document'), 
  uploadDocumentController
);

router.get('/', verifyToken, getUserDocuments);
router.get('/:id', verifyToken, getDocumentById);
router.patch('/:id/pages', verifyToken, updateSelectedPages);
router.delete('/:id', verifyToken, deleteDocument);

module.exports = router;