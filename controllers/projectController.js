import Project from '../models/projectModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import {
  uploadImage,
  uploadImages,
  deleteImages,
  syncImageArray,
  syncContentBlocks,
  extractPublicIds,
} from '../services/cloudinaryService.js';

const parseJSONLenient = (str) => {
  if (typeof str !== 'string') return str;
  return JSON.parse(str.replace(/,(\s*[}\]])/g, '$1'));
};

export const getAllProjects = catchAsync(async (req, res, next) => {
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

export const createProject = catchAsync(async (req, res, next) => {
  const parseFields = [
    'techStack', 
    'content', 
    'thumbnailMeta', 
    'screenshotsMeta', 
    'contentImagesMeta'
  ];
  
  for (const field of parseFields) {
    if (req.body[field]) {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = parseJSONLenient(req.body[field]);
        } catch (e) {
          return next(new AppError(`Invalid JSON format for field: ${field}`, 400));
        }
      } else if (Array.isArray(req.body[field])) {
        if (['content', 'screenshots', 'screenshotsMeta', 'contentImagesMeta'].includes(field)) {
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
    if (req.files?.thumbnail) {
      const uploadedThumbnail = await uploadImage(req.files.thumbnail[0], 'portfolio/projects');
      if (uploadedThumbnail?.publicId) newlyUploadedPublicIds.push(uploadedThumbnail.publicId);
      
      const thumbnailMeta = req.body.thumbnailMeta || {};
      req.body.thumbnail = {
        ...uploadedThumbnail,
        alt: thumbnailMeta.alt || '',
        caption: thumbnailMeta.caption || '',
      };
    }

    if (req.files?.screenshots) {
      const uploadedScreenshots = await uploadImages(req.files.screenshots, 'portfolio/projects');
      const screenshotsMeta = Array.isArray(req.body.screenshotsMeta) && req.body.screenshotsMeta.length > 0
        ? req.body.screenshotsMeta 
        : Array.isArray(req.body.screenshots) ? req.body.screenshots : [];
      
      req.body.screenshots = uploadedScreenshots.map((img, i) => {
        if (img.publicId) newlyUploadedPublicIds.push(img.publicId);
        const meta = screenshotsMeta[i] || {};
        return {
          ...img,
          alt: meta.alt || '',
          caption: meta.caption || '',
        };
      });
    }

    if (req.body.content && req.files?.contentImages) {
      const contentImagesMeta = req.body.contentImagesMeta || [];
      const syncResult = await syncContentBlocks(
        [],
        req.body.content,
        req.files.contentImages,
        'portfolio/projects',
        contentImagesMeta
      );
      req.body.content = syncResult.finalContent;
      newlyUploadedPublicIds.push(...syncResult.newlyUploadedPublicIds);
    }

    const project = await Project.create(req.body);

    res.status(201).json({ status: 'success', data: { project } });
  } catch (error) {
    if (newlyUploadedPublicIds.length > 0) {
      await deleteImages(newlyUploadedPublicIds);
    }
    return next(error);
  }
});

export const updateProject = catchAsync(async (req, res, next) => {
  const existingProject = await Project.findById(req.params.id);
  if (!existingProject) {
    return next(new AppError('No project found with that ID', 404));
  }

  const parseFields = [
    'techStack', 
    'content', 
    'screenshots', 
    'thumbnailMeta', 
    'screenshotsMeta', 
    'contentImagesMeta'
  ];
  
  for (const field of parseFields) {
    if (req.body[field]) {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = parseJSONLenient(req.body[field]);
        } catch (e) {
          return next(new AppError(`Invalid JSON format for field: ${field}`, 400));
        }
      } else if (Array.isArray(req.body[field])) {
        if (['content', 'screenshots', 'screenshotsMeta', 'contentImagesMeta'].includes(field)) {
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

  const imagesToDelete = [];
  const newlyUploadedPublicIds = [];

  try {
    // Thumbnail
    if (req.files?.thumbnail) {
      if (existingProject.thumbnail?.publicId) {
        imagesToDelete.push(existingProject.thumbnail.publicId);
      }
      const uploadedThumbnail = await uploadImage(req.files.thumbnail[0], 'portfolio/projects');
      if (uploadedThumbnail?.publicId) newlyUploadedPublicIds.push(uploadedThumbnail.publicId);
      
      const thumbnailMeta = req.body.thumbnailMeta || {};
      req.body.thumbnail = {
        ...uploadedThumbnail,
        alt: thumbnailMeta.alt || '',
        caption: thumbnailMeta.caption || '',
      };
    } else if (req.body.thumbnail && existingProject.thumbnail) {
      req.body.thumbnail = { ...existingProject.thumbnail, ...req.body.thumbnail };
    }

    // Screenshots
    if (req.body.screenshots !== undefined || req.files?.screenshots) {
      const payloadScreenshots = Array.isArray(req.body.screenshots)
        ? req.body.screenshots
        : req.body.screenshots
          ? [req.body.screenshots]
          : [];
          
      const screenshotsMeta = req.body.screenshotsMeta || [];
      const syncResult = await syncImageArray(
        existingProject.screenshots,
        payloadScreenshots,
        req.files?.screenshots || [],
        'portfolio/projects',
        screenshotsMeta
      );
      req.body.screenshots = syncResult.finalImages;
      imagesToDelete.push(...syncResult.imagesToDelete.map((img) => img.publicId));
      newlyUploadedPublicIds.push(...syncResult.newlyUploadedPublicIds);
    }

    // Content
    if (req.body.content !== undefined || req.files?.contentImages) {
      const payloadContent = Array.isArray(req.body.content) ? req.body.content : [];
      const contentImagesMeta = req.body.contentImagesMeta || [];
      
      const syncResult = await syncContentBlocks(
        existingProject.content,
        payloadContent,
        req.files?.contentImages || [],
        'portfolio/projects',
        contentImagesMeta
      );
      req.body.content = syncResult.finalContent;
      imagesToDelete.push(...syncResult.imagesToDelete);
      newlyUploadedPublicIds.push(...syncResult.newlyUploadedPublicIds);
    }

    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (imagesToDelete.length > 0) {
      await deleteImages(imagesToDelete);
    }

    res.status(200).json({ status: 'success', data: { project } });
  } catch (error) {
    if (newlyUploadedPublicIds.length > 0) {
      await deleteImages(newlyUploadedPublicIds);
    }
    return next(error);
  }
});

export const deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('No project found with that ID', 404));

  const publicIds = extractPublicIds(project.toObject());
  
  if (publicIds.length > 0) {
    await deleteImages(publicIds);
  }
  
  await project.deleteOne();

  res.status(204).json({ status: 'success', data: null });
});
