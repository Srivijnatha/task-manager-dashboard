import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash2, Edit2, Check, X, AlertTriangle } from 'lucide-react';

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
];

function CategoryManager({ onCategoriesChanged }) {
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editColor, setEditColor] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      if (onCategoriesChanged) {
        onCategoriesChanged(res.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err.message);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError('');
    if (!newCatName.trim()) return;

    setLoading(true);
    const finalColor = customColor || selectedColor;

    try {
      await api.post('/categories', {
        name: newCatName.trim(),
        color: finalColor,
      });
      setNewCatName('');
      setCustomColor('');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating category.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat._id);
    setEditCatName(cat.name);
    setEditColor(cat.color);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCatName('');
    setEditColor('');
  };

  const handleSaveEdit = async (id) => {
    if (!editCatName.trim()) return;
    setError('');
    
    try {
      await api.put(`/categories/${id}`, {
        name: editCatName.trim(),
        color: editColor,
      });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category.');
    }
  };

  const handleDeleteCategory = async (id) => {
    setError('');
    if (!window.confirm('Are you sure you want to delete this category? All associated tasks will have their category removed.')) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Create New Category Form */}
      <form onSubmit={handleAddCategory} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Create New Category
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. Work, Health, Personal"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="block flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !newCatName.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-xs hover:bg-indigo-750 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Color Palette Choices */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Category Color
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setSelectedColor(color);
                  setCustomColor('');
                }}
                className={`h-7 w-7 rounded-full transition-transform duration-100 cursor-pointer ${
                  selectedColor === color && !customColor ? 'scale-115 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            {/* Custom hex color selector */}
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3 dark:border-slate-800">
              <span className="text-xs text-slate-500">Custom:</span>
              <input
                type="color"
                value={customColor || selectedColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setSelectedColor('');
                }}
                className="h-7 w-7 rounded-md cursor-pointer border-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Category List */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Existing Categories ({categories.length})
        </label>
        {categories.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
            No custom categories created yet.
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950/50"
              >
                {editingId === cat._id ? (
                  // Edit view
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      className="block flex-1 rounded-lg border border-slate-200 bg-white py-1 px-2.5 text-xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-6 w-6 cursor-pointer border-none bg-transparent"
                    />
                    <button
                      onClick={() => handleSaveEdit(cat._id)}
                      className="rounded-md bg-white p-1 hover:bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-md bg-white p-1 hover:bg-rose-50 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  // Display view
                  <>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat._id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryManager;
