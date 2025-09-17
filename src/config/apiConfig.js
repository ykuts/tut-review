import { environmentInfo } from './authConfig';

const config = {
    // Azure Functions URL
    AZURE_FUNCTIONS_URL: 'https://aitutfunc.azurewebsites.net/api',
    
    // Function Keys Configuration
    FUNCTION_KEYS: {
        // Host Key - works for ALL functions (RECOMMENDED)
        HOST: HOST,
        
        // Individual function keys (optional)
        USERS: USERS,
        COURSES: null, // Will use HOST key
        MODULES: null, // Will use HOST key  
        CHAPTERS: null, // Will use HOST key
        MATERIALS: null, // Will use HOST key
        PROGRESS: null
    },
    
    // Request settings
    TIMEOUT: 15000,
    
    // API Endpoints
    ENDPOINTS: {
        // Users API
        USERS: '/users',
        USER_BY_ID: '/users',
        
        // Courses API  
        COURSES: '/courses',
        COURSE_BY_ID: '/courses', // Will append /{id}
        
        // Modules API
        MODULES: '/modules', 
        MODULES_BY_COURSE: '/modules',
        
        // Chapters API
        CHAPTERS: '/chapters',
        CHAPTERS_BY_MODULE: '/chapters',

        // Materials API
        MATERIALS: '/materials',
        MATERIALS_BY_CHAPTER: '/materials', // Will append ?chapterId=X
        MATERIAL_BY_ID: '/materials', // Will append /{materialId}
        CONTENT_BY_MATERIAL_ID: '/content', // Will append /{materialId} for content uploads
        
        // Progress API
        PROGRESS: '/progress',
        PROGRESS_BY_ID: '/progress', // Will append /{progressId}
    },
    
    // Default headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AI-Tutor-Frontend/1.0'
    },

    // Material Type Configurations
    MATERIAL_TYPES: {
        // Database type to component type mapping
        TYPE_MAPPING: {
            // Video types
            'mp4': 'video',
            'avi': 'video', 
            'mov': 'video',
            'mkv': 'video',
            'webm': 'video',
            'video': 'video',
            
            // Text/Document types
            'link': 'text',
            'url': 'text',
            'pdf': 'text',
            'doc': 'text',
            'docx': 'text',
            'txt': 'text',
            'text': 'text',
            'markdown': 'text',
            'md': 'text',
            'document': 'text',
            'article': 'text',
            
            // Code types
            'code': 'code',
            'js': 'code',
            'javascript': 'code',
            'py': 'code',
            'python': 'code',
            'java': 'code',
            'cpp': 'code',
            'c': 'code',
            'html': 'code',
            'css': 'code',
            'json': 'code',
            'xml': 'code',
            
            // Interactive types
            'exercise': 'exercise',
            'assignment': 'exercise',
            'practice': 'exercise',
            'lab': 'exercise',
            
            'quiz': 'quiz',
            'test': 'quiz',
            'assessment': 'quiz',
            'exam': 'quiz'
        },

        // Display configurations
        DISPLAY_CONFIG: {
            video: {
                label: 'Video Tutorial',
                icon: 'HiPlayCircle',
                bgColor: 'bg-red-50 hover:bg-red-100',
                iconColor: 'text-red-500',
                section: 'Video Tutorial'
            },
            text: {
                label: 'Reading Material',
                icon: 'HiDocumentText',
                bgColor: 'bg-blue-50 hover:bg-blue-100',
                iconColor: 'text-blue-500',
                section: 'Introduction'
            },
            code: {
                label: 'Code Example',
                icon: 'HiCodeBracket',
                bgColor: 'bg-green-50 hover:bg-green-100',
                iconColor: 'text-green-500',
                section: 'Code Example'
            },
            exercise: {
                label: 'Practice Exercise',
                icon: 'HiSparkles',
                bgColor: 'bg-orange-50 hover:bg-orange-100',
                iconColor: 'text-orange-500',
                section: 'Practice Exercise'
            },
            quiz: {
                label: 'Knowledge Check',
                icon: 'HiQuestionMarkCircle',
                bgColor: 'bg-purple-50 hover:bg-purple-100',
                iconColor: 'text-purple-500',
                section: 'Knowledge Check'
            }
        }
    },

    // Progress Status Configurations
    PROGRESS_STATUS: {
        NOT_STARTED: 'not_started',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed'
    },

    // Resource Type Configurations for Progress
    RESOURCE_TYPES: {
        COURSE: 'course',
        MODULE: 'module', 
        CHAPTER: 'chapter',
        MATERIAL: 'material' // Custom type for individual materials
    }
};

