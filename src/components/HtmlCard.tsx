import React from 'react';
import { Eye, Code } from 'lucide-react';
import './HtmlCard.css';

interface HtmlCardProps {
  content: string;
  onPreview: () => void;
}

export default function HtmlCard({ content, onPreview }: HtmlCardProps) {
  return (
    <div className="html-card-container">
      <div className="html-card-header">
        <span className="html-card-title">Html</span>
      </div>
      <div className="html-card-content">
        <div className="html-card-actions">
          <button className="html-card-btn primary" onClick={onPreview}>
            <Eye size={16} />
            <span>Preview</span>
          </button>
          <button className="html-card-btn secondary" onClick={onPreview}>
            <Code size={16} />
            <span>Source</span>
          </button>
        </div>
        <div className="html-card-info">
            Click to view HTML preview and source code
        </div>
      </div>
    </div>
  );
}
