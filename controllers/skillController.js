import mongoose from 'mongoose';
import Skill from '../models/skillModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getSkills = catchAsync(async (req, res, next) => {
  const skills = await Skill.find().sort({ order: 1 });

  res.status(200).json({
    status: 'success',
    results: skills.length,
    data: {
      skills,
    },
  });
});

export const updateSkills = catchAsync(async (req, res, next) => {
  if (!Array.isArray(req.body)) {
    return next(new AppError('Request body must be an array.', 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Atomically replace the entire collection
    await Skill.deleteMany({}, { session });

    if (req.body && req.body.length > 0) {
      await Skill.insertMany(req.body, { session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  // Fetch the newly updated collection sorted by order
  const skills = await Skill.find().sort('order');

  res.status(200).json({
    status: 'success',
    results: skills.length,
    data: {
      skills,
    },
  });
});
