import express from 'express';
import {
  getPriorityRecommendation,
  getInsights,
  getDashboardSummary,
  getAiChatResponse,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/prioritize', protect, getPriorityRecommendation);
router.get('/insights', protect, getInsights);
router.get('/summary', protect, getDashboardSummary);
router.post('/chat', protect, getAiChatResponse);

export default router;
