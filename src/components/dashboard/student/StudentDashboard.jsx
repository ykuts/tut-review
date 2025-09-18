import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiSparkles, HiArrowRight, HiArrowPath } from 'react-icons/hi2';

// Import existing reusable components
import WelcomeHeader from '../WelcomeHeader';
import CourseCard from '../CourseCard';
import RecentActivity from '../RecentActivity';

// Import new student-specific components
import StudentStats from './StudentStats';
import StudentWeeklyProgress from './StudentWeeklyProgress';

// Import services
import coursesService from '../../../services/coursesService';
import { useAuth } from '../../../contexts/AuthContext';

const StudentDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { authProvider, logout } = useAuth();

  // State management
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Mock weekly schedule
  const weeklySchedule = [
    { day: 'Mon', completed: true, goal: 2 },
    { day: 'Tue', completed: true, goal: 2 },
    { day: 'Wed', completed: false, goal: 2 },
    { day: 'Thu', completed: false, goal: 2 },
    { day: 'Fri', completed: false, goal: 2 },
    { day: 'Sat', completed: false, goal: 1 },
    { day: 'Sun', completed: false, goal: 1 }
  ];

  // Load courses on component mount
  useEffect(() => {
    loadCoursesData();
  }, []);

  /**
   * Load courses data from API
   */
  const loadCoursesData = async () => {
    try {
      setCoursesLoading(true);
      setCoursesError(null);

      console.log('🔄 Loading student courses...');
      const result = await coursesService.getAllCourses();

      if (result.success && result.data) {
        // Transform and filter courses for student view
        const transformedCourses = result.data.map((course, index) => {
          const courseId = course.courseId || course._id || course.id;
          
          // Mock progress for demonstration
          const progress = Math.floor(Math.random() * 100);
          let status = 'not-started';
          if (progress === 100) status = 'completed';
          else if (progress > 0) status = 'in-progress';

          return {
            id: courseId,
            title: course.title,
            description: course.description,
            slug: course.slug,
            progress: progress,
            status: status,
            estimatedTime: course.estimatedTime || '4-8 hours',
            difficulty: course.difficulty || 'Beginner',
            modules: course.modules || [],
            all_chapters: course.all_chapters || [],
            created_at: course.created_at,
            updated_at: course.updated_at
          };
        });

        setCourses(transformedCourses);
        setRetryCount(0);
        console.log('✅ Student courses loaded:', transformedCourses.length);

      } else {
        throw new Error(result.message || 'No courses data received');
      }

    } catch (error) {
      console.error('❌ Failed to load student courses:', error);
      setCoursesError('Failed to load courses. Please try again.');
      setRetryCount(prev => prev + 1);
    } finally {
      setCoursesLoading(false);
    }
  };

  /**
   * Retry loading courses
   */
  const retryCourses = async () => {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    console.log(`🔄 Retrying courses load in ${delay}ms...`);

    setTimeout(() => {
      loadCoursesData();
    }, delay);
  };

  /**
   * Handle course selection
   */
  const handleCourseSelect = (course) => {
    console.log('🔍 Student selected course:', course.title);
    navigate(`/course/${course.id}`);
  };

  /**
   * Generate student statistics
   */
  const getStudentStats = () => {
    const completedCourses = courses.filter(c => c.status === 'completed').length;
    const inProgressCourses = courses.filter(c => c.status === 'in-progress').length;
    const totalHours = courses.reduce((sum, course) => {
      const hours = parseInt(course.estimatedTime) || 8;
      return sum + (hours * (course.progress / 100));
    }, 0);

    return {
      coursesCompleted: completedCourses,
      coursesInProgress: inProgressCourses,
      totalHoursLearned: Math.floor(totalHours),
      certificatesEarned: completedCourses,
      currentStreak: 7, // Mock data
      weeklyGoal: 10,
      weeklyProgress: 7
    };
  };

  /**
   * Generate recent activity
   */
  const getRecentActivity = () => {
    return courses.slice(0, 5).map((course, index) => ({
      id: `activity_${index}`,
      type: course.status === 'completed' ? 'certificate-earned' : 'chapter-completed',
      title: course.status === 'completed' ? 'Course Completed' : 'Chapter Progress',
      course: course.title,
      timestamp: `${index + 1} ${index === 0 ? 'day' : 'days'} ago`
    }));
  };

  const studentStats = getStudentStats();
  const recentActivity = getRecentActivity();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <HiSparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B6B]" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Dashboard</h1>
        </div>

        <div className="flex items-center space-x-2 text-[#FF6B6B]">
          <HiSparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium text-sm sm:text-base">{studentStats.currentStreak} day streak!</span>
        </div>
      </div>

      {/* Welcome Header */}
      <WelcomeHeader user={user} />

      {/* Stats Grid */}
      <StudentStats stats={studentStats} />

      {/* Weekly Progress */}
      <StudentWeeklyProgress 
        weeklySchedule={weeklySchedule}
        weeklyProgress={studentStats.weeklyProgress}
        weeklyGoal={studentStats.weeklyGoal}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
        {/* Continue Learning Section */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Continue Learning</h2>
            
            <div className="flex items-center space-x-2">
              {coursesError && (
                <button
                  onClick={retryCourses}
                  disabled={coursesLoading}
                  className="text-[#FF6B6B] hover:text-red-600 text-sm font-medium flex items-center disabled:opacity-50"
                >
                  <HiArrowPath className={`w-4 h-4 mr-1 ${coursesLoading ? 'animate-spin' : ''}`} />
                  Retry
                </button>
              )}
              
              <span className="text-sm text-gray-500">
                {courses.length} course{courses.length !== 1 ? 's' : ''}
              </span>
              
              <Link
                to="/courses"
                className="text-[#FF6B6B] hover:text-red-600 text-sm font-medium flex items-center"
              >
                <span className="hidden sm:inline">View All Courses</span>
                <span className="sm:hidden">View All</span>
                <HiArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {coursesLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-[#FF5F90] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading courses...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {coursesError && !coursesLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">⚠️ {coursesError}</p>
              <button
                onClick={retryCourses}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Course Grid */}
          {!coursesLoading && !coursesError && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onSelect={handleCourseSelect}
                  showDetails={true}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!coursesLoading && !coursesError && courses.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <HiSparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
              <p className="text-gray-500 mb-4">Start your learning journey with our available courses.</p>
              <Link to="/courses">
                <button className="px-6 py-3 bg-[#FF6B6B] text-white font-medium rounded-lg hover:bg-red-600 transition-colors">
                  Browse Courses
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <RecentActivity activities={recentActivity} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;