/**
 * Get function key for endpoint
 */
export const getFunctionKeyForEndpoint = (endpoint) => {
    const keys = config.FUNCTION_KEYS;
    
    // Always prefer HOST key first
    if (keys.HOST) {
        console.log(`🔑 Using HOST key for ${endpoint}`);
        return keys.HOST;
    }
    
    // Fallback to specific keys
    if (endpoint === '/users' && keys.USERS) {
        console.log(`🔑 Using USERS key for ${endpoint}`);
        return keys.USERS;
    }

    // Progress endpoint support
    if (endpoint === '/progress' && keys.PROGRESS) {
        console.log(`🔑 Using PROGRESS key for ${endpoint}`);
        return keys.PROGRESS;
    }
    
    console.warn(`⚠️ No function key found for ${endpoint}`);
    return null;
};

/**
 * Build URL for materials with proper query handling
 */
export const buildMaterialsUrl = (chapterId = null, materialId = null) => {
    let url = config.AZURE_FUNCTIONS_URL + '/materials';
    
    if (materialId) {
        // Get specific material: /materials/{materialId}
        url += `/${materialId}`;
    } else if (chapterId) {
        // Get materials by chapter: /materials?chapterId=xxx
        url += `?chapterId=${encodeURIComponent(chapterId)}`;
    }
    
    console.log(`🔗 Built materials URL: ${url}`);
    return url;
};

/**
 * Build URL for progress with proper query handling
 */
export const buildProgressUrl = (progressId = null, queryParams = {}) => {
    let url = config.AZURE_FUNCTIONS_URL + '/progress';
    
    if (progressId) {
        // Get specific progress: /progress/{progressId}
        url += `/${progressId}`;
    } else {
        // Get progress with query parameters: /progress?userId=xxx&courseId=xxx
        const params = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                params.append(key, value);
            }
        });
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
    }
    
    console.log(`🔗 Built progress URL: ${url}`);
    return url;
};

/**
 * Test materials API configuration
 */
export const testMaterialsConfig = () => {
    console.log('🔧 Materials API Configuration:');
    console.log('  Base URL:', config.AZURE_FUNCTIONS_URL);
    console.log('  Materials Endpoint:', config.ENDPOINTS.MATERIALS);
    console.log('  Host Key Available:', !!config.FUNCTION_KEYS.HOST);
    console.log('  Example URLs:');
    console.log('    By Chapter:', buildMaterialsUrl('sample-chapter-id'));
    console.log('    By ID:', buildMaterialsUrl(null, 'sample-material-id'));
    
    return {
        configured: !!(config.AZURE_FUNCTIONS_URL && config.FUNCTION_KEYS.HOST),
        baseUrl: config.AZURE_FUNCTIONS_URL,
        hasHostKey: !!config.FUNCTION_KEYS.HOST
    };
};

/**
 * Test progress API configuration
 */
