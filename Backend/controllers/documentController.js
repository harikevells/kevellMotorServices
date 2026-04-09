const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-page-counter'); 


exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Get page count for PDF
    let totalPages = 1;
    if (req.file.mimetype === 'application/pdf') {
      // You can implement PDF page count here
      // For now, default to 1
    }

    const document = await Document.create({
      user: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      totalPages: totalPages
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};


exports.getUserDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    next(error);
  }
};


exports.getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      document
    });
  } catch (error) {
    next(error);
  }
};


exports.updateSelectedPages = async (req, res, next) => {
  try {
    const { selectedPages } = req.body;

    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { selectedPages },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Selected pages updated',
      document
    });
  } catch (error) {
    next(error);
  }
};


exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from uploads
    const filePath = path.join(__dirname, '..', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};