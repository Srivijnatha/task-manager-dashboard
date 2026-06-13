import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import TaskModal from '../components/TaskModal';
import CategoryManager from '../components/CategoryManager';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Grid,
  List,
  FileText,
  Sheet,
  FolderOpen,
  Calendar,
  Clock,
  Paperclip,
  CheckCircle2,
  Edit2,
  Trash2,
  Settings,
  AlertCircle
} from 'lucide-react';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Sorting state
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Layout View State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Export loaders
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Build query string
      const params = new URLSearchParams();
      if (search.trim()) params.append('q', search.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (dateFilter) params.append('dueDate', dateFilter);
      if (sortBy) params.append('sort', sortBy);
      if (sortOrder) params.append('order', sortOrder);

      const res = await api.get(`/tasks?${params.toString()}`);
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Re-fetch tasks when filters or sorting change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 300); // Debounce search changes slightly
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter, categoryFilter, dateFilter, sortBy, sortOrder]);

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err.message);
    }
  };

  // Safe file export triggers using Axios Blobs
  const handleExportPDF = async () => {
    try {
      setPdfLoading(true);
      const res = await api.get('/tasks/export/pdf', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF Export failed:', err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExcelLoading(true);
      const res = await api.get('/tasks/export/excel', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks_spreadsheet_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Excel Export failed:', err.message);
    } finally {
      setExcelLoading(false);
    }
  };

  const handleTaskSaved = () => {
    fetchTasks();
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const getPriorityBadgeColor = (prio) => {
    switch (prio) {
      case 'High':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/10';
      case 'Medium':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/10';
      case 'Low':
      default:
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Task Center
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create, search, filter, and export tasks in list or grid layout formats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Categories Manager Trigger */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-850 cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            Categories
          </button>
          
          <button
            onClick={() => {
              setSelectedTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-sm font-bold text-white shadow-md hover:bg-indigo-750 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by title, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-all"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-all"
          >
            <option value="">All Categories</option>
            <option value="null">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting and Exports Bar */}
        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 dark:border-slate-850 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Field */}
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 py-1 px-2.5 text-xs font-semibold focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Last Updated</option>
              </select>
              <button
                onClick={toggleSortOrder}
                className="rounded-lg border border-slate-200 bg-slate-50 p-1 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 cursor-pointer"
                title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
              >
                <span className="text-[10px] font-bold uppercase">{sortOrder}</span>
              </button>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 py-1 px-2.5 text-xs font-semibold focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Any Due Date</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="week">Due This Week</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Layout Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 cursor-pointer ${viewMode === 'grid' ? 'bg-white text-indigo-600 dark:bg-slate-850 dark:text-indigo-400 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-1.5 cursor-pointer ${viewMode === 'list' ? 'bg-white text-indigo-600 dark:bg-slate-850 dark:text-indigo-400 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Exports */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                disabled={pdfLoading || tasks.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
                title="Export list to PDF document"
              >
                <FileText className="h-3.5 w-3.5 text-rose-500" />
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                disabled={excelLoading || tasks.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
                title="Export list to Excel spreadsheet"
              >
                <Sheet className="h-3.5 w-3.5 text-emerald-500" />
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Content Listing */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <FolderOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No tasks found</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {search || statusFilter || priorityFilter || categoryFilter || dateFilter
              ? 'Try modifying your search query or filter tags to show records.'
              : 'Start organizing your operations by creating your first task.'}
          </p>
          {!search && !statusFilter && !priorityFilter && !categoryFilter && !dateFilter && (
            <button
              onClick={() => {
                setSelectedTask(null);
                setIsTaskModalOpen(true);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 py-2 px-4 text-sm font-bold text-white hover:bg-indigo-750 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add First Task
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md dark:border-slate-800 dark:bg-slate-900 transition-all duration-200"
            >
              <div>
                {/* Badges details */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-lg px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getPriorityBadgeColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  
                  {task.category && (
                    <span
                      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[9px] font-semibold"
                      style={{
                        borderColor: `${task.category.color}30`,
                        color: task.category.color,
                        backgroundColor: `${task.category.color}08`,
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.category.color }} />
                      {task.category.name}
                    </span>
                  )}

                  <span className={`rounded-lg px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    task.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : task.status === 'in-progress'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-450'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                  }`}>
                    {task.status}
                  </span>
                </div>

                {/* Title */}
                <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {task.title}
                </h4>

                {/* Description */}
                {task.description && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Card Footer info */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                {/* Date indicator */}
                <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${
                  isOverdue(task.dueDate, task.status)
                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                    : task.status === 'completed'
                    ? 'text-emerald-600'
                    : 'text-slate-400'
                }`}>
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : isOverdue(task.dueDate, task.status) ? (
                    <Clock className="h-3.5 w-3.5 animate-pulse-slow" />
                  ) : (
                    <Calendar className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {task.status === 'completed'
                      ? 'Done'
                      : isOverdue(task.dueDate, task.status)
                      ? 'Overdue'
                      : new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Quick actions & attachments */}
                <div className="flex items-center gap-2">
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="flex items-center gap-0.5 text-[10px] text-slate-400" title={`${task.attachments.length} files attached`}>
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>{task.attachments.length}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="rounded-lg p-1 text-slate-450 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="rounded-lg p-1 text-slate-450 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
              {tasks.map((task) => (
                <tr
                  key={task._id}
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-xs font-medium text-slate-700 dark:text-slate-350"
                >
                  <td className="py-3.5 px-4 min-w-[200px]">
                    <div className="flex items-start gap-2">
                      {task.attachments && task.attachments.length > 0 && (
                        <Paperclip className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" title={`${task.attachments.length} files attached`} />
                      )}
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{task.title}</p>
                        {task.description && (
                          <p className="text-slate-400 truncate max-w-[250px]">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block rounded-lg px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px] ${
                      task.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : task.status === 'in-progress'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-450'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block rounded-lg px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px] ${getPriorityBadgeColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {task.category ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 font-semibold text-[9px]"
                        style={{
                          borderColor: `${task.category.color}30`,
                          color: task.category.color,
                          backgroundColor: `${task.category.color}08`,
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.category.color }} />
                        {task.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={isOverdue(task.dueDate, task.status) ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Dialog */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        categories={categories}
        onTaskSaved={handleTaskSaved}
      />

      {/* Category Manager Dialog Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Category Settings</h3>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  fetchCategories(); // Refetch to sync if any color/name changed
                  fetchTasks(); // Refetch tasks to load new category references
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="mt-4">
              <CategoryManager
                onCategoriesChanged={() => {
                  fetchCategories();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