export const testProgressConfig = () => {
    console.log('🔧 Progress API Configuration:');
    console.log('  Base URL:', config.AZURE_FUNCTIONS_URL);
    console.log('  Progress Endpoint:', config.ENDPOINTS.PROGRESS);
    console.log('  Host Key Available:', !!config.FUNCTION_KEYS.HOST);
    console.log('  Example URLs:');
    console.log('    By User:', buildProgressUrl(null, { userId: 'sample-user-id' }));
    console.log('    By ID:', buildProgressUrl('sample-progress-id'));
    console.log('  Resource Types:', Object.values(config.RESOURCE_TYPES));
    console.log('  Progress Statuses:', Object.values(config.PROGRESS_STATUS));
    
    return {
        configured: !!(config.AZURE_FUNCTIONS_URL && config.FUNCTION_KEYS.HOST),
        baseUrl: config.AZURE_FUNCTIONS_URL,
        hasHostKey: !!config.FUNCTION_KEYS.HOST,
        resourceTypes: config.RESOURCE_TYPES,
        progressStatuses: config.PROGRESS_STATUS
    };
};

/**
 * Build URL with proper ID handling
 */
export const buildUrl = (endpoint, id = null, queryParams = {}) => {
    let url = config.AZURE_FUNCTIONS_URL + endpoint;
    
    // Handle specific ID-based endpoints
    if (id) {
        if (endpoint === '/users' || endpoint === '/courses' || endpoint === '/materials' || endpoint === '/content') {
            url += `/${id}`;
            console.log(`🔗 Built ID-based URL: ${url}`);
        }
    }
    
    // Handle query parameters for other endpoints
    const params = new URLSearchParams();
    
    // Add query params for module/chapter filtering
    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            params.append(key, value);
        }
    });
    
    if (params.toString()) {
        url += `?${params.toString()}`;
        console.log(`🔗 Built query URL: ${url}`);
    }
    
    return url;
};

/**
 * Get request options with authentication
 */
