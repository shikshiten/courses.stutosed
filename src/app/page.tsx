'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { CourseGrid } from '@/components/CourseGrid';
import { CourseModal } from '@/components/CourseModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { AuthModal } from '@/components/AuthModal';
import { INITIAL_COURSES, getTotalStats } from '@/lib/coursesData';
import { Course, LectureItem, UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Video, FileText, BookOpen, CheckCircle } from 'lucide-react';

const WATCHED_KEY = 'onafbu_watched_v1';

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Video Player state
  const [playerPlaylist, setPlayerPlaylist] = useState<LectureItem[] | null>(null);
  const [playerIndex, setPlayerIndex] = useState<number>(0);

  // Auth & Watched state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [watchedUrls, setWatchedUrls] = useState<Set<string>>(new Set());

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Initial load: Theme & Watched URLs from localStorage
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('stutosed-theme') as 'light' | 'dark') || 'light';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);

      const savedWatched = JSON.parse(localStorage.getItem(WATCHED_KEY) || '{}');
      setWatchedUrls(new Set(Object.keys(savedWatched)));
    } catch {}
  }, []);

  // Supabase User Auth listener
  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name,
            avatar_url: data.user.user_metadata?.avatar_url,
          });
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch {}
  }, []);

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('stutosed-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Mark URL as watched
  const handleMarkWatched = (url: string) => {
    setWatchedUrls((prev) => {
      const next = new Set(prev);
      next.add(url);

      try {
        const savedWatched = JSON.parse(localStorage.getItem(WATCHED_KEY) || '{}');
        savedWatched[url] = Date.now();
        localStorage.setItem(WATCHED_KEY, JSON.stringify(savedWatched));
      } catch {}

      return next;
    });
  };

  // Open Video Player
  const handlePlayVideo = (playlist: LectureItem[], index: number) => {
    setPlayerPlaylist(playlist);
    setPlayerIndex(index);
    if (playlist[index]?.url) {
      handleMarkWatched(playlist[index].url);
    }
  };

  // Open PDF
  const handleOpenPdf = (url: string) => {
    handleMarkWatched(url);
    window.open(url, '_blank');
  };

  const stats = getTotalStats();

  return (
    <div>
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        watchedCount={watchedUrls.size}
        totalVideos={stats.totalVideos}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Layout */}
      <div id="main-content-layout">
        {/* Mobile Header */}
        <MobileHeader
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onFocusSearch={() => {
            const el = document.getElementById('search-input');
            if (el) el.focus();
          }}
        />

        {/* HERO */}
        <section id="hero">
          <div className="hero-ambient"></div>
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot"></span>
              Your Complete Study Companion
            </div>
            <h1 className="hero-title">
              Study Smart.<br />
              Score <span className="hero-accent">Higher.</span>
            </h1>
            <p className="hero-lead">
              All your SSC lectures, PDFs, notes and practice sets — organized and ready.
            </p>
            <div className="hero-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  const el = document.getElementById('courses-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Browse Courses
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  const el = document.getElementById('search-input');
                  if (el) el.focus();
                }}
              >
                Quick Search
              </button>
            </div>
            <div className="hero-stats" id="hero-stats">
              <div className="hero-stat">
                <div className="stat-num">{stats.totalVideos.toLocaleString()}+</div>
                <div className="stat-label">Video Lectures</div>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <div className="stat-num">{stats.totalPDFs.toLocaleString()}+</div>
                <div className="stat-label">Resources</div>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <div className="stat-num">{stats.totalCourses}</div>
                <div className="stat-label">Courses</div>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <div className="stat-num">{watchedUrls.size}</div>
                <div className="stat-label">Watched</div>
              </div>
            </div>
          </div>
        </section>

        {/* Course Catalog Grid with Search Bar */}
        <CourseGrid
          courses={INITIAL_COURSES}
          onSelectCourse={(course) => setSelectedCourse(course)}
          searchInputRef={searchInputRef}
        />

        {/* FOOTER */}
        <footer id="site-footer">
          <div className="footer-inner">
            <div className="footer-logo">
              <svg
                className="brand-spike"
                viewBox="0 0 24 24"
                width="22"
                height="22"
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
              stutosed
            </div>
            <p className="footer-tagline">Your complete SSC preparation companion.</p>
            <p className="footer-copy">© Made by Shikshiten. All content belongs to respective educators.</p>
            <p className="footer-contact">
              For any query or problem, contact{' '}
              <a href="https://t.me/bookwormislie" target="_blank" rel="noopener noreferrer">
                @bookwormislie
              </a>{' '}
              on Telegram.
            </p>
          </div>
        </footer>
      </div>

      {/* Course View Modal */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onPlayVideo={handlePlayVideo}
          onOpenPdf={handleOpenPdf}
          watchedUrls={watchedUrls}
        />
      )}

      {/* Video Player Modal */}
      {playerPlaylist && (
        <VideoPlayer
          playlist={playerPlaylist}
          currentIndex={playerIndex}
          courseName={selectedCourse?.name || 'Lecture'}
          onClose={() => setPlayerPlaylist(null)}
          onNavigate={(newIdx) => {
            setPlayerIndex(newIdx);
            if (playerPlaylist[newIdx]?.url) {
              handleMarkWatched(playerPlaylist[newIdx].url);
            }
          }}
        />
      )}

      {/* Supabase Google Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onSignOut={async () => {
          try {
            const supabase = createClient();
            await supabase.auth.signOut();
            setUser(null);
          } catch {}
        }}
      />
    </div>
  );
}
