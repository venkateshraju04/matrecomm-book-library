/**
 * src/ActivityFeed.jsx — Timeline-style real-time activity feed.
 * Listens for "activity" Socket.IO events. Capped at 20 entries.
 */
import React, { useState, useEffect } from 'react';
import socket from './socket';

const MAX_EVENTS = 20;

const EVENT_META = {
  BOOK_ADDED:   { icon: '📚', label: 'Book added',   color: 'bg-indigo-50 text-indigo-600' },
  BOOK_UPDATED: { icon: '✏️',  label: 'Book updated', color: 'bg-amber-50 text-amber-600'   },
};

function ActivityFeed() {
  const [activities, setActivities] = useState([]);

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
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-sm">
            ⚡
          </span>
          <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
        </div>
        {activities.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            {activities.length}
          </span>
        )}
      </div>

      {/* Feed body — scrollable */}
      <div className="custom-scrollbar max-h-72 overflow-y-auto px-5 py-3">
        {activities.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            No activity yet — add or edit a book to see events here.
          </p>
        ) : (
          <ul className="flex flex-col">
            {activities.map((act, idx) => {
              const meta = EVENT_META[act.type] || { icon: '🔔', label: act.type, color: 'bg-slate-50 text-slate-600' };
              return (
                <li
                  key={idx}
                  className="animate-fade-slide-in flex items-start gap-3 border-b border-slate-50 py-3 last:border-0"
                >
                  {/* Icon */}
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs ${meta.color}`}>
                    {meta.icon}
                  </span>

                  {/* Description */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-700">
                      <span className="font-medium">{meta.label}:</span>{' '}
                      {act.title}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <time className="flex-shrink-0 text-[11px] tabular-nums text-slate-400">
                    {formatTime(act.timestamp)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ActivityFeed;
