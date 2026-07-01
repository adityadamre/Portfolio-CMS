import { getPortfolioData } from '../services/portfolioService.js';
import catchAsync from '../utils/catchAsync.js';

export const getPortfolio = catchAsync(async (req, res) => {
  const data = await getPortfolioData();

  res.status(200).json({
    status: 'success',
    data,
  });
});
