/**
 * src/ActivityFeed.jsx — Timeline-style real-time activity feed.
 * Listens for "activity" Socket.IO events. Capped at 20 entries.
 */
import React, { useState, useEffect } from 'react';
import socket from './socket';

const MAX_EVENTS = 20;

const EVENT_META = {
  BOOK_ADDED:   { icon: '📚', label: 'Book added',   color: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' },
  BOOK_UPDATED: { icon: '✏️',  label: 'Book updated', color: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'   },
};

function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onActivity = (event) => {
      console.log('[socket] activity received:', event);
      setActivities((prev) => [event, ...prev].slice(0, MAX_EVENTS));
    };
    socket.on('activity', onActivity);
    return () => socket.off('activity', onActivity);
  }, []);

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-sm">
            ⚡
          </span>
          <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
        </div>
        <div className="flex items-center gap-2">
          {activities.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {activities.length}
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={collapsed ? 'Expand activity feed' : 'Collapse activity feed'}
          >
            <svg className={`h-4 w-4 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Feed body — scrollable, collapsible */}
      {!collapsed && (
      <div className="custom-scrollbar h-[160px] overflow-y-auto px-4 py-2">
        {activities.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            No activity yet — add or edit a book to see events here.
          </p>
        ) : (
          <ul className="flex flex-col">
            {activities.map((act, idx) => {
              const isAdded = act.type === 'BOOK_ADDED';
              return (
                <li
                  key={idx}
                  className="animate-fade-slide-in flex items-center gap-3 border-b border-slate-100/60 py-2.5 last:border-0"
                >
                  <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${isAdded ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                    {isAdded ? 'Added' : 'Updated'} <span className="font-medium text-slate-800">{act.title}</span>
                  </span>
                  <time className="flex-shrink-0 text-[11px] tabular-nums text-slate-400">
                    {formatTime(act.timestamp)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      )}
    </section>
  );
}

export default ActivityFeed;
