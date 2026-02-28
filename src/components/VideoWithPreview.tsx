import React, { useState, useRef } from 'react';
import { Download, Maximize2, X, Play } from 'lucide-react';
import './VideoWithPreview.css';

interface VideoWithPreviewProps {
  src: string;
  poster?: string;
  className?: string;
}

const VideoWithPreview: React.FC<VideoWithPreviewProps> = ({ src, poster, className }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = src;
    link.download = `video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const togglePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPreviewOpen(!isPreviewOpen);
  };

  return (
    <>
      <div className={`video-preview-wrapper ${className || ''}`} onClick={togglePreview}>
        <video 
          ref={videoRef}
          src={src} 
          poster={poster}
          className="preview-trigger-video" 
          muted 
          playsInline
          onMouseOver={() => videoRef.current?.play().catch(() => {})}
          onMouseOut={() => {
            videoRef.current?.pause();
            if (videoRef.current) videoRef.current.currentTime = 0;
          }}
        />
        <div className="video-hover-overlay">
          <Play size={48} fill="white" className="video-play-icon" />
          <div className="video-action-buttons">
            <button className="video-action-btn" onClick={handleDownload} title="Download">
              <Download size={16} />
            </button>
            <button className="video-action-btn" onClick={togglePreview} title="Full Screen">
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {isPreviewOpen && (
        <div className="video-modal-overlay" onClick={togglePreview}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <video 
              src={src} 
              className="modal-video" 
              controls 
              autoPlay 
              playsInline
            />
            <button className="video-modal-close-btn" onClick={togglePreview}>
              <X size={24} />
            </button>
            <div className="video-modal-actions">
              <button className="video-modal-download-btn" onClick={handleDownload}>
                <Download size={20} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoWithPreview;
