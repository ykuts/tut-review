import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProgress } from '../../contexts/ProgressContext';
import { useAuth } from '../../contexts/AuthContext';
import coursesService from '../../services/coursesService';
import progressService from '../../services/progressService';
import MarkdownRenderer from '../MarkdownRenderer';
import VideoPlayer from '../VideoPlayer';
import '../../styles/markdown.css'; // Import markdown styles
import {
  HiArrowLeft,
  HiBookOpen,
  HiPlayCircle,
  HiCodeBracket,
  HiDocumentText,
  HiQuestionMarkCircle,
  HiSparkles,
  HiClock,
  HiExclamationTriangle,
  HiArrowPath,
  HiCheckCircle,
  HiLink,
  HiWifi,
  HiXCircle
} from 'react-icons/hi2';

const ChapterMaterialsView = ({ chapter, onBack }) => {
  const urlParams = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // CRITICAL: Проверка доступности ProgressContext
  let progressContextFunctions;
  try {
    progressContextFunctions = useProgress();
  } catch (error) {
    console.error('❌ ProgressContext not available:', error);
    // Fallback - создать пустые функции
    progressContextFunctions = {
      getResourceProgress: () => null,
      getResourceProgressPercentage: () => 0,
      isResourceCompleted: () => false,
      startResourceProgress: async () => null,
      markResourceCompleted: async () => null,
      toggleResourceCompletion: async () => null,
      loading: false,
      error: null,
      loadCourseProgress: async () => {},
      addProgressRecordsToContext: () => {},
      findExistingProgress: async () => null
    };
  }

  const [progressCache, setProgressCache] = useState(new Map()); // Cache all loaded progress
const [loadingProgress, setLoadingProgress] = useState(new Set()); // Track what's being loaded

  // FIXED: Declare all ID variables first, before any other code
  const chapterId = chapter?.id || chapter?.chapterId || urlParams.chapterId;
  const courseId = chapter?.courseId || chapter?.course?.id || urlParams.courseId;
  const moduleId = chapter?.moduleId || urlParams.moduleId;

  // Progress functions from context - after IDs are declared
  const {
    getResourceProgress,
    getResourceProgressPercentage,
    isResourceCompleted,
    startResourceProgress,
    markResourceCompleted,
    toggleResourceCompletion,
    loading: progressLoading,
    error: progressError,
    loadCourseProgress,
    addProgressRecordsToContext,
    findExistingProgress,
    getEffectiveUserId: contextGetEffectiveUserId
  } = progressContextFunctions;

  // Debug effective user ID and parameters
useEffect(() => {
  const effectiveId = getEffectiveUserId();
  console.log('🔍 API Parameters Debug:', {
    isAuthenticated,
    effectiveUserId: effectiveId,
    courseId,
    chapterId,
    moduleId,
    userObject: {
      id: user?.id,
      email: user?.email,
      sub: user?.sub,
      localAccountId: user?.localAccountId
    }
  });

  // Validate parameters that will be sent to API
  if (effectiveId && courseId && chapterId) {
    console.log('✅ All required parameters for API calls are available');
  } else {
    console.warn('⚠️ Missing parameters for API calls:', {
      hasUserId: !!effectiveId,
      hasCourseId: !!courseId,
      hasChapterId: !!chapterId
    });
  }
}, [user, isAuthenticated, courseId, chapterId, moduleId]);

  // CLEAN: Simplified authentication debugging
  useEffect(() => {
    const effectiveId = getEffectiveUserId();
    console.log('🔍 Auth Status:', {
      isAuthenticated,
      effectiveUserId: effectiveId,
      courseId,
      chapterId
    });

    if (!effectiveId && isAuthenticated) {
      console.warn('⚠️ User is authenticated but no valid ID found');
    }
  }, [user, isAuthenticated, courseId, chapterId]);


  // CLEAN: Simplified user ID function with less logging
  const getEffectiveUserId = contextGetEffectiveUserId || (() => {
  return user?.id || user?.sub || user?.localAccountId || user?.apiUser?.id || user?.email || null;
});

  // Enhanced debugging for user object
  useEffect(() => {
    console.log('🔍 COMPLETE USER OBJECT ANALYSIS:');
    console.log('  Raw user object:', user);
    console.log('  User type:', typeof user);
    console.log('  User keys:', user ? Object.keys(user) : 'null');

    if (user) {
      console.log('  user.id:', user.id, typeof user.id);
      console.log('  user.email:', user.email);
      console.log('  user.name:', user.name);
      console.log('  user.provider:', user.provider);
      console.log('  user.authProvider:', user.authProvider);
      console.log('  user.sub:', user.sub);
      console.log('  user.localAccountId:', user.localAccountId);
      console.log('  user.apiUser:', user.apiUser);

      if (user.apiUser) {
        console.log('  user.apiUser keys:', Object.keys(user.apiUser));
      }
    }

    const effectiveId = getEffectiveUserId();
    console.log('  🎯 EFFECTIVE USER ID:', effectiveId);

    console.log('  isAuthenticated:', isAuthenticated);
    console.log('  courseId:', courseId);
    console.log('  chapterId:', chapterId);

  }, [user, isAuthenticated, courseId, chapterId, moduleId]);

  // Debug logging - after all variables are declared
  useEffect(() => {
    console.log('🔍 DEBUGGING AUTHENTICATION:');
    console.log('  isAuthenticated:', isAuthenticated);
    console.log('  user object:', user);
    console.log('  user.id:', user?.id);
    console.log('  user.email:', user?.email);
    console.log('  user.name:', user?.name);
    console.log('  courseId:', courseId);
    console.log('  chapterId:', chapterId);
    console.log('  moduleId:', moduleId);

    if (!isAuthenticated) {
      console.warn('⚠️ User is NOT authenticated!');
    }

    if (!user?.id) {
      console.warn('⚠️ User ID is missing!');
    }
  }, [user, isAuthenticated, courseId, chapterId, moduleId]);

  // State management - после всех переменных
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chapterInfo, setChapterInfo] = useState({
    title: chapter?.title || 'Chapter Materials',
    courseTitle: chapter?.courseTitle || 'Course Content'
  });
  const [apiHealthy, setApiHealthy] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [chapterProgressRecord, setChapterProgressRecord] = useState(null);
  const [materialProgressMap, setMaterialProgressMap] = useState(new Map());
  const [progressInitialized, setProgressInitialized] = useState(false);

  /**
 * Calculate chapter progress based on completed materials
 */
  const calculateChapterProgress = () => {
    if (!materials || materials.length === 0) {
      return 0;
    }

    // Count completed materials
    const completedCount = materials.filter(material => {
      // Skip placeholder/error materials from calculation
      if (material.isPlaceholder || material.isError || material.isEmergency) {
        return false;
      }
      return isMaterialCompleted(material);
    }).length;

    // Count total valid materials (excluding placeholders/errors)
    const totalValidMaterials = materials.filter(material =>
      !material.isPlaceholder && !material.isError && !material.isEmergency
    ).length;

    if (totalValidMaterials === 0) {
      return 0;
    }

    const percentage = Math.round((completedCount / totalValidMaterials) * 100);
    console.log(`📊 Chapter progress calculation: ${completedCount}/${totalValidMaterials} = ${percentage}%`);

    return percentage;
  };


  /**
   * Get completed materials count
   */
  const getCompletedMaterialsCount = () => {
    if (!materials || materials.length === 0) {
      return 0;
    }

    return materials.filter(material => {
      if (material.isPlaceholder || material.isError || material.isEmergency) {
        return false;
      }
      return isMaterialCompleted(material);
    }).length;
  };

  /**
   * Get total valid materials count
   */
  const getTotalValidMaterialsCount = () => {
    if (!materials || materials.length === 0) {
      return 0;
    }

    return materials.filter(material =>
      !material.isPlaceholder && !material.isError && !material.isEmergency
    ).length;
  };

  // Define safe functions properly
  const safeGetResourceProgress = getResourceProgress || (() => {
    console.warn('getResourceProgress not available');
    return null;
  });

  const safeStartResourceProgress = startResourceProgress || (async () => {
    console.warn('startResourceProgress not available');
    return null;
  });

  const safeLoadCourseProgress = loadCourseProgress || (async () => {
    console.warn('loadCourseProgress not available');
  });

  const safeMarkResourceCompleted = markResourceCompleted || (async () => {
    console.warn('markResourceCompleted not available');
    return null;
  });

  const safeToggleResourceCompletion = toggleResourceCompletion || (async () => {
    console.warn('toggleResourceCompletion not available');
    return null;
  });

  // Load materials on component mount
  useEffect(() => {
    console.log('📄 ChapterMaterialsView useEffect triggered');

    if (courseId && chapterId) {
      initializeComponent();
    } else {
      console.error('❌ Missing required parameters:', { courseId, chapterId });
      setError(`Missing parameters: courseId=${courseId}, chapterId=${chapterId}`);
      setLoading(false);
    }
  }, [courseId, chapterId, chapter]);

  // Auto-select first material when materials load
  useEffect(() => {
    if (materials.length > 0 && !selectedMaterial) {
      handleMaterialSelect(materials[0]);
    }
  }, [materials, selectedMaterial]);

  // Auto-recalculate chapter progress when materials or their completion status changes
