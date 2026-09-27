'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, Loader2, Target, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDeadline, getScoreBgColor, getTypeIcon, getTypeLabel, getPriorityColor, getStatusColor } from '@/lib/utils';
import CreateOpportunityModal from '@/components/opportunities/CreateOpportunityModal';

interface Opportunity {
  _id: string;
  title: string;
  type: string;
  score: number;
  priority: string;
  status: string;
  value?: number;
  currency?: string;
  deadline?: string;
  source?: string;
  createdAt: string;
}

const TYPES = ['ALL', 'BUSINESS_LEAD', 'CONTENT_TOPIC', 'SPONSORSHIP', 'COLLABORATION', 'CUSTOMER_REQUEST'];
const STATUSES = ['ALL', 'NEW', 'ACTIVE', 'IN_PROGRESS', 'WON', 'LOST'];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);

  const fetchOpportunities = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== 'ALL') params.set('type', typeFilter);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    const res = await fetch(`/api/opportunities?${params}`);
    if (res.ok) {
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOpportunities(); }, [typeFilter, statusFilter]);

  const filtered = opportunities.filter((o) =>
    search ? o.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Opportunities</h1>
          <p className="text-sm text-slate-500 mt-0.5">{opportunities.length} total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Opportunity
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t === 'ALL' ? 'All Types' : getTypeLabel(t)}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Target className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-slate-900 font-medium mb-1">No opportunities found</h3>
          <p className="text-slate-400 text-sm mb-4">Create your first opportunity to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Opportunity
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Desktop table */}
          <table className="w-full hidden md:table">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Opportunity</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Score</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Value</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Deadline</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((opp) => (
                <tr key={opp._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getTypeIcon(opp.type)}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{opp.title}</p>
                        <p className="text-xs text-slate-400">{getTypeLabel(opp.type)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getScoreBgColor(opp.score)}`}>
                      {opp.score}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(opp.priority)}`}>
                      {opp.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(opp.status)}`}>
                      {opp.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {opp.value ? formatCurrency(opp.value, opp.currency) : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {opp.deadline ? (
                      <span className={parseInt(formatDeadline(opp.deadline)) < 0 ? 'text-red-600' : ''}>
                        {formatDeadline(opp.deadline)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/opportunities/${opp._id}`}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-blue-600 font-medium transition-opacity"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.map((opp) => (
              <Link key={opp._id} href={`/opportunities/${opp._id}`}>
                <div className="px-4 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-lg mt-0.5">{getTypeIcon(opp.type)}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{opp.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{getTypeLabel(opp.type)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border flex-shrink-0 ${getScoreBgColor(opp.score)}`}>
                      {opp.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-8">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(opp.status)}`}>
                      {opp.status}
                    </span>
                    {opp.value && <span className="text-xs text-slate-500">{formatCurrency(opp.value, opp.currency)}</span>}
                    {opp.deadline && <span className="text-xs text-slate-400">{formatDeadline(opp.deadline)}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateOpportunityModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchOpportunities(); }}
        />
      )}
    </div>
  );
}
