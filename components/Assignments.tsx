import React, { useState } from 'react';
import { Calendar, Plus, Check, Clock, Trash, Bell, AlertCircle } from 'lucide-react';
import { Assignment } from '../types';
import { format, parseISO, isPast, isToday, isTomorrow, subMinutes, subHours, subDays, subWeeks, isValid } from 'date-fns';

interface AssignmentsProps {
  assignments: Assignment[];
  onUpdateAssignments: (assignments: Assignment[]) => void;
  subjects: string[];
}

const Assignments: React.FC<AssignmentsProps> = ({ assignments, onUpdateAssignments, subjects }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  // Reminder State
  const [reminderType, setReminderType] = useState('24h'); // Default to 1 day before
  const [customReminderTime, setCustomReminderTime] = useState('');

  const addAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    // Combine date and time
    const dueDateTimeStr = time ? `${date}T${time}` : `${date}T23:59`;
    const dueDateObj = new Date(dueDateTimeStr);

    // Calculate Reminder Time
    let reminderTimeStr: string | undefined = undefined;

    if (reminderType !== 'none') {
        let reminderDate: Date | null = null;
        
        if (reminderType === '1h') reminderDate = subHours(dueDateObj, 1);
        else if (reminderType === '24h') reminderDate = subDays(dueDateObj, 1);
        else if (reminderType === '1w') reminderDate = subWeeks(dueDateObj, 1);
        else if (reminderType === 'custom' && customReminderTime) {
            reminderDate = new Date(customReminderTime);
        }

        if (reminderDate && isValid(reminderDate)) {
            reminderTimeStr = reminderDate.toISOString();
        }
    }

    const newAssignment: Assignment = {
      id: Date.now().toString(),
      title,
      subject,
      dueDate: dueDateTimeStr,
      completed: false,
      reminderTime: reminderTimeStr
    };

    onUpdateAssignments([...assignments, newAssignment].sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    ));
    
    // Reset Form
    setTitle('');
    setSubject('');
    setDate('');
    setTime('');
    setReminderType('24h');
    setCustomReminderTime('');
  };

  const toggleComplete = (id: string) => {
    const updated = assignments.map(a => a.id === id ? { ...a, completed: !a.completed } : a);
    onUpdateAssignments(updated);
  };

  const deleteAssignment = (id: string) => {
      onUpdateAssignments(assignments.filter(a => a.id !== id));
  }

  const getDueDateBadge = (dateStr: string, completed: boolean) => {
    if (completed) return <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Done</span>;
    
    const date = parseISO(dateStr);
    const timeStr = format(date, 'h:mm a');
    
    if (isPast(date) && !isToday(date)) return <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">Overdue</span>;
    if (isToday(date)) return <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold">Today, {timeStr}</span>;
    if (isTomorrow(date)) return <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">Tmrw, {timeStr}</span>;
    
    return <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium">{format(date, 'MMM d')} • {timeStr}</span>;
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">New Assignment</h2>
        <form onSubmit={addAssignment} className="flex flex-col gap-3">
            <input
                type="text"
                placeholder="Assignment Title"
                className="px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
            
            <div className="relative">
                <input
                    list="subjects-list"
                    type="text"
                    placeholder="Subject (Optional)"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                />
                <datalist id="subjects-list">
                    {subjects.map((s, i) => <option key={i} value={s} />)}
                </datalist>
            </div>

            <div className="flex gap-3">
                <input
                    type="date"
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 text-sm"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />
                 <input
                    type="time"
                    className="w-28 px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 text-sm"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                />
            </div>

            {/* Reminder Settings */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase">Set Reminder</span>
                </div>
                <select
                    className="w-full bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value)}
                >
                    <option value="none">No Notification</option>
                    <option value="1h">1 Hour Before Due Date</option>
                    <option value="24h">1 Day Before Due Date</option>
                    <option value="1w">1 Week Before Due Date</option>
                    <option value="custom">Pick Custom Date & Time</option>
                </select>

                {reminderType === 'custom' && (
                    <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                        <input 
                            type="datetime-local"
                            className="w-full bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={customReminderTime}
                            onChange={(e) => setCustomReminderTime(e.target.value)}
                            required={reminderType === 'custom'}
                        />
                    </div>
                )}
            </div>

            <button type="submit" className="mt-2 w-full bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                <Plus className="w-4 h-4" /> Create Task
            </button>
        </form>
      </div>

      <div className="space-y-3">
        {assignments.map(assignment => (
            <div key={assignment.id} className={`bg-white p-4 rounded-2xl shadow-sm border flex items-start gap-4 transition-all ${assignment.completed ? 'opacity-60 border-gray-100' : 'border-gray-100 hover:border-indigo-200'}`}>
                <button 
                    onClick={() => toggleComplete(assignment.id)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${assignment.completed ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 hover:border-indigo-400'}`}
                >
                    {assignment.completed && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className={`font-medium text-gray-900 truncate leading-tight ${assignment.completed ? 'line-through text-gray-500' : ''}`}>
                            {assignment.title}
                        </h3>
                        <button onClick={() => deleteAssignment(assignment.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-2">
                            <Trash className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {assignment.subject && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-medium">{assignment.subject}</span>}
                        
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            {getDueDateBadge(assignment.dueDate, assignment.completed)}
                        </div>

                        {assignment.reminderTime && !assignment.completed && (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full" title={`Reminder set for: ${new Date(assignment.reminderTime).toLocaleString()}`}>
                                <Bell className="w-3 h-3" />
                                <span>
                                    {format(parseISO(assignment.reminderTime), 'MMM d, h:mm a')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ))}
         {assignments.length === 0 && (
             <div className="text-center py-10 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No pending assignments.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;