import React, { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import coursesService from '../services/coursesService';
import useScrollToTop from '../hooks/useScrollToTop';
import {
  HiArrowRightOnRectangle,
  HiHome,
  HiSparkles,
  HiArrowRight,
  HiExclamationTriangle,
  HiArrowPath,
  HiPlusCircle,
  HiPencil,
  HiWifi
} from 'react-icons/hi2';
import {
  FaReact,
  FaPython,
  FaJsSquare,
  FaCode,
  FaDatabase,
  FaHtml5,
  FaCss3Alt,
  FaNodeJs
} from 'react-icons/fa';

// Import dashboard components
import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import StatsGrid from '../components/dashboard/StatsGrid';
import WeeklyProgress from '../components/dashboard/WeeklyProgress';
import CourseCard from '../components/dashboard/CourseCard';
import CourseDetailView from '../components/dashboard/CourseDetailView';
import RecentActivity from '../components/dashboard/RecentActivity';

const Dashboard = () => {
  const location = useLocation();
  const { instance } = useMsal();
  const { user, isAuthenticated, authProvider, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // State for courses and API
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  const [apiHealth, setApiHealth] = useState({ isHealthy: false, lastCheck: null });
  const [retryCount, setRetryCount] = useState(0);

  // Icon mapping for courses based on title keywords
  const getIconForCourse = (courseTitle, index) => {
    const title = courseTitle.toLowerCase();
    const icons = [FaReact, FaPython, FaJsSquare, FaCode, FaDatabase, FaHtml5, FaCss3Alt, FaNodeJs];
    const colors = ['text-cyan-500', 'text-yellow-500', 'text-green-500', 'text-blue-500', 'text-purple-500', 'text-orange-500', 'text-indigo-500', 'text-red-500'];
    const bgColors = ['bg-cyan-50', 'bg-yellow-50', 'bg-green-50', 'bg-blue-50', 'bg-purple-50', 'bg-orange-50', 'bg-indigo-50', 'bg-red-50'];

    // Smart icon assignment based on course content
    if (title.includes('react')) return { icon: FaReact, color: 'text-cyan-500', bgColor: 'bg-cyan-50' };
    if (title.includes('python') || title.includes('ai')) return { icon: FaPython, color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
    if (title.includes('javascript') || title.includes('js') || title.includes('development')) return { icon: FaJsSquare, color: 'text-green-500', bgColor: 'bg-green-50' };
    if (title.includes('html')) return { icon: FaHtml5, color: 'text-orange-500', bgColor: 'bg-orange-50' };
    if (title.includes('css')) return { icon: FaCss3Alt, color: 'text-blue-500', bgColor: 'bg-blue-50' };
    if (title.includes('node')) return { icon: FaNodeJs, color: 'text-green-500', bgColor: 'bg-green-50' };
    if (title.includes('database') || title.includes('sql')) return { icon: FaDatabase, color: 'text-purple-500', bgColor: 'bg-purple-50' };
    if (title.includes('ops') || title.includes('cyber')) return { icon: FaDatabase, color: 'text-purple-500', bgColor: 'bg-purple-50' };

    // Fallback to index-based assignment
    const iconIndex = index % icons.length;
    return {
      icon: icons[iconIndex],
      color: colors[iconIndex],
      bgColor: bgColors[iconIndex]
    };
  };

  useScrollToTop({ smooth: true, delay: 100 });

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('❌ No authenticated user, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load courses data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadCoursesData();
      checkAPIHealth();
      // Set up periodic health checks
      const healthInterval = setInterval(checkAPIHealth, 60000); // Check every minute
      return () => clearInterval(healthInterval);
    }
  }, [isAuthenticated]);

  // Check if we should auto-select a course from navigation state
  useEffect(() => {
    if (location.state?.selectedCourseId && courses.length > 0) {
      const courseToSelect = courses.find(c => c.id === location.state.selectedCourseId);
      if (courseToSelect) {
        console.log('🎯 Auto-selecting course from navigation state:', courseToSelect.title);
        handleCourseSelect(courseToSelect);
        // Clear the state
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, courses]);

  /**
  * Load courses data from API with enhanced error handling - FIXED
  */
  const loadCoursesData = async () => {
    try {
      setCoursesLoading(true);
      setCoursesError(null);

      console.log(`🔄 Loading courses from API... (Attempt ${retryCount + 1})`);
      const result = await coursesService.getAllCourses();

      if (result.success && result.data) {
        // Transform API data to dashboard format with enhanced course info
        const transformedCourses = result.data.map((course, index) => {
          const iconInfo = getIconForCourse(course.title, index);

          // CRITICAL FIX: Use courseId from API response, not _id
          const courseId = course.courseId || course._id || course.id;

          if (!courseId) {
            console.warn('⚠️ Course missing ID:', course);
          }

          console.log(`🔧 Course transformation:`, {
            title: course.title,
            apiCourseId: course.courseId,
            api_id: course._id,
            apiId: course.id,
            finalId: courseId
          });

          // Calculate mock progress and status based on course data
          const hasModules = course.modules && course.modules.length > 0;
          const hasChapters = course.all_chapters && course.all_chapters.length > 0;
          const progress = hasModules || hasChapters ? Math.floor(Math.random() * 100) : 0;

          // Determine status based on progress and course data
          let status = 'not-started';
          if (progress === 100) status = 'completed';
          else if (progress > 0) status = 'in-progress';

          const transformedCourse = {
            // FIXED: Use courseId from API response
            id: courseId,
            title: course.title,
            description: course.description,
            slug: course.slug,
            icon: iconInfo.icon,
            color: iconInfo.color,
            bgColor: iconInfo.bgColor,
            progress: progress,
            totalModules: course.modules?.length || 0,
            completedModules: Math.floor((course.modules?.length || 0) * (progress / 100)),
            totalChapters: course.all_chapters?.length || 0,
            completedChapters: Math.floor((course.all_chapters?.length || 0) * (progress / 100)),
            estimatedTime: calculateEstimatedTime(course),
            difficulty: determineDifficulty(course),
            status: status,
            modules: course.modules || [],
            all_chapters: course.all_chapters || [],
            created_at: course.created_at,
            updated_at: course.updated_at,
            // Keep original API data for debugging
            _originalApiData: course
          };

          console.log(`✅ Transformed course "${transformedCourse.title}" with ID: ${transformedCourse.id}`);

          return transformedCourse;
        });

        setCourses(transformedCourses);
        setRetryCount(0); // Reset retry count on success
        console.log('✅ Courses loaded successfully:', transformedCourses.length, 'courses');

        // Debug log all course IDs
        console.log('📋 All course IDs:');
        transformedCourses.forEach(course => {
          console.log(`  - "${course.title}": ${course.id}`);
        });

      } else {
        throw new Error(result.message || 'No courses data received');
      }

    } catch (error) {
      console.error('❌ Failed to load courses:', error);
      setCoursesError(coursesService.getCoursesErrorMessage(error));
      setRetryCount(prev => prev + 1);
    } finally {
      setCoursesLoading(false);
    }
  };

  /**
   * Calculate estimated time based on course modules and chapters
   */
  const calculateEstimatedTime = (course) => {
    const moduleCount = course.modules?.length || 0;
    const chapterCount = course.all_chapters?.length || 0;

    if (chapterCount > 0) {
      const estimatedHours = Math.ceil(chapterCount * 0.5); // 30 min per chapter
      return `${estimatedHours} hours`;
    } else if (moduleCount > 0) {
      const estimatedHours = Math.ceil(moduleCount * 2); // 2 hours per module
      return `${estimatedHours} hours`;
    }

    return '4-8 hours'; // Default estimation
  };

  /**
   * Determine course difficulty based on title and content
   */
  const determineDifficulty = (course) => {
    const title = course.title.toLowerCase();
    const description = (course.description || '').toLowerCase();

    if (title.includes('introduction') || title.includes('basic') || title.includes('beginner')) {
      return 'Beginner';
    } else if (title.includes('advanced') || title.includes('expert') || description.includes('advanced')) {
      return 'Advanced';
    } else if (title.includes('intermediate') || description.includes('intermediate')) {
      return 'Intermediate';
    }

    // Determine by module/chapter count
    const totalContent = (course.modules?.length || 0) + (course.all_chapters?.length || 0);
    if (totalContent > 20) return 'Advanced';
    if (totalContent > 10) return 'Intermediate';
    return 'Beginner';
  };

  /**
   * Check API health status
   */
  const checkAPIHealth = async () => {
    try {
      const health = await coursesService.checkCoursesAPIHealth();
      setApiHealth({
        ...health,
        lastCheck: new Date().toISOString()
      });
      console.log('🏥 API Health Check:', health.isHealthy ? '✅ Healthy' : '❌ Unhealthy');
    } catch (error) {
      console.error('❌ API Health Check failed:', error);
      setApiHealth({
        isHealthy: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      });
    }
  };

  /**
   * Retry loading courses with exponential backoff
   */
  const retryCourses = async () => {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
    console.log(`🔄 Retrying courses load in ${delay}ms...`);

    setTimeout(() => {
      loadCoursesData();
      checkAPIHealth();
    }, delay);
  };

  /**
   * Handle course selection and load detailed data
   */
  const handleCourseSelect = async (course) => {
    try {
      console.log('🔍 Course selected, navigating to modules page:', course.title);

      // Navigate to course modules page - data will be loaded there
      navigate(`/course/${course.id}`);

    } catch (error) {
      console.error('❌ Failed to navigate to course:', error);
    }
  };

  /**
   * Handle sign out
   */
  const handleSignOut = () => {
    if (authProvider === 'microsoft') {
      instance.logoutPopup().then(() => {
        logout();
        navigate('/');
      }).catch(error => {
        console.error('Microsoft logout failed:', error);
        logout();
        navigate('/');
      });
    } else {
      logout();
      navigate('/');
    }
  };

  /**
   * Generate dynamic statistics based on real course data
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
   * Generate dynamic recent activity based on courses
   */
  const getRecentActivity = () => {
    const activities = [];

    courses.slice(0, 5).forEach((course, index) => {
      if (course.status === 'in-progress' || course.status === 'completed') {
        activities.push({
          id: `activity_${index}`,
          type: course.status === 'completed' ? 'certificate-earned' : 'chapter-completed',
          title: course.status === 'completed' ? 'Course Completed' : 'Chapter Progress',
          course: course.title,
          timestamp: `${index + 1} ${index === 0 ? 'hour' : 'days'} ago`
        });
      }
    });

    // Add some default activities if no courses
    if (activities.length === 0) {
      activities.push(
        {
          id: 1,
          type: "chapter-completed",
          title: "Getting Started",
          course: "Welcome to AI-Tutor",
          timestamp: "2 hours ago"
        },
        {
          id: 2,
          type: "module-completed",
          title: "Platform Overview",
          course: "AI-Tutor Guide",
          timestamp: "1 day ago"
        }
      );
    }

    return activities;
  };

  // Mock weekly schedule data
  const weeklySchedule = [
    { day: "Mon", planned: 2, completed: 2 },
    { day: "Tue", planned: 1.5, completed: 1.5 },
    { day: "Wed", planned: 2, completed: 2 },
    { day: "Thu", planned: 1, completed: 1 },
    { day: "Fri", planned: 2, completed: 0.5 },
    { day: "Sat", planned: 1, completed: 0 },
    { day: "Sun", planned: 0.5, completed: 0 }
  ];

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF5F90] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // No user data available
  if (!isAuthenticated || !user) {
    return null; // useEffect will redirect to login
  }

  // If a course is selected, show the detail view
  if (selectedCourse) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CourseDetailView
            course={selectedCourse}
            onBack={() => setSelectedCourse(null)}
          />
        </div>
      </div>
    );
  }

  const studentStats = getStudentStats();
  const recentActivity = getRecentActivity();

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <HiSparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B6B]" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Learning Streak */}
            <div className="flex items-center space-x-2 text-[#FF6B6B]">
              <HiSparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">{studentStats.currentStreak} day streak!</span>
            </div>
          </div>
        </div>

        {/* Welcome Header */}
        <WelcomeHeader user={user} />

        {/* Stats Grid */}
        <StatsGrid stats={studentStats} />

        {/* Weekly Progress */}
        <WeeklyProgress
          weeklySchedule={weeklySchedule}
          weeklyProgress={studentStats.weeklyProgress}
          weeklyGoal={studentStats.weeklyGoal}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Continue Learning Section */}
          <div className="xl:col-span-2 space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Continue Learning</h2>
              {/* ADD "CREATE COURSE" BUTTON HERE 👇 */}
              <Link to="/create-course">
                <button className="flex items-center px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors">
                  <HiPlusCircle className="w-5 h-5 mr-2" />
                  Create Course
                </button>
              </Link>
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

            {/* Courses Loading State */}
            {coursesLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-[#FF5F90] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading courses from API...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Fetching from: {coursesService.checkCoursesAPIHealth ? 'Azure Functions' : 'API'}
                  </p>
                </div>
              </div>
            )}

            {/* Courses Error State */}
            {coursesError && !coursesLoading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start">
                  <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-red-800 font-medium">Failed to load courses</h3>
                    <p className="text-red-700 text-sm mt-1">{coursesError}</p>
                    {retryCount > 0 && (
                      <p className="text-red-600 text-xs mt-2">
                        Retry attempts: {retryCount}
                      </p>
                    )}
                    <div className="mt-3 flex space-x-3">
                      <button
                        onClick={retryCourses}
                        disabled={coursesLoading}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center"
                      >
                        <HiArrowPath className={`w-4 h-4 mr-2 ${coursesLoading ? 'animate-spin' : ''}`} />
                        Try Again
                      </button>
                      <button
                        onClick={checkAPIHealth}
                        className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors duration-200"
                      >
                        Check API Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Content */}
            {!coursesLoading && !coursesError && courses.length > 0 && (
              <>
                {/* In Progress Courses */}
                {courses.filter(c => c.status === 'in-progress').length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                      Continue Learning ({courses.filter(c => c.status === 'in-progress').length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {courses.filter(c => c.status === 'in-progress').map(course => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          onClick={() => handleCourseSelect(course)}
                          showDetails={true}
                        />
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit-course/${course.id}`);
                        }}
                        className="absolute top-4 right-4 p-2 bg-white/50 backdrop-blur-sm rounded-full text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        aria-label="Edit Course"
                      >
                        <HiPencil className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* All Courses Section */}
                <div className="mt-6 sm:mt-8">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                    All Courses ({courses.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map(course => (
                      <div key={course.id} className="relative group"> {/* 👈 Make relative */}
                        <CourseCard
                          course={course}
                          onClick={() => handleCourseSelect(course)}
                        />
                        {/* ADD EDIT BUTTON HERE 👇 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit-course/${course.id}`);
                          }}
                          className="absolute top-4 right-4 p-2 bg-white/50 backdrop-blur-sm rounded-full text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                          aria-label="Edit Course"
                        >
                          <HiPencil className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* No Courses State */}
            {!coursesLoading && !coursesError && courses.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCode className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
                <p className="text-gray-600 mb-4">It looks like there are no courses in the system yet.</p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={retryCourses}
                    className="px-4 py-2 bg-[#FF5F90] text-white font-medium rounded-lg hover:bg-[#FF5F90]/90 transition-colors duration-200 flex items-center"
                  >
                    <HiArrowPath className="w-4 h-4 mr-2" />
                    Refresh Courses
                  </button>
                  <button
                    onClick={checkAPIHealth}
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  >
                    Check API Status
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RecentActivity activities={recentActivity} />

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                  <span className="text-sm sm:text-base">View Certificates</span>
                  <HiArrowRight className="w-4 h-4" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                  <span className="text-sm sm:text-base">Practice Exercises</span>
                  <HiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-[#FF5F90] hover:text-[#FF5F90] transition-all duration-200"
          >
            <HiHome className="w-5 h-5 mr-2" />
            Back to Home
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center px-6 py-3 border-2 border-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all duration-200"
          >
            <HiArrowRightOnRectangle className="w-5 h-5 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 