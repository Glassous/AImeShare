import React, { useState, useEffect, useRef } from 'react';
import { X, Code, Eye, Smartphone, Monitor, Copy, Download, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './PreviewSidebar.css';

interface PreviewSidebarProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  themeMode: 'light' | 'dark';
}

export default function PreviewSidebar({
  isOpen,
  content,
  onClose,
  width,
  onWidthChange,
  themeMode
}: PreviewSidebarProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const windowWidth = window.innerWidth;
      const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;
      
      // Limit width between 20% and 80%
      if (newWidth >= 20 && newWidth <= 80) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const sidebarStyle = isMobileView 
    ? { height: '95vh', bottom: 0, width: '100%', left: 0 } 
    : { width: `${width}%` };

  return (
    <>
      {isMobileView && <div className="preview-backdrop" onClick={onClose} />}
      <div 
        className={`preview-sidebar ${isMobileView ? 'mobile-bottom-sheet' : 'desktop-sidebar'}`}
        style={sidebarStyle}
        ref={sidebarRef}
      >
        {!isMobileView && (
          <div 
            className="resize-handle"
            onMouseDown={() => setIsResizing(true)}
          />
        )}
        
        <div className="preview-header">
          <div className="preview-tabs">
            <button 
              className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={16} />
              <span>Preview</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'source' ? 'active' : ''}`}
              onClick={() => setActiveTab('source')}
            >
              <Code size={16} />
              <span>Source</span>
            </button>
          </div>
          
          <div className="header-actions">
            <button 
              className="icon-btn" 
              onClick={handleCopy}
              title="Copy Code"
            >
              {isCopied ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <button 
              className="icon-btn" 
              onClick={handleDownload}
              title="Download HTML"
            >
              <Download size={18} />
            </button>
            {!isMobileView && activeTab === 'preview' && (
              <div className="device-toggles">
                <button 
                  className={`icon-btn ${deviceMode === 'desktop' ? 'active' : ''}`}
                  onClick={() => setDeviceMode('desktop')}
                  title="Desktop View"
                >
                  <Monitor size={18} />
                </button>
                <button 
                  className={`icon-btn ${deviceMode === 'mobile' ? 'active' : ''}`}
                  onClick={() => setDeviceMode('mobile')}
                  title="Mobile View (iPhone 17 Pro)"
                >
                  <Smartphone size={18} />
                </button>
              </div>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="preview-content">
          {activeTab === 'preview' ? (
            <div className={`preview-frame-container ${!isMobileView && deviceMode === 'mobile' ? 'mobile-mockup-container' : ''}`}>
              {!isMobileView && deviceMode === 'mobile' ? (
                 <div className="iphone-mockup">
                   <div className="iphone-notch"></div>
                   <div className="iphone-screen">
                      <iframe 
                        srcDoc={content}
                        title="HTML Preview"
                        className="preview-iframe"
                        sandbox="allow-scripts" 
                      />
                   </div>
                 </div>
              ) : (
                <iframe 
                  srcDoc={content}
                  title="HTML Preview"
                  className="preview-iframe"
                  sandbox="allow-scripts" 
                />
              )}
            </div>
          ) : (
            <div className="source-view">
               <SyntaxHighlighter
                style={themeMode === 'dark' ? oneDark : oneLight}
                language="html"
                customStyle={{ margin: 0, height: '100%', borderRadius: 0, overflow: 'auto' }}
                showLineNumbers={true}
                wrapLines={true}
              >
                {content}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
