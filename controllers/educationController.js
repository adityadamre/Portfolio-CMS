import mongoose from 'mongoose';
import Education from '../models/educationModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getEducation = catchAsync(async (req, res, next) => {
  const education = await Education.find().sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: education.length,
    data: {
      education,
    },
  });
});

export const updateEducation = catchAsync(async (req, res, next) => {
  if (!Array.isArray(req.body)) {
    return next(new AppError('Request body must be an array.', 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Atomically replace the entire collection
    await Education.deleteMany({}, { session });

    if (req.body && req.body.length > 0) {
      await Education.insertMany(req.body, { session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  // Fetch the newly updated collection
  const education = await Education.find().sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: education.length,
    data: {
      education,
    },
  });
});
