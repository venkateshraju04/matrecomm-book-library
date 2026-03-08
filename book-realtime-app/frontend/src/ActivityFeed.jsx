/**
 * src/ActivityFeed.jsx — Real-time activity feed component.
 *
 * Listens for "activity" Socket.IO events emitted by the backend whenever
 * a book is added or updated.  New events are prepended so the latest
 * activity always appears at the top.  The feed is capped at MAX_EVENTS
 * entries to avoid unbounded growth.
 *
 * Event payload shape (from backend):
 *   { type: "BOOK_ADDED" | "BOOK_UPDATED", title: string, timestamp: string }
 */
import React, { useState, useEffect } from 'react';
import socket from './socket';

// Maximum number of activity entries to keep in the feed
const MAX_EVENTS = 20;

// Map event types to a readable label and icon
const EVENT_META = {
  BOOK_ADDED:   { icon: '📚', label: 'Book added'   },
  BOOK_UPDATED: { icon: '✏️',  label: 'Book updated' },
};

function ActivityFeed() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    /**
     * onActivity — handler for the "activity" Socket.IO event.
     *
     * Prepends the new event to the list.  The functional-update form of
     * setActivities ensures we always operate on the latest state even if
     * multiple events arrive in rapid succession.
     */
    const onActivity = (event) => {
      console.log('[socket] activity received:', event);
      setActivities((prev) => [event, ...prev].slice(0, MAX_EVENTS));
    };

    socket.on('activity', onActivity);

    // Cleanup: remove listener on unmount to prevent duplicate entries
    return () => socket.off('activity', onActivity);
  }, []);

  // Format ISO timestamp → readable local time (e.g. "10:45:03 AM")
  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Recent Activity</h2>

      {activities.length === 0 ? (
        <p style={styles.empty}>No activity yet — try adding or editing a book.</p>
      ) : (
        <ul style={styles.list}>
          {activities.map((act, idx) => {
            const meta = EVENT_META[act.type] || { icon: '🔔', label: act.type };
            return (
              <li key={idx} style={styles.item}>
                <span style={styles.icon}>{meta.icon}</span>
                <span style={styles.text}>
                  <strong>{meta.label}:</strong> {act.title}
                </span>
                <span style={styles.time}>{formatTime(act.timestamp)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    border: '1px solid #dce3ee',
    borderRadius: '10px',
    padding: '20px 24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  heading: {
    fontSize: '18px',
    color: '#2c3e50',
    marginBottom: '14px',
  },
  empty: {
    color: '#999',
    fontSize: '14px',
  },
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '240px',
    overflowY: 'auto',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    background: '#f8fafc',
    borderRadius: '6px',
    fontSize: '14px',
    animation: 'fadeIn 0.3s ease',
  },
  icon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  text: {
    flex: 1,
    color: '#2c3e50',
  },
  time: {
    color: '#aaa',
    fontSize: '12px',
    flexShrink: 0,
  },
};

export default ActivityFeed;
