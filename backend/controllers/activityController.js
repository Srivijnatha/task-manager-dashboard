import ActivityLog from '../models/ActivityLog.js';

// @desc    Get all activity logs for logged in user
// @route   GET /api/activities
// @access  Private
export const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Cap at latest 50 logs for efficiency
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
