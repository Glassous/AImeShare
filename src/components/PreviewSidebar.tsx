import { useState, useEffect, useRef } from 'react';
import { X, Code, Eye, Smartphone, Monitor, Copy, Download, Check, RefreshCw, Terminal, AlertCircle } from 'lucide-react';
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
  initialTab?: 'preview' | 'source';
}

interface ConsoleLog {
  type: 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
}

export default function PreviewSidebar({
  isOpen,
  content,
  onClose,
  width,
  onWidthChange,
  themeMode,
  initialTab = 'preview'
}: PreviewSidebarProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'source'>(initialTab);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    if (isMobileView) {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 300); // Match animation duration
    } else {
      onClose();
    }
  };

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'console-error') {
        setLogs(prev => [...prev, {
          type: 'error',
          message: event.data.message,
          timestamp: Date.now()
        }]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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

  const handleRefresh = () => {
    setIsLoading(true);
    setLogs([]);
    setPreviewKey(prev => prev + 1);
  };

  const handleIframeLoad = () => {
    // Add a small delay to ensure the transition is visible and smoother
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleCopyError = (message: string) => {
    navigator.clipboard.writeText(message);
  };

  // Inject error capturing script and styles for mobile view
  const getInjectedContent = () => {
    // Determine if we should hide scrollbars (in mobile view or mobile simulation)
    const shouldHideScrollbars = isMobileView || deviceMode === 'mobile';
    
    const styles = shouldHideScrollbars ? `
      <style>
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      </style>
    ` : '';

    const script = `
      <script>
        (function() {
          const originalConsoleError = console.error;
          console.error = function(...args) {
            originalConsoleError.apply(console, args);
            window.parent.postMessage({
              type: 'console-error',
              message: args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' ')
            }, '*');
          };
          
          window.onerror = function(message, source, lineno, colno, error) {
            window.parent.postMessage({
              type: 'console-error',
              message: message
            }, '*');
          };
        })();
      </script>
    `;
    
    // Inject styles and script
    let injectedContent = content;
    
    if (injectedContent.includes('<head>')) {
      injectedContent = injectedContent.replace('<head>', '<head>' + styles + script);
    } else {
      injectedContent = styles + script + injectedContent;
    }
    
    return injectedContent;
  };

  if (!isOpen) return null;

  const sidebarStyle = isMobileView 
    ? { height: '95vh', bottom: 0, width: '100%', left: 0 } 
    : { width: `${width}%` };

  return (
    <>
      {isMobileView && <div className={`preview-backdrop ${isClosing ? 'closing' : ''}`} onClick={handleClose} />}
      <div 
        className={`preview-sidebar ${isMobileView ? 'mobile-bottom-sheet' : 'desktop-sidebar'} ${themeMode} ${isClosing ? 'closing' : ''}`}
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
            {activeTab === 'preview' && (
              <>
                <button 
                  className={`icon-btn ${isConsoleOpen ? 'active' : ''}`}
                  onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                  title="Toggle Console"
                >
                  <Terminal size={18} />
                  {logs.length > 0 && <span className="console-badge">{logs.length}</span>}
                </button>
                <button 
                  className="icon-btn" 
                  onClick={handleRefresh}
                  title="Refresh Preview"
                >
                  <RefreshCw size={18} />
                </button>
              </>
            )}
            <div className="divider-vertical" />
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
            <button className="close-btn" onClick={handleClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="preview-content-wrapper">
          <div className={`preview-content ${activeTab === 'preview' ? 'preview-mode' : 'source-mode'}`}>
            {activeTab === 'preview' ? (
              <div className={`preview-frame-container ${!isMobileView && deviceMode === 'mobile' ? 'mobile-mockup-container' : ''}`}>
                {isLoading && (
                  <div className="loading-overlay">
                    <div className="spinner"></div>
                  </div>
                )}
                {!isMobileView && deviceMode === 'mobile' ? (
                   <div className="iphone-mockup">
                     <div className="iphone-notch"></div>
                     <div className="iphone-screen">
                        <iframe 
                          key={previewKey}
                          srcDoc={getInjectedContent()}
                          title="HTML Preview"
                          className={`preview-iframe ${isLoading ? 'loading' : 'loaded'}`}
                          sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin" 
                          onLoad={handleIframeLoad}
                        />
                     </div>
                   </div>
                ) : (
                  <iframe 
                    key={previewKey}
                    srcDoc={getInjectedContent()}
                    title="HTML Preview"
                    className={`preview-iframe ${isLoading ? 'loading' : 'loaded'}`}
                    sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                    onLoad={handleIframeLoad} 
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

          {/* Console Panel */}
          {activeTab === 'preview' && isConsoleOpen && (
            <div className={`console-panel ${isMobileView ? 'console-floating' : 'console-docked'}`}>
              <div className="console-header">
                <div className="console-title">
                  <AlertCircle size={14} className="console-icon" />
                  <span>Console Errors</span>
                  <span className="console-count">{logs.length}</span>
                </div>
                <button className="console-close" onClick={() => setIsConsoleOpen(false)}>
                  <X size={14} />
                </button>
              </div>
              <div className="console-body">
                {logs.length === 0 ? (
                  <div className="console-empty">No errors detected</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="console-log-item">
                      <div className="log-message">{log.message}</div>
                      <button 
                        className="log-copy-btn" 
                        onClick={() => handleCopyError(log.message)}
                        title="Copy Error"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
