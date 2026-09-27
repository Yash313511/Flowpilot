'use client';

import { useState } from 'react';
import { X, Wand2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, getTypeIcon, getTypeLabel } from '@/lib/utils';

interface ExtractedData {
  type: string;
  confidence: number;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  deadline?: string;
  value?: number;
  currency?: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateOpportunityModal({ onClose, onCreated }: Props) {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [input, setInput] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Manual form state
  const [manualType, setManualType] = useState('BUSINESS_LEAD');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualValue, setManualValue] = useState('');
  const [manualDeadline, setManualDeadline] = useState('');
  const [manualSource, setManualSource] = useState('');

  const handleExtract = async () => {
    if (!input.trim()) return;
    setExtracting(true);
    setError('');
    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (data.result) {
        setExtracted(data.result);
      } else {
        setError('Could not extract information. Try manual entry.');
      }
    } catch {
      setError('AI extraction failed. Please use manual entry.');
    } finally {
      setExtracting(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');

    const payload = extracted
      ? {
          type: extracted.type,
          title: extracted.title,
          description: extracted.description,
          value: extracted.value,
          currency: extracted.currency || 'INR',
          deadline: extracted.deadline,
          metadata: extracted.metadata || {},
          source: 'AI Extracted',
        }
      : {
          type: manualType,
          title: manualTitle,
          description: manualDesc,
          value: manualValue ? parseFloat(manualValue) : undefined,
          currency: 'INR',
          deadline: manualDeadline || undefined,
          source: manualSource || undefined,
          metadata: {},
        };

    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create opportunity');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const opportunityTypes = [
    'BUSINESS_LEAD', 'CONTENT_TOPIC', 'SPONSORSHIP',
    'COLLABORATION', 'CUSTOMER_REQUEST', 'AUDIENCE_REQUEST', 'OTHER',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">New Opportunity</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => { setMode('ai'); setExtracted(null); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'ai' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              AI Extract
            </button>
            <button
              onClick={() => { setMode('manual'); setExtracted(null); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Manual Entry
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* AI Mode */}
          {mode === 'ai' && !extracted && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Describe the opportunity
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={4}
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder={`Try: "ABC Restaurant wants a website for ₹50,000 within 20 days" or "XYZ wants to sponsor my AI video for ₹25,000 by October 15"`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleExtract();
                  }}
                />
                <p className="mt-1 text-xs text-slate-400">Press ⌘+Enter to extract</p>
              </div>
              <button
                onClick={handleExtract}
                disabled={!input.trim() || extracting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-medium transition-colors"
              >
                {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {extracting ? 'Extracting with AI...' : 'Extract Information'}
              </button>
            </div>
          )}

          {/* AI Extracted Preview */}
          {mode === 'ai' && extracted && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Extracted with {Math.round(extracted.confidence * 100)}% confidence
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getTypeIcon(extracted.type)}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {getTypeLabel(extracted.type)}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Title</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{extracted.title}</p>
                </div>

                {extracted.description && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Description</p>
                    <p className="text-sm text-slate-700 mt-0.5">{extracted.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {extracted.value && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Value</p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        {formatCurrency(extracted.value, extracted.currency)}
                      </p>
                    </div>
                  )}
                  {extracted.deadline && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Deadline</p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        {new Date(extracted.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadata preview */}
                {extracted.metadata && Object.keys(extracted.metadata).length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(extracted.metadata)
                      .filter(([, v]) => v)
                      .slice(0, 6)
                      .map(([k, v]) => (
                        <div key={k}>
                          <p className="text-xs text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-xs font-medium text-slate-700">{String(v)}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setExtracted(null); setInput(''); }}
                  className="flex-1 border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Re-extract
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {creating ? 'Creating...' : 'Create Opportunity'}
                </button>
              </div>
            </div>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Type</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
                >
                  {opportunityTypes.map((t) => (
                    <option key={t} value={t}>{getTypeIcon(t)} {getTypeLabel(t)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Title *</label>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  required
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="ABC Restaurant Website"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Brief description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Value (₹)</label>
                  <input
                    type="number"
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    className="mt-1.5 w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Deadline</label>
                  <input
                    type="date"
                    value={manualDeadline}
                    onChange={(e) => setManualDeadline(e.target.value)}
                    className="mt-1.5 w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Source</label>
                <input
                  value={manualSource}
                  onChange={(e) => setManualSource(e.target.value)}
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="WhatsApp, Email, Referral..."
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={!manualTitle || creating}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-medium transition-colors"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {creating ? 'Creating...' : 'Create Opportunity'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
