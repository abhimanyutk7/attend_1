import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Calendar, MapPin, Clock } from 'lucide-react';
import { parseTimetableFromImage } from '../services/geminiService';
import { DaySchedule } from '../types';

interface TimetableProps {
  schedule: DaySchedule[];
  onUpdateSchedule: (schedule: DaySchedule[]) => void;
}

const Timetable: React.FC<TimetableProps> = ({ schedule, onUpdateSchedule }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const parsedSchedule = await parseTimetableFromImage(base64String);
          onUpdateSchedule(parsedSchedule);
        } catch (err) {
          setError("Failed to process image. Please try a clearer photo.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error reading file.");
      setIsUploading(false);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [selectedDay, setSelectedDay] = useState<string>(() => {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      return days.includes(today) ? today : "Monday";
  });

  // Robust day matching (handles "Monday" matching "Mon", etc.)
  const currentDaySchedule = schedule.find(s => {
      const d1 = s.day.toLowerCase();
      const d2 = selectedDay.toLowerCase();
      return d1 === d2 || d1.startsWith(d2) || d2.startsWith(d1);
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Weekly Schedule</h2>
          <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium cursor-pointer hover:bg-indigo-700 transition-colors shadow-md">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? "Analyzing..." : "Scan Timetable"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
          </label>
        </div>
        <p className="text-gray-500 text-sm">
          Upload a photo of your college timetable to automatically digitize it using AI.
        </p>
        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      </div>

      {/* Day Selector */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 px-1">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedDay === day
                ? 'bg-gray-800 text-white shadow-lg transform scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Schedule View */}
      <div className="space-y-3">
        {currentDaySchedule && currentDaySchedule.periods.length > 0 ? (
          currentDaySchedule.periods.map((period, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-start transform transition-all hover:scale-[1.01]">
              <div className="flex flex-col items-center pt-1">
                <div className="w-3 h-3 rounded-full bg-indigo-500 mb-1"></div>
                <div className="w-0.5 h-full bg-gray-100"></div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">{period.subject}</h3>
                  <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                    {period.time}
                  </span>
                </div>
                {period.location && (
                  <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{period.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Calendar className="w-12 h-12 mb-3 opacity-20" />
            <p>No classes scheduled for {selectedDay}.</p>
            <p className="text-sm">Upload a timetable to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timetable;