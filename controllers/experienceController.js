import Experience from '../models/experienceModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import {
  uploadImage,
  uploadImages,
  deleteImages,
  syncImageArray,
  extractPublicIds,
} from '../services/cloudinaryService.js';

const parseJSONLenient = (str) => {
  if (typeof str !== 'string') return str;
  return JSON.parse(str.replace(/,(\s*[}\]])/g, '$1'));
};

export const getExperience = catchAsync(async (req, res, next) => {
  const experiences = await Experience.find().sort('-startDate');

  res.status(200).json({
    status: 'success',
    results: experiences.length,
    data: {
      experiences,
    },
  });
});

export const createExperience = catchAsync(async (req, res, next) => {
  for (const field of [
    'description',
    'skills',
    'logo',
    'attachments',
    'logoMeta',
    'attachmentsMeta',
  ]) {
    if (req.body[field]) {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = parseJSONLenient(req.body[field]);
        } catch (e) {
          return next(
            new AppError(`Invalid JSON format for field: ${field}`, 400),
          );
        }
      } else if (Array.isArray(req.body[field])) {
        if (
          [
            'description',
            'attachments',
            'logo',
            'logoMeta',
            'attachmentsMeta',
          ].includes(field)
        ) {
          try {
            req.body[field] = req.body[field]
              .filter((item) => typeof item !== 'string' || item.trim() !== '')
              .map((item) => (typeof item === 'string' ? parseJSONLenient(item) : item))
              .flat();
          } catch (e) {
            return next(
              new AppError(
                `Invalid JSON format in array for field: ${field}`,
                400,
              ),
            );
          }
        }
      }
    }
  }

  const newlyUploadedPublicIds = [];

  try {
    if (req.files?.logo) {
      const uploadedLogo = await uploadImage(
        req.files.logo[0],
        'portfolio/experience',
      );
      if (uploadedLogo?.publicId)
        newlyUploadedPublicIds.push(uploadedLogo.publicId);

      const logoMeta = req.body.logoMeta || {};
      req.body.logo = {
        ...uploadedLogo,
        alt: logoMeta.alt || '',
        caption: logoMeta.caption || '',
      };
    }

    if (req.files?.attachments) {
      const uploadedAttachments = await uploadImages(
        req.files.attachments,
        'portfolio/experience',
      );
      const attachmentsMeta =
        Array.isArray(req.body.attachmentsMeta) &&
        req.body.attachmentsMeta.length > 0
          ? req.body.attachmentsMeta
          : Array.isArray(req.body.attachments)
            ? req.body.attachments
            : [];

      req.body.attachments = uploadedAttachments.map((img, i) => {
        if (img.publicId) newlyUploadedPublicIds.push(img.publicId);
        const meta = attachmentsMeta[i] || {};
        return {
          ...img,
          alt: meta.alt || '',
          caption: meta.caption || '',
        };
      });
    }

    const experience = await Experience.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { experience },
    });
  } catch (error) {
    if (newlyUploadedPublicIds.length > 0) {
      await deleteImages(newlyUploadedPublicIds);
    }
    return next(error);
  }
});

export const updateExperience = catchAsync(async (req, res, next) => {
  const existingExp = await Experience.findById(req.params.id);
  if (!existingExp) {
    return next(new AppError('No experience found with that ID', 404));
  }

  for (const field of [
    'description',
    'skills',
    'logo',
    'attachments',
    'logoMeta',
    'attachmentsMeta',
  ]) {
    if (req.body[field]) {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = parseJSONLenient(req.body[field]);
        } catch (e) {
          return next(
            new AppError(`Invalid JSON format for field: ${field}`, 400),
          );
        }
      } else if (Array.isArray(req.body[field])) {
        if (
          [
            'description',
            'attachments',
            'logo',
            'logoMeta',
            'attachmentsMeta',
          ].includes(field)
        ) {
          try {
            req.body[field] = req.body[field]
              .filter((item) => typeof item !== 'string' || item.trim() !== '')
              .map((item) => (typeof item === 'string' ? parseJSONLenient(item) : item))
              .flat();
          } catch (e) {
            return next(
              new AppError(
                `Invalid JSON format in array for field: ${field}`,
                400,
              ),
            );
          }
        }
      }
    }
  }

  const imagesToDelete = [];
  const newlyUploadedPublicIds = [];

  try {
    // 1. Sync Logo
    if (req.files?.logo) {
      if (existingExp.logo?.publicId)
        imagesToDelete.push(existingExp.logo.publicId);
      const uploadedLogo = await uploadImage(
        req.files.logo[0],
        'portfolio/experience',
      );
      if (uploadedLogo?.publicId)
        newlyUploadedPublicIds.push(uploadedLogo.publicId);

      const logoMeta = req.body.logoMeta || {};
      req.body.logo = {
        ...uploadedLogo,
        alt: logoMeta.alt || '',
        caption: logoMeta.caption || '',
      };
    } else if (req.body.logo === null || req.body.logo === 'null') {
      if (existingExp.logo?.publicId)
        imagesToDelete.push(existingExp.logo.publicId);
      req.body.logo = null;
    } else if (req.body.logo && existingExp.logo) {
      // Keep existing logo, update alt/caption if provided
      req.body.logo = { ...existingExp.logo, ...req.body.logo };
    }

    // 2. Sync Attachments
    if (req.body.attachments !== undefined || req.files?.attachments) {
      const payloadAttachments = Array.isArray(req.body.attachments)
        ? req.body.attachments
        : req.body.attachments
          ? [req.body.attachments]
          : [];
      const newFiles = req.files?.attachments || [];
      const newFilesMeta = req.body.attachmentsMeta || [];

      const syncResult = await syncImageArray(
        existingExp.attachments,
        payloadAttachments,
        newFiles,
        'portfolio/experience',
        newFilesMeta,
      );

      req.body.attachments = syncResult.finalImages;
      imagesToDelete.push(
        ...syncResult.imagesToDelete.map((img) => img.publicId),
      );
      newlyUploadedPublicIds.push(...syncResult.newlyUploadedPublicIds);
    }

    // 3. Update DB
    const experience = await Experience.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    // 4. Cloudinary Cleanup
    if (imagesToDelete.length > 0) {
      await deleteImages(imagesToDelete);
    }

    res.status(200).json({
      status: 'success',
      data: { experience },
    });
  } catch (error) {
    if (newlyUploadedPublicIds.length > 0) {
      await deleteImages(newlyUploadedPublicIds);
    }
    return next(error);
  }
});

export const deleteExperience = catchAsync(async (req, res, next) => {
  const experience = await Experience.findById(req.params.id);
  if (!experience) {
    return next(new AppError('No experience found with that ID', 404));
  }

  const publicIds = extractPublicIds(experience.toObject());

  // Clean Cloudinary FIRST to avoid orphaned media
  if (publicIds.length > 0) {
    await deleteImages(publicIds);
  }

  // Then delete document
  await experience.deleteOne();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
