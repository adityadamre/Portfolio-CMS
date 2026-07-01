import express from 'express';
import {
  login,
  logout,
  protect,
  updatePassword,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);

router.patch('/update-password', protect, updatePassword);

export default router;
