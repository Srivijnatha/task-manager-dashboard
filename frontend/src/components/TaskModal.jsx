import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import {
  X,
  Calendar,
  Tag,
  AlertCircle,
  Sparkles,
  Paperclip,
  Trash2,
  Download,
  FileText
} from 'lucide-react';

function TaskModal({ isOpen, onClose, task = null, categories = [], onTaskSaved, preselectedStatus = 'pending' }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  
  // Attachments in task state
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggested, setAiSuggested] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'Medium');
      setStatus(task.status || 'pending');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setCategory(task.category?._id || task.category || '');
      setAttachments(task.attachments || []);
    } else {
      // Defaults for new task
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus(preselectedStatus);
      setDueDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]); // Tomorrow default
      setCategory('');
      setAttachments([]);
    }
    setError('');
    setAiSuggested('');
  }, [task, isOpen]);

  if (!isOpen) return null;

  // AI Task Prioritization Recommendation
  const handleRecommendPriority = async () => {
    if (!title.trim()) {
      return setError('Task title is required for AI priority analysis.');
    }
    
    setError('');
    setAiLoading(true);
    setAiSuggested('');
    
    try {
      const selectedCatObj = categories.find(c => c._id === category);
      const catName = selectedCatObj ? selectedCatObj.name : 'General';
      
      const res = await api.post('/ai/prioritize', {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        categoryName: catName,
      });
      
      const recommended = res.data.priority;
      setPriority(recommended);
      setAiSuggested(`AI suggested: ${recommended}`);
    } catch (err) {
      console.warn('AI Prioritization failed:', err.message);
      setError('AI service temporary unavailable. Falling back to default values.');
    } finally {
      setAiLoading(false);
    }
  };

  // Upload attachment file (for existing tasks)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !task?._id) return;

    if (file.size > 10 * 1024 * 1024) {
      return setError('File exceeds the 10MB limit.');
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const res = await api.post(`/tasks/${task._id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Update attachments list from response
      setAttachments(res.data.attachments || []);
      if (onTaskSaved) onTaskSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!task?._id) return;
    setError('');
    
    try {
      const res = await api.delete(`/tasks/${task._id}/attachments/${attachmentId}`);
      setAttachments(res.data.attachments || []);
      if (onTaskSaved) onTaskSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete attachment.');
    }
  };

  const handleDownloadAttachment = (filepath, filename) => {
    // Simple download trigger
    window.open(filepath, '_blank');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!title.trim()) {
      return setError('Task title is required.');
    }
    if (!dueDate) {
      return setError('Task due date is required.');
    }

    setLoading(true);

    const taskPayload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate,
      category: category || null,
    };

    try {
      if (task?._id) {
        // Edit mode
        const res = await api.put(`/tasks/${task._id}`, taskPayload);
        if (onTaskSaved) onTaskSaved(res.data);
      } else {
        // Create mode
        const res = await api.post('/tasks', taskPayload);
        if (onTaskSaved) onTaskSaved(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs transition-colors">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
            {task ? 'Edit Workspace Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Task Title
            </label>
            <input
              type="text"
              required
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Description
            </label>
            <textarea
              placeholder="Provide some details about this task..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-all"
            />
          </div>

          {/* Double Column settings */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Due Date */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-all"
              >
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Double Column settings (Status / Priority) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-all"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority with AI helper */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Priority
                </label>
                <button
                  type="button"
                  onClick={handleRecommendPriority}
                  disabled={aiLoading}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-750 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  {aiLoading ? 'Analyzing...' : 'AI Recommend'}
                </button>
              </div>
              <div className="mt-1.5 flex flex-col gap-1">
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    setAiSuggested(''); // Clear prompt message when user manually overrides
                  }}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-all"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
                {aiSuggested && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-semibold mt-0.5">
                    {aiSuggested}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Task Attachments Section (Only when editing existing task) */}
          {task?._id && (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  Task Attachments ({attachments.length})
                </label>
                
                {/* Upload Button */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-750 dark:text-indigo-400 cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Attach File'}
                  </button>
                </div>
              </div>

              {/* Attachments List */}
              {attachments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
                  No files attached. Upload documents or images.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {attachments.map((att) => (
                    <div
                      key={att._id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950/30"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {att.originalname}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {Math.round(att.size / 1024)} KB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(att.path, att.originalname)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att._id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 cursor-pointer"
                          title="Delete File"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 py-2.5 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 py-2.5 px-5 text-sm font-bold text-white shadow-xs hover:bg-indigo-750 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
