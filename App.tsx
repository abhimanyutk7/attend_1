
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, BookOpen, CheckSquare, Award, Bell, Download } from 'lucide-react';
import Timetable from './components/Timetable';
import Attendance from './components/Attendance';
import Assignments from './components/Assignments';
import GPA from './components/GPA';
import { Tab, DaySchedule, AttendanceRecord, Assignment, GradeEntry } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TIMETABLE);
  
  // Persistent State
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => {
    const saved = localStorage.getItem('campusMate_schedule');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('campusMate_attendance');
    return saved ? JSON.parse(saved) : [];
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('campusMate_assignments');
    return saved ? JSON.parse(saved) : [];
  });

  const [grades, setGrades] = useState<GradeEntry[]>(() => {
    const saved = localStorage.getItem('campusMate_grades');
    return saved ? JSON.parse(saved) : [];
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Effects to save to localStorage
  useEffect(() => localStorage.setItem('campusMate_schedule', JSON.stringify(schedule)), [schedule]);
  useEffect(() => localStorage.setItem('campusMate_attendance', JSON.stringify(attendanceRecords)), [attendanceRecords]);
  useEffect(() => localStorage.setItem('campusMate_assignments', JSON.stringify(assignments)), [assignments]);
  useEffect(() => localStorage.setItem('campusMate_grades', JSON.stringify(grades)), [grades]);

  // Extract unique subjects for Assignments dropdown
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    schedule.forEach(day => {
      day.periods.forEach(period => {
        if (period.subject && period.subject.trim().length > 0) {
          subjects.add(period.subject.trim());
        }
      });
    });
    return Array.from(subjects).sort();
  }, [schedule]);

  // Sync logic - Moved to a handler to prevent auto-restoring deleted subjects on reload
  const handleUpdateSchedule = (newSchedule: DaySchedule[]) => {
    setSchedule(newSchedule);

    const subjectsFromTimetable = new Set<string>();
    newSchedule.forEach(day => {
      day.periods.forEach(period => {
        const name = period.subject?.trim();
        if (name && !['lunch', 'break', 'recess', 'leisure', 'free'].includes(name.toLowerCase())) {
          subjectsFromTimetable.add(name);
        }
      });
    });

    if (subjectsFromTimetable.size === 0) return;

    setAttendanceRecords(prevRecords => {
      const existingSubjects = new Set(prevRecords.map(r => r.subject.toLowerCase()));
      const newRecords = [...prevRecords];
      let hasChanges = false;

      subjectsFromTimetable.forEach(subjectName => {
        if (!existingSubjects.has(subjectName.toLowerCase())) {
          newRecords.push({
            id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            subject: subjectName,
            attended: 0,
            total: 0,
            targetPercentage: 75,
          });
          existingSubjects.add(subjectName.toLowerCase());
          hasChanges = true;
        }
      });

      return hasChanges ? newRecords : prevRecords;
    });
  };

  // PWA Install Logic
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    });
  };

  // Notifications Logic
  const lastNotifiedRef = useRef<Set<string>>(new Set<string>());
  
  // Initialize Set lazily once
  useEffect(() => {
     const saved = localStorage.getItem('campusMate_notified_ids');
     if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach((id: string) => lastNotifiedRef.current.add(id));
     }
  }, []);

  // Helper to persist notification state
  const markAsNotified = (id: string) => {
      lastNotifiedRef.current.add(id);
      localStorage.setItem('campusMate_notified_ids', JSON.stringify(Array.from(lastNotifiedRef.current)));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkReminders = () => {
      const now = new Date();
      
      // --- 1. Class Reminders (Existing Logic) ---
      if (schedule.length > 0) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const currentDayName = days[now.getDay()];
        const todaySchedule = schedule.find(s => s.day.toLowerCase() === currentDayName.toLowerCase());

        if (todaySchedule) {
          todaySchedule.periods.forEach(period => {
            const timeMatch = period.time.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              let hours = parseInt(timeMatch[1], 10);
              const minutes = parseInt(timeMatch[2], 10);
              
              if (hours < 7) hours += 12; 
              if (period.time.toLowerCase().includes('pm') && hours !== 12) hours += 12;

              const classTime = new Date();
              classTime.setHours(hours, minutes, 0, 0);

              const diffMs = classTime.getTime() - now.getTime();
              const diffMins = diffMs / (1000 * 60);

              if (diffMins > 28 && diffMins <= 30) {
                const notificationId = `class-${currentDayName}-${period.subject}-${period.time}-${now.toDateString()}`;
                
                if (!lastNotifiedRef.current.has(notificationId)) {
                   new Notification(`Class Reminder: ${period.subject}`, {
                     body: `Starts in 30 minutes (${period.time}) at ${period.location || 'Classroom'}`,
                     icon: '/favicon.ico' 
                   });
                   markAsNotified(notificationId);
                }
              }
            }
          });
        }
      }

      // --- 2. Assignment Reminders (Updated Custom Logic) ---
      if (assignments.length > 0) {
        assignments.forEach(assignment => {
          if (assignment.completed) return;
          
          // 2a. Custom Reminder Check
          if (assignment.reminderTime) {
              const reminderTime = new Date(assignment.reminderTime);
              // Unique key for this specific reminder setting
              const notifKey = `remind-${assignment.id}-${assignment.reminderTime}`;

              // If current time is past the reminder time, AND we haven't notified yet
              if (now >= reminderTime && !lastNotifiedRef.current.has(notifKey)) {
                  const timeString = new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateString = new Date(assignment.dueDate).toLocaleDateString();
                  
                  new Notification(`Assignment Reminder: ${assignment.title}`, {
                      body: `Due on ${dateString} at ${timeString}`,
                      icon: '/favicon.ico'
                  });
                  markAsNotified(notifKey);
              }
          } 
          // 2b. Fallback: Default 24h check if NO custom reminder set
          else {
              const dueDate = new Date(assignment.dueDate);
              const diffMs = dueDate.getTime() - now.getTime();
              const diffHours = diffMs / (1000 * 60 * 60);

              if (diffHours > 0 && diffHours <= 24) {
                 const notifKey = `assign-${assignment.id}-24h`;
                 if (!lastNotifiedRef.current.has(notifKey)) {
                    const timeString = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    new Notification(`Assignment Due Soon!`, {
                       body: `${assignment.title} is due tomorrow at ${timeString}.`,
                       icon: '/favicon.ico'
                    });
                    markAsNotified(notifKey);
                 }
              }
          }
        });
      }
    };

    // Check immediately then every 30 seconds
    checkReminders();
    const intervalId = setInterval(checkReminders, 30 * 1000); 
    return () => clearInterval(intervalId);
  }, [schedule, assignments, notificationsEnabled]);


  return (
    <div className="bg-gray-50 font-sans text-gray-900 h-[100dvh] w-full overflow-hidden flex justify-center">
      {/* Mobile App Container */}
      <main className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Top Bar */}
        <header className="px-6 pt-6 pb-4 bg-white border-b border-gray-50 flex justify-between items-center flex-none z-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-indigo-900">CampusMate 🇮🇳</h1>
            <p className="text-xs text-gray-400">Your smart college organizer</p>
          </div>
          <div className="flex gap-2">
             {installPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors animate-pulse"
                  title="Install App"
                >
                  <Download className="w-5 h-5" />
                </button>
             )}
             {!notificationsEnabled && (
                <button 
                  onClick={requestNotificationPermission}
                  className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  title="Enable Class Reminders"
                >
                  <Bell className="w-5 h-5" />
                </button>
             )}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar relative">
          {activeTab === Tab.TIMETABLE && (
            <Timetable schedule={schedule} onUpdateSchedule={handleUpdateSchedule} />
          )}
          {activeTab === Tab.ATTENDANCE && (
            <Attendance records={attendanceRecords} onUpdateRecords={setAttendanceRecords} />
          )}
          {activeTab === Tab.ASSIGNMENTS && (
            <Assignments 
              assignments={assignments} 
              onUpdateAssignments={setAssignments} 
              subjects={uniqueSubjects}
            />
          )}
          {activeTab === Tab.GPA && (
            <GPA grades={grades} onUpdateGrades={setGrades} />
          )}
        </div>

        {/* Bottom Navigation */}
        <nav className="bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center flex-none z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setActiveTab(Tab.TIMETABLE)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.TIMETABLE ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Calendar className={`w-6 h-6 ${activeTab === Tab.TIMETABLE ? 'fill-indigo-100' : ''}`} />
            <span className="text-[10px] font-medium">Timetable</span>
          </button>
          
          <button
            onClick={() => setActiveTab(Tab.ATTENDANCE)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.ATTENDANCE ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <BookOpen className={`w-6 h-6 ${activeTab === Tab.ATTENDANCE ? 'fill-indigo-100' : ''}`} />
            <span className="text-[10px] font-medium">Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab(Tab.ASSIGNMENTS)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.ASSIGNMENTS ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <CheckSquare className={`w-6 h-6 ${activeTab === Tab.ASSIGNMENTS ? 'fill-indigo-100' : ''}`} />
            <span className="text-[10px] font-medium">Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab(Tab.GPA)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.GPA ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Award className={`w-6 h-6 ${activeTab === Tab.GPA ? 'fill-indigo-100' : ''}`} />
            <span className="text-[10px] font-medium">GPA</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default App;
