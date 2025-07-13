import React, { useState, useEffect } from 'react';
import './App.css';
import DownloadBackup from './DownloadBackup';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://67792974-48a1-4e2d-b2d0-93fe13b22f8f.preview.emergentagent.com';

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
    adminLevel: 'Admin',
    
    // Tournament System
    tournament: 'Tournament',
    teams: 'Teams',
    tournaments: 'Tournaments',
    tournamentTitle: 'Διαθέσιμα Tournaments',
    joinTournament: 'Συμμετοχή',
    leaveTournament: 'Αποχώρηση',
    entryFee: 'Κόστος Εισόδου',
    prizePool: 'Έπαθλα',
    participants: 'Συμμετέχοντες',
    tournamentStatus: 'Κατάσταση',
    tournamentDuration: 'Διάρκεια',
    tournamentFormat: 'Τύπος',
    registrationPeriod: 'Περίοδος Εγγραφής',
    tournamentPeriod: 'Περίοδος Tournament',
    prizeDistribution: 'Κατανομή Επάθλων',
    rules: 'Κανόνες',
    
    // Tournament Status
    upcoming: 'Σύντομα',
    open: 'Ανοιχτό',
    ongoing: 'Σε Εξέλιξη',
    completed: 'Ολοκληρωμένο',
    cancelled: 'Ακυρωμένο',
    
    // Tournament Duration
    instant: 'Άμεσο',
    daily: 'Ημερήσιο',
    two_day: '2 Ημέρες',
    weekly: 'Εβδομαδιαίο',
    monthly: 'Μηνιαίο',
    long_term: 'Μακροπρόθεσμο',
    
    // Tournament Format
    single_elimination: 'Single Elimination',
    
    // Prize Distribution
    winner_takes_all: 'Όλα στον Νικητή',
    top_three: 'Top 3',
    
    // Entry Fee Categories
    free: 'Δωρεάν',
    basic: 'Βασικό (€1-10)',
    standard: 'Κανονικό (€11-50)',
    premium: 'Premium (€51-100)',
    vip: 'VIP (€101+)',
    
    // Tournament Actions
    viewDetails: 'Λεπτομέρειες',
    backToTournaments: 'Πίσω στα Tournaments',
    joinNow: 'Συμμετοχή Τώρα',
    paymentRequired: 'Απαιτείται Πληρωμή',
    tournamentFull: 'Γεμάτο',
    registrationClosed: 'Κλειστές Εγγραφές',
    alreadyJoined: 'Έχετε Συμμετάσχει',
    
    // Filters
    allTournaments: 'Όλα τα Tournaments',
    filterByStatus: 'Φιλτράρισμα κατά Κατάσταση',
    filterByCategory: 'Φιλτράρισμα κατά Κατηγορία',
    filterByDuration: 'Φιλτράρισμα κατά Διάρκεια',
    
    // Affiliate System
    affiliate: 'Affiliate',
    affiliateProgram: 'Πρόγραμμα Συνεργατών',
    affiliateDashboard: 'Affiliate Dashboard',
    becomeAffiliate: 'Γίνε Συνεργάτης',
    applyForAffiliate: 'Αίτηση για Συνεργάτη',
    referralCode: 'Κωδικός Παραπομπής',
    referralLink: 'Σύνδεσμος Παραπομπής',
    copyLink: 'Αντιγραφή Συνδέσμου',
    totalReferrals: 'Συνολικές Παραπομπές',
    activeReferrals: 'Ενεργές Παραπομπές',
    totalEarnings: 'Συνολικά Κέρδη',
    pendingEarnings: 'Κέρδη σε Αναμονή',
    paidEarnings: 'Πληρωμένα Κέρδη',
    thisMonthReferrals: 'Παραπομπές Μήνα',
    thisMonthEarnings: 'Κέρδη Μήνα',
    commissions: 'Προμήθειες',
    referrals: 'Παραπομπές',
    payouts: 'Πληρωμές',
    requestPayout: 'Αίτηση Πληρωμής',
    minimumPayout: 'Ελάχιστη πληρωμή €50',
    commissionHistory: 'Ιστορικό Προμηθειών',
    registrationBonus: 'Μπόνους Εγγραφής',
    tournamentCommission: 'Προμήθεια Tournament',
    depositCommission: 'Προμήθεια Κατάθεσης',
    affiliateStatus: 'Κατάσταση Συνεργάτη',
    active: 'Ενεργός',
    pending: 'Σε Αναμονή',
    suspended: 'Σε Αναστολή',
    recentActivity: 'Πρόσφατη Δραστηριότητα',
    noCommissions: 'Δεν υπάρχουν προμήθειες ακόμα',
    noReferrals: 'Δεν υπάρχουν παραπομπές ακόμα',
    shareYourLink: 'Μοιραστείτε τον σύνδεσμό σας για να κερδίσετε!',
    inviteFriends: 'Προσκαλέστε φίλους',
    
    // Wallet System
    wallet: 'Πορτοφόλι',
    walletDashboard: 'Dashboard Πορτοφολιού',
    balance: 'Υπόλοιπο',
    totalEarned: 'Συνολικά Κερδισμένα',
    availableBalance: 'Διαθέσιμο Υπόλοιπο',
    pendingBalance: 'Υπόλοιπο σε Αναμονή',
    withdrawnBalance: 'Αναληφθέν Υπόλοιπο',
    transactionHistory: 'Ιστορικό Συναλλαγών',
    monthlyEarnings: 'Μηνιαία Κέρδη',
    performanceMetrics: 'Μετρήσεις Απόδοσης',
    walletSettings: 'Ρυθμίσεις Πορτοφολιού',
    autoPayoutEnabled: 'Αυτόματη Πληρωμή Ενεργή',
    autoPayoutThreshold: 'Όριο Αυτόματης Πληρωμής',
    preferredPayoutMethod: 'Προτιμώμενη Μέθοδος Πληρωμής',
    lifetimeWithdrawals: 'Συνολικές Αναλήψεις',
    lastPayout: 'Τελευταία Πληρωμή',
    nextAutoPayout: 'Επόμενη Αυτόματη Πληρωμή',
    averageCommission: 'Μέση Προμήθεια',
    totalCommissions: 'Συνολικές Προμήθειες',
    conversionRate: 'Ποσοστό Μετατροπής',
    efficiencyScore: 'Βαθμός Αποδοτικότητας',
    
    // Admin Financial
    financialOverview: 'Οικονομική Επισκόπηση',
    totalAffiliates: 'Συνολικοί Συνεργάτες',
    activeAffiliates: 'Ενεργοί Συνεργάτες',
    totalPendingPayouts: 'Συνολικές Εκκρεμείς Πληρωμές',
    totalCommissionsOwed: 'Συνολικές Οφειλόμενες Προμήθειες',
    monthlyCommissionCosts: 'Μηνιαίο Κόστος Προμηθειών',
    platformRevenue: 'Έσοδα Πλατφόρμας',
    affiliateConversionRate: 'Ποσοστό Μετατροπής Συνεργατών',
    topAffiliates: 'Κορυφαίοι Συνεργάτες',
    financialSummary: 'Οικονομική Σύνοψη',
    totalPlatformCosts: 'Συνολικό Κόστος Πλατφόρμας',
    estimatedMonthlyRevenue: 'Εκτιμώμενα Μηνιαία Έσοδα',
    profitMargin: 'Περιθώριο Κέρδους',
    costPerAcquisition: 'Κόστος ανά Απόκτηση',
    roiPercentage: 'Ποσοστό ROI',
    manualAdjustment: 'Χειροκίνητη Προσαρμογή',
    adjustAmount: 'Ποσό Προσαρμογής',
    adjustmentReason: 'Λόγος Προσαρμογής',
    adminNotes: 'Σημειώσεις Διαχειριστή',
    processAdjustment: 'Επεξεργασία Προσαρμογής',
    bulkPayout: 'Μαζική Πληρωμή',
    selectPayouts: 'Επιλογή Πληρωμών',
    processBulkPayout: 'Επεξεργασία Μαζικής Πληρωμής'
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
    adminLevel: 'Admin',
    
    // Tournament System
    tournament: 'Tournament',
    teams: 'Teams',
    tournaments: 'Tournaments',
    tournamentTitle: 'Available Tournaments',
    joinTournament: 'Join Tournament',
    leaveTournament: 'Leave Tournament',
    entryFee: 'Entry Fee',
    prizePool: 'Prize Pool',
    participants: 'Participants',
    tournamentStatus: 'Status',
    tournamentDuration: 'Duration',
    tournamentFormat: 'Format',
    registrationPeriod: 'Registration Period',
    tournamentPeriod: 'Tournament Period',
    prizeDistribution: 'Prize Distribution',
    rules: 'Rules',
    
    // Tournament Status
    upcoming: 'Upcoming',
    open: 'Open',
    ongoing: 'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    
    // Tournament Duration
    instant: 'Instant',
    daily: 'Daily',
    two_day: '2-Day',
    weekly: 'Weekly',
    monthly: 'Monthly',
    long_term: 'Long Term',
    
    // Tournament Format
    single_elimination: 'Single Elimination',
    
    // Prize Distribution
    winner_takes_all: 'Winner Takes All',
    top_three: 'Top 3',
    
    // Entry Fee Categories
    free: 'Free',
    basic: 'Basic (€1-10)',
    standard: 'Standard (€11-50)',
    premium: 'Premium (€51-100)',
    vip: 'VIP (€101+)',
    
    // Tournament Actions
    viewDetails: 'View Details',
    backToTournaments: 'Back to Tournaments',
    joinNow: 'Join Now',
    paymentRequired: 'Payment Required',
    tournamentFull: 'Tournament Full',
    registrationClosed: 'Registration Closed',
    alreadyJoined: 'Already Joined',
    
    // Filters
    allTournaments: 'All Tournaments',
    filterByStatus: 'Filter by Status',
    filterByCategory: 'Filter by Category',
    filterByDuration: 'Filter by Duration',
    
    // Affiliate System
    affiliate: 'Affiliate',
    affiliateProgram: 'Affiliate Program',
    affiliateDashboard: 'Affiliate Dashboard',
    becomeAffiliate: 'Become Affiliate',
    applyForAffiliate: 'Apply for Affiliate',
    referralCode: 'Referral Code',
    referralLink: 'Referral Link',
    copyLink: 'Copy Link',
    totalReferrals: 'Total Referrals',
    activeReferrals: 'Active Referrals',
    totalEarnings: 'Total Earnings',
    pendingEarnings: 'Pending Earnings',
    paidEarnings: 'Paid Earnings',
    thisMonthReferrals: 'This Month Referrals',
    thisMonthEarnings: 'This Month Earnings',
    commissions: 'Commissions',
    referrals: 'Referrals',
    payouts: 'Payouts',
    requestPayout: 'Request Payout',
    minimumPayout: 'Minimum payout €50',
    commissionHistory: 'Commission History',
    registrationBonus: 'Registration Bonus',
    tournamentCommission: 'Tournament Commission',
    depositCommission: 'Deposit Commission',
    affiliateStatus: 'Affiliate Status',
    active: 'Active',
    pending: 'Pending',
    suspended: 'Suspended',
    recentActivity: 'Recent Activity',
    noCommissions: 'No commissions yet',
    noReferrals: 'No referrals yet',
    shareYourLink: 'Share your link to start earning!',
    inviteFriends: 'Invite Friends',
    
    // Wallet System
    wallet: 'Wallet',
    walletDashboard: 'Wallet Dashboard',
    balance: 'Balance',
    totalEarned: 'Total Earned',
    availableBalance: 'Available Balance',
    pendingBalance: 'Pending Balance',
    withdrawnBalance: 'Withdrawn Balance',
    transactionHistory: 'Transaction History',
    monthlyEarnings: 'Monthly Earnings',
    performanceMetrics: 'Performance Metrics',
    walletSettings: 'Wallet Settings',
    autoPayoutEnabled: 'Auto Payout Enabled',
    autoPayoutThreshold: 'Auto Payout Threshold',
    preferredPayoutMethod: 'Preferred Payout Method',
    lifetimeWithdrawals: 'Lifetime Withdrawals',
    lastPayout: 'Last Payout',
    nextAutoPayout: 'Next Auto Payout',
    averageCommission: 'Average Commission',
    totalCommissions: 'Total Commissions',
    conversionRate: 'Conversion Rate',
    efficiencyScore: 'Efficiency Score',
    
    // Admin Financial
    financialOverview: 'Financial Overview',
    totalAffiliates: 'Total Affiliates',
    activeAffiliates: 'Active Affiliates',
    totalPendingPayouts: 'Total Pending Payouts',
    totalCommissionsOwed: 'Total Commissions Owed',
    monthlyCommissionCosts: 'Monthly Commission Costs',
    platformRevenue: 'Platform Revenue',
    affiliateConversionRate: 'Affiliate Conversion Rate',
    topAffiliates: 'Top Affiliates',
    financialSummary: 'Financial Summary',
    totalPlatformCosts: 'Total Platform Costs',
    estimatedMonthlyRevenue: 'Estimated Monthly Revenue',
    profitMargin: 'Profit Margin',
    costPerAcquisition: 'Cost per Acquisition',
    roiPercentage: 'ROI Percentage',
    manualAdjustment: 'Manual Adjustment',
    adjustAmount: 'Adjust Amount',
    adjustmentReason: 'Adjustment Reason',
    adminNotes: 'Admin Notes',
    processAdjustment: 'Process Adjustment',
    bulkPayout: 'Bulk Payout',
    selectPayouts: 'Select Payouts',
    processBulkPayout: 'Process Bulk Payout'
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
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWalletSettingsModal, setShowWalletSettingsModal] = useState(false);
  
  // Team System States
  const [teams, setTeams] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [teamInvitations, setTeamInvitations] = useState([]);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showTeamInviteModal, setShowTeamInviteModal] = useState(false);
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState(null);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    logo_url: '',
    colors: { primary: '#FF0000', secondary: '#FFFFFF' },
    city: '',
    country: '',
    phone: '',
    email: ''
  });
  const [inviteUsername, setInviteUsername] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  
  // Toast Notifications System
  const [toasts, setToasts] = useState([]);
  const [toastId, setToastId] = useState(0);

  // Add toast notification
  const showToast = (message, type = 'info', duration = 4000) => {
    const id = toastId + 1;
    setToastId(id);
    
    const newToast = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      timestamp: Date.now()
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  // Remove toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Rankings search states
  const [rankingSearch, setRankingSearch] = useState('');
  const [rankingSearchResult, setRankingSearchResult] = useState(null);
  const [showTop100Rankings, setShowTop100Rankings] = useState(false);
  const [rankingsFilter, setRankingsFilter] = useState('all'); // 'all', 'country', specific country code
  const [myPosition, setMyPosition] = useState(null);
  const [top100Loading, setTop100Loading] = useState(false);

  // Enhanced Dashboard states
  const [dashboardStats, setDashboardStats] = useState(null);
  const [userAchievements, setUserAchievements] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  // World Map states
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [mapView, setMapView] = useState('countries');
  const [countryRankings, setCountryRankings] = useState([]);
  
  // Site Messages
  const [activeSiteMessages, setActiveSiteMessages] = useState([]);
  const [bannerUpdateTrigger, setBannerUpdateTrigger] = useState(0);

  // Tournament states
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentView, setTournamentView] = useState('list'); // 'list', 'details'
  const [tournamentFilters, setTournamentFilters] = useState({
    status: '',
    category: '',
    duration: ''
  });
  const [tournamentLoading, setTournamentLoading] = useState(false);
  const [userTournaments, setUserTournaments] = useState([]);

  // Tournament Bracket states
  const [tournamentBracket, setTournamentBracket] = useState(null);
  const [tournamentMatches, setTournamentMatches] = useState([]);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [showBracket, setShowBracket] = useState(false);

  // Settings states
  const [settingsForm, setSettingsForm] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
    country: '',
    phone: '',
    nickname: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Mobile swipe states
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

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
  
  // Tournament Admin States
  const [adminTournaments, setAdminTournaments] = useState([]);
  const [tournamentSearch, setTournamentSearch] = useState('');
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    description: '',
    duration_type: 'daily',
    tournament_format: 'single_elimination',
    entry_fee: 10,
    max_participants: 16,
    prize_distribution: 'winner_takes_all',
    registration_start: '',
    registration_end: '',
    tournament_start: '',
    tournament_end: '',
    rules: '',
    region: 'Global'
  });
  
  // Affiliate System States
  const [affiliateData, setAffiliateData] = useState(null);
  const [affiliateStats, setAffiliateStats] = useState(null);
  const [affiliateCommissions, setAffiliateCommissions] = useState([]);
  const [affiliateReferrals, setAffiliateReferrals] = useState([]);
  const [affiliateView, setAffiliateView] = useState('dashboard'); // dashboard, commissions, referrals, payouts
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    payment_details: {},
    notes: ''
  });
  
  // Wallet System States
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletStats, setWalletStats] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletView, setWalletView] = useState('dashboard'); // dashboard, transactions, settings
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletSettings, setWalletSettings] = useState({
    auto_payout_enabled: false,
    auto_payout_threshold: 100.0,
    preferred_payout_method: 'bank_transfer'
  });
  
  // Admin Financial States
  const [financialOverview, setFinancialOverview] = useState(null);
  const [adminWallets, setAdminWallets] = useState([]);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [showManualAdjustmentModal, setShowManualAdjustmentModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [manualAdjustmentForm, setManualAdjustmentForm] = useState({
    user_id: '',
    amount: '',
    reason: '',
    admin_notes: ''
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
    setTop100Loading(true);
    try {
      // Try with token first (for admin users)
      let response = await fetch(`${API_BASE_URL}/api/admin/users/top100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // If admin endpoint fails, try to get from rankings (fallback)
      if (!response.ok) {
        console.log('Admin endpoint failed, using rankings fallback...');
        response = await fetch(`${API_BASE_URL}/api/rankings?limit=100`);
        if (response.ok) {
          const data = await response.json();
          // Take first 100 from rankings and format them
          const top100 = data.rankings.slice(0, 100).map(user => ({
            full_name: user.full_name,
            username: user.username,
            score: user.score,
            country: user.country,
            avatar_url: user.avatar_url
          }));
          setTop100Users(top100);
        }
      } else {
        const data = await response.json();
        setTop100Users(data.top_users);
      }
    } catch (error) {
      console.error('Error fetching top 100 users:', error);
      // Last fallback: use current rankings
      if (rankings.length > 0) {
        const top100 = rankings.slice(0, 100).map(user => ({
          full_name: user.full_name,
          username: user.username,
          score: user.score,
          country: user.country,
          avatar_url: user.avatar_url
        }));
        setTop100Users(top100);
      }
    }
    setTop100Loading(false);
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

  // Filter rankings based on selected filter
  const getFilteredRankings = () => {
    if (rankingsFilter === 'all') return rankings;
    if (rankingsFilter === 'country' && user) return rankings.filter(player => player.country === user.country);
    if (rankingsFilter !== 'all' && rankingsFilter !== 'country') return rankings.filter(player => player.country === rankingsFilter);
    return rankings;
  };

  // Get available countries from rankings
  const getAvailableCountries = () => {
    const countries = [...new Set(rankings.map(player => player.country))].sort();
    return countries;
  };

  // Enhanced Dashboard functions
  const fetchDashboardStats = async () => {
    if (!user) return;
    
    setDashboardLoading(true);
    try {
      // Calculate user stats
      const userRanking = rankings.find(player => player.id === user.id);
      const winRate = user.total_bets > 0 ? (user.won_bets / user.total_bets) * 100 : 0;
      const profitLoss = (user.total_winnings || 0) - (user.total_amount || 0);
      const avgBetAmount = user.total_bets > 0 ? (user.total_amount || 0) / user.total_bets : 0;
      
      setDashboardStats({
        rank: userRanking?.rank || 'Unranked',
        score: Math.round(user.score || 0),
        totalBets: user.total_bets || 0,
        wonBets: user.won_bets || 0,
        lostBets: user.lost_bets || 0,
        winRate: Math.round(winRate),
        totalAmount: user.total_amount || 0,
        totalWinnings: user.total_winnings || 0,
        profitLoss: Math.round(profitLoss),
        avgBetAmount: Math.round(avgBetAmount),
        avgOdds: user.avg_odds || 0,
        country: user.country,
        joinedDate: user.created_at
      });

      // Generate achievements based on user stats
      generateAchievements(user, userRanking);
      
      // Generate recent activity (mock data for now)
      generateRecentActivity(user);
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
    setDashboardLoading(false);
  };

  const generateAchievements = (userData, ranking) => {
    const achievements = [];
    
    // Win Rate Achievements
    const winRate = userData.total_bets > 0 ? (userData.won_bets / userData.total_bets) * 100 : 0;
    if (winRate >= 70) achievements.push({ icon: '🎯', title: 'Sharpshooter', description: '70%+ Win Rate', tier: 'gold' });
    else if (winRate >= 60) achievements.push({ icon: '🎯', title: 'Good Eye', description: '60%+ Win Rate', tier: 'silver' });
    else if (winRate >= 50) achievements.push({ icon: '🎯', title: 'Balanced', description: '50%+ Win Rate', tier: 'bronze' });

    // Betting Volume Achievements  
    if (userData.total_bets >= 100) achievements.push({ icon: '🔥', title: 'High Roller', description: '100+ Bets Placed', tier: 'gold' });
    else if (userData.total_bets >= 50) achievements.push({ icon: '🔥', title: 'Active Bettor', description: '50+ Bets Placed', tier: 'silver' });
    else if (userData.total_bets >= 10) achievements.push({ icon: '🔥', title: 'Getting Started', description: '10+ Bets Placed', tier: 'bronze' });

    // Ranking Achievements
    if (ranking?.rank <= 10) achievements.push({ icon: '👑', title: 'Elite Player', description: 'Top 10 Global', tier: 'gold' });
    else if (ranking?.rank <= 50) achievements.push({ icon: '🏆', title: 'Top Performer', description: 'Top 50 Global', tier: 'silver' });
    else if (ranking?.rank <= 100) achievements.push({ icon: '🥉', title: 'Top 100', description: 'Top 100 Global', tier: 'bronze' });

    // Profit Achievements
    const profit = (userData.total_winnings || 0) - (userData.total_amount || 0);
    if (profit > 1000) achievements.push({ icon: '💰', title: 'Profit Master', description: '€1000+ Profit', tier: 'gold' });
    else if (profit > 100) achievements.push({ icon: '💰', title: 'In the Green', description: '€100+ Profit', tier: 'silver' });
    else if (profit > 0) achievements.push({ icon: '💰', title: 'First Profit', description: 'Positive P&L', tier: 'bronze' });

    // Special Achievements
    if (userData.avg_odds >= 3.0) achievements.push({ icon: '🎰', title: 'Risk Taker', description: '3.0+ Avg Odds', tier: 'special' });
    if (userData.total_bets >= 5 && winRate === 100) achievements.push({ icon: '🌟', title: 'Perfect Record', description: 'Undefeated!', tier: 'legendary' });

    setUserAchievements(achievements);
  };

  const generateRecentActivity = (userData) => {
    const activities = [
      { 
        type: 'rank_change', 
        message: `Your ranking updated to #${dashboardStats?.rank || 'N/A'}`, 
        time: '2 hours ago',
        icon: '📈'
      },
      { 
        type: 'achievement', 
        message: 'New achievement unlocked!', 
        time: '1 day ago',
        icon: '🏆'
      },
      { 
        type: 'bet_win', 
        message: 'Won a bet with 2.5x odds', 
        time: '2 days ago',
        icon: '🎯'
      },
      { 
        type: 'profile', 
        message: 'Profile updated successfully', 
        time: '3 days ago',
        icon: '👤'
      },
      { 
        type: 'milestone', 
        message: `Reached ${userData.total_bets} total bets!`, 
        time: '5 days ago',
        icon: '🎯'
      }
    ];
    
    setRecentActivity(activities);
  };

  // Settings functions
  const openSettings = () => {
    if (user) {
      setSettingsForm({
        full_name: user.full_name || '',
        email: user.email || '',
        avatar_url: user.avatar_url || '',
        country: user.country || '',
        phone: user.phone || '',
        nickname: user.nickname || ''
      });
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setShowSettings(true);
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Photo size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result;
        setPhotoFile(file);
        setPhotoPreview(base64Data);
        setSettingsForm({...settingsForm, avatar_url: base64Data});
      };
      reader.readAsDataURL(file);
    }
  };

  // Mobile swipe navigation
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe || isRightSwipe) {
      handleSwipeNavigation(isLeftSwipe);
    }
  };

  const handleSwipeNavigation = (isLeftSwipe) => {
    const views = ['home', 'dashboard', 'rankings', 'worldmap'];
    const currentIndex = views.indexOf(currentView);
    
    if (isLeftSwipe && currentIndex < views.length - 1) {
      setCurrentView(views[currentIndex + 1]);
    } else if (!isLeftSwipe && currentIndex > 0) {
      setCurrentView(views[currentIndex - 1]);
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

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    setShowLanguageDropdown(false);
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

  // Enhanced dashboard effect
  useEffect(() => {
    if (user && rankings.length > 0) {
      fetchDashboardStats();
    }
  }, [user, rankings]);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLanguageDropdown && !event.target.closest('.language-dropdown')) {
        setShowLanguageDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLanguageDropdown]);
  
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
      const response = await fetch(`${API_BASE_URL}/api/rankings`);
      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings);
        
        // Find current user's position if logged in
        if (user && data.rankings) {
          const userPosition = data.rankings.find(player => player.id === user.id);
          setMyPosition(userPosition);
        }
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

  // =============================================================================
  // TOURNAMENT ADMIN FUNCTIONS
  // =============================================================================
  
  const fetchAdminTournaments = async () => {
    if (!token || !isAdmin) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tournaments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminTournaments(data.tournaments);
      } else {
        console.error('Failed to fetch admin tournaments:', response.status);
      }
    } catch (error) {
      console.error('Error fetching admin tournaments:', error);
    }
  };

  const createTournament = async (tournamentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tournaments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tournamentData)
      });
      
      if (response.ok) {
        alert('Tournament created successfully!');
        fetchAdminTournaments(); // Refresh tournaments list
        setShowTournamentModal(false);
        // Reset form
        setTournamentForm({
          name: '',
          description: '',
          duration_type: 'daily',
          tournament_format: 'single_elimination',
          entry_fee: 10,
          max_participants: 16,
          prize_distribution: 'winner_takes_all',
          registration_start: '',
          registration_end: '',
          tournament_start: '',
          tournament_end: '',
          rules: '',
          region: 'Global'
        });
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to create tournament');
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Error creating tournament');
    }
  };

  const cancelTournament = async (tournamentId) => {
    if (!confirm('Are you sure you want to cancel this tournament?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Tournament cancelled successfully!');
        fetchAdminTournaments(); // Refresh tournaments list
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to cancel tournament');
      }
    } catch (error) {
      console.error('Error cancelling tournament:', error);
      alert('Error cancelling tournament');
    }
  };

  // Load admin tournaments when switching to tournaments or competitions tab
  useEffect(() => {
    if ((adminView === 'tournaments' || adminView === 'competitions') && token && isAdmin) {
      fetchAdminTournaments();
    }
  }, [adminView, token, isAdmin]);

  // =============================================================================
  // TOURNAMENT FUNCTIONS
  // =============================================================================
  
  // Fetch all tournaments
  const fetchTournaments = async (filters = {}) => {
    setTournamentLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.duration) queryParams.append('duration', filters.duration);
      if (user) queryParams.append('user_id', user.id);
      
      const response = await fetch(`${API_BASE_URL}/api/tournaments?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments);
      } else {
        console.error('Failed to fetch tournaments:', response.status);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
    setTournamentLoading(false);
  };

  // Get tournament details
  const fetchTournamentDetails = async (tournamentId) => {
    setTournamentLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (user) queryParams.append('user_id', user.id);
      
      const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}?${queryParams}`);
      if (response.ok) {
        const tournament = await response.json();
        setSelectedTournament(tournament);
        setTournamentView('details');
        
        // Also fetch bracket if available
        fetchTournamentBracket(tournamentId);
      } else {
        console.error('Failed to fetch tournament details:', response.status);
      }
    } catch (error) {
      console.error('Error fetching tournament details:', error);
    }
    setTournamentLoading(false);
  };

  // Join tournament
  const joinTournament = async (tournamentId) => {
    if (!token) {
      alert(t.loginRequired || 'Please login to join tournaments');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert(t.joinSuccessful || 'Successfully joined tournament!');
        // Refresh tournament details
        if (selectedTournament && selectedTournament.id === tournamentId) {
          fetchTournamentDetails(tournamentId);
        }
        // Refresh tournaments list
        fetchTournaments(tournamentFilters);
        // Refresh user tournaments for dashboard
        fetchUserTournaments();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to join tournament');
      }
    } catch (error) {
      console.error('Error joining tournament:', error);
      alert('Error joining tournament');
    }
  };

  // Leave tournament
  const leaveTournament = async (tournamentId) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/leave`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert(t.leaveSuccessful || 'Successfully left tournament!');
        // Refresh tournament details
        if (selectedTournament && selectedTournament.id === tournamentId) {
          fetchTournamentDetails(tournamentId);
        }
        // Refresh tournaments list
        fetchTournaments(tournamentFilters);
        // Refresh user tournaments for dashboard
        fetchUserTournaments();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to leave tournament');
      }
    } catch (error) {
      console.error('Error leaving tournament:', error);
      alert('Error leaving tournament');
    }
  };

  // Fetch user tournaments
  const fetchUserTournaments = async () => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tournaments/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Error fetching user tournaments:', error);
    }
  };

  // Load tournaments when component mounts or when view changes to tournament
  useEffect(() => {
    if (currentView === 'tournament') {
      fetchTournaments(tournamentFilters);
    }
  }, [currentView]);

  // Load user tournaments when user logs in
  useEffect(() => {
    if (user && token) {
      fetchUserTournaments();
    }
  }, [user, token]);

  // =============================================================================
  // TOURNAMENT BRACKET FUNCTIONS
  // =============================================================================
  
  const fetchTournamentBracket = async (tournamentId) => {
    setBracketLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/bracket`);
      if (response.ok) {
        const data = await response.json();
        setTournamentBracket(data.bracket);
        setTournamentMatches(data.matches);
      } else {
        console.error('Failed to fetch tournament bracket:', response.status);
      }
    } catch (error) {
      console.error('Error fetching tournament bracket:', error);
    }
    setBracketLoading(false);
  };

  const generateTournamentBracket = async (tournamentId) => {
    if (!token || !isAdmin) {
      alert('Admin access required');
      return;
    }
    
    setBracketLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/generate-bracket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('Bracket generated successfully!');
        fetchTournamentBracket(tournamentId);
        // Refresh tournament details
        fetchTournamentDetails(tournamentId);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to generate bracket');
      }
    } catch (error) {
      console.error('Error generating bracket:', error);
      alert('Error generating bracket');
    }
    setBracketLoading(false);
  };

  const setMatchWinner = async (matchId, winnerId) => {
    if (!token || !isAdmin) {
      alert('Admin access required');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tournaments/matches/${matchId}/winner`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ winner_id: winnerId })
      });
      
      if (response.ok) {
        alert('Match winner set successfully!');
        // Refresh bracket
        if (selectedTournament) {
          fetchTournamentBracket(selectedTournament.id);
        }
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to set match winner');
      }
    } catch (error) {
      console.error('Error setting match winner:', error);
      alert('Error setting match winner');
    }
  };

  // =============================================================================
  // TEAM SYSTEM FUNCTIONS
  // =============================================================================

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`);
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchTeamInvitations = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/my-invitations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeamInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching team invitations:', error);
    }
  };

  const createTeam = async () => {
    console.log('🏆 CREATE TEAM CALLED');
    console.log('📝 Form data:', teamFormData);
    
    if (!teamFormData.name || !teamFormData.city || !teamFormData.country || !teamFormData.email) {
      alert('Please fill in all required fields');
      return;
    }
    
    setTeamLoading(true);
    try {
      console.log('📡 Making request to:', `${API_BASE_URL}/api/teams`);
      console.log('🔑 Token available:', !!token);
      console.log('📦 Payload:', JSON.stringify(teamFormData, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teamFormData)
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success data:', data);
        alert(`Team "${data.team_name}" created successfully!`);
        setShowCreateTeamModal(false);
        setTeamFormData({
          name: '',
          logo_url: '',
          colors: { primary: '#FF0000', secondary: '#FFFFFF' },
          city: '',
          country: '',
          phone: '',
          email: ''
        });
        fetchTeams(); // Refresh teams list
        fetchProfile(); // Update user profile with new team
      } else {
        const errorText = await response.text();
        console.log('❌ Error response text:', errorText);
        
        try {
          const error = JSON.parse(errorText);
          console.log('❌ Error object:', error);
          alert(`Error: ${error.detail || 'Failed to create team'}`);
        } catch (e) {
          console.log('❌ Could not parse error as JSON');
          alert(`Error: ${errorText || 'Failed to create team'}`);
        }
      }
    } catch (error) {
      console.error('💥 Network/other error:', error);
      alert(`Network error: ${error.message}`);
    } finally {
      setTeamLoading(false);
    }
  };

  const invitePlayerToTeam = async (teamId) => {
    if (!inviteUsername.trim()) {
      alert('Please enter a username');
      return;
    }
    
    setTeamLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: inviteUsername })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setShowTeamInviteModal(false);
        setInviteUsername('');
        setSelectedTeamForInvite(null);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation');
    } finally {
      setTeamLoading(false);
    }
  };

  const acceptTeamInvitation = async (invitationId) => {
    setTeamLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchTeamInvitations(); // Refresh invitations
        fetchProfile(); // Update user profile
        fetchTeams(); // Refresh teams
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation');
    } finally {
      setTeamLoading(false);
    }
  };

  const declineTeamInvitation = async (invitationId) => {
    setTeamLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/invitations/${invitationId}/decline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Invitation declined');
        fetchTeamInvitations(); // Refresh invitations
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation');
    } finally {
      setTeamLoading(false);
    }
  };

  // Load teams and invitations when user logs in
  useEffect(() => {
    if (token) {
      fetchTeams();
      fetchTeamInvitations();
    }
  }, [token]);

  // =============================================================================
  // AFFILIATE SYSTEM FUNCTIONS
  // =============================================================================
  
  // Check if user is an affiliate
  const checkAffiliateStatus = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/affiliate/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAffiliateData(data);
        setIsAffiliate(true);
        fetchAffiliateStats();
      } else {
        setIsAffiliate(false);
        setAffiliateData(null);
      }
    } catch (error) {
      console.error('Error checking affiliate status:', error);
      setIsAffiliate(false);
    }
  };

  // Fetch affiliate statistics
  const fetchAffiliateStats = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/affiliate/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAffiliateStats(data);
      }
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
    }
  };

  // Fetch affiliate commissions
  const fetchAffiliateCommissions = async () => {
    if (!token) return;
    
    setAffiliateLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/affiliate/commissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAffiliateCommissions(data.commissions);
      }
    } catch (error) {
      console.error('Error fetching affiliate commissions:', error);
    }
    setAffiliateLoading(false);
  };

  // Fetch affiliate referrals
  const fetchAffiliateReferrals = async () => {
    if (!token) return;
    
    setAffiliateLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/affiliate/referrals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAffiliateReferrals(data.referrals);
      }
    } catch (error) {
      console.error('Error fetching affiliate referrals:', error);
    }
    setAffiliateLoading(false);
  };

  // Apply for affiliate program
  const applyForAffiliate = async () => {
    if (!token) {
      alert('Please login first');
      return;
    }
    
    setAffiliateLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/affiliate/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          motivation: 'I want to promote WoBeRa to my network'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Affiliate application approved! Your referral code is: ${data.referral_code}`);
        checkAffiliateStatus(); // Refresh affiliate status
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to apply for affiliate program');
      }
    } catch (error) {
      console.error('Error applying for affiliate:', error);
      alert('Error applying for affiliate program');
    }
    setAffiliateLoading(false);
  };

  // Copy referral link to clipboard
  const copyReferralLink = async () => {
    if (affiliateData && affiliateData.referral_link) {
      try {
        await navigator.clipboard.writeText(affiliateData.referral_link);
        alert('Referral link copied to clipboard!');
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = affiliateData.referral_link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Referral link copied to clipboard!');
      }
    }
  };

  // Request payout
  const requestPayout = async () => {
    if (!token || !affiliateStats) return;
    
    const amount = parseFloat(payoutForm.amount);
    if (amount < 50) {
      alert('Minimum payout amount is €50');
      return;
    }
    
    if (amount > affiliateStats.pending_earnings) {
      alert('Insufficient pending earnings');
      return;
    }
    
    setAffiliateLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/affiliate/payout/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          affiliate_user_id: user.id,
          amount: amount,
          payment_method: payoutForm.payment_method,
          payment_details: payoutForm.payment_details,
          notes: payoutForm.notes
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Payout request submitted successfully! Amount: €${data.amount}`);
        setShowPayoutModal(false);
        setPayoutForm({
          amount: '',
          payment_method: 'bank_transfer',
          payment_details: {},
          notes: ''
        });
        fetchAffiliateStats(); // Refresh stats
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to request payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('Error requesting payout');
    }
    setAffiliateLoading(false);
  };

  // Load affiliate data when user logs in
  useEffect(() => {
    if (user && token) {
      checkAffiliateStatus();
    }
  }, [user, token]);

  // Fetch affiliate data when view changes
  useEffect(() => {
    if (currentView === 'affiliate' && isAffiliate) {
      if (affiliateView === 'commissions') {
        fetchAffiliateCommissions();
      } else if (affiliateView === 'referrals') {
        fetchAffiliateReferrals();
      }
    }
  }, [currentView, affiliateView, isAffiliate]);

  // =============================================================================
  // WALLET SYSTEM FUNCTIONS
  // =============================================================================
  
  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data);
        setWalletSettings({
          auto_payout_enabled: data.auto_payout_enabled,
          auto_payout_threshold: data.auto_payout_threshold,
          preferred_payout_method: data.preferred_payout_method
        });
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  // Fetch wallet statistics
  const fetchWalletStats = async () => {
    if (!token) return;
    
    setWalletLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/wallet/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletStats(data);
        setWalletBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
    }
    setWalletLoading(false);
  };

  // Fetch wallet transactions
  const fetchWalletTransactions = async () => {
    if (!token) return;
    
    setWalletLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/wallet/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
    }
    setWalletLoading(false);
  };

  // Update wallet settings
  const updateWalletSettings = async () => {
    if (!token) return;
    
    setWalletLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/wallet/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(walletSettings)
      });
      
      if (response.ok) {
        alert('Wallet settings updated successfully!');
        setShowWalletSettingsModal(false);
        fetchWalletBalance(); // Refresh balance to get updated settings
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to update wallet settings');
      }
    } catch (error) {
      console.error('Error updating wallet settings:', error);
      alert('Error updating wallet settings');
    }
    setWalletLoading(false);
  };

  // =============================================================================
  // ADMIN FINANCIAL FUNCTIONS
  // =============================================================================
  
  // Fetch financial overview
  const fetchFinancialOverview = async () => {
    if (!token) return;
    
    setFinancialLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/financial/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFinancialOverview(data);
      }
    } catch (error) {
      console.error('Error fetching financial overview:', error);
    }
    setFinancialLoading(false);
  };

  // Fetch admin wallets
  const fetchAdminWallets = async () => {
    if (!token) return;
    
    setFinancialLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/financial/wallets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminWallets(data.wallets);
      }
    } catch (error) {
      console.error('Error fetching admin wallets:', error);
    }
    setFinancialLoading(false);
  };

  // Fetch admin transactions
  const fetchAdminTransactions = async () => {
    if (!token) return;
    
    setFinancialLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/financial/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching admin transactions:', error);
    }
    setFinancialLoading(false);
  };

  // Process manual adjustment
  const processManualAdjustment = async () => {
    if (!token) return;
    
    const amount = parseFloat(manualAdjustmentForm.amount);
    if (isNaN(amount) || !manualAdjustmentForm.user_id || !manualAdjustmentForm.reason) {
      alert('Please fill in all required fields with valid values');
      return;
    }
    
    setFinancialLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/financial/manual-adjustment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: manualAdjustmentForm.user_id,
          amount: amount,
          reason: manualAdjustmentForm.reason,
          admin_notes: manualAdjustmentForm.admin_notes
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Enhanced success message with user details
        const successMsg = data.username ? 
          `✅ Manual adjustment processed successfully!\n\n🆔 User: ${data.username} (${data.full_name})\n💰 Amount: €${data.amount}\n📝 Reason: ${data.reason}` :
          `✅ Manual adjustment processed successfully!\n\n💰 Amount: €${data.amount}\n📝 Reason: ${data.reason}`;
        
        alert(successMsg);
        setShowManualAdjustmentModal(false);
        setManualAdjustmentForm({
          user_id: '',
          amount: '',
          reason: '',
          admin_notes: ''
        });
        fetchAdminWallets(); // Refresh data
        fetchAdminTransactions();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to process manual adjustment');
      }
    } catch (error) {
      console.error('Error processing manual adjustment:', error);
      alert('Error processing manual adjustment');
    }
    setFinancialLoading(false);
  };

  // Load wallet data when user logs in
  useEffect(() => {
    if (user && token) {
      fetchWalletBalance();
    }
  }, [user, token]);

  // Fetch wallet data when view changes
  useEffect(() => {
    if (currentView === 'wallet' && user && token) {
      if (walletView === 'dashboard') {
        fetchWalletStats();
      } else if (walletView === 'transactions') {
        fetchWalletTransactions();
      }
    }
  }, [currentView, walletView, user, token]);

  // Fetch admin financial data when view changes
  useEffect(() => {
    if (currentView === 'admin' && adminView === 'financial' && isAdmin && token) {
      fetchFinancialOverview();
      fetchAdminWallets();
      fetchAdminTransactions();
    }
  }, [currentView, adminView, isAdmin, token]);

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
          <div className="federation-motto">
            <span className="motto-text">"Are You Ready to Prove ?"</span>
          </div>
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

  const renderDashboard = () => {
    if (!user) {
      return (
        <div className="login-prompt">
          <h2>Welcome to WoBeRa</h2>
          <p>Please login to view your dashboard</p>
          <button 
            className="btn btn-primary"
            onClick={() => setCurrentView('login')}
          >
            Login
          </button>
        </div>
      );
    }

    return (
      <div className="enhanced-dashboard">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h2>Welcome back, {user.full_name}! 👋</h2>
            <p className="welcome-subtitle">Here's your betting performance overview</p>
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn primary" onClick={() => setCurrentView('rankings')}>
              <span className="action-icon">🏆</span>
              <span className="action-text">View Rankings</span>
            </button>
            <button className="quick-action-btn secondary" onClick={() => setCurrentView('worldmap')}>
              <span className="action-icon">🌍</span>
              <span className="action-text">World Map</span>
            </button>
            <button className="quick-action-btn tertiary" onClick={openSettings}>
              <span className="action-icon">⚙️</span>
              <span className="action-text">Settings</span>
            </button>
          </div>
        </div>

        {dashboardLoading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner">⏳</div>
            <p>Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* Live Stats Cards */}
            <div className="stats-cards-grid">
              <div className="stat-card rank-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-info">
                  <div className="stat-label">Global Rank</div>
                  <div className="stat-value">#{dashboardStats?.rank || 'N/A'}</div>
                  <div className="stat-change positive">+2 this week</div>
                </div>
              </div>

              <div className="stat-card score-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <div className="stat-label">Total Score</div>
                  <div className="stat-value">{dashboardStats?.score || 0}</div>
                  <div className="stat-change positive">+{Math.round((dashboardStats?.score || 0) * 0.1)} this month</div>
                </div>
              </div>

              <div className="stat-card winrate-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <div className="stat-label">Win Rate</div>
                  <div className="stat-value">{dashboardStats?.winRate || 0}%</div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${dashboardStats?.winRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="stat-card profit-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <div className="stat-label">Profit/Loss</div>
                  <div className={`stat-value ${(dashboardStats?.profitLoss || 0) >= 0 ? 'positive' : 'negative'}`}>
                    €{dashboardStats?.profitLoss || 0}
                  </div>
                  <div className="stat-change">{(dashboardStats?.profitLoss || 0) >= 0 ? '📈 Profitable' : '📉 In Loss'}</div>
                </div>
              </div>
            </div>

            {/* Progress Bars Section */}
            <div className="progress-section">
              <h3>📊 Performance Metrics</h3>
              <div className="progress-items">
                <div className="progress-item">
                  <div className="progress-header">
                    <span className="progress-label">Betting Activity</span>
                    <span className="progress-value">{dashboardStats?.totalBets || 0}/100 bets</span>
                  </div>
                  <div className="progress-bar-large">
                    <div 
                      className="progress-fill activity" 
                      style={{ width: `${Math.min((dashboardStats?.totalBets || 0), 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-header">
                    <span className="progress-label">Win Consistency</span>
                    <span className="progress-value">{dashboardStats?.winRate || 0}%</span>
                  </div>
                  <div className="progress-bar-large">
                    <div 
                      className="progress-fill winrate" 
                      style={{ width: `${dashboardStats?.winRate || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-header">
                    <span className="progress-label">Risk Level (Avg Odds)</span>
                    <span className="progress-value">{dashboardStats?.avgOdds || 0}x</span>
                  </div>
                  <div className="progress-bar-large">
                    <div 
                      className="progress-fill risk" 
                      style={{ width: `${Math.min((dashboardStats?.avgOdds || 0) * 25, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements Section */}
            <div className="achievements-section">
              <h3>🏆 Your Achievements</h3>
              <div className="achievements-grid">
                {userAchievements.length > 0 ? userAchievements.map((achievement, index) => (
                  <div key={index} className={`achievement-badge ${achievement.tier}`}>
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-info">
                      <div className="achievement-title">{achievement.title}</div>
                      <div className="achievement-description">{achievement.description}</div>
                    </div>
                  </div>
                )) : (
                  <div className="no-achievements">
                    <p>🏆 Start betting to unlock achievements!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="activity-section">
              <h3>📝 Recent Activity</h3>
              <div className="activity-timeline">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <div className="activity-message">{activity.message}</div>
                      <div className="activity-time">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Tournaments Section */}
            <div className="user-tournaments-section">
              <h3>🏆 My Tournaments</h3>
              {userTournaments.length === 0 ? (
                <div className="no-tournaments-dash">
                  <p>You haven't joined any tournaments yet.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setCurrentView('tournament')}
                  >
                    Browse Tournaments
                  </button>
                </div>
              ) : (
                <div className="user-tournaments-grid">
                  {userTournaments.slice(0, 3).map((tournament) => (
                    <div key={tournament.id} className="user-tournament-card">
                      <div className="tournament-card-header">
                        <h4>{tournament.name}</h4>
                        <span className={`tournament-status status-${tournament.status}`}>
                          {t[tournament.status] || tournament.status}
                        </span>
                      </div>
                      <div className="tournament-card-info">
                        <div className="tournament-info-item">
                          <span>Entry Fee:</span>
                          <span>€{tournament.entry_fee}</span>
                        </div>
                        <div className="tournament-info-item">
                          <span>Participants:</span>
                          <span>{tournament.current_participants}/{tournament.max_participants}</span>
                        </div>
                        <div className="tournament-info-item">
                          <span>Prize Pool:</span>
                          <span>€{tournament.total_prize_pool}</span>
                        </div>
                        {tournament.participation && (
                          <div className="participation-status">
                            <span className="status-badge">✅ Joined</span>
                            <span className="joined-date">
                              {new Date(tournament.participation.registered_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="tournament-quick-actions">
                        <button 
                          className="btn btn-secondary btn-small"
                          onClick={() => {
                            setCurrentView('tournament');
                            fetchTournamentDetails(tournament.id);
                          }}
                        >
                          📝 View Details
                        </button>
                        
                        {/* Bracket button if tournament has started or has bracket */}
                        {(tournament.status === 'ongoing' || tournament.status === 'completed') && (
                          <button 
                            className="btn btn-outline btn-small"
                            onClick={() => {
                              setCurrentView('tournament');
                              fetchTournamentDetails(tournament.id);
                              // Auto-show bracket after details load
                              setTimeout(() => setShowBracket(true), 500);
                            }}
                          >
                            🏆 View Bracket
                          </button>
                        )}
                        
                        {/* Quick action based on tournament status */}
                        {tournament.status === 'open' && !tournament.user_registered && (
                          <button 
                            className="btn btn-primary btn-small"
                            onClick={() => joinTournament(tournament.id)}
                          >
                            🚀 Join Now
                          </button>
                        )}
                        
                        {tournament.user_registered && tournament.status === 'open' && (
                          <button 
                            className="btn btn-warning btn-small"
                            onClick={() => leaveTournament(tournament.id)}
                          >
                            ❌ Leave
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {userTournaments.length > 3 && (
                <div className="view-all-tournaments">
                  <button 
                    className="btn btn-outline"
                    onClick={() => setCurrentView('tournament')}
                  >
                    View All My Tournaments ({userTournaments.length})
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderRankings = () => {
    console.log('🏆 Rendering rankings, players count:', rankings.length);
    const filteredRankings = getFilteredRankings();
    const availableCountries = getAvailableCountries();
    
    return (
    <div className="rankings-container">
      <div className="rankings-header">
        <h2>{t.globalRankingsTitle}</h2>
        <div className="user-profile-section">
          <div className="user-avatar-large">
            {user && user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name || user.username} 
                className="user-profile-image"
              />
            ) : (
              <div className="no-avatar-large">
                <span className="avatar-placeholder">👤</span>
              </div>
            )}
          </div>
          <div className="user-nickname">
            {user ? (user.nickname || user.full_name || user.username) : 'Guest'}
          </div>
        </div>
      </div>

      {/* My Position Quick View */}
      {user && myPosition && (
        <div className="my-position-card">
          <div className="my-position-header">
            <h3>👤 My Current Position</h3>
            <div className="position-badge">
              #{myPosition.rank}
            </div>
          </div>
          <div className="my-position-details">
            <div className="position-stat">
              <span className="stat-label">Score:</span>
              <span className="stat-value">{Math.round(myPosition.score)} pts</span>
            </div>
            <div className="position-stat">
              <span className="stat-label">Win Rate:</span>
              <span className="stat-value">
                {myPosition.total_bets > 0 ? Math.round((myPosition.won_bets / myPosition.total_bets) * 100) : 0}%
              </span>
            </div>
            <div className="position-stat">
              <span className="stat-label">Total Bets:</span>
              <span className="stat-value">{myPosition.total_bets}</span>
            </div>
          </div>
        </div>
      )}

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

      {/* Filters Section */}
      <div className="rankings-filters">
        <h4>🌍 Filter Rankings</h4>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${rankingsFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRankingsFilter('all')}
          >
            🌐 Global ({rankings.length})
          </button>
          {user && (
            <button 
              className={`filter-btn ${rankingsFilter === 'country' ? 'active' : ''}`}
              onClick={() => setRankingsFilter('country')}
            >
              {countryFlags[user.country] || '🏳️'} My Country ({rankings.filter(p => p.country === user.country).length})
            </button>
          )}
          <select 
            className="country-filter-select"
            value={rankingsFilter}
            onChange={(e) => setRankingsFilter(e.target.value)}
          >
            <option value="all">Select Country Filter</option>
            {availableCountries.map(countryCode => (
              <option key={countryCode} value={countryCode}>
                {countryFlags[countryCode] || '🏳️'} {t.countries[countryCode] || countryCode} ({rankings.filter(p => p.country === countryCode).length})
              </option>
            ))}
          </select>
        </div>
        <div className="filter-info">
          Showing {filteredRankings.length} of {rankings.length} players
        </div>
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
                if (!showTop100Rankings) {
                  fetchTop100Users();
                }
              }}
              disabled={top100Loading}
            >
              {top100Loading ? '⏳ Loading...' : showTop100Rankings ? '👁️ Hide Top 100' : '👁️ Show Complete Top 100'}
            </button>
            {showTop100Rankings && (
              <button 
                className="btn btn-primary btn-small"
                onClick={fetchTop100Users}
                disabled={top100Loading}
              >
                {top100Loading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            )}
          </div>
        </div>

        {showTop100Rankings && (
          <div className="top-players-grid">
            {top100Loading ? (
              <div className="loading-message">
                <div className="loading-spinner">⏳</div>
                <p>Loading Top 100 Players...</p>
              </div>
            ) : top100Users.length > 0 ? (
              /* Split into groups of 10 */
              Array.from({ length: 10 }, (_, groupIndex) => {
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
              })
            ) : (
              <div className="no-data-message">
                <p>No players data available. Try refreshing.</p>
                <button 
                  className="btn btn-primary btn-small"
                  onClick={fetchTop100Users}
                >
                  🔄 Try Again
                </button>
              </div>
            )}
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
        {filteredRankings.length > 0 ? filteredRankings.map((player, index) => {
          const isCurrentUser = user && player.id === user.id;
          const actualRank = rankings.findIndex(p => p.id === player.id) + 1;
          
          return (
          <div key={player.id} className={`table-row ${index < 3 ? 'top-3' : ''} ${isCurrentUser ? 'current-user' : ''}`}>
            <div className="rank-col">
              <span className="rank">#{actualRank}</span>
              {index === 0 && <span className="medal gold">🥇</span>}
              {index === 1 && <span className="medal silver">🥈</span>}
              {index === 2 && <span className="medal bronze">🥉</span>}
              {isCurrentUser && <span className="you-badge">YOU</span>}
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
            <div className="country-col">
              <span className="country-flag">{countryFlags[player.country] || '🏳️'}</span>
              {t.countries[player.country] || player.country}
            </div>
            <div className="stats-col">
              <span>W: {player.won_bets}</span>
              <span>L: {player.lost_bets}</span>
              <span>Total: {player.total_bets}</span>
            </div>
            <div className="score-col">
              {Math.round(player.score)}
              {isCurrentUser && <span className="trend-icon">📈</span>}
            </div>
          </div>
        )}) : (
          <div className="no-players">
            <p>No players found with current filter...</p>
            <button 
              className="btn btn-secondary"
              onClick={() => setRankingsFilter('all')}
            >
              Show All Players
            </button>
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

  // =============================================================================
  // TOURNAMENT RENDER FUNCTION
  // =============================================================================
  
  const renderTournament = () => {
    const t = translations[language];
    
    if (tournamentView === 'details' && selectedTournament) {
      return renderTournamentDetails();
    }
    
    return (
      <div className="tournament-container">
        <div className="tournament-header">
          <h1 className="tournament-title">🏆 {t.tournamentTitle}</h1>
          
          {/* Tournament Filters */}
          <div className="tournament-filters">
            <select 
              value={tournamentFilters.status} 
              onChange={(e) => {
                const newFilters = {...tournamentFilters, status: e.target.value};
                setTournamentFilters(newFilters);
                fetchTournaments(newFilters);
              }}
              className="tournament-filter"
            >
              <option value="">{t.allTournaments}</option>
              <option value="open">{t.open}</option>
              <option value="upcoming">{t.upcoming}</option>
              <option value="ongoing">{t.ongoing}</option>
              <option value="completed">{t.completed}</option>
            </select>
            
            <select 
              value={tournamentFilters.category} 
              onChange={(e) => {
                const newFilters = {...tournamentFilters, category: e.target.value};
                setTournamentFilters(newFilters);
                fetchTournaments(newFilters);
              }}
              className="tournament-filter"
            >
              <option value="">{t.filterByCategory}</option>
              <option value="free">{t.free}</option>
              <option value="basic">{t.basic}</option>
              <option value="standard">{t.standard}</option>
              <option value="premium">{t.premium}</option>
              <option value="vip">{t.vip}</option>
            </select>
            
            <select 
              value={tournamentFilters.duration} 
              onChange={(e) => {
                const newFilters = {...tournamentFilters, duration: e.target.value};
                setTournamentFilters(newFilters);
                fetchTournaments(newFilters);
              }}
              className="tournament-filter"
            >
              <option value="">{t.filterByDuration}</option>
              <option value="instant">{t.instant}</option>
              <option value="daily">{t.daily}</option>
              <option value="two_day">{t.two_day}</option>
              <option value="weekly">{t.weekly}</option>
              <option value="monthly">{t.monthly}</option>
              <option value="long_term">{t.long_term}</option>
            </select>
          </div>
        </div>
        
        {tournamentLoading ? (
          <div className="loading-container">
            <div className="loading">Loading tournaments...</div>
          </div>
        ) : (
          <div className="tournaments-grid">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="tournament-card">
                <div className="tournament-card-header">
                  <h3 className="tournament-name">{tournament.name}</h3>
                  <span className={`tournament-status status-${tournament.status}`}>
                    {t[tournament.status] || tournament.status}
                  </span>
                </div>
                
                <div className="tournament-card-body">
                  <p className="tournament-description">{tournament.description}</p>
                  
                  <div className="tournament-details">
                    <div className="tournament-detail">
                      <span className="detail-label">{t.entryFee}:</span>
                      <span className="detail-value">€{tournament.entry_fee}</span>
                    </div>
                    
                    <div className="tournament-detail">
                      <span className="detail-label">{t.participants}:</span>
                      <span className="detail-value">
                        {tournament.current_participants}/{tournament.max_participants}
                      </span>
                    </div>
                    
                    <div className="tournament-detail">
                      <span className="detail-label">{t.prizePool}:</span>
                      <span className="detail-value">€{tournament.total_prize_pool}</span>
                    </div>
                    
                    <div className="tournament-detail">
                      <span className="detail-label">{t.tournamentDuration}:</span>
                      <span className="detail-value">{t[tournament.duration_type] || tournament.duration_type}</span>
                    </div>
                    
                    <div className="tournament-detail">
                      <span className="detail-label">{t.prizeDistribution}:</span>
                      <span className="detail-value">{t[tournament.prize_distribution] || tournament.prize_distribution}</span>
                    </div>
                  </div>
                </div>
                
                <div className="tournament-card-footer">
                  {/* View Details button - Always available */}
                  <button 
                    className="btn btn-secondary"
                    onClick={() => fetchTournamentDetails(tournament.id)}
                  >
                    {t.viewDetails}
                  </button>
                  
                  {/* View Bracket button - Show if tournament has started or has bracket */}
                  {(tournament.status === 'ongoing' || tournament.status === 'completed' || 
                    (tournament.status === 'open' && tournament.current_participants >= 2)) && (
                    <button 
                      className="btn btn-outline"
                      onClick={() => {
                        fetchTournamentDetails(tournament.id);
                        // Auto-show bracket after details load
                        setTimeout(() => setShowBracket(true), 500);
                      }}
                    >
                      {tournament.status === 'ongoing' || tournament.status === 'completed' ? 
                        '🏆 View Bracket' : '🏆 Preview Bracket'}
                    </button>
                  )}
                  
                  {/* Join Tournament button */}
                  {tournament.status === 'open' && !tournament.user_registered && user && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => joinTournament(tournament.id)}
                      disabled={tournament.current_participants >= tournament.max_participants}
                    >
                      {tournament.current_participants >= tournament.max_participants 
                        ? t.tournamentFull 
                        : t.joinNow}
                    </button>
                  )}
                  
                  {/* Leave Tournament button */}
                  {tournament.user_registered && (
                    <button 
                      className="btn btn-warning"
                      onClick={() => leaveTournament(tournament.id)}
                      disabled={tournament.status === 'ongoing' || tournament.status === 'completed'}
                    >
                      {t.leaveTournament}
                    </button>
                  )}
                  
                  {/* Login prompt for unauthenticated users */}
                  {tournament.status === 'open' && !tournament.user_registered && !user && (
                    <button 
                      className="btn btn-outline"
                      onClick={() => setCurrentView('login')}
                    >
                      Login to Join
                    </button>
                  )}
                  
                  {/* Tournament status indicator */}
                  {tournament.status !== 'open' && tournament.status !== 'ongoing' && (
                    <span className="tournament-status-text">
                      {tournament.status === 'upcoming' ? t.upcoming : 
                       tournament.status === 'completed' ? t.completed : 
                       tournament.status === 'cancelled' ? t.cancelled : t.registrationClosed}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {tournaments.length === 0 && !tournamentLoading && (
          <div className="no-tournaments">
            <h3>No tournaments found</h3>
            <p>Try adjusting your filters or check back later for new tournaments.</p>
          </div>
        )}
      </div>
    );
  };
  
  const renderTournamentDetails = () => {
    const t = translations[language];
    const tournament = selectedTournament;
    
    if (!tournament) return null;
    
    return (
      <div className="tournament-details-container">
        <div className="tournament-details-header">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setTournamentView('list');
              setSelectedTournament(null);
            }}
          >
            ← {t.backToTournaments}
          </button>
          
          <h1 className="tournament-details-title">{tournament.name}</h1>
          <span className={`tournament-status status-${tournament.status}`}>
            {t[tournament.status] || tournament.status}
          </span>
        </div>
        
        <div className="tournament-details-content">
          <div className="tournament-info-grid">
            <div className="tournament-info-card">
              <h3>Tournament Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">{t.entryFee}:</span>
                  <span className="info-value">€{tournament.entry_fee}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.participants}:</span>
                  <span className="info-value">{tournament.current_participants}/{tournament.max_participants}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.prizePool}:</span>
                  <span className="info-value">€{tournament.total_prize_pool}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.tournamentFormat}:</span>
                  <span className="info-value">{t[tournament.tournament_format] || tournament.tournament_format}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.prizeDistribution}:</span>
                  <span className="info-value">{t[tournament.prize_distribution] || tournament.prize_distribution}</span>
                </div>
              </div>
            </div>
            
            <div className="tournament-info-card">
              <h3>Schedule</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Registration:</span>
                  <span className="info-value">
                    {new Date(tournament.registration_start).toLocaleDateString()} - {new Date(tournament.registration_end).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tournament:</span>
                  <span className="info-value">
                    {new Date(tournament.tournament_start).toLocaleDateString()} - {new Date(tournament.tournament_end).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.tournamentDuration}:</span>
                  <span className="info-value">{t[tournament.duration_type] || tournament.duration_type}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="tournament-description-card">
            <h3>Description</h3>
            <p>{tournament.description}</p>
          </div>
          
          <div className="tournament-rules-card">
            <h3>{t.rules}</h3>
            <p>{tournament.rules}</p>
          </div>
          
          <div className="tournament-participants-card">
            <h3>{t.participants} ({tournament.current_participants})</h3>
            <div className="participants-list">
              {tournament.participants && tournament.participants.map((participant, index) => (
                <div key={participant.id} className="participant-item">
                  <div className="participant-info">
                    {participant.avatar_url && (
                      <img 
                        src={participant.avatar_url} 
                        alt={participant.full_name}
                        className="participant-avatar"
                      />
                    )}
                    <div className="participant-details">
                      <span className="participant-name">{participant.full_name}</span>
                      <span className="participant-username">@{participant.username}</span>
                      <span className="participant-country">{participant.country}</span>
                    </div>
                  </div>
                  <span className="participant-position">#{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Admin Bracket Generation Section */}
          {tournament.status === 'open' && isAdmin && (
            <div className="admin-bracket-card">
              <h3>🔧 Admin: Bracket Management</h3>
              <div className="admin-bracket-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => generateTournamentBracket(tournament.id)}
                  disabled={bracketLoading || tournament.current_participants < 2}
                >
                  {bracketLoading ? 'Generating...' : 'Generate Bracket & Start Tournament'}
                </button>
                <p className="bracket-info">
                  Current participants: {tournament.current_participants}
                  {tournament.current_participants < 2 && (
                    <span className="warning"> (Need at least 2 participants)</span>
                  )}
                </p>
              </div>
            </div>
          )}
          
          {/* Tournament Bracket Section - Available for all tournament states if bracket exists */}
          {(tournamentBracket || tournament.status === 'ongoing' || tournament.status === 'completed') && (
            <div className="tournament-bracket-card">
              <div className="bracket-header">
                <h3>🏆 Tournament Bracket</h3>
                <div className="bracket-actions">
                  <button 
                    className={`btn btn-secondary ${showBracket ? 'active' : ''}`}
                    onClick={() => setShowBracket(!showBracket)}
                  >
                    {showBracket ? 'Hide Bracket' : 'Show Bracket'}
                  </button>
                  
                  {/* Admin can generate bracket if it doesn't exist */}
                  {!tournamentBracket && isAdmin && tournament.current_participants >= 2 && 
                   tournament.status !== 'completed' && tournament.status !== 'cancelled' && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => generateTournamentBracket(tournament.id)}
                      disabled={bracketLoading}
                    >
                      {bracketLoading ? 'Generating...' : 'Generate Bracket'}
                    </button>
                  )}
                </div>
              </div>
              
              {showBracket && (
                <div className="bracket-content">
                  {bracketLoading ? (
                    <div className="loading">Loading bracket...</div>
                  ) : tournamentBracket ? (
                    <div className="bracket-view">
                      {renderTournamentBracket()}
                    </div>
                  ) : (
                    <div className="no-bracket">
                      <p>Bracket not generated yet.</p>
                      {tournament.status === 'ongoing' || tournament.status === 'completed' ? (
                        <p>This tournament should have a bracket but it's not available.</p>
                      ) : (
                        <p>Bracket will be generated when the tournament starts.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Admin Bracket Generation */}
          {tournament.status === 'open' && isAdmin && (
            <div className="admin-bracket-card">
              <h3>🔧 Admin: Bracket Management</h3>
              <div className="admin-bracket-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => generateTournamentBracket(tournament.id)}
                  disabled={bracketLoading || tournament.current_participants < 2}
                >
                  {bracketLoading ? 'Generating...' : 'Generate Bracket & Start Tournament'}
                </button>
                <p className="bracket-info">
                  Current participants: {tournament.current_participants}
                  {tournament.current_participants < 2 && (
                    <span className="warning"> (Need at least 2 participants)</span>
                  )}
                </p>
              </div>
            </div>
          )}
          
          <div className="tournament-actions">
            {tournament.status === 'open' && !tournament.user_registered && (
              <button 
                className="btn btn-primary btn-large"
                onClick={() => joinTournament(tournament.id)}
                disabled={tournament.current_participants >= tournament.max_participants}
              >
                {tournament.current_participants >= tournament.max_participants 
                  ? t.tournamentFull 
                  : `${t.joinNow} - €${tournament.entry_fee}`}
              </button>
            )}
            
            {tournament.user_registered && (
              <div className="user-registered-info">
                <span className="registered-badge">✅ {t.alreadyJoined}</span>
                {(tournament.status === 'open' || tournament.status === 'upcoming') && (
                  <button 
                    className="btn btn-warning"
                    onClick={() => leaveTournament(tournament.id)}
                  >
                    {t.leaveTournament}
                  </button>
                )}
              </div>
            )}
            
            {tournament.status === 'upcoming' && (
              <div className="tournament-upcoming-info">
                <span className="upcoming-badge">⏰ {t.upcoming}</span>
                <p>Registration will open on {new Date(tournament.registration_start).toLocaleDateString()}</p>
              </div>
            )}
            
            {tournament.status === 'completed' && tournament.winner_id && (
              <div className="tournament-completed-info">
                <span className="completed-badge">🏆 {t.completed}</span>
                <p>Tournament completed!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderTournamentBracket = () => {
    if (!tournamentBracket || !tournamentMatches.length) {
      return <div>No bracket data available.</div>;
    }
    
    const matchesByRound = {};
    tournamentMatches.forEach(match => {
      if (!matchesByRound[match.round_number]) {
        matchesByRound[match.round_number] = [];
      }
      matchesByRound[match.round_number].push(match);
    });
    
    return (
      <div className="bracket-container">
        {tournamentBracket.rounds.map((round, roundIndex) => (
          <div key={round.round_number} className="bracket-round">
            <h4 className="round-title">{round.round_name}</h4>
            <div className="round-matches">
              {(matchesByRound[round.round_number] || []).map((match) => (
                <div key={match.id} className={`match-card ${match.status}`}>
                  <div className="match-header">
                    <span className="match-number">Match {match.match_number}</span>
                    <span className={`match-status status-${match.status}`}>
                      {match.status === 'pending' ? '⏳' : 
                       match.status === 'ongoing' ? '▶️' : '✅'}
                    </span>
                  </div>
                  
                  <div className="match-players">
                    <div className={`player ${match.winner_id === match.player1_id ? 'winner' : ''}`}>
                      <span className="player-name">
                        {match.player1_username || 'TBD'}
                      </span>
                      {match.status === 'pending' && match.player1_id && match.player2_id && isAdmin && (
                        <button 
                          className="btn btn-small btn-success"
                          onClick={() => setMatchWinner(match.id, match.player1_id)}
                        >
                          Set Winner
                        </button>
                      )}
                    </div>
                    
                    <div className="vs-divider">VS</div>
                    
                    <div className={`player ${match.winner_id === match.player2_id ? 'winner' : ''}`}>
                      <span className="player-name">
                        {match.player2_username || 'TBD'}
                      </span>
                      {match.status === 'pending' && match.player1_id && match.player2_id && isAdmin && (
                        <button 
                          className="btn btn-small btn-success"
                          onClick={() => setMatchWinner(match.id, match.player2_id)}
                        >
                          Set Winner
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {match.winner_username && (
                    <div className="match-result">
                      🏆 Winner: <strong>{match.winner_username}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
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
              className={`admin-tab ${adminView === 'tournaments' ? 'active' : ''}`}
              onClick={() => setAdminView('tournaments')}
            >
              🏆 Tournament Management
            </button>
            
            {/* Financial Management - only for Admin and above */}
            {(isAdmin || isGod) && (
              <button 
                className={`admin-tab ${adminView === 'financial' ? 'active' : ''}`}
                onClick={() => setAdminView('financial')}
              >
                💰 {t.financialOverview}
              </button>
            )}
            
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

          {/* Tournament Management Tab */}
          {adminView === 'tournaments' && (
            <div className="admin-section">
              <h3>🏆 Tournament Management</h3>
              
              <div className="tournament-admin-header">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    console.log('🏆 Create Tournament button clicked!');
                    setShowTournamentModal(true);
                  }}
                >
                  ➕ Create New Tournament
                </button>
              </div>
              
              <div className="admin-tournaments-list">
                {adminTournaments.length === 0 ? (
                  <p>No tournaments found. Click "Create New Tournament" to add one.</p>
                ) : (
                  <div className="tournaments-admin-grid">
                    {adminTournaments.map((tournament) => (
                      <div key={tournament.id} className="tournament-admin-card">
                        <div className="tournament-admin-header">
                          <h4>{tournament.name}</h4>
                          <span className={`tournament-status status-${tournament.status}`}>
                            {tournament.status}
                          </span>
                        </div>
                        
                        <div className="tournament-admin-details">
                          <p><strong>Entry Fee:</strong> €{tournament.entry_fee} ({tournament.entry_fee_category})</p>
                          <p><strong>Participants:</strong> {tournament.current_participants}/{tournament.max_participants}</p>
                          <p><strong>Prize Pool:</strong> €{tournament.total_prize_pool}</p>
                          <p><strong>Duration:</strong> {tournament.duration_type}</p>
                          <p><strong>Prize Distribution:</strong> {tournament.prize_distribution}</p>
                        </div>
                        
                        <div className="tournament-admin-actions">
                          {tournament.status !== 'cancelled' && tournament.status !== 'completed' && (
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => cancelTournament(tournament.id)}
                            >
                              Cancel Tournament
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

          {/* Competitions Tab */}
            </div>
          )}

          {/* Tournament Creation Modal - Available in both Tournament and Competitions tabs */}
          {showTournamentModal && (
            <div className="modal-overlay" onClick={() => setShowTournamentModal(false)}>
              <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>🏆 Create New Tournament</h3>
                  <button 
                    className="modal-close"
                    onClick={() => setShowTournamentModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  createTournament(tournamentForm);
                }}>
                  <div className="modal-body">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Tournament Name*</label>
                        <input
                          type="text"
                          value={tournamentForm.name}
                          onChange={(e) => setTournamentForm({...tournamentForm, name: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Entry Fee (€)* (0 for Free)</label>
                        <input
                          type="number"
                          min="0"
                          value={tournamentForm.entry_fee}
                          onChange={(e) => setTournamentForm({...tournamentForm, entry_fee: parseFloat(e.target.value)})}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Max Participants*</label>
                        <input
                          type="number"
                          min="2"
                          max="1000"
                          value={tournamentForm.max_participants}
                          onChange={(e) => setTournamentForm({...tournamentForm, max_participants: parseInt(e.target.value)})}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Duration Type*</label>
                        <select
                          value={tournamentForm.duration_type}
                          onChange={(e) => setTournamentForm({...tournamentForm, duration_type: e.target.value})}
                          className="form-input"
                          required
                        >
                          <option value="instant">Instant</option>
                          <option value="daily">Daily</option>
                          <option value="two_day">2-Day</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="long_term">Long Term</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Prize Distribution*</label>
                        <select
                          value={tournamentForm.prize_distribution}
                          onChange={(e) => setTournamentForm({...tournamentForm, prize_distribution: e.target.value})}
                          className="form-input"
                          required
                        >
                          <option value="winner_takes_all">Winner Takes All</option>
                          <option value="top_three">Top 3 (50%/30%/20%)</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Region</label>
                        <select
                          value={tournamentForm.region}
                          onChange={(e) => setTournamentForm({...tournamentForm, region: e.target.value})}
                          className="form-input"
                        >
                          <option value="Global">Global</option>
                          <option value="Europe">Europe</option>
                          <option value="Asia">Asia</option>
                          <option value="Americas">Americas</option>
                          <option value="Africa">Africa</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Description*</label>
                      <textarea
                        value={tournamentForm.description}
                        onChange={(e) => setTournamentForm({...tournamentForm, description: e.target.value})}
                        className="form-input"
                        rows="3"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Rules*</label>
                      <textarea
                        value={tournamentForm.rules}
                        onChange={(e) => setTournamentForm({...tournamentForm, rules: e.target.value})}
                        className="form-input"
                        rows="4"
                        required
                      />
                    </div>
                    
                    <div className="date-grid">
                      <div className="form-group">
                        <label>Registration Start*</label>
                        <input
                          type="datetime-local"
                          value={tournamentForm.registration_start}
                          onChange={(e) => setTournamentForm({...tournamentForm, registration_start: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Registration End*</label>
                        <input
                          type="datetime-local"
                          value={tournamentForm.registration_end}
                          onChange={(e) => setTournamentForm({...tournamentForm, registration_end: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Tournament Start*</label>
                        <input
                          type="datetime-local"
                          value={tournamentForm.tournament_start}
                          onChange={(e) => setTournamentForm({...tournamentForm, tournament_start: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Tournament End*</label>
                        <input
                          type="datetime-local"
                          value={tournamentForm.tournament_end}
                          onChange={(e) => setTournamentForm({...tournamentForm, tournament_end: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowTournamentModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Create Tournament
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Competitions Tab */}
          {adminView === 'competitions' && (
            <div className="admin-section">
              <h3>🏆 Tournament Management</h3>
              
              <div className="admin-controls">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    console.log('🏆 Create Tournament button clicked!');
                    console.log('showTournamentModal before:', showTournamentModal);
                    setShowTournamentModal(true);
                    console.log('setShowTournamentModal(true) called');
                  }}
                >
                  🏆 Create New Tournament
                </button>
                
                <input 
                  type="text"
                  placeholder="Search tournaments..."
                  className="admin-search"
                  value={tournamentSearch}
                  onChange={(e) => setTournamentSearch(e.target.value)}
                />
              </div>

              {/* Tournaments List with Search */}
              <div className="tournaments-admin-section">
                {adminTournaments.length === 0 ? (
                  <div className="no-tournaments">
                    <p>No tournaments found. Click "Create New Tournament" to add one.</p>
                  </div>
                ) : (
                  <div className="tournaments-admin-grid">
                    {adminTournaments
                      .filter(tournament => 
                        tournament.name.toLowerCase().includes(tournamentSearch.toLowerCase()) ||
                        tournament.status.toLowerCase().includes(tournamentSearch.toLowerCase()) ||
                        tournament.entry_fee_category.toLowerCase().includes(tournamentSearch.toLowerCase())
                      )
                      .map((tournament) => (
                        <div key={tournament.id} className="tournament-admin-card">
                          <div className="tournament-admin-header">
                            <h4>{tournament.name}</h4>
                            <span className={`tournament-status status-${tournament.status}`}>
                              {tournament.status}
                            </span>
                          </div>
                          
                          <div className="tournament-admin-details">
                            <p><strong>Entry Fee:</strong> €{tournament.entry_fee} ({tournament.entry_fee_category})</p>
                            <p><strong>Participants:</strong> {tournament.current_participants}/{tournament.max_participants}</p>
                            <p><strong>Prize Pool:</strong> €{tournament.total_prize_pool}</p>
                            <p><strong>Duration:</strong> {tournament.duration_type}</p>
                            <p><strong>Prize Distribution:</strong> {tournament.prize_distribution}</p>
                            <p><strong>Format:</strong> {tournament.tournament_format}</p>
                          </div>
                          
                          <div className="tournament-admin-actions">
                            <button 
                              className="btn btn-secondary btn-small"
                              onClick={() => {
                                setCurrentView('tournament');
                                fetchTournamentDetails(tournament.id);
                              }}
                            >
                              📝 View Details
                            </button>
                            
                            {/* Bracket-specific button */}
                            {(tournament.status === 'ongoing' || tournament.status === 'completed' || 
                              tournament.current_participants >= 2) && (
                              <button 
                                className="btn btn-outline btn-small"
                                onClick={() => {
                                  setCurrentView('tournament');
                                  fetchTournamentDetails(tournament.id);
                                  // Auto-show bracket
                                  setTimeout(() => setShowBracket(true), 500);
                                }}
                              >
                                🏆 View Bracket
                              </button>
                            )}
                            
                            {/* Generate bracket button */}
                            {tournament.status === 'open' && tournament.current_participants >= 2 && (
                              <button 
                                className="btn btn-success btn-small"
                                onClick={() => {
                                  if (confirm('Generate bracket and start tournament?')) {
                                    generateTournamentBracket(tournament.id);
                                  }
                                }}
                              >
                                🚀 Start Tournament
                              </button>
                            )}
                            
                            {/* Update tournament button */}
                            {tournament.status !== 'cancelled' && tournament.status !== 'completed' && (
                              <button 
                                className="btn btn-warning btn-small"
                                onClick={() => {
                                  // Set selected tournament for editing
                                  setSelectedTournament(tournament);
                                  setShowTournamentModal(true);
                                }}
                              >
                                ✏️ Edit
                              </button>
                            )}
                            
                            {/* Cancel tournament button */}
                            {tournament.status !== 'cancelled' && tournament.status !== 'completed' && (
                              <button 
                                className="btn btn-danger btn-small"
                                onClick={() => {
                                  if (confirm('Are you sure you want to cancel this tournament?')) {
                                    cancelTournament(tournament.id);
                                  }
                                }}
                              >
                                ❌ Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial Management Tab (Admin and above) */}
          {adminView === 'financial' && (isAdmin || isGod) && (
            <div className="admin-section">
              <h3>💰 {t.financialOverview}</h3>
              
              {financialLoading ? (
                <div className="loading">Loading financial data...</div>
              ) : (
                <>
                  {/* Financial Overview Cards */}
                  {financialOverview && (
                    <div className="financial-overview">
                      <div className="overview-cards">
                        <div className="overview-card">
                          <div className="card-icon">👥</div>
                          <div className="card-info">
                            <h4>{financialOverview.total_affiliates}</h4>
                            <p>{t.totalAffiliates}</p>
                            <span className="card-sub">{financialOverview.active_affiliates} active</span>
                          </div>
                        </div>
                        
                        <div className="overview-card">
                          <div className="card-icon">⏳</div>
                          <div className="card-info">
                            <h4>€{financialOverview.total_pending_payouts?.toFixed(2)}</h4>
                            <p>{t.totalPendingPayouts}</p>
                          </div>
                        </div>
                        
                        <div className="overview-card">
                          <div className="card-icon">💰</div>
                          <div className="card-info">
                            <h4>€{financialOverview.total_commissions_owed?.toFixed(2)}</h4>
                            <p>{t.totalCommissionsOwed}</p>
                          </div>
                        </div>
                        
                        <div className="overview-card">
                          <div className="card-icon">📊</div>
                          <div className="card-info">
                            <h4>€{financialOverview.monthly_commission_costs?.toFixed(2)}</h4>
                            <p>{t.monthlyCommissionCosts}</p>
                          </div>
                        </div>
                        
                        <div className="overview-card">
                          <div className="card-icon">🏆</div>
                          <div className="card-info">
                            <h4>€{financialOverview.platform_revenue?.toFixed(2)}</h4>
                            <p>{t.platformRevenue}</p>
                          </div>
                        </div>
                        
                        <div className="overview-card">
                          <div className="card-icon">📈</div>
                          <div className="card-info">
                            <h4>{financialOverview.affiliate_conversion_rate?.toFixed(1)}%</h4>
                            <p>{t.affiliateConversionRate}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Financial Summary */}
                      <div className="financial-summary">
                        <h4>📋 {t.financialSummary}</h4>
                        <div className="summary-grid">
                          <div className="summary-item">
                            <span className="summary-label">{t.totalPlatformCosts}:</span>
                            <span className="summary-value">€{financialOverview.financial_summary?.total_platform_costs?.toFixed(2)}</span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-label">{t.estimatedMonthlyRevenue}:</span>
                            <span className="summary-value">€{financialOverview.financial_summary?.estimated_monthly_revenue?.toFixed(2)}</span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-label">{t.profitMargin}:</span>
                            <span className="summary-value">{financialOverview.financial_summary?.profit_margin?.toFixed(1)}%</span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-label">{t.costPerAcquisition}:</span>
                            <span className="summary-value">€{financialOverview.financial_summary?.cost_per_acquisition?.toFixed(2)}</span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-label">{t.roiPercentage}:</span>
                            <span className="summary-value">{financialOverview.financial_summary?.roi_percentage?.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Top Affiliates */}
                  <div className="top-affiliates">
                    <h4>🏆 {t.topAffiliates}</h4>
                    {financialOverview?.top_affiliates?.length > 0 ? (
                      <div className="affiliates-grid">
                        {financialOverview.top_affiliates.slice(0, 10).map((affiliate, index) => (
                          <div key={affiliate.user_id} className="affiliate-card">
                            <div className="affiliate-rank">#{index + 1}</div>
                            <div className="affiliate-info">
                              <strong>{affiliate.full_name}</strong>
                              <span>@{affiliate.username}</span>
                            </div>
                            <div className="affiliate-stats">
                              <div className="stat">
                                <span className="stat-label">Earnings:</span>
                                <span className="stat-value">€{affiliate.total_earnings?.toFixed(2)}</span>
                              </div>
                              <div className="stat">
                                <span className="stat-label">Referrals:</span>
                                <span className="stat-value">{affiliate.total_referrals}</span>
                              </div>
                              <div className="stat">
                                <span className="stat-label">Status:</span>
                                <span className={`stat-badge ${affiliate.status}`}>{affiliate.status}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-data">
                        <p>No affiliates found</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Pending Payouts */}
                  <div className="pending-payouts">
                    <div className="section-header">
                      <h4>⏳ Pending Payouts</h4>
                      {financialOverview?.pending_payouts?.length > 0 && (
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            const payoutIds = financialOverview.pending_payouts.map(p => p.id);
                            if (confirm(`Process ${payoutIds.length} pending payouts?`)) {
                              // TODO: Implement bulk payout processing
                              alert('Bulk payout processing not implemented yet');
                            }
                          }}
                        >
                          💳 {t.processBulkPayout}
                        </button>
                      )}
                    </div>
                    
                    {financialOverview?.pending_payouts?.length > 0 ? (
                      <div className="payouts-table">
                        <div className="table-header">
                          <div>User</div>
                          <div>Amount</div>
                          <div>Method</div>
                          <div>Requested</div>
                          <div>Actions</div>
                        </div>
                        {financialOverview.pending_payouts.map((payout) => (
                          <div key={payout.id} className="table-row">
                            <div className="payout-user">
                              {payout.username || 'Unknown User'}
                            </div>
                            <div className="payout-amount">€{payout.amount?.toFixed(2)}</div>
                            <div className="payout-method">{payout.payment_method}</div>
                            <div className="payout-date">
                              {new Date(payout.created_at).toLocaleDateString()}
                            </div>
                            <div className="payout-actions">
                              <button 
                                className="btn btn-success btn-small"
                                onClick={() => {
                                  if (confirm(`Approve payout of €${payout.amount} for ${payout.username}?`)) {
                                    // TODO: Implement individual payout approval
                                    alert('Individual payout approval not implemented yet');
                                  }
                                }}
                              >
                                ✅ Approve
                              </button>
                              <button 
                                className="btn btn-danger btn-small"
                                onClick={() => {
                                  if (confirm(`Reject payout of €${payout.amount} for ${payout.username}?`)) {
                                    // TODO: Implement payout rejection
                                    alert('Payout rejection not implemented yet');
                                  }
                                }}
                              >
                                ❌ Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-data">
                        <p>No pending payouts</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Recent Transactions */}
                  <div className="recent-transactions">
                    <h4>📋 Recent Transactions</h4>
                    {financialOverview?.recent_transactions?.length > 0 ? (
                      <div className="transactions-list">
                        {financialOverview.recent_transactions.slice(0, 10).map((transaction) => (
                          <div key={transaction.id} className="transaction-item">
                            <div className="transaction-info">
                              <div className="transaction-type">
                                {transaction.transaction_type === 'commission_earned' ? '💰 Commission' :
                                 transaction.transaction_type === 'payout_completed' ? '💳 Payout' :
                                 transaction.transaction_type === 'payout_requested' ? '⏳ Payout Request' :
                                 transaction.transaction_type === 'manual_adjustment' ? '⚙️ Manual Adjustment' :
                                 transaction.transaction_type}
                              </div>
                              <div className="transaction-user">
                                {transaction.username || 'Unknown User'}
                              </div>
                            </div>
                            <div className={`transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                              {transaction.amount >= 0 ? '+' : ''}€{transaction.amount?.toFixed(2)}
                            </div>
                            <div className="transaction-date">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-data">
                        <p>No recent transactions</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Manual Adjustment Section */}
                  <div className="manual-adjustment">
                    <div className="section-header">
                      <h4>⚙️ {t.manualAdjustment}</h4>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowManualAdjustmentModal(true)}
                      >
                        ➕ Create Adjustment
                      </button>
                    </div>
                    <p>Manually adjust user wallet balances for corrections, bonuses, or penalties.</p>
                  </div>
                </>
              )}
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

  // =============================================================================
  // TEAM SYSTEM RENDER FUNCTIONS
  // =============================================================================

  const renderTeams = () => {
    return (
      <div className="teams-page">
        <div className="teams-header">
          <h2>🏆 {t.teams}</h2>
          
          {/* Team Invitations Banner */}
          {teamInvitations.length > 0 && (
            <div className="team-invitations-banner">
              <div className="invitations-alert">
                <h3>📨 Team Invitations ({teamInvitations.length})</h3>
                <p>You have pending team invitations!</p>
                <div className="invitations-list">
                  {teamInvitations.map(invitation => (
                    <div key={invitation.id} className="invitation-item">
                      <div className="invitation-info">
                        <strong>{invitation.team_details?.name}</strong>
                        <span>from {invitation.captain?.full_name}</span>
                        <small>{invitation.team_details?.city}, {invitation.team_details?.country}</small>
                      </div>
                      <div className="invitation-actions">
                        <button 
                          className="btn btn-primary btn-small"
                          onClick={() => acceptTeamInvitation(invitation.id)}
                          disabled={teamLoading}
                        >
                          ✅ Accept
                        </button>
                        <button 
                          className="btn btn-secondary btn-small"
                          onClick={() => declineTeamInvitation(invitation.id)}
                          disabled={teamLoading}
                        >
                          ❌ Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Create Team Button */}
          {user && (
            <div className="teams-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateTeamModal(true)}
              >
                ➕ Create Team
              </button>
            </div>
          )}
        </div>

        {/* Teams List */}
        <div className="teams-grid">
          {teams.length === 0 ? (
            <div className="no-teams">
              <h3>No teams found</h3>
              <p>Be the first to create a team!</p>
            </div>
          ) : (
            teams.map(team => (
              <div key={team.id} className="team-card">
                <div className="team-header">
                  <div className="team-logo">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={`${team.name} logo`} />
                    ) : (
                      <div className="default-logo" style={{backgroundColor: team.colors?.primary || '#FF0000'}}>
                        {team.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="team-info">
                    <h3>{team.name}</h3>
                    <p>📍 {team.city}, {team.country}</p>
                    <p>👑 Captain: {team.captain_name}</p>
                  </div>
                </div>
                
                <div className="team-stats">
                  <div className="stat">
                    <span className="stat-value">{team.current_player_count}</span>
                    <span className="stat-label">Players</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{team.status}</span>
                    <span className="stat-label">Status</span>
                  </div>
                </div>

                <div className="team-colors">
                  <div 
                    className="color-primary" 
                    style={{backgroundColor: team.colors?.primary}}
                    title="Primary Color"
                  ></div>
                  {team.colors?.secondary && (
                    <div 
                      className="color-secondary" 
                      style={{backgroundColor: team.colors.secondary}}
                      title="Secondary Color"
                    ></div>
                  )}
                </div>

                <div className="team-actions">
                  <button 
                    className="btn btn-outline"
                    onClick={() => setCurrentView(`team-${team.id}`)}
                  >
                    👁️ View Details
                  </button>
                  
                  {/* Captain actions */}
                  {user && user.id === team.captain_id && (
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedTeamForInvite(team);
                        setShowTeamInviteModal(true);
                      }}
                    >
                      📧 Invite Player
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // =============================================================================
  // AFFILIATE SYSTEM RENDER FUNCTION
  // =============================================================================
  
  const renderAffiliate = () => {
    if (!user || !token) {
      return (
        <div className="container">
          <div className="auth-required">
            <h2>🔒 {t.loginTitle}</h2>
            <p>Please login to access the affiliate program.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setCurrentView('home')}
            >
              {t.loginBtn}
            </button>
          </div>
        </div>
      );
    }

    if (!isAffiliate) {
      return (
        <div className="container">
          <div className="affiliate-welcome">
            <h2>💰 {t.affiliateProgram}</h2>
            <div className="affiliate-info">
              <h3>Why become an affiliate?</h3>
              <div className="benefits-grid">
                <div className="benefit-card">
                  <div className="benefit-icon">💶</div>
                  <h4>€5 per Registration</h4>
                  <p>Earn €5 for every new user who registers using your referral link.</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">🏆</div>
                  <h4>10% Tournament Commission</h4>
                  <p>Get 10% commission on tournament entry fees from your referrals.</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">📈</div>
                  <h4>Recurring Income</h4>
                  <p>Earn commissions every time your referrals participate in tournaments.</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">💳</div>
                  <h4>Easy Payouts</h4>
                  <p>Request payouts starting from €50 via bank transfer or PayPal.</p>
                </div>
              </div>
              
              <div className="apply-section">
                <h3>Ready to start earning?</h3>
                <p>Join our affiliate program and start earning money by referring your friends!</p>
                <button 
                  className="btn btn-primary btn-large"
                  onClick={applyForAffiliate}
                  disabled={affiliateLoading}
                >
                  {affiliateLoading ? '⏳ Processing...' : `🚀 ${t.becomeAffiliate}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="container">
        <div className="affiliate-dashboard">
          <div className="affiliate-header">
            <h2>💰 {t.affiliateDashboard}</h2>
            <div className="affiliate-status">
              <span className={`status-badge ${affiliateData?.status}`}>
                {affiliateData?.status === 'active' ? '✅' : '⏳'} {t[affiliateData?.status] || affiliateData?.status}
              </span>
            </div>
          </div>

          {/* Affiliate Navigation */}
          <div className="affiliate-nav">
            <button 
              className={`tab-btn ${affiliateView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setAffiliateView('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={`tab-btn ${affiliateView === 'commissions' ? 'active' : ''}`}
              onClick={() => setAffiliateView('commissions')}
            >
              💰 {t.commissions}
            </button>
            <button 
              className={`tab-btn ${affiliateView === 'referrals' ? 'active' : ''}`}
              onClick={() => setAffiliateView('referrals')}
            >
              👥 {t.referrals}
            </button>
          </div>

          {/* Dashboard View */}
          {affiliateView === 'dashboard' && (
            <div className="affiliate-content">
              {/* Referral Link Section */}
              <div className="referral-link-section">
                <h3>🔗 {t.referralLink}</h3>
                <div className="referral-link-box">
                  <div className="link-display">
                    <input 
                      type="text" 
                      value={affiliateData?.referral_link || ''} 
                      readOnly 
                      className="referral-input"
                    />
                    <button 
                      className="btn btn-secondary"
                      onClick={copyReferralLink}
                    >
                      📋 {t.copyLink}
                    </button>
                  </div>
                  <div className="referral-code">
                    <strong>{t.referralCode}:</strong> {affiliateData?.referral_code}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              {affiliateStats && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <h4>{affiliateStats.total_referrals}</h4>
                      <p>{t.totalReferrals}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                      <h4>{affiliateStats.active_referrals}</h4>
                      <p>{t.activeReferrals}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                      <h4>€{affiliateStats.total_earnings?.toFixed(2)}</h4>
                      <p>{t.totalEarnings}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                      <h4>€{affiliateStats.pending_earnings?.toFixed(2)}</h4>
                      <p>{t.pendingEarnings}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💳</div>
                    <div className="stat-info">
                      <h4>€{affiliateStats.paid_earnings?.toFixed(2)}</h4>
                      <p>{t.paidEarnings}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                      <h4>{affiliateStats.this_month_referrals}</h4>
                      <p>{t.thisMonthReferrals}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payout Section */}
              <div className="payout-section">
                <div className="section-header">
                  <h3>💳 {t.requestPayout}</h3>
                  {affiliateStats && affiliateStats.pending_earnings >= 50 && (
                    <button 
                      className="btn btn-success"
                      onClick={() => setShowPayoutModal(true)}
                    >
                      💰 {t.requestPayout}
                    </button>
                  )}
                </div>
                <p className="payout-info">
                  {affiliateStats && affiliateStats.pending_earnings < 50 ? (
                    `${t.minimumPayout} (${t.pendingEarnings}: €${affiliateStats.pending_earnings?.toFixed(2)})`
                  ) : (
                    `Available for payout: €${affiliateStats?.pending_earnings?.toFixed(2) || '0.00'}`
                  )}
                </p>
              </div>

              {/* Recent Activity */}
              <div className="recent-activity">
                <h3>📈 {t.recentActivity}</h3>
                <div className="activity-grid">
                  <div className="activity-section">
                    <h4>Recent Commissions</h4>
                    {affiliateStats?.recent_commissions?.length > 0 ? (
                      <div className="activity-list">
                        {affiliateStats.recent_commissions.slice(0, 5).map((commission, index) => (
                          <div key={index} className="activity-item">
                            <div className="activity-info">
                              <span className="activity-type">
                                {commission.type === 'registration' ? '👤' : '🏆'} {commission.description}
                              </span>
                              <span className="activity-amount">€{commission.amount}</span>
                            </div>
                            <div className="activity-date">
                              {new Date(commission.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-activity">{t.noCommissions}</p>
                    )}
                  </div>

                  <div className="activity-section">
                    <h4>Recent Referrals</h4>
                    {affiliateStats?.recent_referrals?.length > 0 ? (
                      <div className="activity-list">
                        {affiliateStats.recent_referrals.slice(0, 5).map((referral, index) => (
                          <div key={index} className="activity-item">
                            <div className="activity-info">
                              <span className="activity-type">
                                👤 New referral
                              </span>
                              <span className="activity-amount">{referral.tournaments_joined} tournaments</span>
                            </div>
                            <div className="activity-date">
                              {new Date(referral.registered_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-activity">{t.noReferrals}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commissions View */}
          {affiliateView === 'commissions' && (
            <div className="affiliate-content">
              <h3>💰 {t.commissionHistory}</h3>
              {affiliateLoading ? (
                <div className="loading">Loading commissions...</div>
              ) : affiliateCommissions.length > 0 ? (
                <div className="commissions-table">
                  <div className="table-header">
                    <div>Type</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div>Description</div>
                  </div>
                  {affiliateCommissions.map((commission) => (
                    <div key={commission.id} className="table-row">
                      <div className="commission-type">
                        {commission.commission_type === 'registration' ? '👤 Registration' : '🏆 Tournament'}
                      </div>
                      <div className="commission-amount">€{commission.amount}</div>
                      <div className={`commission-status ${commission.is_paid ? 'paid' : 'pending'}`}>
                        {commission.is_paid ? '✅ Paid' : '⏳ Pending'}
                      </div>
                      <div className="commission-date">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </div>
                      <div className="commission-description">{commission.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>{t.noCommissions}</p>
                  <p>{t.shareYourLink}</p>
                </div>
              )}
            </div>
          )}

          {/* Referrals View */}
          {affiliateView === 'referrals' && (
            <div className="affiliate-content">
              <h3>👥 {t.referrals}</h3>
              {affiliateLoading ? (
                <div className="loading">Loading referrals...</div>
              ) : affiliateReferrals.length > 0 ? (
                <div className="referrals-grid">
                  {affiliateReferrals.map((referral) => (
                    <div key={referral.id} className="referral-card">
                      <div className="referral-header">
                        <div className="referral-user">
                          {referral.user_details && (
                            <>
                              <Avatar 
                                src={referral.user_details.avatar_url} 
                                name={referral.user_details.full_name} 
                                size="small" 
                              />
                              <div className="user-info">
                                <strong>{referral.user_details.full_name}</strong>
                                <span className="username">@{referral.user_details.username}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className={`referral-status ${referral.is_active ? 'active' : 'inactive'}`}>
                          {referral.is_active ? '✅ Active' : '❌ Inactive'}
                        </div>
                      </div>
                      <div className="referral-stats">
                        <div className="stat">
                          <span className="stat-label">Joined:</span>
                          <span className="stat-value">{new Date(referral.registered_at).toLocaleDateString()}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Tournaments:</span>
                          <span className="stat-value">{referral.tournaments_joined}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Total Fees:</span>
                          <span className="stat-value">€{referral.total_tournament_fees?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Commissions Earned:</span>
                          <span className="stat-value">€{referral.total_commissions_earned?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>{t.noReferrals}</p>
                  <p>{t.inviteFriends}</p>
                  <button 
                    className="btn btn-primary"
                    onClick={copyReferralLink}
                  >
                    📋 {t.copyLink}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payout Modal */}
        {showPayoutModal && (
          <div className="modal-overlay" onClick={() => setShowPayoutModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>💳 {t.requestPayout}</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowPayoutModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-content">
                <div className="form-group">
                  <label>Amount (€):</label>
                  <input
                    type="number"
                    min="50"
                    max={affiliateStats?.pending_earnings || 0}
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({...payoutForm, amount: e.target.value})}
                    placeholder="Minimum €50"
                  />
                </div>
                
                <div className="form-group">
                  <label>Payment Method:</label>
                  <select
                    value={payoutForm.payment_method}
                    onChange={(e) => setPayoutForm({...payoutForm, payment_method: e.target.value})}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Payment Details:</label>
                  <textarea
                    value={JSON.stringify(payoutForm.payment_details)}
                    onChange={(e) => {
                      try {
                        const details = JSON.parse(e.target.value);
                        setPayoutForm({...payoutForm, payment_details: details});
                      } catch (error) {
                        // Invalid JSON, just update the string
                      }
                    }}
                    placeholder='{"account": "Your account details", "email": "your@email.com"}'
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Notes (optional):</label>
                  <textarea
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm({...payoutForm, notes: e.target.value})}
                    placeholder="Any additional notes..."
                    rows="2"
                  />
                </div>
                
                <div className="modal-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowPayoutModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={requestPayout}
                    disabled={affiliateLoading || !payoutForm.amount || parseFloat(payoutForm.amount) < 50}
                  >
                    {affiliateLoading ? '⏳ Processing...' : '💰 Request Payout'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // =============================================================================
  // WALLET SYSTEM RENDER FUNCTION
  // =============================================================================
  
  const renderWallet = () => {
    if (!user || !token) {
      return (
        <div className="container">
          <div className="auth-required">
            <h2>🔒 {t.loginTitle}</h2>
            <p>Please login to access your wallet.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setCurrentView('home')}
            >
              {t.loginBtn}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="container">
        <div className="wallet-dashboard">
          <div className="wallet-header">
            <h2>💰 {t.walletDashboard}</h2>
            <div className="wallet-balance-summary">
              {walletBalance && (
                <div className="balance-card">
                  <div className="balance-main">
                    <span className="balance-label">{t.availableBalance}</span>
                    <span className="balance-amount">€{walletBalance.available_balance?.toFixed(2)}</span>
                  </div>
                  <div className="balance-details">
                    <span>{t.totalEarned}: €{walletBalance.total_earned?.toFixed(2)}</span>
                    <span>{t.withdrawnBalance}: €{walletBalance.withdrawn_balance?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Navigation */}
          <div className="wallet-nav">
            <button 
              className={`tab-btn ${walletView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setWalletView('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={`tab-btn ${walletView === 'transactions' ? 'active' : ''}`}
              onClick={() => setWalletView('transactions')}
            >
              📋 {t.transactionHistory}
            </button>
            <button 
              className={`tab-btn ${walletView === 'settings' ? 'active' : ''}`}
              onClick={() => setWalletView('settings')}
            >
              ⚙️ {t.walletSettings}
            </button>
          </div>

          {/* Dashboard View */}
          {walletView === 'dashboard' && (
            <div className="wallet-content">
              {walletLoading ? (
                <div className="loading">Loading wallet data...</div>
              ) : walletStats ? (
                <>
                  {/* Balance Breakdown */}
                  <div className="balance-breakdown">
                    <h3>💼 {t.balance} {t.recentActivity}</h3>
                    <div className="balance-grid">
                      <div className="balance-item">
                        <div className="balance-icon">💰</div>
                        <div className="balance-info">
                          <h4>€{walletStats.balance?.total_earned?.toFixed(2) || '0.00'}</h4>
                          <p>{t.totalEarned}</p>
                        </div>
                      </div>
                      <div className="balance-item">
                        <div className="balance-icon">✅</div>
                        <div className="balance-info">
                          <h4>€{walletStats.balance?.available_balance?.toFixed(2) || '0.00'}</h4>
                          <p>{t.availableBalance}</p>
                        </div>
                      </div>
                      <div className="balance-item">
                        <div className="balance-icon">⏳</div>
                        <div className="balance-info">
                          <h4>€{walletStats.balance?.pending_withdrawal?.toFixed(2) || '0.00'}</h4>
                          <p>{t.pendingBalance}</p>
                        </div>
                      </div>
                      <div className="balance-item">
                        <div className="balance-icon">💳</div>
                        <div className="balance-info">
                          <h4>€{walletStats.balance?.lifetime_withdrawals?.toFixed(2) || '0.00'}</h4>
                          <p>{t.lifetimeWithdrawals}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commission Breakdown */}
                  <div className="commission-breakdown">
                    <h3>📊 Commission Breakdown</h3>
                    <div className="breakdown-grid">
                      <div className="breakdown-item">
                        <span className="breakdown-label">{t.registrationBonus}</span>
                        <span className="breakdown-value">€{walletStats.commission_breakdown?.registration?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">{t.tournamentCommission}</span>
                        <span className="breakdown-value">€{walletStats.commission_breakdown?.tournament?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">{t.depositCommission}</span>
                        <span className="breakdown-value">€{walletStats.commission_breakdown?.deposit?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Bonus Earnings</span>
                        <span className="breakdown-value">€{walletStats.commission_breakdown?.bonus?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="performance-metrics">
                    <h3>📈 {t.performanceMetrics}</h3>
                    <div className="metrics-grid">
                      <div className="metric-card">
                        <div className="metric-icon">🎯</div>
                        <div className="metric-info">
                          <h4>{walletStats.performance_metrics?.total_commissions || 0}</h4>
                          <p>{t.totalCommissions}</p>
                        </div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-icon">💵</div>
                        <div className="metric-info">
                          <h4>€{walletStats.performance_metrics?.average_commission?.toFixed(2) || '0.00'}</h4>
                          <p>{t.averageCommission}</p>
                        </div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-icon">📊</div>
                        <div className="metric-info">
                          <h4>{walletStats.performance_metrics?.conversion_rate?.toFixed(1) || '0.0'}%</h4>
                          <p>{t.conversionRate}</p>
                        </div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-icon">⚡</div>
                        <div className="metric-info">
                          <h4>{walletStats.performance_metrics?.efficiency_score?.toFixed(0) || '0'}</h4>
                          <p>{t.efficiencyScore}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Earnings Chart */}
                  <div className="monthly-earnings">
                    <h3>📅 {t.monthlyEarnings}</h3>
                    <div className="earnings-chart">
                      {walletStats.monthly_earnings?.length > 0 ? (
                        <div className="chart-bars">
                          {walletStats.monthly_earnings.slice(0, 6).reverse().map((month, index) => (
                            <div key={index} className="chart-bar">
                              <div 
                                className="bar"
                                style={{
                                  height: `${Math.max(10, (month.earnings / Math.max(...walletStats.monthly_earnings.map(m => m.earnings))) * 100)}%`
                                }}
                              ></div>
                              <div className="bar-label">
                                <span className="month">{month.month}</span>
                                <span className="amount">€{month.earnings?.toFixed(0)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-data">
                          <p>No earnings data yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payout Summary */}
                  <div className="payout-summary">
                    <h3>💳 Payout Summary</h3>
                    <div className="payout-info">
                      <div className="payout-stats">
                        <div className="payout-stat">
                          <span className="stat-label">{t.totalWithdrawals}:</span>
                          <span className="stat-value">€{walletStats.payout_summary?.total_withdrawn?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="payout-stat">
                          <span className="stat-label">{t.pendingWithdrawal}:</span>
                          <span className="stat-value">€{walletStats.payout_summary?.pending_withdrawal?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="payout-stat">
                          <span className="stat-label">Total Payouts:</span>
                          <span className="stat-value">{walletStats.payout_summary?.total_payouts || 0}</span>
                        </div>
                        {walletStats.payout_summary?.last_payout && (
                          <div className="payout-stat">
                            <span className="stat-label">{t.lastPayout}:</span>
                            <span className="stat-value">
                              {new Date(walletStats.payout_summary.last_payout).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {walletStats.balance?.available_balance >= 50 && (
                        <div className="payout-actions">
                          <button 
                            className="btn btn-success"
                            onClick={() => setShowPayoutModal(true)}
                          >
                            💰 {t.requestPayout}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-data">
                  <p>Loading wallet dashboard...</p>
                </div>
              )}
            </div>
          )}

          {/* Transactions View */}
          {walletView === 'transactions' && (
            <div className="wallet-content">
              <h3>📋 {t.transactionHistory}</h3>
              {walletLoading ? (
                <div className="loading">Loading transactions...</div>
              ) : walletTransactions.length > 0 ? (
                <div className="transactions-table">
                  <div className="table-header">
                    <div>Type</div>
                    <div>Amount</div>
                    <div>Balance</div>
                    <div>Date</div>
                    <div>Description</div>
                  </div>
                  {walletTransactions.map((transaction) => (
                    <div key={transaction.id} className="table-row">
                      <div className="transaction-type">
                        {transaction.transaction_type === 'commission_earned' ? '💰 Commission' :
                         transaction.transaction_type === 'payout_completed' ? '💳 Payout' :
                         transaction.transaction_type === 'payout_requested' ? '⏳ Payout Request' :
                         transaction.transaction_type === 'bonus' ? '🎁 Bonus' :
                         transaction.transaction_type === 'manual_adjustment' ? '⚙️ Adjustment' :
                         transaction.transaction_type}
                      </div>
                      <div className={`transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                        {transaction.amount >= 0 ? '+' : ''}€{transaction.amount?.toFixed(2)}
                      </div>
                      <div className="transaction-balance">€{transaction.balance_after?.toFixed(2)}</div>
                      <div className="transaction-date">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                      <div className="transaction-description">{transaction.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No transactions yet</p>
                  <p>Start earning commissions to see your transaction history!</p>
                </div>
              )}
            </div>
          )}

          {/* Settings View */}
          {walletView === 'settings' && (
            <div className="wallet-content">
              <h3>⚙️ {t.walletSettings}</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={walletSettings.auto_payout_enabled}
                      onChange={(e) => setWalletSettings({
                        ...walletSettings,
                        auto_payout_enabled: e.target.checked
                      })}
                    />
                    {t.autoPayoutEnabled}
                  </label>
                  <p className="form-help">Automatically request payout when balance reaches threshold</p>
                </div>
                
                <div className="form-group">
                  <label>{t.autoPayoutThreshold} (€):</label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={walletSettings.auto_payout_threshold}
                    onChange={(e) => setWalletSettings({
                      ...walletSettings,
                      auto_payout_threshold: parseFloat(e.target.value) || 100
                    })}
                    className="form-input"
                  />
                  <p className="form-help">Minimum €50, maximum €1000</p>
                </div>
                
                <div className="form-group">
                  <label>{t.preferredPayoutMethod}:</label>
                  <select
                    value={walletSettings.preferred_payout_method}
                    onChange={(e) => setWalletSettings({
                      ...walletSettings,
                      preferred_payout_method: e.target.value
                    })}
                    className="form-input"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={updateWalletSettings}
                    disabled={walletLoading}
                  >
                    {walletLoading ? '⏳ Saving...' : '💾 Save Settings'}
                  </button>
                </div>
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
          <button 
            className={`nav-link ${currentView === 'tournament' ? 'active' : ''}`}
            onClick={() => setCurrentView('tournament')}
          >
            {t.tournament}
          </button>
          <button 
            className={`nav-link ${currentView === 'teams' ? 'active' : ''}`}
            onClick={() => setCurrentView('teams')}
          >
            {t.teams}
          </button>
          
          {/* Affiliate menu item - only show for logged in users */}
          {user && (
            <button 
              className={`nav-link ${currentView === 'affiliate' ? 'active' : ''}`}
              onClick={() => setCurrentView('affiliate')}
            >
              {t.affiliate}
            </button>
          )}
          
          {/* Wallet menu item - only show for logged in users */}
          {user && (
            <button 
              className={`nav-link ${currentView === 'wallet' ? 'active' : ''}`}
              onClick={() => setCurrentView('wallet')}
            >
              {t.wallet}
            </button>
          )}
          
          {/* Language Selector Dropdown */}
          <div className="language-dropdown">
            <button 
              className="language-selector" 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            >
              {language === 'gr' ? (
                <>
                  🇬🇷 <span className="lang-text">EL</span>
                </>
              ) : (
                <>
                  🇺🇸 <span className="lang-text">EN</span>
                </>
              )}
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {showLanguageDropdown && (
              <div className="language-dropdown-menu">
                <button 
                  className={`language-option ${language === 'en' ? 'active' : ''}`}
                  onClick={() => changeLanguage('en')}
                >
                  🇺🇸 <span>English</span>
                </button>
                <button 
                  className={`language-option ${language === 'gr' ? 'active' : ''}`}
                  onClick={() => changeLanguage('gr')}
                >
                  🇬🇷 <span>Ελληνικά</span>
                </button>
              </div>
            )}
          </div>

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
                      <label>Profile Photo:</label>
                      <div className="photo-upload-section">
                        <div className="photo-preview">
                          {photoPreview || settingsForm.avatar_url ? (
                            <img 
                              src={photoPreview || settingsForm.avatar_url} 
                              alt="Profile preview" 
                              className="preview-image"
                            />
                          ) : (
                            <div className="no-photo">
                              <span className="photo-icon">📷</span>
                              <span>No photo</span>
                            </div>
                          )}
                        </div>
                        <div className="photo-upload-controls">
                          <input
                            type="file"
                            id="photo-upload"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="photo-input"
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="photo-upload" className="btn btn-secondary btn-small">
                            📷 Upload Photo
                          </label>
                          <p className="upload-hint">Max 5MB • JPG, PNG, GIF</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* User ID Display */}
                    <div className="form-group">
                      <label>Your User ID:</label>
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <strong style={{ color: '#ffd700', fontSize: '16px' }}>{user.id}</strong>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                            🆔 This is your unique user identifier
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            navigator.clipboard.writeText(user.id);
                            // Show temporary feedback
                            const btn = e.target;
                            const originalText = btn.textContent;
                            btn.textContent = '✅ Copied!';
                            btn.style.color = '#00ff00';
                            setTimeout(() => {
                              btn.textContent = originalText;
                              btn.style.color = '#ffd700';
                            }, 2000);
                          }}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(255, 215, 0, 0.5)',
                            color: '#ffd700',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          📋 Copy ID
                        </button>
                      </div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0' }}>
                        💡 Use this ID for manual adjustments, admin operations, or support requests
                      </p>
                    </div>
                    
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
                      <label>Nickname (Display Name):</label>
                      <input
                        type="text"
                        value={settingsForm.nickname}
                        onChange={(e) => setSettingsForm({...settingsForm, nickname: e.target.value})}
                        className="form-input"
                        placeholder="How you want to be displayed"
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

      <main 
        className="main-content"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentView === 'home' && renderHome()}
        {currentView === 'login' && renderLogin()}
        {currentView === 'register' && renderRegister()}
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'rankings' && renderRankings()}
        {currentView === 'worldmap' && renderWorldMap()}
        {currentView === 'tournament' && renderTournament()}
        {currentView === 'teams' && renderTeams()}
        {currentView === 'affiliate' && user && renderAffiliate()}
        {currentView === 'wallet' && user && renderWallet()}
        {currentView === 'admin' && isAdmin && renderAdminPanel()}
        {currentView === 'download' && <DownloadBackup />}
        
        {/* Mobile Navigation Indicator */}
        <div className="mobile-nav-indicator">
          <div className="nav-dots">
            {['home', 'rankings', 'worldmap', 'tournament', 'teams', user && 'dashboard', user && user.affiliate_id && 'affiliate', user && 'wallet', isAdmin && 'admin'].filter(Boolean).map((view) => (
              <div 
                key={view}
                className={`nav-dot ${currentView === view ? 'active' : ''}`}
                onClick={() => setCurrentView(view)}
              />
            ))}
          </div>
          <div className="swipe-hint">
            <span className="swipe-text">👈 Swipe to navigate 👉</span>
          </div>
        </div>
      </main>
      
      {/* Manual Adjustment Modal - Rendered at root level for proper z-index */}
      {showManualAdjustmentModal && (
        <div className="modal-overlay" onClick={() => setShowManualAdjustmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ {t.manualAdjustment}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowManualAdjustmentModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>User Selection:</label>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                  💡 Enter User ID or Username (e.g., testuser, admin, God)
                </div>
                <input
                  type="text"
                  value={manualAdjustmentForm.user_id}
                  onChange={(e) => setManualAdjustmentForm({
                    ...manualAdjustmentForm,
                    user_id: e.target.value
                  })}
                  placeholder="Enter User ID or Username (e.g., testuser, admin, God)"
                  className="form-input"
                />
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  backgroundColor: 'rgba(255, 215, 0, 0.1)', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#ffd700'
                }}>
                  ℹ️ You can use either:<br/>
                  🆔 <strong>User ID</strong>: Found in user settings (copy button available)<br/>
                  👤 <strong>Username</strong>: Like 'testuser', 'admin', 'God', etc.
                </div>
              </div>
              
              <div className="form-group">
                <label>{t.adjustAmount} (€):</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualAdjustmentForm.amount}
                  onChange={(e) => setManualAdjustmentForm({
                    ...manualAdjustmentForm,
                    amount: e.target.value
                  })}
                  placeholder="Enter amount (positive or negative)"
                  className="form-input"
                />
                <p className="form-help">Use positive values to add money, negative to deduct</p>
              </div>
              
              <div className="form-group">
                <label>{t.adjustmentReason}:</label>
                <input
                  type="text"
                  value={manualAdjustmentForm.reason}
                  onChange={(e) => setManualAdjustmentForm({
                    ...manualAdjustmentForm,
                    reason: e.target.value
                  })}
                  placeholder="Enter reason for adjustment"
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>{t.adminNotes} (optional):</label>
                <textarea
                  value={manualAdjustmentForm.admin_notes}
                  onChange={(e) => setManualAdjustmentForm({
                    ...manualAdjustmentForm,
                    admin_notes: e.target.value
                  })}
                  placeholder="Additional notes..."
                  rows="3"
                  className="form-input"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowManualAdjustmentModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={processManualAdjustment}
                  disabled={financialLoading || !manualAdjustmentForm.user_id || !manualAdjustmentForm.amount || !manualAdjustmentForm.reason}
                >
                  {financialLoading ? '⏳ Processing...' : '⚙️ Process Adjustment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Team Creation Modal */}
      {showCreateTeamModal && (
        <div className="modal-overlay" onClick={(e) => {
          // Only close if clicking the overlay itself, not its children
          if (e.target === e.currentTarget) {
            setShowCreateTeamModal(false);
          }
        }}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏆 Create New Team</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateTeamModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                console.log('FORM SUBMITTED - calling createTeam');
                createTeam(); 
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Team Name *</label>
                    <input
                      type="text"
                      value={teamFormData.name}
                      onChange={(e) => setTeamFormData({...teamFormData, name: e.target.value})}
                      placeholder="Enter team name"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Logo URL</label>
                    <input
                      type="url"
                      value={teamFormData.logo_url}
                      onChange={(e) => setTeamFormData({...teamFormData, logo_url: e.target.value})}
                      placeholder="https://example.com/logo.png"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Primary Color *</label>
                    <input
                      type="color"
                      value={teamFormData.colors.primary}
                      onChange={(e) => setTeamFormData({
                        ...teamFormData, 
                        colors: {...teamFormData.colors, primary: e.target.value}
                      })}
                      className="form-input color-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Secondary Color</label>
                    <input
                      type="color"
                      value={teamFormData.colors.secondary}
                      onChange={(e) => setTeamFormData({
                        ...teamFormData, 
                        colors: {...teamFormData.colors, secondary: e.target.value}
                      })}
                      className="form-input color-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      value={teamFormData.city}
                      onChange={(e) => setTeamFormData({...teamFormData, city: e.target.value})}
                      placeholder="Enter city"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Country *</label>
                    <input
                      type="text"
                      value={teamFormData.country}
                      onChange={(e) => setTeamFormData({...teamFormData, country: e.target.value})}
                      placeholder="Enter country"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={teamFormData.phone}
                      onChange={(e) => setTeamFormData({...teamFormData, phone: e.target.value})}
                      placeholder="+30 123 456 7890"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={teamFormData.email}
                      onChange={(e) => setTeamFormData({...teamFormData, email: e.target.value})}
                      placeholder="team@example.com"
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      console.log('CANCEL CLICKED');
                      setShowCreateTeamModal(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={teamLoading}
                    onClick={(e) => {
                      console.log('CREATE TEAM BUTTON CLICKED');
                      // Let the form submit handle this
                    }}
                  >
                    {teamLoading ? '⏳ Creating...' : '🏆 Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Team Invitation Modal */}
      {showTeamInviteModal && selectedTeamForInvite && (
        <div className="modal-overlay" onClick={() => setShowTeamInviteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📧 Invite Player to {selectedTeamForInvite.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTeamInviteModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <form onSubmit={(e) => { e.preventDefault(); invitePlayerToTeam(selectedTeamForInvite.id); }}>
                <div className="form-group">
                  <label>Player Username</label>
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="Enter username to invite"
                    className="form-input"
                    required
                  />
                  <p className="form-help">
                    Enter the exact username of the player you want to invite
                  </p>
                </div>
                
                <div className="team-info-preview">
                  <h4>Team: {selectedTeamForInvite.name}</h4>
                  <p>Players: {selectedTeamForInvite.current_player_count}/20</p>
                  <p>Status: {selectedTeamForInvite.status}</p>
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowTeamInviteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={teamLoading || !inviteUsername.trim()}
                  >
                    {teamLoading ? '⏳ Sending...' : '📧 Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;