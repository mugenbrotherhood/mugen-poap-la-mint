import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MugenPOAPMintPage from "./components/MugenPOAPMintPage";
import OrganizerDashboard from "./components/OrganizerDashboard";
import './styles/qr-styles.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main minting page - handles both regular and QR users */}
          <Route path="/" element={<MugenPOAPMintPage />} />
          
          {/* Event-specific routes */}
          <Route path="/event/:eventId" element={<MugenPOAPMintPage />} />
          <Route path="/mint" element={<MugenPOAPMintPage />} />
          <Route path="/claim/:claimCode" element={<MugenPOAPMintPage />} />
          
          {/* Organizer routes */}
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="/admin" element={<OrganizerDashboard />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
