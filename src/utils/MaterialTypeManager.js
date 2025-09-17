// src/utils/MaterialTypeManager.js - Enhanced with Markdown Support
import {
  HiPlayCircle,
  HiCodeBracket,
  HiDocumentText,
  HiQuestionMarkCircle,
  HiSparkles,
  HiBookOpen,
  HiLink,
  HiDocument
} from 'react-icons/hi2';

/**
 * Material Type Manager - Centralized management for material types with Markdown support
 */
export class MaterialTypeManager {
  
  /**
   * Enhanced mapping from database types to component types
   */
  static TYPE_MAPPING = {
    // Video types
    'mp4': 'video',
    'avi': 'video',
    'mov': 'video',
    'mkv': 'video',
    'webm': 'video',
    'video': 'video',
    
    // Markdown types - NEW
    'md': 'markdown',
    'markdown': 'markdown',
    
    // Text/Document types
    'link': 'text',
    'url': 'text',
    'pdf': 'text',
    'doc': 'text',
    'docx': 'text',
    'txt': 'text',
    'text': 'text',
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
  };

  /**
   * Enhanced component types with Markdown
   */
  static COMPONENT_TYPES = {
    VIDEO: 'video',
    MARKDOWN: 'markdown', // NEW
    TEXT: 'text',
    CODE: 'code',
    EXERCISE: 'exercise',
    QUIZ: 'quiz'
  };

  /**
   * Enhanced type configurations with Markdown support
   */
  static TYPE_CONFIG = {
    video: {
      icon: HiPlayCircle,
      bgColor: 'bg-red-50 hover:bg-red-100',
      iconColor: 'text-red-500',
      label: 'Video Tutorial',
      section: 'Video Tutorial'
    },
    markdown: { // NEW
      icon: HiBookOpen,
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
      iconColor: 'text-emerald-500',
      label: 'Markdown Document',
      section: 'Study Material',
      requiresUrl: true, // Flag to indicate content needs to be fetched
      supportsSyntaxHighlighting: true
    },
    text: {
      icon: HiDocumentText,
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      iconColor: 'text-blue-500',
      label: 'Text Material',
      section: 'Introduction'
    },
    code: {
      icon: HiCodeBracket,
      bgColor: 'bg-green-50 hover:bg-green-100',
      iconColor: 'text-green-500',
      label: 'Code Example',
      section: 'Code Example'
    },
    exercise: {
      icon: HiSparkles,
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      iconColor: 'text-orange-500',
      label: 'Practice Exercise',
      section: 'Practice Exercise'
    },
    quiz: {
      icon: HiQuestionMarkCircle,
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      iconColor: 'text-purple-500',
      label: 'Knowledge Check',
      section: 'Knowledge Check'
    }
  };

  /**
   * Map database type to component type
   */
  static mapDbTypeToComponentType(dbType) {
    if (!dbType) return this.COMPONENT_TYPES.TEXT;
    
    const normalizedType = dbType.toLowerCase().trim();
    return this.TYPE_MAPPING[normalizedType] || this.COMPONENT_TYPES.TEXT;
  }

  /**
   * Get type configuration
   */
  static getTypeConfig(type) {
    return this.TYPE_CONFIG[type] || this.TYPE_CONFIG.text;
  }

  /**
   * Get icon component for material type
   */
  static getIcon(type) {
    const config = this.getTypeConfig(type);
    return config.icon;
  }

  /**
   * Get background color class for material type
   */
  static getBgColor(type) {
    const config = this.getTypeConfig(type);
    return config.bgColor;
  }

  /**
   * Get icon color class for material type
   */
  static getIconColor(type) {
    const config = this.getTypeConfig(type);
    return config.iconColor;
  }

  /**
   * Get human-readable label for material type
   */
  static getLabel(type) {
    const config = this.getTypeConfig(type);
    return config.label;
  }

  /**
   * Get section name for material type
   */
  static getSection(type) {
    const config = this.getTypeConfig(type);
    return config.section;
  }

  /**
   * Check if material type requires URL fetching
   */
  static requiresUrlFetch(type) {
    const config = this.getTypeConfig(type);
    return config.requiresUrl || false;
  }

  /**
   * Check if material type supports syntax highlighting
   */
  static supportsSyntaxHighlighting(type) {
    const config = this.getTypeConfig(type);
    return config.supportsSyntaxHighlighting || false;
  }

