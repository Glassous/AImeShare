import React from 'react';
import { FileText, Image, Video, File, ExternalLink } from 'lucide-react';
import './FileUrlCard.css';

// Custom YouTube Icon with the signature white triangle
const YouTubeIcon = ({ size = 24 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2c.46-1.7.46-5.33.46-5.33s0-3.63-.46-5.25z" 
      fill="#FF0000"
    />
    <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="white" />
  </svg>
);

interface FileUrlCardProps {
  index: string;
  url: string;
}

const FileUrlCard: React.FC<FileUrlCardProps> = ({ index, url }) => {
  // Clean URL: remove leading/trailing spaces and backticks
  const cleanUrl = url.trim().replace(/^`|`$/g, '').trim();
  
  const getFileIcon = (url: string) => {
    const lowerUrl = url.toLowerCase();
    
    // Check for YouTube
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return { 
        icon: <YouTubeIcon size={24} />, 
        type: 'youtube',
        label: 'YouTube'
      };
    }
    
    // Check for common file types
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) {
      return { icon: <Image size={24} />, type: 'image', label: 'Image' };
    }
    if (lowerUrl.match(/\.(mp4|webm|ogg|mov|avi|wmv)$/)) {
      return { icon: <Video size={24} />, type: 'video', label: 'Video' };
    }
    if (lowerUrl.endsWith('.pdf')) {
      return { icon: <FileText size={24} />, type: 'pdf', label: 'PDF' };
    }
    
    // Default fallback
    return { icon: <File size={24} />, type: 'file', label: 'File' };
  };

  const { icon, type, label } = getFileIcon(cleanUrl);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`file-url-card ${type}`} onClick={handleClick}>
      <div className={`file-icon-wrapper ${type}`}>
        {icon}
      </div>
      <div className="file-info">
        <span className="file-index">File #{index} - {label}</span>
        <div className="file-url-text" title={cleanUrl}>
          {cleanUrl}
        </div>
      </div>
      <ExternalLink size={14} className="external-link-icon" />
    </div>
  );
};

export default FileUrlCard;
