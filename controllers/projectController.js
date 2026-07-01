import Project from '../models/projectModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getAllProjects = catchAsync(async (req, res, next) => {
  // Use projection to strictly return the required fields from MongoDB
  const projects = await Project.find()
    .select(
      'title slug thumbnail shortDescription githubUrl liveUrl techStack order',
    )
    .sort({ order: 1 });

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects,
    },
  });
});

export const getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findOne({ slug: req.params.slug });

  if (!project) {
    return next(new AppError('No project found with that slug', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      project,
    },
  });
});

// Admin

export const getProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find().sort('order');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects,
    },
  });
});
