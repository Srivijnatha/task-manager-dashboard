import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import TaskModal from './TaskModal';
import { Plus, Edit2, Trash2, Calendar, Paperclip, CheckCircle2, Clock, CircleDot } from 'lucide-react';

const COLUMNS = [
  { id: 'pending', title: 'Pending', color: 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { id: 'in-progress', title: 'In Progress', color: 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { id: 'completed', title: 'Completed', color: 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
];

function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [preselectedStatus, setPreselectedStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, categoriesRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/categories')
      ]);
      setTasks(tasksRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error fetching Kanban data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Find task
    const taskToUpdate = tasks.find((t) => t._id === taskId);
    if (!taskToUpdate || taskToUpdate.status === status) return;

    // Optimistically update status in state
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status } : t))
    );

    try {
      await api.put(`/tasks/${taskId}`, { status });
    } catch (err) {
      console.error('Failed to update task status:', err.message);
      // Revert if API call fails
      fetchData();
    }
  };

  const handleAddTaskClick = (status) => {
    setSelectedTask(null);
    setPreselectedStatus(status);
    setIsModalOpen(true);
  };

  const handleEditTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
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

  const handleTaskSaved = (savedTask) => {
    setTasks((prev) => {
      const exists = prev.find((t) => t._id === savedTask._id);
      if (exists) {
        return prev.map((t) => (t._id === savedTask._id ? savedTask : t));
      } else {
        return [savedTask, ...prev];
      }
    });
    fetchData(); // Reload to sync properly
  };

  const getPriorityBadgeColor = (prio) => {
    switch (prio) {
      case 'High':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400';
      case 'Medium':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400';
      case 'Low':
      default:
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400';
    }
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Kanban Board
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Drag and drop tasks between columns to update status instantly.
          </p>
        </div>
        <button
          onClick={() => handleAddTaskClick('pending')}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-sm font-bold text-white shadow-md hover:bg-indigo-750 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="flex flex-col rounded-3xl border border-slate-200 bg-slate-100/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 min-h-[500px]"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between rounded-2xl border-l-4 p-3 shadow-xs bg-white dark:bg-slate-900 ${col.color}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-wide">{col.title}</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddTaskClick(col.id)}
                    className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-850"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Tasks Container */}
                <div className="mt-4 flex-1 overflow-y-auto space-y-3 kanban-column-scroll max-h-[600px] pr-1">
                  {colTasks.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 dark:border-slate-800">
                      Drop tasks here
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t._id)}
                        className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md dark:border-slate-800 dark:bg-slate-900 transition-all cursor-grab active:cursor-grabbing"
                      >
                        {/* Header Details */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            {/* Priority */}
                            <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getPriorityBadgeColor(t.priority)}`}>
                              {t.priority}
                            </span>
                            
                            {/* Category */}
                            {t.category && (
                              <span
                                className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[9px] font-semibold"
                                style={{
                                  borderColor: `${t.category.color}30`,
                                  color: t.category.color,
                                  backgroundColor: `${t.category.color}08`,
                                }}
                              >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.category.color }} />
                                {t.category.name}
                              </span>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditTaskClick(t)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t._id)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                          {t.title}
                        </h4>

                        {/* Description */}
                        {t.description && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {t.description}
                          </p>
                        )}

                        {/* Footer Details */}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                          {/* Due Date Indicator */}
                          <div className={`flex items-center gap-1 text-[10px] font-medium ${
                            isOverdue(t.dueDate, t.status)
                              ? 'text-rose-600 dark:text-rose-450 font-bold'
                              : col.id === 'completed'
                              ? 'text-emerald-600'
                              : 'text-slate-400'
                          }`}>
                            {col.id === 'completed' ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Completed</span>
                              </>
                            ) : isOverdue(t.dueDate, t.status) ? (
                              <>
                                <Clock className="h-3 w-3 animate-pulse-slow" />
                                <span>Overdue</span>
                              </>
                            ) : (
                              <>
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>

                          {/* Attachments Count */}
                          {t.attachments && t.attachments.length > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] text-slate-400" title={`${t.attachments.length} files attached`}>
                              <Paperclip className="h-3 w-3" />
                              <span>{t.attachments.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        categories={categories}
        onTaskSaved={handleTaskSaved}
        preselectedStatus={preselectedStatus} // wait, the preselectedStatus will be handled inside TaskModal useEffect when task is empty. Let's make sure our task modal supports setting status when status changes!
      />
    </div>
  );
}

export default KanbanBoard;