  /**
   * Enhanced content generation with Markdown support
   */
  static generateContent(componentType, material) {
    switch (componentType) {
      case this.COMPONENT_TYPES.VIDEO:
        return this.generateVideoContent(material);
        
      case this.COMPONENT_TYPES.MARKDOWN: // NEW
        return this.generateMarkdownContent(material);
        
      case this.COMPONENT_TYPES.TEXT:
        return this.generateTextContent(material);
        
      case this.COMPONENT_TYPES.CODE:
        return this.generateCodeContent(material);
        
      case this.COMPONENT_TYPES.EXERCISE:
        return this.generateExerciseContent(material);
        
      case this.COMPONENT_TYPES.QUIZ:
        return this.generateQuizContent(material);
        
      default:
        return material.content || `Content will be available soon.`;
    }
  }

  /**
   * Generate markdown content - NEW
   */
  static generateMarkdownContent(material) {
    // If we have direct content, use it
    if (material.content) {
      return material.content;
    }
    
    // If we have a URL, indicate that content needs to be fetched
    if (material.url) {
      return {
        needsFetch: true,
        url: material.url,
        placeholder: `# ${material.title}\n\n📄 Loading markdown content from:\n${material.url}\n\nPlease wait while we fetch the content...`
      };
    }
    
    // Fallback content
    return `# ${material.title}\n\n📝 This is a markdown document that contains structured content.\n\nContent will be loaded soon.`;
  }

  /**
   * Generate video content
   */
  static generateVideoContent(material) {
    if (material.url || material.content) {
      return material.url || material.content;
    }
    return 'Video content will be available soon';
  }

  /**
   * Generate text content
   */
  static generateTextContent(material) {
    // Handle different text material types
    if (material.type === 'link' || material.type === 'url') {
      return `# ${material.title}\n\nThis material is available as an external resource.\n\n[Access Material](${material.url || material.content || '#'})\n\nContent summary and key points will be available here soon.`;
    }
    
    if (material.type === 'pdf' || material.type === 'document') {
      return `# ${material.title}\n\nThis is a document resource that contains important information for this chapter.\n\n📄 **Document Type:** ${material.type.toUpperCase()}\n\nDocument content will be processed and displayed here soon.`;
    }
    
    return material.content || `# ${material.title}\n\nContent will be available soon.\n\nThis material is being prepared and will include:\n- Key concepts and explanations\n- Examples and illustrations\n- Additional resources for further reading`;
  }

  /**
   * Generate code content
   */
  static generateCodeContent(material) {
    if (material.content) {
      return material.content;
    }
    
    const language = material.language || this.detectLanguageFromType(material.type) || 'javascript';
    return `// ${material.title}\n// Code example will be available soon\n// Language: ${language}\n\nconsole.log("Hello World!");\n\n// This code example will demonstrate:\n// - Key programming concepts\n// - Practical implementation\n// - Best practices`;
  }

  /**
   * Generate exercise content
   */
  static generateExerciseContent(material) {
    return material.content || `## Exercise: ${material.title}\n\n**Objective:** Complete this exercise to practice what you've learned.\n\n### Instructions:\n1. Review the concepts covered in this chapter\n2. Follow the step-by-step instructions below\n3. Test your implementation\n4. Submit your solution\n\n### Task Details:\nDetailed instructions will be available soon.\n\n### Expected Outcome:\nYou should be able to demonstrate understanding of the key concepts covered in this chapter.\n\n### Resources:\n- Reference materials from previous sections\n- Code examples and templates\n- Helpful links and documentation`;
  }

  /**
   * Generate quiz content
   */
  static generateQuizContent(material) {
    return material.content || 'Interactive quiz questions will be available soon to test your understanding of the chapter content.';
  }

  /**
   * Detect programming language from file type
   */
  static detectLanguageFromType(type) {
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
  }

  /**
   * Enhanced type-specific properties with Markdown support
   */
  static getTypeSpecificProperties(componentType, material) {
    switch (componentType) {
      case this.COMPONENT_TYPES.VIDEO:
        return {
          duration: material.duration || this.estimateDuration(material),
          url: material.url || material.content,
          description: material.description || 'Video tutorial covering key concepts'
        };
        
      case this.COMPONENT_TYPES.MARKDOWN: // NEW
        return {
          url: material.url,
          needsFetch: !material.content && !!material.url,
          uploadDate: material.upload_date,
          originalType: material.type,
          supportsSyntaxHighlighting: true,
          description: material.description || 'Structured markdown document with rich formatting'
        };
        
      case this.COMPONENT_TYPES.TEXT:
        return {
          url: (material.type === 'link' || material.type === 'url') ? (material.url || material.content) : null,
          isLink: material.type === 'link' || material.type === 'url',
          documentType: material.type === 'pdf' || material.type === 'document' ? material.type : null
        };
        
      case this.COMPONENT_TYPES.CODE:
        return {
          language: material.language || this.detectLanguageFromType(material.type)
        };
        
      case this.COMPONENT_TYPES.EXERCISE:
        return {
          difficulty: material.difficulty || 'beginner',
          estimatedTime: material.estimatedTime || this.estimateExerciseTime(material)
        };
        
      case this.COMPONENT_TYPES.QUIZ:
        return {
          questions: material.questions || [],
          timeLimit: material.timeLimit,
          passingScore: material.passingScore
        };
        
      default:
        return {};
    }
  }

