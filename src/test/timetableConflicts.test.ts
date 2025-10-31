import { describe, it, expect } from 'vitest';
import { findTimetableConflicts, timesOverlap } from '../utils/timetableUtils';
import type { Timetable } from '../types';

const baseEntry = (overrides: Partial<Timetable>): Timetable => ({
  id: overrides.id || Math.random().toString(36).slice(2),
  courseCode: 'COURSE1',
  courseName: 'Course 1',
  subjectCode: 'SUB1',
  subjectName: 'Subject 1',
  lecturerId: 'L1',
  lecturerName: 'Lect One',
  day: 'Monday',
  startTime: '08:00',
  endTime: '09:00',
  venue: 'A101',
  type: 'lecture',
  semester: 1,
  year: 2025,
  createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date(0) } as unknown as Timetable['createdAt'],
  updatedAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date(0) } as unknown as Timetable['updatedAt'],
  ...overrides
});

describe('timesOverlap', () => {
  it('detects overlapping intervals', () => {
    expect(timesOverlap('08:00','09:00','08:30','09:30')).toBe(true);
  });
  it('detects non-overlapping intervals', () => {
    expect(timesOverlap('08:00','09:00','09:00','10:00')).toBe(false);
  });
});

describe('findTimetableConflicts', () => {
  const existing: Timetable[] = [
    baseEntry({ id: 'e1', subjectCode: 'SUB1', startTime: '08:00', endTime: '09:00', venue: 'A101' }),
    baseEntry({ id: 'e2', subjectCode: 'SUB2', startTime: '09:00', endTime: '10:00', venue: 'A102' }),
    baseEntry({ id: 'e3', courseCode: 'COURSE2', subjectCode: 'SUB9', startTime: '08:30', endTime: '09:30', venue: 'A201', lecturerId: 'L2' })
  ];

  it('reports local clashes (same course)', () => {
    const result = findTimetableConflicts({
      candidate: {
        courseCode: 'COURSE1',
        subjectCode: 'SUB1',
        lecturerId: 'L1',
        day: 'Monday',
        startTime: '08:30',
        endTime: '09:30',
        venue: 'A101',
        semester: 1,
        year: 2025
      },
      existing
    });
    expect(result.localClashes.length).toBeGreaterThan(0);
    expect(result.hasConflicts).toBe(true);
  });

  it('reports cross-course venue & lecturer clashes', () => {
    const result = findTimetableConflicts({
      candidate: {
        courseCode: 'COURSE3',
        subjectCode: 'SUBX',
        lecturerId: 'L2',
        day: 'Monday',
        startTime: '08:45',
        endTime: '09:15',
        venue: 'A201',
        semester: 1,
        year: 2025
      },
      existing
    });
    expect(result.crossCourse.length).toBeGreaterThan(0);
    expect(result.localClashes.length).toBe(0);
    expect(result.hasConflicts).toBe(true);
  });

  it('ignores excluded id while editing', () => {
    const result = findTimetableConflicts({
      candidate: {
        courseCode: 'COURSE1',
        subjectCode: 'SUB1',
        lecturerId: 'L1',
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        venue: 'A101',
        semester: 1,
        year: 2025
      },
      existing,
      excludeId: 'e1'
    });
    expect(result.hasConflicts).toBe(false);
  });
});
