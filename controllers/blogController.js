import Blog from '../models/blogModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import {
  deleteImages,
  syncContentBlocks,
  extractPublicIds,
} from '../services/cloudinaryService.js';

const parseJSONLenient = (str) => {
  if (typeof str !== 'string') return str;
  return JSON.parse(str.replace(/,(\s*[}\]])/g, '$1'));
};

export const getAllBlogs = catchAsync(async (req, res, next) => {
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

export const createBlog = catchAsync(async (req, res, next) => {
  for (const field of ['tags', 'content', 'contentImagesMeta']) {
    if (req.body[field]) {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = parseJSONLenient(req.body[field]);
        } catch (e) {
          return next(new AppError(`Invalid JSON format for field: ${field}`, 400));
        }
      } else if (Array.isArray(req.body[field])) {
        if (['content', 'contentImagesMeta'].includes(field)) {
          try {
            req.body[field] = req.body[field]
              .filter(item => typeof item !== 'string' || item.trim() !== '')
              .map(item => (typeof item === 'string' ? parseJSONLenient(item) : item))
              .flat();
          } catch (e) {
            return next(new AppError(`Invalid JSON format in array for field: ${field}`, 400));
          }
        }
      }
    }
  }

  const newlyUploadedPublicIds = [];

  try {
    if (req.body.content && req.files) {
      const newFiles = Array.isArray(req.files) ? req.files : [];
      const contentImagesMeta = req.body.contentImagesMeta || [];
      const syncResult = await syncContentBlocks(
        [],
        req.body.content,
        newFiles,
        'portfolio/blogs',
        contentImagesMeta
      );
      req.body.content = syncResult.finalContent;
      newlyUploadedPublicIds.push(...syncResult.newlyUploadedPublicIds);
    }

    const blog = await Blog.create(req.body);

    res.status(201).json({ status: 'success', data: { blog } });
  } catch (error) {
    if (newlyUploadedPublicIds.length > 0) {
      await deleteImages(newlyUploadedPublicIds);
    }
    return next(error);
  }
});

export const updateBlog = catchAsync(async (req, res, next) => {
  const existingBlog = await Blog.findById(req.params.id);
  if (!existingBlog) {
    return next(new AppError('No blog found with that ID', 404));
  }

  for (const field of ['tags', 'content', 'contentImagesMeta']) {
    if (req.body[field]) {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = parseJSONLenient(req.body[field]);
        } catch (e) {
          return next(new AppError(`Invalid JSON format for field: ${field}`, 400));
        }
      } else if (Array.isArray(req.body[field])) {
        if (['content', 'contentImagesMeta'].includes(field)) {
          try {
            req.body[field] = req.body[field]
              .filter(item => typeof item !== 'string' || item.trim() !== '')
              .map(item => (typeof item === 'string' ? parseJSONLenient(item) : item))
              .flat();
          } catch (e) {
            return next(new AppError(`Invalid JSON format in array for field: ${field}`, 400));
          }
        }
      }
    }
  }

  let imagesToDelete = [];
  const newlyUploadedPublicIds = [];

  try {
    // Content
    if (req.body.content !== undefined || req.files) {
      const payloadContent = Array.isArray(req.body.content) ? req.body.content : [];
      const newFiles = Array.isArray(req.files) ? req.files : [];
      const contentImagesMeta = req.body.contentImagesMeta || [];
      const syncResult = await syncContentBlocks(
        existingBlog.content,
        payloadContent,
        newFiles,
        'portfolio/blogs',
        contentImagesMeta
      );
      req.body.content = syncResult.finalContent;
      imagesToDelete = syncResult.imagesToDelete;
      newlyUploadedPublicIds.push(...syncResult.newlyUploadedPublicIds);
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (imagesToDelete.length > 0) {
      await deleteImages(imagesToDelete);
    }

    res.status(200).json({ status: 'success', data: { blog } });
  } catch (error) {
    if (newlyUploadedPublicIds.length > 0) {
      await deleteImages(newlyUploadedPublicIds);
    }
    return next(error);
  }
});

export const deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return next(new AppError('No blog found with that ID', 404));

  const publicIds = extractPublicIds(blog.toObject());
  
  if (publicIds.length > 0) {
    await deleteImages(publicIds);
  }
  
  await blog.deleteOne();

  res.status(204).json({ status: 'success', data: null });
});
