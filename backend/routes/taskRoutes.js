import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  uploadAttachment,
  deleteAttachment,
  exportTasksToPDF,
  exportTasksToExcel,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

// Export routes must precede dynamic task ID routes
router.get('/export/pdf', protect, exportTasksToPDF);
router.get('/export/excel', protect, exportTasksToExcel);

router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.post('/:id/attachments', protect, upload.single('attachment'), uploadAttachment);
router.delete('/:id/attachments/:attachmentId', protect, deleteAttachment);

export default router;
