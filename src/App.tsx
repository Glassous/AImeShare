import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ConversationView from './pages/ConversationView';
import ConversationInput from './components/ConversationInput';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/share/:uuid" element={<ConversationView />} />
        {/* Optional: Simple home page or redirect */}
        <Route path="/" element={
          <div className="empty-state-container">
            <div className="empty-state-content">
              <div className="logo-large">
                <img src="/AIme-logo.svg" alt="AIme" />
              </div>
              <h1>AIme Share</h1>
              <p>View and share your AI conversations with ease.</p>
              <div className="instruction-card">
                <p style={{marginBottom: '16px'}}>Enter a UUID or paste a share link below:</p>
                <ConversationInput />
              </div>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
