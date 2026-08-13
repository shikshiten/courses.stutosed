'use client';

import React from 'react';
import { Home, BookOpen, Send, Moon, Sun, User, CheckCircle } from 'lucide-react';
import { UserProfile } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  watchedCount: number;
  totalVideos: number;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  watchedCount,
  totalVideos,
  user,
  onOpenAuth,
}) => {
  const pct = Math.min(Math.round((watchedCount / (totalVideos || 1)) * 100), 100);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          className="active"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation */}
      <aside id="sidebar-nav" className={isOpen ? 'active' : ''}>
        {/* Brand Header */}
        <div
          className="sidebar-brand"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            onClose();
          }}
        >
          {/* Mithila 8-Spoke Celestial Sun SVG */}
          <svg
            className="brand-spike"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3.5" fill="currentColor" />
            <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="0.8" />
            <path d="M12 3.5V1M12 20.5v2.5M3.5 12H1M20.5 12h2.5M6 6L4 4M18 18l2 2M6 18l-2 2M18 6l2-2" />
          </svg>
          <span className="brand-text">stutosed</span>
        </div>

        {/* Navigation Links */}
        <ul className="sidebar-links">
          <li>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                onClose();
              }}
              className="sidebar-link active"
            >
              <Home width={18} height={18} />
              Home
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                const el = document.getElementById('courses-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                onClose();
              }}
              className="sidebar-link"
            >
              <BookOpen width={18} height={18} />
              Courses
            </button>
          </li>
          <li>
            <a
              href="https://t.me/bookwormislie"
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-link"
            >
              <Send width={18} height={18} />
              Telegram Help
            </a>
          </li>
        </ul>

        {/* Sidebar Stats recap */}
        <div className="sidebar-stats">
          <div className="sidebar-stat-row">
            <span className="stat-lbl">Classes Watched</span>
            <span className="stat-val">{watchedCount}</span>
          </div>
          <div className="sidebar-stat-progress">
            <div
              className="sidebar-stat-bar"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Bottom toolbar with light/dark theme switch & Account */}
        <div className="sidebar-footer">
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'light' ? (
              <Sun width={18} height={18} />
            ) : (
              <Moon width={18} height={18} />
            )}
            <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={onOpenAuth}
            className="theme-toggle-btn"
            style={{ marginTop: '8px' }}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'User'}
                style={{ width: 18, height: 18, borderRadius: '50%' }}
              />
            ) : (
              <User width={18} height={18} />
            )}
            <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || 'Sign In'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );

};
