import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Award,
  Calendar,
  AlertTriangle,
  Lightbulb,
  Sparkles
} from 'lucide-react';

const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#3b82f6' };
const STATUS_COLORS = { pending: '#f59e0b', 'in-progress': '#3b82f6', completed: '#10b981' };

function Analytics() {
  const [tasks, setTasks] = useState([]);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching analytics tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      const res = await api.get('/ai/insights');
      setInsights(res.data.insights || []);
    } catch (err) {
      console.warn('Failed to load AI insights:', err.message);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchInsights();
    }
  }, [loading, tasks.length]);

  // Statistics Computations
  const totalCreated = tasks.length;
  const totalCompleted = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;
  
  const now = new Date();
  const overdueCount = tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now
  ).length;
  const overduePercentage = totalCreated > 0 ? Math.round((overdueCount / totalCreated) * 100) : 0;

  // 1. Status Distribution Data
  const statusData = [
    { name: 'Pending', count: tasks.filter((t) => t.status === 'pending').length, fill: STATUS_COLORS.pending },
    { name: 'In Progress', count: tasks.filter((t) => t.status === 'in-progress').length, fill: STATUS_COLORS['in-progress'] },
    { name: 'Completed', count: totalCompleted, fill: STATUS_COLORS.completed },
  ].filter((d) => d.count > 0);

  // 2. Priority Distribution Data
  const priorityData = [
    { name: 'High', value: tasks.filter((t) => t.priority === 'High').length, fill: PRIORITY_COLORS.High },
    { name: 'Medium', value: tasks.filter((t) => t.priority === 'Medium').length, fill: PRIORITY_COLORS.Medium },
    { name: 'Low', value: tasks.filter((t) => t.priority === 'Low').length, fill: PRIORITY_COLORS.Low },
  ].filter((d) => d.value > 0);

  // 3. Category Distribution Data
  const categoryCounts = {};
  tasks.forEach((task) => {
    const catName = task.category?.name || 'Uncategorized';
    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
  });
  const categoryData = Object.keys(categoryCounts).map((name) => ({
    name,
    count: categoryCounts[name],
  }));

  // 4. Task Trends Data (Creation by Month)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendCounts = {};
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
    trendCounts[label] = { label, Created: 0, Completed: 0 };
  }

  tasks.forEach((task) => {
    const createdDate = new Date(task.createdAt);
    const createdLabel = `${monthNames[createdDate.getMonth()]} ${createdDate.getFullYear().toString().substr(-2)}`;
    if (trendCounts[createdLabel]) {
      trendCounts[createdLabel].Created += 1;
    }
    
    if (task.status === 'completed' && task.updatedAt) {
      const completedDate = new Date(task.updatedAt);
      const completedLabel = `${monthNames[completedDate.getMonth()]} ${completedDate.getFullYear().toString().substr(-2)}`;
      if (trendCounts[completedLabel]) {
        trendCounts[completedLabel].Completed += 1;
      }
    }
  });

  const trendData = Object.values(trendCounts);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
          Analytics & Insights
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personalized productivity reports and AI-backed workspace recommendations.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Created Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tasks Created</span>
            <Calendar className="h-4.5 w-4.5 text-indigo-600" />
          </div>
          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalCreated}</h3>
        </div>

        {/* Completed Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tasks Completed</span>
            <Award className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalCompleted}</h3>
        </div>

        {/* Completion Rate */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion Rate</span>
            <TrendingUp className="h-4.5 w-4.5 text-indigo-600" />
          </div>
          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{completionRate}%</h3>
        </div>

        {/* Overdue Rate */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overdue Rate</span>
            <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
          </div>
          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{overduePercentage}%</h3>
        </div>
      </div>

      {/* AI Productivity Insights */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="flex items-center gap-1.5 font-heading font-bold text-slate-900 dark:text-white">
          <Lightbulb className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
          AI Productivity Insights
        </h3>
        <p className="text-xs text-slate-450">Tailored improvements generated from your task trends.</p>

        <div className="mt-6">
          {insightsLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
              <div className="h-4 w-3/4 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
              <div className="h-4 w-5/6 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-4">
              Add more tasks and activity logs to generate tailored productivity insights.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 rounded-2xl bg-indigo-50/35 p-4 border border-indigo-50/20 dark:bg-indigo-950/10 dark:border-indigo-950/20"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p className="text-xs leading-relaxed font-medium text-slate-700 dark:text-slate-300">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts Panels Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : totalCreated === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-450">No task data available to render charts. Create tasks to unlock analytics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Chart 1: Status Distribution */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-heading font-bold text-slate-800 dark:text-white mb-4">Task Status Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                  <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={50}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Priority Distribution */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-heading font-bold text-slate-800 dark:text-white mb-4">Task Priority breakdown</h4>
            <div className="h-64 flex items-center justify-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legends list */}
              <div className="w-1/2 pl-6 space-y-2.5">
                {priorityData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span>{item.name} Priority:</span>
                    <span className="text-slate-850 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 3: Category Distribution */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-heading font-bold text-slate-800 dark:text-white mb-4">Category Workload distribution</h4>
            <div className="h-64">
              {categoryData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">No categories found.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" fontSize={11} stroke="#94a3b8" width={80} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 4: Task completion trends */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-heading font-bold text-slate-800 dark:text-white mb-4">6-Month Completion Trendline</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" fontSize={11} stroke="#94a3b8" />
                  <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="Created" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCreated)" />
                  <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;
