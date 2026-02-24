import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, type Conversation, type Message } from '../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkSupersub from 'remark-supersub';
import mermaid from 'mermaid';
import { Sun, Moon, Monitor, Copy, Check, Download, ChevronDown, ChevronRight, Brain, Github, MoreVertical, FileQuestion } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import ConversationInput from '../components/ConversationInput';
import HtmlCard from '../components/HtmlCard';
import WebAnalysisCard from '../components/WebAnalysisCard';
import PreviewSidebar from '../components/PreviewSidebar';
import SearchBlock from '../components/SearchBlock';
import MusicCard, { type Song } from '../components/MusicCard';
import MusicPlayerSidebar from '../components/MusicPlayerSidebar';
import 'katex/dist/katex.min.css';
import './ConversationView.css';

// Android Icon SVG Component
const AndroidIcon = ({ size = 24, className = '' }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="currentColor" 
    className={className}
    style={{ color: '#3DDC84' }}
  >
    <path d="M2.76 3.061a.5.5 0 0 1 .679.2l1.283 2.352A8.9 8.9 0 0 1 8 5a8.9 8.9 0 0 1 3.278.613l1.283-2.352a.5.5 0 1 1 .878.478l-1.252 2.295C14.475 7.266 16 9.477 16 12H0c0-2.523 1.525-4.734 3.813-5.966L2.56 3.74a.5.5 0 0 1 .2-.678ZM5 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2m6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
  </svg>
);

// Helper to normalize LaTeX delimiters
const preprocessContent = (content: string) => {
  if (!content) return '';
  let processed = content;

  // Replace \[ ... \] with $$ ... $$
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  // Replace \( ... \) with $ ... $
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  
  // Ensure proper formatting for web_analysis blocks
  // 1. Ensure newline before the code block if it follows text directly
  processed = processed.replace(/([^\n])(\s*```html\s*<!--\s*type:\s*web_analysis)/g, '$1\n\n$2');
  // 2. Ensure newline after the opening fence
  processed = processed.replace(/(```html)\s*(<!--\s*type:\s*web_analysis)/g, '$1\n$2');

  // Music tag processing
  const musicRegex = /<music>([\s\S]*?)<\/music>/g;
  const musicMatches = [...processed.matchAll(musicRegex)];

  if (musicMatches.length > 0) {
    let newContent = '';
    let lastIndex = 0;
    let i = 0;
    
    while (i < musicMatches.length) {
      const match = musicMatches[i];
      const start = match.index!;
      const end = start + match[0].length;
      
      // Append content before this match
      newContent += processed.substring(lastIndex, start);
      
      // Check for consecutive matches
      const group = [match];
      let j = i + 1;
      let nextStart = end;
      
      while (j < musicMatches.length) {
        const nextMatch = musicMatches[j];
        const gap = processed.substring(nextStart, nextMatch.index!);
        
        // If gap is only whitespace, consider consecutive
        if (!gap.trim()) {
          group.push(nextMatch);
          nextStart = nextMatch.index! + nextMatch[0].length;
          j++;
        } else {
          break;
        }
      }
      
      // Process the group
      const songs = group.map(m => {
        const inner = m[1];
        const getValue = (key: string) => {
           const r = new RegExp(`${key}:\\s*(.*)`);
           const res = inner.match(r);
           return res ? res[1].trim() : '';
        };
        const getLrc = () => {
           // Lrc is usually the last part, capture everything after Lrc:
           const r = /Lrc:\s*([\s\S]*)/;
           const res = inner.match(r);
           return res ? res[1].trim() : '';
        };

        // Clean up URL and Pic if wrapped in backticks
        const clean = (s: string) => s.replace(/^`|`$/g, '');

        return {
           name: getValue('Name'),
           artist: getValue('Artist'),
           album: getValue('Album'),
           url: clean(getValue('URL')),
           pic: clean(getValue('Pic')),
           lrc: getLrc()
        };
      });
      
      // Use a custom delimiter for music data
      newContent += `\n<div data-music-json='${JSON.stringify(songs).replace(/'/g, "&apos;")}'></div>\n`;
      
      lastIndex = nextStart;
      i = j;
    }
    
    newContent += processed.substring(lastIndex);
    processed = newContent;
  }
  
  return processed;
};

