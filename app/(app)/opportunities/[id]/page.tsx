'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, GitBranch, Loader2, AlertCircle, CheckSquare,
  Calendar, TrendingUp, Zap, User, RefreshCw, Trash2
} from 'lucide-react';
import {
  formatCurrency, formatDeadline, getScoreBgColor, getTypeIcon,
  getTypeLabel, getPriorityColor, getStatusColor, timeAgo
} from '@/lib/utils';

interface ScoreBreakdown { label: string; points: number; maxPoints: number; reason: string; }
interface Opportunity {
  _id: string; title: string; type: string; description?: string; source?: string;
  score: number; scoreBreakdown: ScoreBreakdown[]; priority: string;
  status: string; value?: number; currency?: string; deadline?: string;
  workflowId?: string; createdAt: string;
  metadata?: Record<string, unknown>;
}
interface Task {
  _id: string; title: string; status: string; priority: string;
  estimatedMinutes?: number; deadline?: string;
  assigneeId?: { name: string } | null;
}
interface Workflow {
  _id: string; name: string; status: string; progress: number; createdAt: string;
}

const STATUS_OPTIONS = ['NEW', 'ACTIVE', 'IN_PROGRESS', 'WON', 'LOST', 'ARCHIVED'];

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/opportunities/${id}`);
    if (res.ok) {
      const data = await res.json();
      setOpportunity(data.opportunity);
      setWorkflow(data.workflow);
      setTasks(data.tasks || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleGenerateWorkflow = async () => {
    setGenerating(true);
    setError('');
    const res = await fetch(`/api/opportunities/${id}/generate-workflow`, { method: 'POST' });
    if (res.ok) {
      fetchData();
    } else {
      setError('Failed to generate workflow. Please try again.');
    }
    setGenerating(false);
  };

  const handleStatusChange = async (status: string) => {
    await fetch(`/api/opportunities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this opportunity? This cannot be undone.')) return;
    await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
    router.push('/opportunities');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
    </div>
  );

  if (!opportunity) return (
    <div className="p-6">
      <p className="text-slate-500">Opportunity not found.</p>
      <Link href="/opportunities" className="text-blue-600 text-sm mt-2 inline-block">← Back</Link>
    </div>
  );

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/opportunities" className="p-2 rounded-md hover:bg-slate-100 transition-colors mt-0.5">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{getTypeIcon(opportunity.type)}</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {getTypeLabel(opportunity.type)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">{opportunity.title}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <select
              value={opportunity.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`text-xs font-medium px-2 py-1 rounded border focus:outline-none ${getStatusColor(opportunity.status)}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(opportunity.priority)}`}>
              {opportunity.priority}
            </span>
            {opportunity.value && (
              <span className="text-sm font-semibold text-slate-700">
                {formatCurrency(opportunity.value, opportunity.currency)}
              </span>
            )}
            {opportunity.deadline && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDeadline(opportunity.deadline)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {opportunity.description && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">Description</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{opportunity.description}</p>
            </div>
          )}

          {/* Workflow Section */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900 text-sm">Workflow & Tasks</h2>
              </div>
              {workflow ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-24 bg-slate-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-blue-600 transition-all"
                        style={{ width: `${workflow.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{workflow.progress}%</span>
                  </div>
                  <Link href={`/workflows`} className="text-xs text-blue-600 hover:text-blue-700">
                    View workflow →
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleGenerateWorkflow}
                  disabled={generating}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  {generating ? 'Generating...' : 'Generate Workflow'}
                </button>
              )}
            </div>

            {tasks.length > 0 ? (
              <div>
                <div className="px-5 py-2 text-xs text-slate-400 border-b border-slate-50">
                  {completedTasks}/{tasks.length} tasks completed
                </div>
                <div className="divide-y divide-slate-50">
                  {tasks.map((task) => (
                    <TaskRow key={task._id} task={task} onUpdate={fetchData} />
                  ))}
                </div>
              </div>
            ) : workflow ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                No tasks created yet
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <GitBranch className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400 mb-3">
                  Generate a workflow to create tasks automatically
                </p>
                <button
                  onClick={handleGenerateWorkflow}
                  disabled={generating}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {generating ? 'Generating...' : 'Generate Workflow'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Score + Details */}
        <div className="space-y-5">
          {/* Score Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Opportunity Score
              </h2>
              <span className={`text-2xl font-bold ${opportunity.score >= 85 ? 'text-red-600' : opportunity.score >= 70 ? 'text-orange-600' : opportunity.score >= 40 ? 'text-yellow-600' : 'text-slate-400'}`}>
                {opportunity.score}
              </span>
            </div>

            {/* Score bar */}
            <div className="mb-4">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    opportunity.score >= 85 ? 'bg-red-500' :
                    opportunity.score >= 70 ? 'bg-orange-500' :
                    opportunity.score >= 40 ? 'bg-yellow-500' : 'bg-slate-400'
                  }`}
                  style={{ width: `${opportunity.score}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-400">Low</span>
                <span className="text-xs text-slate-400">Critical</span>
              </div>
            </div>

            {/* Breakdown */}
            {opportunity.scoreBreakdown?.length > 0 && (
              <div className="space-y-2">
                {opportunity.scoreBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-500">{item.label}</span>
                      <span className="text-xs font-medium text-slate-700">
                        {item.points}/{item.maxPoints}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1">
                      <div
                        className="h-1 rounded-full bg-blue-400"
                        style={{ width: `${(item.points / item.maxPoints) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Details</h2>
            <dl className="space-y-2.5">
              {opportunity.source && (
                <div className="flex justify-between">
                  <dt className="text-xs text-slate-400">Source</dt>
                  <dd className="text-xs font-medium text-slate-700">{opportunity.source}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">Created</dt>
                <dd className="text-xs font-medium text-slate-700">{timeAgo(opportunity.createdAt)}</dd>
              </div>
              {opportunity.metadata && Object.entries(opportunity.metadata)
                .filter(([, v]) => v && typeof v !== 'object')
                .slice(0, 8)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-xs text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</dt>
                    <dd className="text-xs font-medium text-slate-700 text-right max-w-[60%] truncate">{String(v)}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, onUpdate }: { task: Task; onUpdate: () => void }) {
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    await fetch(`/api/tasks/${task._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onUpdate();
    setUpdating(false);
  };

  return (
    <div className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
      <button
        onClick={() => updateStatus(task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED')}
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          task.status === 'COMPLETED'
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-slate-300 hover:border-blue-500'
        }`}
      >
        {task.status === 'COMPLETED' && <CheckSquare className="w-3 h-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
          {task.title}
        </p>
        {(task.estimatedMinutes || task.assigneeId) && (
          <p className="text-xs text-slate-400 mt-0.5">
            {task.estimatedMinutes ? `~${task.estimatedMinutes}m` : ''}
            {task.assigneeId ? ` · ${task.assigneeId.name}` : ''}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        <select
          value={task.status}
          onChange={(e) => updateStatus(e.target.value)}
          disabled={updating}
          className="text-xs border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none bg-white"
        >
          {['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
