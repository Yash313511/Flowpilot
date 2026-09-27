'use client';

import { useEffect, useState } from 'react';
import { Loader2, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { getStatusColor, formatDeadline, timeAgo } from '@/lib/utils';

interface Workflow {
  _id: string;
  name: string;
  status: string;
  progress: number;
  deadline?: string;
  createdAt: string;
  opportunityId?: { title: string } | string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/workflows')
      .then((r) => r.json())
      .then((d) => { setWorkflows(d.workflows || []); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Workflows</h1>
        <p className="text-sm text-slate-500 mt-0.5">{workflows.length} total</p>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <GitBranch className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-slate-900 font-medium mb-1">No workflows yet</h3>
          <p className="text-slate-400 text-sm mb-4">Generate a workflow from any opportunity</p>
          <Link href="/opportunities" className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            View Opportunities →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <div key={workflow._id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="w-4 h-4 text-slate-400" />
                    <h3 className="font-semibold text-slate-900 text-sm">{workflow.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className={`px-2 py-0.5 rounded border font-medium ${getStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </span>
                    {workflow.deadline && (
                      <span>{formatDeadline(workflow.deadline)}</span>
                    )}
                    <span>{timeAgo(workflow.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-slate-900">{workflow.progress}%</div>
                  <div className="text-xs text-slate-400">complete</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      workflow.progress === 100 ? 'bg-green-500' :
                      workflow.progress > 50 ? 'bg-blue-500' : 'bg-blue-400'
                    }`}
                    style={{ width: `${workflow.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
