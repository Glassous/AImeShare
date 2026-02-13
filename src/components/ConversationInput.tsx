import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './ConversationInput.css';

export default function ConversationInput({ className = '' }: { className?: string }) {
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    let targetUuid = input.trim();
    if (!targetUuid) return;

    try {
      // Try to parse as URL
      // If user inputs "example.com/share/uuid", new URL needs protocol
      let urlString = targetUuid;
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
          // Check if it looks like a domain or path
          if (urlString.includes('.') || urlString.includes('/')) {
             // Basic heuristic: if it has slash or dot, try treating as URL
             urlString = 'https://' + urlString;
          }
      }

      const url = new URL(urlString);
      const parts = url.pathname.split('/').filter(Boolean);
      // Assuming URL structure ends with UUID or has /share/UUID
      if (parts.length > 0) {
        // Just take the last part as UUID
        targetUuid = parts[parts.length - 1];
      }
    } catch (e) {
      // Not a valid URL, treat as raw UUID
    }

    if (targetUuid) {
      navigate(`/share/${targetUuid}`);
    }
  };

  return (
    <form onSubmit={handleGo} className={`conversation-input-form ${className}`}>
      <input 
        type="text" 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter UUID or share link..."
        className="conversation-input-field"
        aria-label="Conversation UUID or URL"
      />
      <button type="submit" className="conversation-input-btn" aria-label="Go">
        <ArrowRight size={20} />
      </button>
    </form>
  );
}
