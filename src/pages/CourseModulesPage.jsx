import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CourseDetailView from '../components/dashboard/CourseDetailView';
import coursesService from '../services/coursesService';
import useScrollToTop from '../hooks/useScrollToTop';
import { HiArrowLeft, HiExclamationTriangle } from 'react-icons/hi2';

const CourseModulesPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [courseInfo, setCourseInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Auto scroll to top
    useScrollToTop({ smooth: true, delay: 100 });

    // Check authentication
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Load course info with detailed data
    useEffect(() => {
        const loadCourseInfo = async () => {
            if (!courseId) {
                setError('Missing course ID');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log('📚 CourseModulesPage - Loading detailed course:', courseId);

                // Load detailed course data (same logic as was in Dashboard)
                const detailedCourse = await coursesService.getCourseById(courseId);

                if (detailedCourse.success) {
                    // Create proper course object with required fields
                    const courseWithDetails = {
                        id: courseId, // ← ВАЖНО: явно передаем ID
                        courseId: courseId,
                        title: detailedCourse.data.title || 'Course',
                        description: detailedCourse.data.description || '',
                        slug: detailedCourse.data.slug || '',
                        modules: detailedCourse.data.modules || [],
                        all_chapters: detailedCourse.data.all_chapters || [],
                        created_at: detailedCourse.data.created_at,
                        updated_at: detailedCourse.data.updated_at,
                        // Add any other fields from the original course data
                        ...detailedCourse.data
                    };

                    // Load chapters for each module if available
                    if (courseWithDetails.modules.length > 0) {
                        const modulesWithChapters = await Promise.all(
                            courseWithDetails.modules.map(async (module) => {
                                try {
                                    const chaptersResult = await coursesService.getChaptersByModule(module.moduleId);
                                    const chapters = chaptersResult.success ? chaptersResult.data.map(chapter => ({
                                        id: chapter.chapterId || chapter.id || chapter._id, // Use real ID
                                        chapterId: chapter.chapterId || chapter.id || chapter._id,
                                        title: chapter.title,
                                        completed: Math.random() > 0.5,
                                        duration: `${15 + Math.floor(Math.random() * 20)} min`,
                                        created_at: chapter.created_at,
                                        updated_at: chapter.updated_at,
                                        moduleId: module.moduleId // Add module reference
                                    })) : [];

                                    const completedChapters = chapters.filter(ch => ch.completed).length;
                                    const progress = chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0;

                                    return {
                                        ...module,
                                        chapters: chapters,
                                        progress: progress
                                    };
                                } catch (error) {
                                    console.warn('⚠️ Failed to load chapters for module:', module.moduleId);
                                    return {
                                        ...module,
                                        chapters: [],
                                        progress: 0,
                                        error: 'Failed to load chapters'
                                    };
                                }
                            })
                        );
                        courseWithDetails.modules = modulesWithChapters;
                    }

                    setCourseInfo(courseWithDetails);
                    console.log('✅ Detailed course loaded with ID:', courseWithDetails.id);
                } else {
                    throw new Error(detailedCourse.message || 'Failed to load course');
                }

            } catch (error) {
                console.error('❌ Error loading course:', error);
                setError(`Error loading course: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated && !authLoading && courseId) {
            loadCourseInfo();
        }
    }, [courseId, isAuthenticated, authLoading]);

    // Loading state
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B6B] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course...</p>
                    <p className="text-sm text-gray-500 mt-2">Course ID: {courseId}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-start">
                            <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-red-800 font-medium">Course Loading Error</h3>
                                <p className="text-red-700 text-sm mt-1">{error}</p>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center"
                                >
                                    <HiArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!isAuthenticated) {
        return null;
    }

    const handleBack = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <CourseDetailView
                    course={courseInfo}
                    onBack={handleBack}
                />
            </div>
        </div>
    );
};

export default CourseModulesPage;