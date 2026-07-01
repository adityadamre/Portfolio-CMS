import Experience from '../models/experienceModel.js';
import catchAsync from '../utils/catchAsync.js';

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
