'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2, Users, Trash2, Edit2 } from 'lucide-react';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  availability: number;
  workload: number;
}

function WorkloadBar({ value, label }: { value: number; label: string }) {
  const color = value >= 80 ? 'bg-red-500' : value >= 60 ? 'bg-orange-400' : value >= 30 ? 'bg-yellow-400' : 'bg-green-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className={`font-medium ${value >= 80 ? 'text-red-600' : 'text-slate-600'}`}>{value}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function AddMemberModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!name || !email || !role) { setError('Name, email and role are required'); return; }
    setLoading(true);
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, email, role,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        availability,
      }),
    });
    if (res.ok) { onAdded(); onClose(); }
    else { const d = await res.json(); setError(d.error || 'Failed to add'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="font-semibold text-slate-900 mb-5">Add Team Member</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Rahul Sharma" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="rahul@company.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Role *</label>
            <input value={role} onChange={(e) => setRole(e.target.value)}
              className="mt-1.5 w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Developer, Designer, Sales..." />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Skills (comma separated)</label>
            <input value={skills} onChange={(e) => setSkills(e.target.value)}
              className="mt-1.5 w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="React, TypeScript, Design..." />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Availability ({availability}%)</label>
            <input type="range" min={0} max={100} step={10} value={availability}
              onChange={(e) => setAvailability(parseInt(e.target.value))}
              className="mt-1.5 w-full" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchMembers = async () => {
    const res = await fetch('/api/team');
    if (res.ok) setMembers((await res.json()).members || []);
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const deleteMember = async (id: string) => {
    if (!confirm('Remove this team member?')) return;
    await fetch(`/api/team/${id}`, { method: 'DELETE' });
    fetchMembers();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500 mt-0.5">{members.length} members</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-slate-900 font-medium mb-1">No team members yet</h3>
          <p className="text-slate-400 text-sm mb-4">Add your team to enable smart task assignment</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member._id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{member.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => deleteMember(member._id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <WorkloadBar value={member.workload || 0} label="Current Workload" />
                <WorkloadBar value={member.availability || 100} label="Availability" />
              </div>

              {member.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {member.skills.slice(0, 5).map((skill) => (
                    <span key={skill} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">{member.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddMemberModal onClose={() => setShowAdd(false)} onAdded={fetchMembers} />
      )}
    </div>
  );
}