useEffect(() => {
  if (materials.length > 0) {
    const newProgress = calculateChapterProgress();
    const completed = getCompletedMaterialsCount();
    const total = getTotalValidMaterialsCount();
    
    console.log('📊 Progress recalculated:', {
      percentage: newProgress,
      completed,
      total,
      materialsWithStatus: materials.map(m => ({
        title: m.title,
        completed: isMaterialCompleted(m),
        isValid: !m.isPlaceholder && !m.isError && !m.isEmergency
      }))
    });

    // Update chapter progress record if we have one
    if (chapterProgressRecord) {
      setChapterProgressRecord(prev => ({
        ...prev,
        percentComplete: newProgress,
        status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started',
        lastUpdated: new Date().toISOString()
      }));
    }
  }
}, [materials, materialProgressMap]); // Recalculate when materials or their progress changes

// Also add this helper effect to sync chapter progress with API when it reaches 100%
useEffect(() => {
  const currentProgress = calculateChapterProgress();
  
  // --- START OF FIX ---
  // The crucial check: only sync if the chapter isn't already marked as completed.
  if (
    currentProgress === 100 &&
    chapterProgressRecord &&
    chapterProgressRecord.status !== 'completed' && 
    chapterProgressRecord.progressId &&
    !chapterProgressRecord.isLocalOnly
  ) {
  // --- END OF FIX ---
    
    // Chapter is complete - sync with API
    const syncChapterCompletion = async () => {
      try {
        console.log('📊 Chapter completed! Syncing with API...');
        
        const updateResponse = await progressService.updateProgress(chapterProgressRecord.progressId, {
          percentComplete: 100,
          status: 'completed'
        });

        console.log('✅ Chapter completion synced with API:', updateResponse.data);
        
        setChapterProgressRecord(updateResponse.data);
        
      } catch (error) {
        console.warn('⚠️ Failed to sync chapter completion with API:', error.message);
      }
    };

    syncChapterCompletion();
  }
}, [materials, materialProgressMap, chapterProgressRecord]); // Only trigger when the calculated progress changes

