import express from 'express';
import {
  getAllProjects,
  getProject,
} from '../controllers/projectController.js';

const router = express.Router();

router.route('/').get(getAllProjects);

router.route('/:slug').get(getProject);

export default router;
