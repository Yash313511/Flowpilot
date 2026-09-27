import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'INR') {
  if (currency === 'INR') {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export function formatDeadline(date?: Date | string): string {
  if (!date) return 'No deadline';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `${days}d left`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-red-600';
  if (score >= 70) return 'text-orange-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-slate-500';
}

export function getScoreBgColor(score: number): string {
  if (score >= 85) return 'bg-red-50 border-red-100 text-red-700';
  if (score >= 70) return 'bg-orange-50 border-orange-100 text-orange-700';
  if (score >= 40) return 'bg-yellow-50 border-yellow-100 text-yellow-700';
  return 'bg-slate-50 border-slate-200 text-slate-600';
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-100';
    case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-100';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    case 'LOW': return 'text-slate-500 bg-slate-50 border-slate-200';
    default: return 'text-slate-500 bg-slate-50 border-slate-200';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED': case 'WON': return 'text-green-700 bg-green-50 border-green-100';
    case 'ACTIVE': case 'IN_PROGRESS': case 'QUALIFIED': return 'text-blue-700 bg-blue-50 border-blue-100';
    case 'REVIEW': case 'NEGOTIATION': case 'PROPOSAL': return 'text-purple-700 bg-purple-50 border-purple-100';
    case 'LOST': case 'ARCHIVED': case 'CANCELLED': return 'text-slate-500 bg-slate-100 border-slate-200';
    case 'TODO': case 'NEW': case 'CONTACTED': return 'text-slate-700 bg-slate-50 border-slate-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    BUSINESS_LEAD: 'Business Lead',
    CONTENT_TOPIC: 'Content Topic',
    SPONSORSHIP: 'Sponsorship',
    COLLABORATION: 'Collaboration',
    CUSTOMER_REQUEST: 'Customer Request',
    AUDIENCE_REQUEST: 'Audience Request',
    OTHER: 'Other',
  };
  return labels[type] || type;
}

export function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    BUSINESS_LEAD: '💼',
    CONTENT_TOPIC: '🎬',
    SPONSORSHIP: '💰',
    COLLABORATION: '🤝',
    CUSTOMER_REQUEST: '📩',
    AUDIENCE_REQUEST: '👥',
    OTHER: '📌',
  };
  return icons[type] || '📌';
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
