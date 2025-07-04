import React, { useState, useEffect } from 'react';
import './App.css';
import DownloadBackup from './DownloadBackup';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://d8447eb8-0bbb-4992-a0f4-51048a28a072.preview.emergentagent.com';

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
    analytics: 'Αναλυτικά Στοιχεία',
    contentManagement: 'Διαχείριση Περιεχομένου',
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
    analytics: 'Analytics',
    contentManagement: 'Content Management',
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
  // Rankings search states
  const [rankingSearch, setRankingSearch] = useState('');
  const [rankingSearchResult, setRankingSearchResult] = useState(null);
  const [showTop100Rankings, setShowTop100Rankings] = useState(false);
  const [rankingsFilter, setRankingsFilter] = useState('all'); // 'all', 'country', specific country code
  const [myPosition, setMyPosition] = useState(null);
  
  // World Map states
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [mapView, setMapView] = useState('countries');
  const [countryRankings, setCountryRankings] = useState([]);
  
  // Site Messages
  const [activeSiteMessages, setActiveSiteMessages] = useState([]);
  const [bannerUpdateTrigger, setBannerUpdateTrigger] = useState(0);

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
    country: '',
    phone: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Admin Panel States
  const [adminView, setAdminView] = useState('users');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [siteMessages, setSiteMessages] = useState([]);
  const [adminActions, setAdminActions] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [top100Users, setTop100Users] = useState([]);
  const [showTop100, setShowTop100] = useState(false);
  
  // Analytics States
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    user_countries: [],
    points_stats: {}
  });
  const [userAnalytics, setUserAnalytics] = useState({
    registration_timeline: [],
    top_users: [],
    admin_role_distribution: []
  });
  const [competitionAnalytics, setCompetitionAnalytics] = useState({
    competition_status: [],
    competition_regions: [],
    prize_stats: {}
  });
  
  // Content Management States
  const [contentPages, setContentPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [pageContent, setPageContent] = useState({});  // Store actual page content
  
  // Site Messages Modal States
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({
    message: '',
    message_type: 'info',
    expires_at: ''
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

  // Analytics Functions
  const fetchAnalyticsOverview = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching user analytics:', error);
    }
  };

  const fetchCompetitionAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/competitions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCompetitionAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching competition analytics:', error);
    }
  };

  const fetchContentPages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/content/pages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setContentPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching content pages:', error);
    }
  };

  const fetchTop100Users = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/top100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTop100Users(data.top_users);
      }
    } catch (error) {
      console.error('Error fetching top 100 users:', error);
    }
  };

  // Search for user in rankings
  const handleRankingSearch = (searchTerm) => {
    setRankingSearch(searchTerm);
    if (!searchTerm.trim()) {
      setRankingSearchResult(null);
      return;
    }

    // Search in current rankings list
    const searchLower = searchTerm.toLowerCase();
    const foundUser = rankings.find(user => 
      user.full_name.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower)
    );

    if (foundUser) {
      setRankingSearchResult({
        found: true,
        user: foundUser,
        message: `Found: ${foundUser.full_name} (@${foundUser.username}) is ranked #${foundUser.rank} with ${Math.round(foundUser.score)} points`
      });
    } else {
      setRankingSearchResult({
        found: false,
        message: `No user found with name or username containing "${searchTerm}"`
      });
    }
  };

  // Settings functions
  const openSettings = () => {
    if (user) {
      setSettingsForm({
        full_name: user.full_name || '',
        email: user.email || '',
        avatar_url: user.avatar_url || '',
        country: user.country || '',
        phone: user.phone || ''
      });
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setShowSettings(true);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        // Refresh user data
        fetchProfile();
        setShowSettings(false);
      } else {
        const errorData = await response.json();
        alert(`Error updating profile: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
    
    setSettingsLoading(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('New passwords do not match!');
      return;
    }
    
    if (passwordForm.new_password.length < 6) {
      alert('New password must be at least 6 characters long!');
      return;
    }
    
    setSettingsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });

      if (response.ok) {
        alert('Password changed successfully!');
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        const errorData = await response.json();
        alert(`Error changing password: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password');
    }
    
    setSettingsLoading(false);
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/menu/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menu_items);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const updateContentPage = async (pageId, pageData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/content/page/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pageData)
      });
      
      if (response.ok) {
        alert('Page updated successfully!');
        fetchContentPages();
        setShowContentModal(false);
        
        // Refresh the actual page content that's displayed
        fetchPageContent(pageId);
      } else {
        alert('Error updating page');
      }
    } catch (error) {
      console.error('Error updating page:', error);
      alert('Error updating page');
    }
  };

  const fetchPageContent = async (pageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/content/page/${pageId}`);
      if (response.ok) {
        const data = await response.json();
        setPageContent(prev => ({...prev, [pageId]: data}));
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
    }
  };

  const updateMenuItem = async (itemId, itemData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/menu/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData)
      });
      
      if (response.ok) {
        alert('Menu item updated successfully!');
        fetchMenuItems();
        setShowMenuModal(false);
      } else {
        alert('Error updating menu item');
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      alert('Error updating menu item');
    }
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
    if (currentView === 'admin' && isAdmin) {
      console.log('⚙️ Fetching admin data for Admin Panel view');
      fetchAdminData();
    }
  }, [currentView]);

  // Fetch active site messages for banner when user logs in
  useEffect(() => {
    console.log('🔄 UseEffect triggered for site messages, token:', !!token);
    if (token) {
      console.log('🔑 Token detected, fetching active site messages...');
      fetchActiveSiteMessages();
      // Refresh banner messages every 30 seconds
      const interval = setInterval(() => {
        console.log('⏰ Auto-refreshing site messages...');
        fetchActiveSiteMessages();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      console.log('❌ No token, fetching site messages anyway for public display...');
      fetchActiveSiteMessages(); // Fetch even without token for public messages
    }
  }, [token, API_BASE_URL]);

  // Also fetch messages on component mount
  useEffect(() => {
    console.log('🔄 Component mounted, fetching initial site messages...');
    fetchActiveSiteMessages();
  }, []);

  // Fetch analytics data when adminView changes to analytics
  useEffect(() => {
    if (adminView === 'analytics' && token && isAdmin) {
      fetchAnalyticsOverview();
      fetchUserAnalytics();
      fetchCompetitionAnalytics();
    } else if (adminView === 'content' && token && isAdmin) {
      fetchContentPages();
      fetchMenuItems();
    }
  }, [adminView, token, isAdmin]);

  // Fetch page content on app load
  useEffect(() => {
    const loadPageContent = async () => {
      const pageIds = ['home_hero', 'about_us', 'terms_of_service'];
      for (const pageId of pageIds) {
        await fetchPageContent(pageId);
      }
    };
    loadPageContent();
  }, []);

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

  // Admin Functions
  const fetchAdminData = async () => {
    setAdminLoading(true);
    try {
      // Fetch users
      const usersResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setAllUsers(usersData.users);
        setFilteredUsers(usersData.users); // Initialize filtered users
      }

      // Fetch site messages
      const messagesResponse = await fetch(`${API_BASE_URL}/api/site-messages`);
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setSiteMessages(messagesData.messages);
      }

      // Fetch admin actions (God only)
      if (isGod) {
        const actionsResponse = await fetch(`${API_BASE_URL}/api/admin/actions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (actionsResponse.ok) {
          const actionsData = await actionsResponse.json();
          setAdminActions(actionsData.actions);
        }
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setAdminLoading(false);
    }
  };

  // Fetch Active Site Messages for Banner
  const fetchActiveSiteMessages = async () => {
    console.log('🔄 Fetching active site messages...');
    console.log('🌐 Using API_BASE_URL:', API_BASE_URL);
    try {
      const response = await fetch(`${API_BASE_URL}/api/site-messages`);
      console.log('📡 Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Received site messages:', data);
        console.log('📊 Raw messages count:', data.messages?.length || 0);
        
        // Filter only active messages (not expired)
        const now = new Date();
        console.log('⏰ Current time:', now.toISOString());
        
        const activeMessages = data.messages.filter(msg => {
          console.log('🔍 Checking message:', msg.message, 'expires_at:', msg.expires_at);
          if (!msg.expires_at) {
            console.log('✅ Message has no expiry - keeping');
            return true; // No expiry = always active
          }
          const expiryDate = new Date(msg.expires_at);
          console.log('📅 Expiry date:', expiryDate.toISOString(), 'vs now:', now.toISOString());
          const isActive = expiryDate > now;
          console.log('🔄 Message active?', isActive);
          return isActive;
        });
        
        console.log('✅ Active messages after filtering:', activeMessages);
        console.log('📊 Final active messages count:', activeMessages.length);
        setActiveSiteMessages(activeMessages);
        setBannerUpdateTrigger(prev => prev + 1); // Force re-render
        console.log('🎬 Banner update trigger incremented');
      } else {
        console.error('❌ Failed to fetch site messages:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching active site messages:', error);
    }
  };

  // Search Users Function
  const handleUserSearch = (searchTerm) => {
    setUserSearchTerm(searchTerm);
    if (!searchTerm.trim()) {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const blockUser = async (userId, blockType, duration, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/block-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          block_type: blockType,
          duration_hours: duration,
          reason: reason
        })
      });

      if (response.ok) {
        alert('User blocked successfully');
        fetchAdminData();
      } else {
        alert('Error blocking user');
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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('User unblocked successfully');
        fetchAdminData();
      } else {
        alert('Error unblocking user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Error unblocking user');
    }
  };

  const adjustPoints = async (userId, pointsChange, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/adjust-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          points_change: parseInt(pointsChange),
          reason: reason
        })
      });

      if (response.ok) {
        alert('Points adjusted successfully');
        
        // Refresh admin panel data immediately
        fetchAdminData();
        
        // Wait a bit longer for database consistency, then refresh all other data
        setTimeout(async () => {
          console.log('🔄 Refreshing all data after points adjustment...');
          
          // Refresh rankings and country stats with a bit more delay between calls
          await fetchRankings();
          
          setTimeout(async () => {
            await fetchCountryStats();
          }, 500);
          
          // If analytics tab is active, refresh analytics too
          if (adminView === 'analytics') {
            setTimeout(async () => {
              await fetchAnalyticsOverview();
              await fetchUserAnalytics();
            }, 1000);
          }
          
          // If top 100 is visible, refresh it too
          if (showTop100) {
            setTimeout(async () => {
              await fetchTop100Users();
            }, 1500);
          }
        }, 1000);
        
      } else {
        alert('Error adjusting points');
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
      alert('Error adjusting points');
    }
  };

  // Helper function to format admin actions
  const formatAdminAction = (action) => {
    const adminName = action.admin_id || 'Unknown Admin';
    const targetUser = action.details?.target_user_name || action.target_user_id || 'Unknown User';
    
    switch (action.action_type) {
      case 'adjust_points':
        const pointsChange = action.details?.points_change || 0;
        const oldScore = action.details?.old_score || 0;
        const newScore = action.details?.new_score || 0;
        const reason = action.details?.reason || 'No reason provided';
        return `Αλλαγή ${pointsChange > 0 ? '+' : ''}${pointsChange} πόντων από ${adminName} στον χρήστη ${targetUser} (${oldScore} → ${newScore}). Αιτιολογία: ${reason}`;
      
      case 'block_user':
        const blockType = action.details?.block_type || 'permanent';
        const blockReason = action.details?.reason || 'No reason provided';
        return `Μπλοκάρισμα χρήστη ${targetUser} από ${adminName} (${blockType}). Αιτιολογία: ${blockReason}`;
      
      case 'unblock_user':
        return `Ξεμπλοκάρισμα χρήστη ${targetUser} από ${adminName}`;
      
      case 'create_competition':
        const compName = action.details?.competition_name || 'Unknown Competition';
        return `Δημιουργία διαγωνισμού "${compName}" από ${adminName}`;
      
      case 'create_site_message':
        const messageType = action.details?.message_type || 'info';
        return `Δημιουργία site message (${messageType}) από ${adminName}`;
      
      case 'update_content_page':
        const pageTitle = action.details?.page_title || 'Unknown Page';
        return `Ενημέρωση περιεχομένου σελίδας "${pageTitle}" από ${adminName}`;
      
      default:
        return `${action.action_type} από ${adminName}`;
    }
  };

  const createSiteMessage = async (messageData) => {
    try {
      // Prepare data for backend - convert empty expires_at to null
      const backendData = {
        message: messageData.message,
        message_type: messageData.message_type,
        expires_at: messageData.expires_at && messageData.expires_at.trim() !== '' ? messageData.expires_at : null
      };
      
      console.log('🔄 Creating site message with data:', backendData);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/site-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(backendData)
      });

      if (response.ok) {
        alert('Site message created successfully! It will appear in the banner.');
        fetchAdminData(); // Refresh admin data
        
        // Force refresh banner messages with delay
        setTimeout(() => {
          console.log('🔄 Force refreshing banner messages after creation...');
          fetchActiveSiteMessages();
        }, 1000);
        
        setShowMessageModal(false);
        setMessageForm({ message: '', message_type: 'info', expires_at: '' });
      } else {
        // Get error details
        const errorData = await response.text();
        console.error('❌ Error creating message:', response.status, errorData);
        alert(`Error creating message: ${response.status} - ${errorData}`);
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

              {/* Top 100 Players Section */}
              <div className="top-players-section">
                <div className="top-players-header">
                  <h4>🏆 Top 100 Players by Score</h4>
                  <div className="top-players-controls">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setShowTop100(!showTop100);
                        if (!showTop100 && top100Users.length === 0) {
                          fetchTop100Users();
                        }
                      }}
                    >
                      {showTop100 ? '👁️ Hide Top 100' : '👁️ Show Top 100'}
                    </button>
                    {showTop100 && (
                      <button 
                        className="btn btn-primary btn-small"
                        onClick={fetchTop100Users}
                      >
                        🔄 Refresh
                      </button>
                    )}
                  </div>
                </div>

                {showTop100 && (
                  <div className="top-players-grid">
                    {/* Split into groups of 10 */}
                    {Array.from({ length: 10 }, (_, groupIndex) => {
                      const startIndex = groupIndex * 10;
                      const endIndex = startIndex + 10;
                      const groupUsers = top100Users.slice(startIndex, endIndex);
                      
                      if (groupUsers.length === 0) return null;
                      
                      return (
                        <div key={groupIndex} className="top-players-group">
                          <h5>
                            Positions {startIndex + 1}-{Math.min(endIndex, top100Users.length)}
                          </h5>
                          <div className="players-list">
                            {groupUsers.map((player, index) => (
                              <div key={player.username} className="top-player-item">
                                <span className="player-rank">#{startIndex + index + 1}</span>
                                <span className="player-flag">{countryFlags[player.country] || '🏳️'}</span>
                                <span className="player-name">{player.full_name}</span>
                                <span className="player-score">{Math.round(player.score || 0)} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

      {/* Search Section */}
      <div className="rankings-search-section">
        <h3>🔍 Search Player Position</h3>
        <div className="search-container">
          <input
            type="text"
            placeholder="Enter name or username to find their ranking position..."
            value={rankingSearch}
            onChange={(e) => handleRankingSearch(e.target.value)}
            className="ranking-search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        {rankingSearchResult && (
          <div className={`search-result ${rankingSearchResult.found ? 'found' : 'not-found'}`}>
            {rankingSearchResult.found ? (
              <div className="found-user">
                <span className="result-icon">✅</span>
                <span className="result-text">{rankingSearchResult.message}</span>
              </div>
            ) : (
              <div className="not-found-user">
                <span className="result-icon">❌</span>
                <span className="result-text">{rankingSearchResult.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top 100 Players Section - Moved to top */}
      <div className="top-players-section-rankings">
        <div className="top-players-header">
          <h3>🏆 Complete Top 100 Players by Score</h3>
          <div className="top-players-controls">
            <button 
              className="btn btn-secondary btn-small"
              onClick={() => {
                setShowTop100Rankings(!showTop100Rankings);
                if (!showTop100Rankings && top100Users.length === 0) {
                  fetchTop100Users();
                }
              }}
            >
              {showTop100Rankings ? '👁️ Hide Top 100' : '👁️ Show Complete Top 100'}
            </button>
            {showTop100Rankings && (
              <button 
                className="btn btn-primary btn-small"
                onClick={fetchTop100Users}
              >
                🔄 Refresh
              </button>
            )}
          </div>
        </div>

        {showTop100Rankings && (
          <div className="top-players-grid">
            {/* Split into groups of 10 */}
            {Array.from({ length: 10 }, (_, groupIndex) => {
              const startIndex = groupIndex * 10;
              const endIndex = startIndex + 10;
              const groupUsers = top100Users.slice(startIndex, endIndex);
              
              if (groupUsers.length === 0) return null;
              
              return (
                <div key={groupIndex} className="top-players-group">
                  <h4>
                    Positions {startIndex + 1}-{Math.min(endIndex, top100Users.length)}
                  </h4>
                  <div className="players-list">
                    {groupUsers.map((player, index) => (
                      <div key={player.username} className="top-player-item">
                        <span className="player-rank">#{startIndex + index + 1}</span>
                        <span className="player-flag">{countryFlags[player.country] || '🏳️'}</span>
                        <span className="player-name">{player.full_name}</span>
                        <span className="player-username">@{player.username}</span>
                        <span className="player-score">{Math.round(player.score || 0)} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

  // Site Messages Banner Component
  const SiteMessagesBanner = () => {
    console.log('🎬 SiteMessagesBanner rendered, activeSiteMessages:', activeSiteMessages);
    console.log('🎬 Banner update trigger:', bannerUpdateTrigger);
    
    if (!activeSiteMessages || activeSiteMessages.length === 0) {
      console.log('⚠️ No active site messages to display');
      return (
        <div className="site-messages-banner" style={{backgroundColor: 'rgba(255, 0, 0, 0.1)', textAlign: 'center', padding: '10px'}}>
          <span style={{color: 'white', fontSize: '0.9rem'}}>
            No active messages • 
            <button 
              onClick={() => {
                console.log('🔄 Manual refresh clicked');
                fetchActiveSiteMessages();
              }}
              style={{background: 'none', border: '1px solid #ffd700', color: '#ffd700', padding: '4px 8px', marginLeft: '10px', borderRadius: '4px', cursor: 'pointer'}}
            >
              Refresh Messages
            </button>
          </span>
        </div>
      );
    }

    console.log('✅ Displaying', activeSiteMessages.length, 'messages in banner');

    return (
      <div className="site-messages-banner">
        <div className="banner-content">
          {activeSiteMessages.map((message, index) => (
            <div key={message.id} className={`banner-message ${message.message_type}`}>
              <span className="banner-icon">
                {message.message_type === 'announcement' && '📢'}
                {message.message_type === 'warning' && '⚠️'}
                {message.message_type === 'info' && 'ℹ️'}
              </span>
              <span className="banner-text">{message.message}</span>
              {index < activeSiteMessages.length - 1 && <span className="banner-separator">•••</span>}
            </div>
          ))}
        </div>
        <button 
          onClick={() => {
            console.log('🔄 Manual refresh clicked from banner');
            fetchActiveSiteMessages();
          }}
          style={{
            position: 'absolute', 
            right: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            background: 'rgba(255, 215, 0, 0.2)', 
            border: '1px solid #ffd700', 
            color: '#ffd700', 
            padding: '4px 8px', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '0.7rem'
          }}
          title="Refresh messages"
        >
          🔄
        </button>
      </div>
    );
  };

  // Admin Panel Render Function
  const renderAdminPanel = () => {
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
              className={`admin-tab ${adminView === 'users' ? 'active' : ''}`}
              onClick={() => setAdminView('users')}
            >
              👥 {t.userManagement}
            </button>
            
            <button 
              className={`admin-tab ${adminView === 'messages' ? 'active' : ''}`}
              onClick={() => setAdminView('messages')}
            >
              📢 {t.siteMessages}
            </button>
            
            <button 
              className={`admin-tab ${adminView === 'competitions' ? 'active' : ''}`}
              onClick={() => setAdminView('competitions')}
            >
              🏆 {t.competitions}
            </button>
            
            {isGod && (
              <button 
                className={`admin-tab ${adminView === 'actions' ? 'active' : ''}`}
                onClick={() => setAdminView('actions')}
              >
                📋 {t.adminActions}
              </button>
            )}
            
            <button 
              className={`admin-tab ${adminView === 'analytics' ? 'active' : ''}`}
              onClick={() => setAdminView('analytics')}
            >
              📊 {t.analytics}
            </button>
            
            <button 
              className={`admin-tab ${adminView === 'content' ? 'active' : ''}`}
              onClick={() => setAdminView('content')}
            >
              📝 {t.contentManagement}
            </button>
          </div>
        </div>

        <div className="admin-content">
          {adminLoading && <div className="loading">Loading admin data...</div>}
          
          {/* Analytics Tab */}
          {adminView === 'analytics' && (
            <div className="admin-section">
              <h3>📊 {t.analytics}</h3>
              
              <div className="analytics-dashboard">
                {/* Overview Cards */}
                <div className="analytics-overview">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h4>👥 Total Users</h4>
                      <div className="stat-number">{analyticsData.overview?.total_users || 0}</div>
                    </div>
                    <div className="stat-card">
                      <h4>✅ Active Users</h4>
                      <div className="stat-number">{analyticsData.overview?.active_users || 0}</div>
                    </div>
                    <div className="stat-card">
                      <h4>🚫 Blocked Users</h4>
                      <div className="stat-number">{analyticsData.overview?.blocked_users || 0}</div>
                    </div>
                    <div className="stat-card">
                      <h4>🏆 Competitions</h4>
                      <div className="stat-number">{analyticsData.overview?.total_competitions || 0}</div>
                    </div>
                  </div>
                </div>

                {/* User Countries Distribution */}
                <div className="analytics-section">
                  <h4>🌍 Users by Country</h4>
                  <div className="country-stats">
                    {analyticsData.user_countries?.slice(0, 10).map((country, index) => (
                      <div key={country._id} className="country-stat">
                        <span className="country-flag">{countryFlags[country._id] || '🏳️'}</span>
                        <span className="country-name">{country._id}</span>
                        <span className="country-count">{country.count} users</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Users */}
                <div className="analytics-section">
                  <h4>🏅 Top Users by Points</h4>
                  <div className="top-users-list">
                    {userAnalytics.top_users?.slice(0, 5).map((user, index) => (
                      <div key={user.username} className="top-user-item">
                        <span className="user-rank">#{index + 1}</span>
                        <span className="user-name">{user.full_name}</span>
                        <span className="user-country">{countryFlags[user.country] || '🏳️'}</span>
                        <span className="user-points">{user.score ? Math.round(user.score) : 0} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="analytics-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      fetchAnalyticsOverview();
                      fetchUserAnalytics();
                      fetchCompetitionAnalytics();
                    }}
                  >
                    🔄 Refresh Analytics
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content Management Tab */}
          {adminView === 'content' && (
            <div className="admin-section">
              <h3>📝 {t.contentManagement}</h3>
              
              <div className="content-management">
                <div className="content-tabs">
                  <div className="tab-section">
                    <h4>📄 Page Content Management</h4>
                    <div className="content-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          fetchContentPages();
                        }}
                      >
                        🔄 Refresh Content
                      </button>
                    </div>

                    <div className="content-pages-list">
                      {contentPages.map(page => (
                        <div key={page.id} className="content-page-item">
                          <div className="page-header">
                            <h5>{page.title}</h5>
                            <span className="page-type">{page.page_type}</span>
                          </div>
                          <div className="page-preview">
                            {page.content.substring(0, 150)}...
                          </div>
                          <div className="page-actions">
                            <button 
                              className="btn btn-small btn-secondary"
                              onClick={() => {
                                setSelectedPage(page);
                                setShowContentModal(true);
                              }}
                            >
                              ✏️ Edit Content
                            </button>
                            <small className="page-updated">
                              Last updated: {new Date(page.last_updated).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="tab-section">
                    <h4>🧭 Menu Management</h4>
                    <div className="content-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={fetchMenuItems}
                      >
                        🔄 Refresh Menu
                      </button>
                    </div>

                    <div className="menu-items-list">
                      {menuItems.map(item => (
                        <div key={item.id} className="menu-item-card">
                          <div className="menu-item-header">
                            <span className="menu-icon">{item.icon}</span>
                            <span className="menu-label">{item.label}</span>
                            <span className="menu-order">Order: {item.order}</span>
                          </div>
                          <div className="menu-item-details">
                            <span className="menu-url">{item.url}</span>
                            <span className={`menu-status ${item.is_active ? 'active' : 'inactive'}`}>
                              {item.is_active ? '✅ Active' : '❌ Inactive'}
                            </span>
                          </div>
                          <button 
                            className="btn btn-small btn-secondary"
                            onClick={() => {
                              setSelectedMenuItem(item);
                              setShowMenuModal(true);
                            }}
                          >
                            ✏️ Edit Menu Item
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content Edit Modal */}
                {showContentModal && selectedPage && (
                  <div className="modal-overlay">
                    <div className="modal modal-large">
                      <div className="modal-header">
                        <h3>Edit Content: {selectedPage.title}</h3>
                        <button 
                          className="modal-close"
                          onClick={() => setShowContentModal(false)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="modal-content">
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          updateContentPage(selectedPage.id, {
                            title: formData.get('title'),
                            content: formData.get('content'),
                            meta_title: formData.get('meta_title'),
                            meta_description: formData.get('meta_description'),
                            is_active: formData.get('is_active') === 'on'
                          });
                        }}>
                          <div className="form-group">
                            <label>Page Title:</label>
                            <input 
                              type="text" 
                              name="title" 
                              defaultValue={selectedPage.title}
                              className="form-input"
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Meta Title (SEO):</label>
                            <input 
                              type="text" 
                              name="meta_title" 
                              defaultValue={selectedPage.meta_title || ''}
                              className="form-input"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Meta Description (SEO):</label>
                            <input 
                              type="text" 
                              name="meta_description" 
                              defaultValue={selectedPage.meta_description || ''}
                              className="form-input"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Content:</label>
                            <textarea 
                              name="content" 
                              defaultValue={selectedPage.content}
                              className="form-textarea"
                              rows="10"
                              required
                            />
                          </div>
                          
                          <div className="form-group checkbox-group">
                            <label>
                              <input 
                                type="checkbox" 
                                name="is_active" 
                                defaultChecked={selectedPage.is_active}
                              />
                              Page is Active
                            </label>
                          </div>
                          
                          <div className="modal-actions">
                            <button type="submit" className="btn btn-primary">
                              💾 Save Changes
                            </button>
                            <button 
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setShowContentModal(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* Menu Edit Modal */}
                {showMenuModal && selectedMenuItem && (
                  <div className="modal-overlay">
                    <div className="modal">
                      <div className="modal-header">
                        <h3>Edit Menu Item: {selectedMenuItem.label}</h3>
                        <button 
                          className="modal-close"
                          onClick={() => setShowMenuModal(false)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="modal-content">
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          updateMenuItem(selectedMenuItem.id, {
                            label: formData.get('label'),
                            url: formData.get('url'),
                            order: parseInt(formData.get('order')),
                            icon: formData.get('icon'),
                            is_active: formData.get('is_active') === 'on'
                          });
                        }}>
                          <div className="form-group">
                            <label>Label:</label>
                            <input 
                              type="text" 
                              name="label" 
                              defaultValue={selectedMenuItem.label}
                              className="form-input"
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>URL:</label>
                            <input 
                              type="text" 
                              name="url" 
                              defaultValue={selectedMenuItem.url}
                              className="form-input"
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Icon (Emoji):</label>
                            <input 
                              type="text" 
                              name="icon" 
                              defaultValue={selectedMenuItem.icon || ''}
                              className="form-input"
                              placeholder="🏠"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Order:</label>
                            <input 
                              type="number" 
                              name="order" 
                              defaultValue={selectedMenuItem.order}
                              className="form-input"
                              required
                            />
                          </div>
                          
                          <div className="form-group checkbox-group">
                            <label>
                              <input 
                                type="checkbox" 
                                name="is_active" 
                                defaultChecked={selectedMenuItem.is_active}
                              />
                              Menu Item is Active
                            </label>
                          </div>
                          
                          <div className="modal-actions">
                            <button type="submit" className="btn btn-primary">
                              💾 Save Changes
                            </button>
                            <button 
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setShowMenuModal(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Management Tab */}
          {adminView === 'users' && (
            <div className="admin-section">
              <h3>👥 {t.userManagement}</h3>
              
              {/* Search Bar */}
              <div className="admin-controls">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="🔍 Search by name, username, or email..."
                    value={userSearchTerm}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="admin-search-input"
                  />
                  <span className="search-results-count">
                    {filteredUsers.length} of {allUsers.length} users
                  </span>
                </div>
              </div>

              <div className="admin-users-grid">
                {filteredUsers.map(userItem => (
                  <div key={userItem.id} className="admin-user-card">
                    <div className="user-info">
                      <Avatar src={userItem.avatar_url} name={userItem.full_name} size="medium" />
                      <div className="user-details">
                        <h4>{userItem.full_name}</h4>
                        <p>@{userItem.username}</p>
                        <p>{userItem.email}</p>
                        <span className={`role-badge role-${userItem.admin_role}`}>
                          {userItem.admin_role === 'god' && '👑'}
                          {userItem.admin_role === 'super_admin' && '⭐'}
                          {userItem.admin_role === 'admin' && '🛡️'}
                          {userItem.admin_role === 'user' && '👤'}
                          {userItem.admin_role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="user-stats">
                      <div className="stat-item">
                        <strong>Bets:</strong> {userItem.total_bets}
                      </div>
                      <div className="stat-item">
                        <strong>Current Score:</strong> {Math.round(userItem.score)}
                      </div>
                      <div className="stat-item">
                        <strong>Win Rate:</strong> {userItem.total_bets > 0 ? Math.round((userItem.won_bets / userItem.total_bets) * 100) : 0}%
                      </div>
                      <div className="stat-item">
                        <strong>Status:</strong>
                        <span className={`status-badge ${userItem.is_blocked ? 'blocked' : 'active'}`}>
                          {userItem.is_blocked ? '🚫 Blocked' : '✅ Active'}
                        </span>
                      </div>
                      {userItem.is_blocked && userItem.blocked_reason && (
                        <div className="stat-item">
                          <strong>Block Reason:</strong> 
                          <span className="block-reason">{userItem.blocked_reason}</span>
                        </div>
                      )}
                    </div>

                    <div className="admin-actions">
                      {userItem.is_blocked ? (
                        <button 
                          className="btn btn-success"
                          onClick={() => unblockUser(userItem.id)}
                          title="Unblock this user"
                        >
                          ✅ Unblock User
                        </button>
                      ) : (
                        <button 
                          className="btn btn-warning"
                          onClick={() => {
                            const reason = prompt(`Block user "${userItem.full_name}"?\n\nEnter reason for blocking:`);
                            if (reason && reason.trim()) {
                              const durationStr = prompt('Block duration:\n• Leave empty for PERMANENT block\n• Enter hours for temporary block (e.g., 24)');
                              const duration = durationStr && !isNaN(durationStr) ? parseInt(durationStr) : null;
                              const blockType = duration ? 'temporary' : 'permanent';
                              
                              if (confirm(`Confirm ${blockType} block for "${userItem.full_name}"?\nReason: ${reason}${duration ? `\nDuration: ${duration} hours` : ''}`)) {
                                blockUser(userItem.id, blockType, duration, reason);
                              }
                            }
                          }}
                          title="Block this user"
                        >
                          🚫 Block User
                        </button>
                      )}
                      
                      {isGod && (
                        <button 
                          className="btn btn-secondary"
                          onClick={() => {
                            const currentPoints = Math.round(userItem.score);
                            const pointsStr = prompt(`Current Score: ${currentPoints} points\n\nAdjust points for "${userItem.full_name}":\n• Enter positive number to ADD points\n• Enter negative number to REMOVE points\n• Example: +50 or -25`);
                            
                            if (pointsStr && !isNaN(pointsStr)) {
                              const pointsChange = parseInt(pointsStr);
                              const newTotal = currentPoints + pointsChange;
                              const reason = prompt(`Points Change: ${pointsChange > 0 ? '+' : ''}${pointsChange}\nCurrent: ${currentPoints} → New: ${newTotal}\n\nEnter reason for this adjustment:`);
                              
                              if (reason && reason.trim()) {
                                if (confirm(`Confirm points adjustment for "${userItem.full_name}":\n\nChange: ${pointsChange > 0 ? '+' : ''}${pointsChange} points\nCurrent: ${currentPoints} → New: ${newTotal}\nReason: ${reason}`)) {
                                  adjustPoints(userItem.id, pointsChange, reason);
                                }
                              }
                            }
                          }}
                          title="Adjust user points"
                        >
                          ⚡ Adjust Points
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredUsers.length === 0 && userSearchTerm && (
                <div className="no-results">
                  <p>No users found matching "{userSearchTerm}"</p>
                  <button 
                    onClick={() => handleUserSearch('')}
                    className="btn btn-secondary"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {/* Top 100 Players Section in Admin Panel */}
              <div className="top-players-section admin-top-players">
                <div className="top-players-header">
                  <h4>🏆 Top 100 Players by Score</h4>
                  <div className="top-players-controls">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setShowTop100(!showTop100);
                        if (!showTop100 && top100Users.length === 0) {
                          fetchTop100Users();
                        }
                      }}
                    >
                      {showTop100 ? '👁️ Hide Top 100' : '👁️ Show Top 100'}
                    </button>
                    {showTop100 && (
                      <button 
                        className="btn btn-primary btn-small"
                        onClick={fetchTop100Users}
                      >
                        🔄 Refresh
                      </button>
                    )}
                  </div>
                </div>

                {showTop100 && (
                  <div className="top-players-grid">
                    {/* Split into groups of 10 */}
                    {Array.from({ length: 10 }, (_, groupIndex) => {
                      const startIndex = groupIndex * 10;
                      const endIndex = startIndex + 10;
                      const groupUsers = top100Users.slice(startIndex, endIndex);
                      
                      if (groupUsers.length === 0) return null;
                      
                      return (
                        <div key={groupIndex} className="top-players-group">
                          <h5>
                            Positions {startIndex + 1}-{Math.min(endIndex, top100Users.length)}
                          </h5>
                          <div className="players-list">
                            {groupUsers.map((player, index) => (
                              <div key={player.username} className="top-player-item">
                                <span className="player-rank">#{startIndex + index + 1}</span>
                                <span className="player-flag">{countryFlags[player.country] || '🏳️'}</span>
                                <span className="player-name">{player.full_name}</span>
                                <span className="player-username">@{player.username}</span>
                                <span className="player-score">{Math.round(player.score || 0)} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Site Messages Tab */}
          {adminView === 'messages' && (
            <div className="admin-section">
              <h3>📢 {t.siteMessages}</h3>
              
              <div className="admin-controls">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowMessageModal(true)}
                >
                  ➕ Create New Message
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
                    {msg.expires_at && (
                      <div className="message-expires">
                        Expires: {new Date(msg.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message Creation Modal */}
              {showMessageModal && (
                <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>📢 Create Site Message</h3>
                      <button 
                        className="modal-close"
                        onClick={() => setShowMessageModal(false)}
                      >
                        ✕
                      </button>
                    </div>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      createSiteMessage(messageForm);
                    }}>
                      <div className="form-group">
                        <label>Message Type</label>
                        <select
                          value={messageForm.message_type}
                          onChange={(e) => setMessageForm({...messageForm, message_type: e.target.value})}
                          className="form-control"
                        >
                          <option value="info">ℹ️ Information</option>
                          <option value="announcement">📢 Announcement</option>
                          <option value="warning">⚠️ Warning</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Message Content *</label>
                        <textarea
                          value={messageForm.message}
                          onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                          placeholder="Enter your message that will appear in the scrolling banner..."
                          className="form-control"
                          rows="4"
                          required
                        />
                        <small className="form-hint">
                          This message will appear in the scrolling banner visible to all users
                        </small>
                      </div>

                      <div className="form-group">
                        <label>Expiration Date (Optional)</label>
                        <input
                          type="datetime-local"
                          value={messageForm.expires_at}
                          onChange={(e) => setMessageForm({...messageForm, expires_at: e.target.value})}
                          className="form-control"
                        />
                        <small className="form-hint">
                          Leave empty for permanent message. Set date/time for automatic removal.
                        </small>
                      </div>

                      <div className="modal-actions">
                        <button 
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setShowMessageModal(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="btn btn-primary"
                          disabled={!messageForm.message.trim()}
                        >
                          Create Message
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Competitions Tab */}
          {adminView === 'competitions' && (
            <div className="admin-section">
              <h3>🏆 {t.competitions}</h3>
              
              <div className="admin-controls">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const name = prompt('Competition name:');
                    const description = prompt('Description:');
                    const region = prompt('Region (Global/Europe/Americas/Asia/Africa):') || 'Global';
                    const maxParticipants = prompt('Max participants:') || '100';
                    const prizePool = prompt('Prize pool (€):') || '1000';
                    
                    if (name && description) {
                      const startDate = new Date();
                      startDate.setDate(startDate.getDate() + 7); // Start in 7 days
                      const endDate = new Date();
                      endDate.setDate(endDate.getDate() + 37); // End in 37 days
                      
                      createCompetition({
                        name,
                        description,
                        region,
                        start_date: startDate.toISOString(),
                        end_date: endDate.toISOString(),
                        max_participants: parseInt(maxParticipants),
                        prize_pool: parseFloat(prizePool),
                        status: 'upcoming'
                      });
                    }
                  }}
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

          {/* Admin Actions Tab (God only) */}
          {adminView === 'actions' && isGod && (
            <div className="admin-section">
              <h3>📋 {t.adminActions}</h3>
              <div className="admin-actions-list">
                {adminActions.map(action => (
                  <div key={action.id} className="action-item">
                    <div className="action-header">
                      <span className="action-date">{new Date(action.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="action-description">
                      {formatAdminAction(action)}
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
              
              {/* Admin Panel - only for admin users */}
              {isAdmin && (
                <button 
                  className={`nav-link admin-nav ${currentView === 'admin' ? 'active' : ''}`}
                  onClick={() => setCurrentView('admin')}
                >
                  ⚙️ {t.adminPanel}
                </button>
              )}
              
              <button 
                className="nav-link"
                onClick={openSettings}
              >
                ⚙️ Settings
              </button>
              
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

      {/* Site Messages Banner - positioned below navbar */}
      <SiteMessagesBanner />

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ User Settings</h3>
              <button 
                className="modal-close"
                onClick={() => setShowSettings(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content settings-modal">
              <div className="settings-tabs">
                <div className="settings-tab active">
                  <h4>👤 Profile Information</h4>
                  <form onSubmit={updateProfile}>
                    <div className="form-group">
                      <label>Full Name:</label>
                      <input
                        type="text"
                        value={settingsForm.full_name}
                        onChange={(e) => setSettingsForm({...settingsForm, full_name: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Email:</label>
                      <input
                        type="email"
                        value={settingsForm.email}
                        onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Country:</label>
                      <select
                        value={settingsForm.country}
                        onChange={(e) => setSettingsForm({...settingsForm, country: e.target.value})}
                        className="form-input"
                        required
                      >
                        <option value="">Select Country</option>
                        {Object.entries(t.countries).map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Phone:</label>
                      <input
                        type="tel"
                        value={settingsForm.phone}
                        onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})}
                        className="form-input"
                        placeholder="+30 123 456 7890"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Avatar URL:</label>
                      <input
                        type="url"
                        value={settingsForm.avatar_url}
                        onChange={(e) => setSettingsForm({...settingsForm, avatar_url: e.target.value})}
                        className="form-input"
                        placeholder="https://example.com/your-photo.jpg"
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={settingsLoading}
                    >
                      {settingsLoading ? 'Updating...' : '💾 Update Profile'}
                    </button>
                  </form>
                </div>
                
                <div className="settings-tab">
                  <h4>🔒 Change Password</h4>
                  <form onSubmit={changePassword}>
                    <div className="form-group">
                      <label>Current Password:</label>
                      <input
                        type="password"
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>New Password:</label>
                      <input
                        type="password"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                        className="form-input"
                        minLength="6"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Confirm New Password:</label>
                      <input
                        type="password"
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                        className="form-input"
                        minLength="6"
                        required
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={settingsLoading}
                    >
                      {settingsLoading ? 'Changing...' : '🔑 Change Password'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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