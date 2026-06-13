import { recommendPriority, generateProductivityInsights, generateDashboardSummary, generateChatResponse } from '../config/ai.js';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Recommend priority based on task contents
// @route   POST /api/ai/prioritize
// @access  Private
export const getPriorityRecommendation = async (req, res) => {
  const { title, description, dueDate, categoryName } = req.body;
  
  if (!title) {
    return res.status(400).json({ message: 'Title is required to analyze priority' });
  }

  try {
    const recommended = await recommendPriority(title, description, dueDate, categoryName);
    res.json({ priority: recommended });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate personalized productivity insights from user history
// @route   GET /api/ai/insights
// @access  Private
export const getInsights = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const logs = await ActivityLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
    
    const insights = await generateProductivityInsights(tasks, logs);
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate dynamic workspace textual overview
// @route   GET /api/ai/summary
// @access  Private
export const getDashboardSummary = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const summary = await generateDashboardSummary(tasks);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Chat with AI Productivity Coach
// @route   POST /api/ai/chat
// @access  Private
export const getAiChatResponse = async (req, res) => {
  const { message, history } = req.body;
  
  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    const tasks = await Task.find({ user: req.user._id });
    const reply = await generateChatResponse(message, history || [], tasks);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

