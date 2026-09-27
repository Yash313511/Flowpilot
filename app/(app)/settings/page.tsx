'use client';

import { useSession } from 'next-auth/react';
import { User, Building2 } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          {session?.user?.image ? (
            <img src={session.user.image} alt="Avatar" className="w-14 h-14 rounded-full" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-7 h-7 text-blue-600" />
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900">{session?.user?.name}</p>
            <p className="text-sm text-slate-500">{session?.user?.email}</p>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              {session?.user?.role || 'OWNER'}
            </span>
          </div>
        </div>

        <dl className="space-y-3 border-t border-slate-100 pt-4">
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Account ID</dt>
            <dd className="text-sm font-mono text-slate-700">{session?.user?.id?.slice(-8)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Organization ID</dt>
            <dd className="text-sm font-mono text-slate-700">{session?.user?.organizationId?.slice(-8) || 'None'}</dd>
          </div>
        </dl>
      </div>

      {/* Environment info */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Configuration
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-700">AI Model</span>
            <span className="text-sm font-medium text-slate-900 font-mono">{process.env.NEXT_PUBLIC_AI_MODEL || 'gemini-1.5-flash'}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <span className="text-sm text-green-700">Database</span>
            <span className="text-sm font-medium text-green-900">MongoDB Atlas ✓</span>
          </div>
        </div>
      </div>

      {/* Access Mode */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-2">Access Mode</h2>
        <p className="text-sm text-slate-500 mb-4">Direct access is active. Authentication is automatically handled for your workspace.</p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Workspace Active — Direct Mode
        </div>
      </div>
    </div>
  );
}
