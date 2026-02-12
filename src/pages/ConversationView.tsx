import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, type Conversation, type Message } from '../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sun, Moon, Monitor, Copy, Check, Download, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import 'katex/dist/katex.min.css';
import './ConversationView.css';

// Helper to normalize LaTeX delimiters
const preprocessContent = (content: string) => {
  if (!content) return '';
  let processed = content;

  // Replace \[ ... \] with $$ ... $$
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  // Replace \( ... \) with $ ... $
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  
  return processed;
};

// Component for Thinking Process
const ThinkingBlock = ({ children, theme }: { children: string, theme: any }) => {
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
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '')
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
  
  const { theme, resolvedTheme, cycleTheme } = useTheme();

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

  if (loading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;
  if (!conversation) return <div className="error-container">Conversation not found</div>;

  return (
    <div className="conversation-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <header className="top-app-bar">
        <div className="top-bar-left">
           <img src="/AIme-logo.svg" alt="AIme Logo" style={{ width: '24px', height: '24px', marginRight: '8px' }} />
           <span className="brand-text">AIme</span>
        </div>
        
        <div className="top-bar-center">
          <h1 className="title-text">{conversation.title || 'Untitled Conversation'}</h1>
          <span className="model-text">{conversation.model || 'Unknown Model'}</span>
        </div>

        <div className="top-bar-right">
           <button onClick={cycleTheme} className="theme-toggle-btn" title={`Current theme: ${theme}`}>
             {theme === 'system' && <Monitor size={20} />}
             {theme === 'light' && <Sun size={20} />}
             {theme === 'dark' && <Moon size={20} />}
           </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="content-area">
        {conversation.messages.map((msg, index) => (
          <div key={index} className={`message-item ${msg.role === 'user' ? 'user-message-container' : 'ai-message-container'}`}>
            {msg.role === 'user' ? (
              <>
                <div className="user-bubble">
                  {msg.content}
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
                  const parts = msg.content.split(/(<think>[\s\S]*?<\/think>)/g);
                  return parts.map((part, partIndex) => {
                    if (part.startsWith('<think>') && part.endsWith('</think>')) {
                      const thinkContent = part.replace(/^<think>|<\/think>$/g, '');
                      return (
                        <ThinkingBlock key={partIndex} theme={resolvedTheme === 'dark' ? oneDark : oneLight}>
                          {preprocessContent(thinkContent)}
                        </ThinkingBlock>
                      );
                    } else if (part.trim()) {
                      return (
                        <ReactMarkdown
                          key={partIndex}
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            code({node, inline, className, children, ...props}: any) {
                              const match = /language-(\w+)/.exec(className || '')
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
    </div>
  );
}
