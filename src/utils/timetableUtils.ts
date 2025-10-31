import { Timetable } from '../types';

// Convert HH:MM to minutes since midnight
export const timeToMinutes = (t: string) => {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
};

// Determine overlap between two [start,end) intervals in HH:MM
export const timesOverlap = (startA: string, endA: string, startB: string, endB: string) => {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
};

export interface ConflictCheckInput {
  candidate: Pick<Timetable,'courseCode'|'subjectCode'|'lecturerId'|'day'|'startTime'|'endTime'|'venue'|'semester'|'year'>;
  existing: Timetable[];
  excludeId?: string; // ignore this id (editing scenario)
}

export interface ConflictResult {
  localClashes: string[]; // clashes within same course (subject, venue, lecturer)
  crossCourse: string[];  // clashes across different courses (lecturer, venue)
  hasConflicts: boolean;
}

export const findTimetableConflicts = ({ candidate, existing, excludeId }: ConflictCheckInput): ConflictResult => {
  const localClashes: string[] = [];
  const crossCourse: string[] = [];

  existing.forEach(e => {
    if (excludeId && e.id === excludeId) return;
    if (e.day !== candidate.day) return;
    if (e.year !== candidate.year) return;
    if (e.semester !== candidate.semester) return;
    if (!timesOverlap(candidate.startTime, candidate.endTime, e.startTime, e.endTime)) return;

    const sameCourse = e.courseCode === candidate.courseCode;

    if (sameCourse) {
      if (e.venue === candidate.venue) {
        localClashes.push(`Venue clash with ${e.courseCode} ${e.subjectName} (${e.startTime}-${e.endTime}) at ${e.venue}`);
      }
      if (e.subjectCode === candidate.subjectCode) {
        localClashes.push(`Subject ${e.subjectCode} already scheduled (${e.startTime}-${e.endTime})`);
      }
      if (candidate.lecturerId && e.lecturerId === candidate.lecturerId) {
        localClashes.push(`Lecturer already teaching ${e.subjectName} (${e.startTime}-${e.endTime})`);
      }
    } else { // cross-course
      if (e.venue === candidate.venue) {
        crossCourse.push(`Venue ${e.venue} in use by ${e.courseCode} ${e.subjectName} (${e.startTime}-${e.endTime})`);
      }
      if (candidate.lecturerId && e.lecturerId === candidate.lecturerId) {
        crossCourse.push(`Lecturer occupied by ${e.courseCode} ${e.subjectName} (${e.startTime}-${e.endTime})`);
      }
    }
  });

  return { localClashes, crossCourse, hasConflicts: localClashes.length>0 || crossCourse.length>0 };
};
