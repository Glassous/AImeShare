import { Eye, FileText } from 'lucide-react';
import './WebAnalysisCard.css';

interface WebAnalysisCardProps {
  onPreview: () => void;
  onContent: () => void;
}

export default function WebAnalysisCard({ onPreview, onContent }: WebAnalysisCardProps) {
  return (
    <div className="web-analysis-card">
      <button className="web-analysis-btn" onClick={onPreview}>
        <Eye size={16} />
        <span>Preview</span>
      </button>
      <button className="web-analysis-btn" onClick={onContent}>
        <FileText size={16} />
        <span>Content</span>
      </button>
    </div>
  );
}
