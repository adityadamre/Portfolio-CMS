import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import {
  getEducation,
  updateEducation,
} from '../controllers/educationController.js';
import { getSkills, updateSkills } from '../controllers/skillController.js';
import {
  getExperience,
  createExperience,
  updateExperience,
  deleteExperience,
} from '../controllers/experienceController.js';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import {
  getBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../controllers/blogController.js';
import { protect } from '../controllers/authController.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

// Profile Routes
router.route('/profile').get(getProfile).put(updateProfile);

// Education Routes
router.route('/education').get(getEducation).put(updateEducation);

// Skills Routes
router.route('/skills').get(getSkills).put(updateSkills);

// Experience Routes
router
  .route('/experience')
  .get(getExperience)
  .post(
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'attachments', maxCount: 10 },
    ]),
    createExperience,
  );

router
  .route('/experience/:id')
  .patch(
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'attachments', maxCount: 10 },
    ]),
    updateExperience,
  )
  .delete(deleteExperience);

// Projects Routes
router
  .route('/projects')
  .get(getProjects)
  .post(
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'screenshots', maxCount: 10 },
      { name: 'contentImages', maxCount: 20 },
    ]),
    createProject,
  );

router
  .route('/projects/:id')
  .patch(
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'screenshots', maxCount: 10 },
      { name: 'contentImages', maxCount: 20 },
    ]),
    updateProject,
  )
  .delete(deleteProject);

// Blogs Routes
router
  .route('/blogs')
  .get(getBlogs)
  .post(upload.array('contentImages', 20), createBlog);

router
  .route('/blogs/:id')
  .patch(upload.array('contentImages', 20), updateBlog)
  .delete(deleteBlog);

export default router;
