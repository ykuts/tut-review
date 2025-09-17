// src/components/MarkdownRenderer.jsx - Enhanced with Video Player Support
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  HiExclamationTriangle, 
  HiArrowPath, 
  HiLink,
  HiDocument,
  HiGlobeAlt,
  HiPlayCircle // Added for video support
} from 'react-icons/hi2';

/**
 * Enhanced Markdown Renderer Component with Video Player Support
 * Supports both direct content and URL-based loading with CORS handling
 */
const MarkdownRenderer = ({ 
  content, 
  url, 
  title = "Content",
  className = "",
  showSource = false 
}) => {
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadedFromUrl, setLoadedFromUrl] = useState(false);

  // Load content on component mount or when props change
  useEffect(() => {
    if (url && !content) {
      loadMarkdownFromUrl(url);
    } else if (content) {
      setMarkdownContent(content);
      setError(null);
      setLoadedFromUrl(false);
    }
  }, [content, url]);

  /**
   * Extract video ID and platform from various video URLs
   */
  const extractVideoId = (url) => {
    if (!url || typeof url !== 'string') return { platform: null, id: null };
    
    console.log('🎥 Checking URL for video:', url);
    
    // YouTube patterns
    const youtubePatterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/i,
      /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/i,
    ];
    
    for (const pattern of youtubePatterns) {
      const match = url.match(pattern);
      if (match) {
        console.log('✅ YouTube video detected:', match[1]);
        return { platform: 'youtube', id: match[1] };
      }
    }
    
    // Vimeo patterns
    const vimeoPatterns = [
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/i,
      /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/i,
      /(?:https?:\/\/)?vimeo\.com\/channels\/[^\/]+\/(\d+)/i,
    ];
    
    for (const pattern of vimeoPatterns) {
      const match = url.match(pattern);
      if (match) {
        console.log('✅ Vimeo video detected:', match[1]);
        return { platform: 'vimeo', id: match[1] };
      }
    }
    
    // Direct video file patterns
    const videoExtensions = /\.(mp4|webm|ogg|mov|avi|mkv|m4v|flv)(\?.*)?$/i;
    if (videoExtensions.test(url)) {
      console.log('✅ Direct video file detected');
      return { platform: 'direct', id: url };
    }
    
    console.log('❌ No video pattern matched');
    return { platform: null, id: null };
  };

  /**
   * Render video player based on platform
   */
  const renderVideoPlayer = (videoInfo, linkText) => {
    const { platform, id } = videoInfo;
    const displayText = Array.isArray(linkText) ? linkText.join('') : (linkText || 'Video');
    
    console.log('🎬 Rendering video player:', { platform, id, displayText });
    
    if (platform === 'youtube') {
      return (
        <div className="my-6 video-player-container">
          <div className="rounded-lg p-4 mb-3 border">
            <div className="flex items-center text-md font-bold text-black mb-2">
              <span className="text-lg font-black text-black">{displayText}</span>
            </div>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
              title={displayText}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        </div>
      );
    }
    
    if (platform === 'vimeo') {
      return (
        <div className="my-6 video-player-container">
          <div className="bg-blue-50 rounded-lg p-4 mb-3 border border-blue-200">
            <div className="flex items-center text-sm text-blue-700 mb-2">
              <HiPlayCircle className="w-5 h-5 mr-2 text-blue-600" />
              <span className="font-medium">Vimeo Video: {displayText}</span>
            </div>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
            <iframe
              src={`https://player.vimeo.com/video/${id}?color=ff6b6b&title=0&byline=0&portrait=0`}
              title={displayText}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        </div>
      );
    }
    
    if (platform === 'direct') {
      return (
        <div className="my-6 video-player-container">
          <div className="bg-green-50 rounded-lg p-4 mb-3 border border-green-200">
            <div className="flex items-center text-sm text-green-700 mb-2">
              <HiPlayCircle className="w-5 h-5 mr-2 text-green-600" />
              <span className="font-medium">Video File: {displayText}</span>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden shadow-lg bg-black">
            <video
              controls
              className="w-full h-auto max-h-96"
              preload="metadata"
              controlsList="nodownload"
            >
              <source src={id} type="video/mp4" />
              <source src={id} type="video/webm" />
              <source src={id} type="video/ogg" />
              <p className="text-white p-4">
                Your browser does not support the video tag.
                <a href={id} className="text-blue-400 underline ml-2" target="_blank" rel="noopener noreferrer">
                  Download video
                </a>
              </p>
            </video>
          </div>
        </div>
      );
    }
    
    // Fallback to regular link if no video platform detected
    console.log('🔗 Fallback to regular link');
    return (
      <a
        href={videoInfo.id || url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
      >
        {displayText}
        <HiGlobeAlt className="w-3 h-3 opacity-60" />
      </a>
    );
  };

  /**
   * Load markdown content from external URL
   */
  const loadMarkdownFromUrl = async (markdownUrl) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading markdown from URL:', markdownUrl);
      
      const response = await fetch(markdownUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty content received from URL');
      }
      
      setMarkdownContent(text);
      setLoadedFromUrl(true);
      console.log('✅ Markdown loaded successfully:', text.length, 'characters');
      
    } catch (fetchError) {
      console.error('❌ Failed to load markdown:', fetchError);
      setError(`Failed to load content: ${fetchError.message}`);
      setLoadedFromUrl(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retry loading from URL
   */
  const handleRetry = () => {
    if (url) {
      loadMarkdownFromUrl(url);
    }
  };

  /**
   * Custom components for markdown rendering with video support
   */
  const markdownComponents = {
    // Enhanced code blocks with syntax highlighting
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language) {
        return (
          <SyntaxHighlighter
            style={tomorrow}
            language={language}
            PreTag="div"
            className="rounded-lg"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        );
      }
      
      return (
        <code 
          className={`${className} bg-gray-100 px-2 py-1 rounded text-sm font-mono`} 
          {...props}
        >
          {children}
        </code>
      );
    },

    // Enhanced links with video detection - THE KEY PART
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith('http');
      
      console.log('🔗 Processing link:', href);
      
      // Check if this is a video link
      if (href) {
        const videoInfo = extractVideoId(href);
        if (videoInfo.platform) {
          console.log('🎥 Video link detected, rendering player');
          return renderVideoPlayer(videoInfo, children);
        }
      }
      
      // Regular link rendering
      console.log('🔗 Regular link, not a video');
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : '_self'}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
          {...props}
        >
          {children}
          {isExternal && (
            <HiGlobeAlt className="w-3 h-3 opacity-60" />
          )}
        </a>
      );
    },

    // Enhanced headings with better spacing
    h1: ({ children, ...props }) => (
      <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8 first:mt-0" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-5" {...props}>
        {children}
      </h3>
    ),

    // Enhanced paragraphs with better spacing
    p: ({ children, ...props }) => (
      <p className="text-gray-700 leading-relaxed mb-4" {...props}>
        {children}
      </p>
    ),

    // Enhanced lists
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700" {...props}>
        {children}
      </ol>
    ),

    // Enhanced blockquotes
    blockquote: ({ children, ...props }) => (
      <blockquote 
        className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Enhanced tables
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-gray-50" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-t border-gray-200" {...props}>
        {children}
      </td>
    )
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
          {url && (
            <p className="text-xs text-gray-500 mt-1">From: {url}</p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-start">
          <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-red-800 font-medium">Content Loading Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            {url && (
              <p className="text-red-600 text-xs mt-2">
                Source: {url}
              </p>
            )}
            <button
              onClick={handleRetry}
              disabled={loading}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors duration-200 flex items-center"
            >
              <HiArrowPath className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No content state
  if (!markdownContent || markdownContent.trim().length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <HiDocument className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No content available</p>
        {url && (
          <p className="text-xs text-gray-400 mt-1">Source: {url}</p>
        )}
      </div>
    );
  }

  // Render markdown content
  return (
    <div className={`markdown-renderer ${className}`}>
      {/* Rendered markdown */}
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>

      {/* Content info */}
      {showSource && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>
              Content length: {markdownContent.length} characters
            </span>
            {loadedFromUrl && (
              <span>
                Loaded from external source
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownRenderer;