import React from 'react';

const DownloadBackup = () => {
  const BASE_URL = "https://b90141f8-e066-4425-bc76-e032fe56376a.preview.emergentagent.com";
  const BACKUP_URL = `${BASE_URL}/WoBeRa_backup.tar.gz`;
  const NETLIFY_URL = `${BASE_URL}/WoBeRa_Netlify_Ready.zip`;

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyLinkToClipboard = (url, type) => {
    navigator.clipboard.writeText(url).then(() => {
      alert(`${type} link αντιγράφηκε στο clipboard!`);
    }).catch(() => {
      alert('Δεν μπόρεσε να αντιγραφεί το link.');
    });
  };

  return (
    <div className="download-container">
      <div className="download-card">
        <h2>📦 Download WoBeRa</h2>
        <p>Κατεβάστε τα αρχεία της πλατφόρμας WoBeRa</p>
        
        <div className="download-section">
          <h3>🚀 Netlify Deployment (Προτεινόμενο)</h3>
          <p>Έτοιμο για άμεσο upload στο Netlify</p>
          <div className="download-buttons">
            <button 
              onClick={() => downloadFile(NETLIFY_URL, 'WoBeRa_Netlify_Ready.zip')} 
              className="btn btn-primary"
            >
              📥 Download ZIP για Netlify
            </button>
            <button 
              onClick={() => copyLinkToClipboard(NETLIFY_URL, 'Netlify ZIP')} 
              className="btn btn-secondary"
            >
              📋 Copy Link
            </button>
          </div>
          <div className="file-info">
            <small>Μέγεθος: ~256KB | Τύπος: ZIP | Περιλαμβάνει: Frontend + Backend + Netlify Config</small>
          </div>
        </div>

        <div className="download-section">
          <h3>💾 Development Backup</h3>
          <p>Πλήρες backup για development</p>
          <div className="download-buttons">
            <button 
              onClick={() => downloadFile(BACKUP_URL, 'WoBeRa_backup.tar.gz')} 
              className="btn btn-primary"
            >
              📥 Download TAR.GZ
            </button>
            <button 
              onClick={() => copyLinkToClipboard(BACKUP_URL, 'Development backup')} 
              className="btn btn-secondary"
            >
              📋 Copy Link
            </button>
          </div>
          <div className="file-info">
            <small>Μέγεθος: ~32KB | Τύπος: TAR.GZ | Περιλαμβάνει: Source files μόνο</small>
          </div>
        </div>
        
        <div className="backup-info">
          <h3>📋 Netlify Deployment Instructions:</h3>
          <ol>
            <li>Κατεβάστε το ZIP για Netlify</li>
            <li>Extract το ZIP αρχείο</li>
            <li>Upload τον φάκελο στο Netlify</li>
            <li>Ενημερώστε το <code>REACT_APP_BACKEND_URL</code> στις env variables</li>
            <li>Deploy!</li>
          </ol>
        </div>
        
        <div className="manual-download">
          <p><strong>Manual Download Links:</strong></p>
          <div className="link-box">
            <p><strong>Netlify ZIP:</strong></p>
            <code>{NETLIFY_URL}</code>
          </div>
          <div className="link-box">
            <p><strong>Development Backup:</strong></p>
            <code>{BACKUP_URL}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadBackup;