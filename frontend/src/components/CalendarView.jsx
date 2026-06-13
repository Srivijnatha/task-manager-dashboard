import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../utils/api';
import TaskModal from './TaskModal';
import { Plus } from 'lucide-react';

function CalendarView() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
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
      console.error('Error fetching calendar data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEventClick = (info) => {
    const clickedTask = info.event.extendedProps.task;
    setSelectedTask(clickedTask);
    setIsModalOpen(true);
  };

  const handleDateClick = (info) => {
    // Open modal in create mode with prefilled date
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleTaskSaved = () => {
    fetchData();
  };

  // Convert tasks to FullCalendar event format
  const events = tasks.map((task) => {
    const categoryColor = task.category?.color || '#3b82f6'; // Fallback to blue
    return {
      id: task._id,
      title: task.title,
      start: task.dueDate.split('T')[0],
      backgroundColor: categoryColor,
      borderColor: categoryColor,
      textColor: '#ffffff',
      extendedProps: {
        task,
      },
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Calendar View
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View, plan, and manage tasks by their due dates. Click a task to edit it.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedTask(null);
            setIsModalOpen(true);
          }}
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="fc-theme-tailwind">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek',
              }}
              height="680px"
              editable={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
              }}
            />
          </div>
        </div>
      )}

      {/* Styles override for FullCalendar to fit dark mode and modern themes */}
      <style>{`
        .fc {
          font-family: inherit;
        }
        .fc-theme-tailwind .fc-col-header-cell-cmn,
        .fc-theme-tailwind .fc-scrollgrid {
          border-color: var(--color-slate-200);
        }
        .dark .fc-scrollgrid {
          border-color: var(--color-slate-800) !important;
          background-color: var(--color-slate-900);
        }
        .dark .fc-col-header-cell {
          background-color: var(--color-slate-900) !important;
          border-color: var(--color-slate-800) !important;
        }
        .dark .fc-daygrid-day {
          background-color: var(--color-slate-900) !important;
          border-color: var(--color-slate-850) !important;
        }
        .dark .fc-day-today {
          background-color: var(--color-slate-800) !important;
        }
        .fc-day-today {
          background-color: var(--color-indigo-50/40) !important;
        }
        .fc-event {
          cursor: pointer;
          border-radius: 8px !important;
          padding: 3px 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .fc-button-primary {
          background-color: var(--color-indigo-600) !important;
          border-color: var(--color-indigo-600) !important;
          border-radius: 10px !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          text-transform: capitalize !important;
          padding: 8px 14px !important;
        }
        .fc-button-primary:hover {
          background-color: var(--color-indigo-750) !important;
          border-color: var(--color-indigo-750) !important;
        }
        .fc-button-active {
          background-color: var(--color-indigo-800) !important;
          border-color: var(--color-indigo-800) !important;
        }
        .fc-toolbar-title {
          font-size: 1.15rem !important;
          font-weight: 800 !important;
          font-family: 'Outfit', sans-serif !important;
          color: var(--color-slate-800);
        }
        .dark .fc-toolbar-title {
          color: #ffffff !important;
        }
        .dark .fc-button-primary {
          background-color: var(--color-indigo-600) !important;
          border-color: var(--color-indigo-600) !important;
        }
      `}</style>

      {/* Task Dialog */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        categories={categories}
        onTaskSaved={handleTaskSaved}
      />
    </div>
  );
}

export default CalendarView;
