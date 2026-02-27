import React from 'react';
import ImageWithPreview from './ImageWithPreview';
import './ImageGallery.css';

interface ImageGalleryProps {
  images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="image-gallery-container">
      <div className={`image-gallery-grid ${images.length > 1 ? 'multi-images' : 'single-image'}`}>
        {images.map((src, index) => (
          <div key={index} className="gallery-item">
            <ImageWithPreview 
              src={src} 
              alt={`image-${index}`} 
              className="gallery-image-wrapper"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