/**
 * SIMPLIFIED: Get existing progress with only working API parameters
 */
const getExistingProgress = findExistingProgress || (async (userId, resourceId, resourceType) => {
  try {
    console.log('🔍 Fallback: Searching for existing progress:', { userId, resourceId, resourceType });
    
    const result = await progressService.getProgress({
      userId: userId
    });
    
    if (result.success && result.data && result.data.length > 0) {
      const exactMatch = result.data.find(record => 
        record.resourceId === resourceId && 
        record.userId === userId &&
        (!resourceType || record.resourceType === resourceType)
      );
      
      return exactMatch || null;
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️ Fallback progress search failed:', error.message);
    return null;
  }
});


 /**
 * FIXED: Initialize chapter progress with duplicate prevention
 */
const initializeChapterProgressWithAPI = async () => {
  const effectiveUserId = getEffectiveUserId();

  if (!effectiveUserId || !chapterId || !courseId) {
    console.log('Missing data for chapter progress initialization');
    return null;
  }

  try {
    console.log('📊 Initializing chapter progress...');

    // Check local state first
    if (chapterProgressRecord && chapterProgressRecord.progressId) {
      console.log('📊 Found chapter progress in local state');
      return chapterProgressRecord;
    }

    // Check if chapter progress exists in database
    const existingProgress = await getExistingProgress(effectiveUserId, chapterId, 'chapter');
    
    if (existingProgress) {
      console.log('📊 Found existing chapter progress:', existingProgress);
      setChapterProgressRecord(existingProgress);
      return existingProgress;
    }

    // Create new chapter progress only if none exists
    console.log('📊 Creating new chapter progress...');

    const newProgressData = {
      userId: effectiveUserId,
      resourceType: 'chapter',
      resourceId: chapterId,
      courseId: courseId,
      percentComplete: 0,
      status: 'in_progress'
    };

    // Only add moduleId if it exists and is valid
    if (moduleId && moduleId !== 'null' && moduleId !== 'undefined') {
      newProgressData.moduleId = moduleId;
    }

    console.log('📊 Creating chapter progress with data:', newProgressData);

    const createResponse = await progressService.createProgress(newProgressData);
    const progressRecord = createResponse.data;

    console.log('✅ Created chapter progress:', progressRecord);
    setChapterProgressRecord(progressRecord);

    return progressRecord;

  } catch (error) {
    console.error('❌ Failed to initialize chapter progress:', error);

    // Check if error is due to duplicate
    if (error.message && error.message.includes('already exists')) {
      console.log('📊 Chapter progress already exists, attempting to retrieve...');
      const existingProgress = await getExistingProgress(effectiveUserId, chapterId, 'chapter');
      if (existingProgress) {
        setChapterProgressRecord(existingProgress);
        return existingProgress;
      }
    }

    // Fallback to local progress
    const fallbackProgress = {
      resourceId: chapterId,
      resourceType: 'chapter',
      courseId: courseId,
      userId: effectiveUserId,
      status: 'in_progress',
      percentComplete: 0,
      startedAt: new Date().toISOString(),
      isLocalOnly: true
    };

    setChapterProgressRecord(fallbackProgress);
    return fallbackProgress;
  }
};

/**
 * NEW: Load existing progress for all materials at startup
 */
const loadExistingMaterialProgress = async (materials) => {
  const effectiveUserId = getEffectiveUserId();
  
  if (!effectiveUserId || !materials || materials.length === 0) {
    return materials;
  }

  try {
    // Получаем ВСЕ записи прогресса для пользователя
    const allProgress = await progressService.getProgress({
      userId: effectiveUserId // Только userId
    });

    if (allProgress.success && allProgress.data && allProgress.data.length > 0) {
      console.log('📊 Found', allProgress.data.length, 'existing progress records');

      // Фильтруем локально по materialId ИЛИ resourceId
      const progressMap = new Map();
      
      materials.forEach(material => {
        const materialProgress = allProgress.data.find(p => 
          (p.materialId === material.id || p.resourceId === material.id) && 
          p.resourceType === 'material'
        );

        if (materialProgress) {
          progressMap.set(material.id, materialProgress);
        }
      });

      // Обновляем контекст и состояние
      addProgressRecordsToContext(Array.from(progressMap.values()));
      setMaterialProgressMap(progressMap);

      // Возвращаем материалы без прогресса
      return materials.filter(material => 
        !material.isPlaceholder && 
        !material.isError && 
        !material.isEmergency &&
        !progressMap.has(material.id)
      );
    }

    return materials.filter(material => 
      !material.isPlaceholder && !material.isError && !material.isEmergency
    );

  } catch (error) {
    console.warn('⚠️ Failed to load existing progress:', error.message);
    return materials.filter(material => 
      !material.isPlaceholder && !material.isError && !material.isEmergency
    );
  }
};

/**
 * FIXED: Initialize component with existing progress loading
 */
const initializeComponent = async () => {
  try {
    setLoading(true);
    setError(null);

    console.log('📊 Starting DUPLICATE-SAFE component initialization...');

    const effectiveUserId = getEffectiveUserId();
    console.log('📊 Using user ID:', effectiveUserId);

    // Step 1: Validate required parameters
    if (!courseId || !chapterId) {
      throw new Error(`Missing required parameters: courseId=${courseId}, chapterId=${chapterId}`);
    }

    // Step 2: Load materials first
    console.log('📄 Loading chapter materials...');
    const loadedMaterials = await loadChapterMaterials();

    // Step 3: Handle progress ONLY if user is authenticated
    if (isAuthenticated && effectiveUserId) {
      console.log('📊 User authenticated - checking existing progress...');

      try {
        // CRITICAL: Load ALL existing progress FIRST to prevent duplicates
        const materialsNeedingProgress = await loadExistingMaterialProgress(loadedMaterials);
        
        // Initialize chapter progress (check existing first)
        await initializeChapterProgressWithAPI();

        // Only create progress for materials that truly don't have it
        if (materialsNeedingProgress && materialsNeedingProgress.length > 0) {
          console.log('📊 Creating progress for', materialsNeedingProgress.length, 'materials that need it');

          // Create progress for materials that don't have it yet
          // Process one at a time to avoid race conditions
          for (const material of materialsNeedingProgress) {
            try {
              console.log('📊 Creating progress for:', material.title);
              await initializeMaterialProgress(material);
              
              // Small delay to prevent API flooding
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (materialError) {
              console.warn('⚠️ Failed to create progress for:', material.title, materialError.message);
              // Continue with other materials
            }
          }
        } else {
          console.log('✅ All materials already have progress records - no creation needed');
        }

        console.log('✅ Progress initialization completed without duplicates');

      } catch (progressError) {
        console.warn('⚠️ Progress operations failed:', progressError.message);
        // Continue - app still works without progress
      }
    } else {
      console.log('👤 User not authenticated, using view-only mode');
    }

    setProgressInitialized(true);
    console.log('✅ Component initialization completed successfully');

  } catch (error) {
    console.error('❌ Component initialization failed:', error);
    setError(`Initialization failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  /**
   * SIMPLIFIED: Initialize chapter progress without complex API calls
   */
  const initializeChapterProgress = async () => {
    const effectiveUserId = getEffectiveUserId();

    if (!isAuthenticated || !effectiveUserId) {
      console.log('👤 Skipping chapter progress - user not authenticated');
      return null;
    }

    if (!chapterId || !courseId) {
      console.log('⚠️ Skipping chapter progress - missing IDs');
      return null;
    }

    try {
      console.log('📊 Setting up local chapter progress tracking...');

      // Create local progress record
      const progressRecord = {
        resourceId: chapterId,
        resourceType: 'chapter',
        courseId: courseId,
        userId: effectiveUserId,
        status: 'in_progress',
        percentComplete: 0,
        startedAt: new Date().toISOString()
      };

      setChapterProgressRecord(progressRecord);
      console.log('✅ Local chapter progress initialized');

      return progressRecord;

    } catch (error) {
      console.error('❌ Failed to initialize chapter progress:', error);
      return null;
    }
  };


/**
 * FIXED: Initialize material progress with correct API parameters
 */
/**
 * FIXED: Initialize material progress with proper state synchronization
 */
const initializeMaterialProgress = async (material) => {
  const effectiveUserId = getEffectiveUserId();
  
  if (!isAuthenticated || !effectiveUserId) {
    console.log('User not authenticated, skipping API progress creation');
    return null;
  }

  if (!material.id || !courseId) {
    console.warn('Missing required data for progress creation');
    return null;
  }

  if (material.isPlaceholder || material.isError || material.isEmergency) {
    console.log('Skipping progress for placeholder material');
    return null;
  }

  // Check if we're already processing this material
  if (loadingProgress.has(material.id)) {
    console.log('📊 Already processing:', material.title);
    return null;
  }

  setLoadingProgress(prev => new Set(prev.add(material.id)));

  try {
    console.log('📊 Initializing progress for material using ProgressContext:', material.title);

    // Use ProgressContext startResourceProgress - it will handle existence checking
    const progressRecord = await startResourceProgress(
      material.id,
      'material', 
      courseId,
      moduleId
    );

    if (progressRecord) {
      // Sync local state with ProgressContext result
      setMaterialProgressMap(prev => new Map(prev.set(material.id, progressRecord)));
      console.log('✅ Material progress initialized via ProgressContext:', progressRecord);
    }

    setLoadingProgress(prev => {
      const newSet = new Set(prev);
      newSet.delete(material.id);
      return newSet;
    });

    return progressRecord;

  } catch (error) {
    console.error('❌ Failed to initialize material progress:', error);
    
    setLoadingProgress(prev => {
      const newSet = new Set(prev);
      newSet.delete(material.id);
      return newSet;
    });

    // Fallback
    const fallbackProgress = {
      materialId: material.id,
      resourceId: material.id,
      status: 'not_started',
      percentComplete: 0,
      userId: effectiveUserId,
      isLocalOnly: true
    };

    setMaterialProgressMap(prev => new Map(prev.set(material.id, fallbackProgress)));
    return fallbackProgress;
  }
};



  /**
 * SIMPLIFIED: Mark material as completed without complex Progress Context calls
 */
  const handleMarkMaterialCompleted = async (material) => {
    const effectiveUserId = getEffectiveUserId();

    if (!isAuthenticated || !effectiveUserId) {
      alert('Please log in to track progress');
      return;
    }

    if (!material.id) {
      alert('Invalid material data');
      return;
    }

    if (material.isPlaceholder || material.isError || material.isEmergency) {
      alert('Cannot mark placeholder or error materials as completed');
      return;
    }

    try {
      console.log('📊 Marking material as completed:', material.title);

      // Step 1: Get or create progress record
      let progressRecord = materialProgressMap.get(material.id);

      if (!progressRecord || progressRecord.isLocalOnly) {
        console.log('📊 No API progress found, initializing...');
        progressRecord = await initializeMaterialProgress(material);
      }

      // Step 2: Update local state immediately (optimistic update)
      setMaterials(prevMaterials =>
        prevMaterials.map(m =>
          m.id === material.id
            ? { ...m, completed: true, completedAt: new Date().toISOString() }
            : m
        )
      );

      setMaterialProgressMap(prev => {
        const newMap = new Map(prev);
        newMap.set(material.id, {
          ...progressRecord,
          status: 'completed',
          percentComplete: 100,
          completedAt: new Date().toISOString()
        });
        return newMap;
      });

      // Step 3: Sync with API (PUT) - according to documentation
      if (progressRecord && progressRecord.progressId && !progressRecord.isLocalOnly) {
        try {
          console.log('📊 Syncing completion with API...');

          const updateResponse = await progressService.updateProgress(progressRecord.progressId, {
            percentComplete: 100,
            status: 'completed'
          });

          console.log('✅ API sync successful:', updateResponse.data);

          // Update local state with API response
          setMaterialProgressMap(prev => {
            const newMap = new Map(prev);
            newMap.set(material.id, updateResponse.data);
            return newMap;
          });

        } catch (apiError) {
          console.warn('⚠️ API sync failed, but local state updated:', apiError.message);
          // Don't revert local state - the user sees completion even if API fails
        }
      }

      console.log('✅ Material marked as completed');

    } catch (error) {
      console.error('❌ Failed to mark material as completed:', error);

      // Revert optimistic update if there was a major error
      setMaterials(prevMaterials =>
        prevMaterials.map(m =>
          m.id === material.id
            ? { ...m, completed: false, completedAt: null }
            : m
        )
      );

      alert(`Error: ${error.message}`);
    }
  };

  /**
 * SIMPLIFIED: Toggle material completion with local state management
 */
  const handleToggleMaterialCompletion = async (material) => {
    const effectiveUserId = getEffectiveUserId();

    if (!isAuthenticated || !effectiveUserId) {
      alert('Please log in to track progress');
      return;
    }

    if (!material.id) {
      alert('Invalid material data');
      return;
    }

    if (material.isPlaceholder || material.isError || material.isEmergency) {
      alert('Cannot toggle completion for placeholder or error materials');
      return;
    }

    try {
      const isCurrentlyCompleted = isMaterialCompleted(material);
      const newCompletedState = !isCurrentlyCompleted;
      const action = newCompletedState ? 'completing' : 'uncompleting';

      console.log(`📊 ${action} material:`, material.title);

      // Step 1: Get or create progress record
      let progressRecord = materialProgressMap.get(material.id);

      if (!progressRecord || progressRecord.isLocalOnly) {
        console.log('📊 No API progress found, initializing...');
        progressRecord = await initializeMaterialProgress(material);
      }

      // Step 2: Optimistic update of local state
      setMaterials(prevMaterials =>
        prevMaterials.map(m =>
          m.id === material.id
            ? {
              ...m,
              completed: newCompletedState,
              completedAt: newCompletedState ? new Date().toISOString() : null
            }
            : m
        )
      );

      setMaterialProgressMap(prev => {
        const newMap = new Map(prev);
        newMap.set(material.id, {
          ...progressRecord,
          status: newCompletedState ? 'completed' : 'in_progress',
          percentComplete: newCompletedState ? 100 : 0,
          completedAt: newCompletedState ? new Date().toISOString() : null
        });
        return newMap;
      });

      // Step 3: Sync with API if we have a valid progress record
      if (progressRecord && progressRecord.progressId && !progressRecord.isLocalOnly) {
        try {
          console.log('📊 Syncing toggle with API...');

          const updateData = {
            percentComplete: newCompletedState ? 100 : 0,
            status: newCompletedState ? 'completed' : 'in_progress'
          };

          // Don't set completedAt to null explicitly - let API handle it
          if (newCompletedState) {
            updateData.completedAt = new Date().toISOString();
          }

          const updateResponse = await progressService.updateProgress(progressRecord.progressId, updateData);

          console.log('✅ API toggle sync successful:', updateResponse.data);

          // Update local state with API response
          setMaterialProgressMap(prev => {
            const newMap = new Map(prev);
            newMap.set(material.id, updateResponse.data);
            return newMap;
          });

        } catch (apiError) {
          console.warn('⚠️ API toggle sync failed, but local state updated:', apiError.message);
          // Don't revert - user still sees the change
        }
      }

      // Step 4: Show success message
      const actionText = newCompletedState ? 'completed' : 'marked as incomplete';
      console.log(`✅ Material ${actionText} successfully`);

    } catch (error) {
      console.error(`❌ Failed to toggle material completion:`, error);

      // Revert optimistic update on major error
      const revertedState = !isMaterialCompleted(material);
      setMaterials(prevMaterials =>
        prevMaterials.map(m =>
          m.id === material.id
            ? {
              ...m,
              completed: revertedState,
              completedAt: revertedState ? new Date().toISOString() : null
            }
            : m
        )
      );

      alert(`Error: ${error.message}`);
    }
  };

  /**
 * SIMPLIFIED: Load chapter materials without complex progress initialization
 */
  const loadChapterMaterials = async () => {
    try {
      console.log('📄 Loading materials for chapter ID:', chapterId);

      if (!chapterId) {
        throw new Error('Chapter ID is required');
      }

      // Use the materials API
      const result = await coursesService.getChapterMaterialsWithFallback(chapterId, chapterInfo.title);

      if (result.success) {
        console.log('✅ Materials loaded successfully:', result.data.length, 'items');

        // Set materials in state first
        setMaterials(result.data);

        // Return the materials so they can be used immediately by initializeComponent
        return result.data;

      } else {
        throw new Error(result.message || 'Failed to load materials');
      }

    } catch (error) {
      console.error('❌ Failed to load chapter materials:', error);
      setError(`Failed to load materials: ${error.message}`);
      setMaterials([]);
      return [];
    }
  };

  /**
   * Handle retry
   */
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await initializeComponent(); // FIXED: Retry full initialization
  };

  /**
   * Handle material selection
   */
  const handleMaterialSelect = (material) => {
    console.log('📖 Selected material:', material.title);
    setSelectedMaterial(material);

    // Initialize progress for selected material if needed (background)
    if (!material.isPlaceholder && !material.isError && user?.id) {
      initializeMaterialProgress(material).catch(error => {
        console.warn('⚠️ Failed to initialize progress for selected material:', error);
      });
    }
  };

  /**
 * IMPROVED: Check if material is completed with multiple sources
 */
  const isMaterialCompleted = (material) => {
    if (!material?.id) return false;

    try {
      // First check local state
      const localProgress = materialProgressMap.get(material.id);
      if (localProgress?.status === 'completed') {
        return true;
      }

      // Check material's own completed property
      if (material.completed === true) {
        return true;
      }

      // Try context progress if available
      if (getResourceProgress && typeof getResourceProgress === 'function') {
        const contextProgress = getResourceProgress(material.id);
        if (contextProgress?.status === 'completed') {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn('Error checking material completion:', error);
      return material.completed || false;
    }
  };

  /**
   * IMPROVED: Get material progress percentage
   */
  const getMaterialProgressPercentage = (material) => {
    if (!material?.id) return 0;

    try {
      const localProgress = materialProgressMap.get(material.id);
      const contextProgress = safeGetResourceProgress(material.id);

      const percentage =
        localProgress?.percentComplete ||
        contextProgress?.percentComplete ||
        (isMaterialCompleted(material) ? 100 : 0);

      return Math.max(0, Math.min(100, percentage));
    } catch (error) {
      console.warn('Error getting material progress:', error);
      return isMaterialCompleted(material) ? 100 : 0;
    }
  };

  // ... [Keep all the existing utility functions for icons, colors, content rendering, etc.] ...

  /**
   * Get material icon based on type
   */
  const getMaterialIcon = (type) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'video': return <HiPlayCircle className={iconClass} />;
      case 'code': return <HiCodeBracket className={iconClass} />;
      case 'quiz': return <HiQuestionMarkCircle className={iconClass} />;
      case 'text':
      default: return <HiDocumentText className={iconClass} />;
    }
  };

  /**
   * Get material background color based on type
   */
  const getMaterialBgColor = (type) => {
    switch (type) {
      case 'video': return 'bg-red-50 hover:bg-red-100 text-red-700';
      case 'code': return 'bg-blue-50 hover:bg-blue-100 text-blue-700';
      case 'quiz': return 'bg-purple-50 hover:bg-purple-100 text-purple-700';
      case 'text':
      default: return 'bg-gray-50 hover:bg-gray-100 text-gray-700';
    }
  };

  /**
   * Check if material content is a URL
   */
  const isUrlContent = (material) => {
    const urlToCheck = material.url || material.content;
    if (!urlToCheck) return false;
    return urlToCheck.startsWith('http://') || urlToCheck.startsWith('https://');
  };

  /**
   * Check if material is a markdown URL
   */
  const isMarkdownUrl = (material) => {
    if (material.isMarkdownUrl) return true;
    const urlToCheck = material.url || material.content;
    if (!isUrlContent(material)) return false;
    return urlToCheck.endsWith('.md') || urlToCheck.includes('.md?') || urlToCheck.includes('README');
  };

  /**
   * Get the actual content URL from material
   */
  const getContentUrl = (material) => {
    return material.url || material.content;
  };

  /**
   * Enhanced material content renderer
   */
  const renderMaterialContent = (material) => {
    if (!material) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <HiBookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Select a material to view its content</p>
          </div>
        </div>
      );
    }

    // Handle placeholder/error materials
    if (material.isPlaceholder || material.isError || material.isEmergency) {
      return (
        <div className="space-y-6">
          <div className={`border rounded-lg p-6 ${material.isError || material.isEmergency
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
            }`}>
            <div className="flex items-start">
              {material.isError || material.isEmergency ? (
                <HiExclamationTriangle className="w-6 h-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
              ) : (
                <HiSparkles className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold text-lg mb-2 ${material.isError || material.isEmergency ? 'text-red-900' : 'text-blue-900'
                  }`}>
                  {material.title}
                </h3>

                <MarkdownRenderer
                  content={material.content}
                  className={material.isError || material.isEmergency ? 'text-red-800' : 'text-blue-800'}
                />

                {(material.isError || material.isEmergency) && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleRetry}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200 flex items-center"
                    >
                      <HiArrowPath className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Retry Loading
                    </button>

                    <button
                      onClick={onBack || (() => navigate(-1))}
                      className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center"
                    >
                      <HiArrowLeft className="w-4 h-4 mr-2" />
                      Go Back
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render content based on material type
    switch (material.type) {
      case 'text':
        if (isMarkdownUrl(material)) {
          const contentUrl = getContentUrl(material);
          return (
            <div className="space-y-4">
              <MarkdownRenderer
                url={contentUrl}
                title={material.title}
                showSource={true}
                className="bg-white"
              />
            </div>
          );
        } else if (isUrlContent(material)) {
          const contentUrl = getContentUrl(material);
          return (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center mb-3">
                  <HiLink className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">External Resource</span>
                </div>
                <p className="text-blue-700 mb-4">
                  This material links to an external resource.
                </p>
                <a
                  href={contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Open Resource
                  <HiLink className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <MarkdownRenderer
                content={material.content}
                title={material.title}
                className="prose-lg"
              />
            </div>
          );
        }

      case 'video':
        return (
          <VideoPlayer
            url={getContentUrl(material)}
            title={material.title}
            description={material.description}
            onVideoEnd={() => console.log('Video completed')}
          />
        );

      case 'code':
        return (
          <div className="space-y-4">
            <MarkdownRenderer
              content={`\`\`\`${material.language || 'javascript'}\n${getContentUrl(material)}\n\`\`\``}
              title={material.title}
            />
            {material.description && (
              <div className="text-gray-600">
                <MarkdownRenderer content={material.description} />
              </div>
            )}
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center mb-4">
                <HiQuestionMarkCircle className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-purple-900">Interactive Quiz</h3>
              </div>
              <div className="text-purple-800">
                <MarkdownRenderer content={getContentUrl(material)} />
              </div>
              <button className="mt-4 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200">
                Start Quiz
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <MarkdownRenderer
              content={getContentUrl(material)}
              title={material.title}
            />
          </div>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B6B] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading materials...</p>
              <p className="text-sm text-gray-500 mt-2">Chapter ID: {chapterId}</p>
              {!progressInitialized && (
                <p className="text-xs text-gray-400 mt-1">Initializing progress tracking...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overall chapter progress
  const overallChapterProgress = chapterId ?
    getResourceProgressPercentage(chapterId) :
    (materials.length > 0 ? Math.round((materials.filter(isMaterialCompleted).length / materials.length) * 100) : 0);

  const chapterProgressPercentage = calculateChapterProgress();
  const completedCount = getCompletedMaterialsCount();
  const totalCount = getTotalValidMaterialsCount();

  console.log('🎯 Progress Display:', {
    completedCount,
    totalCount,
    percentage: chapterProgressPercentage,
    materials: materials.map(m => ({ title: m.title, completed: isMaterialCompleted(m) }))
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack || (() => navigate(-1))}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 mb-4"
          >
            <HiArrowLeft className="w-5 h-5 mr-2" />
            Back to Module
          </button>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {chapterInfo.title}
                </h1>
                <p className="text-gray-600">{chapterInfo.courseTitle}</p>

                {/* FIXED: Progress Info with authentication check */}
                {materials.length > 0 && (
                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {materials.filter(isMaterialCompleted).length} of {materials.length} materials completed
                    </span>
                    {!isAuthenticated && (
                      <span className="text-orange-600">
                        (Login to track progress)
                      </span>
                    )}
                    {progressLoading && isAuthenticated && (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-[#FF6B6B] mr-1"></div>
                        Syncing progress...
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* API Health Indicator */}
                {/* <div className="flex items-center">
                  <HiWifi className={`w-5 h-5 ${apiHealthy ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`ml-2 text-sm ${apiHealthy ? 'text-green-600' : 'text-red-600'}`}>
                    {apiHealthy ? 'Connected' : 'Issues'}
                  </span>
                </div> */}

                {/* Progress */}
                {/* <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Progress</div>
                  <div className="text-2xl font-bold text-[#FF6B6B] mb-2">{overallChapterProgress}%</div>
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${overallChapterProgress}%` }}
                    ></div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* FIXED: Error State with better messaging */}
        {error && !materials.some(m => m.isError || m.isEmergency) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-red-800 font-medium">Materials Loading Issue</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={handleRetry}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors duration-200 flex items-center"
                  >
                    <HiArrowPath className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Try Again
                  </button>
                  <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors duration-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Error */}
        {progressError && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start">
              <HiExclamationTriangle className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-orange-800 font-medium">Progress Tracking Issue</h3>
                <p className="text-orange-700 text-sm mt-1">{progressError}</p>
                <p className="text-orange-600 text-xs mt-1">
                  You can still view materials, but progress won't be saved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chapter Summary Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chapter Summary</h2>

          {/* Progress Stats */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-600">
              {completedCount} of {totalCount} materials completed
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-[#FF6B6B]">
                {chapterProgressPercentage}%
              </span>
              <span className="text-gray-500 text-sm">Chapter Progress</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div
              className="bg-[#FF6B6B] h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${chapterProgressPercentage}%` }}
            ></div>
          </div>

          {/* Material Type Breakdown */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {materials.filter(m => m.type === 'text' && !m.isPlaceholder && !m.isError && !m.isEmergency).length}
              </div>
              <div className="text-sm text-gray-500">Text Materials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {materials.filter(m => m.type === 'video' && !m.isPlaceholder && !m.isError && !m.isEmergency).length}
              </div>
              <div className="text-sm text-gray-500">Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {materials.filter(m => m.type === 'code' && !m.isPlaceholder && !m.isError && !m.isEmergency).length}
              </div>
              <div className="text-sm text-gray-500">Code Examples</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {materials.filter(m => m.type === 'quiz' && !m.isPlaceholder && !m.isError && !m.isEmergency).length}
              </div>
              <div className="text-sm text-gray-500">Quizzes</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Materials Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Materials ({materials.length})
              </h2>

              <div className="space-y-3">
                {materials.map((material, index) => {
                  const isCompleted = isMaterialCompleted(material);
                  const progressPercentage = getResourceProgressPercentage(material.id);

                  return (
                    <button
                      key={material.id}
                      onClick={() => handleMaterialSelect(material)}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 hover:shadow-md ${selectedMaterial?.id === material.id
                        ? 'bg-[#FF6B6B] text-white shadow-md transform scale-105'
                        : getMaterialBgColor(material.type)
                        }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 mt-0.5 ${selectedMaterial?.id === material.id ? 'text-white' : ''
                          }`}>
                          {getMaterialIcon(material.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-semibold leading-tight mb-1 ${selectedMaterial?.id === material.id ? 'text-white' : 'text-gray-900'
                            }`}>
                            {material.title}
                          </h3>

                          {/* Type badge */}
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 ${selectedMaterial?.id === material.id
                            ? 'bg-white bg-opacity-20 text-white'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {material.type}
                          </span>

                          {/* Progress indicator */}
                          <div className="flex items-center space-x-2 mt-2">
                            {isMaterialCompleted(material) ? (
                              <div className="flex items-center space-x-1">
                                <HiCheckCircle className={`w-4 h-4 ${selectedMaterial?.id === material.id ? 'text-white' : 'text-green-500'
                                  }`} />
                                <span className={`text-xs ${selectedMaterial?.id === material.id ? 'text-white' : 'text-green-600'
                                  }`}>
                                  Completed
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <div className={`w-4 h-4 rounded-full border-2 ${selectedMaterial?.id === material.id
                                  ? 'border-white'
                                  : 'border-gray-300'
                                  }`} />
                                <span className={`text-xs ${selectedMaterial?.id === material.id ? 'text-white' : 'text-gray-500'
                                  }`}>
                                  Not completed
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Material Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              {selectedMaterial && (
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {getMaterialIcon(selectedMaterial.type)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedMaterial.title}
                      </h2>

                      {/* Progress and completion info */}
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 capitalize">
                          {selectedMaterial.type}
                        </span>

                        {isMarkdownUrl(selectedMaterial) && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Markdown
                          </span>
                        )}

                        {/* Progress percentage */}
                        {getResourceProgressPercentage(selectedMaterial.id) > 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            {getResourceProgressPercentage(selectedMaterial.id)}% complete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FIXED: Enhanced completion buttons with authentication check */}
                  {!selectedMaterial.isPlaceholder && !selectedMaterial.isError && !selectedMaterial.isEmergency && (
                    <div className="flex items-center space-x-3">
                      {(!isAuthenticated && !user?.email) ? (
                        /* Show login prompt for non-authenticated users */
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Login to track progress</p>
                          <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                          >
                            Login
                          </button>
                        </div>
                      ) : isMaterialCompleted(selectedMaterial) ? (
                        <>
                          {/* Completed state */}
                          <div className="flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                            <HiCheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </div>

                          {/* Uncomplete button */}
                          <button
                            onClick={() => handleToggleMaterialCompletion(selectedMaterial)}
                            disabled={progressLoading}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors duration-200 flex items-center"
                          >
                            {progressLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-600 mr-2"></div>
                            ) : (
                              <HiXCircle className="w-4 h-4 mr-2" />
                            )}
                            Mark Incomplete
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Not completed state */}
                          <button
                            onClick={() => handleMarkMaterialCompleted(selectedMaterial)}
                            disabled={progressLoading}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors duration-200 flex items-center"
                          >
                            {progressLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                            ) : (
                              <HiCheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Mark Complete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}


              <div className="prose prose-lg max-w-none markdown-content">
                {renderMaterialContent(selectedMaterial)}
              </div>
            </div>
          </div>
        </div>

        

        {/* FIXED: Debug Panel (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <details>
              <summary className="cursor-pointer font-medium text-gray-700 mb-4">
                🔧 Debug Info (Development Only)
              </summary>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Authentication:</h4>
                    <p>User ID: {user?.id || 'Not logged in'}</p>
                    <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">IDs:</h4>
                    <p>Chapter ID: {chapterId}</p>
                    <p>Course ID: {courseId}</p>
                    <p>Module ID: {moduleId || 'None'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold">Progress State:</h4>
                  <p>Progress Initialized: {progressInitialized ? 'Yes' : 'No'}</p>
                  <p>Progress Loading: {progressLoading ? 'Yes' : 'No'}</p>
                  <p>Progress Error: {progressError || 'None'}</p>
                  <p>Material Progress Map Size: {materialProgressMap.size}</p>
                </div>

                <div>
                  <h4 className="font-semibold">Materials:</h4>
                  <p>Total Materials: {materials.length}</p>
                  <p>Completed Materials: {materials.filter(isMaterialCompleted).length}</p>
                  <p>Selected Material: {selectedMaterial?.title || 'None'}</p>
                </div>

                {selectedMaterial && (
                  <div>
                    <h4 className="font-semibold">Selected Material Debug:</h4>
                    <p>Material ID: {selectedMaterial.id}</p>
                    <p>Is Placeholder: {selectedMaterial.isPlaceholder ? 'Yes' : 'No'}</p>
                    <p>Is Error: {selectedMaterial.isError ? 'Yes' : 'No'}</p>
                    <p>Is Completed (local): {selectedMaterial.completed ? 'Yes' : 'No'}</p>
                    <p>Is Completed (context): {isResourceCompleted(selectedMaterial.id) ? 'Yes' : 'No'}</p>
                    <p>Progress Percentage: {getResourceProgressPercentage(selectedMaterial.id)}%</p>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}

      </div>
    </div>
  );
};

export default ChapterMaterialsView;