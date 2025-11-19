export interface Period {
  time: string;
  subject: string;
  location?: string;
}

export interface DaySchedule {
  day: string;
  periods: Period[];
}

export interface AttendanceRecord {
  id: string;
  subject: string;
  attended: number;
  total: number;
  targetPercentage: number; // Usually 75
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // ISO string
  completed: boolean;
  reminderTime?: string; // ISO string for when to notify
}

export interface GradeEntry {
  id: string;
  subject: string;
  credits: number;
  gradePoints: number; // 10 for O, 9 for A+, etc.
}

export enum Tab {
  TIMETABLE = 'timetable',
  ATTENDANCE = 'attendance',
  ASSIGNMENTS = 'assignments',
  GPA = 'gpa'
}

export interface GemimiParsedTimetable {
  schedule: DaySchedule[];
}