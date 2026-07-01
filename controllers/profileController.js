// import mongoose from 'mongoose';
import Profile from '../models/profileModel.js';
import catchAsync from '../utils/catchAsync.js';

export const getProfile = catchAsync(async (req, res, next) => {
  const profile = await Profile.findOne().lean();

  res.status(200).json({
    status: 'success',
    data: {
      profile,
    },
  });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  // Upsert the single profile document
  const profile = await Profile.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      profile,
    },
  });
});
