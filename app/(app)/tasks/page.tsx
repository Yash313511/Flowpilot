'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2, CheckSquare, MoreVertical } from 'lucide-react';
import { getPriorityColor, getStatusColor, formatDeadline, timeAgo } from '@/lib/utils';

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'BACKLOG', label: 'Backlog', color: 'text-slate-500' },
  { key: 'TODO', label: 'To Do', color: 'text-blue-600' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'text-yellow-600' },
  { key: 'REVIEW', label: 'Review', color: 'text-purple-600' },
  { key: 'COMPLETED', label: 'Completed', color: 'text-green-600' },
];

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  deadline?: string;
  estimatedMinutes?: number;
  assigneeId?: { name: string; avatar?: string } | null;
  createdAt: string;
}

interface TeamMember { _id: string; name: string; role: string; }

function QuickAddTask({ status, teamMembers, onAdd }: {
  status: string;
  teamMembers: TeamMember[];
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setLoading(true);
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, priority, status,
        assigneeId: assigneeId || undefined,
        deadline: deadline || undefined,
      }),
    });
    setTitle(''); setOpen(false); setLoading(false);
    onAdd();
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded hover:bg-white transition-colors w-full"
    >
      <Plus className="w-3.5 h-3.5" />
      Add task
    </button>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="Task title..."
        className="w-full text-sm border-0 outline-none text-slate-900 placeholder:text-slate-400"
      />
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 bg-white focus:outline-none"
        >
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {teamMembers.length > 0 && (
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 bg-white focus:outline-none flex-1"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleAdd}
          disabled={!title.trim() || loading}
          className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Add
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5">
          Cancel
        </button>
      </div>
    </div>
  );
}

function KanbanCard({ task, onUpdate }: { task: Task; onUpdate: () => void }) {
  const updateStatus = async (status: string) => {
    await fetch(`/api/tasks/${task._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onUpdate();
  };

  return (
    <div className="kanban-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-900 leading-snug flex-1">{task.title}</p>
        <div className="relative group/menu">
          <button className="p-0.5 rounded hover:bg-slate-100 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.deadline && (
          <span className={`text-xs ${new Date(task.deadline) < new Date() ? 'text-red-500' : 'text-slate-400'}`}>
            {formatDeadline(task.deadline)}
          </span>
        )}
        {task.estimatedMinutes && (
          <span className="text-xs text-slate-400">~{task.estimatedMinutes}m</span>
        )}
      </div>

      {task.assigneeId && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-medium text-blue-700">{task.assigneeId.name[0]}</span>
          </div>
          <span className="text-xs text-slate-500">{task.assigneeId.name}</span>
        </div>
      )}

      <select
        value={task.status}
        onChange={(e) => updateStatus(e.target.value)}
        className="mt-2 text-xs border border-slate-100 rounded px-2 py-1 text-slate-500 bg-slate-50 focus:outline-none w-full"
      >
        {['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'].map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const fetchAll = async () => {
    const [tasksRes, teamRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/team'),
    ]);
    if (tasksRes.ok) setTasks((await tasksRes.json()).tasks || []);
    if (teamRes.ok) setTeamMembers((await teamRes.json()).members || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter((t) => t.status === col.key);
    return acc;
  }, {} as Record<string, Task[]>);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="p-6 pb-24 md:pb-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {tasks.filter((t) => t.status !== 'COMPLETED').length} active
            · {tasks.filter((t) => t.status === 'COMPLETED').length} done
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map((col) => (
            <div key={col.key} className="flex-shrink-0 w-64">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                  {col.label}
                </h3>
                <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">
                  {tasksByStatus[col.key]?.length || 0}
                </span>
              </div>
              <div className="space-y-2">
                {tasksByStatus[col.key]?.map((task) => (
                  <KanbanCard key={task._id} task={task} onUpdate={fetchAll} />
                ))}
                <QuickAddTask status={col.key} teamMembers={teamMembers} onAdd={fetchAll} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {tasks.length === 0 ? (
            <div className="py-12 text-center">
              <CheckSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No tasks yet. Generate a workflow or create one.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Task</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Assignee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={task.status}
                        onChange={async (e) => {
                          await fetch(`/api/tasks/${task._id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: e.target.value }),
                          });
                          fetchAll();
                        }}
                        className={`text-xs border rounded px-2 py-1 font-medium focus:outline-none ${getStatusColor(task.status)}`}
                      >
                        {['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'].map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {task.assigneeId ? task.assigneeId.name : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {task.deadline ? (
                        <span className={new Date(task.deadline) < new Date() && task.status !== 'COMPLETED' ? 'text-red-500' : ''}>
                          {formatDeadline(task.deadline)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
