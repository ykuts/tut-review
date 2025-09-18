import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HiAcademicCap, 
  HiPlusCircle, 
  HiArrowPath,
  HiUserGroup
} from 'react-icons/hi2';

// Import existing reusable components
import WelcomeHeader from '../WelcomeHeader';

// Import mentor-specific components
import MentorStats from './MentorStats';
import CourseManagement from './CourseManagement';
import StudentList from './StudentList';

// Import services
import coursesService from '../../../services/coursesService';
// TODO: Import mentorService when created
// import mentorService from '../../services/mentorService';

const MentorDashboard = ({ user }) => {
  const navigate = useNavigate();

  // State management
  const [courses, setCourses] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load mentor data on component mount
  useEffect(() => {
    loadMentorData();
  }, []);

  /**
   * Load mentor courses and students
   */
  const loadMentorData = async () => {
    try {
      setCoursesLoading(true);
      setCoursesError(null);

      console.log('🔄 Loading mentor dashboard data...');
      
      // Load courses (filter by mentor later)
      await loadMentorCourses();
      
      // Load assigned students (mock for now)
      loadAssignedStudents();
      
    } catch (error) {
      console.error('❌ Failed to load mentor data:', error);
      setCoursesError('Failed to load mentor dashboard. Please try again.');
    } finally {
      setCoursesLoading(false);
    }
  };

  /**
   * Load courses created by this mentor
   */
  const loadMentorCourses = async () => {
    try {
      const result = await coursesService.getAllCourses();

      if (result.success && result.data) {
        // Transform courses for mentor view
        const transformedCourses = result.data.map((course, index) => {
          const courseId = course.courseId || course._id || course.id;

          return {
            id: courseId,
            title: course.title,
            description: course.description,
            slug: course.slug,
            // Mock mentor-specific data
            visibility: course.visibility || (Math.random() > 0.5 ? 'public' : 'private'),
            mentor_id: user?.id, // Assume current user is mentor
            enrolledStudents: Math.floor(Math.random() * 50),
            completionRate: Math.floor(Math.random() * 100),
            modules: course.modules || [],
            all_chapters: course.all_chapters || [],
            created_at: course.created_at,
            updated_at: course.updated_at,
            // For stats
            totalModules: course.modules?.length || 0,
            totalChapters: course.all_chapters?.length || 0
          };
        });

        setCourses(transformedCourses);
        setRetryCount(0);
        console.log('✅ Mentor courses loaded:', transformedCourses.length);

      } else {
        throw new Error(result.message || 'No courses data received');
      }

    } catch (error) {
      console.error('❌ Failed to load mentor courses:', error);
      throw error;
    }
  };

  /**
   * Load students assigned to this mentor (mock data for now)
   */
  const loadAssignedStudents = () => {
    // Mock student data - replace with real API call
    const mockStudents = [
      {
        id: 'student-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        avatar: null,
        enrolledCourses: 3,
        completedCourses: 1,
        lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        overallProgress: 65
      },
      {
        id: 'student-2', 
        name: 'Bob Smith',
        email: 'bob@example.com',
        avatar: null,
        enrolledCourses: 2,
        completedCourses: 2,
        lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        overallProgress: 100
      },
      {
        id: 'student-3',
        name: 'Carol Davis',
        email: 'carol@example.com', 
        avatar: null,
        enrolledCourses: 1,
        completedCourses: 0,
        lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        overallProgress: 25
      }
    ];

    setAssignedStudents(mockStudents);
    console.log('✅ Mock assigned students loaded:', mockStudents.length);
  };

  /**
   * Handle course visibility toggle
   */
  const handleVisibilityToggle = async (courseId, newVisibility) => {
    try {
      console.log(`🔄 Toggling course visibility: ${courseId} -> ${newVisibility}`);
      
      // Update local state immediately for UI responsiveness
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, visibility: newVisibility }
            : course
        )
      );

      // TODO: Call API to update course visibility
      // await mentorService.updateCourseVisibility(courseId, newVisibility);
      console.log(`✅ Course visibility updated: ${newVisibility}`);
      
    } catch (error) {
      console.error('❌ Failed to update course visibility:', error);
      
      // Revert the change if API call fails
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, visibility: newVisibility === 'public' ? 'private' : 'public' }
            : course
        )
      );
    }
  };

  /**
   * Handle course assignment to students
   */
  const handleAssignStudents = (course) => {
    console.log(`🔄 Opening assignment panel for course: ${course.title}`);
    // TODO: Open assignment modal/panel
    alert(`Assignment feature coming soon for course: ${course.title}`);
  };

  /**
   * Handle course editing
   */
  const handleEditCourse = (course) => {
    navigate(`/edit-course/${course.id}`);
  };

  /**
   * Navigate to student progress detail
   */
  const handleViewStudentProgress = (studentId) => {
    console.log(`🔍 Viewing progress for student: ${studentId}`);
    navigate(`/mentor/student/${studentId}`);
  };

  /**
   * Retry loading courses
   */
  const retryCourses = async () => {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    console.log(`🔄 Retrying mentor data load in ${delay}ms...`);

    setTimeout(() => {
      loadMentorData();
    }, delay);
  };

  /**
   * Generate mentor statistics
   */
  const getMentorStats = () => {
    const totalCourses = courses.length;
    const publicCourses = courses.filter(c => c.visibility === 'public').length;
    const privateCourses = courses.filter(c => c.visibility === 'private').length;
    const totalStudents = assignedStudents.length;
    
    const totalEnrollments = courses.reduce((sum, course) => {
      return sum + (course.enrolledStudents || 0);
    }, 0);

    const avgCompletionRate = courses.length > 0 
      ? Math.round(courses.reduce((sum, course) => sum + (course.completionRate || 0), 0) / courses.length)
      : 0;
    
    return {
      coursesCreated: totalCourses,
      publicCourses,
      privateCourses,
      studentsManaged: totalStudents,
      totalEnrollments,
      avgCompletionRate,
      thisMonthNewStudents: 12 // Mock data
    };
  };

  const mentorStats = getMentorStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <HiAcademicCap className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B6B]" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Quick Actions */}
          <Link to="/create-course">
            <button className="flex items-center px-4 py-2 bg-[#FF6B6B] text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors">
              <HiPlusCircle className="w-5 h-5 mr-2" />
              Create Course
            </button>
          </Link>
          
          <span className="text-sm text-gray-500">
            Managing {courses.length} course{courses.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Welcome Header */}
      <WelcomeHeader 
        user={{...user, name: `${user.name} (Mentor)`}} 
        customMessage="Welcome to your mentor dashboard! Here you can manage your courses and track student progress."
      />

      {/* Mentor Stats */}
      <MentorStats stats={mentorStats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
        
        {/* Course Management */}
        <div className="xl:col-span-2 space-y-6">
          <CourseManagement 
            courses={courses}
            loading={coursesLoading}
            error={coursesError}
            onRetry={retryCourses}
            onVisibilityToggle={handleVisibilityToggle}
            onAssignStudents={handleAssignStudents}
            onEditCourse={handleEditCourse}
          />
        </div>

        {/* Students Sidebar */}
        <div className="space-y-6">
          <StudentList 
            students={assignedStudents}
            onViewProgress={handleViewStudentProgress}
          />
          
          {/* Quick Stats Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Overview</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Students</span>
                <span className="font-medium text-blue-600">{assignedStudents.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Enrollments</span>
                <span className="font-medium text-green-600">{mentorStats.totalEnrollments}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. Completion</span>
                <span className="font-medium text-purple-600">{mentorStats.avgCompletionRate}%</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => alert('Full analytics coming soon!')}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <HiUserGroup className="w-4 h-4 inline mr-2" />
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;