export const getRequestOptions = (additionalHeaders = {}, functionKey = null, timeout = config.TIMEOUT) => {
    const headers = {
        ...config.DEFAULT_HEADERS,
        ...additionalHeaders
    };
    
    // Add function key if provided
    if (functionKey) {
        headers['x-functions-key'] = functionKey;
        console.log(`✅ Adding function key: ${functionKey.substring(0, 8)}...`);
    } else {
        console.log(`⚠️ No function key provided`);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    return {
        headers,
        signal: controller.signal,
        _timeoutId: timeoutId
    };
};

/**
 * Map database material type to component type
 */
export const mapMaterialType = (dbType) => {
    if (!dbType) return 'text';
    
    const normalizedType = dbType.toLowerCase().trim();
    return config.MATERIAL_TYPES.TYPE_MAPPING[normalizedType] || 'text';
};

/**
 * Get material display configuration
 */
export const getMaterialDisplayConfig = (componentType) => {
    return config.MATERIAL_TYPES.DISPLAY_CONFIG[componentType] || config.MATERIAL_TYPES.DISPLAY_CONFIG.text;
};

/**
 * Validate material data
 */
export const validateMaterialData = (material) => {
    const errors = [];
    
    if (!material.title) {
        errors.push('Material title is required');
    }
    
    if (!material.type) {
        errors.push('Material type is required');
    }
    
    if (!material.materialId && !material._id) {
        errors.push('Material ID is required');
    }
    
    if (!material.chapterId) {
        errors.push('Chapter ID is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate progress data
 */
export const validateProgressData = (progressData) => {
    const errors = [];
    
    if (!progressData.userId) {
        errors.push('User ID is required');
    }
    
    if (!progressData.resourceType) {
        errors.push('Resource type is required');
    }
    
    if (!progressData.resourceId) {
        errors.push('Resource ID is required');
    }
    
    if (!progressData.courseId) {
        errors.push('Course ID is required');
    }
    
    if (progressData.percentComplete !== undefined) {
        const percent = parseFloat(progressData.percentComplete);
        if (isNaN(percent) || percent < 0 || percent > 100) {
            errors.push('Percent complete must be between 0 and 100');
        }
    }
    
    if (progressData.status && !Object.values(config.PROGRESS_STATUS).includes(progressData.status)) {
        errors.push(`Status must be one of: ${Object.values(config.PROGRESS_STATUS).join(', ')}`);
    }
    
    if (progressData.resourceType && !Object.values(config.RESOURCE_TYPES).includes(progressData.resourceType)) {
        errors.push(`Resource type must be one of: ${Object.values(config.RESOURCE_TYPES).join(', ')}`);
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Generate content based on material type and DB data
 */
export const generateMaterialContent = (componentType, material) => {
    switch (componentType) {
        case 'video':
            return material.url || material.content || 'Video content will be available soon';
            
        case 'text':
            if (material.type === 'link' || material.type === 'url') {
                return `# ${material.title}\n\nThis material is available as an external resource.\n\n[Access Material](${material.url || material.content || '#'})\n\nContent summary and key points will be available here soon.`;
            }
            
            if (material.type === 'pdf' || material.type === 'document') {
                return `# ${material.title}\n\nThis is a document resource that contains important information for this chapter.\n\n📄 **Document Type:** ${material.type.toUpperCase()}\n\nDocument content will be processed and displayed here soon.`;
            }
            
            return material.content || `# ${material.title}\n\nContent will be available soon.\n\nThis material is being prepared and will include:\n- Key concepts and explanations\n- Examples and illustrations\n- Additional resources for further reading`;
            
        case 'code':
            if (material.content) {
                return material.content;
            }
            
            const language = material.language || detectLanguageFromType(material.type) || 'javascript';
            return `// ${material.title}\n// Code example will be available soon\n// Language: ${language}\n\nconsole.log("Hello World!");\n\n// This code example will demonstrate:\n// - Key programming concepts\n// - Practical implementation\n// - Best practices`;
            
        case 'exercise':
            return material.content || `## Exercise: ${material.title}\n\n**Objective:** Complete this exercise to practice what you've learned.\n\n### Instructions:\n1. Review the concepts covered in this chapter\n2. Follow the step-by-step instructions below\n3. Test your implementation\n4. Submit your solution\n\n### Task Details:\nDetailed instructions will be available soon.\n\n### Expected Outcome:\nYou should be able to demonstrate understanding of the key concepts covered in this chapter.\n\n### Resources:\n- Reference materials from previous sections\n- Code examples and templates\n- Helpful links and documentation`;
            
        case 'quiz':
            return material.content || 'Interactive quiz questions will be available soon to test your understanding of the chapter content.';
            
        default:
            return material.content || 'Content will be available soon.';
    }
};

/**
 * Detect programming language from file type
 */
const detectLanguageFromType = (type) => {
    if (!type) return 'javascript';
    
    const languageMap = {
        'js': 'javascript',
        'javascript': 'javascript',
        'py': 'python',
        'python': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'xml': 'xml'
    };
    
    return languageMap[type.toLowerCase()] || 'javascript';
};

/**
 * Get type-specific properties for materials
 */
export const getMaterialTypeProperties = (componentType, material) => {
    switch (componentType) {
        case 'video':
            return {
                duration: material.duration || estimateDuration(material),
                url: material.url || material.content,
                description: material.description || 'Video tutorial covering key concepts'
            };
            
        case 'text':
            return {
                url: (material.type === 'link' || material.type === 'url') ? (material.url || material.content) : null,
                isLink: material.type === 'link' || material.type === 'url',
                documentType: material.type === 'pdf' || material.type === 'document' ? material.type : null
            };
            
        case 'code':
            return {
                language: material.language || detectLanguageFromType(material.type)
            };
            
        case 'exercise':
            return {
                difficulty: material.difficulty || 'beginner',
                estimatedTime: material.estimatedTime || estimateExerciseTime(material)
            };
            
        case 'quiz':
            return {
                questions: material.questions || [],
                timeLimit: material.timeLimit,
                passingScore: material.passingScore
            };
            
        default:
            return {};
    }
};

/**
 * Estimate duration for video materials
 */
const estimateDuration = (material) => {
    return 'TBD';
};

/**
 * Estimate time for exercise completion
 */
const estimateExerciseTime = (material) => {
    if (material.content && material.content.length > 1000) {
        return '30-45 minutes';
    }
    return '15-30 minutes';
};

/**
 * NEW: Progress utility functions
 */

/**
 * Calculate progress percentage based on completed items
 */
export const calculateProgressPercentage = (completedItems, totalItems) => {
    if (totalItems === 0) return 0;
    return Math.round((completedItems / totalItems) * 100);
};

/**
 * Determine progress status based on percentage
 */
export const getProgressStatus = (percentComplete) => {
    if (percentComplete >= 100) return config.PROGRESS_STATUS.COMPLETED;
    if (percentComplete > 0) return config.PROGRESS_STATUS.IN_PROGRESS;
    return config.PROGRESS_STATUS.NOT_STARTED;
};

/**
 * Format progress for display
 */
export const formatProgressDisplay = (progressRecord) => {
    if (!progressRecord) {
        return {
            percentage: 0,
            status: 'Not Started',
            statusColor: 'text-gray-500',
            bgColor: 'bg-gray-100'
        };
    }

    const percentage = progressRecord.percentComplete || 0;
    let status, statusColor, bgColor;

    switch (progressRecord.status) {
        case config.PROGRESS_STATUS.COMPLETED:
            status = 'Completed';
            statusColor = 'text-green-600';
            bgColor = 'bg-green-100';
            break;
        case config.PROGRESS_STATUS.IN_PROGRESS:
            status = 'In Progress';
            statusColor = 'text-blue-600';
            bgColor = 'bg-blue-100';
            break;
        default:
            status = 'Not Started';
            statusColor = 'text-gray-500';
            bgColor = 'bg-gray-100';
    }

    return {
        percentage,
        status,
        statusColor,
        bgColor,
        startedAt: progressRecord.startedAt,
        completedAt: progressRecord.completedAt,
        lastUpdated: progressRecord.lastUpdated
    };
};


/**
 * Get configuration status
 */
export const getConfigStatus = () => {
    const keys = config.FUNCTION_KEYS;
    
    return {
        baseUrl: config.AZURE_FUNCTIONS_URL,
        hasHostKey: !!keys.HOST,
        hostKeyPreview: keys.HOST ? keys.HOST.substring(0, 8) + '...' : 'NOT_SET',
        hasUsersKey: !!keys.USERS,
        environment: environmentInfo.environment,
        supportedEndpoints: [
            'GET /courses',
            'GET /courses/{id}',
            'GET /modules?courseId=X',
            'GET /chapters?moduleId=X',
            'GET /chapters/{id}',
            'GET /materials?chapterId=X',
            'GET /materials/{id}',
            'GET /materials/stats',
            'POST /modules',
            'POST /chapters',
            'POST /materials',
            'GET /progress?userId=X&courseId=Y',
            'GET /progress/{progressId}',
            'POST /progress',
            'PUT /progress/{progressId}',
            'DELETE /progress/{progressId}'
        ],
        materialTypes: Object.keys(config.MATERIAL_TYPES.TYPE_MAPPING).length,
        supportedMaterialTypes: Object.keys(config.MATERIAL_TYPES.DISPLAY_CONFIG),
        progressStatuses: Object.keys(config.PROGRESS_STATUS),
        resourceTypes: Object.keys(config.RESOURCE_TYPES)
    };
};

// Auto-check configuration
const status = getConfigStatus();
console.log('🔧 API Config Status:', status);

if (!status.hasHostKey) {
    console.error('❌ HOST KEY NOT SET!');
    console.error('   1. Go to Azure Portal → aitutfunc → App Keys');
    console.error('   2. Copy the "default" host key');
    console.error('   3. Replace YOUR_HOST_KEY_HERE in apiConfig.js');
} else {
    console.log('✅ Host Key configured:', status.hostKeyPreview);
}

// NEW: Progress API configuration check
console.log('📊 Progress API Configuration:');
console.log('  Progress Endpoints:', status.supportedEndpoints.filter(e => e.includes('progress')));
console.log('  Resource Types:', Object.values(config.RESOURCE_TYPES));
console.log('  Progress Statuses:', Object.values(config.PROGRESS_STATUS));

export default config;