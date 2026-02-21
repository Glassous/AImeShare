import { Eye, Code } from 'lucide-react';
import './HtmlCard.css';

interface HtmlCardProps {
  onPreview: () => void;
  onViewSource?: () => void;
  sourceLabel?: string;
  previewLabel?: string;
}

export default function HtmlCard({ onPreview, onViewSource, sourceLabel = 'Source', previewLabel = 'Preview' }: HtmlCardProps) {
  return (
    <div className="html-card-container">
      <div className="html-card-header">
        <span className="html-card-title">Html</span>
      </div>
      <div className="html-card-content">
        <div className="html-card-actions">
          <button className="html-card-btn primary" onClick={onPreview}>
            <Eye size={16} />
            <span>{previewLabel}</span>
          </button>
          <button className="html-card-btn secondary" onClick={onViewSource || onPreview}>
            <Code size={16} />
            <span>{sourceLabel}</span>
          </button>
        </div>
        <div className="html-card-info">
            Click to view HTML preview and source code
        </div>
      </div>
    </div>
  );
}
