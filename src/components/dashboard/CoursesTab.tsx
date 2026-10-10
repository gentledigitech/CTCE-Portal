import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SystemSettings, Course, AcademicProgram, CourseType } from '../../types';
import { getCoursesByLevelAndSemester, UCC_BED_COURSES } from '../../lib/coursesData';
import {
  BookOpen,
  Calendar,
  Award,
  Layers,
  Search,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  FileText,
  Filter,
  X,
  Compass
} from 'lucide-react';

interface CoursesTabProps {
  settings: SystemSettings | null;
}

export const CoursesTab: React.FC<CoursesTabProps> = ({ settings }) => {
  const { user } = useAuth();

  const currentSemester = settings ? settings.current_semester : 1;
  const userLevel = user?.level || 100;

  // State for Level, Semester, Program, and Option filters
  const [selectedLevel, setSelectedLevel] = useState<number>(userLevel);
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(currentSemester);

  // Initialize program based on user's registered programme
  const initialProgram: AcademicProgram = useMemo(() => {
    if (!user?.programme) return 'Primary';
    const p = user.programme.toLowerCase();
    if (p.includes('early childhood')) return 'Early Childhood';
    if (p.includes('junior high') || p.includes('jhs')) return 'Junior High School';
    return 'Primary';
  }, [user]);

  const [selectedProgram, setSelectedProgram] = useState<AcademicProgram>(initialProgram);
  const [selectedOption, setSelectedOption] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Filter courses based on selections
  const filteredCourses = useMemo(() => {
    return UCC_BED_COURSES.filter((course) => {
      // Level check
      if (course.level !== selectedLevel) return false;

      // Semester check
      if (course.semester !== selectedSemester) return false;

      // Program check
      if (selectedProgram !== 'All') {
        if (course.programme !== 'All' && course.programme !== selectedProgram) {
          return false;
        }
      }

      // Option check (for JHS or Primary options)
      if (selectedOption !== 'all') {
        if (course.option && course.option.toLowerCase() !== selectedOption.toLowerCase()) {
          return false;
        }
      }

      // Type filter (Core, Elective, Major, Minor, Practicum)
      if (selectedTypeFilter !== 'all') {
        if (course.type.toLowerCase() !== selectedTypeFilter.toLowerCase()) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = course.code.toLowerCase().includes(q);
        const matchesTitle = course.title.toLowerCase().includes(q);
        const matchesDesc = course.description?.toLowerCase().includes(q) || false;
        if (!matchesCode && !matchesTitle && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [selectedLevel, selectedSemester, selectedProgram, selectedOption, selectedTypeFilter, searchQuery]);

  // Group courses into logical categories for clean arrangement
  const groupedCourses = useMemo(() => {
    const core = filteredCourses.filter((c) => c.type === 'Core');
    const major = filteredCourses.filter((c) => c.type === 'Major');
    const electiveOrMinor = filteredCourses.filter((c) => c.type === 'Elective' || c.type === 'Minor');
    const practicum = filteredCourses.filter((c) => c.type === 'Practicum');

    return { core, major, electiveOrMinor, practicum };
  }, [filteredCourses]);

  // Helper badge color by course type
  const getTypeBadgeStyle = (type: CourseType) => {
    switch (type) {
      case 'Core':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Major':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Elective':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Minor':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'Practicum':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* ----------------- TOP BANNER & ACADEMIC CONTEXT ----------------- */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-sky-100 dark:border-sky-900/40 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
                UCC Institute of Education Curriculum
              </span>
              <span className="text-stone-300 dark:text-slate-700">•</span>
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                National Teacher Education Curriculum Framework (NTECF)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
              Course Structure & Syllabus
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 max-w-2xl leading-relaxed">
              Official modular curriculum affiliated with University of Cape Coast (UCC). Arranged systematically by Year, Semester, Program, and Major Specialization.
            </p>
          </div>
        </div>

        {/* ----------------- LEVEL & SEMESTER CONTROLS ----------------- */}
        <div className="pt-2 border-t border-stone-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Level Switcher */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Academic Year / Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[100, 200, 300, 400].map((lvl) => {
                const isUserLvl = lvl === userLevel;
                const isSelected = lvl === selectedLevel;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition border text-center min-h-[42px] flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-700 to-sky-700 text-white border-sky-600 shadow-xs'
                        : 'bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Level {lvl}</span>
                    {isUserLvl && (
                      <span className={`text-[9px] font-semibold ${isSelected ? 'text-sky-200' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        (Current)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Semester Switcher */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Semester
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((sem) => {
                const isSelected = selectedSemester === sem;
                const isCurrentSem = settings?.current_semester === sem;
                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedSemester(sem as 1 | 2)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border min-h-[42px] flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-700 to-sky-700 text-white border-sky-600 shadow-xs'
                        : 'bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Semester {sem}</span>
                    {isCurrentSem && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 ml-1" title="Current Active Semester" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ----------------- PROGRAM & SPECIALIZATION SELECTORS ----------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {/* Program Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Program of Study
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value as AcademicProgram);
                setSelectedOption('all');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-stone-900 dark:text-white min-h-[44px]"
            >
              <option value="All">All Programs</option>
              <option value="Early Childhood">B.Ed. Early Childhood Education</option>
              <option value="Primary">B.Ed. Primary Education</option>
              <option value="Junior High School">B.Ed. Junior High School Education</option>
            </select>
          </div>

          {/* Subject Option / Major Filter */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Subject Option / Track
            </label>
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-stone-900 dark:text-white min-h-[44px]"
            >
              <option value="all">All Subject Areas</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science (Biology, Physics, Chemistry)</option>
              <option value="ICT">Information Communication Technology (ICT)</option>
              <option value="Technical Skills">Technical Skills (TVET, Wood, Metal, Construction)</option>
              <option value="Agricultural Science">Agricultural Science</option>
              <option value="Visual Arts">Visual Arts (Design, Leather, Graphics, Textiles)</option>
              <option value="Vocational Skills">Vocational Skills (Home Economics, Food, Clothing)</option>
              <option value="French">French Language & Literature</option>
              <option value="Social Studies">Social Studies</option>
              <option value="English Literacy">English Literacy & Literature</option>
              <option value="Ghanaian Language">Ghanaian Language & Culture</option>
              <option value="Physical Education">Physical Education & Sports</option>
              <option value="Religious and Moral Education">Religious and Moral Education (RME)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Course Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Code (e.g. EBS 101) or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs min-h-[44px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ----------------- TYPE FILTER PILLS ----------------- */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'core', label: 'Core Compulsory' },
            { id: 'major', label: 'Major Specializations' },
            { id: 'elective', label: 'Electives' },
            { id: 'minor', label: 'Minors' },
            { id: 'practicum', label: 'STS / Practicum' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedTypeFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[36px] ${
                selectedTypeFilter === pill.id
                  ? 'bg-gradient-to-r from-emerald-800 to-sky-800 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ----------------- SUMMARY STATS STRIP ----------------- */}
      <div className="grid grid-cols-2 gap-3 max-w-lg">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-4 border border-sky-100 dark:border-sky-900/40 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Courses Listed</div>
          <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">{filteredCourses.length}</div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400">Modules in view</div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-4 border border-sky-100 dark:border-sky-900/40 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">School Practicum</div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-0.5">{groupedCourses.practicum.length}</div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400">STS Field placements</div>
        </div>
      </div>

      {/* ----------------- WELL-ARRANGED COURSE SECTIONS ----------------- */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">No courses match the chosen criteria</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your subject option, search terms, or level/semester filters above to explore available courses.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: CORE COMPULSORY MODULES */}
          {groupedCourses.core.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 px-1">
                <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
                <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                  Core Compulsory Modules
                </h2>
                <span className="text-xs font-bold text-stone-500 ml-1">
                  ({groupedCourses.core.length} courses)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedCourses.core.map((course) => (
                  <CourseCard key={course.code + course.programme} course={course} badgeStyle={getTypeBadgeStyle(course.type)} />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: MAJOR / OPTION MODULES */}
          {groupedCourses.major.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 px-1">
                <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                  Major Specialization Modules
                </h2>
                <span className="text-xs font-bold text-stone-500 ml-1">
                  ({groupedCourses.major.length} courses)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedCourses.major.map((course) => (
                  <CourseCard key={course.code + course.programme + (course.option || '')} course={course} badgeStyle={getTypeBadgeStyle(course.type)} />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: ELECTIVE & MINOR MODULES */}
          {groupedCourses.electiveOrMinor.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 px-1">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                  Elective & Minor Concentrations
                </h2>
                <span className="text-xs font-bold text-stone-500 ml-1">
                  ({groupedCourses.electiveOrMinor.length} courses)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedCourses.electiveOrMinor.map((course) => (
                  <CourseCard key={course.code + course.programme + (course.option || '')} course={course} badgeStyle={getTypeBadgeStyle(course.type)} />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: SUPPORTED TEACHING IN SCHOOL (STS) / PRACTICUM */}
          {groupedCourses.practicum.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 px-1">
                <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0" />
                <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                  Supported Teaching in School (STS) Practicum
                </h2>
                <span className="text-xs font-bold text-stone-500 ml-1">
                  ({groupedCourses.practicum.length} courses)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedCourses.practicum.map((course) => (
                  <CourseCard key={course.code + course.programme} course={course} badgeStyle={getTypeBadgeStyle(course.type)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CourseCardProps {
  course: Course;
  badgeStyle: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, badgeStyle }) => {
  return (
    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-sky-100 dark:border-sky-950/60 shadow-xs hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-md transition flex flex-col justify-between">
      <div>
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              {course.code}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeStyle}`}>
              {course.type}
            </span>
            {course.option && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {course.option}
              </span>
            )}
          </div>

          <span className="font-extrabold text-xs px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-slate-800 text-sky-900 dark:text-sky-200 border border-sky-200/60 dark:border-slate-700 shrink-0">
            {course.credits} {typeof course.credits === 'number' && course.credits === 1 ? 'Credit' : 'Credits'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-stone-900 dark:text-white leading-snug mb-2">
          {course.title}
        </h3>

        {/* Description */}
        {course.description && (
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
            {course.description}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-medium">
        <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-semibold">
          <BookOpen className="w-3.5 h-3.5" /> Level {course.level} • Sem {course.semester}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          UCC IoE • NTECF
        </span>
      </div>
    </div>
  );
};
