import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import '../styles/qr-styles.css';

const QRGenerator = ({ 
  eventId = process.env.REACT_APP_DEFAULT_EVENT_ID || 'mugen-la-2025',
  baseUrl = 'https://mugen-poap-mint.vercel.app',
  refreshInterval = 30000, // 30 seconds
  onScan = () => {},
  fullscreen = false,
  onExitFullscreen = () => {}
}) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(refreshInterval / 1000);
  const [scanCount, setScanCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate QR code URL with timestamp
  const generateQRUrl = useCallback(() => {
    const timestamp = Math.floor(Date.now() / 1000);
    const qrUrl = `${baseUrl}/?eventId=${eventId}&qr=mobile&t=${timestamp}&source=qr-generator`;
    return qrUrl;
  }, [baseUrl, eventId]);

  // Generate QR code
  const generateQRCode = useCallback(async (url) => {
    setIsGenerating(true);
    try {
      const options = {
        width: fullscreen ? 400 : 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      };
      
      const qrDataURL = await QRCode.toDataURL(url, options);
      setQrCodeDataURL(qrDataURL);
      setCurrentUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [fullscreen]);

  // Refresh QR code
  const refreshQRCode = useCallback(() => {
    const newUrl = generateQRUrl();
    generateQRCode(newUrl);
    setTimeUntilRefresh(refreshInterval / 1000);
    
    // Track refresh for analytics
    const stats = JSON.parse(localStorage.getItem('mugen-qr-stats') || '{}');
    stats.totalRefreshes = (stats.totalRefreshes || 0) + 1;
    stats.lastRefresh = new Date().toISOString();
    localStorage.setItem('mugen-qr-stats', JSON.stringify(stats));
  }, [generateQRUrl, generateQRCode, refreshInterval]);

  // Initial generation
  useEffect(() => {
    refreshQRCode();
  }, [refreshQRCode]);

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilRefresh(prev => {
        if (prev <= 1) {
          refreshQRCode();
          return refreshInterval / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshQRCode, refreshInterval]);

  // Load scan statistics
  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem('mugen-qr-stats') || '{}');
    setScanCount(stats.totalScans || 0);
  }, []);

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert('URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('URL copied to clipboard!');
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `mugen-poap-qr-${eventId}-${Date.now()}.png`;
    link.href = qrCodeDataURL;
    link.click();
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (fullscreen) {
    return (
      <div className="fullscreen-qr">
        <button className="fullscreen-exit" onClick={onExitFullscreen}>
          ✕ Exit Fullscreen
        </button>
        <div className="fullscreen-qr-display">
          <div className="fullscreen-qr-code">
            {isGenerating ? (
              <div className="loading-text">
                <div className="loading-spinner"></div>
                Generating QR Code...
              </div>
            ) : (
              <img src={qrCodeDataURL} alt="POAP QR Code" />
            )}
          </div>
          <h1 className="fullscreen-title">Scan to Mint Your POAP</h1>
          <p className="fullscreen-instructions">
            Point your camera at the QR code to access the Mugen POAP minting site
          </p>
          <div className="qr-refresh-timer">
            <div className="timer-circle">
              {timeUntilRefresh}
            </div>
            <span>Auto-refresh in {formatTime(timeUntilRefresh)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-generator">
      <div className="qr-header">
        <h2 className="qr-title">QR Code Generator</h2>
        <p className="qr-subtitle">Event: {eventId}</p>
        <div className="status-indicator connected">
          <div className="status-dot"></div>
          Active • {scanCount} total scans
        </div>
      </div>

      <div className="qr-code-display">
        <div className="qr-code-image">
          {isGenerating ? (
            <div className="loading-text">
              <div className="loading-spinner"></div>
              Generating...
            </div>
          ) : (
            <img src={qrCodeDataURL} alt="POAP QR Code" />
          )}
        </div>
        
        <div className="qr-refresh-timer">
          <div className="timer-circle">
            {timeUntilRefresh}
          </div>
          <span>Auto-refresh in {formatTime(timeUntilRefresh)}</span>
        </div>
        
        <div className="qr-url-display">
          <small style={{ 
            color: 'var(--mugen-text-secondary)', 
            wordBreak: 'break-all',
            fontSize: '0.8rem'
          }}>
            {currentUrl}
          </small>
        </div>
      </div>

      <div className="qr-controls">
        <button 
          className="qr-button" 
          onClick={refreshQRCode}
          disabled={isGenerating}
        >
          🔄 Refresh Now
        </button>
        
        <button 
          className="qr-button secondary" 
          onClick={copyToClipboard}
        >
          📋 Copy URL
        </button>
        
        <button 
          className="qr-button secondary" 
          onClick={downloadQRCode}
          disabled={!qrCodeDataURL}
        >
          💾 Download
        </button>
      </div>

      <div className="qr-settings">
        <div className="dashboard-card" style={{ marginTop: '20px', maxWidth: '400px' }}>
          <h4 className="card-title">QR Settings</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{(refreshInterval / 1000)}s</div>
              <div className="stat-label">Refresh Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">300px</div>
              <div className="stat-label">QR Size</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator; 