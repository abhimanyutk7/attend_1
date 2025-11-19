import React, { useState, useEffect } from 'react';
import { GradeEntry } from '../types';
import { Plus, Trash2, GraduationCap, RotateCcw } from 'lucide-react';
import { getStudyTip } from '../services/geminiService';

interface GPAProps {
  grades: GradeEntry[];
  onUpdateGrades: (grades: GradeEntry[]) => void;
}

const GPA: React.FC<GPAProps> = ({ grades, onUpdateGrades }) => {
  const [subject, setSubject] = useState('');
  const [credits, setCredits] = useState<number | ''>('');
  const [gradePoints, setGradePoints] = useState<number | ''>('');
  const [gpa, setGpa] = useState<number>(0);
  const [tip, setTip] = useState<string>("");

  useEffect(() => {
    calculateGPA();
  }, [grades]);

  const calculateGPA = () => {
    if (grades.length === 0) {
      setGpa(0);
      return;
    }
    const totalPoints = grades.reduce((sum, g) => sum + (g.gradePoints * g.credits), 0);
    const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
    
    if (totalCredits === 0) {
      setGpa(0);
    } else {
      setGpa(parseFloat((totalPoints / totalCredits).toFixed(2)));
    }
  };

  const addGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || credits === '' || gradePoints === '') return;

    const newGrade: GradeEntry = {
      id: Date.now().toString(),
      subject,
      credits: Number(credits),
      gradePoints: Number(gradePoints)
    };

    onUpdateGrades([...grades, newGrade]);
    
    if (Number(gradePoints) < 8) {
        const t = await getStudyTip(subject);
        setTip(t);
    } else {
        setTip("Great job! Keep maintaining that high performance.");
    }

    setSubject('');
    setCredits('');
    setGradePoints('');
  };

  const removeGrade = (id: string) => {
      onUpdateGrades(grades.filter(g => g.id !== id));
  };

  const reset = () => {
      if(window.confirm("Clear all grades?")) {
          onUpdateGrades([]);
          setTip("");
      }
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <GraduationCap className="w-32 h-32" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">GPA Calculator</h2>
        <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-black text-indigo-600">{gpa}</span>
            <span className="text-gray-500 font-medium">/ 10.0</span>
        </div>
        <p className="text-sm text-gray-400 mt-1">Calculated based on {grades.length} subjects</p>
        
        {tip && (
            <div className="mt-4 p-3 bg-indigo-50 text-indigo-800 text-sm rounded-xl border border-indigo-100 italic">
                " {tip} "
            </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
         <h3 className="font-semibold text-gray-800 mb-4">Add Course Grade</h3>
         <form onSubmit={addGrade} className="grid grid-cols-2 gap-3">
            <input
                type="text"
                placeholder="Subject"
                className="col-span-2 px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
                value={subject}
                onChange={e => setSubject(e.target.value)}
            />
            <input
                type="number"
                placeholder="Credits (e.g 3)"
                className="px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
                value={credits}
                onChange={e => setCredits(Number(e.target.value))}
                min="1"
            />
            <select
                className="px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
                value={gradePoints}
                onChange={e => setGradePoints(Number(e.target.value))}
            >
                <option value="" disabled>Grade</option>
                <option value="10">O (10)</option>
                <option value="9.5">A+ (9.5)</option>
                <option value="9">A (9)</option>
                <option value="8">B+ (8)</option>
                <option value="7">B (7)</option>
                <option value="6">C (6)</option>
                <option value="5">P (5)</option>
                <option value="0">F (0)</option>
            </select>
            <button type="submit" className="col-span-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                <Plus className="w-4 h-4" /> Add Grade
            </button>
         </form>
      </div>

      <div className="space-y-3">
        {grades.map(grade => (
            <div key={grade.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                    <h4 className="font-bold text-gray-800">{grade.subject}</h4>
                    <p className="text-xs text-gray-500">
                        {grade.credits} Credits • {grade.gradePoints} Points
                    </p>
                </div>
                <button onClick={() => removeGrade(grade.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        ))}
        
        {grades.length > 0 && (
            <button onClick={reset} className="w-full py-3 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Reset Calculator
            </button>
        )}
      </div>
    </div>
  );
};

export default GPA;