import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import {
  getEducation,
  updateEducation,
} from '../controllers/educationController.js';
import { getSkills, updateSkills } from '../controllers/skillController.js';
import { getExperience } from '../controllers/experienceController.js';
import { getProjects } from '../controllers/projectController.js';
import { getBlogs } from '../controllers/blogController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

router.use(protect);

// Profile Routes
router.route('/profile').get(getProfile).put(updateProfile);

// Education Routes
router.route('/education').get(getEducation).put(updateEducation);

// Skills Routes
router.route('/skills').get(getSkills).put(updateSkills);

// Experience Routes
router.route('/experience').get(getExperience);

// Projects Routes
router.route('/projects').get(getProjects);

// Blogs Routes
router.route('/blogs').get(getBlogs);

export default router;
