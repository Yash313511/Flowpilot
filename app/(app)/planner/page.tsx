'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertCircle, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { formatDeadline, getPriorityColor, getStatusColor } from '@/lib/utils';

interface Task {
  _id: string;
  title: string;
  priority: string;
  status: string;
  estimatedMinutes?: number;
  deadline?: string;
  assigneeId?: { name: string } | null;
}

function TimeSlot({ time, tasks }: { time: string; tasks: Task[] }) {
  if (tasks.length === 0) return null;
  return (
    <div className="flex gap-4">
      <div className="w-12 flex-shrink-0 text-right">
        <span className="text-xs text-slate-400 font-mono">{time}</span>
      </div>
      <div className="flex-1 space-y-2 pb-4 border-l border-slate-200 pl-4 -mt-1">
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const [done, setDone] = useState(task.status === 'COMPLETED');
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const newStatus = done ? 'IN_PROGRESS' : 'COMPLETED';
    await fetch(`/api/tasks/${task._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setDone(!done);
    setLoading(false);
  };

  return (
    <div className={`bg-white border rounded-lg p-3 transition-all ${done ? 'opacity-60 border-slate-100' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={toggle}
          disabled={loading}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
            done ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-blue-500'
          }`}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin text-white" />
          ) : done ? (
            <CheckCircle2 className="w-3 h-3 text-white" />
          ) : null}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            {task.estimatedMinutes && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimatedMinutes >= 60
                  ? `${(task.estimatedMinutes / 60).toFixed(1)}h`
                  : `${task.estimatedMinutes}m`}
              </span>
            )}
            {task.assigneeId && (
              <span className="text-xs text-slate-400">→ {task.assigneeId.name}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [todayRes, overdueRes, allRes] = await Promise.all([
        fetch('/api/tasks/today'),
        fetch('/api/tasks/overdue'),
        fetch('/api/tasks?limit=20'),
      ]);

      const today = todayRes.ok ? (await todayRes.json()).tasks || [] : [];
      const overdue = overdueRes.ok ? (await overdueRes.json()).tasks || [] : [];
      const all = allRes.ok ? (await allRes.json()).tasks || [] : [];

      // Upcoming = next 7 days, not today, not overdue
      const now = new Date();
      const weekAhead = new Date();
      weekAhead.setDate(weekAhead.getDate() + 7);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const upcoming = all.filter((t: Task) => {
        if (!t.deadline) return false;
        const d = new Date(t.deadline);
        return d > endOfDay && d <= weekAhead && t.status !== 'COMPLETED';
      });

      setTodayTasks(today);
      setOverdueTasks(overdue);
      setUpcomingTasks(upcoming);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const now = new Date();
  const today = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Assign rough time slots based on priority and estimated time
  const assignTimeSlots = (tasks: Task[]) => {
    const slots: Record<string, Task[]> = {};
    const startHour = 9;
    let currentMinutes = startHour * 60;

    // Sort by priority then estimated time
    const sorted = [...tasks].sort((a, b) => {
      const pOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (pOrder[a.priority as keyof typeof pOrder] || 2) - (pOrder[b.priority as keyof typeof pOrder] || 2);
    });

    sorted.forEach((task) => {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const key = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      if (!slots[key]) slots[key] = [];
      slots[key].push(task);
      currentMinutes += (task.estimatedMinutes || 30) + 15; // 15 min buffer
    });

    return slots;
  };

  const timeSlots = assignTimeSlots(todayTasks);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Daily Planner</h1>
        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {today}
        </p>
      </div>

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-600">Overdue ({overdueTasks.length})</h2>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div key={task._id} className="bg-red-50 border border-red-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{task.title}</p>
                  <span className="text-xs text-red-600 font-medium">{formatDeadline(task.deadline)}</span>
                </div>
                {task.assigneeId && (
                  <p className="text-xs text-slate-400 mt-1">→ {task.assigneeId.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Today's Schedule
          {todayTasks.length > 0 && (
            <span className="ml-2 text-slate-400 font-normal">
              ({todayTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0)} min total)
            </span>
          )}
        </h2>

        {todayTasks.length === 0 ? (
          <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">No tasks due today!</p>
            <p className="text-xs text-green-600 mt-1">Great job staying on top of things.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {Object.entries(timeSlots)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([time, tasks]) => (
                <TimeSlot key={time} time={time} tasks={tasks} />
              ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcomingTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Upcoming (Next 7 Days)</h2>
          <div className="space-y-2">
            {upcomingTasks.map((task) => (
              <div key={task._id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{task.title}</p>
                  {task.assigneeId && <p className="text-xs text-slate-400 mt-0.5">→ {task.assigneeId.name}</p>}
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className="text-xs text-slate-400">{formatDeadline(task.deadline)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
