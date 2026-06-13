import Category from '../models/Category.js';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Get all categories for the logged-in user
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user._id });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res) => {
  const { name, color } = req.body;

  if (!name || !color) {
    return res.status(400).json({ message: 'Category name and color are required' });
  }

  try {
    // Check if name already exists for this user
    const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, user: req.user._id });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name,
      color,
      user: req.user._id,
    });

    await ActivityLog.create({
      user: req.user._id,
      actionType: 'category-create',
      details: `Created custom category: "${name}"`,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res) => {
  const { name, color } = req.body;

  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user._id });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.name = name || category.name;
    category.color = color || category.color;

    const updatedCategory = await category.save();

    await ActivityLog.create({
      user: req.user._id,
      actionType: 'task-update', // general update category logs
      details: `Updated category details: "${updatedCategory.name}"`,
    });

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user._id });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Set all tasks using this category to null category
    await Task.updateMany({ category: category._id, user: req.user._id }, { category: null });

    const name = category.name;
    await category.deleteOne();

    await ActivityLog.create({
      user: req.user._id,
      actionType: 'category-delete',
      details: `Deleted category: "${name}"`,
    });

    res.json({ message: 'Category deleted and tasks dissociated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
