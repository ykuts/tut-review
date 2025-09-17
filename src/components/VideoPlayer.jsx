import React, { useState, useEffect } from 'react';
import { HiPlayCircle, HiExclamationTriangle, HiLink } from 'react-icons/hi2';

const VideoPlayer = ({ url, title, description, onVideoEnd }) => {
  const [videoType, setVideoType] = useState(null);
  const [embedUrl, setEmbedUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (url) {
      processVideoUrl(url);
    }
  }, [url]);

  const processVideoUrl = (videoUrl) => {
    try {
      // YouTube URLs
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = extractYouTubeId(videoUrl);
        if (videoId) {
          setVideoType('youtube');
          setEmbedUrl(`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`);
          setError(null);
          return;
        }
      }

      // Vimeo URLs
      if (videoUrl.includes('vimeo.com')) {
        const videoId = extractVimeoId(videoUrl);
        if (videoId) {
          setVideoType('vimeo');
          setEmbedUrl(`https://player.vimeo.com/video/${videoId}`);
          setError(null);
          return;
        }
      }

      // Direct video file URLs (mp4, webm, etc.)
      if (videoUrl.match(/\.(mp4|webm|ogg|avi|mov)(\?.*)?$/i)) {
        setVideoType('direct');
        setEmbedUrl(videoUrl);
        setError(null);
        return;
      }

      // If no known format detected
      setVideoType('unknown');
      setEmbedUrl(videoUrl);
      setError('Video format not recognized. Will show as external link.');

    } catch (err) {
      setError('Invalid video URL');
      setVideoType('error');
    }
  };

  const extractYouTubeId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const extractVimeoId = (url) => {
    const pattern = /vimeo\.com\/(\d+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
  };

  const renderVideoPlayer = () => {
    switch (videoType) {
      case 'youtube':
      case 'vimeo':
        return (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
            <iframe
              src={embedUrl}
              title={title || 'Video Player'}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => console.log('Video loaded successfully')}
              onError={(e) => setError('Failed to load video')}
            />
          </div>
        );

      case 'direct':
        return (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
            <video
              src={embedUrl}
              controls
              className="w-full h-full object-contain"
              onEnded={onVideoEnd}
              preload="metadata"
            >
              <p className="text-white text-center p-8">
                Your browser does not support the video element.
              </p>
            </video>
          </div>
        );

      case 'unknown':
        return (
          <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center p-8">
              <HiPlayCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">External Video Content</p>
              <p className="text-sm text-gray-500 mb-4">
                This video is hosted externally and cannot be embedded directly.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <HiLink className="w-4 h-4 mr-2" />
                Open Video
              </a>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="w-full aspect-video bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200">
            <div className="text-center p-8">
              <HiExclamationTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <p className="text-lg font-medium text-red-800 mb-2">Video Error</p>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <HiLink className="w-4 h-4 mr-2" />
                Try Original Link
              </a>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading video...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      {renderVideoPlayer()}
      
      {/* Video Info */}
      <div className="space-y-2">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        )}
        
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
        
        {/* Video Details */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="capitalize">
            {videoType === 'youtube' ? 'YouTube' : 
             videoType === 'vimeo' ? 'Vimeo' :
             videoType === 'direct' ? 'Video File' : 'External Video'}
          </span>
          
          {url && (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              View Original
            </a>
          )}
        </div>
        
        {/* Error Message */}
        {error && videoType !== 'error' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <HiExclamationTriangle className="w-4 h-4 inline mr-2" />
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
