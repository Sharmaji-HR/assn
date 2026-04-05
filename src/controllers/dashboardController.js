const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboardService');

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary(req.user.id);

  res.status(200).json({
    success: true,
    data: summary
  });
});

const getTrends = asyncHandler(async (req, res) => {
  const trends = await dashboardService.getTrends(req.user.id);

  res.status(200).json({
    success: true,
    data: trends
  });
});

module.exports = {
  getSummary,
  getTrends
};
