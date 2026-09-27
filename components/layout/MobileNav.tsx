'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, CheckSquare, Calendar, Menu, Zap, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opps', icon: Target },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/planner', label: 'Plan', icon: Calendar },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">FlowPilot</span>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 px-2 py-2 flex items-center justify-around safe-area-bottom">
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md min-w-[56px]',
                isActive ? 'text-blue-400' : 'text-slate-500'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Link>
          );
        })}
        <Link
          href="/team"
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md min-w-[56px]',
            pathname.startsWith('/team') ? 'text-blue-400' : 'text-slate-500'
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-xs">More</span>
        </Link>
      </nav>
    </>
  );
}
