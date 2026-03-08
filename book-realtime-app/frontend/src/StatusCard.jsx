/**
 * src/StatusCard.jsx — System status sidebar card.
 * Shows connection state, users online, and total books at a glance.
 */
import React from 'react';

function StatusCard({ isConnected, usersOnline, booksCount }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-sm">
            📊
          </span>
          System Status
        </h2>
      </div>

      <div className="divide-y divide-slate-100">
        {/* Connection */}
        <div className="flex items-center gap-3 px-5 py-4 transition-colors duration-150 hover:bg-slate-50/60">
          <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${isConnected ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-400'}`} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">{isConnected ? 'Connected' : 'Offline'}</p>
            <p className="text-[11px] text-slate-400">Socket.IO status</p>
          </div>
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
        </div>

        {/* Users */}
        <div className="flex items-center gap-3 px-5 py-4 transition-colors duration-150 hover:bg-slate-50/60">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm">
            👥
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">{usersOnline === 1 ? 'User' : 'Users'} Online</p>
            <p className="text-[11px] text-slate-400">Active connections</p>
          </div>
          <span className="text-lg font-bold tabular-nums text-slate-800">{usersOnline}</span>
        </div>

        {/* Books */}
        <div className="flex items-center gap-3 px-5 py-4 transition-colors duration-150 hover:bg-slate-50/60">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50 text-sm">
            📚
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">Total {booksCount === 1 ? 'Book' : 'Books'}</p>
            <p className="text-[11px] text-slate-400">In collection</p>
          </div>
          <span className="text-lg font-bold tabular-nums text-slate-800">{booksCount}</span>
        </div>
      </div>
    </section>
  );
}

export default StatusCard;
