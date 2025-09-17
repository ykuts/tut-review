import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import progressService from '../services/progressService';
import coursesService from '../services/coursesService';

const ProgressContext = createContext();

export const useProgress = () => {
    const context = useContext(ProgressContext);
    if (!context) {
        throw new Error('useProgress must be used within a ProgressProvider');
    }
    return context;
};

export const ProgressProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    
    // State management
    const [progressData, setProgressData] = useState(new Map()); // Map: resourceId -> progress record
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [apiStatus, setApiStatus] = useState({
        isConnected: false,
        lastCheck: null,
        error: null
    });

    // Progress statistics
    const [progressStats, setProgressStats] = useState({
        coursesCompleted: 0,
        chaptersCompleted: 0,
        totalHoursLearned: 0,
        completionRate: 0
    });

    // CORE FUNCTIONS - Define all functions FIRST

    /**
     * Get progress for a specific resource
     */
    const getResourceProgress = useCallback((resourceId) => {
        const progress = progressData.get(resourceId);
        console.log(`🔍 getResourceProgress(${resourceId}):`, progress || 'Not found');
        return progress || null;
    }, [progressData]);

    /**
     * Clear all progress data 
     */
    const clearProgressData = useCallback(() => {
        console.log('🗑️ Clearing all progress data');
        setProgressData(new Map());
        setError(null);
        setLoading(false);
        setProgressStats({
            coursesCompleted: 0,
            chaptersCompleted: 0,
            totalHoursLearned: 0,
            completionRate: 0
        });
    }, []);

    /**
     * Update overall progress statistics
     */
    const updateProgressStats = useCallback(() => {
        const progressArray = Array.from(progressData.values());
        
        const coursesCompleted = progressArray.filter(p => 
            p.resourceType === 'course' && p.status === 'completed'
        ).length;
        
        const chaptersCompleted = progressArray.filter(p => 
            p.resourceType === 'chapter' && p.status === 'completed'
        ).length;
        
        const totalProgress = progressArray.reduce((sum, p) => sum + (p.percentComplete || 0), 0);
        const completionRate = progressArray.length > 0 ? 
            Math.round(totalProgress / progressArray.length) : 0;

        const totalHoursLearned = progressArray
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + (p.estimatedHours || 0), 0);

        setProgressStats({
            coursesCompleted,
            chaptersCompleted,
            totalHoursLearned,
            completionRate
        });

        console.log('📈 Progress stats updated:', {
            coursesCompleted,
            chaptersCompleted,
            totalHoursLearned,
            completionRate
        });
    }, [progressData]);

    /**
     * Test Progress API connection
     */
    const testProgressAPI = useCallback(async () => {
        try {
            console.log('🧪 Testing Progress API...');
            const result = await progressService.testConnection();
            
            setApiStatus({
                isConnected: true,
                lastCheck: new Date().toISOString(),
                error: null
            });
            
            console.log('✅ Progress API test successful:', result);
            return result;
        } catch (error) {
            console.error('❌ Progress API test failed:', error);
            
            setApiStatus({
                isConnected: false,
                lastCheck: new Date().toISOString(),
                error: error.message
            });
            
            throw error;
        }
    }, []);

    /**
     * Load course progress from API
     */
    const loadCourseProgress = useCallback(async (courseId) => {
        if (!user?.id || !courseId) {
            console.warn('⚠️ Cannot load course progress: missing user ID or course ID');
            return;
        }

        try {
            setLoading(true);
            console.log('📊 Loading course progress for:', courseId);

            const progressRecords = await progressService.getCourseProgress(user.id, courseId);
            
            if (progressRecords && progressRecords.length > 0) {
                console.log('📊 Loaded progress records:', progressRecords.length);
                
                // Add all records to context
                setProgressData(prevData => {
                    const newData = new Map(prevData);
                    progressRecords.forEach(record => {
                        newData.set(record.resourceId, record);
                    });
                    return newData;
                });
            }

            setApiStatus({
                isConnected: true,
                lastCheck: new Date().toISOString(),
                error: null
            });

            console.log('✅ Course progress loaded successfully');

        } catch (error) {
            console.error('❌ Failed to load course progress:', error);
            setError(`Failed to load progress: ${error.message}`);
            setApiStatus({
                isConnected: false,
                lastCheck: new Date().toISOString(),
                error: error.message
            });
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    /**
     * Add multiple progress records to context
     */
    const addProgressRecordsToContext = useCallback((progressRecords) => {
        if (!progressRecords || progressRecords.length === 0) {
            return;
        }

        console.log('📊 Adding', progressRecords.length, 'progress records to ProgressContext');

        setProgressData(prevData => {
            const newData = new Map(prevData);
            progressRecords.forEach(record => {
                const key = record.resourceId;
                newData.set(key, record);
                console.log(`📊 Added to context: ${key} -> ${record.status} (${record.percentComplete}%)`);
            });
            return newData;
        });

        console.log('✅ Progress records added to ProgressContext');
    }, []);

    /**
     * Check if progress exists in context OR get from external source
     */
    const findExistingProgress = useCallback(async (resourceId, resourceType, userId) => {
    // First check local context
    const localProgress = getResourceProgress(resourceId);
    if (localProgress) {
        console.log('📊 Found progress in ProgressContext:', localProgress);
        return localProgress;
    }

    // If not in context, try to get from API
    console.log('📊 Progress not in context, checking API for:', resourceId);
    try {
        // FIXED: Correct parameter order - userId first, then resourceId, then resourceType
        const existingProgress = await progressService.getUserResourceProgress(userId, resourceId, resourceType);
        if (existingProgress) {
            console.log('📊 Found existing progress in API:', existingProgress);
            
            // Add to context so we don't check again
            setProgressData(prevData => {
                const newData = new Map(prevData);
                newData.set(resourceId, existingProgress);
                return newData;
            });

            return existingProgress;
        }
    } catch (error) {
        console.error('❌ Error finding existing progress:', error);
        return null;
    }

    console.log('📊 No existing progress found for:', resourceId);
    return null;
}, [getResourceProgress]);

    /**
     * Get effective user ID
     */
    const getEffectiveUserId = useCallback(() => {
        console.log('🔍 getEffectiveUserId called with user:', user);
    const userId = user?.id || user?.apiUser?.userId || user?.apiUser?.id || user?.sub || user?.localAccountId;
    
    if (user?.apiUser?.userId) {
        console.log('✅ Using internal API userId:', user.apiUser.userId);
        return user.apiUser.userId;
    }
    
    if (user?.id && !user?.isTemporaryId) {
        console.log('✅ Using user.id:', user.id);
        return user.id;
    }
    
    // Предупреждение при использовании временных ID
    if (user?.id && user?.isTemporaryId) {
        console.warn('⚠️ Using temporary Google ID - API may fail:', user.id);
        return user.id;
    }
    
    // Fallback варианты
    const fallbackId = user?.sub || user?.localAccountId;
    if (fallbackId) {
        console.warn('⚠️ Using fallback ID:', fallbackId);
        return fallbackId;
    }
    
    // Последний resort - email
    if (user?.email) {
        console.error('❌ Using email as ID - this will likely fail:', user.email);
        return user.email;
    }
    
    console.error('❌ No valid user ID found. User object:', user);
    return null;
}, [user]);

    /**
     * Start progress for a resource with improved error handling
     */
    const startResourceProgress = useCallback(async (resourceId, resourceType, courseId, moduleId = null) => {
        const effectiveUserId = getEffectiveUserId();
        
        if (!effectiveUserId) {
            const errorMsg = 'User not authenticated - no valid user ID found';
            console.error('🔒', errorMsg);
            throw new Error(errorMsg);
        }

        if (!resourceId || !resourceType || !courseId) {
            const errorMsg = `Missing required parameters: resourceId=${resourceId}, resourceType=${resourceType}, courseId=${courseId}`;
            console.error('📋', errorMsg);
            throw new Error(errorMsg);
        }

        try {
            console.log('📊 Starting progress for:', { 
                resourceId, 
                resourceType, 
                courseId, 
                moduleId, 
                effectiveUserId 
            });

            // Check if progress already exists (context + API)
            const existingProgress = await findExistingProgress(resourceId, resourceType, effectiveUserId);
            if (existingProgress) {
                console.log('📊 Progress already exists, returning existing record');
                return existingProgress;
            }

            // Create new progress record via API
            console.log('📊 Creating new progress record via API...');
            
            const progressRecord = await progressService.markResourceStarted(
                effectiveUserId,
                resourceId, 
                resourceType, 
                courseId, 
                moduleId
            );

            if (!progressRecord) {
                throw new Error('progressService.markResourceStarted returned null/undefined');
            }

            // Add to context immediately
            setProgressData(prevData => {
                const newData = new Map(prevData);
                newData.set(resourceId, progressRecord);
                console.log(`📊 Added new progress to context: ${resourceId}`);
                return newData;
            });

            console.log('✅ Progress started successfully:', progressRecord);
            return progressRecord;

        } catch (error) {
            console.error('❌ Failed to start progress:', error);
            throw error;
        }
    }, [getEffectiveUserId, findExistingProgress]);

    /**
     * Update progress percentage
     */
    const updateResourceProgress = useCallback(async (resourceId, percentComplete) => {
        try {
            const currentProgress = getResourceProgress(resourceId);
            if (!currentProgress) {
                throw new Error('Progress record not found. Start progress first.');
            }

            console.log('📊 Updating progress:', resourceId, `${percentComplete}%`);

            // Use progressId for the update
            const progressId = currentProgress.progressId || currentProgress.id;
            if (!progressId) {
                throw new Error('Progress ID not found in record');
            }

            const updatedProgress = await progressService.updateProgressPercentage(
                progressId,
                percentComplete
            );

            // Update local state
            setProgressData(prevData => {
                const newData = new Map(prevData);
                newData.set(resourceId, updatedProgress);
                return newData;
            });

            // If completed, trigger recalculation
            if (percentComplete >= 100) {
                await recalculateParentProgress(updatedProgress);
            }

            console.log('✅ Progress updated:', updatedProgress);
            return updatedProgress;

        } catch (error) {
            console.error('❌ Failed to update progress:', error);
            throw error;
        }
    }, [getResourceProgress]);

    /**
     * Mark resource as completed
     */
    const markResourceCompleted = useCallback(async (resourceIdOrProgressId) => {
        try {
            console.log('📊 markResourceCompleted called with:', resourceIdOrProgressId);

            let progressId;
            let resourceId;

            // Handle both resourceId and progressId
            const currentProgress = getResourceProgress(resourceIdOrProgressId);
            
            if (currentProgress) {
                // resourceIdOrProgressId is a resourceId
                resourceId = resourceIdOrProgressId;
                progressId = currentProgress.progressId || currentProgress.id;
            } else {
                // resourceIdOrProgressId might be a progressId
                progressId = resourceIdOrProgressId;
                // Find resourceId by looking through all progress records
                for (const [rid, progress] of progressData.entries()) {
                    if (progress.progressId === progressId || progress.id === progressId) {
                        resourceId = rid;
                        break;
                    }
                }
            }

            if (!progressId) {
                throw new Error('Progress ID not found');
            }

            console.log('📊 Marking as completed:', { resourceId, progressId });

            const updatedProgress = await progressService.markResourceCompleted(progressId);

            // Update local state
            if (resourceId) {
                setProgressData(prevData => {
                    const newData = new Map(prevData);
                    newData.set(resourceId, updatedProgress);
                    console.log(`📊 Marked as completed in context: ${resourceId}`);
                    return newData;
                });
            }

            // Trigger parent progress recalculation
            await recalculateParentProgress(updatedProgress);

            console.log('✅ Resource marked as completed:', updatedProgress);
            return updatedProgress;

        } catch (error) {
            console.error('❌ Failed to mark resource as completed:', error);
            throw error;
        }
    }, [getResourceProgress, progressData]);

    /**
     * Toggle resource completion (mark/unmark as completed)
     */
    const toggleResourceCompletion = useCallback(async (resourceIdOrProgressId) => {
        try {
            console.log('📊 toggleResourceCompletion called with:', resourceIdOrProgressId);

            let progressId;
            let resourceId;

            // Handle both resourceId and progressId
            const currentProgress = getResourceProgress(resourceIdOrProgressId);
            
            if (currentProgress) {
                // resourceIdOrProgressId is a resourceId
                resourceId = resourceIdOrProgressId;
                progressId = currentProgress.progressId || currentProgress.id;
            } else {
                // resourceIdOrProgressId might be a progressId
                progressId = resourceIdOrProgressId;
                // Find resourceId by looking through all progress records
                for (const [rid, progress] of progressData.entries()) {
                    if (progress.progressId === progressId || progress.id === progressId) {
                        resourceId = rid;
                        break;
                    }
                }
            }

            if (!progressId) {
                throw new Error('Progress ID not found');
            }

            const isCurrentlyCompleted = currentProgress?.status === 'completed';
            console.log('📊 Current completion state:', isCurrentlyCompleted ? 'completed' : 'not completed');

            const updatedProgress = await progressService.toggleResourceCompletion(progressId);

            // Update local state
            if (resourceId) {
                setProgressData(prevData => {
                    const newData = new Map(prevData);
                    newData.set(resourceId, updatedProgress);
                    console.log(`📊 Toggled progress in context: ${resourceId} -> ${updatedProgress.status}`);
                    return newData;
                });
            }

            // Trigger parent progress recalculation
            await recalculateParentProgress(updatedProgress);

            console.log('✅ Resource completion toggled:', updatedProgress);
            return updatedProgress;

        } catch (error) {
            console.error('❌ Failed to toggle resource completion:', error);
            throw error;
        }
    }, [getResourceProgress, progressData]);

    /**
     * Recalculate progress for parent resources (module → course)
     */
    const recalculateParentProgress = useCallback(async (childProgress) => {
        try {
            if (!user?.id || !childProgress) {
                return;
            }

            const { courseId, moduleId } = childProgress;

            // Recalculate module progress if this is a chapter
            if (moduleId && childProgress.resourceType === 'chapter') {
                console.log('📊 Recalculating module progress:', moduleId);
                
                // Get all chapters in this module
                const moduleChapters = Array.from(progressData.values())
                    .filter(p => p.moduleId === moduleId && p.resourceType === 'chapter');

                if (moduleChapters.length > 0) {
                    const completedChapters = moduleChapters.filter(p => p.status === 'completed').length;
                    const modulePercentComplete = Math.round((completedChapters / moduleChapters.length) * 100);
                    const moduleStatus = completedChapters === moduleChapters.length ? 'completed' :
                                       completedChapters > 0 ? 'in_progress' : 'not_started';

                    // Update or create module progress
                    let moduleProgress = getResourceProgress(moduleId);
                    
                    if (!moduleProgress) {
                        // Create new module progress
                        moduleProgress = await progressService.markResourceStarted(
                            user.id,
                            moduleId,
                            'module',
                            courseId
                        );
                    }

                    // Update module progress
                    const progressId = moduleProgress.progressId || moduleProgress.id;
                    const updatedModuleProgress = await progressService.updateProgress(
                        progressId,
                        {
                            percentComplete: modulePercentComplete,
                            status: moduleStatus
                        }
                    );

                    // Update local state
                    setProgressData(prevData => {
                        const newData = new Map(prevData);
                        newData.set(moduleId, updatedModuleProgress);
                        return newData;
                    });

                    console.log('✅ Module progress recalculated:', moduleId, `${modulePercentComplete}%`);
                }
            }

            // Recalculate course progress
            if (courseId) {
                console.log('📊 Recalculating course progress:', courseId);
                
                // Get all modules in this course
                const courseModules = Array.from(progressData.values())
                    .filter(p => p.courseId === courseId && p.resourceType === 'module');

                if (courseModules.length > 0) {
                    const completedModules = courseModules.filter(p => p.status === 'completed').length;
                    const coursePercentComplete = Math.round((completedModules / courseModules.length) * 100);
                    const courseStatus = completedModules === courseModules.length ? 'completed' :
                                       completedModules > 0 ? 'in_progress' : 'not_started';

                    // Update or create course progress
                    let courseProgress = getResourceProgress(courseId);
                    
                    if (!courseProgress) {
                        // Create new course progress
                        courseProgress = await progressService.markResourceStarted(
                            user.id,
                            courseId,
                            'course',
                            courseId
                        );
                    }

                    // Update course progress
                    const progressId = courseProgress.progressId || courseProgress.id;
                    const updatedCourseProgress = await progressService.updateProgress(
                        progressId,
                        {
                            percentComplete: coursePercentComplete,
                            status: courseStatus
                        }
                    );

                    // Update local state
                    setProgressData(prevData => {
                        const newData = new Map(prevData);
                        newData.set(courseId, updatedCourseProgress);
                        return newData;
                    });

                    console.log('✅ Course progress recalculated:', courseId, `${coursePercentComplete}%`);
                }
            }

        } catch (error) {
            console.error('❌ Failed to recalculate course progress:', error);
        }
    }, [user?.id, getResourceProgress]);

    /**
     * Debug progress operations
     */
    const debugProgressOperations = useCallback(async () => {
    if (!user?.id) {
        console.warn('⚠️ No user ID available for debugging');
        return { success: false, error: 'No user ID' };
    }

    try {
        console.log('🧪 Running debug progress operations...');
        
        // ИСПРАВЛЕНО: убрана рекурсия
        const testResults = await progressService.testConnection();
        
        console.log('🧪 Debug test results:', testResults);
        return testResults;
        
    } catch (error) {
        console.error('❌ Debug test failed:', error);
        return { success: false, error: error.message };
    }
}, [user?.id]);

    // HELPER FUNCTIONS
    const isResourceCompleted = useCallback((resourceId) => {
        const progress = getResourceProgress(resourceId);
        const result = progress?.status === 'completed';
        console.log(`🔍 isResourceCompleted(${resourceId}): ${result}`);
        return result;
    }, [getResourceProgress]);

    const getResourceProgressPercentage = useCallback((resourceId) => {
        const progress = getResourceProgress(resourceId);
        const percentage = progress?.percentComplete || 0;
        console.log(`🔍 getResourceProgressPercentage(${resourceId}): ${percentage}%`);
        return percentage;
    }, [getResourceProgress]);

    const getResourceStatus = useCallback((resourceId) => {
        const progress = getResourceProgress(resourceId);
        const status = progress?.status || 'not_started';
        console.log(`🔍 getResourceStatus(${resourceId}): ${status}`);
        return status;
    }, [getResourceProgress]);

    // EFFECTS - Now all functions are defined
    
    // Clear progress data when user logs out
    useEffect(() => {
        if (!isAuthenticated) {
            clearProgressData();
        }
    }, [isAuthenticated, clearProgressData]);

    // Update stats when progress data changes
    useEffect(() => {
        updateProgressStats();
    }, [updateProgressStats]);

    // Provide context value
    const value = {
        // State
        progressData,
        loading,
        error,
        apiStatus,
        progressStats,
        
        // Core functions
        loadCourseProgress,
        getResourceProgress,
        startResourceProgress,
        updateResourceProgress,
        markResourceCompleted,
        toggleResourceCompletion,
        addProgressRecordsToContext,
        findExistingProgress,
         getEffectiveUserId, 
        
        // Utility functions
        recalculateParentProgress,
        testProgressAPI,
        clearProgressData,
        debugProgressOperations,
        
        // Helper functions
        isResourceCompleted,
        getResourceProgressPercentage,
        getResourceStatus
    };

    return (
        <ProgressContext.Provider value={value}>
            {children}
        </ProgressContext.Provider>
    );
};