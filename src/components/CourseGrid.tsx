'use client';

import React, { useState, useMemo } from 'react';
import { Course } from '@/types';
import { countCourseStats } from '@/lib/coursesData';

interface CourseGridProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const CourseGrid: React.FC<CourseGridProps> = ({
  courses,
  onSelectCourse,
  searchInputRef,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  // Extract unique subjects
  const subjects = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => set.add(c.subject));
    return ['All', ...Array.from(set)];
  }, [courses]);

  // Filter courses based on search & subject
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSubject = selectedSubject === 'All' || c.subject === selectedSubject;
      const matchesSearch =
        search.trim() === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.subname.toLowerCase().includes(search.toLowerCase()) ||
        c.teacher.toLowerCase().includes(search.toLowerCase()) ||
        c.subject.toLowerCase().includes(search.toLowerCase());
      return matchesSubject && matchesSearch;
    });
  }, [courses, selectedSubject, search]);

  return (
    <>
      {/* SEARCH BAR */}
      <div id="search-bar">
        <div className="search-wrap">
          <svg className="search-icon-el" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={searchInputRef}
            id="search-input"
            type="search"
            placeholder="Search courses, topics, subjects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {/* COURSES GRID SECTION */}
      <section id="courses-section">
        <div className="section-head">
          <div className="section-tag">All Courses</div>
          <h2 className="section-title">Pick Your Subject</h2>
          <p className="section-sub">Curated batches from expert educators</p>

          {/* Subject Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`tag ${selectedSubject === subj ? 'tag-vid' : 'tag-mix'}`}
                style={{
                  cursor: 'pointer',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: selectedSubject === subj ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: selectedSubject === subj ? 'var(--accent)' : 'var(--bg-card)',
                  color: selectedSubject === subj ? '#fff' : 'var(--text-muted)',
                }}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        <div className="courses-grid" id="courses-grid">
          {filteredCourses.length === 0 ? (
            <div className="no-results-grid">
              No courses found matching your search.
            </div>
          ) : (
            filteredCourses.map((course) => {
              const stats = countCourseStats(course);
              return (
                <div
                  key={course.id}
                  className="course-card"
                  onClick={() => onSelectCourse(course)}
                >
                  <img
                    className="course-thumb"
                    src={course.thumb}
                    alt={course.name}
                    loading="lazy"
                  />
                  <div className="course-body">
                    <div className="course-tags">
                      <span className="tag tag-vid">{stats.videos} VIDEOS</span>
                      <span className="tag tag-pdf">{stats.resources} PDFS</span>
                    </div>
                    <h3 className="course-name">{course.name}</h3>
                    <div className="course-teacher">{course.teacher}</div>
                    <div className="course-meta">{course.subname}</div>
                    <div className="course-open-hint">
                      Open Course →
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
};
