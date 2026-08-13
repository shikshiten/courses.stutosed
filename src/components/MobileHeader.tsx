'use client';

import React from 'react';
import { Menu, Search } from 'lucide-react';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
  onFocusSearch: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenSidebar,
  onFocusSearch,
}) => {
  return (
    <header id="mobile-header">
      <button className="menu-btn" onClick={onOpenSidebar} aria-label="Open menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>
      <div className="mobile-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg className="brand-spike" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3.5" fill="currentColor" />
          <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="0.8" />
          <path d="M12 3.5V1M12 20.5v2.5M3.5 12H1M20.5 12h2.5M6 6L4 4M18 18l2 2M6 18l-2 2M18 6l2-2" />
        </svg>
        stutosed
      </div>
      <button className="search-btn" onClick={onFocusSearch} aria-label="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>
    </header>
  );
};
