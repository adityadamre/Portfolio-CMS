import express from 'express';
import { getAllBlogs, getBlog } from '../controllers/blogController.js';

const router = express.Router();

router.route('/').get(getAllBlogs);

router.route('/:slug').get(getBlog);

export default router;
