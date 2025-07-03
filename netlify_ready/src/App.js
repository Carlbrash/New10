import React, { useState, useEffect } from 'react';
import './App.css';
import DownloadBackup from './DownloadBackup';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [rankings, setRankings] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [countryStats, setCountryStats] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    country: '',
    full_name: ''
  });

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchRankings();
      fetchCompetitions();
      fetchCountryStats();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchRankings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rankings`);
      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    }
  };

  const fetchCompetitions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/competitions`);
      if (response.ok) {
        const data = await response.json();
        setCompetitions(data.competitions);
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
    }
  };

  const fetchCountryStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats/countries`);
      if (response.ok) {
        const data = await response.json();
        setCountryStats(data.country_stats);
      }
    } catch (error) {
      console.error('Error fetching country stats:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Login attempt with:', { username: loginForm.username, password: '***' });
      console.log('API URL:', `${API_BASE_URL}/api/login`);
      
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
      });
      
      console.log('Login response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setCurrentView('dashboard');
        setLoginForm({ username: '', password: '' });
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        alert(`Login failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert(`Login failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Registration attempt with:', { ...registerForm, password: '***' });
      console.log('API URL:', `${API_BASE_URL}/api/register`);
      
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerForm)
      });
      
      console.log('Registration response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setCurrentView('dashboard');
        setRegisterForm({
          username: '',
          email: '',
          password: '',
          country: '',
          full_name: ''
        });
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData);
        alert(`Registration failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert(`Registration failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setCurrentView('home');
  };

  const joinCompetition = async (competitionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/competitions/${competitionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('Successfully joined competition!');
        fetchCompetitions();
      } else {
        alert('Failed to join competition');
      }
    } catch (error) {
      console.error('Join competition error:', error);
      alert('Failed to join competition');
    }
  };

  const renderHome = () => (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <img 
          src="https://images.unsplash.com/photo-1700085663927-d223c604fb57" 
          alt="Luxury Casino" 
          className="hero-image"
        />
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">WoBeRa</span>
            <br />
            <span className="hero-subtitle">WORLD BETTING RANK</span>
          </h1>
          <p className="hero-description">
            Ανακαλύψτε τη θέση σας στον παγκόσμιο χάρτη του WoBeRa. 
            Συμμετέχετε σε διαγωνισμούς και κατακτήστε την κορυφή του World Betting Rank.
          </p>
          <div className="hero-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => setCurrentView('register')}
            >
              ΕΓΓΡΑΦΗ ΤΩΡΑ
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentView('login')}
            >
              ΣΥΝΔΕΣΗ
            </button>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Παγκόσμιες Κατατάξεις</h3>
              <p>Δείτε τη θέση σας στον παγκόσμιο χάρτη των καλύτερων players</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Διεθνείς Διαγωνισμοί</h3>
              <p>Συμμετέχετε σε αποκλειστικούς διαγωνισμούς ανά περιοχή</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Λεπτομερείς Στατιστικές</h3>
              <p>Παρακολουθήστε την πρόοδό σας με προηγμένα analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Σύνδεση</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Σύνδεση...' : 'ΣΥΝΔΕΣΗ'}
          </button>
        </form>
        <div className="demo-section">
          <p>Δοκιμάστε με demo account:</p>
          <button 
            className="btn btn-secondary"
            onClick={() => setLoginForm({ username: 'testuser', password: 'test123' })}
          >
            Φόρτωση Demo Στοιχείων
          </button>
        </div>
        <p className="auth-switch">
          Δεν έχετε λογαριασμό; 
          <button onClick={() => setCurrentView('register')}>Εγγραφή</button>
        </p>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Εγγραφή</h2>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Πλήρες Όνομα</label>
            <input
              type="text"
              value={registerForm.full_name}
              onChange={(e) => setRegisterForm({...registerForm, full_name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Χώρα</label>
            <select
              value={registerForm.country}
              onChange={(e) => setRegisterForm({...registerForm, country: e.target.value})}
              required
            >
              <option value="">Επιλέξτε χώρα</option>
              <option value="GR">Ελλάδα</option>
              <option value="US">ΗΠΑ</option>
              <option value="UK">Ηνωμένο Βασίλειο</option>
              <option value="DE">Γερμανία</option>
              <option value="FR">Γαλλία</option>
              <option value="IT">Ιταλία</option>
              <option value="ES">Ισπανία</option>
              <option value="BR">Βραζιλία</option>
              <option value="AR">Αργεντινή</option>
              <option value="CN">Κίνα</option>
              <option value="JP">Ιαπωνία</option>
              <option value="AU">Αυστραλία</option>
            </select>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Εγγραφή...' : 'ΕΓΓΡΑΦΗ'}
          </button>
        </form>
        <p className="auth-switch">
          Έχετε ήδη λογαριασμό; 
          <button onClick={() => setCurrentView('login')}>Σύνδεση</button>
        </p>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Καλώς ήρθες, {user?.full_name}!</h2>
        <div className="user-stats">
          <div className="stat-card">
            <div className="stat-number">{user?.total_bets || 0}</div>
            <div className="stat-label">Συνολικά Δελτία</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{user?.won_bets || 0}</div>
            <div className="stat-label">Κερδισμένα</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{user?.rank || 'N/A'}</div>
            <div className="stat-label">Παγκόσμια Θέση</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{user?.score?.toFixed(1) || '0.0'}</div>
            <div className="stat-label">Βαθμολογία</div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h3>Διαθέσιμοι Διαγωνισμοί</h3>
          <div className="competitions-grid">
            {competitions.map(comp => (
              <div key={comp.id} className="competition-card">
                <h4>{comp.name}</h4>
                <p>{comp.description}</p>
                <div className="competition-details">
                  <span className="region">{comp.region}</span>
                  <span className="prize">€{comp.prize_pool.toLocaleString()}</span>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => joinCompetition(comp.id)}
                >
                  Συμμετοχή
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRankings = () => (
    <div className="rankings-container">
      <div className="rankings-header">
        <h2>Παγκόσμιες Κατατάξεις</h2>
        <img 
          src="https://images.unsplash.com/photo-1573684955725-34046d1ea9f3" 
          alt="Championship Trophy" 
          className="rankings-trophy"
        />
      </div>
      <div className="rankings-table">
        <div className="table-header">
          <div className="rank-col">Θέση</div>
          <div className="player-col">Παίκτης</div>
          <div className="country-col">Χώρα</div>
          <div className="stats-col">Στατιστικά</div>
          <div className="score-col">Βαθμολογία</div>
        </div>
        {rankings.map((player, index) => (
          <div key={player.id} className={`table-row ${index < 3 ? 'top-3' : ''}`}>
            <div className="rank-col">
              <span className="rank">{player.rank}</span>
              {index === 0 && <span className="medal gold">🥇</span>}
              {index === 1 && <span className="medal silver">🥈</span>}
              {index === 2 && <span className="medal bronze">🥉</span>}
            </div>
            <div className="player-col">
              <span className="player-name">{player.full_name}</span>
              <span className="username">@{player.username}</span>
            </div>
            <div className="country-col">{player.country}</div>
            <div className="stats-col">
              <span>W: {player.won_bets}</span>
              <span>L: {player.lost_bets}</span>
              <span>Total: {player.total_bets}</span>
            </div>
            <div className="score-col">{player.score.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorldMap = () => (
    <div className="world-map-container">
      <div className="map-header">
        <h2>Παγκόσμιος Χάρτης</h2>
        <p>Στατιστικά ανά χώρα</p>
      </div>
      <div className="country-stats-grid">
        {countryStats.map(stat => (
          <div key={stat._id} className="country-stat-card">
            <h3>{stat._id}</h3>
            <div className="stat-row">
              <span>Συνολικοί Χρήστες:</span>
              <span className="stat-value">{stat.total_users}</span>
            </div>
            <div className="stat-row">
              <span>Συνολικά Δελτία:</span>
              <span className="stat-value">{stat.total_bets}</span>
            </div>
            <div className="stat-row">
              <span>Συνολικό Ποσό:</span>
              <span className="stat-value">€{stat.total_amount.toFixed(2)}</span>
            </div>
            <div className="stat-row">
              <span>Συνολικά Κέρδη:</span>
              <span className="stat-value">€{stat.total_winnings.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>WoBeRa</h1>
          <span className="brand-subtitle">World Betting Rank</span>
        </div>
        <div className="navbar-menu">
          <button 
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentView('home')}
          >
            Αρχική
          </button>
          <button 
            className={`nav-link ${currentView === 'rankings' ? 'active' : ''}`}
            onClick={() => setCurrentView('rankings')}
          >
            Κατατάξεις
          </button>
          <button 
            className={`nav-link ${currentView === 'worldmap' ? 'active' : ''}`}
            onClick={() => setCurrentView('worldmap')}
          >
            Παγκόσμιος Χάρτης
          </button>
          <button 
            className={`nav-link ${currentView === 'download' ? 'active' : ''}`}
            onClick={() => setCurrentView('download')}
          >
            📦 Backup
          </button>
          {token ? (
            <>
              <button 
                className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                Dashboard
              </button>
              <button className="btn btn-logout" onClick={handleLogout}>
                Αποσύνδεση
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-login"
                onClick={() => setCurrentView('login')}
              >
                Σύνδεση
              </button>
              <button 
                className="btn btn-register"
                onClick={() => setCurrentView('register')}
              >
                Εγγραφή
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'home' && renderHome()}
        {currentView === 'login' && renderLogin()}
        {currentView === 'register' && renderRegister()}
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'rankings' && renderRankings()}
        {currentView === 'worldmap' && renderWorldMap()}
        {currentView === 'download' && <DownloadBackup />}
      </main>
    </div>
  );
}

export default App;