import React, { useState, useEffect } from 'react';
import './App.css';
import DownloadBackup from './DownloadBackup';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://5fbf7006-ac0f-4985-a813-a01f269d3d14.preview.emergentagent.com';

// Language translations
const translations = {
  gr: {
    // Navbar
    home: 'Αρχική',
    rankings: 'Κατατάξεις',
    worldMap: 'Παγκόσμιος Χάρτης',
    dashboard: 'Dashboard',
    login: 'Σύνδεση',
    register: 'Εγγραφή',
    logout: 'Αποσύνδεση',
    
    // Hero Section
    heroTitle: 'WoBeRa',
    heroSubtitle: 'WORLD BETTING RANK',
    heroDescription: 'Ανακαλύψτε τη θέση σας στον παγκόσμιο χάρτη του WoBeRa. Συμμετέχετε σε διαγωνισμούς και κατακτήστε την κορυφή του World Betting Rank.',
    registerNow: 'ΕΓΓΡΑΦΗ ΤΩΡΑ',
    loginBtn: 'ΣΥΝΔΕΣΗ',
    
    // Features
    globalRankings: 'Παγκόσμιες Κατατάξεις',
    globalRankingsDesc: 'Δείτε τη θέση σας στον παγκόσμιο χάρτη των καλύτερων players',
    internationalCompetitions: 'Διεθνείς Διαγωνισμοί',
    internationalCompetitionsDesc: 'Συμμετέχετε σε αποκλειστικούς διαγωνισμούς ανά περιοχή',
    detailedStats: 'Λεπτομερείς Στατιστικές',
    detailedStatsDesc: 'Παρακολουθήστε την πρόοδό σας με προηγμένα analytics',
    
    // Auth
    loginTitle: 'Σύνδεση',
    registerTitle: 'Εγγραφή',
    username: 'Username',
    password: 'Password',
    email: 'Email',
    fullName: 'Πλήρες Όνομα',
    country: 'Χώρα',
    avatar: 'Avatar URL (προαιρετικό)',
    selectCountry: 'Επιλέξτε χώρα',
    loggingIn: 'Σύνδεση...',
    registering: 'Εγγραφή...',
    noAccount: 'Δεν έχετε λογαριασμό;',
    hasAccount: 'Έχετε ήδη λογαριασμό;',
    demoCredentials: 'Δοκιμάστε με demo account:',
    loadDemo: 'Φόρτωση Demo Στοιχείων',
    
    // Dashboard
    welcomeBack: 'Καλώς ήρθες',
    totalBets: 'Συνολικά Δελτία',
    wonBets: 'Κερδισμένα',
    globalPosition: 'Παγκόσμια Θέση',
    score: 'Βαθμολογία',
    availableCompetitions: 'Διαθέσιμοι Διαγωνισμοί',
    participate: 'Συμμετοχή',
    
    // Rankings
    globalRankingsTitle: 'Παγκόσμιες Κατατάξεις',
    position: 'Θέση',
    player: 'Παίκτης',
    statistics: 'Στατιστικά',
    
    // World Map
    worldMapTitle: 'Παγκόσμιος Χάρτης',
    countryStats: 'Στατιστικά ανά χώρα',
    totalUsers: 'Συνολικοί Χρήστες:',
    totalBetsLabel: 'Συνολικά Δελτία:',
    totalAmount: 'Συνολικό Ποσό:',
    totalWinnings: 'Συνολικά Κέρδη:',
    
    // Countries
    countries: {
      'GR': 'Ελλάδα',
      'US': 'ΗΠΑ',
      'UK': 'Ηνωμένο Βασίλειο',
      'DE': 'Γερμανία',
      'FR': 'Γαλλία',
      'IT': 'Ιταλία',
      'ES': 'Ισπανία',
      'BR': 'Βραζιλία',
      'AR': 'Αργεντινή',
      'CN': 'Κίνα',
      'JP': 'Ιαπωνία',
      'AU': 'Αυστραλία'
    },
    
    // World Map specific
    countriesList: 'Λίστα Χωρών',
    countryDetails: 'Λεπτομέρειες Χώρας',
    countryRankings: 'Κατάταξη Χώρας',
    usersInCountry: 'χρήστες',
    backToCountries: 'Πίσω στις Χώρες',
    backToDetails: 'Πίσω στις Λεπτομέρειες',
    viewCountryRankings: 'Δείτε την Κατάταξη',
    position: 'Θέση',
    nationalRank: 'Εθνική Κατάταξη',
    noUsers: 'Δεν υπάρχουν χρήστες σε αυτή τη χώρα',
    searchCountries: 'Αναζήτηση χώρας...',
    noCountriesFound: 'Δεν βρέθηκαν χώρες',
    
    // Admin Panel
    adminPanel: 'Admin Panel',
    userManagement: 'Διαχείριση Χρηστών',
    siteMessages: 'Μηνύματα Site',
    competitions: 'Διαγωνισμοί',
    adminActions: 'Admin Actions',
    blockUser: 'Μπλοκάρισμα Χρήστη',
    unblockUser: 'Ξεμπλοκάρισμα',
    adjustPoints: 'Διόρθωση Πόντων',
    createCompetition: 'Νέος Διαγωνισμός',
    createMessage: 'Νέο Μήνυμα',
    selectUser: 'Επιλέξτε χρήστη',
    blockType: 'Τύπος μπλοκαρίσματος',
    temporary: 'Προσωρινό',
    permanent: 'Μόνιμο',
    duration: 'Διάρκεια (ώρες)',
    reason: 'Αιτιολογία',
    pointsChange: 'Αλλαγή πόντων',
    messageType: 'Τύπος μηνύματος',
    announcement: 'Ανακοίνωση',
    warning: 'Προειδοποίηση',
    info: 'Πληροφορία',
    message: 'Μήνυμα',
    expiresAt: 'Λήγει στις (προαιρετικό)',
    submit: 'Υποβολή',
    cancel: 'Ακύρωση',
    blocked: 'Μπλοκαρισμένος',
    active: 'Ενεργός',
    godLevel: 'God Level',
    superAdmin: 'Super Admin',
    adminLevel: 'Admin'
  },
  en: {
    // Navbar
    home: 'Home',
    rankings: 'Rankings',
    worldMap: 'World Map',
    dashboard: 'Dashboard',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    
    // Hero Section
    heroTitle: 'WoBeRa',
    heroSubtitle: 'WORLD BETTING RANK',
    heroDescription: 'Discover your position on the WoBeRa global map. Participate in competitions and conquer the top of the World Betting Rank.',
    registerNow: 'REGISTER NOW',
    loginBtn: 'LOGIN',
    
    // Features
    globalRankings: 'Global Rankings',
    globalRankingsDesc: 'See your position on the global map of the best players',
    internationalCompetitions: 'International Competitions',
    internationalCompetitionsDesc: 'Participate in exclusive competitions by region',
    detailedStats: 'Detailed Statistics',
    detailedStatsDesc: 'Track your progress with advanced analytics',
    
    // Auth
    loginTitle: 'Login',
    registerTitle: 'Register',
    username: 'Username',
    password: 'Password',
    email: 'Email',
    fullName: 'Full Name',
    country: 'Country',
    avatar: 'Avatar URL (optional)',
    selectCountry: 'Select country',
    loggingIn: 'Logging in...',
    registering: 'Registering...',
    noAccount: 'Don\'t have an account?',
    hasAccount: 'Already have an account?',
    demoCredentials: 'Try with demo account:',
    loadDemo: 'Load Demo Credentials',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    totalBets: 'Total Bets',
    wonBets: 'Won Bets',
    globalPosition: 'Global Position',
    score: 'Score',
    availableCompetitions: 'Available Competitions',
    participate: 'Participate',
    
    // Rankings
    globalRankingsTitle: 'Global Rankings',
    position: 'Position',
    player: 'Player',
    statistics: 'Statistics',
    
    // World Map
    worldMapTitle: 'World Map',
    countryStats: 'Statistics by country',
    totalUsers: 'Total Users:',
    totalBetsLabel: 'Total Bets:',
    totalAmount: 'Total Amount:',
    totalWinnings: 'Total Winnings:',
    
    // Countries
    countries: {
      'GR': 'Greece',
      'US': 'United States',
      'UK': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'BR': 'Brazil',
      'AR': 'Argentina',
      'CN': 'China',
      'JP': 'Japan',
      'AU': 'Australia'
    },
    
    // World Map specific
    countriesList: 'Countries List',
    countryDetails: 'Country Details',
    countryRankings: 'Country Rankings',
    usersInCountry: 'users',
    backToCountries: 'Back to Countries',
    backToDetails: 'Back to Details',
    viewCountryRankings: 'View Rankings',
    position: 'Position',
    nationalRank: 'National Ranking',
    noUsers: 'No users in this country',
    searchCountries: 'Search countries...',
    noCountriesFound: 'No countries found',
    
    // Admin Panel
    adminPanel: 'Admin Panel',
    userManagement: 'User Management',
    siteMessages: 'Site Messages',
    competitions: 'Competitions',
    adminActions: 'Admin Actions',
    blockUser: 'Block User',
    unblockUser: 'Unblock',
    adjustPoints: 'Adjust Points',
    createCompetition: 'New Competition',
    createMessage: 'New Message',
    selectUser: 'Select user',
    blockType: 'Block type',
    temporary: 'Temporary',
    permanent: 'Permanent',
    duration: 'Duration (hours)',
    reason: 'Reason',
    pointsChange: 'Points change',
    messageType: 'Message type',
    announcement: 'Announcement',
    warning: 'Warning',
    info: 'Information',
    message: 'Message',
    expiresAt: 'Expires at (optional)',
    submit: 'Submit',
    cancel: 'Cancel',
    blocked: 'Blocked',
    active: 'Active',
    godLevel: 'God Level',
    superAdmin: 'Super Admin',
    adminLevel: 'Admin'
  }
};

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [rankings, setRankings] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [countryStats, setCountryStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'gr');
  const [mapView, setMapView] = useState('countries'); // 'countries', 'countryDetails', 'countryRankings'
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryRankings, setCountryRankings] = useState([]);
  const [countrySearch, setCountrySearch] = useState('');
  
  // Admin Panel States
  const [allUsers, setAllUsers] = useState([]);
  const [adminActions, setAdminActions] = useState([]);
  const [siteMessages, setSiteMessages] = useState([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Admin Form States
  const [blockForm, setBlockForm] = useState({
    user_id: '',
    block_type: 'temporary',
    duration_hours: 24,
    reason: ''
  });
  
  const [pointsForm, setPointsForm] = useState({
    user_id: '',
    points_change: 0,
    reason: ''
  });
  
  const [messageForm, setMessageForm] = useState({
    message: '',
    message_type: 'info',
    expires_at: ''
  });
  
  const [competitionForm, setCompetitionForm] = useState({
    name: '',
    description: '',
    region: '',
    start_date: '',
    end_date: '',
    max_participants: 100,
    prize_pool: 1000
  });

  // Get current translations
  const t = translations[language];

  // Check if user is admin
  const isAdmin = user && user.admin_role && ['admin', 'super_admin', 'god'].includes(user.admin_role);
  const isGod = user && user.admin_role === 'god';
  const isSuperAdmin = user && user.admin_role === 'super_admin';

  // Country flags mapping
  const countryFlags = {
    'GR': '🇬🇷',
    'US': '🇺🇸', 
    'UK': '🇬🇧',
    'DE': '🇩🇪',
    'FR': '🇫🇷',
    'IT': '🇮🇹',
    'ES': '🇪🇸',
    'BR': '🇧🇷',
    'AR': '🇦🇷',
    'CN': '🇨🇳',
    'JP': '🇯🇵',
    'AU': '🇦🇺'
  };

  // Form states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    country: '',
    full_name: '',
    avatar_url: ''
  });

  const toggleLanguage = () => {
    const newLang = language === 'gr' ? 'en' : 'gr';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  // Avatar component
  const Avatar = ({ src, name, size = 'medium' }) => {
    const sizeClasses = {
      small: 'avatar-small',
      medium: 'avatar-medium',
      large: 'avatar-large'
    };

    const getInitials = (fullName) => {
      if (!fullName) return '?';
      return fullName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
    };

    return (
      <div className={`avatar ${sizeClasses[size]}`}>
        {src ? (
          <img 
            src={src} 
            alt={name} 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="avatar-initials" style={src ? {display: 'none'} : {display: 'flex'}}>
          {getInitials(name)}
        </div>
      </div>
    );
  };

  useEffect(() => {
    console.log('🔍 WoBeRa API_BASE_URL:', API_BASE_URL);
    if (token) {
      fetchProfile();
      fetchRankings();
      fetchCompetitions();
    }
    // Fetch country stats regardless of login status
    fetchCountryStats();
  }, [token]);
  
  // Additional useEffect to fetch rankings when navigating to Rankings
  useEffect(() => {
    if (currentView === 'rankings') {
      console.log('🏆 Fetching rankings for Rankings view');
      fetchRankings();
    }
    if (currentView === 'worldmap') {
      console.log('🌍 Fetching country stats for World Map view');
      fetchCountryStats();
      // Reset to countries view only when first entering the world map
      if (mapView !== 'countries') {
        setMapView('countries');
      }
    }
  }, [currentView]);

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
      console.log('🔍 Fetching global rankings...');
      const response = await fetch(`${API_BASE_URL}/api/rankings`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Global rankings fetched:', data.rankings.length, 'players');
        setRankings(data.rankings);
      } else {
        console.error('❌ Rankings fetch failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching rankings:', error);
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

  const fetchCountryRankings = async (countryCode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rankings/country/${countryCode}`);
      if (response.ok) {
        const data = await response.json();
        setCountryRankings(data.rankings);
      }
    } catch (error) {
      console.error('Error fetching country rankings:', error);
    }
  };

  // Admin API Functions
  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAdminActions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/actions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminActions(data.actions);
      }
    } catch (error) {
      console.error('Error fetching admin actions:', error);
    }
  };

  const fetchSiteMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/site-messages`);
      if (response.ok) {
        const data = await response.json();
        setSiteMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching site messages:', error);
    }
  };

  const blockUser = async (blockData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/block-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(blockData)
      });
      
      if (response.ok) {
        alert('User blocked successfully');
        fetchAllUsers();
        setShowBlockModal(false);
        setBlockForm({ user_id: '', block_type: 'temporary', duration_hours: 24, reason: '' });
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Error blocking user');
    }
  };

  const unblockUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/unblock-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('User unblocked successfully');
        fetchAllUsers();
      } else {
        alert('Error unblocking user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Error unblocking user');
    }
  };

  const adjustPoints = async (pointsData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/adjust-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pointsData)
      });
      
      if (response.ok) {
        alert('Points adjusted successfully');
        fetchAllUsers();
        setShowPointsModal(false);
        setPointsForm({ user_id: '', points_change: 0, reason: '' });
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
      alert('Error adjusting points');
    }
  };

  const createSiteMessage = async (messageData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/site-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });
      
      if (response.ok) {
        alert('Site message created successfully');
        fetchSiteMessages();
        setShowMessageModal(false);
        setMessageForm({ message: '', message_type: 'info', expires_at: '' });
      } else {
        alert('Error creating message');
      }
    } catch (error) {
      console.error('Error creating message:', error);
      alert('Error creating message');
    }
  };

  const createCompetition = async (competitionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/create-competition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(competitionData)
      });
      
      if (response.ok) {
        alert('Competition created successfully');
        fetchCompetitions();
        setShowCompetitionModal(false);
        setCompetitionForm({
          name: '',
          description: '',
          region: '',
          start_date: '',
          end_date: '',
          max_participants: 100,
          prize_pool: 1000
        });
      } else {
        alert('Error creating competition');
      }
    } catch (error) {
      console.error('Error creating competition:', error);
      alert('Error creating competition');
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
          full_name: '',
          avatar_url: ''
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
          src="https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0" 
          alt="Luxury Black Car" 
          className="hero-image"
        />
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">{t.heroTitle}</span>
            <br />
            <span className="hero-subtitle">{t.heroSubtitle}</span>
          </h1>
          <p className="hero-description">
            {t.heroDescription}
          </p>
          <div className="hero-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => setCurrentView('register')}
            >
              {t.registerNow}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentView('login')}
            >
              {t.loginBtn}
            </button>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>{t.globalRankings}</h3>
              <p>{t.globalRankingsDesc}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>{t.internationalCompetitions}</h3>
              <p>{t.internationalCompetitionsDesc}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>{t.detailedStats}</h3>
              <p>{t.detailedStatsDesc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">{t.loginTitle}</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>{t.username}</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>{t.password}</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.loggingIn : t.loginBtn}
          </button>
        </form>
        <div className="demo-section">
          <p>{t.demoCredentials}</p>
          <button 
            className="btn btn-secondary"
            onClick={() => setLoginForm({ username: 'testuser', password: 'test123' })}
          >
            {t.loadDemo}
          </button>
        </div>
        <p className="auth-switch">
          {t.noAccount}
          <button onClick={() => setCurrentView('register')}>{t.register}</button>
        </p>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">{t.registerTitle}</h2>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>{t.fullName}</label>
            <input
              type="text"
              value={registerForm.full_name}
              onChange={(e) => setRegisterForm({...registerForm, full_name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>{t.username}</label>
            <input
              type="text"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>{t.email}</label>
            <input
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>{t.country}</label>
            <select
              value={registerForm.country}
              onChange={(e) => setRegisterForm({...registerForm, country: e.target.value})}
              required
            >
              <option value="">{t.selectCountry}</option>
              {Object.entries(t.countries).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t.avatar}</label>
            <input
              type="url"
              value={registerForm.avatar_url}
              onChange={(e) => setRegisterForm({...registerForm, avatar_url: e.target.value})}
              placeholder="https://example.com/your-photo.jpg"
            />
          </div>
          <div className="form-group">
            <label>{t.password}</label>
            <input
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.registering : t.register}
          </button>
        </form>
        <p className="auth-switch">
          {t.hasAccount}
          <button onClick={() => setCurrentView('login')}>{t.loginTitle}</button>
        </p>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>{t.welcomeBack}, {user?.full_name}!</h2>
        <div className="user-stats">
          <div className="stat-card">
            <div className="stat-number">{user?.total_bets || 0}</div>
            <div className="stat-label">{t.totalBets}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{user?.won_bets || 0}</div>
            <div className="stat-label">{t.wonBets}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{user?.rank || 'N/A'}</div>
            <div className="stat-label">{t.globalPosition}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Math.round(user?.score) || 0}</div>
            <div className="stat-label">{t.score}</div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h3>{t.availableCompetitions}</h3>
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
                  {t.participate}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRankings = () => {
    console.log('🏆 Rendering rankings, players count:', rankings.length);
    
    return (
    <div className="rankings-container">
      <div className="rankings-header">
        <h2>{t.globalRankingsTitle}</h2>
        <img 
          src="https://images.unsplash.com/photo-1573684955725-34046d1ea9f3" 
          alt="Championship Trophy" 
          className="rankings-trophy"
        />
      </div>
      <div className="rankings-table">
        <div className="table-header">
          <div className="rank-col">{t.position}</div>
          <div className="player-col">{t.player}</div>
          <div className="country-col">{t.country}</div>
          <div className="stats-col">{t.statistics}</div>
          <div className="score-col">{t.score}</div>
        </div>
        {rankings.length > 0 ? rankings.map((player, index) => (
          <div key={player.id} className={`table-row ${index < 3 ? 'top-3' : ''}`}>
            <div className="rank-col">
              <span className="rank">{player.rank}</span>
              {index === 0 && <span className="medal gold">🥇</span>}
              {index === 1 && <span className="medal silver">🥈</span>}
              {index === 2 && <span className="medal bronze">🥉</span>}
            </div>
            <div className="player-col">
              <div className="player-info">
                <Avatar src={player.avatar_url} name={player.full_name} size="small" />
                <div className="player-details">
                  <span className="player-name">{player.full_name}</span>
                  <span className="username">@{player.username}</span>
                </div>
              </div>
            </div>
            <div className="country-col">{t.countries[player.country] || player.country}</div>
            <div className="stats-col">
              <span>W: {player.won_bets}</span>
              <span>L: {player.lost_bets}</span>
              <span>Total: {player.total_bets}</span>
            </div>
            <div className="score-col">{Math.round(player.score)}</div>
          </div>
        )) : (
          <div className="no-players">
            <p>Loading rankings...</p>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderWorldMap = () => {
    const handleCountryClick = (countryCode) => {
      const country = countryStats.find(stat => stat._id === countryCode);
      setSelectedCountry(country);
      setMapView('countryDetails');
    };

    const handleViewRankings = () => {
      if (selectedCountry) {
        fetchCountryRankings(selectedCountry._id);
        setMapView('countryRankings');
      }
    };

    const renderCountriesList = () => {
      // Filter countries based on search (support both Greek and English names)
      const filteredCountries = countryStats.filter(stat => {
        const greekName = (t.countries[stat._id] || stat._id).toLowerCase();
        const englishName = (translations.en.countries[stat._id] || stat._id).toLowerCase();
        const searchTerm = countrySearch.toLowerCase();
        
        return greekName.includes(searchTerm) || englishName.includes(searchTerm) || stat._id.toLowerCase().includes(searchTerm);
      });

      return (
        <div className="countries-list">
          <div className="countries-header">
            <h2>{t.worldMapTitle}</h2>
            <p>{t.countriesList}</p>
            
            <div className="search-container">
              <input
                type="text"
                placeholder={t.searchCountries}
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="country-search"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>
          
          {filteredCountries.length > 0 ? (
            <div className="countries-grid">
              {filteredCountries.map(stat => (
                <div 
                  key={stat._id} 
                  className="country-item"
                  onClick={() => handleCountryClick(stat._id)}
                >
                  <div className="country-flag">
                    {countryFlags[stat._id] || '🏳️'}
                  </div>
                  <div className="country-info">
                    <h3>{t.countries[stat._id] || stat._id}</h3>
                    <span className="user-count">
                      {stat.total_users} {t.usersInCountry}
                    </span>
                  </div>
                  <div className="country-arrow">→</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-countries-found">
              <p>{t.noCountriesFound}</p>
            </div>
          )}
        </div>
      );
    };

    const renderCountryDetails = () => (
      <div className="country-details">
        <div className="country-details-header">
          <button 
            className="back-btn"
            onClick={() => setMapView('countries')}
          >
            ← {t.backToCountries}
          </button>
          <div className="country-title">
            <span className="country-flag-large">
              {countryFlags[selectedCountry._id] || '🏳️'}
            </span>
            <h2>{t.countries[selectedCountry._id] || selectedCountry._id}</h2>
          </div>
        </div>
        
        <div className="country-stats-detailed">
          <div className="stat-card-large">
            <div className="stat-number">{selectedCountry.total_users}</div>
            <div className="stat-label">{t.totalUsers}</div>
          </div>
          <div className="stat-card-large">
            <div className="stat-number">{selectedCountry.total_bets}</div>
            <div className="stat-label">{t.totalBetsLabel}</div>
          </div>
          <div className="stat-card-large">
            <div className="stat-number">€{Math.round(selectedCountry.total_amount)}</div>
            <div className="stat-label">{t.totalAmount}</div>
          </div>
          <div className="stat-card-large">
            <div className="stat-number">€{Math.round(selectedCountry.total_winnings)}</div>
            <div className="stat-label">{t.totalWinnings}</div>
          </div>
        </div>

        <div className="country-actions">
          <button 
            className="btn btn-primary"
            onClick={handleViewRankings}
          >
            {t.viewCountryRankings}
          </button>
        </div>
      </div>
    );

    const renderCountryRankings = () => (
      <div className="country-rankings">
        <div className="country-rankings-header">
          <button 
            className="back-btn"
            onClick={() => setMapView('countryDetails')}
          >
            ← {t.backToDetails}
          </button>
          <div className="country-title">
            <span className="country-flag-large">
              {countryFlags[selectedCountry._id] || '🏳️'}
            </span>
            <h2>{t.nationalRank} - {t.countries[selectedCountry._id] || selectedCountry._id}</h2>
          </div>
        </div>

        {countryRankings.length > 0 ? (
          <div className="rankings-table">
            <div className="table-header">
              <div className="rank-col">{t.position}</div>
              <div className="player-col">{t.player}</div>
              <div className="stats-col">{t.statistics}</div>
              <div className="score-col">{t.score}</div>
            </div>
            {countryRankings.map((player, index) => (
              <div key={player.id} className={`table-row ${index < 3 ? 'top-3' : ''}`}>
                <div className="rank-col">
                  <span className="rank">{player.rank}</span>
                  {index === 0 && <span className="medal gold">🥇</span>}
                  {index === 1 && <span className="medal silver">🥈</span>}
                  {index === 2 && <span className="medal bronze">🥉</span>}
                </div>
                <div className="player-col">
                  <div className="player-info">
                    <Avatar src={player.avatar_url} name={player.full_name} size="small" />
                    <div className="player-details">
                      <span className="player-name">{player.full_name}</span>
                      <span className="username">@{player.username}</span>
                    </div>
                  </div>
                </div>
                <div className="stats-col">
                  <span>W: {player.won_bets}</span>
                  <span>L: {player.lost_bets}</span>
                  <span>Total: {player.total_bets}</span>
                </div>
                <div className="score-col">{Math.round(player.score)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-users">
            <p>{t.noUsers}</p>
          </div>
        )}
      </div>
    );

    return (
      <div className="world-map-container">
        {mapView === 'countries' && renderCountriesList()}
        {mapView === 'countryDetails' && renderCountryDetails()}
        {mapView === 'countryRankings' && renderCountryRankings()}
      </div>
    );
  };

  // Admin Panel Component
  const renderAdminPanel = () => {
    const [activeTab, setActiveTab] = useState('users');

    const AdminHeader = () => (
      <div className="admin-header">
        <div className="admin-title">
          <h1>⚙️ {t.adminPanel}</h1>
          <div className="admin-role-badge">
            {user.admin_role === 'god' && (
              <span className="role-god">👑 {t.godLevel}</span>
            )}
            {user.admin_role === 'super_admin' && (
              <span className="role-super-admin">⭐ {t.superAdmin}</span>
            )}
            {user.admin_role === 'admin' && (
              <span className="role-admin">🛡️ {t.adminLevel}</span>
            )}
          </div>
        </div>
        
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 {t.userManagement}
          </button>
          
          <button 
            className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            📢 {t.siteMessages}
          </button>
          
          <button 
            className={`admin-tab ${activeTab === 'competitions' ? 'active' : ''}`}
            onClick={() => setActiveTab('competitions')}
          >
            🏆 {t.competitions}
          </button>
          
          {isGod && (
            <button 
              className={`admin-tab ${activeTab === 'actions' ? 'active' : ''}`}
              onClick={() => setActiveTab('actions')}
            >
              📋 {t.adminActions}
            </button>
          )}
        </div>
      </div>
    );

    const UsersTab = () => (
      <div className="admin-tab-content">
        <div className="admin-controls">
          <button 
            className="btn btn-primary"
            onClick={() => setShowBlockModal(true)}
          >
            🚫 {t.blockUser}
          </button>
          
          {isGod && (
            <button 
              className="btn btn-secondary"
              onClick={() => setShowPointsModal(true)}
            >
              ⚡ {t.adjustPoints}
            </button>
          )}
        </div>

        <div className="admin-table">
          <div className="table-header">
            <div className="col-user">👤 {t.player}</div>
            <div className="col-role">🛡️ Role</div>
            <div className="col-status">📊 {t.status}</div>
            <div className="col-stats">📈 Stats</div>
            <div className="col-actions">⚙️ Actions</div>
          </div>

          {allUsers.map(user => (
            <div key={user.id} className="table-row">
              <div className="col-user">
                <div className="user-info">
                  <Avatar src={user.avatar_url} name={user.full_name} size="small" />
                  <div className="user-details">
                    <span className="user-name">{user.full_name}</span>
                    <span className="username">@{user.username}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="col-role">
                <span className={`role-badge role-${user.admin_role}`}>
                  {user.admin_role === 'god' && '👑'}
                  {user.admin_role === 'super_admin' && '⭐'}
                  {user.admin_role === 'admin' && '🛡️'}
                  {user.admin_role === 'user' && '👤'}
                  {user.admin_role}
                </span>
              </div>
              
              <div className="col-status">
                <span className={`status-badge ${user.is_blocked ? 'blocked' : 'active'}`}>
                  {user.is_blocked ? t.blocked : t.active}
                </span>
              </div>
              
              <div className="col-stats">
                <div className="mini-stats">
                  <span>Bets: {user.total_bets}</span>
                  <span>Score: {Math.round(user.score)}</span>
                  <span>Rank: #{user.rank || 'N/A'}</span>
                </div>
              </div>
              
              <div className="col-actions">
                <div className="action-buttons">
                  {user.is_blocked ? (
                    <button 
                      className="btn-action unblock"
                      onClick={() => unblockUser(user.id)}
                      title={t.unblockUser}
                    >
                      ✅
                    </button>
                  ) : (
                    <button 
                      className="btn-action block"
                      onClick={() => {
                        setSelectedUser(user);
                        setBlockForm({...blockForm, user_id: user.id});
                        setShowBlockModal(true);
                      }}
                      title={t.blockUser}
                    >
                      🚫
                    </button>
                  )}
                  
                  {isGod && (
                    <button 
                      className="btn-action points"
                      onClick={() => {
                        setSelectedUser(user);
                        setPointsForm({...pointsForm, user_id: user.id});
                        setShowPointsModal(true);
                      }}
                      title={t.adjustPoints}
                    >
                      ⚡
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    const MessagesTab = () => (
      <div className="admin-tab-content">
        <div className="admin-controls">
          <button 
            className="btn btn-primary"
            onClick={() => setShowMessageModal(true)}
          >
            ➕ {t.createMessage}
          </button>
        </div>

        <div className="messages-grid">
          {siteMessages.map(msg => (
            <div key={msg.id} className={`message-card ${msg.message_type}`}>
              <div className="message-header">
                <span className={`message-type ${msg.message_type}`}>
                  {msg.message_type === 'announcement' && '📢'}
                  {msg.message_type === 'warning' && '⚠️'}
                  {msg.message_type === 'info' && 'ℹ️'}
                  {t[msg.message_type]}
                </span>
                <span className="message-date">
                  {new Date(msg.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="message-content">
                {msg.message}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    const CompetitionsTab = () => (
      <div className="admin-tab-content">
        <div className="admin-controls">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCompetitionModal(true)}
          >
            ➕ {t.createCompetition}
          </button>
        </div>

        <div className="competitions-admin-grid">
          {competitions.map(comp => (
            <div key={comp.id} className="competition-admin-card">
              <h4>{comp.name}</h4>
              <p>{comp.description}</p>
              <div className="competition-details">
                <span className="region">🌍 {comp.region}</span>
                <span className="participants">👥 {comp.current_participants}/{comp.max_participants}</span>
                <span className="prize">💰 €{comp.prize_pool.toLocaleString()}</span>
                <span className={`status ${comp.status}`}>📊 {comp.status}</span>
              </div>
              <div className="competition-dates">
                <span>📅 {new Date(comp.start_date).toLocaleDateString()}</span>
                <span>📅 {new Date(comp.end_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    const ActionsTab = () => (
      <div className="admin-tab-content">
        <h3>📋 Recent Admin Actions</h3>
        <div className="actions-table">
          {adminActions.map(action => (
            <div key={action.id} className="action-row">
              <div className="action-info">
                <span className="action-type">{action.action_type}</span>
                <span className="action-admin">by {action.admin_id}</span>
                <span className="action-date">{new Date(action.timestamp).toLocaleString()}</span>
              </div>
              <div className="action-details">
                {JSON.stringify(action.details)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="admin-panel">
        <AdminHeader />
        
        <div className="admin-content">
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'messages' && <MessagesTab />}
          {activeTab === 'competitions' && <CompetitionsTab />}
          {activeTab === 'actions' && isGod && <ActionsTab />}
        </div>

        {/* Block User Modal */}
        {showBlockModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>🚫 {t.blockUser}</h3>
              {selectedUser && (
                <p>Blocking: <strong>{selectedUser.full_name}</strong></p>
              )}
              
              <div className="form-group">
                <label>{t.blockType}</label>
                <select
                  value={blockForm.block_type}
                  onChange={(e) => setBlockForm({...blockForm, block_type: e.target.value})}
                >
                  <option value="temporary">{t.temporary}</option>
                  <option value="permanent">{t.permanent}</option>
                </select>
              </div>

              {blockForm.block_type === 'temporary' && (
                <div className="form-group">
                  <label>{t.duration}</label>
                  <input
                    type="number"
                    value={blockForm.duration_hours}
                    onChange={(e) => setBlockForm({...blockForm, duration_hours: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
              )}

              <div className="form-group">
                <label>{t.reason}</label>
                <textarea
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({...blockForm, reason: e.target.value})}
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowBlockModal(false)}
                >
                  {t.cancel}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => blockUser(blockForm)}
                >
                  {t.submit}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Points Adjustment Modal */}
        {showPointsModal && isGod && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>⚡ {t.adjustPoints}</h3>
              {selectedUser && (
                <p>User: <strong>{selectedUser.full_name}</strong></p>
              )}
              
              <div className="form-group">
                <label>{t.pointsChange}</label>
                <input
                  type="number"
                  value={pointsForm.points_change}
                  onChange={(e) => setPointsForm({...pointsForm, points_change: parseInt(e.target.value)})}
                />
              </div>

              <div className="form-group">
                <label>{t.reason}</label>
                <textarea
                  value={pointsForm.reason}
                  onChange={(e) => setPointsForm({...pointsForm, reason: e.target.value})}
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowPointsModal(false)}
                >
                  {t.cancel}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => adjustPoints(pointsForm)}
                >
                  {t.submit}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Site Message Modal */}
        {showMessageModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>📢 {t.createMessage}</h3>
              
              <div className="form-group">
                <label>{t.messageType}</label>
                <select
                  value={messageForm.message_type}
                  onChange={(e) => setMessageForm({...messageForm, message_type: e.target.value})}
                >
                  <option value="info">{t.info}</option>
                  <option value="announcement">{t.announcement}</option>
                  <option value="warning">{t.warning}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t.message}</label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.expiresAt}</label>
                <input
                  type="datetime-local"
                  value={messageForm.expires_at}
                  onChange={(e) => setMessageForm({...messageForm, expires_at: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowMessageModal(false)}
                >
                  {t.cancel}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => createSiteMessage(messageForm)}
                >
                  {t.submit}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Competition Modal */}
        {showCompetitionModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>🏆 {t.createCompetition}</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Competition Name</label>
                  <input
                    type="text"
                    value={competitionForm.name}
                    onChange={(e) => setCompetitionForm({...competitionForm, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Region</label>
                  <select
                    value={competitionForm.region}
                    onChange={(e) => setCompetitionForm({...competitionForm, region: e.target.value})}
                    required
                  >
                    <option value="">Select Region</option>
                    <option value="Global">Global</option>
                    <option value="Europe">Europe</option>
                    <option value="Americas">Americas</option>
                    <option value="Asia">Asia</option>
                    <option value="Africa">Africa</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={competitionForm.description}
                  onChange={(e) => setCompetitionForm({...competitionForm, description: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="datetime-local"
                    value={competitionForm.start_date}
                    onChange={(e) => setCompetitionForm({...competitionForm, start_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="datetime-local"
                    value={competitionForm.end_date}
                    onChange={(e) => setCompetitionForm({...competitionForm, end_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Participants</label>
                  <input
                    type="number"
                    value={competitionForm.max_participants}
                    onChange={(e) => setCompetitionForm({...competitionForm, max_participants: parseInt(e.target.value)})}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Prize Pool (€)</label>
                  <input
                    type="number"
                    value={competitionForm.prize_pool}
                    onChange={(e) => setCompetitionForm({...competitionForm, prize_pool: parseFloat(e.target.value)})}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowCompetitionModal(false)}
                >
                  {t.cancel}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => createCompetition(competitionForm)}
                >
                  {t.submit}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Admin Panel Component
  const renderAdminPanel = () => {
    const [activeTab, setActiveTab] = useState('users');

    return (
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-title">
            <h1>⚙️ {t.adminPanel}</h1>
            <div className="admin-role-badge">
              {user.admin_role === 'god' && (
                <span className="role-god">👑 {t.godLevel}</span>
              )}
              {user.admin_role === 'super_admin' && (
                <span className="role-super-admin">⭐ {t.superAdmin}</span>
              )}
              {user.admin_role === 'admin' && (
                <span className="role-admin">🛡️ {t.adminLevel}</span>
              )}
            </div>
          </div>
          
          <div className="admin-tabs">
            <button 
              className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 {t.userManagement}
            </button>
            
            <button 
              className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              📢 {t.siteMessages}
            </button>
            
            <button 
              className={`admin-tab ${activeTab === 'competitions' ? 'active' : ''}`}
              onClick={() => setActiveTab('competitions')}
            >
              🏆 {t.competitions}
            </button>
            
            {isGod && (
              <button 
                className={`admin-tab ${activeTab === 'actions' ? 'active' : ''}`}
                onClick={() => setActiveTab('actions')}
              >
                📋 {t.adminActions}
              </button>
            )}
          </div>
        </div>
        
        <div className="admin-content">
          {activeTab === 'users' && (
            <div className="admin-tab-content">
              <div className="admin-controls">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowBlockModal(true)}
                >
                  🚫 {t.blockUser}
                </button>
                
                {isGod && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowPointsModal(true)}
                  >
                    ⚡ {t.adjustPoints}
                  </button>
                )}
              </div>

              <div className="admin-table">
                <div className="table-header">
                  <div className="col-user">👤 {t.player}</div>
                  <div className="col-role">🛡️ Role</div>
                  <div className="col-status">📊 {t.status}</div>
                  <div className="col-stats">📈 Stats</div>
                  <div className="col-actions">⚙️ Actions</div>
                </div>

                {allUsers.map(userItem => (
                  <div key={userItem.id} className="table-row">
                    <div className="col-user">
                      <div className="user-info">
                        <div className="user-details">
                          <span className="user-name">{userItem.full_name}</span>
                          <span className="username">@{userItem.username}</span>
                          <span className="user-email">{userItem.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-role">
                      <span className={`role-badge role-${userItem.admin_role}`}>
                        {userItem.admin_role === 'god' && '👑'}
                        {userItem.admin_role === 'super_admin' && '⭐'}
                        {userItem.admin_role === 'admin' && '🛡️'}
                        {userItem.admin_role === 'user' && '👤'}
                        {userItem.admin_role}
                      </span>
                    </div>
                    
                    <div className="col-status">
                      <span className={`status-badge ${userItem.is_blocked ? 'blocked' : 'active'}`}>
                        {userItem.is_blocked ? t.blocked : t.active}
                      </span>
                    </div>
                    
                    <div className="col-stats">
                      <div className="mini-stats">
                        <span>Bets: {userItem.total_bets}</span>
                        <span>Score: {Math.round(userItem.score)}</span>
                        <span>Rank: #{userItem.rank || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="col-actions">
                      <div className="action-buttons">
                        {userItem.is_blocked ? (
                          <button 
                            className="btn-action unblock"
                            onClick={() => unblockUser(userItem.id)}
                            title={t.unblockUser}
                          >
                            ✅
                          </button>
                        ) : (
                          <button 
                            className="btn-action block"
                            onClick={() => {
                              setSelectedUser(userItem);
                              setBlockForm({...blockForm, user_id: userItem.id});
                              setShowBlockModal(true);
                            }}
                            title={t.blockUser}
                          >
                            🚫
                          </button>
                        )}
                        
                        {isGod && (
                          <button 
                            className="btn-action points"
                            onClick={() => {
                              setSelectedUser(userItem);
                              setPointsForm({...pointsForm, user_id: userItem.id});
                              setShowPointsModal(true);
                            }}
                            title={t.adjustPoints}
                          >
                            ⚡
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="admin-tab-content">
              <div className="admin-controls">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowMessageModal(true)}
                >
                  ➕ {t.createMessage}
                </button>
              </div>

              <div className="messages-grid">
                {siteMessages.map(msg => (
                  <div key={msg.id} className={`message-card ${msg.message_type}`}>
                    <div className="message-header">
                      <span className={`message-type ${msg.message_type}`}>
                        {msg.message_type === 'announcement' && '📢'}
                        {msg.message_type === 'warning' && '⚠️'}
                        {msg.message_type === 'info' && 'ℹ️'}
                        {t[msg.message_type]}
                      </span>
                      <span className="message-date">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="message-content">
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'competitions' && (
            <div className="admin-tab-content">
              <div className="admin-controls">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCompetitionModal(true)}
                >
                  ➕ {t.createCompetition}
                </button>
              </div>

              <div className="competitions-admin-grid">
                {competitions.map(comp => (
                  <div key={comp.id} className="competition-admin-card">
                    <h4>{comp.name}</h4>
                    <p>{comp.description}</p>
                    <div className="competition-details">
                      <span className="region">🌍 {comp.region}</span>
                      <span className="participants">👥 {comp.current_participants}/{comp.max_participants}</span>
                      <span className="prize">💰 €{comp.prize_pool.toLocaleString()}</span>
                      <span className={`status ${comp.status}`}>📊 {comp.status}</span>
                    </div>
                    <div className="competition-dates">
                      <span>📅 {new Date(comp.start_date).toLocaleDateString()}</span>
                      <span>📅 {new Date(comp.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'actions' && isGod && (
            <div className="admin-tab-content">
              <h3>📋 Recent Admin Actions</h3>
              <div className="actions-table">
                {adminActions.map(action => (
                  <div key={action.id} className="action-row">
                    <div className="action-info">
                      <span className="action-type">{action.action_type}</span>
                      <span className="action-admin">by {action.admin_id}</span>
                      <span className="action-date">{new Date(action.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="action-details">
                      {JSON.stringify(action.details)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Admin Panel Component
  const renderAdminPanel = () => {
    const [activeTab, setActiveTab] = useState('users');

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
            {t.home}
          </button>
          <button 
            className={`nav-link ${currentView === 'rankings' ? 'active' : ''}`}
            onClick={() => setCurrentView('rankings')}
          >
            {t.rankings}
          </button>
          <button 
            className={`nav-link ${currentView === 'worldmap' ? 'active' : ''}`}
            onClick={() => setCurrentView('worldmap')}
          >
            {t.worldMap}
          </button>
          
          {/* Language Selector */}
          <button className="language-selector" onClick={toggleLanguage}>
            {language === 'gr' ? (
              <>
                🇬🇷 <span className="lang-text">EL</span>
              </>
            ) : (
              <>
                🇺🇸 <span className="lang-text">EN</span>
              </>
            )}
          </button>

          {token ? (
            <>
              <button 
                className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                {t.dashboard}
              </button>
              
              {/* Admin Panel Link */}
              {isAdmin && (
                <button 
                  className={`nav-link admin-nav ${currentView === 'admin' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('admin');
                    fetchAllUsers();
                    fetchSiteMessages();
                    if (isGod) fetchAdminActions();
                  }}
                >
                  <span className="admin-icon">⚙️</span>
                  {t.adminPanel}
                </button>
              )}
              
              <button className="btn btn-logout" onClick={handleLogout}>
                {t.logout}
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-login"
                onClick={() => setCurrentView('login')}
              >
                {t.login}
              </button>
              <button 
                className="btn btn-register"
                onClick={() => setCurrentView('register')}
              >
                {t.register}
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
        {currentView === 'admin' && isAdmin && renderAdminPanel()}
        {currentView === 'download' && <DownloadBackup />}
      </main>
    </div>
  );
}

export default App;