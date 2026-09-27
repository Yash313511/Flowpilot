'use client';

import { useEffect, useState } from 'react';
import {
  CheckSquare,
  AlertCircle,
  Clock,
  TrendingUp,
  Target,
  Users,
  Loader2,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDeadline, getScoreBgColor, getPriorityColor, getTypeIcon, getTypeLabel, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import CreateOpportunityModal from '@/components/opportunities/CreateOpportunityModal';

interface DashboardData {
  summary: {
    activeTasks: number;
    todayTasks: number;
    overdueTasks: number;
    activeWorkflows: number;
    highPriorityOpportunities: number;
  };
  topOpportunities: Array<{
    _id: string;
    title: string;
    type: string;
    score: number;
    priority: string;
    value?: number;
    currency?: string;
    deadline?: string;
    status: string;
  }>;
  todayTasks: Array<{
    _id: string;
    title: string;
    priority: string;
    estimatedMinutes?: number;
    deadline?: string;
    assigneeId?: { name: string } | null;
  }>;
  overdueTasks: Array<{
    _id: string;
    title: string;
    deadline?: string;
    priority: string;
  }>;
  teamMembers: Array<{
    _id: string;
    name: string;
    role: string;
    workload: number;
  }>;
  upcomingDeadlines: Array<{
    _id: string;
    title: string;
    deadline?: string;
    priority: string;
  }>;
  aiSummary: string;
  organizationType: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="stat-card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function WorkloadBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-red-500' : value >= 60 ? 'bg-orange-400' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{value}%</span>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const isCreator = data?.organizationType === 'CREATOR';

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{greeting}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Target className="w-4 h-4" />
            New Opportunity
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {data?.aiSummary && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">AI Daily Brief</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{data.aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Tasks"
          value={data?.summary.activeTasks || 0}
          icon={CheckSquare}
          color="bg-blue-50 text-blue-600"
          href="/tasks"
        />
        <StatCard
          label="Due Today"
          value={data?.summary.todayTasks || 0}
          icon={Clock}
          color="bg-yellow-50 text-yellow-600"
          href="/planner"
        />
        <StatCard
          label="Overdue"
          value={data?.summary.overdueTasks || 0}
          icon={AlertCircle}
          color={data?.summary.overdueTasks ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}
          href="/tasks"
        />
        <StatCard
          label={isCreator ? 'Top Ideas' : 'Hot Leads'}
          value={data?.summary.highPriorityOpportunities || 0}
          icon={TrendingUp}
          color="bg-green-50 text-green-600"
          href="/opportunities"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Opportunities */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">
              {isCreator ? 'Top Content Opportunities' : 'Top Opportunities'}
            </h2>
            <Link href="/opportunities" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data?.topOpportunities.length === 0 && (
              <div className="px-5 py-8 text-center">
                <Target className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No opportunities yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first opportunity →
                </button>
              </div>
            )}
            {data?.topOpportunities.map((opp) => (
              <Link key={opp._id} href={`/opportunities/${opp._id}`}>
                <div className="px-5 py-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                  <div className="text-xl flex-shrink-0">{getTypeIcon(opp.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{opp.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {getTypeLabel(opp.type)}
                      {opp.value ? ` · ${formatCurrency(opp.value, opp.currency)}` : ''}
                      {opp.deadline ? ` · ${formatDeadline(opp.deadline)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getScoreBgColor(opp.score)}`}>
                      {opp.score}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Overdue / Attention */}
          {(data?.overdueTasks.length || 0) > 0 && (
            <div className="bg-white border border-red-100 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700">Overdue Tasks</span>
              </div>
              <div className="divide-y divide-slate-50">
                {data?.overdueTasks.slice(0, 3).map((task) => (
                  <Link key={task._id} href="/tasks">
                    <div className="px-4 py-3 hover:bg-slate-50 transition-colors">
                      <p className="text-sm text-slate-900 truncate">{task.title}</p>
                      <p className="text-xs text-red-500 mt-0.5">{formatDeadline(task.deadline)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Today's Focus */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Today's Focus</h3>
              <Link href="/planner" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View planner</Link>
            </div>
            {data?.todayTasks.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-slate-400">No tasks due today 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {data?.todayTasks.slice(0, 4).map((task) => (
                  <div key={task._id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        task.priority === 'CRITICAL' ? 'bg-red-500' :
                        task.priority === 'HIGH' ? 'bg-orange-500' :
                        task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-slate-400'
                      }`} />
                      <p className="text-sm text-slate-900 truncate flex-1">{task.title}</p>
                    </div>
                    {task.estimatedMinutes && (
                      <p className="text-xs text-slate-400 mt-1 ml-3.5">
                        ~{task.estimatedMinutes >= 60
                          ? `${(task.estimatedMinutes / 60).toFixed(1)}h`
                          : `${task.estimatedMinutes}m`}
                        {task.assigneeId ? ` · ${task.assigneeId.name}` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Workload */}
          {(data?.teamMembers.length || 0) > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Workload
                </h3>
                <Link href="/team" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Manage</Link>
              </div>
              <div className="px-4 py-3 space-y-3">
                {data?.teamMembers.slice(0, 4).map((member) => (
                  <div key={member._id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700 font-medium">{member.name}</span>
                      <span className="text-xs text-slate-400">{member.role}</span>
                    </div>
                    <WorkloadBar value={member.workload || 0} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateOpportunityModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
}
