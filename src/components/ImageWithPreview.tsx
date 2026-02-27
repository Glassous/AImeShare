import React, { useState } from 'react';
import { Download, Maximize2, X } from 'lucide-react';
import './ImageWithPreview.css';

interface ImageWithPreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

const ImageWithPreview: React.FC<ImageWithPreviewProps> = ({ src, alt, className }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = src;
    link.download = `image-${Date.now()}.png`;
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
      <div className={`image-preview-wrapper ${className || ''}`} onClick={togglePreview}>
        <img src={src} alt={alt || 'Image'} className="preview-trigger-image" loading="lazy" />
        <div className="image-hover-overlay">
          <div className="action-buttons">
            <button className="action-btn" onClick={handleDownload} title="Download">
              <Download size={16} />
            </button>
            <button className="action-btn" onClick={togglePreview} title="Enlarge">
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {isPreviewOpen && (
        <div className="image-modal-overlay" onClick={togglePreview}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={src} alt={alt || 'Full size image'} className="modal-image" />
            <button className="modal-close-btn" onClick={togglePreview}>
              <X size={24} />
            </button>
            <div className="modal-actions">
              <button className="modal-download-btn" onClick={handleDownload}>
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

export default ImageWithPreview;
