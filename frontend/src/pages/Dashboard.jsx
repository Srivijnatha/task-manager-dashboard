import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import TaskModal from '../components/TaskModal';
import { NavLink } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  ListTodo,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  History,
  Plus
} from 'lucide-react';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activities, setActivities] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, categoriesRes, activitiesRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/categories'),
        api.get('/activities'),
      ]);
      setTasks(tasksRes.data);
      setCategories(categoriesRes.data);
      setActivities(activitiesRes.data.slice(0, 5)); // show latest 5
    } catch (err) {
      console.error('Error fetching dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAISummary = async () => {
    try {
      setAiLoading(true);
      const res = await api.get('/ai/summary');
      setAiSummary(res.data.summary);
    } catch (err) {
      console.warn('AI summary fetch failed, using fallback:', err.message);
      setAiSummary('Failed to load summary. Try refreshing.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch AI summary only after tasks are loaded
  useEffect(() => {
    if (!loading) {
      fetchAISummary();
    }
  }, [loading, tasks.length]);

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
  const activeTasks = pendingTasks + inProgressTasks;

  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart data
  const chartData = [
    { name: 'Pending', value: pendingTasks, color: '#f59e0b' },
    { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
    { name: 'Completed', value: completedTasks, color: '#10b981' },
  ].filter((item) => item.value > 0);

  const handleTaskSaved = () => {
    fetchData();
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Stats Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Workspace Summary
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time operations, metrics, and activity indicators.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-sm font-bold text-white shadow-md hover:bg-indigo-750 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tasks */}
        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <ListTodo className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tasks</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalTasks}</h3>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-450">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{completedTasks}</h3>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active / Pending</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{activeTasks}</h3>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Overdue Items</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{overdueTasks}</h3>
          </div>
        </div>
      </div>

      {/* AI Dashboard Summary Capsule */}
      <div className="rounded-3xl border border-indigo-100 bg-indigo-50/45 p-6 dark:border-indigo-950/40 dark:bg-indigo-950/10">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-heading font-bold text-slate-900 dark:text-white">AI Assistant Workspace Insight</h4>
            <div className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-350">
              {aiLoading ? (
                <div className="flex items-center gap-2 py-1 text-xs text-slate-400">
                  <div className="h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-transparent" />
                  Generating fresh summary...
                </div>
              ) : (
                <p>{aiSummary}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Feeds grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Side: Distribution & Stats */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
          <h3 className="flex items-center gap-1.5 font-heading font-bold text-slate-900 dark:text-white">
            <TrendingUp className="h-4.5 w-4.5 text-indigo-600" />
            Task Status distribution
          </h3>
          <p className="text-xs text-slate-400">Visual mapping of overall workload state.</p>

          <div className="mt-6 flex h-48 items-center justify-center">
            {totalTasks === 0 ? (
              <span className="text-xs text-slate-400">No active tasks created yet.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Details */}
          {totalTasks > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Completion Rate</span>
                <span className="text-indigo-600 dark:text-indigo-400">{completionRate}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-600 dark:bg-indigo-450 transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Activity logs */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 font-heading font-bold text-slate-900 dark:text-white">
              <History className="h-4.5 w-4.5 text-indigo-600" />
              Recent Workspace activities
            </h3>
            <NavLink
              to="/tasks"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Manage Tasks
              <ArrowRight className="h-3 w-3" />
            </NavLink>
          </div>
          <p className="text-xs text-slate-400">Audit trail of latest system and task updates.</p>

          <div className="mt-6 space-y-4">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No recent activity logs available. Get started by creating your first task!
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act._id}
                  className="flex items-start gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0 dark:border-slate-850"
                >
                  <div className="mt-0.5 flex h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-normal">
                      {act.details}
                    </p>
                    <span className="mt-1 block text-[10px] text-slate-450">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task Dialog */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        onTaskSaved={handleTaskSaved}
      />
    </div>
  );
}

export default Dashboard;
