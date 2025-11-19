import React, { useState, useMemo } from 'react';
import { Plus, Minus, CheckCircle, Trash2, Edit3, X, PieChart as PieChartIcon, AlertTriangle, CheckSquare } from 'lucide-react';
import { AttendanceRecord } from '../types';

interface AttendanceProps {
  records: AttendanceRecord[];
  onUpdateRecords: (records: AttendanceRecord[]) => void;
}

const Attendance: React.FC<AttendanceProps> = ({ records, onUpdateRecords }) => {
  const [newSubject, setNewSubject] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ subject: string; attended: number; total: number }>({ subject: '', attended: 0, total: 0 });
  const [showReport, setShowReport] = useState(false);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      subject: newSubject,
      attended: 0,
      total: 0,
      targetPercentage: 75,
    };
    onUpdateRecords([...records, newRecord]);
    setNewSubject('');
  };

  const updateAttendance = (id: string, type: 'present' | 'absent') => {
    const updated = records.map(record => {
      if (record.id !== id) return record;
      if (type === 'present') {
        return { ...record, attended: record.attended + 1, total: record.total + 1 };
      } else if (type === 'absent') {
        return { ...record, total: record.total + 1 };
      }
      return record;
    });
    onUpdateRecords(updated);
  };

  const startEditing = (e: React.MouseEvent, record: AttendanceRecord) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingId(record.id);
      setEditForm({ subject: record.subject, attended: record.attended, total: record.total });
  };

  const saveEdit = () => {
      if (!editingId) return;
      const updated = records.map(r => r.id === editingId ? { ...r, ...editForm } : r);
      onUpdateRecords(updated);
      setEditingId(null);
  };

  const deleteSubject = (id: string) => {
      // Removed window.confirm to prevent blocking issues
      const updatedRecords = records.filter(r => r.id !== id);
      onUpdateRecords(updatedRecords);
      if (editingId === id) {
          setEditingId(null);
      }
  }

  const getPercentage = (attended: number, total: number) => {
    if (total === 0) return 100;
    return Math.round((attended / total) * 100);
  };

  const getStatusColor = (pct: number, target: number) => {
    if (pct >= target) return 'bg-emerald-500'; 
    if (pct >= target - 10) return 'bg-amber-500'; 
    return 'bg-red-500'; 
  };

  const getStatusTextColor = (pct: number, target: number) => {
    if (pct >= target) return 'text-emerald-600'; 
    if (pct >= target - 10) return 'text-amber-600'; 
    return 'text-red-600'; 
  };

  const calculateBunkStats = (attended: number, total: number, target: number) => {
      if (total === 0) return { message: "No classes", color: "text-gray-400", bg: "bg-gray-100" };
      
      const currentPct = (attended / total) * 100;
      const targetRatio = target / 100;

      if (currentPct >= target) {
          const safeToBunk = Math.floor((attended / targetRatio) - total);
          if (safeToBunk <= 0) return { message: "Don't miss!", color: "text-amber-700", bg: "bg-amber-50" };
          return { message: `Can bunk: ${safeToBunk}`, color: "text-emerald-700", bg: "bg-emerald-50" };
      } else {
          const needed = Math.ceil(((targetRatio * total) - attended) / (1 - targetRatio));
          return { message: `Attend next: ${needed}`, color: "text-red-700", bg: "bg-red-50" };
      }
  };

  const overallStats = useMemo(() => {
      const totalClasses = records.reduce((acc, r) => acc + r.total, 0);
      const totalAttended = records.reduce((acc, r) => acc + r.attended, 0);
      const overallPct = totalClasses === 0 ? 100 : Math.round((totalAttended / totalClasses) * 100);
      const safeSubjects = records.filter(r => getPercentage(r.attended, r.total) >= r.targetPercentage).length;
      const dangerSubjects = records.length - safeSubjects;
      return { totalClasses, totalAttended, overallPct, safeSubjects, dangerSubjects };
  }, [records]);

  return (
    <div className="space-y-6 pb-24 relative">
       {/* Header Card */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Attendance</h2>
                <p className="text-gray-500 text-xs mt-1">
                    Track your 75% requirement
                </p>
            </div>
            <button 
                type="button"
                onClick={() => setShowReport(true)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
            >
                <PieChartIcon className="w-4 h-4" /> Report
            </button>
        </div>
        
        <form onSubmit={handleAddSubject} className="flex gap-2">
            <input
                type="text"
                placeholder="Add Subject Name..."
                className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 text-sm"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
            />
            <button type="submit" className="bg-gray-900 text-white px-4 py-3 rounded-xl font-medium hover:bg-black transition-colors shadow-lg">
                <Plus className="w-5 h-5" />
            </button>
        </form>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {records.map(record => {
            const percentage = getPercentage(record.attended, record.total);
            const progressColor = getStatusColor(percentage, record.targetPercentage);
            const textColor = getStatusTextColor(percentage, record.targetPercentage);
            const bunkStats = calculateBunkStats(record.attended, record.total, record.targetPercentage);
            
            return (
                <div key={record.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative transition-all hover:shadow-md group">
                    
                    {/* Top Row: Title & Tools */}
                    <div className="flex justify-between items-start mb-3 relative z-10">
                        <h3 className="font-bold text-lg text-gray-900 truncate pr-2 flex-1 leading-tight">{record.subject}</h3>
                        
                        <div className="flex items-center gap-2">
                            {/* Edit Button */}
                            <button 
                                type="button"
                                onClick={(e) => startEditing(e, record)} 
                                className="p-2.5 bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            
                            {/* Delete Button - Direct Action */}
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteSubject(record.id);
                                }} 
                                className="p-2.5 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all z-20 active:scale-95 active:bg-red-200 cursor-pointer"
                                aria-label="Delete subject"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Stats Badges */}
                    <div className="flex items-center justify-between mb-3">
                         <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-black ${textColor} tracking-tight`}>
                                {percentage}%
                            </span>
                            <span className="text-xs text-gray-400 font-medium">/ 75%</span>
                        </div>
                        <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${bunkStats.bg} ${bunkStats.color} border border-transparent`}>
                            {bunkStats.message}
                        </div>
                    </div>

                    {/* Linear Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden relative">
                        {/* 75% Marker */}
                        <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-gray-300 z-10" title="75% Target"></div>
                        <div 
                            className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            type="button"
                            onClick={() => updateAttendance(record.id, 'present')}
                            className="flex flex-col items-center justify-center py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors active:scale-95 border border-emerald-100"
                        >
                            <span className="flex items-center gap-1.5 font-bold text-sm">
                                <CheckCircle className="w-4 h-4" /> Present
                            </span>
                            <span className="text-[10px] opacity-70 font-medium mt-0.5">
                                {record.attended} / {record.total}
                            </span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => updateAttendance(record.id, 'absent')}
                            className="flex flex-col items-center justify-center py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors active:scale-95 border border-red-100"
                        >
                             <span className="flex items-center gap-1.5 font-bold text-sm">
                                <Minus className="w-4 h-4" /> Absent
                            </span>
                            <span className="text-[10px] opacity-70 font-medium mt-0.5">
                                Missed: {record.total - record.attended}
                            </span>
                        </button>
                    </div>
                </div>
            );
        })}
        
        {records.length === 0 && (
             <div className="text-center py-10 px-6 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No subjects yet</p>
                <p className="text-xs text-gray-400 mt-1">Add manually or upload your timetable</p>
            </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Edit Details</h3>
                    <button 
                        type="button"
                        onClick={() => setEditingId(null)} 
                        className="p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2 ml-1">Subject Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-100"
                            value={editForm.subject}
                            onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2 ml-1">Attended</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-100"
                                    value={editForm.attended}
                                    onChange={(e) => setEditForm({...editForm, attended: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2 ml-1">Total</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-100"
                                    value={editForm.total}
                                    onChange={(e) => setEditForm({...editForm, total: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        type="button"
                        onClick={saveEdit} 
                        className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 mt-2"
                    >
                        Save Changes
                    </button>

                    <button 
                        type="button"
                        onClick={() => deleteSubject(editingId)}
                        className="w-full py-3.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 border border-red-100 mt-2 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Subject
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Weekly Report Modal */}
      {showReport && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl max-h-[80vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-indigo-600" /> Report
                    </h3>
                    <button 
                        type="button"
                        onClick={() => setShowReport(false)} 
                        className="p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    {/* Overall Score */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-lg text-center">
                        <p className="text-indigo-100 text-sm font-medium mb-1">Overall Attendance</p>
                        <div className="text-5xl font-black tracking-tight mb-2">{overallStats.overallPct}%</div>
                        <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                            {overallStats.totalAttended} / {overallStats.totalClasses} Classes
                        </div>
                    </div>

                    {/* Summary Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                            <div className="text-2xl font-bold text-emerald-700">{overallStats.safeSubjects}</div>
                            <div className="text-xs font-medium text-emerald-600">Safe Subjects</div>
                        </div>
                         <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                            <div className="text-2xl font-bold text-red-700">{overallStats.dangerSubjects}</div>
                            <div className="text-xs font-medium text-red-600">Below 75%</div>
                        </div>
                    </div>

                    {/* Critical List */}
                    {overallStats.dangerSubjects > 0 && (
                        <div className="mt-2">
                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-500" /> Action Required
                            </h4>
                            <div className="space-y-2">
                                {records
                                    .filter(r => getPercentage(r.attended, r.total) < r.targetPercentage)
                                    .map(r => {
                                        const stats = calculateBunkStats(r.attended, r.total, r.targetPercentage);
                                        return (
                                            <div key={r.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm">
                                                <div className="flex justify-between font-bold text-gray-800 mb-1">
                                                    <span>{r.subject}</span>
                                                    <span className="text-red-600">{getPercentage(r.attended, r.total)}%</span>
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                    {stats.message} to recover
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Attendance;