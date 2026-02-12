import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ConversationView from './pages/ConversationView';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/share/:uuid" element={<ConversationView />} />
        {/* Optional: Simple home page or redirect */}
        <Route path="/" element={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
            <h1>AIme Share</h1>
            <p>Please provide a conversation UUID in the URL (e.g., /share/uuid).</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
