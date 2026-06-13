import Task from '../models/Task.js';
import Category from '../models/Category.js';
import Attachment from '../models/Attachment.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

// Helper to log activities
const logActivity = async (userId, actionType, details) => {
  try {
    await ActivityLog.create({ user: userId, actionType, details });
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
};

// Helper to create notifications
const createNotification = async (userId, message, type, taskId = null) => {
  try {
    await Notification.create({ user: userId, message, type, task: taskId });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

// @desc    Get all tasks with filters, search, and sorting
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const { q, status, priority, category, dueDate, sort, order } = req.query;
    
    // Build query
    const query = { user: req.user._id };

    // Search query (Title or Description)
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    // Filters
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (category) {
      query.category = category === 'null' ? null : category;
    }
    if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate === 'overdue') {
        query.dueDate = { $lt: new Date() };
        query.status = { $ne: 'completed' };
      } else if (dueDate === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        query.dueDate = { $gte: today, $lt: tomorrow };
      } else if (dueDate === 'week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        query.dueDate = { $gte: today, $lte: nextWeek };
      }
    }

    // Sorting fields: dueDate, priority, createdAt, updatedAt
    // We execute mongoose query and then perform priority sorting in memory,
    // or standard sorting on database fields.
    let tasksQuery = Task.find(query).populate('category').populate('attachments');
    
    let dbSortField = 'createdAt';
    let dbSortOrder = -1;

    if (sort && sort !== 'priority') {
      dbSortField = sort;
      dbSortOrder = order === 'asc' ? 1 : -1;
      tasksQuery = tasksQuery.sort({ [dbSortField]: dbSortOrder });
    } else if (!sort) {
      tasksQuery = tasksQuery.sort({ createdAt: -1 });
    }

    let tasks = await tasksQuery;

    // Handle priority sorting in JS (since priority is enum Low, Medium, High)
    if (sort === 'priority') {
      const priorityWeights = { Low: 1, Medium: 2, High: 3 };
      tasks.sort((a, b) => {
        const weightA = priorityWeights[a.priority] || 0;
        const weightB = priorityWeights[b.priority] || 0;
        return order === 'asc' ? weightA - weightB : weightB - weightA;
      });
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get task details by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id })
      .populate('category')
      .populate('attachments');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
  const { title, description, priority, status, dueDate, category } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({ message: 'Title and due date are required' });
  }

  try {
    const task = await Task.create({
      title,
      description,
      priority: priority || 'Medium',
      status: status || 'pending',
      dueDate,
      category: category || null,
      user: req.user._id,
    });

    const populatedTask = await Task.findById(task._id).populate('category');

    await logActivity(req.user._id, 'task-create', `Created task: "${title}"`);
    await createNotification(req.user._id, `Task created: "${title}"`, 'creation', task._id);

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an existing task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  const { title, description, priority, status, dueDate, category } = req.body;

  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const oldStatus = task.status;
    const oldTitle = task.title;

    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.priority = priority || task.priority;
    task.status = status || task.status;
    task.dueDate = dueDate || task.dueDate;
    task.category = category !== undefined ? (category === 'null' ? null : category) : task.category;

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id).populate('category').populate('attachments');

    // Handle activity logs based on what changed
    if (oldStatus !== updatedTask.status) {
      await logActivity(
        req.user._id,
        'status-change',
        `Changed task "${updatedTask.title}" status from "${oldStatus}" to "${updatedTask.status}"`
      );
      await createNotification(
        req.user._id,
        `Status updated: "${updatedTask.title}" is now "${updatedTask.status}"`,
        'update',
        updatedTask._id
      );
    } else {
      await logActivity(req.user._id, 'task-update', `Updated task: "${updatedTask.title}"`);
    }

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id }).populate('attachments');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Clean up physical attachments
    for (const attachment of task.attachments) {
      const filePath = path.resolve(attachment.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await Attachment.deleteOne({ _id: attachment._id });
    }

    const title = task.title;
    await task.deleteOne();

    await logActivity(req.user._id, 'task-delete', `Deleted task: "${title}"`);
    await createNotification(req.user._id, `Deleted task: "${title}"`, 'deletion');

    res.json({ message: 'Task and associated attachments deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload attachment for a task
// @route   POST /api/tasks/:id/attachments
// @access  Private
export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      // Remove uploaded file if task not found
      const filePath = path.resolve(req.file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(404).json({ message: 'Task not found' });
    }

    const attachment = await Attachment.create({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      user: req.user._id,
      task: task._id,
    });

    task.attachments.push(attachment._id);
    await task.save();

    await logActivity(req.user._id, 'attachment-upload', `Uploaded file "${attachment.originalname}" for task "${task.title}"`);
    await createNotification(req.user._id, `Attached file "${attachment.originalname}" to task`, 'update', task._id);

    const populatedTask = await Task.findById(task._id).populate('category').populate('attachments');
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete attachment from a task
// @route   DELETE /api/tasks/:id/attachments/:attachmentId
// @access  Private
export const deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const attachment = await Attachment.findOne({ _id: req.params.attachmentId, user: req.user._id });
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Delete physical file
    const filePath = path.resolve(attachment.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove reference from task
    task.attachments = task.attachments.filter(
      (attId) => attId.toString() !== attachment._id.toString()
    );
    await task.save();

    // Delete database document
    await attachment.deleteOne();

    await logActivity(req.user._id, 'attachment-delete', `Deleted attachment "${attachment.originalname}" from task "${task.title}"`);

    const populatedTask = await Task.findById(task._id).populate('category').populate('attachments');
    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export tasks to PDF
// @route   GET /api/tasks/export/pdf
// @access  Private
export const exportTasksToPDF = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).populate('category');

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks_export.pdf');

    doc.pipe(res);

    // Title Section
    doc.fontSize(22).fillColor('#1e293b').text('Tasks Report', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Dynamic stats
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    
    doc.fontSize(12).fillColor('#1e293b').text(`Summary statistics:`, { underline: true });
    doc.fontSize(10).text(`Total Tasks: ${total}`);
    doc.text(`Completed Tasks: ${completed}`);
    doc.text(`Pending Tasks: ${pending}`);
    doc.moveDown(2);

    // Tasks list
    doc.fontSize(14).fillColor('#1e293b').text('Task Details', { underline: true });
    doc.moveDown(1);

    if (tasks.length === 0) {
      doc.fontSize(10).fillColor('#64748b').text('No tasks found to export.');
    } else {
      tasks.forEach((task, index) => {
        doc.fontSize(11).fillColor('#2563eb').text(`${index + 1}. ${task.title}`);
        
        doc.fontSize(9).fillColor('#334155');
        if (task.description) {
          doc.text(`Description: ${task.description}`);
        }
        
        const catName = task.category ? task.category.name : 'None';
        doc.text(`Priority: ${task.priority}  |  Status: ${task.status}  |  Category: ${catName}`);
        
        const formattedDate = new Date(task.dueDate).toLocaleDateString();
        doc.text(`Due Date: ${formattedDate}`);
        doc.moveDown(1.5);
      });
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export tasks to Excel
// @route   GET /api/tasks/export/excel
// @access  Private
export const exportTasksToExcel = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).populate('category');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('My Tasks');

    // Define Columns
    worksheet.columns = [
      { header: 'Title', key: 'title', width: 25 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Created Date', key: 'createdAt', width: 18 },
    ];

    // Format headers
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F46E5' } // Indigo color
    };

    // Add Rows
    tasks.forEach(task => {
      worksheet.addRow({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: new Date(task.dueDate).toLocaleDateString(),
        category: task.category ? task.category.name : 'None',
        createdAt: new Date(task.createdAt).toLocaleString(),
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'tasks_export.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
