import Blog from '../models/blogModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getAllBlogs = catchAsync(async (req, res, next) => {
  // Use projection to strictly return the required fields from MongoDB
  const blogs = await Blog.find()
    .select('title excerpt slug publishedAt category')
    .sort({ publishedAt: -1 });

  res.status(200).json({
    status: 'success',
    results: blogs.length,
    data: {
      blogs,
    },
  });
});

export const getBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOne({ slug: req.params.slug });

  if (!blog) {
    return next(new AppError('No blog found with that slug', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      blog,
    },
  });
});

export const getBlogs = catchAsync(async (req, res, next) => {
  const blogs = await Blog.find().sort('-publishedAt');

  res.status(200).json({
    status: 'success',
    results: blogs.length,
    data: {
      blogs,
    },
  });
});
