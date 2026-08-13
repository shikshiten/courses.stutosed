'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Course, LectureItem } from '@/types';
import { countCourseStats } from '@/lib/coursesData';

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
  onPlayVideo: (playlist: LectureItem[], index: number) => void;
  onOpenPdf: (url: string) => void;
  watchedUrls: Set<string>;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  course,
  onClose,
  onPlayVideo,
  onOpenPdf,
  watchedUrls,
}) => {
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [expandedParmarIdx, setExpandedParmarIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!course) return;
    setFilterSearch('');
    setExpandedParmarIdx(null);

    if (course.isParmar && course.parmarData) {
      const keys = Object.keys(course.parmarData);
      setActiveTabId(keys[0] || '');
    } else if (course.isPratham && course.prathamBySubject) {
      setActiveTabId('__all__');
    } else if (course.tabs && course.tabs.length > 0) {
      setActiveTabId(course.tabs[0].id);
    }

    // Auto-resume memory setup
    const memoryRaw = localStorage.getItem(`stutosed-last-lec-${course.id}`);
    if (memoryRaw) {
      try {
        const mem = JSON.parse(memoryRaw);
        if (mem.tabId) setActiveTabId(mem.tabId);
        setTimeout(() => {
          if (mem.url) {
            const el = document.querySelector(`[data-lecture-url="${CSS.escape(mem.url)}"]`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 300);
      } catch {}
    }
  }, [course]);

  const activeItems = useMemo(() => {
    if (!course) return [];
    const search = filterSearch.toLowerCase().trim();

    if (course.isPratham && course.prathamBySubject) {
      if (activeTabId === '__all__') {
        const all: LectureItem[] = [];
        Object.entries(course.prathamBySubject).forEach(([subj, items]) => {
          if (subj === 'No Topic') return;
          items.forEach((it) => all.push({ ...it, subject: subj }));
        });
        return search ? all.filter((i) => (i.label || '').toLowerCase().includes(search) || (i.subject || '').toLowerCase().includes(search)) : all;
      } else {
        const items = course.prathamBySubject[activeTabId] || [];
        return search ? items.filter((i) => (i.label || '').toLowerCase().includes(search)) : items;
      }
    }

    if (course.tabs) {
      const tab = course.tabs.find((t) => t.id === activeTabId);
      const items = tab ? tab.items : [];
      return search ? items.filter((i) => (i.label || '').toLowerCase().includes(search)) : items;
    }

    return [];
  }, [course, activeTabId, filterSearch]);

  if (!course) return null;
  const stats = countCourseStats(course);

  const saveMemory = (url: string) => {
    localStorage.setItem(
      `stutosed-last-lec-${course.id}`,
      JSON.stringify({ tabId: activeTabId, url, timestamp: Date.now() })
    );
  };

  return (
    <div id="course-overlay" className="open" role="dialog" aria-modal="true">
      {/* OVERLAY TOP BAR */}
      <div className="overlay-bar">
        <button className="btn-back" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="overlay-bar-title">{course.name}</div>
        <div className="overlay-bar-search-wrap">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="overlay-search"
            type="search"
            placeholder="Filter resources…"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
        </div>
      </div>

      {/* OVERLAY HERO STRIP */}
      <div className="overlay-hero-strip" id="overlay-hero-strip">
        <img className="overlay-thumb" src={course.thumb} alt="" loading="lazy" />
        <div className="overlay-info">
          <div className="overlay-course-name">{course.name}</div>
          <div className="overlay-course-teacher">{course.teacher} · {course.subname}</div>
          <div className="overlay-chips">
            <div className="overlay-chip">🎬 {stats.videos} Videos</div>
            <div className="overlay-chip">📄 {stats.resources} Resources</div>
          </div>
        </div>
      </div>

      {/* OVERLAY TABS */}
      <div className="overlay-tabs" id="overlay-tabs">
        {course.isParmar && course.parmarData && (
          Object.keys(course.parmarData).map((subj) => (
            <div
              key={subj}
              onClick={() => setActiveTabId(subj)}
              className={`overlay-tab ${activeTabId === subj ? 'active' : ''}`}
            >
              {subj}
            </div>
          ))
        )}

        {course.isPratham && course.prathamBySubject && (
          <>
            <div
              onClick={() => setActiveTabId('__all__')}
              className={`overlay-tab ${activeTabId === '__all__' ? 'active' : ''}`}
            >
              All Subjects
            </div>
            {Object.keys(course.prathamBySubject).map((subj) => (
              <div
                key={subj}
                onClick={() => setActiveTabId(subj)}
                className={`overlay-tab ${activeTabId === subj ? 'active' : ''}`}
              >
                {subj}
              </div>
            ))}
          </>
        )}

        {!course.isParmar && !course.isPratham && course.tabs && (
          course.tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`overlay-tab ${activeTabId === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </div>
          ))
        )}
      </div>

      {/* OVERLAY CONTENT */}
      <div className="overlay-content" id="overlay-content">
        {course.isParmar && course.parmarData ? (
          /* Parmar Accordion */
          <div className="parmar-subj-block">
            {((course.parmarData[activeTabId] || { lectures: [] }).lectures).map((lec, idx) => {
              const isOpen = expandedParmarIdx === idx;
              return (
                <div key={idx} className={`parmar-lec ${isOpen ? 'open' : ''}`}>
                  <div
                    className="parmar-lec-header"
                    onClick={() => setExpandedParmarIdx(isOpen ? null : idx)}
                  >
                    <div className="parmar-lec-name">{lec.title}</div>
                    <div className="parmar-lec-toggle">▼</div>
                  </div>
                  <div className="parmar-lec-links">
                    {Object.entries(lec.links).map(([k, url]) => {
                      const isVideo = k === 'url';
                      let btnClass = 'plk plk-watch';
                      if (k === 'en_pdf') btnClass = 'plk plk-en';
                      if (k === 'hi_pdf') btnClass = 'plk plk-hi';
                      if (k === 'quiz') btnClass = 'plk plk-quiz';
                      if (k === 'notes') btnClass = 'plk plk-dl';

                      return (
                        <button
                          key={k}
                          className={btnClass}
                          onClick={() => {
                            saveMemory(url);
                            if (isVideo) {
                              onPlayVideo([{ label: lec.title, url, type: 'hls' }], 0);
                            } else {
                              onOpenPdf(url);
                            }
                          }}
                        >
                          {isVideo ? '▶ Watch' : k.replace('_', ' ').toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Video & PDF List Rows */
          <div className="video-list">
            {activeItems.length === 0 ? (
              <div className="no-results">No resources found in this category.</div>
            ) : (
              activeItems.map((item, idx) => {
                const isWatched = watchedUrls.has(item.url);
                const isPdf = item.type === 'pdf';

                return (
                  <div
                    key={idx}
                    data-lecture-url={item.url}
                    className={`video-row ${isWatched ? 'watched' : ''}`}
                    onClick={() => {
                      saveMemory(item.url);
                      if (isPdf) {
                        onOpenPdf(item.url);
                      } else {
                        onPlayVideo(activeItems, idx);
                      }
                    }}
                  >
                    <div className="video-num">{idx + 1}</div>
                    <div className={`video-icon ${isPdf ? 'vicon-ext' : 'vicon-hls'}`}>
                      {isPdf ? '📄' : '▶'}
                    </div>
                    <div className="video-body">
                      <div className="video-title">{item.label}</div>
                      <div className="video-sub">{item.subject || course.name}</div>
                    </div>
                    <div className="watched-badge">✓ Watched</div>
                    <button className="video-play-btn">
                      <span>{isPdf ? 'Open PDF' : 'Play Video'}</span> ▶
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