// Component for Mermaid Diagrams
const MermaidBlock = ({ chart, theme }: { chart: string, theme: string }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    mermaid.initialize({
       startOnLoad: false,
       theme: theme === 'dark' ? 'dark' : 'default',
       securityLevel: 'loose',
    });
    
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError('');
      } catch (err) {
        console.error('Mermaid error:', err);
        setError('Failed to render chart');
      }
    };
    
    renderChart();
  }, [chart, theme]);

  if (error) {
     return (
        <div className="error-container" style={{height: 'auto', padding: '10px', color: 'red', fontSize: '0.8em'}}>
           Mermaid Error: {error}
        </div>
     );
  }
  
  return (
      <div 
        className="mermaid-container" 
        dangerouslySetInnerHTML={{ __html: svg }} 
        style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            margin: '1em 0',
            overflowX: 'auto' 
        }} 
      />
  );
};

// Component for Thinking Process
const ThinkingBlock = ({ children, theme, themeMode, onPreview }: { children: string, theme: any, themeMode: string, onPreview?: (content: string, tab?: 'preview' | 'source') => void }) => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed

  return (
    <div className="think-block-container">
      <div 
        className="think-block-header" 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="think-label">
          <Brain size={16} />
          <span>Deep Thinking Process</span>
        </div>
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
      </div>
      <div className={`think-content-wrapper ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="think-content-inner">
           <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm, remarkSupersub]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  const lang = match ? match[1] : '';
                  
                  if (!inline && lang === 'mermaid') {
                     return <MermaidBlock chart={String(children)} theme={themeMode} />
                  }

                  if (!inline && lang === 'html' && onPreview) {
                    return <HtmlCard 
                      onPreview={() => onPreview(String(children), 'preview')} 
                      onViewSource={() => onPreview(String(children), 'source')}
                    />
                  }

                  return !inline && match ? (
                    <CodeBlock 
                      language={match[1]} 
                      theme={theme}
                    >
                      {String(children)}
                    </CodeBlock>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
                table({children}: any) {
                  return <TableBlock>{children}</TableBlock>
                }
              }}
           >
             {children}
           </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

// Component for Code Blocks with Collapse and Copy
const CodeBlock = ({ language, children, theme }: { language: string, children: string, theme: any }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <button 
          className="code-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <span>{language || 'code'}</span>
        </button>
        <button className="code-copy-btn" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className={`code-content-wrapper ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="code-content-inner">
          <SyntaxHighlighter
            style={theme}
            language={language}
            PreTag="div"
            customStyle={{ margin: 0, borderRadius: '0 0 8px 8px' }}
          >
            {children.replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

// Component for Table with CSV Download
const TableBlock = ({ children }: { children: React.ReactNode }) => {
  const tableRef = useRef<HTMLTableElement>(null);
  
  const downloadCSV = () => {
    if (!tableRef.current) return;
    
    const rows = Array.from(tableRef.current.querySelectorAll('tr'));
    const csvContent = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      return cells.map(cell => {
        let text = cell.textContent || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
          text = `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      }).join(',');
    }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'table_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-container">
       <div className="table-actions">
         <button className="table-download-btn" onClick={downloadCSV} title="Download as CSV">
           <Download size={14} /> CSV
         </button>
       </div>
       <div className="table-wrapper">
         <table ref={tableRef}>{children}</table>
       </div>
    </div>
  );
};


export default function ConversationView() {
  const { uuid } = useParams<{ uuid: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('https://github.com/Glassous/AImeAndroid/releases');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState<{
    isOpen: boolean; 
    content: string; 
    sourceContent?: string;
    activeTab: 'preview' | 'source';
    showToolbarControls?: boolean;
    webAnalysisMode?: boolean;
    previewUrl?: string;
  }>({
    isOpen: false,
    content: '',
    activeTab: 'preview',
    showToolbarControls: true
  });
  const [previewWidth, setPreviewWidth] = useState(60);
  const [musicPlayerWidth, setMusicPlayerWidth] = useState(40);
  const [musicPlayer, setMusicPlayer] = useState<{
    isOpen: boolean;
    currentSong?: Song;
    songList?: Song[];
  }>({ isOpen: false });

  const handleMusicPlay = (song: Song, allSongs: Song[]) => {
    setMusicPlayer({
      isOpen: true,
      currentSong: song,
      songList: allSongs
    });
  };

  const menuRef = useRef<HTMLDivElement>(null);
  
  const { theme, resolvedTheme, cycleTheme } = useTheme();

  const handlePreview = (content: string, tab: 'preview' | 'source' = 'preview', sourceContent?: string, showToolbarControls: boolean = true, webAnalysisMode: boolean = false, previewUrl?: string) => {
    setHtmlPreview({ isOpen: true, content, sourceContent, activeTab: tab, showToolbarControls, webAnalysisMode, previewUrl });
  };

  const closeMenu = useCallback(() => {
    if (showMobileMenu) {
      setIsMenuClosing(true);
    }
  }, [showMobileMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeMenu]);

  useEffect(() => {
    const fetchLatestRelease = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/Glassous/AImeAndroid/releases/latest');
        if (response.ok) {
          const data = await response.json();
          if (data.assets && data.assets.length > 0) {
            const apkAsset = data.assets.find((asset: any) => asset.name.endsWith('.apk'));
            if (apkAsset) {
              setDownloadUrl(apkAsset.browser_download_url);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching latest release:', error);
      }
    };
    
    fetchLatestRelease();
  }, []);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    async function fetchConversation() {
      if (!uuid) return;

      // Reset state before fetching new conversation
      setLoading(true);
      setError(null);
      setConversation(null);

      try {
        const { data, error } = await supabase
          .from('aime_shared_conversations')
          .select('*')
          .eq('id', uuid)
          .single();

        if (error) throw error;
        
        // Ensure messages is an array, handle if it's stored as a JSON string or object
        let parsedMessages: Message[] = [];
        if (typeof data.messages === 'string') {
             try {
                parsedMessages = JSON.parse(data.messages);
             } catch (e) {
                 console.error("Failed to parse messages string", e);
             }
        } else if (Array.isArray(data.messages)) {
            parsedMessages = data.messages;
        } else if (typeof data.messages === 'object' && data.messages !== null) {
            // If it's a single object (unlikely for a conversation but possible), wrap it
            parsedMessages = [data.messages as unknown as Message];
        }

        setConversation({ ...data, messages: parsedMessages });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchConversation();
  }, [uuid]);

  if (loading) {
    return (
      <div className="loading-view">
        <div className="spinner"></div>
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="error-view">
        <FileQuestion size={48} className="error-icon" />
        <h2>{error ? 'Error Loading Conversation' : 'Conversation Not Found'}</h2>
        <p>{error || "The conversation you are looking for does not exist or has been removed."}</p>
        <div style={{width: '100%', maxWidth: '400px', marginBottom: '24px'}}>
           <ConversationInput />
        </div>
        <a href="/" className="home-button">Go Home</a>
      </div>
    );
  }

  return (
    <div className="conversation-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <header className="top-app-bar">
        <div className="top-bar-left">
           <img src="/AIme-logo.svg" alt="AIme Logo" className="app-logo" style={{ width: '24px', height: '24px' }} />
           <span className="brand-text">AIme</span>
        </div>
        
        <div className="top-bar-center">
          <h1 className="title-text">{conversation.title || 'Untitled Conversation'}</h1>
          <span className="model-text">{conversation.model || 'Unknown Model'}</span>
        </div>

        <div className="top-bar-right">
           <div className="desktop-actions">
             <a 
               href="https://github.com/Glassous/AImeAndroid" 
               target="_blank" 
               rel="noopener noreferrer"
               className="icon-link-btn"
               title="GitHub Repository"
             >
               <Github size={20} />
             </a>
           </div>

           <a 
             href={downloadUrl}
             target="_blank" 
             rel="noopener noreferrer"
             className="download-app-btn"
             title="Download Android App"
           >
             <AndroidIcon size={18} />
             <span className="download-text">Download App</span>
           </a>
           
           <div className="desktop-actions divider-wrapper">
             <div className="divider-vertical"></div>
           </div>

           <div className="desktop-actions">
             <button onClick={cycleTheme} className="theme-toggle-btn" title={`Current theme: ${theme}`}>
               {theme === 'system' && <Monitor size={20} />}
               {theme === 'light' && <Sun size={20} />}
               {theme === 'dark' && <Moon size={20} />}
             </button>
           </div>

           {/* Mobile Menu Button */}
            <div className="mobile-menu-container" ref={menuRef}>
              <button 
                className="icon-link-btn mobile-menu-btn" 
                onClick={() => {
                  if (showMobileMenu) {
                    closeMenu();
                  } else {
                    setShowMobileMenu(true);
                  }
                }}
                title="More options"
              >
                <MoreVertical size={20} />
              </button>

              {(showMobileMenu || isMenuClosing) && (
                <div 
                  className={`mobile-dropdown-menu ${isMenuClosing ? 'closing' : ''}`}
                  onAnimationEnd={() => {
                    if (isMenuClosing) {
                      setShowMobileMenu(false);
                      setIsMenuClosing(false);
                    }
                  }}
                >
                  <a 
                    href="https://github.com/Glassous/AImeAndroid" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mobile-menu-item"
                    onClick={closeMenu}
                  >
                    <Github size={18} />
                    <span>GitHub</span>
                  </a>
                  
                  <button 
                    onClick={() => { cycleTheme(); closeMenu(); }} 
                    className="mobile-menu-item"
                  >
                    {theme === 'system' && <Monitor size={18} />}
                    {theme === 'light' && <Sun size={18} />}
                    {theme === 'dark' && <Moon size={18} />}
                    <span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                  </button>
                </div>
              )}
            </div>
        </div>
      </header>

      {/* Content Area */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
      <main className="content-area" style={{ 
          width: (htmlPreview.isOpen || musicPlayer.isOpen) && window.innerWidth > 768 ? `${100 - (htmlPreview.isOpen ? previewWidth : musicPlayerWidth)}%` : '100%',
          maxWidth: (htmlPreview.isOpen || musicPlayer.isOpen) && window.innerWidth > 768 ? 'none' : '1000px',
          margin: (htmlPreview.isOpen || musicPlayer.isOpen) && window.innerWidth > 768 ? '0' : '0 auto',
          flex: 'none',
          transition: 'width 0.3s ease'
      }}>
          {conversation.messages.map((msg, index) => (
          <div key={index} className={`message-item ${msg.role === 'user' ? 'user-message-container' : 'ai-message-container'}`}>
            {msg.role === 'user' ? (
              <>
                <div className="user-bubble">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm, remarkSupersub]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      a({node, ...props}: any) {
                        return <a target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }} {...props} />
                      },
                      div({node, className, ...props}: any) {
                         if (props['data-music-json']) {
                             try {
                               const songs = JSON.parse(props['data-music-json'].replace(/&apos;/g, "'"));
                               return <MusicCard songs={songs} onPlay={handleMusicPlay} />;
                             } catch (e) {
                               console.error('Failed to parse music json', e);
                               return null;
                             }
                         }
                         return <div className={className} {...props} />;
                      },
                      code({inline, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        const lang = match ? match[1].toLowerCase() : '';
                        const content = String(children);

                        // Enhanced detection for web analysis content
                        const isWebAnalysis = /<!--\s*type:\s*web_analysis\s+url:/.test(content);

                        if (!inline && (lang === 'html' || lang === 'xml' || isWebAnalysis)) {
                          const webAnalysisMatch = content.match(/<!--\s*type:\s*web_analysis\s+url:\s*`?([^`\s]+)`?\s+web_title:(.*?)\s*-->/s);
                          
                          if (webAnalysisMatch) {
                              const url = webAnalysisMatch[1];
                              const title = webAnalysisMatch[2].trim();
                              const bodyContent = content.replace(webAnalysisMatch[0], '').trim();
                              
                              // Helper to detect if content has HTML tags
                              const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(bodyContent);
                              
                              // Format content: if it has HTML tags, use as is; otherwise wrap paragraphs
                              const formattedBody = hasHtmlTags 
                                ? bodyContent 
                                : bodyContent.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');

                              const htmlWrapper = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 24px; max-width: 800px; margin: 0 auto; color: #333; }
h1 { font-size: 24px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #eaeaea; }
.metadata { font-size: 13px; color: #666; margin-bottom: 24px; background: #f5f5f5; padding: 8px 12px; border-radius: 6px; display: inline-block; }
a { color: #0969da; text-decoration: none; }
a:hover { text-decoration: underline; }
img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; font-size: 13px; line-height: 1.45; }
code { background: rgba(175, 184, 193, 0.2); padding: 0.2em 0.4em; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; font-size: 85%; }
blockquote { margin: 0; padding: 0 1em; color: #57606a; border-left: 0.25em solid #d0d7de; }
p { margin-bottom: 16px; }
@media (prefers-color-scheme: dark) {
  body { background-color: #0d1117; color: #c9d1d9; }
  h1 { border-bottom-color: #30363d; }
  .metadata { background: #161b22; color: #8b949e; }
  a { color: #58a6ff; }
  pre { background: #161b22; }
  code { background: rgba(110, 118, 129, 0.4); }
  blockquote { color: #8b949e; border-left-color: #30363d; }
}
</style>
</head>
<body>
<h1>${title}</h1>
<div class="content">
${formattedBody}
</div>
</body>
</html>`;
                              return <WebAnalysisCard 
                                onPreview={() => handlePreview(htmlWrapper, 'preview', content, false, true, url)}
                                onContent={() => handlePreview(htmlWrapper, 'source', content, false, true, url)}
                              />
                          }
                        }

                        return !inline && match ? (
                          <CodeBlock 
                            language={match[1]} 
                            theme={resolvedTheme === 'dark' ? oneDark : oneLight}
                          >
                            {String(children)}
                          </CodeBlock>
                        ) : (
                          <code className={className} {...props} style={{ background: 'rgba(255,255,255,0.2)' }}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {preprocessContent(msg.content)}
                  </ReactMarkdown>
                </div>
                <div className="copy-button-container copy-button-user">
                  <button className="copy-button" onClick={() => handleCopy(msg.content, index)}>
                    {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                    {copiedIndex === index ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </>
            ) : (
              <div className="ai-text">
                {(() => {
                  const content = msg.content.replace(/【前置回复】/g, '');
                  const parts = content.split(/(<think>[\s\S]*?<\/think>|<search>[\s\S]*?<\/search>)/g);
                  return parts.map((part, partIndex) => {
                    if (part.startsWith('<think>') && part.endsWith('</think>')) {
                      const thinkContent = part.replace(/^<think>|<\/think>$/g, '');
                      return (
                        <ThinkingBlock 
                          key={partIndex} 
                          theme={resolvedTheme === 'dark' ? oneDark : oneLight}
                          themeMode={resolvedTheme}
                          onPreview={handlePreview}
                        >
                          {preprocessContent(thinkContent)}
                        </ThinkingBlock>
                      );
                    } else if (part.startsWith('<search>') && part.endsWith('</search>')) {
                      const searchContent = part.replace(/^<search>|<\/search>$/g, '');
                      return <SearchBlock key={partIndex} content={searchContent} />;
                    } else if (part.trim()) {
                      return (
                        <ReactMarkdown
                          key={partIndex}
                          remarkPlugins={[remarkMath, remarkGfm, remarkSupersub]}
                          rehypePlugins={[rehypeKatex, rehypeRaw]}
                          components={{
                            a({node, ...props}: any) {
                              return <a target="_blank" rel="noopener noreferrer" {...props} />
                            },
                            div({node, className, ...props}: any) {
                               if (props['data-music-json']) {
                                   try {
                                     const songs = JSON.parse(props['data-music-json'].replace(/&apos;/g, "'"));
                                     return <MusicCard songs={songs} onPlay={handleMusicPlay} />;
                                   } catch (e) {
                                     console.error('Failed to parse music json', e);
                                     return null;
                                   }
                               }
                               return <div className={className} {...props} />;
                            },
                            code({inline, className, children, ...props}: any) {
                              const match = /language-(\w+)/.exec(className || '')
                              const lang = match ? match[1].toLowerCase() : '';
                              const content = String(children);
                              
                              if (!inline && lang === 'mermaid') {
                                 return <MermaidBlock chart={content} theme={resolvedTheme} />
                              }

                              // Enhanced detection for web analysis content
                              const isWebAnalysis = /<!--\s*type:\s*web_analysis\s+url:/.test(content);

                              if (!inline && (lang === 'html' || lang === 'xml' || isWebAnalysis)) {
                                const webAnalysisMatch = content.match(/<!--\s*type:\s*web_analysis\s+url:\s*`?([^`\s]+)`?\s+web_title:(.*?)\s*-->/s);
                                
                                if (webAnalysisMatch) {
                                    const url = webAnalysisMatch[1];
                                    const title = webAnalysisMatch[2].trim();
                                    const bodyContent = content.replace(webAnalysisMatch[0], '').trim();
                                    
                                    // Helper to detect if content has HTML tags
                                    const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(bodyContent);
                                    
                                    // Format content: if it has HTML tags, use as is; otherwise wrap paragraphs
                                    const formattedBody = hasHtmlTags 
                                      ? bodyContent 
                                      : bodyContent.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');

                                    const htmlWrapper = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 24px; max-width: 800px; margin: 0 auto; color: #333; }
h1 { font-size: 24px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #eaeaea; }
.metadata { font-size: 13px; color: #666; margin-bottom: 24px; background: #f5f5f5; padding: 8px 12px; border-radius: 6px; display: inline-block; }
a { color: #0969da; text-decoration: none; }
a:hover { text-decoration: underline; }
img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; font-size: 13px; line-height: 1.45; }
code { background: rgba(175, 184, 193, 0.2); padding: 0.2em 0.4em; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; font-size: 85%; }
blockquote { margin: 0; padding: 0 1em; color: #57606a; border-left: 0.25em solid #d0d7de; }
p { margin-bottom: 16px; }
@media (prefers-color-scheme: dark) {
  body { background-color: #0d1117; color: #c9d1d9; }
  h1 { border-bottom-color: #30363d; }
  .metadata { background: #161b22; color: #8b949e; }
  a { color: #58a6ff; }
  pre { background: #161b22; }
  code { background: rgba(110, 118, 129, 0.4); }
  blockquote { color: #8b949e; border-left-color: #30363d; }
}
</style>
</head>
<body>
<h1>${title}</h1>
<div class="metadata">Source: <a href="${url}" target="_blank">${url}</a></div>
<div class="content">
${formattedBody}
</div>
</body>
</html>`;
                                    return <HtmlCard 
                                      onPreview={() => handlePreview(htmlWrapper, 'preview', content)}
                                      onViewSource={() => handlePreview(htmlWrapper, 'source', content)}
                                    />
                                }

                                return <HtmlCard 
                                  onPreview={() => handlePreview(content, 'preview')}
                                  onViewSource={() => handlePreview(content, 'source')}
                                />
                              }

                              return !inline && match ? (
                                <CodeBlock 
                                  language={match[1]} 
                                  theme={resolvedTheme === 'dark' ? oneDark : oneLight}
                                >
                                  {String(children)}
                                </CodeBlock>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              )
                            },
                            table({children}: any) {
                              return <TableBlock>{children}</TableBlock>
                            }
                          }}
                        >
                          {preprocessContent(part)}
                        </ReactMarkdown>
                      );
                    }
                    return null;
                  });
                })()}
                <div className="copy-button-container copy-button-ai">
                  <button className="copy-button" onClick={() => handleCopy(msg.content, index)}>
                    {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                    {copiedIndex === index ? 'Copied' : 'Copy Source'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
      <PreviewSidebar
        isOpen={htmlPreview.isOpen}
        content={htmlPreview.content}
        sourceContent={htmlPreview.sourceContent}
        onClose={() => setHtmlPreview(prev => ({ ...prev, isOpen: false }))}
        width={previewWidth}
        onWidthChange={setPreviewWidth}
        themeMode={resolvedTheme as 'light' | 'dark'}
        activeTab={htmlPreview.activeTab}
        onTabChange={(tab) => setHtmlPreview(prev => ({ ...prev, activeTab: tab }))}
        showToolbarControls={htmlPreview.showToolbarControls}
        webAnalysisMode={htmlPreview.webAnalysisMode}
        previewUrl={htmlPreview.previewUrl}
      />
      <MusicPlayerSidebar
        isOpen={musicPlayer.isOpen}
        onClose={() => setMusicPlayer(prev => ({ ...prev, isOpen: false }))}
        initialSong={musicPlayer.currentSong}
        songList={musicPlayer.songList}
        themeMode={resolvedTheme as 'light' | 'dark'}
        width={musicPlayerWidth}
        onWidthChange={setMusicPlayerWidth}
      />
      </div>
    </div>
  );
}
