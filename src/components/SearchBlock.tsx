import React, { useState } from 'react';
import { Search, ChevronRight, X } from 'lucide-react';
import './SearchBlock.css';

interface SearchResult {
  index: number;
  url: string;
  title: string;
}

const SearchBlock = ({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse content to extract results
  const results: SearchResult[] = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      // Regex to match:
      // 1. `url`
      // 1. [Title](url)
      // 1. url
      
      const indexMatch = line.match(/^\s*(\d+)\.\s*/);
      if (!indexMatch) return null;
      
      const index = parseInt(indexMatch[1]);
      const rest = line.substring(indexMatch[0].length).trim();
      
      // Check for Markdown link [Title](url)
      const mdLinkMatch = rest.match(/^\[(.*?)\]\((.*?)\)/);
      if (mdLinkMatch) {
        return {
          index,
          title: mdLinkMatch[1],
          url: mdLinkMatch[2]
        };
      }
      
      // Check for backticked URL `url`
      const backtickMatch = rest.match(/^`([^`]+)`/);
      if (backtickMatch) {
        return {
          index,
          title: backtickMatch[1], // Use URL as title
          url: backtickMatch[1]
        };
      }
      
      // Fallback: take the whole string as URL/Title
      return {
        index,
        title: rest,
        url: rest
      };
    })
    .filter((item): item is SearchResult => item !== null);

  if (results.length === 0) return null;

  return (
    <div className="search-block-container">
      <div className="search-card" onClick={() => setIsOpen(true)}>
        <div className="search-card-left">
          <Search size={18} className="search-icon" />
          <span>查找到 {results.length} 个网页</span>
        </div>
        <ChevronRight size={18} />
      </div>

      {isOpen && (
        <div className="search-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-modal-header">
              <h3>搜索结果</h3>
              <button onClick={() => setIsOpen(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <div className="search-results-list">
              {results.map((result) => (
                <div key={result.index} className="search-result-item">
                  <span className="result-index">{result.index}</span>
                  <div className="result-content">
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="result-link">
                      <div className="result-title">{result.title}</div>
                      <div className="result-url">{result.url}</div>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBlock;