  /**
   * Fetch markdown content from URL - NEW
   */
  static async fetchMarkdownContent(url) {
    try {
      console.log('📄 Fetching markdown content from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      console.log('✅ Markdown content fetched successfully:', content.length, 'characters');
      
      return {
        success: true,
        content: content,
        contentLength: content.length,
        fetchedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to fetch markdown content:', error);
      
      return {
        success: false,
        error: error.message,
        fallbackContent: `# Content Loading Error\n\n❌ **Failed to load markdown content**\n\n**Error:** ${error.message}\n\n**URL:** ${url}\n\n**Possible solutions:**\n- Check your internet connection\n- Verify the URL is accessible\n- Try refreshing the page\n\nPlease contact support if the problem persists.`
      };
    }
  }

  /**
   * Transform database material to enhanced format - NEW
   */
  static async transformDbMaterial(material) {
    const componentType = this.mapDbTypeToComponentType(material.type);
    const typeConfig = this.getTypeConfig(componentType);
    const typeProperties = this.getTypeSpecificProperties(componentType, material);
    
    // Base transformation
    const transformed = {
      id: material._id || material.id || material.materialId || `temp_${Date.now()}`,
      chapterId: material.chapterId,
      type: componentType,
      title: material.title || 'Untitled Material',
      order: material.order || 0,
      completed: material.completed || false,
      created_at: material.created_at || material.upload_date || new Date().toISOString(),
      updated_at: material.updated_at || new Date().toISOString(),
      
      // Type configuration
      ...typeConfig,
      
      // Type-specific properties
      ...typeProperties,
      
      // Preserve original data
      originalType: material.type,
      originalData: material
    };
    
    // Handle content generation based on type
    if (componentType === this.COMPONENT_TYPES.MARKDOWN && material.url && !material.content) {
      // For markdown materials with URLs, fetch the content
      const fetchResult = await this.fetchMarkdownContent(material.url);
      
      if (fetchResult.success) {
        transformed.content = fetchResult.content;
        transformed.fetchedAt = fetchResult.fetchedAt;
      } else {
        transformed.content = fetchResult.fallbackContent;
        transformed.fetchError = fetchResult.error;
        transformed.hasFetchError = true;
      }
    } else {
      // For other types, use standard content generation
      transformed.content = this.generateContent(componentType, material);
    }
    
    return transformed;
  }

  /**
   * Estimate duration for video materials
   */
  static estimateDuration(material) {
    return 'TBD';
  }

  /**
   * Estimate time for exercise completion
   */
  static estimateExerciseTime(material) {
    if (material.content && material.content.length > 1000) {
      return '30-45 minutes';
    }
    return '15-30 minutes';
  }

  /**
   * Enhanced validation with Markdown support
   */
  static validateMaterial(material) {
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
    
    // Markdown-specific validation
    if (material.type === 'md' || material.type === 'markdown') {
      if (!material.content && !material.url) {
        errors.push('Markdown materials require either content or URL');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get all available material types
   */
  static getAllTypes() {
    return Object.values(this.COMPONENT_TYPES);
  }

  /**
   * Check if material type is supported
   */
  static isTypeSupported(type) {
    return Object.values(this.COMPONENT_TYPES).includes(type);
  }

  /**
   * Get markdown-specific configuration
   */
  static getMarkdownConfig() {
    return {
      remarkPlugins: ['remarkGfm'], // Will need to be imported
      supportedSyntaxLanguages: [
        'javascript', 'python', 'java', 'cpp', 'c', 'html', 'css', 
        'json', 'xml', 'sql', 'bash', 'typescript', 'jsx', 'tsx'
      ],
      syntaxTheme: 'oneDark', // Will need to be imported
      enableCodeCopy: true,
      enableLineNumbers: true
    };
  }
}