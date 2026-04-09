const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  createAdmin, 
  deleteUser,
  updateUserRole,
  getStudentsWithOrders,    
  getStudentById,           
  exportStudentsData        
} = require('../controllers/adminController');
const verifyToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// Existing routes
router.get('/users', verifyToken, isAdmin, getAllUsers);
router.post('/create-admin', verifyToken, isAdmin, createAdmin);
router.delete('/users/:id', verifyToken, isAdmin, deleteUser);
router.put('/users/:id/role', verifyToken, isAdmin, updateUserRole);

// New student dashboard routes
router.get('/students-with-orders', verifyToken, isAdmin, getStudentsWithOrders);
router.get('/students/:userId', verifyToken, isAdmin, getStudentById);
router.get('/students/export/csv', verifyToken, isAdmin, exportStudentsData);

module.exports = router;