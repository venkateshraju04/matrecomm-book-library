/**
 * src/StatusCard.jsx — System status sidebar card.
 * Shows connection state, users online, and total books at a glance.
 */
import React from 'react';

function StatusCard({ isConnected, usersOnline, booksCount }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-sm">
            📊
          </span>
          System Status
        </h2>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100">
        {/* Connection */}
        <div className="flex flex-col items-center gap-1 py-5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-400'
            }`}
          />
          <span className="text-[11px] font-medium text-slate-500">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Users */}
        <div className="flex flex-col items-center gap-1 py-5">
          <span className="text-lg font-bold text-slate-800">{usersOnline}</span>
          <span className="text-[11px] font-medium text-slate-500">
            {usersOnline === 1 ? 'User' : 'Users'} Online
          </span>
        </div>

        {/* Books */}
        <div className="flex flex-col items-center gap-1 py-5">
          <span className="text-lg font-bold text-slate-800">{booksCount}</span>
          <span className="text-[11px] font-medium text-slate-500">
            {booksCount === 1 ? 'Book' : 'Books'}
          </span>
        </div>
      </div>
    </section>
  );
}

export default StatusCard;
