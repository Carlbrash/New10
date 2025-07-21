import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  TimeScale,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import './App.css';
import DownloadBackup from './DownloadBackup';

// Payment Gateway Imports
import { loadStripe } from '@stripe/stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import CoinbaseCommerceButton from 'react-coinbase-commerce';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  TimeScale,
);

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://b90141f8-e066-4425-bc76-e032fe56376a.preview.emergentagent.com';

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
    guilds: 'Guilds',  // Added guild
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
    processBulkPayout: 'Επεξεργασία Μαζικής Πληρωμής',
    
    // Guild System
    guildsTitle: 'Guild System',
    createGuild: 'Δημιουργία Guild',
    joinGuild: 'Συμμετοχή σε Guild',
    myGuild: 'Το Guild μου',
    browseGuilds: 'Περιήγηση Guilds',
    guildRankings: 'Κατατάξεις Guild',
    guildWars: 'Guild Wars',
    guildName: 'Όνομα Guild',
    guildTag: 'Tag Guild',
    guildDescription: 'Περιγραφή Guild',
    guildLeader: 'Guild Leader',
    guildMembers: 'Μέλη Guild',
    guildLevel: 'Επίπεδο Guild',
    guildPowerRating: 'Power Rating',
    guildTrophies: 'Τρόπαια Guild',
    recruitmentOpen: 'Ανοιχτή Στρατολόγηση',
    inviteToGuild: 'Πρόσκληση στο Guild',
    acceptInvitation: 'Αποδοχή Πρόσκλησης',
    declineInvitation: 'Απόρριψη Πρόσκλησης',
    challengeGuild: 'Πρόκληση Guild',
    guildWar: 'Guild War',
    warObjectives: 'Στόχοι Πολέμου',
    warScore: 'Βαθμολογία Πολέμου',
    
    // Payments
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
    guilds: 'Guilds',  // Added guild
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
    processBulkPayout: 'Process Bulk Payout',
    
    // Guild System
    guildsTitle: 'Guild System',
    createGuild: 'Create Guild',
    joinGuild: 'Join Guild',
    myGuild: 'My Guild',
    browseGuilds: 'Browse Guilds',
    guildRankings: 'Guild Rankings',
    guildWars: 'Guild Wars',
    guildName: 'Guild Name',
    guildTag: 'Guild Tag',
    guildDescription: 'Guild Description',
    guildLeader: 'Guild Leader',
    guildMembers: 'Guild Members',
    guildLevel: 'Guild Level',
    guildPowerRating: 'Power Rating',
    guildTrophies: 'Guild Trophies',
    recruitmentOpen: 'Open Recruitment',
    inviteToGuild: 'Invite to Guild',
    acceptInvitation: 'Accept Invitation',
    declineInvitation: 'Decline Invitation',
    challengeGuild: 'Challenge Guild',
    guildWar: 'Guild War',
    warObjectives: 'War Objectives',
    warScore: 'War Score'
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
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState(null);
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState(null);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    logo_url: '',
    colors: { primary: '#FF0000', secondary: '#FFFFFF' },
    city: '',
    country: '',
    phone: '',
    email: ''
  });
  const [editTeamFormData, setEditTeamFormData] = useState({
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
  const [logoUpload, setLogoUpload] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [selectedTeamDetails, setSelectedTeamDetails] = useState(null);
  const [teamInvitationStats, setTeamInvitationStats] = useState(null);
  
  // Admin Team Management States
  const [adminTeams, setAdminTeams] = useState([]);
  const [adminTeamLoading, setAdminTeamLoading] = useState(false);
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [selectedTeamsForBulk, setSelectedTeamsForBulk] = useState([]);
  const [teamStatusFilter, setTeamStatusFilter] = useState('all');
  const [showTeamVerificationModal, setShowTeamVerificationModal] = useState(false);
  const [selectedTeamForAdmin, setSelectedTeamForAdmin] = useState(null);
  
  // UI/UX Enhancement States
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Live Chat System States
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [chatSocket, setChatSocket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentChatRoom, setCurrentChatRoom] = useState('general');
  const [chatRooms, setChatRooms] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [isConnectedToChat, setIsConnectedToChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPrivateMessageModal, setShowPrivateMessageModal] = useState(false);
  const [selectedPrivateUser, setSelectedPrivateUser] = useState(null);
  const [privateMessage, setPrivateMessage] = useState('');
  const [privateMessages, setPrivateMessages] = useState([]);
  const [chatTab, setChatTab] = useState('room'); // 'room' or 'private'
  const [showAdminChatModal, setShowAdminChatModal] = useState(false);
  const [selectedUserForBan, setSelectedUserForBan] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [chatStats, setChatStats] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [chatPersistentState, setChatPersistentState] = useState(true);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  
  // Insufficient Balance Modal State
  const [insufficientBalanceModal, setInsufficientBalanceModal] = useState({
    show: false,
    message: '',
    tournamentId: null
  });
  
  // Dropdown Menu States
  const [showRankingsDropdown, setShowRankingsDropdown] = useState(false);
  const [showTournamentsDropdown, setShowTournamentsDropdown] = useState(false);
  const [showTeamsDropdown, setShowTeamsDropdown] = useState(false);
  const [showGuildsDropdown, setShowGuildsDropdown] = useState(false);  // Added guild dropdown
  const [showStandingsDropdown, setShowStandingsDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);  // Added settings dropdown
  const [showAccountSubmenu, setShowAccountSubmenu] = useState(false);  // Added account submenu
  
  // National League States
  const [nationalLeagues, setNationalLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [leagueStandings, setLeagueStandings] = useState([]);
  const [teamsWithoutLeague, setTeamsWithoutLeague] = useState([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [showAllCountries, setShowAllCountries] = useState(false);
  
  // Fixtures States
  const [leagueFixtures, setLeagueFixtures] = useState([]);
  const [selectedMatchday, setSelectedMatchday] = useState(1);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [selectedLeagueForFixtures, setSelectedLeagueForFixtures] = useState(null);
  
  // Admin League Creation States
  const [newLeagueCountry, setNewLeagueCountry] = useState('');
  
  // Default countries that always show
  const defaultCountries = [
    { name: "Greece", flag: "🇬🇷" },
    { name: "Italy", flag: "🇮🇹" },
    { name: "Germany", flag: "🇩🇪" },
    { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { name: "Spain", flag: "🇪🇸" },
    { name: "France", flag: "🇫🇷" },
    { name: "Turkey", flag: "🇹🇷" },
    { name: "Austria", flag: "🇦🇹" }
  ];

  // Enhanced Loading Component
  const EnhancedLoader = ({ message = "Loading...", size = "medium" }) => (
    <motion.div 
      className={`loading-spinner ${size}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="spinner"></div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
  
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

  // =============================================================================
  // ANIMATION VARIANTS
  // =============================================================================

  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 20 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    hover: { 
      scale: 1.02, 
      y: -5,
      boxShadow: "0 20px 40px rgba(255, 215, 0, 0.2)",
      transition: { duration: 0.2 }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2, ease: "easeInOut" }
    },
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      transition: { duration: 0.2 }
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.3, 
        ease: "easeOut",
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  const staggerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // =============================================================================
  // SKELETON LOADING COMPONENTS
  // =============================================================================

  const TeamCardSkeleton = () => (
    <motion.div 
      className="team-card-skeleton"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <div className="team-header-skeleton">
        <div className="team-logo-skeleton skeleton"></div>
        <div className="team-info-skeleton">
          <div className="team-name-skeleton skeleton"></div>
          <div className="team-details-skeleton skeleton"></div>
          <div className="team-details-skeleton skeleton"></div>
        </div>
      </div>
      
      <div className="team-stats-skeleton">
        <div className="stat-skeleton">
          <div className="stat-value-skeleton skeleton"></div>
          <div className="stat-label-skeleton skeleton"></div>
        </div>
        <div className="stat-skeleton">
          <div className="stat-value-skeleton skeleton"></div>
          <div className="stat-label-skeleton skeleton"></div>
        </div>
      </div>

      <div className="team-colors-skeleton">
        <div className="color-skeleton skeleton"></div>
        <div className="color-skeleton skeleton"></div>
      </div>

      <div className="team-actions-skeleton">
        <div className="action-btn-skeleton skeleton"></div>
        <div className="action-btn-skeleton skeleton"></div>
      </div>
    </motion.div>
  );

  const TournamentCardSkeleton = () => (
    <div className="tournament-card-skeleton">
      <div className="tournament-header-skeleton">
        <div className="tournament-title-skeleton skeleton"></div>
        <div className="tournament-meta-skeleton skeleton"></div>
        <div className="tournament-meta-skeleton skeleton"></div>
      </div>
      
      <div className="tournament-stats-skeleton">
        <div className="tournament-stat-skeleton skeleton"></div>
        <div className="tournament-stat-skeleton skeleton"></div>
        <div className="tournament-stat-skeleton skeleton"></div>
      </div>

      <div className="tournament-actions-skeleton">
        <div className="tournament-btn-skeleton skeleton"></div>
      </div>
    </div>
  );

  const UserProfileSkeleton = () => (
    <div className="user-profile-skeleton">
      <div className="user-avatar-skeleton skeleton"></div>
      <div className="user-info-skeleton">
        <div className="user-name-skeleton skeleton"></div>
        <div className="user-details-skeleton skeleton"></div>
      </div>
    </div>
  );

  const StatsCardSkeleton = () => (
    <div className="stat-card-skeleton">
      <div className="stat-icon-skeleton skeleton"></div>
      <div className="stat-number-skeleton skeleton"></div>
      <div className="stat-label-skeleton skeleton"></div>
    </div>
  );

  const ListItemSkeleton = () => (
    <div className="list-item-skeleton">
      <div className="list-icon-skeleton skeleton"></div>
      <div className="list-content-skeleton">
        <div className="list-title-skeleton skeleton"></div>
        <div className="list-subtitle-skeleton skeleton"></div>
      </div>
      <div className="list-action-skeleton skeleton"></div>
    </div>
  );

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

  // CMS and Dynamic Content States
  const [cmsContent, setCmsContent] = useState({});
  const [activeTheme, setActiveTheme] = useState(null);
  const [cmsLoaded, setCmsLoaded] = useState(false);

  // Load CMS content on app startup
  const loadCmsContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cms/content`);
      if (response.ok) {
        const content = await response.json();
        setCmsContent(content);
      }
    } catch (error) {
      console.error('Error loading CMS content:', error);
    }
  };

  // Load active theme
  const loadActiveTheme = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cms/theme/active`);
      if (response.ok) {
        const theme = await response.json();
        setActiveTheme(theme);
        
        // Apply theme colors to CSS variables
        if (theme.colors) {
          const root = document.documentElement;
          Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
          });
        }
      }
    } catch (error) {
      console.error('Error loading active theme:', error);
    }
  };

  // Helper function to get CMS content value
  const getCmsContent = (key, defaultValue = '') => {
    return cmsContent[key]?.value || defaultValue;
  };

  // Helper function to get CMS color
  const getCmsColor = (key) => {
    return cmsContent[key]?.value || (activeTheme?.colors?.[key]) || '';
  };

  // Load CMS content on app startup
  useEffect(() => {
    const initializeCms = async () => {
      await Promise.all([
        loadCmsContent(),
        loadActiveTheme()
      ]);
      setCmsLoaded(true);
    };
    
    initializeCms();
  }, []);

  // Admin Panel States
  const [adminView, setAdminView] = useState('users');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [siteMessages, setSiteMessages] = useState([]);
  const [adminActions, setAdminActions] = useState([]);
  
  // CMS Admin States (for admin panel management)
  const [adminCmsContent, setAdminCmsContent] = useState([]);
  const [cmsThemes, setCmsThemes] = useState([]);
  const [cmsLoading, setCmsLoading] = useState(false);
  const [selectedContentContext, setSelectedContentContext] = useState('navbar');
  const [editingContent, setEditingContent] = useState(null);
  const [showCmsContentModal, setShowCmsContentModal] = useState(false);
  const [showCmsThemeModal, setShowCmsThemeModal] = useState(false);
  const [cmsContentForm, setCmsContentForm] = useState({
    key: '',
    content_type: 'text',
    context: 'general',
    current_value: '',
    description: ''
  });
  const [cmsThemeForm, setCmsThemeForm] = useState({
    name: '',
    colors: {
      primary: '#4fc3f7',
      secondary: '#29b6f6',
      accent: '#ffd700',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#1a1a1a',
      surface: '#2a2a2a',
      text: '#ffffff'
    }
  });
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
  
  // Advanced Analytics States
  const [advancedDashboard, setAdvancedDashboard] = useState({
    registration_trends: [],
    tournament_participation: [],
    revenue_by_category: [],
    geographic_distribution: [],
    performance_kpis: {}
  });
  const [engagementMetrics, setEngagementMetrics] = useState({
    daily_active_users: [],
    tournament_success_rates: [],
    affiliate_conversion_funnel: {},
    financial_performance: {},
    retention_analytics: {}
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
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
  
  // Payment System States
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedTournamentForPayment, setSelectedTournamentForPayment] = useState(null);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState('stripe');
  const [paymentSession, setPaymentSession] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [showPayoutRequestModal, setShowPayoutRequestModal] = useState(false);
  const [payoutRequestForm, setPayoutRequestForm] = useState({
    amount: '',
    provider: 'stripe',
    payout_account: '',
    notes: ''
  });
  
  // Admin Financial States
  const [financialOverview, setFinancialOverview] = useState(null);
  const [adminWallets, setAdminWallets] = useState([]);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [showManualAdjustmentModal, setShowManualAdjustmentModal] = useState(false);
  
  // Admin Affiliate States
  const [affiliateUsers, setAffiliateUsers] = useState([]);
  const [affiliateRequests, setAffiliateRequests] = useState([]);
  const [adminAffiliateStats, setAdminAffiliateStats] = useState(null);
  const [adminAffiliateLoading, setAdminAffiliateLoading] = useState(false);

  // Social Sharing States
  const [socialShares, setSocialShares] = useState([]);
  const [socialStats, setSocialStats] = useState(null);
  const [showSocialShareModal, setShowSocialShareModal] = useState(false);
  const [shareContent, setShareContent] = useState(null);
  const [shareType, setShareType] = useState('tournament_victory');
  const [sharePlatform, setSharePlatform] = useState('twitter');
  const [shareLoading, setShareLoading] = useState(false);
  const [viralContent, setViralContent] = useState([]);
  const [shareCustomMessage, setShareCustomMessage] = useState('');
  const [showShareSuccessModal, setShowShareSuccessModal] = useState(false);
  const [showAdminAffiliateModal, setShowAdminAffiliateModal] = useState(false);
  const [selectedAffiliateUser, setSelectedAffiliateUser] = useState(null);
  const [affiliateBonusForm, setAffiliateBonusForm] = useState({
    referral_bonus: 5.0,
    deposit_bonus: 10.0,
    bonus_type: 'registration',
    is_active: true
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [manualAdjustmentForm, setManualAdjustmentForm] = useState({
    user_id: '',
    amount: '',
    reason: '',
    admin_notes: ''
  });
  
  // Friend Import System States
  const [friendsData, setFriendsData] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRecommendations, setFriendRecommendations] = useState([]);
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  const [showFriendImportModal, setShowFriendImportModal] = useState(false);
  const [friendImportProvider, setFriendImportProvider] = useState('email');
  const [friendImportEmails, setFriendImportEmails] = useState('');
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [friendsModalTab, setFriendsModalTab] = useState('friends'); // Separate state for Friends modal tabs
  
  // Guild System States
  const [guilds, setGuilds] = useState([]);
  const [myGuild, setMyGuild] = useState(null);
  const [guildInvitations, setGuildInvitations] = useState([]);
  const [guildRankings, setGuildRankings] = useState([]);
  const [guildWars, setGuildWars] = useState([]);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState(null);
  
  // SportsDuel System States
  const [sportsduelLeagues, setSportsduelLeagues] = useState([]);
  const [sportsduelTeams, setSportsduelTeams] = useState([]);
  const [sportsduelMatches, setSportsduelMatches] = useState([]);
  const [sportsduelScoreboard, setSportsduelScoreboard] = useState([]);
  const [currentSportsduelLeague, setCurrentSportsduelLeague] = useState(null);
  const [myPlayerProfile, setMyPlayerProfile] = useState(null);
  const [sportsduelTimeSlots, setSportsduelTimeSlots] = useState([]);
  const [sportsduelEvents, setSportsduelEvents] = useState([]);
  const [sportsduelLoading, setSportsduelLoading] = useState(false);
  
  // SportsDuel view state
  const [selectedMatch, setSelectedMatch] = useState(null); // null = show match list, match object = show detailed view
  
  // Navigation history management - Using useRef for immediate updates
  const addToHistory = (view, title = '') => {
    const newHistoryEntry = {
      view: view,
      title: title || view,
      timestamp: Date.now()
    };
    
    // Add to ref (immediate)
    navigationHistoryRef.current.push(newHistoryEntry);
    
    // Keep only last 10 entries
    if (navigationHistoryRef.current.length > 10) {
      navigationHistoryRef.current.shift();
    }
    
    // Update state for UI
    setNavigationHistory([...navigationHistoryRef.current]);
    setCurrentHistoryIndex(navigationHistoryRef.current.length - 1);
    
    console.log('Added to history:', view, 'Current history:', navigationHistoryRef.current);
  };

  // Simple browser history based navigation
  const goBack = () => {
    window.history.back();
  };

  // Check if we can go back using browser history
  const canGoBack = () => {
    return window.history.length > 1;
  };

  // Get current translations
  const t = translations[language];

  // Navigation History State
  const navigationHistoryRef = useRef([]);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // Mock wallet data for settings display (θα αντικατασταθεί από πραγματικά δεδομένα)
  const mockWalletData = {
    balance: user ? 1250.75 : 0,
    withdrawable: user ? 850.50 : 0,
    betCredits: user ? 125.00 : 0,
    currency: '€'
  };

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
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUserAnalytics(data);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
    }
  };

  const fetchCompetitionAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/competitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setCompetitionAnalytics(data);
    } catch (error) {
      console.error('Error fetching competition analytics:', error);
    }
  };

  const fetchAdvancedDashboard = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/advanced-dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAdvancedDashboard(data);
    } catch (error) {
      console.error('Error fetching advanced dashboard:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchEngagementMetrics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/engagement-metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setEngagementMetrics(data);
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
    } finally {
      setAnalyticsLoading(false);
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
    // Check if user is new (no bets, no activity)
    const isNewUser = !userData.total_bets || userData.total_bets === 0;
    
    // If user is new, show no activity
    if (isNewUser) {
      setRecentActivity([]);
      return;
    }
    
    // For users with activity, show relevant activity
    const activities = [];
    
    // Only show ranking if user has participated in something
    if (userData.total_bets > 0) {
      activities.push({
        type: 'rank_change', 
        message: `Your ranking updated to #${dashboardStats?.rank || 'Unranked'}`, 
        time: '2 hours ago',
        icon: '📈'
      });
    }
    
    // Only show achievements if user has earned them
    if (userData.total_bets >= 1) {
      activities.push({
        type: 'achievement', 
        message: 'First bet placed!', 
        time: '1 day ago',
        icon: '🏆'
      });
    }
    
    // Only show bet activity if user has bet history
    if (userData.total_bets > 0 && userData.won_bets > 0) {
      activities.push({
        type: 'bet_win', 
        message: 'Won a bet with 2.5x odds', 
        time: '2 days ago',
        icon: '🎯'
      });
    }
    
    // Profile updates for all users (reasonable assumption)
    if (userData.total_bets > 0) {
      activities.push({
        type: 'profile', 
        message: 'Profile updated successfully', 
        time: '3 days ago',
        icon: '👤'
      });
    }
    
    // Milestone only for users with actual bets
    if (userData.total_bets > 0) {
      activities.push({
        type: 'milestone', 
        message: `Reached ${userData.total_bets} total bets!`, 
        time: '5 days ago',
        icon: '🎯'
      });
    }
    
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

  // CMS Functions
  const fetchCmsContent = async () => {
    setCmsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cms/content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminCmsContent(data.content || []);
      }
    } catch (error) {
      console.error('Error fetching CMS content:', error);
    }
    setCmsLoading(false);
  };

  const fetchCmsThemes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cms/themes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCmsThemes(data.themes || []);
      }
    } catch (error) {
      console.error('Error fetching CMS themes:', error);
    }
  };

  const fetchActiveTheme = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cms/theme/active`);
      if (response.ok) {
        const data = await response.json();
        setActiveTheme(data);
      }
    } catch (error) {
      console.error('Error fetching active theme:', error);
    }
  };

  const handleCreateContent = async (e) => {
    e.preventDefault();
    setCmsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cms/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cmsContentForm)
      });
      
      if (response.ok) {
        showToast('Content created successfully!', 'success');
        fetchCmsContent();
        setShowCmsContentModal(false);
        setCmsContentForm({
          key: '',
          content_type: 'text',
          context: 'general',
          current_value: '',
          description: ''
        });
      } else {
        const errorData = await response.json();
        showToast(errorData.detail || 'Error creating content', 'error');
      }
    } catch (error) {
      console.error('Error creating content:', error);
      showToast('Error creating content', 'error');
    }
    
    setCmsLoading(false);
  };

  const handleUpdateContent = async (contentId, updatedData) => {
    setCmsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cms/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      
      if (response.ok) {
        showToast('Content updated successfully!', 'success');
        fetchCmsContent();
      } else {
        const errorData = await response.json();
        showToast(errorData.detail || 'Error updating content', 'error');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      showToast('Error updating content', 'error');
    }
    
    setCmsLoading(false);
  };

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Are you sure you want to delete this content item?')) {
      return;
    }

    setCmsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cms/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        showToast('Content deleted successfully!', 'success');
        fetchCmsContent();
      } else {
        const errorData = await response.json();
        showToast(errorData.detail || 'Error deleting content', 'error');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      showToast('Error deleting content', 'error');
    }
    
    setCmsLoading(false);
  };

  const handleCreateTheme = async (e) => {
    e.preventDefault();
    setCmsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cms/themes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cmsThemeForm)
      });
      
      if (response.ok) {
        showToast('Theme created successfully!', 'success');
        fetchCmsThemes();
        setShowCmsThemeModal(false);
        setCmsThemeForm({
          name: '',
          colors: {
            primary: '#4fc3f7',
            secondary: '#29b6f6',
            accent: '#ffd700',
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
            background: '#1a1a1a',
            surface: '#2a2a2a',
            text: '#ffffff'
          }
        });
      } else {
        const errorData = await response.json();
        showToast(errorData.detail || 'Error creating theme', 'error');
      }
    } catch (error) {
      console.error('Error creating theme:', error);
      showToast('Error creating theme', 'error');
    }
    
    setCmsLoading(false);
  };

  const handleActivateTheme = async (themeId) => {
    setCmsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cms/themes/${themeId}/activate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        showToast('Theme activated successfully!', 'success');
        fetchCmsThemes();
        fetchActiveTheme();
      } else {
        const errorData = await response.json();
        showToast(errorData.detail || 'Error activating theme', 'error');
      }
    } catch (error) {
      console.error('Error activating theme:', error);
      showToast('Error activating theme', 'error');
    }
    
    setCmsLoading(false);
  };

  const openContentEditor = (content = null) => {
    if (content) {
      setEditingContent(content);
      setCmsContentForm({
        key: content.key,
        content_type: content.content_type,
        context: content.context,
        current_value: content.current_value,
        description: content.description || ''
      });
    } else {
      setEditingContent(null);
      setCmsContentForm({
        key: '',
        content_type: 'text',
        context: 'general',
        current_value: '',
        description: ''
      });
    }
    setShowCmsContentModal(true);
  };

  const getContentByContext = () => {
    const contexts = {};
    adminCmsContent.forEach(item => {
      if (!contexts[item.context]) {
        contexts[item.context] = [];
      }
      contexts[item.context].push(item);
    });
    return contexts;
  };

  // Form states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    country: '',
    full_name: '',
    avatar_url: '',
    affiliate_code: ''
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

  // Friend system effects
  useEffect(() => {
    if (token && user) {
      fetchFriends();
      fetchFriendRequests();
      fetchFriendRecommendations();
    }
  }, [token, user]);

  // Search friends effect
  useEffect(() => {
    if (friendSearchQuery) {
      const timer = setTimeout(() => {
        searchFriends(friendSearchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setFriendSearchResults([]);
    }
  }, [friendSearchQuery]);

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
      fetchAdvancedDashboard();
      fetchEngagementMetrics();
    } else if (adminView === 'content' && token && isAdmin) {
      fetchContentPages();
      fetchMenuItems();
      // Also fetch CMS content and themes
      fetchCmsContent();
      fetchCmsThemes();
      fetchActiveTheme();
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
  // UI/UX ENHANCEMENT FUNCTIONS
  // =============================================================================

  const updateBreadcrumb = (path) => {
    setBreadcrumbPath(path);
  };

  const navigateWithBreadcrumb = (view, label, additionalParams = {}) => {
    setCurrentView(view);
    
    // Update breadcrumb based on navigation
    const newPath = [...breadcrumbPath];
    
    if (view === 'home') {
      updateBreadcrumb([{ label: 'Home', view: 'home' }]);
    } else if (view === 'teams') {
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'Teams', view: 'teams' }
      ]);
    } else if (view.startsWith('team-')) {
      const teamId = view.replace('team-', '');
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'Teams', view: 'teams' },
        { label: label || 'Team Details', view: view }
      ]);
    } else if (view === 'admin') {
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'Admin Panel', view: 'admin' }
      ]);
    }
  };

  const handleSwipeStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleSwipeEnd = (e) => {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;
    
    // Only process horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
      if (deltaX > 0) {
        // Swipe left - could implement next/forward navigation
        handleSwipeLeft();
      } else {
        // Swipe right - could implement back navigation
        handleSwipeRight();
      }
    }
    
    setTouchStartX(0);
    setTouchStartY(0);
  };

  const handleSwipeLeft = () => {
    // Implement forward navigation logic
    console.log('Swipe left detected');
  };

  const handleSwipeRight = () => {
    // Implement back navigation logic
    if (breadcrumbPath.length > 1) {
      const previousPath = breadcrumbPath[breadcrumbPath.length - 2];
      navigateWithBreadcrumb(previousPath.view, previousPath.label);
    }
  };

  const toggleFloatingMenu = () => {
    setShowFloatingMenu(!showFloatingMenu);
  };

  // Mobile dropdown handlers
  const toggleMobileDropdown = (dropdownType) => {
    if (dropdownType === 'rankings') {
      setShowRankingsDropdown(!showRankingsDropdown);
      setShowTournamentsDropdown(false);
      setShowTeamsDropdown(false);
      setShowGuildsDropdown(false);
      setShowStandingsDropdown(false);
      setShowSettingsDropdown(false);
    } else if (dropdownType === 'tournaments') {
      setShowTournamentsDropdown(!showTournamentsDropdown);
      setShowRankingsDropdown(false);
      setShowTeamsDropdown(false);
      setShowGuildsDropdown(false);
      setShowStandingsDropdown(false);
      setShowSettingsDropdown(false);
    } else if (dropdownType === 'teams') {
      setShowTeamsDropdown(!showTeamsDropdown);
      setShowRankingsDropdown(false);
      setShowTournamentsDropdown(false);
      setShowGuildsDropdown(false);
      setShowStandingsDropdown(false);
      setShowSettingsDropdown(false);
    } else if (dropdownType === 'guilds') {
      setShowGuildsDropdown(!showGuildsDropdown);
      setShowRankingsDropdown(false);
      setShowTournamentsDropdown(false);
      setShowTeamsDropdown(false);
      setShowStandingsDropdown(false);
      setShowSettingsDropdown(false);
    } else if (dropdownType === 'standings') {
      setShowStandingsDropdown(!showStandingsDropdown);
      setShowRankingsDropdown(false);
      setShowTournamentsDropdown(false);
      setShowTeamsDropdown(false);
      setShowGuildsDropdown(false);
      setShowSettingsDropdown(false);
    } else if (dropdownType === 'settings') {
      setShowSettingsDropdown(!showSettingsDropdown);
      setShowRankingsDropdown(false);
      setShowTournamentsDropdown(false);
      setShowTeamsDropdown(false);
      setShowGuildsDropdown(false);
      setShowStandingsDropdown(false);
      // Close account submenu when settings dropdown closes
      if (showSettingsDropdown) {
        setShowAccountSubmenu(false);
      }
    }
  };

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.nav-dropdown')) {
        setShowRankingsDropdown(false);
        setShowTournamentsDropdown(false);
        setShowTeamsDropdown(false);
        setShowGuildsDropdown(false);
        setShowStandingsDropdown(false);
        setShowSettingsDropdown(false);
        setShowAccountSubmenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Initialize breadcrumb on app load
  useEffect(() => {
    if (currentView === 'home') {
      updateBreadcrumb([{ label: 'Home', view: 'home' }]);
    }
  }, []);

  // Update breadcrumb when currentView changes
  useEffect(() => {
    if (currentView === 'teams') {
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'Teams', view: 'teams' }
      ]);
    } else if (currentView.startsWith('team-')) {
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'Teams', view: 'teams' },
        { label: 'Team Details', view: currentView }
      ]);
    } else if (currentView === 'guilds') {
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'Guilds', view: 'guilds' }
      ]);
    } else if (currentView === 'guild-rankings') {
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'Guild Rankings', view: 'guild-rankings' }
      ]);
    } else if (currentView === 'create-guild') {
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'Guilds', view: 'guilds' },
        { label: 'Create Guild', view: 'create-guild' }
      ]);
    } else if (currentView === 'my-guild') {
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'My Guild', view: 'my-guild' }
      ]);
    } else if (currentView.startsWith('guild-')) {
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'Guilds', view: 'guilds' },
        { label: 'Guild Details', view: currentView }
      ]);
    } else if (currentView === 'guild-wars') {
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'Guild Wars', view: 'guild-wars' }
      ]);
    } else if (currentView === 'admin') {
      updateBreadcrumb([
        { label: 'Home', view: 'home' },
        { label: 'Admin Panel', view: 'admin' }
      ]);
    }
  }, [currentView]);

  // =============================================================================
  // NATIONAL LEAGUE SYSTEM FUNCTIONS
  // =============================================================================

  const fetchNationalLeagues = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/national-leagues`);
      if (response.ok) {
        const data = await response.json();
        setNationalLeagues(data.countries);
      } else {
        showToast('Failed to fetch national leagues', 'error');
      }
    } catch (error) {
      console.error('Error fetching national leagues:', error);
      showToast('Failed to fetch national leagues', 'error');
    }
  };

  const fetchLeagueStandings = async (country, leagueType) => {
    setStandingsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/national-leagues/${country}/${leagueType}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedLeague(data);
        setLeagueStandings(data.standings || []);
      } else {
        showToast('Failed to fetch league standings', 'error');
      }
    } catch (error) {
      console.error('Error fetching league standings:', error);
      showToast('Failed to fetch league standings', 'error');
    } finally {
      setStandingsLoading(false);
    }
  };

  const assignTeamToLeague = async (teamId, country, leagueType) => {
    if (!token || !isAdmin) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/assign-team-to-league`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team_id: teamId,
          country: country,
          league_type: leagueType
        })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        fetchTeamsWithoutLeague(); // Refresh list
        fetchNationalLeagues(); // Refresh leagues
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to assign team to league', 'error');
      }
    } catch (error) {
      console.error('Error assigning team to league:', error);
      showToast('Failed to assign team to league', 'error');
    }
  };

  const fetchTeamsWithoutLeague = async () => {
    if (!token || !isAdmin) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teams-without-league`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeamsWithoutLeague(data.teams);
      } else {
        showToast('Failed to fetch teams without league', 'error');
      }
    } catch (error) {
      console.error('Error fetching teams without league:', error);
      showToast('Failed to fetch teams without league', 'error');
    }
  };

  const initializeCountryLeagues = async (country) => {
    if (!token || !isAdmin) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/initialize-country-leagues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ country })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        fetchNationalLeagues(); // Refresh leagues
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to initialize country leagues', 'error');
      }
    } catch (error) {
      console.error('Error initializing country leagues:', error);
      showToast('Failed to initialize country leagues', 'error');
    }
  };

  const initializeDefaultCountries = async () => {
    if (!token || !isAdmin) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/initialize-default-countries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        fetchNationalLeagues(); // Refresh leagues
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to initialize default countries', 'error');
      }
    } catch (error) {
      console.error('Error initializing default countries:', error);
      showToast('Failed to initialize default countries', 'error');
    }
  };

  const createCustomLeague = async () => {
    if (!token || !isAdmin || !newLeagueCountry.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/initialize-country-leagues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ country: newLeagueCountry.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(`League created for ${newLeagueCountry}!`, 'success');
        setNewLeagueCountry(''); // Clear input
        fetchNationalLeagues(); // Refresh leagues
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to create league', 'error');
      }
    } catch (error) {
      console.error('Error creating custom league:', error);
      showToast('Failed to create league', 'error');
    }
  };

  const generateAllFixtures = async () => {
    if (!token || !isAdmin) return;
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      // Get all leagues with teams
      for (const country of nationalLeagues) {
        if (country.premier && country.premier.teams && country.premier.teams.length >= 2) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/admin/generate-league-fixtures`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ league_id: country.premier.id })
            });
            
            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }
        
        if (country.league_2 && country.league_2.teams && country.league_2.teams.length >= 2) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/admin/generate-league-fixtures`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ league_id: country.league_2.id })
            });
            
            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }
      }
      
      if (successCount > 0) {
        showToast(`Generated fixtures for ${successCount} league(s)!`, 'success');
      }
      if (errorCount > 0) {
        showToast(`Failed to generate fixtures for ${errorCount} league(s)`, 'error');
      }
      if (successCount === 0 && errorCount === 0) {
        showToast('No leagues with sufficient teams found', 'info');
      }
    } catch (error) {
      console.error('Error generating fixtures:', error);
      showToast('Failed to generate fixtures', 'error');
    }
  };

  // =============================================================================
  // FIXTURES FUNCTIONS
  // =============================================================================

  const fetchLeagueFixtures = async (country, leagueType) => {
    setFixturesLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/league-fixtures/${country}/${leagueType}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedLeagueForFixtures(data.league);
        setLeagueFixtures(data.matchdays || []);
        setSelectedMatchday(1);
      } else {
        showToast('Failed to fetch league fixtures', 'error');
      }
    } catch (error) {
      console.error('Error fetching league fixtures:', error);
      showToast('Failed to fetch league fixtures', 'error');
    } finally {
      setFixturesLoading(false);
    }
  };

  const generateLeagueFixtures = async (leagueId) => {
    if (!token || !isAdmin) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/generate-league-fixtures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ league_id: leagueId })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        // Refresh fixtures if we're viewing this league
        if (selectedLeagueForFixtures && selectedLeagueForFixtures.id === leagueId) {
          const country = selectedLeagueForFixtures.country;
          const leagueType = selectedLeagueForFixtures.league_type;
          fetchLeagueFixtures(country, leagueType);
        }
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to generate fixtures', 'error');
      }
    } catch (error) {
      console.error('Error generating fixtures:', error);
      showToast('Failed to generate fixtures', 'error');
    }
  };

  // Load national leagues when switching to team management tab
  useEffect(() => {
    if (adminView === 'team-management' && token && isAdmin) {
      fetchAdminTeams();
    }
  }, [adminView, token, isAdmin]);

  // Load national leagues on app start
  useEffect(() => {
    fetchNationalLeagues();
  }, []);

  // Load teams without league for admin
  useEffect(() => {
    if (adminView === 'team-management' && token && isAdmin) {
      fetchTeamsWithoutLeague();
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

  const renderTeamDetails = () => {
    const teamId = currentView.replace('team-', '');

    if (teamLoading || !selectedTeamDetails) {
      return (
        <motion.div 
          className="team-details-page"
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          <div className="container">
            <EnhancedLoader message="Loading team details..." size="large" />
          </div>
        </motion.div>
      );
    }

    const team = selectedTeamDetails;

    return (
      <motion.div 
        className="team-details-page"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <div className="container">
          <motion.div className="team-details-header">
            <motion.button 
              className="btn btn-secondary"
              onClick={() => navigateWithBreadcrumb('teams', 'Teams')}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              ← Back to Teams
            </motion.button>
            <h2>{team.name}</h2>
          </motion.div>

          <motion.div className="team-details-content">
            {/* Team Information */}
            <motion.div className="team-info-section">
              <div className="team-logo-large">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={`${team.name} logo`} />
                ) : (
                  <div className="default-logo-large" style={{backgroundColor: team.colors?.primary || '#FF0000'}}>
                    {team.name.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="team-info-details">
                <h3>{team.name}</h3>
                <p>📍 {team.city}, {team.country}</p>
                <p>👑 Captain: {team.captain_name}</p>
                <p>📧 Email: {team.email}</p>
                {team.phone && <p>📱 Phone: {team.phone}</p>}
                <p>👥 Players: {team.current_player_count}/20</p>
                <p>📊 Status: {team.status}</p>
                
                <div className="team-colors-display">
                  <div className="color-display">
                    <div 
                      className="color-swatch" 
                      style={{backgroundColor: team.colors?.primary}}
                    ></div>
                    <span>Primary</span>
                  </div>
                  {team.colors?.secondary && (
                    <div className="color-display">
                      <div 
                        className="color-swatch" 
                        style={{backgroundColor: team.colors.secondary}}
                      ></div>
                      <span>Secondary</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Team Members */}
            <motion.div className="team-members-section">
              <h3>Team Members</h3>
              <div className="members-grid">
                {team.members && team.members.map((member, index) => (
                  <motion.div 
                    key={member.id} 
                    className="member-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="member-avatar">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.username} />
                      ) : (
                        <div className="default-avatar">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="member-info">
                      <h4>{member.full_name}</h4>
                      <p>@{member.username}</p>
                      <p>{member.country}</p>
                      {member.id === team.captain_id && (
                        <span className="captain-badge">👑 Captain</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Captain Actions & Invitation Stats */}
            {user && user.id === team.captain_id && (
              <motion.div className="captain-section">
                <h3>Captain Actions</h3>
                <div className="captain-actions">
                  <motion.button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedTeamForInvite(team);
                      setShowTeamInviteModal(true);
                    }}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    📧 Invite Player
                  </motion.button>
                  <motion.button 
                    className="btn btn-primary"
                    onClick={() => openEditTeamModal(team)}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    ✏️ Edit Team
                  </motion.button>
                </div>

                {/* Invitation Statistics */}
                <div className="invitation-stats">
                  <h4>Invitation Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-number">{team.pending_invitations_count || 0}</span>
                      <span className="stat-label">Pending Invitations</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{team.current_player_count - 1}</span>
                      <span className="stat-label">Accepted Members</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{20 - team.current_player_count}</span>
                      <span className="stat-label">Available Spots</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
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

  // Join tournament with payment integration
  const joinTournament = async (tournamentId) => {
    console.log('🎯 joinTournament called with:', tournamentId);
    if (!token) {
      alert(t.loginRequired || 'Please login to join tournaments');
      return;
    }
    
    // Get tournament details to check entry fee
    const tournament = tournaments.find(t => t.id === tournamentId) || selectedTournament;
    console.log('🏆 Tournament found:', tournament);
    console.log('💰 Entry fee:', tournament?.entry_fee);
    
    if (!tournament) {
      alert('Tournament not found');
      return;
    }
    
    // If tournament has an entry fee, show payment modal
    if (tournament.entry_fee > 0) {
      console.log('💳 Showing payment modal for entry fee:', tournament.entry_fee);
      setSelectedTournamentForPayment(tournament);
      setShowPaymentModal(true);
      return;
    }
    
    console.log('🆓 Free tournament, joining directly');
    // If free tournament, join directly
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
        const errorMessage = error.detail || 'Failed to join tournament';
        
        // Check if it's an insufficient balance error
        if (errorMessage.toLowerCase().includes('insufficient') || 
            errorMessage.toLowerCase().includes('balance') || 
            errorMessage.toLowerCase().includes('funds') ||
            errorMessage.includes('€')) {
          // Show beautiful insufficient balance modal
          setInsufficientBalanceModal({
            show: true,
            message: errorMessage,
            tournamentId: tournamentId
          });
        } else {
          // Show regular alert for other errors
          alert(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error joining tournament:', error);
      alert('Error joining tournament');
    }
  };

  // Payment System Functions
  const fetchPaymentConfig = async () => {
    try {
      console.log('🔧 Fetching payment config...');
      const response = await fetch(`${API_BASE_URL}/api/payments/config`);
      if (response.ok) {
        const config = await response.json();
        console.log('💳 Payment config loaded:', config);
        setPaymentConfig(config);
        
        // Initialize Stripe if available
        if (config.stripe_enabled && config.stripe_public_key) {
          console.log('🔹 Initializing Stripe...');
          const stripe = await loadStripe(config.stripe_public_key);
          setStripePromise(stripe);
        }
      } else {
        console.error('❌ Failed to fetch payment config:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching payment config:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const createPaymentSession = async (provider) => {
    if (!selectedTournamentForPayment || !token) return;
    
    setPaymentLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/create-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          tournament_id: selectedTournamentForPayment.id,
          amount: selectedTournamentForPayment.entry_fee,
          currency: 'USD',
          provider: provider
        })
      });
      
      if (response.ok) {
        const session = await response.json();
        setPaymentSession(session);
        
        // Redirect to payment gateway
        if (session.checkout_url) {
          window.location.href = session.checkout_url;
        }
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to create payment session');
      }
    } catch (error) {
      console.error('Error creating payment session:', error);
      alert('Error creating payment session');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    if (!token || !payoutRequestForm.amount || !payoutRequestForm.payout_account) {
      alert('Please fill in all required fields');
      return;
    }
    
    setPaymentLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/payout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(payoutRequestForm.amount),
          provider: payoutRequestForm.provider,
          payout_account: payoutRequestForm.payout_account,
          metadata: { notes: payoutRequestForm.notes }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'Payout request submitted successfully');
        setShowPayoutRequestModal(false);
        setPayoutRequestForm({
          amount: '',
          provider: 'stripe',
          payout_account: '',
          notes: ''
        });
        // Refresh wallet data
        fetchWalletBalance();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to submit payout request');
      }
    } catch (error) {
      console.error('Error submitting payout request:', error);
      alert('Error submitting payout request');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Social Sharing Functions
  const createSocialShare = async (shareType, referenceId, platform, customMessage = '') => {
    if (!token) return;
    
    setShareLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          share_type: shareType,
          reference_id: referenceId,
          platform: platform,
          custom_message: customMessage
        })
      });
      
      if (response.ok) {
        const shareData = await response.json();
        setShareContent(shareData);
        setShowSocialShareModal(true);
        return shareData;
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to create share');
      }
    } catch (error) {
      console.error('Error creating social share:', error);
      alert('Error creating social share');
    } finally {
      setShareLoading(false);
    }
  };

  const markAsShared = async (shareId) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/share/${shareId}/shared`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setShowShareSuccessModal(true);
        setShowSocialShareModal(false);
        // Refresh social stats
        fetchSocialStats();
      }
    } catch (error) {
      console.error('Error marking share as shared:', error);
    }
  };

  const fetchSocialStats = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const stats = await response.json();
        setSocialStats(stats);
      }
    } catch (error) {
      console.error('Error fetching social stats:', error);
    }
  };

  const fetchUserShares = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/user/shares`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSocialShares(data.shares || []);
      }
    } catch (error) {
      console.error('Error fetching user shares:', error);
    }
  };

  const fetchViralContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/viral-content`);
      if (response.ok) {
        const data = await response.json();
        setViralContent(data.viral_content || []);
      }
    } catch (error) {
      console.error('Error fetching viral content:', error);
    }
  };

  const shareTournamentVictory = async (tournamentId, platform) => {
    if (!token) return;
    
    setShareLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/share-victory`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platform })
      });
      
      if (response.ok) {
        const shareData = await response.json();
        setShareContent(shareData);
        setShowSocialShareModal(true);
        return shareData;
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to share tournament victory');
      }
    } catch (error) {
      console.error('Error sharing tournament victory:', error);
      alert('Error sharing tournament victory');
    } finally {
      setShareLoading(false);
    }
  };

  const shareTeamFormation = async (teamId, platform) => {
    if (!token) return;
    
    setShareLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          share_type: 'team_formation',
          reference_id: teamId,
          platform: platform,
          custom_message: `Check out our amazing team formation! 🚀`
        })
      });
      
      if (response.ok) {
        const shareData = await response.json();
        setShareContent(shareData);
        setShowSocialShareModal(true);
        return shareData;
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to share team formation');
      }
    } catch (error) {
      console.error('Error sharing team formation:', error);
      alert('Error sharing team formation');
    } finally {
      setShareLoading(false);
    }
  };

  const shareAchievement = async (achievementData, platform) => {
    if (!token) return;
    
    setShareLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/achievements/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          achievement_data: achievementData,
          platform 
        })
      });
      
      if (response.ok) {
        const shareData = await response.json();
        setShareContent(shareData);
        setShowSocialShareModal(true);
        return shareData;
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to share achievement');
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      alert('Error sharing achievement');
    } finally {
      setShareLoading(false);
    }
  };

  const openNativeShare = (shareContent) => {
    if (navigator.share) {
      navigator.share({
        title: shareContent.title,
        text: shareContent.description,
        url: shareContent.share_url
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${shareContent.title}\n\n${shareContent.description}\n\n${shareContent.share_url}`);
      alert('Share content copied to clipboard!');
    }
  };

  const openSocialPlatform = (platform, shareContent) => {
    const encodedTitle = encodeURIComponent(shareContent.title);
    const encodedDescription = encodeURIComponent(shareContent.description);
    const encodedUrl = encodeURIComponent(shareContent.share_url);
    const hashtags = shareContent.hashtags ? shareContent.hashtags.join(',') : '';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${hashtags}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`;
        break;
      case 'instagram':
        // Instagram doesn't have a direct share URL, so we'll copy to clipboard
        navigator.clipboard.writeText(`${shareContent.title}\n\n${shareContent.description}\n\n${shareContent.share_url}`);
        alert('Content copied to clipboard! Paste it as a story or post on Instagram.');
        return;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'discord':
        // Discord doesn't have a direct share URL, so we'll copy to clipboard
        navigator.clipboard.writeText(`${shareContent.title}\n\n${shareContent.description}\n\n${shareContent.share_url}`);
        alert('Share content copied to clipboard! Paste it in Discord.');
        return;
      default:
        openNativeShare(shareContent);
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    
    // Mark as shared after opening
    if (shareContent.share_id) {
      markAsShared(shareContent.share_id);
    }
  };

  // =============================================================================
  // FRIEND IMPORT SYSTEM FUNCTIONS
  // =============================================================================

  const fetchFriends = async () => {
    if (!token) return;
    
    setFriendsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFriendsData(data.friends || []);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const fetchFriendRecommendations = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/recommendations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFriendRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching friend recommendations:', error);
    }
  };

  const searchFriends = async (query) => {
    if (!token || !query || query.length < 2) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFriendSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Error searching friends:', error);
    }
  };

  const sendFriendRequest = async (recipientId) => {
    if (!token) return;
    
    setFriendActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/send-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipient_id: recipientId })
      });
      
      if (response.ok) {
        alert('Friend request sent successfully!');
        // Refresh search results
        if (friendSearchQuery) {
          searchFriends(friendSearchQuery);
        }
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Error sending friend request');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const respondFriendRequest = async (requestId, action) => {
    if (!token) return;
    
    setFriendActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/respond-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request_id: requestId, action: action })
      });
      
      if (response.ok) {
        alert(`Friend request ${action}ed successfully!`);
        fetchFriendRequests();
        if (action === 'accept') {
          fetchFriends();
        }
      } else {
        const error = await response.json();
        alert(error.detail || `Failed to ${action} friend request`);
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
      alert('Error responding to friend request');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const importFriends = async () => {
    if (!token) return;
    
    setFriendActionLoading(true);
    try {
      const emails = friendImportEmails
        .split('\n')
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));
      
      const response = await fetch(`${API_BASE_URL}/api/friends/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: friendImportProvider,
          emails: emails
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Found ${data.total_imported} friends to connect with!`);
        setShowFriendImportModal(false);
        setFriendImportEmails('');
        fetchFriends();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to import friends');
      }
    } catch (error) {
      console.error('Error importing friends:', error);
      alert('Error importing friends');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const removeFriend = async (friendId) => {
    if (!token) return;
    
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    setFriendActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/remove`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friend_id: friendId })
      });
      
      if (response.ok) {
        alert('Friend removed successfully!');
        fetchFriends();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Error removing friend');
    } finally {
      setFriendActionLoading(false);
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
    setTeamLoading(true); // Add loading state
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`);
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setTeamLoading(false); // Clear loading state
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
      showToast('Please fill in all required fields', 'warning');
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
        showToast(`Team "${data.team_name}" created successfully! 🏆`, 'success');
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
          showToast(error.detail || 'Failed to create team', 'error');
        } catch (e) {
          console.log('❌ Could not parse error as JSON');
          showToast(errorText || 'Failed to create team', 'error');
        }
      }
    } catch (error) {
      console.error('💥 Network/other error:', error);
      showToast(`Network error: ${error.message}`, 'error');
    } finally {
      setTeamLoading(false);
    }
  };

  const invitePlayerToTeam = async (teamId) => {
    if (!inviteUsername.trim()) {
      showToast('Please enter a username', 'warning');
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
        showToast(data.message, 'success');
        setShowTeamInviteModal(false);
        setInviteUsername('');
        setSelectedTeamForInvite(null);
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to send invitation', 'error');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      showToast('Failed to send invitation', 'error');
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
        showToast(data.message, 'success');
        fetchTeamInvitations(); // Refresh invitations
        fetchProfile(); // Update user profile
        fetchTeams(); // Refresh teams
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to accept invitation', 'error');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showToast('Failed to accept invitation', 'error');
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
        showToast('Invitation declined', 'info');
        fetchTeamInvitations(); // Refresh invitations
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to decline invitation', 'error');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      showToast('Failed to decline invitation', 'error');
    } finally {
      setTeamLoading(false);
    }
  };

  // Edit Team Functions
  const openEditTeamModal = (team) => {
    setSelectedTeamForEdit(team);
    setEditTeamFormData({
      name: team.name,
      logo_url: team.logo_url || '',
      colors: { primary: team.colors?.primary || '#FF0000', secondary: team.colors?.secondary || '#FFFFFF' },
      city: team.city,
      country: team.country,
      phone: team.phone,
      email: team.email
    });
    setLogoPreview(team.logo_url || null);
    setShowEditTeamModal(true);
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setLogoUpload(base64);
        setLogoPreview(base64);
        setEditTeamFormData(prev => ({ ...prev, logo_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTeam = async () => {
    console.log('🔄 UPDATE TEAM CALLED');
    console.log('📝 Edit form data:', editTeamFormData);
    console.log('👥 Selected team:', selectedTeamForEdit);
    
    if (!selectedTeamForEdit) {
      console.log('❌ No selected team for edit');
      return;
    }
    
    if (!editTeamFormData.name || !editTeamFormData.city || !editTeamFormData.country || !editTeamFormData.email) {
      console.log('❌ Missing required fields');
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    
    console.log('🚀 Sending update request...');
    setTeamLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${selectedTeamForEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editTeamFormData)
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success data:', data);
        showToast(data.message, 'success');
        setShowEditTeamModal(false);
        setSelectedTeamForEdit(null);
        setLogoUpload(null);
        setLogoPreview(null);
        fetchTeams(); // Refresh teams list
      } else {
        const error = await response.json();
        console.log('❌ Error response:', error);
        showToast(error.detail || 'Failed to update team', 'error');
      }
    } catch (error) {
      console.error('💥 Network/other error:', error);
      showToast('Failed to update team', 'error');
    } finally {
      setTeamLoading(false);
    }
  };

  const fetchTeamDetails = async (teamId) => {
    setTeamLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTeamDetails(data);
        
        // If user is captain, get invitation stats
        if (user && user.id === data.captain_id) {
          const invitationResponse = await fetch(`${API_BASE_URL}/api/teams/my-invitations`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (invitationResponse.ok) {
            const invitationData = await invitationResponse.json();
            setTeamInvitationStats(invitationData);
          }
        }
      } else {
        showToast('Failed to fetch team details', 'error');
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      showToast('Failed to fetch team details', 'error');
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

  // Fetch team details when navigating to team details view
  useEffect(() => {
    if (currentView.startsWith('team-')) {
      const teamId = currentView.replace('team-', '');
      fetchTeamDetails(teamId);
    }
  }, [currentView]);

  // =============================================================================
  // ADMIN TEAM MANAGEMENT FUNCTIONS
  // =============================================================================

  const fetchAdminTeams = async () => {
    if (!token || !isAdmin) return;
    
    setAdminTeamLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminTeams(data.teams);
        setFilteredTeams(data.teams);
      } else {
        showToast('Failed to fetch admin teams', 'error');
      }
    } catch (error) {
      console.error('Error fetching admin teams:', error);
      showToast('Failed to fetch admin teams', 'error');
    } finally {
      setAdminTeamLoading(false);
    }
  };

  const handleTeamSearch = (searchTerm) => {
    setTeamSearchTerm(searchTerm);
    filterTeams(searchTerm, teamStatusFilter);
  };

  const handleTeamStatusFilter = (status) => {
    setTeamStatusFilter(status);
    filterTeams(teamSearchTerm, status);
  };

  const filterTeams = (searchTerm, statusFilter) => {
    let filtered = adminTeams;
    
    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(team => 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.captain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.captain_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'verified') {
        filtered = filtered.filter(team => team.verification_status === 'verified');
      } else if (statusFilter === 'unverified') {
        filtered = filtered.filter(team => team.verification_status === 'unverified');
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(team => team.verification_status === 'pending');
      } else if (statusFilter === 'suspended') {
        filtered = filtered.filter(team => team.status === 'suspended');
      }
    }
    
    setFilteredTeams(filtered);
  };

  const updateTeamVerification = async (teamId, verification_status, admin_notes = '') => {
    if (!token || !isAdmin) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teams/${teamId}/verification`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verification_status, admin_notes })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        fetchAdminTeams(); // Refresh list
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to update verification', 'error');
      }
    } catch (error) {
      console.error('Error updating verification:', error);
      showToast('Failed to update verification', 'error');
    }
  };

  const updateTeamStatus = async (teamId, status, reason = '') => {
    if (!token || !isAdmin) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teams/${teamId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, reason })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        fetchAdminTeams(); // Refresh list
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const deleteTeamAdmin = async (teamId, teamName) => {
    if (!token || !isGod) return;
    
    if (!confirm(`Are you sure you want to permanently delete team "${teamName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teams/${teamId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        fetchAdminTeams(); // Refresh list
        setSelectedTeamsForBulk(selectedTeamsForBulk.filter(id => id !== teamId));
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to delete team', 'error');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      showToast('Failed to delete team', 'error');
    }
  };

  const performBulkTeamAction = async (action, actionData = {}) => {
    if (!token || !isAdmin || selectedTeamsForBulk.length === 0) return;
    
    const teamCount = selectedTeamsForBulk.length;
    if (!confirm(`Are you sure you want to ${action} ${teamCount} selected teams?`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teams/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team_ids: selectedTeamsForBulk,
          action,
          action_data: actionData
        })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(`${data.message}: ${data.total_successful} successful, ${data.total_failed} failed`, 'success');
        fetchAdminTeams(); // Refresh list
        setSelectedTeamsForBulk([]); // Clear selection
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to perform bulk action', 'error');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showToast('Failed to perform bulk action', 'error');
    }
  };

  // =============================================================================
  // GUILD SYSTEM FUNCTIONS
  // =============================================================================

  // Fetch all guilds
  const fetchGuilds = async (filters = {}) => {
    setGuildsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.country) params.append('country', filters.country);
      if (filters.recruitmentOpen !== undefined) params.append('recruitment_open', filters.recruitmentOpen);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_BASE_URL}/api/guilds?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setGuilds(data.guilds);
      } else {
        console.error('Failed to fetch guilds:', response.status);
      }
    } catch (error) {
      console.error('Error fetching guilds:', error);
      showToast('Error loading guilds', 'error');
    } finally {
      setGuildsLoading(false);
    }
  };

  // Fetch guild details
  const fetchGuildDetails = async (guildId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/guilds/${guildId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedGuild(data.guild);
        return data.guild;
      }
    } catch (error) {
      console.error('Error fetching guild details:', error);
      showToast('Error loading guild details', 'error');
    }
    return null;
  };

  // Create a new guild
  const createGuild = async (guildData) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/guilds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(guildData)
      });
      
      if (response.ok) {
        const data = await response.json();
        showToast('Guild created successfully!', 'success');
        setMyGuild(data.guild);
        fetchGuilds();
        return data.guild;
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to create guild', 'error');
      }
    } catch (error) {
      console.error('Error creating guild:', error);
      showToast('Error creating guild', 'error');
    }
    return null;
  };

  // Invite player to guild
  const inviteToGuild = async (guildId, username, message = '') => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/guilds/${guildId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, message })
      });
      
      if (response.ok) {
        showToast(`Invitation sent to ${username}!`, 'success');
        return true;
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to send invitation', 'error');
      }
    } catch (error) {
      console.error('Error sending guild invitation:', error);
      showToast('Error sending invitation', 'error');
    }
    return false;
  };

  // Fetch user's guild invitations
  const fetchGuildInvitations = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/guilds/my-invitations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGuildInvitations(data.invitations);
      }
    } catch (error) {
      console.error('Error fetching guild invitations:', error);
    }
  };

  // Accept guild invitation
  const acceptGuildInvitation = async (invitationId) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/guilds/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        showToast('Successfully joined guild!', 'success');
        fetchGuildInvitations();
        fetchMyGuild();
        return true;
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to join guild', 'error');
      }
    } catch (error) {
      console.error('Error accepting guild invitation:', error);
      showToast('Error joining guild', 'error');
    }
    return false;
  };

  // Decline guild invitation
  const declineGuildInvitation = async (invitationId) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/guilds/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        showToast('Invitation declined', 'success');
        fetchGuildInvitations();
        return true;
      }
    } catch (error) {
      console.error('Error declining guild invitation:', error);
      showToast('Error declining invitation', 'error');
    }
    return false;
  };

  // Fetch guild rankings
  const fetchGuildRankings = async (rankingType = 'power_rating', country = null) => {
    try {
      const params = new URLSearchParams();
      params.append('ranking_type', rankingType);
      if (country) params.append('country', country);

      const response = await fetch(`${API_BASE_URL}/api/guilds/rankings?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setGuildRankings(data.rankings);
      }
    } catch (error) {
      console.error('Error fetching guild rankings:', error);
      showToast('Error loading guild rankings', 'error');
    }
  };

  // Fetch user's guild (if they're in one)
  const fetchMyGuild = async () => {
    if (!token || !user) return;
    
    try {
      // This would need to be implemented in backend to get user's current guild
      // For now, we'll check guild invitations and see if user is in any guild
      await fetchGuildInvitations();
    } catch (error) {
      console.error('Error fetching my guild:', error);
    }
  };

  // Challenge guild to war
  const challengeGuildToWar = async (guildId, targetGuildId, warType = 'classic') => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/guilds/${guildId}/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          target_guild_id: targetGuildId,
          war_type: warType
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        showToast('Guild war challenge sent!', 'success');
        return data.war;
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to challenge guild', 'error');
      }
    } catch (error) {
      console.error('Error challenging guild to war:', error);
      showToast('Error sending challenge', 'error');
    }
    return null;
  };

  // Fetch guild wars
  const fetchGuildWars = async (guildId, status = null) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const response = await fetch(`${API_BASE_URL}/api/guilds/${guildId}/wars?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setGuildWars(data.wars);
      }
    } catch (error) {
      console.error('Error fetching guild wars:', error);
    }
  };

  // Load guilds when component mounts or when view changes to guilds
  useEffect(() => {
    if (currentView === 'guilds') {
      fetchGuilds();
    } else if (currentView === 'guild-rankings') {
      fetchGuildRankings();
    } else if (currentView.startsWith('guild-') && currentView !== 'guilds' && currentView !== 'guild-rankings' && currentView !== 'guild-wars' && currentView !== 'create-guild' && currentView !== 'my-guild') {
      // This is a guild details page (e.g., 'guild-123')
      const guildId = currentView.replace('guild-', '');
      fetchGuildDetails(guildId);
    }
  }, [currentView]);

  // Load user's guild data when user logs in
  useEffect(() => {
    if (user && token) {
      fetchMyGuild();
    }
  }, [user, token]);

  // =============================================================================
  // SPORTSDUEL SYSTEM FUNCTIONS
  // =============================================================================

  // Fetch all SportsDuel leagues
  const fetchSportsduelLeagues = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sportsduel/leagues`);
      if (response.ok) {
        const data = await response.json();
        setSportsduelLeagues(data.leagues);
        if (data.leagues.length > 0 && !currentSportsduelLeague) {
          setCurrentSportsduelLeague(data.leagues[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching SportsDuel leagues:', error);
    }
  };

  // Fetch SportsDuel teams for current league
  const fetchSportsduelTeams = async (leagueId = null) => {
    try {
      const leagueParam = leagueId || (currentSportsduelLeague ? currentSportsduelLeague.id : '');
      const response = await fetch(`${API_BASE_URL}/api/sportsduel/teams?league_id=${leagueParam}`);
      if (response.ok) {
        const data = await response.json();
        setSportsduelTeams(data.teams);
      }
    } catch (error) {
      console.error('Error fetching SportsDuel teams:', error);
    }
  };

  // Fetch SportsDuel matches
  const fetchSportsduelMatches = async (leagueId = null) => {
    try {
      setSportsduelLoading(true);
      const leagueParam = leagueId || (currentSportsduelLeague ? currentSportsduelLeague.id : '');
      const response = await fetch(`${API_BASE_URL}/api/sportsduel/matches?league_id=${leagueParam}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setSportsduelMatches(data.matches);
      }
    } catch (error) {
      console.error('Error fetching SportsDuel matches:', error);
    } finally {
      setSportsduelLoading(false);
    }
  };

  // Fetch SportsDuel scoreboard
  const fetchSportsduelScoreboard = async (leagueId = null) => {
    try {
      setSportsduelLoading(true);
      const leagueParam = leagueId || (currentSportsduelLeague ? currentSportsduelLeague.id : '');
      const response = await fetch(`${API_BASE_URL}/api/sportsduel/scoreboard/${leagueParam}`);
      if (response.ok) {
        const data = await response.json();
        setSportsduelScoreboard(data.scoreboard);
      }
    } catch (error) {
      console.error('Error fetching SportsDuel scoreboard:', error);
    } finally {
      setSportsduelLoading(false);
    }
  };

  // Create SportsDuel team (Sports Cafe)
  const createSportsduelTeam = async (teamData) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sportsduel/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teamData)
      });

      if (response.ok) {
        const data = await response.json();
        showToast('Sports Cafe team created successfully!', 'success');
        fetchSportsduelTeams();
        return data.team;
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to create sports cafe team', 'error');
      }
    } catch (error) {
      console.error('Error creating SportsDuel team:', error);
      showToast('Error creating sports cafe team', 'error');
    }
    return null;
  };

  // Join SportsDuel team as player
  const joinSportsduelTeam = async (teamId, playerData) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sportsduel/teams/${teamId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(playerData)
      });

      if (response.ok) {
        const data = await response.json();
        showToast('Successfully joined team!', 'success');
        setMyPlayerProfile(data.player);
        return data.player;
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to join team', 'error');
      }
    } catch (error) {
      console.error('Error joining SportsDuel team:', error);
      showToast('Error joining team', 'error');
    }
    return null;
  };

  // Create SportsDuel coupon
  const createSportsduelCoupon = async (matchId, bets) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sportsduel/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          match_id: matchId,
          bets: bets
        })
      });

      if (response.ok) {
        const data = await response.json();
        showToast('Coupon created successfully!', 'success');
        fetchSportsduelMatches(); // Refresh matches to show updated coupon status
        return data.coupon;
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to create coupon', 'error');
      }
    } catch (error) {
      console.error('Error creating SportsDuel coupon:', error);
      showToast('Error creating coupon', 'error');
    }
    return null;
  };

  // Load SportsDuel data when view changes to sportsduel
  useEffect(() => {
    if (currentView === 'sportsduel') {
      fetchSportsduelLeagues();
      fetchSportsduelTeams();
      fetchSportsduelMatches();
      fetchSportsduelScoreboard();
    }
  }, [currentView, currentSportsduelLeague]);

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

  // ============================================================================
  // ADMIN AFFILIATE MANAGEMENT FUNCTIONS
  // ============================================================================

  // Fetch affiliate requests for admin
  const fetchAffiliateRequests = async () => {
    if (!token) return;
    
    setAdminAffiliateLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/affiliate/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAffiliateRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching affiliate requests:', error);
    }
    setAdminAffiliateLoading(false);
  };

  // Fetch admin affiliate statistics
  const fetchAdminAffiliateStats = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/affiliate/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminAffiliateStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin affiliate stats:', error);
    }
  };

  // Fetch all affiliate users
  const fetchAffiliateUsers = async () => {
    if (!token) return;
    
    setAdminAffiliateLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/affiliate/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAffiliateUsers(data.affiliate_users);
      }
    } catch (error) {
      console.error('Error fetching affiliate users:', error);
    }
    setAdminAffiliateLoading(false);
  };

  // Approve affiliate request
  const approveAffiliateRequest = async (userId) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/affiliate/approve/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(affiliateBonusForm)
      });
      
      if (response.ok) {
        alert('Affiliate request approved successfully!');
        fetchAffiliateRequests();
        fetchAdminAffiliateStats();
        setShowAdminAffiliateModal(false);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to approve affiliate request');
      }
    } catch (error) {
      console.error('Error approving affiliate request:', error);
      alert('Error approving affiliate request');
    }
  };

  // Reject affiliate request
  const rejectAffiliateRequest = async (userId, reason) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/affiliate/reject/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        alert('Affiliate request rejected');
        fetchAffiliateRequests();
        fetchAdminAffiliateStats();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to reject affiliate request');
      }
    } catch (error) {
      console.error('Error rejecting affiliate request:', error);
      alert('Error rejecting affiliate request');
    }
  };

  // Update affiliate bonuses
  const updateAffiliateBonuses = async (userId, bonusData) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/affiliate/bonuses/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bonusData)
      });
      
      if (response.ok) {
        alert('Affiliate bonuses updated successfully!');
        fetchAffiliateUsers();
        setShowAdminAffiliateModal(false);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to update affiliate bonuses');
      }
    } catch (error) {
      console.error('Error updating affiliate bonuses:', error);
      alert('Error updating affiliate bonuses');
    }
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
      } else if (walletView === 'payments') {
        fetchPaymentHistory();
      }
    }
  }, [currentView, walletView, user, token]);

  // Load payment configuration on app start
  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  // Load payment history when user logs in
  useEffect(() => {
    if (user && token) {
      fetchPaymentHistory();
    }
  }, [user, token]);

  // Load social sharing data when user logs in
  useEffect(() => {
    if (user && token) {
      fetchSocialStats();
      fetchUserShares();
    }
  }, [user, token]);

  // Load viral content on app start
  useEffect(() => {
    fetchViralContent();
  }, []);

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
    console.log('🚀 handleLogin function called!');
    e.preventDefault();
    setLoading(true);
    
    // Add debugging to track login attempts
    console.log('🔄 Login form submitted');
    console.log('Login attempt with:', { username: loginForm.username, password: '***' });
    console.log('API URL:', `${API_BASE_URL}/api/login`);
    
    try {
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
        
        // Fetch user profile after successful login
        try {
          const profileResponse = await fetch(`${API_BASE_URL}/api/profile`, {
            headers: {
              'Authorization': `Bearer ${data.token}`
            }
          });
          if (profileResponse.ok) {
            const userData = await profileResponse.json();
            setUser(userData);
            console.log('User profile loaded:', userData);
          } else {
            console.error('Failed to fetch user profile');
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
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
      
      const registrationData = {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        country: registerForm.country,
        full_name: registerForm.full_name,
        avatar_url: registerForm.avatar_url,
        referral_code: registerForm.affiliate_code || null
      };
      
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
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
          avatar_url: '',
          affiliate_code: ''
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
          
          {/* Motto centered below buttons */}
          <div className="hero-motto">
            <span className="motto-text">"Are You Ready to Prove ?"</span>
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

      {/* Who We Are Section */}
      <div className="who-we-are-section">
        <div className="container">
          <h2 className="section-title">🌟 Who We Are</h2>
          
          {/* Global Authority */}
          <div className="organization-level global-level">
            <div className="level-header">
              <div className="level-icon">🏛️</div>
              <div className="level-content">
                <h3>WoBeRa Global Authority</h3>
                <p className="level-description">
                  WoBeRa is the global organizational authority for the game. We are responsible for the 
                  management and organization of the game worldwide, ensuring standardized rules, 
                  fair play, and competitive integrity across all regions.
                </p>
              </div>
            </div>
          </div>

          {/* Country Domain System */}
          <div className="organization-level country-level">
            <div className="level-header">
              <div className="level-icon">🏴</div>
              <div className="level-content">
                <h3>Country Domain Partnerships</h3>
                <p className="level-description">
                  WoBeRa reaches agreements with qualified persons or companies, granting them 
                  exclusive management and operation rights for their respective countries. 
                  For example, <strong>WoBeRa.uk</strong> operates as the official local 
                  organization for the United Kingdom, ensuring the game's growth and proper 
                  administration in that region.
                </p>
              </div>
            </div>
            
            <div className="country-examples">
              <div className="country-card">
                <span className="country-flag">🇬🇧</span>
                <div className="country-info">
                  <h4>WoBeRa.uk</h4>
                  <p>United Kingdom Authority</p>
                </div>
              </div>
              <div className="country-card">
                <span className="country-flag">🇬🇷</span>
                <div className="country-info">
                  <h4>WoBeRa.gr</h4>
                  <p>Greece Authority</p>
                </div>
              </div>
              <div className="country-card">
                <span className="country-flag">🇩🇪</span>
                <div className="country-info">
                  <h4>WoBeRa.de</h4>
                  <p>Germany Authority</p>
                </div>
              </div>
            </div>
          </div>

          {/* Local Federation Structure */}
          <div className="organization-level federation-level">
            <div className="level-header">
              <div className="level-icon">⚽</div>
              <div className="level-content">
                <h3>Local Federation Operations</h3>
                <p className="level-description">
                  Each country federation serves as the local organizational authority. 
                  Authority members include teams and players participating in local leagues. 
                  The local federation is responsible for:
                </p>
                <ul className="responsibility-list">
                  <li>🏟️ Smooth operation of the game and local leagues</li>
                  <li>📊 Managing team registrations and player memberships</li>
                  <li>🏆 Organizing regional and national competitions</li>
                  <li>🌍 Creating and managing national teams for international competition</li>
                  <li>📈 Maintaining ranking systems and statistics</li>
                  <li>🏪 Overseeing Alpha Planets retail shop establishments</li>
                </ul>
              </div>
            </div>
          </div>

          {/* International Competition Structure */}
          <div className="organization-level competition-level">
            <div className="level-header">
              <div className="level-icon">🏅</div>
              <div className="level-content">
                <h3>International Championships</h3>
                <p className="level-description">
                  National teams created by local federations compete in prestigious 
                  international tournaments organized by WoBeRa Global Authority:
                </p>
                <div className="championship-grid">
                  <div className="championship-card">
                    <div className="championship-icon">🇪🇺</div>
                    <h4>European WoBeRa Championship</h4>
                    <p>Continental competition featuring the best national teams from Europe</p>
                  </div>
                  <div className="championship-card">
                    <div className="championship-icon">🌍</div>
                    <h4>World WoBeRa Championship</h4>
                    <p>The ultimate global tournament where nations compete for world supremacy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alpha Planets Retail Network */}
          <div className="organization-level retail-level">
            <div className="level-header">
              <div className="level-icon">🛍️</div>
              <div className="level-content">
                <h3>Alpha Planets Retail Network</h3>
                <p className="level-description">
                  WoBeRa grants the creation and establishment of Alpha Planets retail shops 
                  worldwide. These premium retail locations serve as official WoBeRa 
                  merchandise and gaming centers, providing players and fans with:
                </p>
                <ul className="retail-features">
                  <li>🎮 Official WoBeRa gaming equipment and accessories</li>
                  <li>👕 Licensed team jerseys and fan merchandise</li>
                  <li>📱 Technology solutions and gaming peripherals</li>
                  <li>🎯 Tournament registration and local event hosting</li>
                  <li>🏆 Exclusive collectibles and championship memorabilia</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Teams Structure Section */}
          <div className="organization-level teams-structure-level">
            <div className="level-header">
              <div className="level-icon">🏪</div>
              <div className="level-content">
                <h3>Teams - The Heart of Competition</h3>
                <p className="level-description">
                  The teams are sports cafes that have entered into agreements with WoBeRa and 
                  have secured the right to participate in local leagues, which are carried out 
                  through the <strong>Alpha Planet branch network</strong>. This innovative 
                  partnership model brings competitive gaming directly to local communities.
                </p>
              </div>
            </div>
            
            {/* League Participation Structure */}
            <div className="league-participation-structure">
              <h4>🏟️ League Participation Structure</h4>
              <p className="structure-description">
                The number of teams participating in each local league is determined by the 
                number of teams that participate in the respective country's professional 
                football league, ensuring authentic regional representation.
              </p>
              
              <div className="league-examples-grid">
                <div className="league-example-card">
                  <div className="league-flag">🇬🇷</div>
                  <div className="league-details">
                    <h5>Greek Super League</h5>
                    <div className="team-count">
                      <span className="count-number">14</span>
                      <span className="count-label">Professional Teams</span>
                    </div>
                    <div className="wobera-equivalent">
                      <span className="wobera-domain">WoBeRa.gr</span>
                      <span className="wobera-count">14 Sports Cafe Teams</span>
                    </div>
                  </div>
                </div>
                
                <div className="league-example-card">
                  <div className="league-flag">🇬🇧</div>
                  <div className="league-details">
                    <h5>English Premier League</h5>
                    <div className="team-count">
                      <span className="count-number">20</span>
                      <span className="count-label">Professional Teams</span>
                    </div>
                    <div className="wobera-equivalent">
                      <span className="wobera-domain">WoBeRa.uk</span>
                      <span className="wobera-count">20 Sports Cafe Teams</span>
                    </div>
                  </div>
                </div>
                
                <div className="league-example-card">
                  <div className="league-flag">🇩🇪</div>
                  <div className="league-details">
                    <h5>German Bundesliga</h5>
                    <div className="team-count">
                      <span className="count-number">18</span>
                      <span className="count-label">Professional Teams</span>
                    </div>
                    <div className="wobera-equivalent">
                      <span className="wobera-domain">WoBeRa.de</span>
                      <span className="wobera-count">18 Sports Cafe Teams</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Participation Rules */}
            <div className="player-participation-rules">
              <h4>👥 Player Participation Rules</h4>
              <div className="rules-grid">
                <div className="rule-card unlimited-players">
                  <div className="rule-icon">∞</div>
                  <div className="rule-content">
                    <h5>Unlimited Team Composition</h5>
                    <p>Each team may have an <strong>unlimited number of players</strong> 
                       in its composition, allowing sports cafes to accommodate all their 
                       customers who wish to participate.</p>
                  </div>
                </div>
                
                <div className="rule-card match-day-limit">
                  <div className="rule-icon">20</div>
                  <div className="rule-content">
                    <h5>Match Day Participation</h5>
                    <p>On each match day, <strong>up to 20 players per team</strong> 
                       can participate, ensuring strategic team selection and 
                       competitive balance.</p>
                  </div>
                </div>
                
                <div className="rule-card player-slots">
                  <div className="rule-icon">5</div>
                  <div className="rule-content">
                    <h5>Player Slot System</h5>
                    <p>Each player can play <strong>up to 5 times (slots)</strong> 
                       in the same match day, providing multiple opportunities to 
                       contribute to their team's success.</p>
                  </div>
                </div>
                
                <div className="rule-card one-account-policy">
                  <div className="rule-icon">🚫</div>
                  <div className="rule-content">
                    <h5>One Account Policy</h5>
                    <p>Players are <strong>forbidden to have more than one account</strong>. 
                       To avoid this, comprehensive <strong>identification processes</strong> 
                       will be implemented to ensure fair play and integrity.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alpha Planet Branch Network */}
            <div className="alpha-planet-network">
              <h4>🏢 Alpha Planet Branch Network</h4>
              <div className="network-description">
                <div className="network-visual">
                  <div className="branch-hub">
                    <div className="hub-icon">🏪</div>
                    <span>Sports Cafe</span>
                  </div>
                  <div className="connection-line"></div>
                  <div className="branch-hub">
                    <div className="hub-icon">🌐</div>
                    <span>Alpha Planet</span>
                  </div>
                  <div className="connection-line"></div>
                  <div className="branch-hub">
                    <div className="hub-icon">🏆</div>
                    <span>WoBeRa League</span>
                  </div>
                </div>
                <p>
                  Sports cafes operate through the Alpha Planet branch network, creating 
                  a seamless connection between local businesses and the global WoBeRa 
                  competitive ecosystem. This partnership ensures standardized operations, 
                  technical support, and authentic tournament experiences.
                </p>
              </div>
            </div>
          </div>

          {/* Championship Schedule Section */}
          <div className="organization-level championship-schedule-level">
            <div className="level-header">
              <div className="level-icon">📅</div>
              <div className="level-content">
                <h3>Championship Schedule</h3>
                <p className="level-description">
                  WoBeRa implements an innovative scheduling system that aligns perfectly with 
                  professional football leagues, ensuring seamless integration and familiar 
                  competition rhythms for teams and players worldwide.
                </p>
              </div>
            </div>
            
            {/* Random Match System */}
            <div className="random-match-system">
              <h4>🎲 Pre-Season Random Pairing</h4>
              <p className="system-description">
                Before the start of each league, a <strong>random match</strong> between 
                professional football teams and WoBeRa teams takes place. This innovative 
                pairing system determines the complete season structure.
              </p>
              
              <div className="match-examples">
                <div className="match-example-card">
                  <div className="vs-matchup">
                    <div className="professional-team">
                      <div className="team-badge">🔴</div>
                      <span className="team-name">Olympiakos</span>
                      <span className="team-type">Professional Team</span>
                    </div>
                    <div className="vs-symbol">VS</div>
                    <div className="wobera-team">
                      <div className="team-badge">🦈</div>
                      <span className="team-name">Glyfada Sharks</span>
                      <span className="team-type">WoBeRa Team</span>
                    </div>
                  </div>
                  <div className="match-purpose">
                    <p>This pairing ensures WoBeRa leagues follow the same program 
                       and fixtures as the local professional league</p>
                  </div>
                </div>
                
                <div className="match-example-card">
                  <div className="vs-matchup">
                    <div className="professional-team">
                      <div className="team-badge">🔵</div>
                      <span className="team-name">Chelsea FC</span>
                      <span className="team-type">Premier League</span>
                    </div>
                    <div className="vs-symbol">VS</div>
                    <div className="wobera-team">
                      <div className="team-badge">⚡</div>
                      <span className="team-name">London Thunder</span>
                      <span className="team-type">WoBeRa.uk Team</span>
                    </div>
                  </div>
                  <div className="match-purpose">
                    <p>European competitions follow the same systematic 
                       pairing for Champions League, Europa, and Challenge matches</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Benefits */}
            <div className="schedule-benefits">
              <h4>📊 System Benefits</h4>
              <p className="benefits-intro">
                This systematic approach to scheduling provides multiple advantages 
                for teams, players, and the overall competition structure:
              </p>
              
              <div className="benefits-grid">
                <div className="benefit-card awareness">
                  <div className="benefit-icon">🔍</div>
                  <div className="benefit-content">
                    <h5>Pre-Season Awareness</h5>
                    <p>All teams are aware of their rivals and match days 
                       <strong>before the start of the league</strong>, allowing 
                       for strategic planning and preparation.</p>
                  </div>
                </div>
                
                <div className="benefit-card local-schedule">
                  <div className="benefit-icon">📅</div>
                  <div className="benefit-content">
                    <h5>Local League Schedule</h5>
                    <p>The main bulk of WoBeRa local league games take place on 
                       <strong>Friday, Saturday, Sunday, and Monday</strong>, 
                       perfectly complementing weekend football viewing.</p>
                  </div>
                </div>
                
                <div className="benefit-card european-schedule">
                  <div className="benefit-icon">🌍</div>
                  <div className="benefit-content">
                    <h5>European Competition Schedule</h5>
                    <p>WoBeRa European leagues (Champions League, Europa, Challenge) 
                       games take place on <strong>Tuesday, Wednesday, and Thursday</strong>, 
                       mirroring UEFA competition days.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Match Day Structure */}
            <div className="match-day-structure">
              <h4>🗓️ Weekly Match Structure</h4>
              <div className="weekly-calendar">
                <div className="calendar-section local-games">
                  <h5>🏠 Local League Games</h5>
                  <div className="match-days">
                    <div className="match-day friday">
                      <span className="day-name">Friday</span>
                      <span className="day-focus">Evening Matches</span>
                    </div>
                    <div className="match-day saturday">
                      <span className="day-name">Saturday</span>
                      <span className="day-focus">Prime Time</span>
                    </div>
                    <div className="match-day sunday">
                      <span className="day-name">Sunday</span>
                      <span className="day-focus">Weekend Final</span>
                    </div>
                    <div className="match-day monday">
                      <span className="day-name">Monday</span>
                      <span className="day-focus">Week Opener</span>
                    </div>
                  </div>
                </div>
                
                <div className="calendar-section european-games">
                  <h5>🌍 European Competitions</h5>
                  <div className="match-days">
                    <div className="match-day tuesday">
                      <span className="day-name">Tuesday</span>
                      <span className="day-focus">Champions League</span>
                    </div>
                    <div className="match-day wednesday">
                      <span className="day-name">Wednesday</span>
                      <span className="day-focus">Europa League</span>
                    </div>
                    <div className="match-day thursday">
                      <span className="day-name">Thursday</span>
                      <span className="day-focus">Challenge Cup</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Points System */}
            <div className="points-system">
              <h4>⚽ Teams Points System</h4>
              <p className="points-intro">
                WoBeRa follows the internationally recognized football points system, 
                ensuring familiarity and competitive balance across all leagues:
              </p>
              
              <div className="points-breakdown">
                <div className="points-card win">
                  <div className="points-value">3</div>
                  <div className="points-details">
                    <span className="points-label">Points</span>
                    <span className="points-condition">For a Win</span>
                    <div className="points-icon">🏆</div>
                  </div>
                </div>
                
                <div className="points-card draw">
                  <div className="points-value">1</div>
                  <div className="points-details">
                    <span className="points-label">Point</span>
                    <span className="points-condition">For a Draw</span>
                    <div className="points-icon">🤝</div>
                  </div>
                </div>
                
                <div className="points-card loss">
                  <div className="points-value">0</div>
                  <div className="points-details">
                    <span className="points-label">Points</span>
                    <span className="points-condition">For a Loss</span>
                    <div className="points-icon">❌</div>
                  </div>
                </div>
              </div>
              
              <div className="points-explanation">
                <p>This standardized points system ensures:</p>
                <ul className="points-benefits">
                  <li>🎯 Consistent competition across all WoBeRa leagues</li>
                  <li>📈 Fair ranking and league table progression</li>
                  <li>🏅 Meaningful rewards for victories and draws</li>
                  <li>⚖️ Balanced competitive environment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Creation of National Team */}
          <div className="organization-level national-team-level">
            <div className="level-header">
              <div className="level-icon">🏆</div>
              <div className="level-content">
                <h3>6. Creation of National Team</h3>
                <p className="level-description">
                  Each local WoBeRa federation conducts comprehensive player evaluations, 
                  selecting the finest talent to represent their country on the international stage.
                </p>
              </div>
            </div>
            
            <div className="national-team-process">
              <div className="evaluation-system">
                <h4>📊 Player Evaluation Process</h4>
                <div className="evaluation-steps">
                  <div className="eval-step">
                    <div className="step-icon">📈</div>
                    <div className="step-content">
                      <h5>Statistics Analysis</h5>
                      <p>Local federations analyze comprehensive player statistics including win rates, accuracy, consistency, and performance under pressure.</p>
                    </div>
                  </div>
                  <div className="eval-step">
                    <div className="step-icon">🎯</div>
                    <div className="step-content">
                      <h5>Selection Criteria</h5>
                      <p>Players are evaluated based on skill level, tournament performance, team contribution, and ability to compete internationally.</p>
                    </div>
                  </div>
                  <div className="eval-step">
                    <div className="step-icon">🌟</div>
                    <div className="step-content">
                      <h5>National Squad</h5>
                      <p>Selected players form the country's National team, representing their nation with pride and excellence in international competitions.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="international-tournaments">
                <h4>🌍 International Championships</h4>
                <p className="tournaments-intro">
                  National teams compete in prestigious international tournaments that align 
                  perfectly with major football championships, ensuring maximum excitement and engagement.
                </p>
                
                <div className="tournament-schedule">
                  <div className="tournament-card euro">
                    <div className="tournament-header">
                      <div className="tournament-logo">🇪🇺</div>
                      <div className="tournament-details">
                        <h5>WoBeRa Euro Championship</h5>
                        <span className="tournament-year">Aligned with Euro 2024</span>
                      </div>
                    </div>
                    <div className="tournament-info">
                      <p>European national teams compete following the same fixtures and schedule as the UEFA European Championship.</p>
                    </div>
                  </div>
                  
                  <div className="tournament-card world-cup">
                    <div className="tournament-header">
                      <div className="tournament-logo">🏆</div>
                      <div className="tournament-details">
                        <h5>WoBeRa World Cup</h5>
                        <span className="tournament-year">Aligned with World Cup 2026</span>
                      </div>
                    </div>
                    <div className="tournament-info">
                      <p>The ultimate global tournament where national teams from around the world compete for international supremacy.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Friendly Games */}
          <div className="organization-level friendly-games-level">
            <div className="level-header">
              <div className="level-icon">🤝</div>
              <div className="level-content">
                <h3>7. Friendly Games</h3>
                <p className="level-description">
                  Throughout the year, teams can arrange friendly matches through an invitation 
                  system, fostering relationships and providing additional competitive opportunities 
                  with customizable prize structures.
                </p>
              </div>
            </div>
            
            <div className="friendly-system">
              <div className="invitation-process">
                <h4>📨 Invitation Procedure</h4>
                <div className="process-flow">
                  <div className="process-step">
                    <div className="process-number">1</div>
                    <div className="process-info">
                      <h5>Send Invitation</h5>
                      <p>Team A sends a friendly match invitation to Team B through the WoBeRa platform</p>
                    </div>
                  </div>
                  <div className="process-arrow">→</div>
                  <div className="process-step">
                    <div className="process-number">2</div>
                    <div className="process-info">
                      <h5>Review & Accept</h5>
                      <p>Team B reviews the invitation, match terms, and prize structure before accepting</p>
                    </div>
                  </div>
                  <div className="process-arrow">→</div>
                  <div className="process-step">
                    <div className="process-number">3</div>
                    <div className="process-info">
                      <h5>Match Scheduling</h5>
                      <p>Both teams agree on date, time, and match conditions for the friendly encounter</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="prize-system">
                <h4>💰 Prize Structure</h4>
                <div className="prize-features">
                  <div className="prize-card">
                    <div className="prize-icon">🎁</div>
                    <div className="prize-content">
                      <h5>Customizable Prizes</h5>
                      <p>Teams can set monetary prizes, merchandise, or other rewards for friendly match winners</p>
                    </div>
                  </div>
                  <div className="prize-card">
                    <div className="prize-icon">🏅</div>
                    <div className="prize-content">
                      <h5>Achievement Rewards</h5>
                      <p>Special achievement badges and recognition for outstanding friendly match performances</p>
                    </div>
                  </div>
                  <div className="prize-card">
                    <div className="prize-icon">📊</div>
                    <div className="prize-content">
                      <h5>Statistics Boost</h5>
                      <p>Friendly match results contribute to team and player statistics and rankings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Players' Transfer Value */}
          <div className="organization-level transfer-value-level">
            <div className="level-header">
              <div className="level-icon">💎</div>
              <div className="level-content">
                <h3>8. Players' Transfer Value</h3>
                <p className="level-description">
                  WoBeRa.com hosts comprehensive player value databases, providing detailed 
                  statistics and key data organized by nationality and league participation.
                </p>
              </div>
            </div>
            
            <div className="value-system">
              <div className="player-data">
                <h4>📋 Player Information Database</h4>
                <div className="data-categories">
                  <div className="data-section key-data">
                    <h5>🔑 Key Data</h5>
                    <ul className="data-list">
                      <li>👤 Age & Personal Information</li>
                      <li>🏴 Nationality & Country Representation</li>
                      <li>⚽ Current Team Affiliation</li>
                      <li>📍 Position & Playing Style</li>
                    </ul>
                  </div>
                  <div className="data-section statistics">
                    <h5>📊 Performance Statistics</h5>
                    <ul className="data-list">
                      <li>🏆 Total Wins & Losses</li>
                      <li>📈 Winning Percentage</li>
                      <li>🏅 Achievements & Trophies</li>
                      <li>🎯 Favorite Betting Patterns</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="organization-methods">
                <h4>🗂️ Data Organization</h4>
                <div className="organization-tabs">
                  <div className="org-tab nationality-tab">
                    <div className="tab-header">
                      <div className="tab-icon">🌍</div>
                      <h5>Per Nationality</h5>
                    </div>
                    <div className="tab-content">
                      <p>Player information is organized by nationality, allowing easy comparison of players from the same country and facilitating national team selections.</p>
                      <div className="nationality-examples">
                        <span className="nationality-badge">🇬🇷 Greece</span>
                        <span className="nationality-badge">🇬🇧 United Kingdom</span>
                        <span className="nationality-badge">🇩🇪 Germany</span>
                        <span className="nationality-badge">🇪🇸 Spain</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="org-tab league-tab">
                    <div className="tab-header">
                      <div className="tab-icon">🏟️</div>
                      <h5>Per League</h5>
                    </div>
                    <div className="tab-content">
                      <p>Information is categorized by league participation, enabling teams to scout players within their competitive tier and analyze cross-league comparisons.</p>
                      <div className="league-examples">
                        <span className="league-badge">🇬🇷 WoBeRa.gr</span>
                        <span className="league-badge">🇬🇧 WoBeRa.uk</span>
                        <span className="league-badge">🇩🇪 WoBeRa.de</span>
                        <span className="league-badge">🇪🇸 WoBeRa.es</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Players' Transfers */}
          <div className="organization-level transfers-level">
            <div className="level-header">
              <div className="level-icon">🔄</div>
              <div className="level-content">
                <h3>9. Players' Transfers</h3>
                <p className="level-description">
                  WoBeRa operates structured transfer periods throughout the year, facilitating 
                  player movement between teams through formal agreement procedures.
                </p>
              </div>
            </div>
            
            <div className="transfer-system">
              <div className="transfer-periods">
                <h4>📅 Transfer Windows</h4>
                <div className="transfer-windows">
                  <div className="transfer-window summer">
                    <div className="window-icon">☀️</div>
                    <div className="window-info">
                      <h5>Summer Transfer Window</h5>
                      <span className="window-period">June - August</span>
                      <p>Primary transfer period for major player movements and team restructuring</p>
                    </div>
                  </div>
                  <div className="transfer-window winter">
                    <div className="window-icon">❄️</div>
                    <div className="window-info">
                      <h5>Winter Transfer Window</h5>
                      <span className="window-period">January - February</span>
                      <p>Mid-season transfer opportunity for strategic team reinforcements</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="transfer-process">
                <h4>🤝 Transfer Agreement Process</h4>
                <div className="agreement-steps">
                  <div className="agreement-step team-agreement">
                    <div className="agreement-icon">🏢</div>
                    <div className="agreement-content">
                      <h5>Team-to-Team Agreement</h5>
                      <p>Current team and new team must reach a formal agreement regarding the player transfer, including any compensation or conditions.</p>
                    </div>
                  </div>
                  <div className="plus-symbol">+</div>
                  <div className="agreement-step player-agreement">
                    <div className="agreement-icon">👤</div>
                    <div className="agreement-content">
                      <h5>Player-Team Agreement</h5>
                      <p>Player must agree to join the new team, including contract terms, role expectations, and participation commitments.</p>
                    </div>
                  </div>
                  <div className="equals-symbol">=</div>
                  <div className="agreement-result">
                    <div className="result-icon">✅</div>
                    <div className="result-content">
                      <h5>Transfer Complete</h5>
                      <p>Successful transfer with all parties satisfied</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="free-agents">
                <h4>🆓 Free Agent System</h4>
                <div className="free-agent-info">
                  <div className="free-agent-icon">🏃‍♂️</div>
                  <div className="free-agent-content">
                    <h5>Automatic Free Agency</h5>
                    <p>When a team does not participate in the league, their players automatically become free agents and can continue with any other team without transfer restrictions.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Players' Tournaments */}
          <div className="organization-level player-tournaments-level">
            <div className="level-header">
              <div className="level-icon">🏅</div>
              <div className="level-content">
                <h3>10. Players' Tournaments</h3>
                <p className="level-description">
                  Exclusive player-only tournaments occur throughout the year, providing 
                  individual competition opportunities that directly impact player valuations 
                  and career development.
                </p>
              </div>
            </div>
            
            <div className="tournament-system">
              <div className="tournament-types">
                <h4>🎯 Tournament Categories</h4>
                <div className="tournament-categories">
                  <div className="tournament-type local">
                    <div className="type-header">
                      <div className="type-icon">🏠</div>
                      <h5>Local Tournaments</h5>
                    </div>
                    <div className="type-content">
                      <p>Regional competitions where players from the same country compete for local recognition and prizes.</p>
                      <ul className="tournament-features">
                        <li>🌍 Country-specific participation</li>
                        <li>🏆 Regional championship titles</li>
                        <li>📈 Local ranking improvements</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="tournament-type international">
                    <div className="type-header">
                      <div className="type-icon">🌏</div>
                      <h5>International Tournaments</h5>
                    </div>
                    <div className="type-content">
                      <p>Global competitions bringing together the best players from around the world for ultimate individual glory.</p>
                      <ul className="tournament-features">
                        <li>🌐 Worldwide participation</li>
                        <li>👑 Global championship recognition</li>
                        <li>💰 Significant value increases</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="tournament-rules">
                <h4>📜 Tournament Regulations</h4>
                <div className="rules-overview">
                  <div className="rule-item participation">
                    <div className="rule-icon">✅</div>
                    <div className="rule-content">
                      <h5>Open Participation</h5>
                      <p>All players can participate in tournaments, regardless of their team affiliation or current league status.</p>
                    </div>
                  </div>
                  <div className="rule-item compliance">
                    <div className="rule-icon">⚖️</div>
                    <div className="rule-content">
                      <h5>Rule Compliance</h5>
                      <p>Players must follow specific tournament rules, including fair play guidelines and competition formats.</p>
                    </div>
                  </div>
                  <div className="rule-item value-impact">
                    <div className="rule-icon">📊</div>
                    <div className="rule-content">
                      <h5>Value Impact</h5>
                      <p>Tournament participation and results directly contribute to player value calculations and transfer market worth.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="value-contribution">
                <h4>💎 Impact on Player Value</h4>
                <div className="value-factors">
                  <div className="value-factor performance">
                    <div className="factor-icon">🎯</div>
                    <span className="factor-label">Tournament Performance</span>
                    <div className="factor-impact positive">+15% Value</div>
                  </div>
                  <div className="value-factor achievements">
                    <div className="factor-icon">🏆</div>
                    <span className="factor-label">Championship Wins</span>
                    <div className="factor-impact high-positive">+25% Value</div>
                  </div>
                  <div className="value-factor consistency">
                    <div className="factor-icon">📈</div>
                    <span className="factor-label">Consistent Participation</span>
                    <div className="factor-impact positive">+10% Value</div>
                  </div>
                  <div className="value-factor international">
                    <div className="factor-icon">🌍</div>
                    <span className="factor-label">International Success</span>
                    <div className="factor-impact very-high">+40% Value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Organizational Flow */}
          <div className="organizational-flow">
            <h3>🔄 How It All Works Together</h3>
            <div className="flow-diagram">
              <div className="flow-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Global Authority</h4>
                  <p>WoBeRa sets global standards and regulations</p>
                </div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Country Partnerships</h4>
                  <p>Local authorities manage national operations</p>
                </div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Sports Cafe Teams</h4>
                  <p>Alpha Planet network enables local competition</p>
                </div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Complete Ecosystem</h4>
                  <p>Players, teams, tournaments, and championships unite</p>
                </div>
              </div>
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
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? t.loggingIn : t.loginBtn}
          </button>
        </form>
        <div className="demo-section">
          <p>{t.demoCredentials}</p>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              console.log('🔧 Demo button clicked');
              setLoginForm({ username: 'testuser', password: 'test123' });
            }}
          >
            {t.loadDemo}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              console.log('🧪 Test login function directly');
              handleLogin({preventDefault: () => {}});
            }}
          >
            Test Login
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
          <div className="form-group">
            <label>Affiliate Code (Optional)</label>
            <input
              type="text"
              value={registerForm.affiliate_code}
              onChange={(e) => setRegisterForm({...registerForm, affiliate_code: e.target.value})}
              placeholder="Enter referral code if you have one"
            />
            <small className="form-help">If someone referred you, enter their affiliate code here</small>
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
              <div className="list-skeleton">
                {[...Array(10)].map((_, index) => (
                  <ListItemSkeleton key={`rankings-skeleton-${index}`} />
                ))}
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
        
        <div className="tournaments-grid">
          {/* Loading Skeletons */}
          {tournamentLoading && tournaments.length === 0 ? (
            <>
              {[...Array(4)].map((_, index) => (
                <TournamentCardSkeleton key={`tournament-skeleton-${index}`} />
              ))}
            </>
          ) : tournaments.length === 0 ? (
            <div className="no-tournaments">
              <h3>No tournaments available</h3>
              <p>Check back later for new tournaments!</p>
            </div>
          ) : (
            tournaments.map(tournament => (
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
            ))
          )}
        </div>
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
              className={`admin-tab ${adminView === 'affiliates' ? 'active' : ''}`}
              onClick={() => {
                setAdminView('affiliates');
                fetchAffiliateRequests();
                fetchAdminAffiliateStats();
                fetchAffiliateUsers();
              }}
            >
              🤝 Affiliate Management
            </button>
            
            <button 
              className={`admin-tab ${adminView === 'tournaments' ? 'active' : ''}`}
              onClick={() => setAdminView('tournaments')}
            >
              🏆 Tournament Management
            </button>
            
            <button 
              className={`admin-tab ${adminView === 'team-management' ? 'active' : ''}`}
              onClick={() => setAdminView('team-management')}
            >
              👥 Team Management
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
          
          {/* Advanced Analytics Tab */}
          {adminView === 'analytics' && (
            <div className="admin-section">
              <h3>📊 {t.analytics}</h3>
              
              {analyticsLoading && (
                <div className="analytics-loading">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="loading-spinner"
                  >
                    Loading advanced analytics...
                  </motion.div>
                </div>
              )}

              <div className="advanced-analytics-dashboard">
                {/* Performance KPIs */}
                <div className="analytics-section">
                  <h4>🎯 Performance KPIs</h4>
                  <div className="kpi-grid">
                    <motion.div 
                      className="kpi-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="kpi-icon">👥</div>
                      <div className="kpi-value">{advancedDashboard.performance_kpis?.total_users || 0}</div>
                      <div className="kpi-label">Total Users</div>
                      <div className="kpi-trend positive">
                        +{advancedDashboard.performance_kpis?.active_users_last_30_days || 0} this month
                      </div>
                    </motion.div>

                    <motion.div 
                      className="kpi-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="kpi-icon">📈</div>
                      <div className="kpi-value">{Math.round(advancedDashboard.performance_kpis?.user_growth_rate || 0)}%</div>
                      <div className="kpi-label">User Growth Rate</div>
                      <div className="kpi-trend positive">Monthly growth</div>
                    </motion.div>

                    <motion.div 
                      className="kpi-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="kpi-icon">💰</div>
                      <div className="kpi-value">€{Math.round(advancedDashboard.performance_kpis?.total_revenue || 0)}</div>
                      <div className="kpi-label">Total Revenue</div>
                      <div className="kpi-trend positive">
                        €{Math.round(advancedDashboard.performance_kpis?.avg_revenue_per_tournament || 0)}/tournament
                      </div>
                    </motion.div>

                    <motion.div 
                      className="kpi-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="kpi-icon">🏆</div>
                      <div className="kpi-value">{advancedDashboard.performance_kpis?.active_tournaments || 0}</div>
                      <div className="kpi-label">Active Tournaments</div>
                      <div className="kpi-trend">
                        {Math.round(advancedDashboard.performance_kpis?.tournament_completion_rate || 0)}% completion rate
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* User Registration Trends Chart */}
                <div className="analytics-section">
                  <h4>📈 User Registration Trends</h4>
                  <div className="chart-container">
                    <Line
                      data={{
                        labels: advancedDashboard.registration_trends?.map(item => 
                          `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`
                        ) || [],
                        datasets: [
                          {
                            label: 'Daily Registrations',
                            data: advancedDashboard.registration_trends?.map(item => item.count) || [],
                            borderColor: 'rgb(255, 215, 0)',
                            backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            fill: true,
                            tension: 0.4
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: 'User Registration Trends (Last 12 Months)'
                          },
                          legend: {
                            display: true,
                            position: 'top'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(255, 255, 255, 0.1)'
                            }
                          },
                          x: {
                            grid: {
                              color: 'rgba(255, 255, 255, 0.1)'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Tournament Participation Chart */}
                <div className="analytics-section">
                  <h4>🏆 Tournament Participation Analytics</h4>
                  <div className="chart-container">
                    <Bar
                      data={{
                        labels: advancedDashboard.tournament_participation?.map(item => 
                          item.tournament_name || 'Unknown'
                        ) || [],
                        datasets: [
                          {
                            label: 'Participants',
                            data: advancedDashboard.tournament_participation?.map(item => item.participants) || [],
                            backgroundColor: 'rgba(54, 162, 235, 0.8)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Top 10 Tournaments by Participation'
                          },
                          legend: {
                            display: true,
                            position: 'top'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(255, 255, 255, 0.1)'
                            }
                          },
                          x: {
                            grid: {
                              color: 'rgba(255, 255, 255, 0.1)'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Revenue Analytics Chart */}
                <div className="analytics-section">
                  <h4>💰 Revenue Analytics by Category</h4>
                  <div className="chart-container">
                    <Pie
                      data={{
                        labels: advancedDashboard.revenue_by_category?.map(item => 
                          item._id ? item._id.toUpperCase() : 'Unknown'
                        ) || [],
                        datasets: [
                          {
                            data: advancedDashboard.revenue_by_category?.map(item => item.total_revenue) || [],
                            backgroundColor: [
                              '#FF6384',
                              '#36A2EB',
                              '#FFCE56',
                              '#4BC0C0',
                              '#9966FF',
                              '#FF9F40'
                            ],
                            hoverBackgroundColor: [
                              '#FF6384',
                              '#36A2EB',
                              '#FFCE56',
                              '#4BC0C0',
                              '#9966FF',
                              '#FF9F40'
                            ]
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Revenue Distribution by Tournament Category'
                          },
                          legend: {
                            display: true,
                            position: 'right'
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Geographic Distribution */}
                <div className="analytics-section">
                  <h4>🌍 Geographic Distribution</h4>
                  <div className="chart-container">
                    <Doughnut
                      data={{
                        labels: advancedDashboard.geographic_distribution?.slice(0, 10).map(item => 
                          item._id || 'Unknown'
                        ) || [],
                        datasets: [
                          {
                            data: advancedDashboard.geographic_distribution?.slice(0, 10).map(item => item.user_count) || [],
                            backgroundColor: [
                              '#FF6384',
                              '#36A2EB',
                              '#FFCE56',
                              '#4BC0C0',
                              '#9966FF',
                              '#FF9F40',
                              '#FF6384',
                              '#36A2EB',
                              '#FFCE56',
                              '#4BC0C0'
                            ]
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Top 10 Countries by User Count'
                          },
                          legend: {
                            display: true,
                            position: 'right'
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Engagement Metrics Section */}
                <div className="analytics-section">
                  <h4>📊 User Engagement Metrics</h4>
                  
                  {/* Daily Active Users */}
                  <div className="engagement-subsection">
                    <h5>Daily Active Users (Last 30 Days)</h5>
                    <div className="chart-container">
                      <Line
                        data={{
                          labels: engagementMetrics.daily_active_users?.map(item => item.date) || [],
                          datasets: [
                            {
                              label: 'Active Users',
                              data: engagementMetrics.daily_active_users?.map(item => item.active_users) || [],
                              borderColor: 'rgb(75, 192, 192)',
                              backgroundColor: 'rgba(75, 192, 192, 0.1)',
                              fill: true,
                              tension: 0.4
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                              }
                            },
                            x: {
                              grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Retention Analytics */}
                  <div className="engagement-subsection">
                    <h5>Retention Analytics</h5>
                    <div className="retention-stats">
                      <div className="retention-card">
                        <div className="retention-value">
                          {Math.round(engagementMetrics.retention_analytics?.retention_rate || 0)}%
                        </div>
                        <div className="retention-label">Retention Rate</div>
                      </div>
                      <div className="retention-card">
                        <div className="retention-value">
                          {Math.round(engagementMetrics.retention_analytics?.churn_rate || 0)}%
                        </div>
                        <div className="retention-label">Churn Rate</div>
                      </div>
                      <div className="retention-card">
                        <div className="retention-value">
                          {engagementMetrics.retention_analytics?.retained_users || 0}
                        </div>
                        <div className="retention-label">Retained Users</div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Performance */}
                  <div className="engagement-subsection">
                    <h5>Financial Performance Indicators</h5>
                    <div className="financial-stats">
                      <div className="financial-card">
                        <div className="financial-value">
                          €{Math.round(engagementMetrics.financial_performance?.total_entry_fees || 0)}
                        </div>
                        <div className="financial-label">Total Entry Fees</div>
                      </div>
                      <div className="financial-card">
                        <div className="financial-value">
                          €{Math.round(engagementMetrics.financial_performance?.platform_revenue || 0)}
                        </div>
                        <div className="financial-label">Platform Revenue</div>
                      </div>
                      <div className="financial-card">
                        <div className="financial-value">
                          {Math.round(engagementMetrics.financial_performance?.profit_margin || 0)}%
                        </div>
                        <div className="financial-label">Profit Margin</div>
                      </div>
                    </div>
                  </div>

                  {/* Affiliate Conversion Funnel */}
                  <div className="engagement-subsection">
                    <h5>Affiliate Conversion Funnel</h5>
                    <div className="funnel-stats">
                      <div className="funnel-step">
                        <div className="funnel-number">{engagementMetrics.affiliate_conversion_funnel?.total_referrals || 0}</div>
                        <div className="funnel-label">Total Referrals</div>
                      </div>
                      <div className="funnel-arrow">→</div>
                      <div className="funnel-step">
                        <div className="funnel-number">{engagementMetrics.affiliate_conversion_funnel?.active_referrals || 0}</div>
                        <div className="funnel-label">Active Referrals</div>
                        <div className="funnel-rate">
                          {Math.round(engagementMetrics.affiliate_conversion_funnel?.referral_to_active_rate || 0)}%
                        </div>
                      </div>
                      <div className="funnel-arrow">→</div>
                      <div className="funnel-step">
                        <div className="funnel-number">{engagementMetrics.affiliate_conversion_funnel?.referral_tournament_participation || 0}</div>
                        <div className="funnel-label">Tournament Participants</div>
                        <div className="funnel-rate">
                          {Math.round(engagementMetrics.affiliate_conversion_funnel?.referral_to_tournament_rate || 0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Actions */}
                <div className="analytics-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      fetchAnalyticsOverview();
                      fetchUserAnalytics();
                      fetchCompetitionAnalytics();
                      fetchAdvancedDashboard();
                      fetchEngagementMetrics();
                    }}
                    disabled={analyticsLoading}
                  >
                    {analyticsLoading ? '⏳ Loading...' : '🔄 Refresh All Analytics'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Affiliate Management Tab */}
          {adminView === 'affiliates' && (
            <div className="admin-section">
              <h3>🤝 Affiliate Management</h3>
              
              {/* Affiliate Stats Overview */}
              {adminAffiliateStats && (
                <div className="affiliate-stats-overview">
                  <div className="stats-cards">
                    <div className="stat-card">
                      <div className="stat-icon">🤝</div>
                      <div className="stat-info">
                        <h4>{adminAffiliateStats.total_affiliates}</h4>
                        <p>Total Affiliates</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">⏳</div>
                      <div className="stat-info">
                        <h4>{adminAffiliateStats.pending_requests}</h4>
                        <p>Pending Requests</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">👥</div>
                      <div className="stat-info">
                        <h4>{adminAffiliateStats.total_referrals}</h4>
                        <p>Total Referrals</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">💰</div>
                      <div className="stat-info">
                        <h4>€{adminAffiliateStats.total_commission_amount?.toFixed(2)}</h4>
                        <p>Total Commissions</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Affiliate Requests */}
              <div className="affiliate-requests-section">
                <h4>📋 Affiliate Requests</h4>
                
                {adminAffiliateLoading ? (
                  <div className="loading">Loading affiliate requests...</div>
                ) : affiliateRequests.length === 0 ? (
                  <p>No pending affiliate requests.</p>
                ) : (
                  <div className="affiliate-requests-grid">
                    {affiliateRequests.map((request) => (
                      <div key={request.user_id} className="affiliate-request-card">
                        <div className="request-header">
                          <h5>{request.user_details?.full_name || 'Unknown User'}</h5>
                          <span className={`request-status status-${request.status}`}>
                            {request.status}
                          </span>
                        </div>
                        
                        <div className="request-details">
                          <p><strong>Username:</strong> {request.user_details?.username}</p>
                          <p><strong>Email:</strong> {request.user_details?.email}</p>
                          <p><strong>Applied:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
                          <p><strong>Website:</strong> {request.website_url || 'Not provided'}</p>
                          <p><strong>Description:</strong> {request.description || 'No description'}</p>
                        </div>
                        
                        {request.status === 'pending' && (
                          <div className="request-actions">
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => {
                                setSelectedAffiliateUser(request);
                                setShowAdminAffiliateModal(true);
                              }}
                            >
                              ✅ Review & Approve
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) {
                                  rejectAffiliateRequest(request.user_id, reason);
                                }
                              }}
                            >
                              ❌ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved Affiliates */}
              <div className="approved-affiliates-section">
                <h4>👥 Approved Affiliates</h4>
                
                {adminAffiliateLoading ? (
                  <div className="loading">Loading affiliates...</div>
                ) : affiliateUsers.length === 0 ? (
                  <p>No approved affiliates yet.</p>
                ) : (
                  <div className="affiliates-table">
                    <table>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Referral Code</th>
                          <th>Referrals</th>
                          <th>Commissions</th>
                          <th>Total Earnings</th>
                          <th>Bonuses</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {affiliateUsers.map((affiliate) => (
                          <tr key={affiliate.user_id}>
                            <td>
                              <div className="affiliate-user-info">
                                <strong>{affiliate.username}</strong>
                                <small>{affiliate.email}</small>
                              </div>
                            </td>
                            <td>
                              <code>{affiliate.referral_code}</code>
                            </td>
                            <td>{affiliate.referral_count}</td>
                            <td>{affiliate.commission_count}</td>
                            <td>€{affiliate.total_earnings?.toFixed(2)}</td>
                            <td>
                              <div className="bonus-info">
                                <div>Referral: €{affiliate.referral_bonus}</div>
                                <div>Deposit: €{affiliate.deposit_bonus}</div>
                              </div>
                            </td>
                            <td>
                              <span className={`status ${affiliate.is_active ? 'active' : 'inactive'}`}>
                                {affiliate.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setSelectedAffiliateUser(affiliate);
                                  setAffiliateBonusForm({
                                    referral_bonus: affiliate.referral_bonus,
                                    deposit_bonus: affiliate.deposit_bonus,
                                    bonus_type: affiliate.bonus_type,
                                    is_active: affiliate.is_active
                                  });
                                  setShowAdminAffiliateModal(true);
                                }}
                              >
                                ⚙️ Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Affiliate Bonus Modal */}
          {showAdminAffiliateModal && selectedAffiliateUser && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>🤝 Affiliate Bonus Settings</h3>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowAdminAffiliateModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <div className="affiliate-user-info">
                    <h4>{selectedAffiliateUser.user_details?.full_name || selectedAffiliateUser.username}</h4>
                    <p>Email: {selectedAffiliateUser.user_details?.email || selectedAffiliateUser.email}</p>
                  </div>
                  
                  <div className="form-group">
                    <label>Referral Bonus (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={affiliateBonusForm.referral_bonus}
                      onChange={(e) => setAffiliateBonusForm({
                        ...affiliateBonusForm,
                        referral_bonus: parseFloat(e.target.value)
                      })}
                      placeholder="5.00"
                    />
                    <small className="form-help">Bonus paid per successful referral</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Deposit Bonus (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={affiliateBonusForm.deposit_bonus}
                      onChange={(e) => setAffiliateBonusForm({
                        ...affiliateBonusForm,
                        deposit_bonus: parseFloat(e.target.value)
                      })}
                      placeholder="10.00"
                    />
                    <small className="form-help">Bonus paid when referral makes first deposit</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Bonus Type</label>
                    <select
                      value={affiliateBonusForm.bonus_type}
                      onChange={(e) => setAffiliateBonusForm({
                        ...affiliateBonusForm,
                        bonus_type: e.target.value
                      })}
                    >
                      <option value="registration">Registration Bonus</option>
                      <option value="deposit">Deposit Bonus</option>
                      <option value="both">Both Bonuses</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={affiliateBonusForm.is_active}
                        onChange={(e) => setAffiliateBonusForm({
                          ...affiliateBonusForm,
                          is_active: e.target.checked
                        })}
                      />
                      Active Affiliate
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowAdminAffiliateModal(false)}
                  >
                    Cancel
                  </button>
                  {selectedAffiliateUser.status === 'pending' ? (
                    <button 
                      className="btn btn-success"
                      onClick={() => approveAffiliateRequest(selectedAffiliateUser.user_id)}
                    >
                      ✅ Approve Affiliate
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={() => updateAffiliateBonuses(selectedAffiliateUser.user_id, affiliateBonusForm)}
                    >
                      💾 Update Bonuses
                    </button>
                  )}
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

          {/* Team Management Tab */}
          {adminView === 'team-management' && (
            <div className="admin-section">
              <h3>👥 Team Management</h3>
              
              {/* Team Management Controls */}
              <div className="admin-controls">
                <div className="search-filter-container">
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="🔍 Search teams by name, captain, city..."
                      value={teamSearchTerm}
                      onChange={(e) => handleTeamSearch(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="filter-container">
                    <select
                      value={teamStatusFilter}
                      onChange={(e) => handleTeamStatusFilter(e.target.value)}
                      className="form-input"
                    >
                      <option value="all">All Teams</option>
                      <option value="verified">✅ Verified</option>
                      <option value="unverified">❌ Unverified</option>
                      <option value="pending">⏳ Pending</option>
                      <option value="suspended">🚫 Suspended</option>
                    </select>
                  </div>
                  
                  <button 
                    className="btn btn-secondary"
                    onClick={fetchAdminTeams}
                    disabled={adminTeamLoading}
                  >
                    {adminTeamLoading ? '⏳ Loading...' : '🔄 Refresh'}
                  </button>
                </div>
                
                {/* Bulk Actions */}
                {selectedTeamsForBulk.length > 0 && (
                  <div className="bulk-actions">
                    <span className="bulk-selected">
                      {selectedTeamsForBulk.length} teams selected
                    </span>
                    <div className="bulk-buttons">
                      <button 
                        className="btn btn-success btn-small"
                        onClick={() => performBulkTeamAction('verify')}
                      >
                        ✅ Verify
                      </button>
                      <button 
                        className="btn btn-warning btn-small"
                        onClick={() => performBulkTeamAction('unverify')}
                      >
                        ❌ Unverify
                      </button>
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => performBulkTeamAction('suspend', { reason: 'Bulk suspension' })}
                      >
                        🚫 Suspend
                      </button>
                      <button 
                        className="btn btn-primary btn-small"
                        onClick={() => performBulkTeamAction('activate', { reason: 'Bulk activation' })}
                      >
                        ✅ Activate
                      </button>
                      {isGod && (
                        <button 
                          className="btn btn-danger btn-small"
                          onClick={() => performBulkTeamAction('delete')}
                        >
                          🗑️ Delete
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => setSelectedTeamsForBulk([])}
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Teams List */}
              {adminTeamLoading ? (
                <div className="loading">Loading teams...</div>
              ) : (
                <div className="admin-teams-grid">
                  {filteredTeams.length === 0 ? (
                    <div className="no-data">
                      <h4>No teams found</h4>
                      <p>No teams match your search criteria.</p>
                    </div>
                  ) : (
                    filteredTeams.map((team, index) => (
                      <div key={team.id} className="admin-team-card">
                        <div className="team-card-header">
                          <div className="team-selection">
                            <input
                              type="checkbox"
                              checked={selectedTeamsForBulk.includes(team.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTeamsForBulk([...selectedTeamsForBulk, team.id]);
                                } else {
                                  setSelectedTeamsForBulk(selectedTeamsForBulk.filter(id => id !== team.id));
                                }
                              }}
                            />
                          </div>
                          <div className="team-basic-info">
                            <h4>{team.name}</h4>
                            <div className="team-badges">
                              <span className={`verification-badge ${team.verification_status}`}>
                                {team.verification_status === 'verified' && '✅ Verified'}
                                {team.verification_status === 'unverified' && '❌ Unverified'}
                                {team.verification_status === 'pending' && '⏳ Pending'}
                                {team.verification_status === 'rejected' && '🚫 Rejected'}
                              </span>
                              <span className={`status-badge ${team.status || 'active'}`}>
                                {team.status === 'suspended' && '🚫 Suspended'}
                                {team.status === 'disbanded' && '💀 Disbanded'}
                                {(team.status === 'active' || !team.status) && '✅ Active'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="team-details">
                          <div className="team-info-row">
                            <strong>Captain:</strong> {team.captain_name} (@{team.captain_username})
                          </div>
                          <div className="team-info-row">
                            <strong>Location:</strong> {team.city}, {team.country}
                          </div>
                          <div className="team-info-row">
                            <strong>Members:</strong> {team.current_player_count}/20
                          </div>
                          <div className="team-info-row">
                            <strong>Pending Invitations:</strong> {team.pending_invitations_count}
                          </div>
                          <div className="team-info-row">
                            <strong>Created:</strong> {new Date(team.created_at).toLocaleDateString()}
                          </div>
                          {team.email && (
                            <div className="team-info-row">
                              <strong>Email:</strong> {team.email}
                            </div>
                          )}
                        </div>
                        
                        <div className="team-admin-actions">
                          <div className="verification-actions">
                            {team.verification_status !== 'verified' && (
                              <button 
                                className="btn btn-success btn-small"
                                onClick={() => updateTeamVerification(team.id, 'verified', 'Admin verified')}
                              >
                                ✅ Verify
                              </button>
                            )}
                            {team.verification_status === 'verified' && (
                              <button 
                                className="btn btn-warning btn-small"
                                onClick={() => updateTeamVerification(team.id, 'unverified', 'Admin unverified')}
                              >
                                ❌ Unverify
                              </button>
                            )}
                          </div>
                          
                          <div className="status-actions">
                            {team.status !== 'suspended' && (
                              <button 
                                className="btn btn-danger btn-small"
                                onClick={() => updateTeamStatus(team.id, 'suspended', 'Admin suspension')}
                              >
                                🚫 Suspend
                              </button>
                            )}
                            {team.status === 'suspended' && (
                              <button 
                                className="btn btn-primary btn-small"
                                onClick={() => updateTeamStatus(team.id, 'active', 'Admin activation')}
                              >
                                ✅ Activate
                              </button>
                            )}
                          </div>
                          
                          <button 
                            className="btn btn-outline btn-small"
                            onClick={() => {
                              setSelectedTeamForAdmin(team);
                              setCurrentView(`team-${team.id}`);
                            }}
                          >
                            👁️ View Details
                          </button>
                          
                          {isGod && (
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => deleteTeamAdmin(team.id, team.name)}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
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

                  {/* CMS Content Management Section */}
                  <div className="tab-section">
                    <h4>🎨 Dynamic Content & Theme Management</h4>
                    <div className="content-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          fetchCmsContent();
                          fetchCmsThemes();
                          fetchActiveTheme();
                        }}
                        disabled={cmsLoading}
                      >
                        🔄 Refresh CMS
                      </button>
                      <button 
                        className="btn btn-success"
                        onClick={() => openContentEditor()}
                      >
                        ➕ Add Content
                      </button>
                      <button 
                        className="btn btn-purple"
                        onClick={() => setShowCmsThemeModal(true)}
                      >
                        🎨 Create Theme
                      </button>
                    </div>

                    {cmsLoading && (
                      <div className="loading-indicator">
                        <p>Loading CMS data...</p>
                      </div>
                    )}

                    {/* Theme Management */}
                    <div className="cms-section">
                      <h5>🎨 Theme Management</h5>
                      {activeTheme && (
                        <div className="active-theme-indicator">
                          <h6>Current Active Theme: {activeTheme.name}</h6>
                          <div className="theme-colors">
                            {Object.entries(activeTheme.colors || {}).map(([key, color]) => (
                              <div key={key} className="color-indicator">
                                <span className="color-name">{key}:</span>
                                <span 
                                  className="color-box"
                                  style={{ backgroundColor: color }}
                                ></span>
                                <span className="color-value">{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="themes-grid">
                        {cmsThemes.map(theme => (
                          <div key={theme.id} className={`theme-card ${theme.is_active ? 'active' : ''}`}>
                            <div className="theme-header">
                              <h6>{theme.name}</h6>
                              {theme.is_active && <span className="active-badge">✅ Active</span>}
                            </div>
                            <div className="theme-preview">
                              {Object.entries(theme.colors || {}).slice(0, 5).map(([key, color]) => (
                                <span 
                                  key={key}
                                  className="color-preview"
                                  style={{ backgroundColor: color }}
                                  title={`${key}: ${color}`}
                                ></span>
                              ))}
                            </div>
                            {!theme.is_active && (
                              <button 
                                className="btn btn-small btn-primary"
                                onClick={() => handleActivateTheme(theme.id)}
                                disabled={cmsLoading}
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content Management by Context */}
                    <div className="cms-section">
                      <h5>📝 Content Management</h5>
                      <div className="context-selector">
                        <label>Filter by Context:</label>
                        <select 
                          value={selectedContentContext} 
                          onChange={(e) => setSelectedContentContext(e.target.value)}
                        >
                          <option value="">All Contexts</option>
                          <option value="navbar">Navigation Bar</option>
                          <option value="hero">Hero Section</option>
                          <option value="features">Features</option>
                          <option value="dashboard">Dashboard</option>
                          <option value="tournament">Tournament</option>
                          <option value="affiliate">Affiliate</option>
                          <option value="wallet">Wallet</option>
                          <option value="team">Team</option>
                          <option value="guild">Guild</option>
                          <option value="general">General</option>
                        </select>
                      </div>

                      <div className="cms-content-grid">
                        {adminCmsContent
                          .filter(item => !selectedContentContext || item.context === selectedContentContext)
                          .map(content => (
                          <div key={content.id} className="cms-content-card">
                            <div className="content-header">
                              <h6>{content.key}</h6>
                              <div className="content-badges">
                                <span className={`content-type-badge ${content.content_type}`}>
                                  {content.content_type === 'text' ? '📝' : 
                                   content.content_type === 'color' ? '🎨' : 
                                   content.content_type === 'image' ? '🖼️' : '⚙️'}
                                  {content.content_type}
                                </span>
                                <span className="context-badge">{content.context}</span>
                              </div>
                            </div>
                            
                            <div className="content-preview">
                              {content.content_type === 'color' ? (
                                <div className="color-preview-large">
                                  <span 
                                    className="color-box-large"
                                    style={{ backgroundColor: content.current_value }}
                                  ></span>
                                  <span className="color-value">{content.current_value}</span>
                                </div>
                              ) : (
                                <div className="text-preview">
                                  {content.current_value.length > 100 
                                    ? content.current_value.substring(0, 100) + '...'
                                    : content.current_value
                                  }
                                </div>
                              )}
                            </div>
                            
                            {content.description && (
                              <div className="content-description">
                                <small>{content.description}</small>
                              </div>
                            )}
                            
                            <div className="content-actions">
                              <button 
                                className="btn btn-small btn-secondary"
                                onClick={() => openContentEditor(content)}
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                className="btn btn-small btn-danger"
                                onClick={() => handleDeleteContent(content.id)}
                                disabled={cmsLoading}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                            
                            <div className="content-meta">
                              <small>
                                Updated: {new Date(content.updated_at).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
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
  // FIXTURES RENDER FUNCTION
  // =============================================================================

  const renderFixtures = () => {
    // Create display countries - merge default with fetched leagues (same as standings)
    const displayCountries = defaultCountries.slice(0, 4).map(defaultCountry => {
      const existingLeague = nationalLeagues.find(league => 
        league.country.toLowerCase() === defaultCountry.name.toLowerCase()
      );
      return existingLeague || {
        country: defaultCountry.name,
        flag: defaultCountry.flag,
        premier: null,
        league_2: null
      };
    });

    if (!selectedLeagueForFixtures) {
      return (
        <motion.div 
          className="fixtures-page"
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          <div className="container">
            <motion.div className="fixtures-header">
              <h2>📅 League Fixtures</h2>
              <p>Select a country and league to view fixtures</p>
              
              {/* Admin Initialize Button */}
              {isAdmin && nationalLeagues.length === 0 && (
                <motion.button 
                  className="btn btn-primary btn-pulse"
                  onClick={initializeDefaultCountries}
                  style={{ marginTop: '20px' }}
                >
                  🚀 Initialize Default Countries
                </motion.button>
              )}
            </motion.div>

            {/* Country Selection for Fixtures */}
            <motion.div className="countries-grid">
              {displayCountries.length === 0 && nationalLeagues.length === 0 ? (
                <div className="no-data-message">
                  <h3>🏗️ Setting up leagues...</h3>
                  <p>Fixture schedules will appear here once leagues are initialized.</p>
                  {isAdmin && (
                    <button 
                      className="btn btn-primary"
                      onClick={initializeDefaultCountries}
                    >
                      🚀 Initialize Default Countries
                    </button>
                  )}
                </div>
              ) : (
                displayCountries.map((country, index) => (
                  <motion.div 
                    key={country.country} 
                    className="country-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="country-header">
                      <h3>{country.flag || '🏴'} {country.country}</h3>
                    </div>
                    
                    <div className="leagues-list">
                      {country.premier ? (
                        <motion.button 
                          className="league-button premier"
                          onClick={() => {
                            fetchLeagueFixtures(country.country, 'premier');
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="league-icon">📅</span>
                          <span className="league-name">{country.country} Premier</span>
                          <span className="team-count">Fixtures</span>
                        </motion.button>
                      ) : (
                        <div className="league-placeholder premier">
                          <span className="league-icon">📅</span>
                          <span className="league-name">{country.country} Premier</span>
                          <span className="team-count">Not created</span>
                          {isAdmin && (
                            <button 
                              className="create-league-btn"
                              onClick={() => initializeCountryLeagues(country.country)}
                            >
                              Create
                            </button>
                          )}
                        </div>
                      )}
                      
                      {country.league_2 ? (
                        <motion.button 
                          className="league-button league2"
                          onClick={() => {
                            fetchLeagueFixtures(country.country, 'league_2');
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="league-icon">📅</span>
                          <span className="league-name">{country.country} League 2</span>
                          <span className="team-count">Fixtures</span>
                        </motion.button>
                      ) : (
                        <div className="league-placeholder league2">
                          <span className="league-icon">📅</span>
                          <span className="league-name">{country.country} League 2</span>
                          <span className="team-count">Not created</span>
                          {isAdmin && (
                            <button 
                              className="create-league-btn"
                              onClick={() => initializeCountryLeagues(country.country)}
                            >
                              Create
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </motion.div>
      );
    }

    const currentMatchday = leagueFixtures.find(md => md.matchday === selectedMatchday);

    return (
      <motion.div 
        className="fixtures-page"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <div className="container">
          <motion.div className="fixtures-header">
            <motion.button 
              className="btn btn-secondary"
              onClick={() => {
                setSelectedLeagueForFixtures(null);
                setLeagueFixtures([]);
                navigateWithBreadcrumb('fixtures', 'Fixtures');
              }}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              style={{ marginBottom: '20px' }}
            >
              ← Back to Countries
            </motion.button>
            
            <h2>📅 {selectedLeagueForFixtures.name} - Fixtures</h2>
            <p className="season-info">Season: {selectedLeagueForFixtures.season}</p>
            
            {/* Admin Generate Fixtures Button */}
            {isAdmin && leagueFixtures.length === 0 && (
              <motion.button 
                className="btn btn-primary btn-pulse"
                onClick={() => generateLeagueFixtures(selectedLeagueForFixtures.id)}
                style={{ marginTop: '20px' }}
              >
                🔄 Generate Fixtures
              </motion.button>
            )}
          </motion.div>

          {fixturesLoading ? (
            <EnhancedLoader message="Loading fixtures..." size="medium" />
          ) : leagueFixtures.length === 0 ? (
            <div className="no-fixtures">
              <h3>📋 No fixtures generated yet</h3>
              <p>Fixtures will appear here once they are generated for this league.</p>
              {isAdmin && (
                <button 
                  className="btn btn-primary"
                  onClick={() => generateLeagueFixtures(selectedLeagueForFixtures.id)}
                >
                  🔄 Generate Fixtures
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Matchday Navigation */}
              <motion.div className="matchday-navigation">
                <div className="matchday-selector">
                  <button 
                    className="nav-btn"
                    onClick={() => setSelectedMatchday(Math.max(1, selectedMatchday - 1))}
                    disabled={selectedMatchday === 1}
                  >
                    ⬅️ Previous
                  </button>
                  
                  <select 
                    value={selectedMatchday}
                    onChange={(e) => setSelectedMatchday(parseInt(e.target.value))}
                    className="matchday-select"
                  >
                    {leagueFixtures.map(md => (
                      <option key={md.matchday} value={md.matchday}>
                        {md.matchday}η Αγωνιστική
                      </option>
                    ))}
                  </select>
                  
                  <button 
                    className="nav-btn"
                    onClick={() => setSelectedMatchday(Math.min(leagueFixtures.length, selectedMatchday + 1))}
                    disabled={selectedMatchday === leagueFixtures.length}
                  >
                    Next ➡️
                  </button>
                </div>
              </motion.div>

              {/* Current Matchday Fixtures */}
              {currentMatchday && (
                <motion.div 
                  className="matchday-fixtures"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="matchday-header">
                    <h3>{currentMatchday.matchday}η Αγωνιστική</h3>
                    <div className="matchday-stats">
                      <span className="stat">
                        📊 {currentMatchday.played_matches}/{currentMatchday.total_matches} Played
                      </span>
                    </div>
                  </div>

                  <div className="fixtures-grid">
                    {currentMatchday.matches.map((match, index) => (
                      <motion.div 
                        key={match.id}
                        className={`fixture-card ${match.status}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="match-teams">
                          <div className="home-team">
                            <span className="team-name">{match.home_team_name}</span>
                            <span className="home-indicator">🏠</span>
                          </div>
                          
                          <div className="match-score">
                            {match.status === 'played' ? (
                              <div className="score">
                                {match.home_score} - {match.away_score}
                              </div>
                            ) : (
                              <div className="vs">VS</div>
                            )}
                          </div>
                          
                          <div className="away-team">
                            <span className="away-indicator">✈️</span>
                            <span className="team-name">{match.away_team_name}</span>
                          </div>
                        </div>
                        
                        <div className="match-info">
                          <span className={`match-status ${match.status}`}>
                            {match.status === 'scheduled' && '⏳ Scheduled'}
                            {match.status === 'played' && '✅ Played'}
                            {match.status === 'postponed' && '⏸️ Postponed'}
                          </span>
                          {match.match_date && (
                            <span className="match-date">
                              📅 {new Date(match.match_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Full Season Overview */}
              <motion.div 
                className="season-overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3>📊 Season Overview</h3>
                <div className="overview-stats">
                  <div className="stat-card">
                    <span className="stat-number">{leagueFixtures.length}</span>
                    <span className="stat-label">Total Matchdays</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">
                      {leagueFixtures.reduce((total, md) => total + md.total_matches, 0)}
                    </span>
                    <span className="stat-label">Total Matches</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">
                      {leagueFixtures.reduce((total, md) => total + md.played_matches, 0)}
                    </span>
                    <span className="stat-label">Matches Played</span>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  // =============================================================================
  // STANDINGS RENDER FUNCTION
  // =============================================================================

  const renderStandings = () => {
    // Create display countries - merge default with fetched leagues
    const displayCountries = defaultCountries.map(defaultCountry => {
      const existingLeague = nationalLeagues.find(league => 
        league.country.toLowerCase() === defaultCountry.name.toLowerCase()
      );
      return existingLeague || {
        country: defaultCountry.name,
        flag: defaultCountry.flag,
        premier: null,
        league_2: null
      };
    });

    // Add other countries if showing all and searching
    const filteredOtherCountries = nationalLeagues.filter(league => 
      !defaultCountries.some(def => def.name.toLowerCase() === league.country.toLowerCase()) &&
      (!countrySearchTerm || league.country.toLowerCase().includes(countrySearchTerm.toLowerCase()))
    );

    if (showAllCountries) {
      displayCountries.push(...filteredOtherCountries);
    }

    return (
      <motion.div 
        className="standings-page"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <div className="container">
          <motion.div className="standings-header">
            <h2>📊 National League Standings</h2>
            <p>Select a country and league to view standings</p>
            
            {/* Admin Initialize Button */}
            {isAdmin && nationalLeagues.length === 0 && (
              <motion.button 
                className="btn btn-primary btn-pulse"
                onClick={initializeDefaultCountries}
                style={{ marginTop: '20px' }}
              >
                🚀 Initialize Default Countries
              </motion.button>
            )}
          </motion.div>

          {/* Search and Filter Controls */}
          <motion.div className="standings-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="🔍 Search for a country..."
                value={countrySearchTerm}
                onChange={(e) => setCountrySearchTerm(e.target.value)}
                className="form-input"
              />
            </div>
            
            <button 
              className={`btn ${showAllCountries ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setShowAllCountries(!showAllCountries)}
            >
              {showAllCountries ? '📋 Show Main Countries' : '🌍 Show All Countries'}
            </button>
          </motion.div>

          {/* Admin Panel for Creating New Leagues */}
          {isAdmin && (
            <motion.div 
              className="admin-league-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="admin-panel-header">
                <h3>🔧 Admin: League Management</h3>
                <p>Create and manage national leagues</p>
              </div>
              
              <div className="admin-actions-grid">
                <div className="admin-action-card">
                  <h4>🚀 Quick Setup</h4>
                  <p>Initialize all 8 default countries</p>
                  <button 
                    className="btn btn-primary"
                    onClick={initializeDefaultCountries}
                  >
                    Initialize Default Countries
                  </button>
                </div>
                
                <div className="admin-action-card">
                  <h4>➕ Create New League</h4>
                  <p>Create a custom league for any country</p>
                  <div className="create-league-form">
                    <input
                      type="text"
                      placeholder="Enter country name (e.g., Brazil)"
                      value={newLeagueCountry}
                      onChange={(e) => setNewLeagueCountry(e.target.value)}
                      className="form-input"
                    />
                    <button 
                      className="btn btn-secondary"
                      onClick={createCustomLeague}
                      disabled={!newLeagueCountry.trim()}
                    >
                      Create League
                    </button>
                  </div>
                </div>
                
                <div className="admin-action-card">
                  <h4>⚽ Auto-Generate Fixtures</h4>
                  <p>Generate fixtures for leagues with teams</p>
                  <button 
                    className="btn btn-accent"
                    onClick={generateAllFixtures}
                  >
                    Generate All Fixtures
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Country Selection Grid */}
          <motion.div className="countries-grid">
            {displayCountries.length === 0 && nationalLeagues.length === 0 ? (
              <div className="no-data-message">
                <h3>🏗️ Setting up leagues...</h3>
                <p>National leagues will appear here once they are initialized.</p>
                {isAdmin && (
                  <button 
                    className="btn btn-primary"
                    onClick={initializeDefaultCountries}
                  >
                    🚀 Initialize Default Countries
                  </button>
                )}
              </div>
            ) : displayCountries.length === 0 ? (
              <div className="no-search-results">
                <h4>🔍 No countries found</h4>
                <p>Try a different search term.</p>
              </div>
            ) : (
              displayCountries.map((country, index) => (
                <motion.div 
                  key={country.country} 
                  className="country-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="country-header">
                    <h3>{country.flag || '🏴'} {country.country}</h3>
                  </div>
                  
                  <div className="leagues-list">
                    {country.premier ? (
                      <motion.button 
                        className="league-button premier"
                        onClick={() => {
                          fetchLeagueStandings(country.country, 'premier');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="league-icon">🥇</span>
                        <span className="league-name">{country.country} Premier</span>
                        <span className="team-count">{country.premier.teams?.length || 0} teams</span>
                      </motion.button>
                    ) : (
                      <div className="league-placeholder premier">
                        <span className="league-icon">🥇</span>
                        <span className="league-name">{country.country} Premier</span>
                        <span className="team-count">Not created</span>
                        {isAdmin && (
                          <button 
                            className="create-league-btn"
                            onClick={() => initializeCountryLeagues(country.country)}
                          >
                            Create
                          </button>
                        )}
                      </div>
                    )}
                    
                    {country.league_2 ? (
                      <motion.button 
                        className="league-button league2"
                        onClick={() => {
                          fetchLeagueStandings(country.country, 'league_2');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="league-icon">🥈</span>
                        <span className="league-name">{country.country} League 2</span>
                        <span className="team-count">{country.league_2.teams?.length || 0} teams</span>
                      </motion.button>
                    ) : (
                      <div className="league-placeholder league2">
                        <span className="league-icon">🥈</span>
                        <span className="league-name">{country.country} League 2</span>
                        <span className="team-count">Not created</span>
                        {isAdmin && (
                          <button 
                            className="create-league-btn"
                            onClick={() => initializeCountryLeagues(country.country)}
                          >
                            Create
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Selected League Standings */}
          {selectedLeague && (
            <motion.div 
              className="league-standings"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="standings-header">
                <h3>{selectedLeague.name} - Standings</h3>
                <p className="season-info">Season: {selectedLeague.season}</p>
              </div>
              
              {standingsLoading ? (
                <EnhancedLoader message="Loading standings..." size="medium" />
              ) : leagueStandings.length === 0 ? (
                <div className="no-standings">
                  <h4>No teams in this league yet</h4>
                  <p>Teams will appear here once they are assigned by administrators.</p>
                  {isAdmin && (
                    <p className="admin-hint">💡 Go to Admin Panel → Team Management to assign teams to leagues</p>
                  )}
                </div>
              ) : (
                <div className="standings-table">
                  <div className="table-header">
                    <div className="col-pos">Pos</div>
                    <div className="col-team">Team</div>
                    <div className="col-played">P</div>
                    <div className="col-won">W</div>
                    <div className="col-drawn">D</div>
                    <div className="col-lost">L</div>
                    <div className="col-gf">GF</div>
                    <div className="col-ga">GA</div>
                    <div className="col-gd">GD</div>
                    <div className="col-points">Pts</div>
                  </div>
                  
                  {leagueStandings.map((standing, index) => (
                    <motion.div 
                      key={standing.team_id} 
                      className={`table-row ${index < 3 ? 'promotion' : index >= leagueStandings.length - 3 ? 'relegation' : ''}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="col-pos">{index + 1}</div>
                      <div className="col-team">
                        <span className="team-name">{standing.team_name}</span>
                      </div>
                      <div className="col-played">{standing.matches_played}</div>
                      <div className="col-won">{standing.wins}</div>
                      <div className="col-drawn">{standing.draws}</div>
                      <div className="col-lost">{standing.losses}</div>
                      <div className="col-gf">{standing.goals_for}</div>
                      <div className="col-ga">{standing.goals_against}</div>
                      <div className="col-gd">{standing.goal_difference}</div>
                      <div className="col-points">{standing.points}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  // =============================================================================
  // TEAM SYSTEM RENDER FUNCTIONS
  // =============================================================================

  const renderTeams = () => {
    return (
      <motion.div 
        className="teams-page"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <motion.div 
          className="teams-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2>🏆 {t.teams}</h2>
          
          {/* Team Invitations Banner */}
          <AnimatePresence>
            {teamInvitations.length > 0 && (
              <motion.div 
                className="team-invitations-banner"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="invitations-alert">
                  <h3>📨 Team Invitations ({teamInvitations.length})</h3>
                  <p>You have pending team invitations!</p>
                  <motion.div 
                    className="invitations-list"
                    variants={staggerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {teamInvitations.map((invitation, index) => (
                      <motion.div 
                        key={invitation.id} 
                        className="invitation-item"
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="invitation-info">
                          <strong>{invitation.team_details?.name}</strong>
                          <span>from {invitation.captain?.full_name}</span>
                          <small>{invitation.team_details?.city}, {invitation.team_details?.country}</small>
                        </div>
                        <div className="invitation-actions">
                          <motion.button 
                            className="btn btn-primary btn-small"
                            onClick={() => acceptTeamInvitation(invitation.id)}
                            disabled={teamLoading}
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            ✅ Accept
                          </motion.button>
                          <motion.button 
                            className="btn btn-secondary btn-small"
                            onClick={() => declineTeamInvitation(invitation.id)}
                            disabled={teamLoading}
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            ❌ Decline
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create Team Button */}
          {user && (
            <motion.div 
              className="teams-actions"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <motion.button 
                className="btn btn-primary"
                onClick={() => setShowCreateTeamModal(true)}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                ➕ Create Team
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Teams List */}
        <motion.div 
          className="teams-grid"
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Show loading skeletons */}
          {teamLoading && teams.length === 0 ? (
            <>
              {[...Array(6)].map((_, index) => (
                <TeamCardSkeleton key={`skeleton-${index}`} />
              ))}
            </>
          ) : teams.length === 0 ? (
            <motion.div 
              className="no-teams"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h3>No teams found</h3>
              <p>Be the first to create a team!</p>
            </motion.div>
          ) : (
            teams.map((team, index) => (
              <motion.div 
                key={team.id} 
                className="team-card-modern"
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.03,
                  rotateY: 5,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Team Header with Gradient */}
                <div className="team-header-modern" style={{
                  background: `linear-gradient(135deg, ${team.colors?.primary || '#4fc3f7'}, ${team.colors?.secondary || '#29b6f6'})`
                }}>
                  <div className="team-logo-modern">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={`${team.name} logo`} />
                    ) : (
                      <div className="default-logo-modern">
                        {team.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="team-badge">
                    <span className="team-status-badge">{team.status}</span>
                  </div>
                </div>

                {/* Team Content */}
                <div className="team-content-modern">
                  <div className="team-name-section">
                    <h3 className="team-name-modern">{team.name}</h3>
                    <div className="team-location-modern">
                      <span className="location-icon">📍</span>
                      <span>{team.city}, {team.country}</span>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="team-stats-modern">
                    <div className="stat-item-modern">
                      <div className="stat-icon">👥</div>
                      <div className="stat-content">
                        <span className="stat-value">{team.current_player_count}</span>
                        <span className="stat-label">Players</span>
                      </div>
                    </div>
                    <div className="stat-item-modern">
                      <div className="stat-icon">👑</div>
                      <div className="stat-content">
                        <span className="stat-value">{team.captain_name}</span>
                        <span className="stat-label">Captain</span>
                      </div>
                    </div>
                  </div>

                  {/* Team Colors Showcase */}
                  <div className="team-colors-modern">
                    <span className="colors-label">Team Colors:</span>
                    <div className="colors-display">
                      <motion.div 
                        className="color-dot-modern primary" 
                        style={{backgroundColor: team.colors?.primary || '#4fc3f7'}}
                        whileHover={{ scale: 1.3, rotate: 360 }}
                        transition={{ duration: 0.3 }}
                      />
                      {team.colors?.secondary && (
                        <motion.div 
                          className="color-dot-modern secondary" 
                          style={{backgroundColor: team.colors.secondary}}
                          whileHover={{ scale: 1.3, rotate: -360 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Social Share Buttons */}
                  <div className="team-social-section">
                    <div className="social-share-buttons">
                      <motion.button 
                        className="social-btn facebook-btn"
                        onClick={() => shareTeamFormation(team.id, 'facebook')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Share on Facebook"
                      >
                        <span className="social-icon">📘</span>
                        <span>Facebook</span>
                      </motion.button>
                      
                      <motion.button 
                        className="social-btn instagram-btn"
                        onClick={() => shareTeamFormation(team.id, 'instagram')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Share on Instagram"
                      >
                        <span className="social-icon">📸</span>
                        <span>Instagram</span>
                      </motion.button>
                      
                      <motion.button 
                        className="social-btn all-platforms-btn"
                        onClick={() => shareTeamFormation(team.id, 'twitter')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Share on all platforms"
                      >
                        <span className="social-icon">🚀</span>
                        <span>More</span>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Team Actions */}
                <div className="team-actions-modern">
                  <motion.button 
                    className="btn-modern btn-outline-modern"
                    onClick={() => setCurrentView(`team-${team.id}`)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="btn-icon">👁️</span>
                    View Details
                  </motion.button>
                  
                  {/* Captain actions */}
                  {user && user.id === team.captain_id && (
                    <div className="captain-actions-modern">
                      <motion.button 
                        className="btn-modern btn-secondary-modern"
                        onClick={() => {
                          setSelectedTeamForInvite(team);
                          setShowTeamInviteModal(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="btn-icon">📧</span>
                        Invite Player
                      </motion.button>
                      <motion.button 
                        className="btn-modern btn-primary-modern"
                        onClick={() => openEditTeamModal(team)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="btn-icon">✏️</span>
                        Edit Team
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Hover Effects */}
                <div className="team-card-overlay" />
              </motion.div>
            ))
          )}
        </motion.div>
      </motion.div>
    );
  };

  // =============================================================================
  // GUILD SYSTEM RENDER FUNCTIONS
  // =============================================================================

  const renderGuilds = () => {
    return (
      <motion.div 
        className="guilds-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container">
          <div className="guilds-header">
            <h1>🏰 {t.guildsTitle}</h1>
            <p>Join or create powerful guilds to compete in epic wars!</p>
            
            {user && (
              <div className="guild-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentView('create-guild')}
                >
                  🛡️ {t.createGuild}
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => setCurrentView('guild-rankings')}
                >
                  🏆 {t.guildRankings}
                </button>
              </div>
            )}
          </div>

          {guildsLoading ? (
            <div className="loading">Loading guilds...</div>
          ) : (
            <div className="guilds-grid">
              {guilds.map((guild) => (
                <motion.div
                  key={guild.id}
                  className="guild-card"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="guild-header">
                    {guild.logo_url && (
                      <img src={guild.logo_url} alt={guild.name} className="guild-logo" />
                    )}
                    <div className="guild-info">
                      <h3 className="guild-name">{guild.name}</h3>
                      <span className="guild-tag">[{guild.tag}]</span>
                    </div>
                  </div>
                  
                  <div className="guild-description">
                    {guild.description}
                  </div>
                  
                  <div className="guild-stats">
                    <div className="stat">
                      <span className="stat-label">Members:</span>
                      <span className="stat-value">{guild.member_count}/50</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Level:</span>
                      <span className="stat-value">{guild.level || 1}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Power:</span>
                      <span className="stat-value">{guild.power_rating || 1000}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Country:</span>
                      <span className="stat-value">{guild.country || 'International'}</span>
                    </div>
                  </div>
                  
                  <div className="guild-recruitment">
                    {guild.recruitment_open ? (
                      <span className="recruitment-open">🟢 Open Recruitment</span>
                    ) : (
                      <span className="recruitment-closed">🔴 Invitation Only</span>
                    )}
                  </div>
                  
                  <div className="guild-actions">
                    <button 
                      className="btn btn-outline"
                      onClick={() => navigateWithBreadcrumb(`guild-${guild.id}`, guild.name)}
                    >
                      👁️ View Details
                    </button>
                    {user && guild.recruitment_open && (
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          // Request to join guild logic
                          inviteToGuild(guild.id, user.username, 'I would like to join your guild!');
                        }}
                      >
                        🗡️ Request to Join
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {guilds.length === 0 && !guildsLoading && (
            <div className="empty-state">
              <h3>No guilds found</h3>
              <p>Be the first to create a guild!</p>
              {user && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentView('create-guild')}
                >
                  🛡️ Create Guild
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderGuildRankings = () => {
    return (
      <div className="guild-rankings-page">
        <div className="container">
          <div className="rankings-header">
            <h1>🏆 {t.guildRankings}</h1>
            <p>Top performing guilds across all regions</p>
          </div>

          <div className="rankings-table">
            <div className="table-header">
              <div className="rank-col">Rank</div>
              <div className="guild-col">Guild</div>
              <div className="members-col">Members</div>
              <div className="power-col">Power Rating</div>
              <div className="wars-col">Wars Won</div>
              <div className="trophies-col">Trophies</div>
            </div>
            
            {guildRankings.map((guild) => (
              <div key={guild.id} className="table-row">
                <div className="rank-col">#{guild.rank}</div>
                <div className="guild-col">
                  <div className="guild-info">
                    {guild.logo_url && (
                      <img src={guild.logo_url} alt={guild.name} className="guild-logo-small" />
                    )}
                    <div>
                      <div className="guild-name">{guild.name}</div>
                      <div className="guild-tag">[{guild.tag}]</div>
                    </div>
                  </div>
                </div>
                <div className="members-col">{guild.member_count}</div>
                <div className="power-col">{guild.power_rating || 1000}</div>
                <div className="wars-col">{guild.wars_won || 0}</div>
                <div className="trophies-col">{guild.season_trophies || 0}</div>
              </div>
            ))}
          </div>

          {guildRankings.length === 0 && (
            <div className="empty-state">
              <h3>No rankings available</h3>
              <p>Guilds will appear here once they start competing</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCreateGuild = () => {
    if (!user) {
      return (
        <div className="login-prompt">
          <h2>Login Required</h2>
          <p>Please login to create a guild</p>
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
      <div className="create-guild-page">
        <div className="container">
          <div className="create-guild-header">
            <h1>🛡️ {t.createGuild}</h1>
            <p>Establish your guild and gather warriors for epic battles!</p>
          </div>

          <div className="guild-form">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const guildData = {
                name: formData.get('name'),
                tag: formData.get('tag').toUpperCase(),
                description: formData.get('description'),
                colors: {
                  primary: formData.get('primary_color'),
                  secondary: formData.get('secondary_color')
                },
                recruitment_open: formData.get('recruitment_open') === 'on',
                min_level: parseInt(formData.get('min_level')) || 1,
                country: formData.get('country')
              };

              const result = await createGuild(guildData);
              if (result) {
                setCurrentView('guilds');
              }
            }}>
              <div className="form-group">
                <label>{t.guildName}</label>
                <input type="text" name="name" required maxLength="50" />
              </div>
              
              <div className="form-group">
                <label>{t.guildTag}</label>
                <input type="text" name="tag" required maxLength="5" placeholder="3-5 characters" />
                <small>Short identifier for your guild (3-5 characters)</small>
              </div>
              
              <div className="form-group">
                <label>{t.guildDescription}</label>
                <textarea name="description" maxLength="200" placeholder="Describe your guild's mission and values"></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Primary Color</label>
                  <input type="color" name="primary_color" defaultValue="#FF0000" />
                </div>
                <div className="form-group">
                  <label>Secondary Color</label>
                  <input type="color" name="secondary_color" defaultValue="#FFFFFF" />
                </div>
              </div>
              
              <div className="form-group">
                <label>Country</label>
                <select name="country">
                  <option value="">International</option>
                  <option value="Greece">Greece</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Minimum Level</label>
                <input type="number" name="min_level" min="1" max="100" defaultValue="1" />
              </div>
              
              <div className="form-group checkbox">
                <input type="checkbox" name="recruitment_open" id="recruitment" defaultChecked />
                <label htmlFor="recruitment">{t.recruitmentOpen}</label>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  🛡️ Create Guild
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setCurrentView('guilds')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderMyGuild = () => {
    if (!user) {
      return (
        <div className="login-prompt">
          <h2>Login Required</h2>
          <p>Please login to view your guild</p>
          <button 
            className="btn btn-primary"
            onClick={() => setCurrentView('login')}
          >
            Login
          </button>
        </div>
      );
    }

    if (!myGuild) {
      return (
        <div className="no-guild">
          <div className="container">
            <h2>⚔️ You're not in a guild yet</h2>
            <p>Join an existing guild or create your own to start your guild adventure!</p>
            
            <div className="guild-options">
              <button 
                className="btn btn-primary"
                onClick={() => setCurrentView('guilds')}
              >
                🏰 Browse Guilds
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => setCurrentView('create-guild')}
              >
                🛡️ Create Guild
              </button>
            </div>
            
            {guildInvitations.length > 0 && (
              <div className="guild-invitations">
                <h3>📬 Guild Invitations ({guildInvitations.length})</h3>
                {guildInvitations.map((invitation) => (
                  <div key={invitation.id} className="invitation-card">
                    <div className="invitation-info">
                      <h4>{invitation.guild_name} [{invitation.guild_tag}]</h4>
                      <p>Invited by: {invitation.inviter_username}</p>
                      {invitation.message && <p className="invitation-message">"{invitation.message}"</p>}
                    </div>
                    <div className="invitation-actions">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => acceptGuildInvitation(invitation.id)}
                      >
                        ✅ Accept
                      </button>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => declineGuildInvitation(invitation.id)}
                      >
                        ❌ Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="my-guild-page">
        <div className="container">
          <div className="guild-overview">
            <div className="guild-banner">
              {myGuild.logo_url && (
                <img src={myGuild.logo_url} alt={myGuild.name} className="guild-logo-large" />
              )}
              <div className="guild-title">
                <h1>{myGuild.name}</h1>
                <span className="guild-tag">[{myGuild.tag}]</span>
              </div>
            </div>
            
            <div className="guild-stats-overview">
              <div className="stat-card">
                <div className="stat-value">{myGuild.member_count}/50</div>
                <div className="stat-label">Members</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{myGuild.level || 1}</div>
                <div className="stat-label">Level</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{myGuild.power_rating || 1000}</div>
                <div className="stat-label">Power Rating</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{myGuild.total_wars || 0}</div>
                <div className="stat-label">Wars</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGuildDetails = () => {
    const guildId = currentView.replace('guild-', '');
    
    if (!selectedGuild) {
      return <div className="loading">Loading guild details...</div>;
    }

    return (
      <div className="guild-details-page">
        <div className="container">
          <div className="guild-header">
            <button 
              className="btn btn-outline"
              onClick={() => setCurrentView('guilds')}
            >
              ← Back to Guilds
            </button>
            
            <div className="guild-banner">
              {selectedGuild.logo_url && (
                <img src={selectedGuild.logo_url} alt={selectedGuild.name} className="guild-logo-large" />
              )}
              <div className="guild-title">
                <h1>{selectedGuild.name}</h1>
                <span className="guild-tag">[{selectedGuild.tag}]</span>
              </div>
            </div>
          </div>
          
          <div className="guild-content">
            <div className="guild-description">
              <h3>About This Guild</h3>
              <p>{selectedGuild.description || 'No description provided.'}</p>
            </div>
            
            <div className="guild-stats">
              <h3>Guild Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-value">{selectedGuild.member_count}/50</span>
                  <span className="stat-label">Members</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{selectedGuild.level || 1}</span>
                  <span className="stat-label">Level</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{selectedGuild.power_rating || 1000}</span>
                  <span className="stat-label">Power Rating</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{selectedGuild.total_wars || 0}</span>
                  <span className="stat-label">Total Wars</span>
                </div>
              </div>
            </div>
            
            {selectedGuild.members && (
              <div className="guild-members">
                <h3>Guild Members ({selectedGuild.members.length})</h3>
                <div className="members-list">
                  {selectedGuild.members.map((member) => (
                    <div key={member.user_id} className="member-card">
                      <div className="member-info">
                        <h4>{member.username}</h4>
                        <span className="member-role">{member.role}</span>
                      </div>
                      <div className="member-stats">
                        <span>Contributions: {member.contributions}</span>
                        <span>Joined: {new Date(member.joined_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGuildWars = () => {
    return (
      <div className="guild-wars-page">
        <div className="container">
          <div className="wars-header">
            <h1>⚔️ {t.guildWars}</h1>
            <p>Epic battles between guilds for glory and rewards!</p>
          </div>

          <div className="wars-content">
            <h3>Coming Soon!</h3>
            <p>Guild Wars feature will be available soon. Prepare your guild for epic battles!</p>
          </div>
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
              className={`tab-btn ${walletView === 'payments' ? 'active' : ''}`}
              onClick={() => setWalletView('payments')}
            >
              💳 Payments
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

          {/* Payments View */}
          {walletView === 'payments' && (
            <div className="wallet-content">
              <h3>💳 Payment History</h3>
              
              {/* Payment Methods Configuration */}
              {paymentConfig && (
                <div className="payment-config">
                  <h4>Available Payment Methods</h4>
                  <div className="payment-methods-status">
                    <div className={`method-status ${paymentConfig.stripe_enabled ? 'enabled' : 'disabled'}`}>
                      <span>💳 Credit/Debit Cards</span>
                      <span className="status">{paymentConfig.stripe_enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className={`method-status ${paymentConfig.paypal_enabled ? 'enabled' : 'disabled'}`}>
                      <span>🅿️ PayPal</span>
                      <span className="status">{paymentConfig.paypal_enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className={`method-status ${paymentConfig.coinbase_enabled ? 'enabled' : 'disabled'}`}>
                      <span>₿ Cryptocurrency</span>
                      <span className="status">{paymentConfig.coinbase_enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payout Request Button */}
              <div className="payout-section">
                <button 
                  className="payout-request-button"
                  onClick={() => setShowPayoutRequestModal(true)}
                  disabled={!walletBalance || walletBalance.available_balance < (paymentConfig?.minimum_payout || 10)}
                >
                  💰 Request Payout
                </button>
                <p className="payout-note">
                  Minimum payout: ${paymentConfig?.minimum_payout || 10}
                </p>
              </div>

              {/* Payment History */}
              <div className="payment-history">
                <h4>💳 Recent Payments</h4>
                {paymentHistory.length > 0 ? (
                  <div className="payment-list">
                    {paymentHistory.map((payment, index) => (
                      <div key={index} className="payment-item">
                        <div className="payment-item-info">
                          <div className="payment-item-tournament">
                            Tournament Entry - {payment.tournament_id}
                          </div>
                          <div className="payment-item-date">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="payment-item-amount">
                          ${payment.amount}
                        </div>
                        <div className={`payment-item-status ${payment.status}`}>
                          {payment.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-payments">
                    <p>No payment history found.</p>
                  </div>
                )}
              </div>
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

  // =============================================================================
  // SPORTSDUEL SYSTEM RENDER FUNCTION
  // =============================================================================
  
  // Add search state
  const [sportsduelSearch, setSportsduelSearch] = useState('');
  
  // Advanced filtering states for SportsDuel
  const [sportsduelFilters, setSportsduelFilters] = useState({
    country: 'all',
    organization: 'all', 
    tournament: 'all',
    status: 'live'
  });

  const renderSportsDuel = () => {
    // Mock data for matches
    const teamMatches = [
      {
        id: 1,
        tournament: { 
          name: 'ELITE WoBeRa Championship 2024', 
          category: 'Premier League', 
          season: 'Spring 2024',
          country: '10th Matchday',
          prize: '€50,000'
        },
        status: 'LIVE',
        timeRemaining: '2h 15m',
        matchTime: '15:30',
        duration: '2h 15m',
        team1: { 
          name: 'CHELSEA WIZARDS', 
          logo: 'https://images.unsplash.com/photo-1577223618563-3d858655ab86?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxzb2NjZXIlMjBsb2dvc3xlbnwwfHx8fDE3NTMwMjc2NDZ8MA&ixlib=rb-4.1.0&q=85', 
          country: '🇬🇧',
          countryName: 'United Kingdom',
          teamScore: 15, // Won individual matches
          totalMatches: 34
        },
        team2: { 
          name: 'GLYFADA SHARKS', 
          logo: 'https://images.unsplash.com/photo-1707414038523-b5d1c8294786?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMGJhZGdlc3xlbnwwfHx8fDE3NTMwMjc2MTl8MA&ixlib=rb-4.1.0&q=85', 
          country: '🇬🇷',
          countryName: 'Greece',
          teamScore: 19, // Won individual matches
          totalMatches: 34
        },
        // Current 1v1 active matches with detailed player info
        activeMatches: [
          {
            player1: { 
              name: 'LiLinGeo', 
              avatar: 'https://images.unsplash.com/photo-1615418674317-2b3674c2b287?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxhdGhsZXRlJTIwcG9ydHJhaXRzfGVufDB8fHx8MTc1MzAyNzYyOHww&ixlib=rb-4.1.0&q=85', 
              team: 'team1', 
              currentScore: 2.30, 
              maxScore: 5.20, 
              trend: 'up',
              record: { wins: 18, losses: 12 },
              seriesRecord: { wins: 3, losses: 1 },
              rank: '#6'
            },
            player2: { 
              name: 'CarlBrash', 
              avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxhdGhsZXRlJTIwcG9ydHJhaXRzfGVufDB8fHx8MTc1MzAyNzYyOHww&ixlib=rb-4.1.0&q=85', 
              team: 'team2', 
              currentScore: 4.80, 
              maxScore: 5.20, 
              trend: 'up',
              record: { wins: 22, losses: 8 },
              seriesRecord: { wins: 4, losses: 0 },
              rank: '#3'
            }
          },
          {
            player1: { 
              name: 'Bob', 
              avatar: 'https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxhdGhsZXRlJTIwcG9ydHJhaXRzfGVufDB8fHx8MTc1MzAyNzYyOHww&ixlib=rb-4.1.0&q=85', 
              team: 'team1', 
              currentScore: 3.60, 
              maxScore: 4.26, 
              trend: 'up',
              record: { wins: 14, losses: 16 },
              seriesRecord: { wins: 2, losses: 2 },
              rank: '#15'
            },
            player2: { 
              name: 'Eve', 
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b0e0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHw1fHxhdGhsZXRlJTIwcG9ydHJhaXRzfGVufDB8fHx8MTc1MzAyNzYyOHww&ixlib=rb-4.1.0&q=85', 
              team: 'team2', 
              currentScore: 3.60, 
              maxScore: 3.95, 
              trend: 'stable',
              record: { wins: 19, losses: 11 },
              seriesRecord: { wins: 3, losses: 1 },
              rank: '#5'
            }
          }
        ]
      },
      {
        id: 2,
        tournament: { 
          name: 'EUROPA WoBeRa League 2024', 
          category: 'Europa Conference', 
          season: 'Spring 2024',
          country: '5th Matchday',
          prize: '€25,000'
        },
        status: 'LIVE',
        timeRemaining: '1h 32m',
        matchTime: '16:00',
        duration: '1h 30m',
        team1: { 
          name: 'MADRID EAGLES', 
          logo: 'https://images.unsplash.com/photo-1640182837698-d1dee88748b1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxzcG9ydHMlMjB0ZWFtJTIwbG9nb3N8ZW58MHx8fHwxNzUzMDI3NjExfDA&ixlib=rb-4.1.0&q=85', 
          country: '🇪🇸',
          countryName: 'Spain',
          teamScore: 8, // Won individual matches  
          totalMatches: 20
        },
        team2: { 
          name: 'BARCELONA WOLVES', 
          logo: 'https://images.unsplash.com/photo-1639895276073-5327a3ac56fd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjB0ZWFtJTIwbG9nb3N8ZW58MHx8fHwxNzUzMDI3NjExfDA&ixlib=rb-4.1.0&q=85', 
          country: '🇪🇸',
          countryName: 'Spain',
          teamScore: 12, // Won individual matches
          totalMatches: 20
        },
        activeMatches: [
          {
            player1: { 
              name: 'Spiderman', 
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHw3fHxhdGhsZXRlJTIwcG9ydHJhaXRzfGVufDB8fHx8MTc1MzAyNzYyOHww&ixlib=rb-4.1.0&q=85', 
              team: 'team1', 
              currentScore: 1.85, 
              maxScore: 3.64, 
              trend: 'stable',
              record: { wins: 11, losses: 4 },
              seriesRecord: { wins: 1, losses: 2 },
              rank: '#10'
            },
            player2: { 
              name: 'Superman', 
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHw4fHxhdGhsZXRlJTIwcG9ydHJhaXRzfGVufDB8fHx8MTc1MzAyNzYyOHww&ixlib=rb-4.1.0&q=85', 
              team: 'team2', 
              currentScore: 1.8, 
              maxScore: 1.9, 
              trend: 'down',
              record: { wins: 13, losses: 7 },
              seriesRecord: { wins: 2, losses: 1 },
              rank: '#7'
            }
          }
        ]
      },
      {
        id: 3,
        tournament: { 
          name: 'CHAMPIONS WoBeRa Cup 2024', 
          category: 'Championship Final', 
          season: 'Spring 2024',
          country: '15th Matchday',
          prize: '€100,000'
        },
        status: 'UPCOMING',
        timeRemaining: '45 minutes until start',
        matchTime: '19:00',
        duration: '2h 15m',
        team1: { 
          name: 'LIVERPOOL REDS', 
          logo: 'https://images.unsplash.com/photo-1632937925343-d8d581769c8a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwzfHxzcG9ydHMlMjB0ZWFtJTIwbG9nb3N8ZW58MHx8fHwxNzUzMDI3NjExfDA&ixlib=rb-4.1.0&q=85', 
          country: '🇬🇧',
          countryName: 'United Kingdom',
          teamScore: 0,
          totalMatches: 30
        },
        team2: { 
          name: 'MANCHESTER LIONS', 
          logo: 'https://images.unsplash.com/photo-1639895276073-5327a3ac56fd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjB0ZWFtJTIwbG9nb3N8ZW58MHx8fHwxNzUzMDI3NjExfDA&ixlib=rb-4.1.0&q=85', 
          country: '🇬🇧',
          countryName: 'United Kingdom',
          teamScore: 0,
          totalMatches: 30
        },
        activeMatches: [] // No active matches, upcoming tournament
      },
      {
        id: 4,
        tournament: { 
          name: 'BUNDESLIGA WoBeRa Championship', 
          category: 'German League', 
          season: 'Spring 2024',
          country: '8th Matchday',
          prize: '€35,000'
        },
        status: 'FINISHED',
        timeRemaining: 'Match completed',
        matchTime: '18:30',
        duration: '2h 15m',
        team1: { 
          name: 'BERLIN THUNDER', 
          logo: 'https://images.unsplash.com/photo-1577223618563-3d858655ab86?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxzb2NjZXIlMjBsb2dvc3xlbnwwfHx8fDE3NTMwMjc2NDZ8MA&ixlib=rb-4.1.0&q=85', 
          country: '🇩🇪',
          countryName: 'Germany',
          teamScore: 22,
          totalMatches: 25
        },
        team2: { 
          name: 'MUNICH WOLVES', 
          logo: 'https://images.unsplash.com/photo-1640182837698-d1dee88748b1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxzcG9ydHMlMjB0ZWFtJTIwbG9nb3N8ZW58MHx8fHwxNzUzMDI3NjExfDA&ixlib=rb-4.1.0&q=85', 
          country: '🇩🇪',
          countryName: 'Germany',
          teamScore: 3,
          totalMatches: 25
        },
        activeMatches: [] // No active matches, finished tournament
      }
    ];

    // Apply filters
    const filteredMatches = teamMatches.filter(match => {
      const searchMatch = sportsduelSearch === '' || 
        match.team1.name.toLowerCase().includes(sportsduelSearch.toLowerCase()) ||
        match.team2.name.toLowerCase().includes(sportsduelSearch.toLowerCase()) ||
        match.tournament.name.toLowerCase().includes(sportsduelSearch.toLowerCase());
        
      const countryMatch = sportsduelFilters.country === 'all' || 
        match.tournament.country.toLowerCase().includes(sportsduelFilters.country.toLowerCase());
        
      const organizationMatch = sportsduelFilters.organization === 'all' || 
        match.tournament.category === sportsduelFilters.organization;
        
      const tournamentMatch = sportsduelFilters.tournament === 'all' || 
        match.tournament.category === sportsduelFilters.tournament;
        
      const statusMatch = sportsduelFilters.status === 'all' || 
        match.status.toLowerCase() === sportsduelFilters.status.toLowerCase();

      return searchMatch && countryMatch && organizationMatch && tournamentMatch && statusMatch;
    });

    const availableCountries = ['all', ...new Set(teamMatches.map(match => match.tournament.country.split(' ')[0]))];
    const availableOrganizations = ['all', ...new Set(teamMatches.map(match => match.tournament.category))];
    const availableTournaments = ['all', ...new Set(teamMatches.map(match => match.tournament.category))];

    const calculateProgress = (current, max) => {
      const percentage = Math.round((current / max) * 100);
      let color = '#ffffff';
      if (percentage < 30) color = '#ff6b6b';
      else if (percentage < 60) color = '#ffd93d';
      else color = '#6bcf7f';
      
      return { percentage, color };
    };

    // If a match is selected, show detailed view
    if (selectedMatch) {
      return (
        <div className="sportsduel-container-professional">
          {/* Header */}
          <div className="sportsduel-header-professional">
            <div className="header-main-content">
              <div className="brand-section">
                <div className="brand-logo">⚽</div>
                <div className="brand-text">
                  <h1>WoBeRa SportsDuel</h1>
                  <p>LIVE CHAMPIONSHIP NETWORK</p>
                </div>
              </div>
              <div className="header-right">
                <div className="live-status-professional">
                  <div className="live-pulse"></div>
                  <span className="live-text">LIVE</span>
                  <span className="live-count">{filteredMatches.filter(m => m.status === 'LIVE').length}</span>
                </div>
                <div className="last-updated-professional">
                  <div className="update-icon">🔄</div>
                  <span>Updated: 7:17:21 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="back-navigation">
            <button 
              className="back-button-professional"
              onClick={() => setSelectedMatch(null)}
            >
              ← Back to Matches
            </button>
          </div>

          {/* Single Match Detail View */}
          <div className="professional-matches-grid">
            <div className="professional-match-card">
              <div className="tournament-header-professional">
                <div className="tournament-info-professional">
                  <div className="tournament-meta">
                    <div className="tournament-name">{selectedMatch.tournament.name}</div>
                    <div className="tournament-details-professional">
                      <span className="tournament-category">{selectedMatch.tournament.category}</span>
                      <span className="tournament-separator">•</span>
                      <span className="tournament-country">{selectedMatch.tournament.country}</span>
                      <span className="tournament-separator">•</span>
                      <span className="tournament-prize">{selectedMatch.tournament.prize}</span>
                    </div>
                  </div>
                  <div className="match-timing">
                    <div className={`match-status-professional status-${selectedMatch.status.toLowerCase()}`}>
                      {selectedMatch.status}
                    </div>
                    <div className="match-time">{selectedMatch.matchTime}</div>
                    <div className="match-duration">{selectedMatch.timeRemaining}</div>
                  </div>
                </div>
              </div>
              
              {/* Team vs Team Section */}
              <div className="teams-section-professional">
                <div className="team-professional team1">
                  <div className="team-visual">
                    <img src={selectedMatch.team1.logo} alt={selectedMatch.team1.name} className="team-logo-professional" />
                    <div className="team-country-flag">{selectedMatch.team1.country.toUpperCase()}</div>
                  </div>
                  <div className="team-info-professional">
                    <div className="team-name-with-score">
                      <span className="team-name-professional">{selectedMatch.team1.name}</span>
                      <span className="team-score-after-name">{selectedMatch.team1.teamScore}</span>
                    </div>
                    <div className="team-country-name">{selectedMatch.team1.countryName}</div>
                  </div>
                </div>
                
                <div className="scores-section-professional">
                  <div className="vs-section-professional">
                    <div className="vs-circle-static">
                      <span className="vs-text">VS</span>
                    </div>
                    <div className="match-progress">
                      <div className="progress-text">{selectedMatch.team1.teamScore + selectedMatch.team2.teamScore}/{selectedMatch.team1.totalMatches}</div>
                    </div>
                  </div>
                </div>
                
                <div className="team-professional team2">
                  <div className="team-info-professional team2-info">
                    <div className="team-name-with-score">
                      <span className="team-score-before-name">{selectedMatch.team2.teamScore}</span>
                      <span className="team-name-professional">{selectedMatch.team2.name}</span>
                    </div>
                    <div className="team-country-name">{selectedMatch.team2.countryName}</div>
                  </div>
                  <div className="team-visual">
                    <img src={selectedMatch.team2.logo} alt={selectedMatch.team2.name} className="team-logo-professional" />
                    <div className="team-country-flag">{selectedMatch.team2.country.toUpperCase()}</div>
                  </div>
                </div>
              </div>

              {/* Active 1v1 Matches or Upcoming Tournament Info */}
              {selectedMatch.activeMatches.length > 0 ? (
                <div className="active-matches-professional">
                  <div className="matches-header-professional">
                    <div className="section-title-professional">
                      <span className="live-indicator-small"></span>
                      <span className="section-text">Live 1v1 Matches</span>
                      <span className="matches-count-small">({selectedMatch.activeMatches.length})</span>
                    </div>
                  </div>
                  
                  <div className="player-matches-grid-professional">
                    {selectedMatch.activeMatches.map((playerMatch, index) => {
                      const progress1 = calculateProgress(playerMatch.player1.currentScore, playerMatch.player1.maxScore);
                      const progress2 = calculateProgress(playerMatch.player2.currentScore, playerMatch.player2.maxScore);
                      
                      // Determine winner/loser indicators
                      const player1Leading = playerMatch.player1.currentScore > playerMatch.player2.currentScore;
                      const player2Leading = playerMatch.player2.currentScore > playerMatch.player1.currentScore;
                      
                      return (
                        <div key={index} className="player-match-professional">
                          {/* Player 1 */}
                          <div className="player-section-professional">
                            <div className={`player-avatar-professional ${player1Leading ? 'winning-border' : player2Leading ? 'losing-border' : 'tied-border'}`}>
                              <img src={playerMatch.player1.avatar} alt={playerMatch.player1.name} />
                            </div>
                            <div className="player-details-professional">
                              <div className="player-name-professional">{playerMatch.player1.name}</div>
                              <div className="player-rank-professional">{playerMatch.player1.rank}</div>
                              <div className="score-display-professional">
                                <span className="current-score">{playerMatch.player1.currentScore}</span>
                                <span className="score-separator">/</span>
                                <span className="max-score">{playerMatch.player1.maxScore}</span>
                                <span className="percentage-professional">({progress1.percentage}%)</span>
                              </div>
                              <div className="progress-bar-professional">
                                <div 
                                  className="progress-fill-professional" 
                                  style={{
                                    width: `${progress1.percentage}%`,
                                    backgroundColor: progress1.color
                                  }}
                                ></div>
                              </div>
                              <div className="player-records-professional">
                                <div className="overall-record">
                                  <span className="record-label">Overall:</span>
                                  <span className="record-value">{playerMatch.player1.record.wins}W-{playerMatch.player1.record.losses}L</span>
                                </div>
                                <div className="series-record">
                                  <span className="record-label">Series:</span>
                                  <span className="record-value">{playerMatch.player1.seriesRecord.wins}-{playerMatch.player1.seriesRecord.losses}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* VS Divider */}
                          <div className="vs-divider-professional">
                            <div className="vs-text-small">VS</div>
                            <div className="match-trend">
                              {playerMatch.player1.trend === 'up' && playerMatch.player2.trend === 'up' ? '📈📈' :
                               playerMatch.player1.trend === 'down' && playerMatch.player2.trend === 'down' ? '📉📉' :
                               '⚡'}
                            </div>
                          </div>

                          {/* Player 2 */}
                          <div className="player-section-professional">
                            <div className="player-details-professional player2-details">
                              <div className="player-name-professional">{playerMatch.player2.name}</div>
                              <div className="player-rank-professional">{playerMatch.player2.rank}</div>
                              <div className="score-display-professional">
                                <span className="percentage-professional">({progress2.percentage}%)</span>
                                <span className="current-score">{playerMatch.player2.currentScore}</span>
                                <span className="score-separator">/</span>
                                <span className="max-score">{playerMatch.player2.maxScore}</span>
                              </div>
                              <div className="progress-bar-professional">
                                <div 
                                  className="progress-fill-professional" 
                                  style={{
                                    width: `${progress2.percentage}%`,
                                    backgroundColor: progress2.color
                                  }}
                                ></div>
                              </div>
                              <div className="player-records-professional">
                                <div className="overall-record">
                                  <span className="record-label">Overall:</span>
                                  <span className="record-value">{playerMatch.player2.record.wins}W-{playerMatch.player2.record.losses}L</span>
                                </div>
                                <div className="series-record">
                                  <span className="record-label">Series:</span>
                                  <span className="record-value">{playerMatch.player2.seriesRecord.wins}-{playerMatch.player2.seriesRecord.losses}</span>
                                </div>
                              </div>
                            </div>
                            <div className={`player-avatar-professional ${player2Leading ? 'winning-border' : player1Leading ? 'losing-border' : 'tied-border'}`}>
                              <img src={playerMatch.player2.avatar} alt={playerMatch.player2.name} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="upcoming-tournament-professional">
                  <div className="upcoming-header-professional">
                    <div className="section-title-professional">
                      <span className="upcoming-indicator">⏰</span>
                      <span className="section-text">Upcoming Tournament</span>
                      <span className="time-until-start">{selectedMatch.timeRemaining}</span>
                    </div>
                  </div>
                  <div className="upcoming-details-professional">
                    <div className="upcoming-info">
                      <div className="upcoming-status">Τόσα λεπτά until tournament begins</div>
                      <div className="participants-ready">
                        <span className="ready-icon">✅</span>
                        <span className="ready-text">All {selectedMatch.team1.totalMatches} players registered and ready</span>
                      </div>
                      <div className="tournament-preview">
                        <div className="preview-teams">
                          <span className="team-preview">{selectedMatch.team1.name}</span>
                          <span className="vs-preview">vs</span>
                          <span className="team-preview">{selectedMatch.team2.name}</span>
                        </div>
                        <div className="preview-prize">Prize Pool: {selectedMatch.tournament.prize}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Default: Show match list (livescores style)
    return (
      <div className="sportsduel-container-professional">
        {/* Header */}
        <div className="sportsduel-header-professional">
          <div className="header-main-content">
            <div className="brand-section">
              <div className="brand-logo">⚽</div>
              <div className="brand-text">
                <h1>WoBeRa SportsDuel</h1>
                <p>LIVE CHAMPIONSHIP NETWORK</p>
              </div>
            </div>
            <div className="header-right">
              <div className="live-status-professional">
                <div className="live-pulse"></div>
                <span className="live-text">LIVE</span>
                <span className="live-count">{filteredMatches.filter(m => m.status === 'LIVE').length}</span>
              </div>
              <div className="last-updated-professional">
                <div className="update-icon">🔄</div>
                <span>Updated: 7:17:21 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="sportsduel-controls-professional">
          <div className="search-section-professional">
            <div className="search-bar-professional">
              <input
                type="text"
                placeholder="🔍 Search teams, players, tournaments..."
                value={sportsduelSearch}
                onChange={(e) => setSportsduelSearch(e.target.value)}
                className="search-input-professional"
              />
            </div>
          </div>

          <div className="filters-panel-professional" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            <select 
              value={sportsduelFilters.country}
              onChange={(e) => setSportsduelFilters(prev => ({ ...prev, country: e.target.value }))}
              className="filter-select-professional"
            >
              <option value="all">All Countries</option>
              <option value="10th">10th Matchday</option>
              <option value="5th">5th Matchday</option>
              <option value="15th">15th Matchday</option>
              <option value="8th">8th Matchday</option>
            </select>
            
            <select 
              value={sportsduelFilters.organization}
              onChange={(e) => setSportsduelFilters(prev => ({ ...prev, organization: e.target.value }))}
              className="filter-select-professional"
            >
              <option value="all">All Organizations</option>
              <option value="Premier League">Premier League</option>
              <option value="Europa Conference">Europa Conference</option>
              <option value="Championship Final">Championship Final</option>
              <option value="German League">German League</option>
            </select>
            
            <select 
              value={sportsduelFilters.tournament}
              onChange={(e) => setSportsduelFilters(prev => ({ ...prev, tournament: e.target.value }))}
              className="filter-select-professional"
            >
              <option value="all">All Matches</option>
              <option value="Premier League">Premier League</option>
              <option value="Europa Conference">Europa Conference</option>
              <option value="Championship Final">Championship Final</option>
              <option value="German League">German League</option>
            </select>
            
            <select 
              value={sportsduelFilters.status}
              onChange={(e) => setSportsduelFilters(prev => ({ ...prev, status: e.target.value }))}
              className="filter-select-professional"
            >
              <option value="live">Live</option>
              <option value="finished">Finished</option>
              <option value="upcoming">Upcoming</option>
              <option value="all">All Status</option>
            </select>
          </div>
        </div>

        {/* Matches List - Livescores Style */}
        <div className="matches-list-container">
          {filteredMatches.map((match) => (
            <div 
              key={match.id} 
              className="match-item-livescores"
              onClick={() => setSelectedMatch(match)}
            >
              <div className="match-time-info">
                <div className="match-time">{match.matchTime}</div>
                <div className={`match-status-indicator status-${match.status.toLowerCase()}`}>
                  {match.status === 'LIVE' ? '●' : match.status === 'FINISHED' ? 'FIN' : '●'}
                </div>
              </div>

              <div className="match-teams">
                <div className="team-row">
                  <div className="team-left">
                    <img src={match.team1.logo} alt="" className="team-logo-small" />
                    <span className="team-name-livescores">{match.team1.name}</span>
                  </div>
                  <div className="team-score-livescores">{match.team1.teamScore}</div>
                </div>
                
                <div className="team-row">
                  <div className="team-left">
                    <img src={match.team2.logo} alt="" className="team-logo-small" />
                    <span className="team-name-livescores">{match.team2.name}</span>
                  </div>
                  <div className="team-score-livescores">{match.team2.teamScore}</div>
                </div>
              </div>

              <div className="match-info">
                <div className="tournament-name-small">{match.tournament.category}</div>
                <div className="match-day-small">{match.tournament.country}</div>
                {match.activeMatches.length > 0 && (
                  <div className="live-matches-count">
                    🔴 {match.activeMatches.length} Live 1v1
                  </div>
                )}
              </div>

              <div className="match-arrow">
                <span>›</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =============================================================================
  // LIVE CHAT SYSTEM FUNCTIONS
  // =============================================================================

  // Initialize chat WebSocket connection
  const initializeChatSocket = () => {
    if (!user || !token || chatSocket) return;

    // Use polling instead of WebSocket for better compatibility
    console.log('🔄 Starting chat system...');
    
    // Set connected state immediately
    setIsConnectedToChat(true);
    
    // Start polling for online users
    const pollOnlineUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/online-users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('👥 Online users:', data.online_users);
          setOnlineUsers(data.online_users);
        } else {
          console.error('Failed to fetch online users:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch online users:', error);
      }
    };
    
    // Start polling for rooms
    const pollRooms = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🏠 Available rooms:', data.rooms);
          setChatRooms(data.rooms);
        } else {
          console.error('Failed to fetch rooms:', response.status);
          // Set default rooms if API fails
          setChatRooms([
            {
              id: "general",
              name: "General Chat",
              type: "general",
              participant_count: 1
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
        // Set default rooms if API fails
        setChatRooms([
          {
            id: "general",
            name: "General Chat",
            type: "general",
            participant_count: 1
          }
        ]);
      }
    };
    
    // Start polling for messages
    const pollMessages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/messages/${currentChatRoom}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('💬 Messages:', data.messages);
          setChatMessages(data.messages);
        } else {
          console.error('Failed to fetch messages:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };
    
    // Initial fetch
    pollOnlineUsers();
    pollRooms();
    pollMessages();
    
    // Set up polling intervals
    const onlineUsersInterval = setInterval(pollOnlineUsers, 5000); // Every 5 seconds
    const roomsInterval = setInterval(pollRooms, 10000); // Every 10 seconds
    const messagesInterval = setInterval(pollMessages, 3000); // Every 3 seconds
    
    // Store intervals for cleanup
    setChatSocket({ 
      intervals: [onlineUsersInterval, roomsInterval, messagesInterval],
      isPolling: true
    });
  };

  // Disconnect from chat
  const disconnectFromChat = () => {
    if (chatSocket) {
      if (chatSocket.intervals) {
        // Clear polling intervals
        chatSocket.intervals.forEach(interval => clearInterval(interval));
      } else if (chatSocket.close) {
        // Close WebSocket if it's a real socket
        chatSocket.close();
      }
      setChatSocket(null);
    }
    setIsConnectedToChat(false);
    setChatMessages([]);
    setOnlineUsers([]);
    setChatRooms([]);
    setPrivateMessages([]);
  };

  // Send chat message
  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !isConnectedToChat) {
      console.log('❌ Cannot send message: message empty or not connected', {
        message: chatMessage,
        isConnected: isConnectedToChat
      });
      return;
    }

    try {
      const messageData = {
        room_id: currentChatRoom,
        message: chatMessage.trim()
      };

      console.log('📤 Sending message:', messageData);
      
      const response = await fetch(`${API_BASE_URL}/api/chat/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Message sent successfully:', result);
        
        // Add message to local state immediately
        setChatMessages(prev => [...prev, result.data]);
        
        setChatMessage('');
        setShowEmojiPicker(false);
        
        // Trigger immediate message refresh
        setTimeout(() => {
          refreshMessages();
        }, 100);
      } else {
        console.error('❌ Failed to send message:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  // Refresh messages manually
  const refreshMessages = async () => {
    if (!token || !currentChatRoom) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/messages/${currentChatRoom}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  };

  // Send private message
  const sendPrivateMessage = () => {
    if (!chatSocket || !privateMessage.trim() || !selectedPrivateUser) return;

    const messageData = {
      type: 'private_message',
      recipient_id: selectedPrivateUser.user_id,
      message: privateMessage.trim()
    };

    chatSocket.send(JSON.stringify(messageData));
    setPrivateMessage('');
    setShowPrivateMessageModal(false);
  };

  // Join chat room
  const joinChatRoom = (roomId) => {
    if (!chatSocket) return;

    const messageData = {
      type: 'join_room',
      room_id: roomId
    };

    chatSocket.send(JSON.stringify(messageData));
    setCurrentChatRoom(roomId);
    setChatMessages([]); // Clear previous messages
  };

  // Admin: Ban user
  const banUserFromChat = async () => {
    if (!selectedUserForBan || !banReason.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/admin/ban-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedUserForBan.user_id,
          reason: banReason.trim()
        })
      });

      if (response.ok) {
        setShowAdminChatModal(false);
        setSelectedUserForBan(null);
        setBanReason('');
        alert('User banned successfully');
      }
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  // Format timestamp for chat messages
  const formatChatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Add emoji to message
  const addEmojiToMessage = (emojiObject) => {
    setChatMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Get current room name
  const getCurrentRoomName = () => {
    const room = chatRooms.find(r => r.id === currentChatRoom);
    return room ? room.name : 'General Chat';
  };

  // Render chat popup
  const renderChatPopup = () => {
    if (!showChatPopup) return null;

    return (
      <div className={`chat-popup ${isChatMinimized ? 'minimized' : ''}`}>
        <div className="chat-header">
          <div className="chat-title">
            <span>💬 Live Chat</span>
            <div className="chat-connection-status">
              {isConnectedToChat ? (
                <span className="connected">🟢 Connected</span>
              ) : (
                <span className="disconnected">🔴 Disconnected</span>
              )}
            </div>
          </div>
          <div className="chat-controls">
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => setIsChatMinimized(!isChatMinimized)}
              title={isChatMinimized ? "Maximize" : "Minimize"}
            >
              {isChatMinimized ? '⬆️' : '⬇️'}
            </button>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => setShowChatPopup(false)}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {!isChatMinimized && (
          <>
            <div className="chat-tabs">
              <button 
                className={`chat-tab ${chatTab === 'room' ? 'active' : ''}`}
                onClick={() => setChatTab('room')}
              >
                Rooms
              </button>
              <button 
                className={`chat-tab ${chatTab === 'private' ? 'active' : ''}`}
                onClick={() => setChatTab('private')}
              >
                Private ({privateMessages.length})
              </button>
            </div>

            <div className="chat-content">
              <div className="chat-main">
                {chatTab === 'room' && (
                  <div className="chat-room-section">
                    <div className="chat-room-selector">
                      <select 
                        value={currentChatRoom} 
                        onChange={(e) => joinChatRoom(e.target.value)}
                        className="room-select"
                      >
                        {/* Always show general room as first option */}
                        <option value="general">General Chat</option>
                        {chatRooms.filter(room => room.id !== 'general').map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} ({room.participant_count || 0})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="chat-messages">
                      {chatMessages
                        .filter(msg => msg.room_id === currentChatRoom)
                        .map(message => (
                        <div key={message.id} className={`chat-message ${message.is_system ? 'system' : ''}`}>
                          <div className="message-header">
                            <span className={`username ${message.sender_username === user?.username ? 'own-message' : ''}`}>
                              {message.sender_username}
                            </span>
                            <span className="timestamp">{formatChatTime(message.timestamp)}</span>
                          </div>
                          <div className="message-text">{message.message}</div>
                        </div>
                      ))}
                    </div>

                    <div className="chat-input-container">
                      <div className="chat-input-row">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                          placeholder="Type a message..."
                          className="chat-input"
                        />
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          😊
                        </button>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={sendChatMessage}
                          disabled={!chatMessage.trim()}
                        >
                          Send
                        </button>
                      </div>
                      
                      {showEmojiPicker && (
                        <div className="emoji-picker-container">
                          <EmojiPicker
                            onEmojiClick={addEmojiToMessage}
                            autoFocusSearch={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {chatTab === 'private' && (
                  <div className="private-messages-section">
                    <div className="private-messages-header">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => setShowPrivateMessageModal(true)}
                      >
                        + New Private Message
                      </button>
                    </div>
                    
                    <div className="private-messages-list">
                      {privateMessages.map(message => (
                        <div key={message.id} className="private-message">
                          <div className="message-header">
                            <span className={`username ${message.sender_username === user?.username ? 'own-message' : ''}`}>
                              {message.sender_username === user?.username ? 'You' : message.sender_username}
                            </span>
                            <span className="timestamp">{formatChatTime(message.timestamp)}</span>
                          </div>
                          <div className="message-text">{message.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="chat-sidebar">
                <div className="online-users">
                  <h4>Online Users ({onlineUsers.length})</h4>
                  <div className="users-list">
                    {onlineUsers.length === 0 ? (
                      <div className="no-users">Connecting...</div>
                    ) : (
                      onlineUsers.map(onlineUser => (
                        <div key={onlineUser.user_id} className="online-user">
                          <span className={`user-role ${onlineUser.admin_role}`}>
                            {onlineUser.admin_role === 'god' ? '👑' : 
                             onlineUser.admin_role === 'super_admin' ? '⚡' :
                             onlineUser.admin_role === 'admin' ? '⭐' : '👤'}
                          </span>
                          <span className="username">{onlineUser.username}</span>
                          <div className="user-actions">
                            <button 
                              className="btn btn-xs btn-primary"
                              onClick={() => {
                                setSelectedPrivateUser(onlineUser);
                                setShowPrivateMessageModal(true);
                              }}
                              title="Send private message"
                            >
                              💬
                            </button>
                            {user && ['admin', 'super_admin', 'god'].includes(user.admin_role) && onlineUser.user_id !== user.user_id && (
                              <button 
                                className="btn btn-xs btn-danger"
                                onClick={() => {
                                  setSelectedUserForBan(onlineUser);
                                  setShowAdminChatModal(true);
                                }}
                                title="Ban user"
                              >
                                🚫
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {isChatMinimized && (
          <div className="chat-minimized-content">
            <div className="chat-summary">
              <span>💬 {onlineUsers.length} online</span>
              {unreadMessages > 0 && (
                <span className="unread-mini-badge">{unreadMessages}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render private message modal
  const renderPrivateMessageModal = () => {
    if (!showPrivateMessageModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Send Private Message</h3>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowPrivateMessageModal(false)}
            >
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>To:</label>
              <select 
                value={selectedPrivateUser?.user_id || ''}
                onChange={(e) => {
                  const user = onlineUsers.find(u => u.user_id === e.target.value);
                  setSelectedPrivateUser(user);
                }}
                className="form-control"
              >
                <option value="">Select user...</option>
                {onlineUsers.filter(u => u.user_id !== user?.user_id).map(u => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Message:</label>
              <textarea
                value={privateMessage}
                onChange={(e) => setPrivateMessage(e.target.value)}
                placeholder="Type your private message..."
                className="form-control"
                rows="3"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowPrivateMessageModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={sendPrivateMessage}
              disabled={!selectedPrivateUser || !privateMessage.trim()}
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render admin chat modal
  const renderAdminChatModal = () => {
    if (!showAdminChatModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Ban User from Chat</h3>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAdminChatModal(false)}
            >
              ✕
            </button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to ban <strong>{selectedUserForBan?.username}</strong> from chat?</p>
            <div className="form-group">
              <label>Reason:</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for ban..."
                className="form-control"
                rows="3"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAdminChatModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-danger"
              onClick={banUserFromChat}
              disabled={!banReason.trim()}
            >
              Ban User
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Initialize chat when user logs in
  useEffect(() => {
    if (user && token && !chatSocket) {
      // Add a small delay to avoid blocking the UI
      setTimeout(() => {
        initializeChatSocket();
      }, 1000);
    } else if (!user && chatSocket) {
      disconnectFromChat();
    }
  }, [user, token]);

  // Reset unread messages when chat popup opens or maximizes
  useEffect(() => {
    if (showChatPopup && !isChatMinimized) {
      setUnreadMessages(0);
    }
  }, [showChatPopup, isChatMinimized]);

  // Save chat persistent state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('wobera_chat_state', JSON.stringify({
        isMinimized: isChatMinimized,
        showPopup: showChatPopup,
        persistentState: chatPersistentState
      }));
    }
  }, [isChatMinimized, showChatPopup, chatPersistentState, user]);

  // Load chat persistent state from localStorage
  useEffect(() => {
    if (user) {
      const savedState = localStorage.getItem('wobera_chat_state');
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          if (parsedState.persistentState) {
            setIsChatMinimized(parsedState.isMinimized || false);
            setShowChatPopup(parsedState.showPopup || false);
          }
        } catch (error) {
          console.error('Error loading chat state:', error);
        }
      }
    }
  }, [user]);

  // Don't close chat when changing views if it's in persistent state
  useEffect(() => {
    if (user && chatSocket && !showChatPopup && chatPersistentState) {
      // Keep chat running in background
      console.log('Chat running in background...');
    }
  }, [currentView, chatSocket, showChatPopup, chatPersistentState, user]);

  return (
    <div className="App">
      <nav className={`navbar ${user ? 'logged-in' : ''} ${isAdmin ? 'admin-logged-in' : ''}`}>
        <div className="navbar-brand">
          <h1>WoBeRa</h1>
          <span className="brand-subtitle">World Betting Rank</span>
        </div>
        <div className="navbar-menu">
          {/* Smart Home/Dashboard Button */}
          <button 
            className={`nav-link ${(currentView === 'home' || currentView === 'dashboard') ? 'active' : ''}`}
            onClick={() => {
              const newView = user ? 'dashboard' : 'home';
              const title = user ? 'Dashboard' : 'Home';
              navigateWithBreadcrumb(newView, title);
            }}
          >
            {user ? '🏠 Dashboard' : '🏠 Home'}
          </button>
          
          {/* Rankings Dropdown */}
          <div 
            className={`nav-dropdown ${showRankingsDropdown ? 'mobile-open' : ''}`}
            onMouseEnter={() => window.innerWidth > 768 && setShowRankingsDropdown(true)}
            onMouseLeave={() => window.innerWidth > 768 && setShowRankingsDropdown(false)}
          >
            <button 
              className={`nav-link dropdown-trigger ${(currentView === 'rankings' || currentView === 'worldmap') ? 'active' : ''}`}
              onClick={() => {
                if (window.innerWidth <= 768) {
                  toggleMobileDropdown('rankings');
                } else {
                  navigateWithBreadcrumb('rankings', 'Rankings');
                }
              }}
            >
              🏆 Rankings <span className="dropdown-arrow">▼</span>
            </button>
            
            {showRankingsDropdown && (
              <div className="dropdown-menu">
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    navigateWithBreadcrumb('rankings', 'Leaderboard');
                    setShowRankingsDropdown(false);
                  }}
                >
                  🏅 Leaderboard
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    navigateWithHistory('worldmap', 'World Map');
                    setShowRankingsDropdown(false);
                  }}
                >
                  🌍 World Map
                </button>
              </div>
            )}
          </div>

          {/* Guilds Menu - only show for logged in users */}
          {user && (
            <div 
              className={`nav-dropdown ${showGuildsDropdown ? 'mobile-open' : ''}`}
              onMouseEnter={() => window.innerWidth > 768 && setShowGuildsDropdown(true)}
              onMouseLeave={() => window.innerWidth > 768 && setShowGuildsDropdown(false)}
            >
              <button 
                className={`nav-link dropdown-trigger ${(currentView.startsWith('guild') || currentView === 'teams' || currentView.startsWith('team-') || showFriendsModal) ? 'active' : ''}`}
                onClick={() => {
                  if (window.innerWidth <= 768) {
                    toggleMobileDropdown('guilds');
                  } else {
                    setShowGuildsDropdown(!showGuildsDropdown);
                  }
                }}
              >
                🏰 {t.guilds} <span className="dropdown-arrow">▼</span>
              </button>
              {showGuildsDropdown && (
                <div className="dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      navigateWithBreadcrumb('guilds', 'Browse Guilds');
                      setShowGuildsDropdown(false);
                    }}
                  >
                    🏰 {t.browseGuilds}
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      navigateWithBreadcrumb('guild-rankings', 'Guild Rankings');
                      setShowGuildsDropdown(false);
                    }}
                  >
                    🏆 {t.guildRankings}
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      navigateWithBreadcrumb('my-guild', 'My Guild');
                      setShowGuildsDropdown(false);
                    }}
                  >
                    ⭐ {t.myGuild}
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      navigateWithBreadcrumb('guild-wars', 'Guild Wars');
                      setShowGuildsDropdown(false);
                    }}
                  >
                    ⚔️ {t.guildWars}
                  </button>
                  <div className="dropdown-divider"></div>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      navigateWithBreadcrumb('teams', 'Browse Teams');
                      setShowGuildsDropdown(false);
                    }}
                  >
                    👥 Teams
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setShowFriendsModal(true);
                      fetchFriends();
                      fetchFriendRequests();
                      fetchFriendRecommendations();
                      setShowGuildsDropdown(false);
                    }}
                  >
                    👥 Friends {friendRequests.length > 0 && (
                      <span className="friend-request-badge">{friendRequests.length}</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Tournaments Dropdown */}
          <div 
            className={`nav-dropdown ${showTournamentsDropdown ? 'mobile-open' : ''}`}
            onMouseEnter={() => window.innerWidth > 768 && setShowTournamentsDropdown(true)}
            onMouseLeave={() => window.innerWidth > 768 && setShowTournamentsDropdown(false)}
          >
            <button 
              className={`nav-link dropdown-trigger ${currentView === 'tournament' ? 'active' : ''}`}
              onClick={() => {
                if (window.innerWidth <= 768) {
                  toggleMobileDropdown('tournaments');
                } else {
                  navigateWithBreadcrumb('tournament', 'Tournaments');
                }
              }}
            >
              🎯 Tournaments <span className="dropdown-arrow">▼</span>
            </button>
            
            {showTournamentsDropdown && (
              <div className="dropdown-menu">
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    navigateWithBreadcrumb('tournament', 'Active Tournaments');
                    setShowTournamentsDropdown(false);
                  }}
                >
                  🎯 Active Tournaments
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    navigateWithBreadcrumb('tournament', 'Tournament Schedule');
                    setShowTournamentsDropdown(false);
                  }}
                >
                  📅 Schedule
                </button>
              </div>
            )}
          </div>

          {/* Live Scores Menu - only show for logged in users */}
          {user && (
            <button 
              className={`nav-link ${currentView === 'sportsduel' ? 'active' : ''}`}
              onClick={() => setCurrentView('sportsduel')}
            >
              📈 Live Scores
            </button>
          )}
          
          {/* Standings (Βαθμολογίες) Dropdown */}
          <div 
            className={`nav-dropdown ${showStandingsDropdown ? 'mobile-open' : ''}`}
            onMouseEnter={() => window.innerWidth > 768 && setShowStandingsDropdown(true)}
            onMouseLeave={() => window.innerWidth > 768 && setShowStandingsDropdown(false)}
          >
            <button 
              className={`nav-link dropdown-trigger ${currentView === 'standings' ? 'active' : ''}`}
              onClick={() => {
                if (window.innerWidth <= 768) {
                  toggleMobileDropdown('standings');
                } else {
                  navigateWithBreadcrumb('standings', 'Standings');
                }
              }}
            >
              📊 Standings <span className="dropdown-arrow">▼</span>
            </button>
            
            {showStandingsDropdown && (
              <div className="dropdown-menu standings-dropdown">
                {/* Always show default countries, even if leagues aren't created yet */}
                <>
                  {/* Fixtures Section */}
                  <div className="dropdown-section">
                    <div className="dropdown-section-header">
                      ⚽ Fixtures
                    </div>
                    {defaultCountries.slice(0, 4).map((country) => {
                      const existingLeague = nationalLeagues.find(league => 
                        league.country.toLowerCase() === country.name.toLowerCase()
                      );
                      return (
                        <div key={`fixtures-${country.name}`} className="dropdown-country">
                          <div className="dropdown-country-header">
                            {country.flag} {country.name}
                          </div>
                          <button 
                            className="dropdown-item dropdown-sub-item"
                            onClick={() => {
                              navigateWithBreadcrumb('fixtures', `${country.name} Premier Fixtures`);
                              if (existingLeague?.premier) {
                                fetchLeagueFixtures(country.name, 'premier');
                              }
                              setShowStandingsDropdown(false);
                            }}
                          >
                            📅 {country.name} Premier
                          </button>
                          <button 
                            className="dropdown-item dropdown-sub-item"
                            onClick={() => {
                              navigateWithBreadcrumb('fixtures', `${country.name} League 2 Fixtures`);
                              if (existingLeague?.league_2) {
                                fetchLeagueFixtures(country.name, 'league_2');
                              }
                              setShowStandingsDropdown(false);
                            }}
                          >
                            📅 {country.name} League 2
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Standings Section */}
                  <div className="dropdown-section">
                    <div className="dropdown-section-header">
                      📊 Standings
                    </div>
                    {defaultCountries.slice(0, 4).map((country) => {
                      const existingLeague = nationalLeagues.find(league => 
                        league.country.toLowerCase() === country.name.toLowerCase()
                      );
                      return (
                        <div key={`standings-${country.name}`} className="dropdown-country">
                          <div className="dropdown-country-header">
                            {country.flag} {country.name}
                          </div>
                          <button 
                            className="dropdown-item dropdown-sub-item"
                            onClick={() => {
                              if (existingLeague?.premier) {
                                fetchLeagueStandings(country.name, 'premier');
                              }
                              navigateWithBreadcrumb('standings', `${country.name} Premier`);
                              setShowStandingsDropdown(false);
                            }}
                          >
                            🥇 {country.name} Premier
                          </button>
                          <button 
                            className="dropdown-item dropdown-sub-item"
                            onClick={() => {
                              if (existingLeague?.league_2) {
                                fetchLeagueStandings(country.name, 'league_2');
                              }
                              navigateWithBreadcrumb('standings', `${country.name} League 2`);
                              setShowStandingsDropdown(false);
                            }}
                          >
                            🥈 {country.name} League 2
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              </div>
            )}
          </div>
          
          {/* Language Selector Dropdown */}
          <div className={`language-dropdown ${showSettingsDropdown ? 'hidden-by-settings' : ''}`}>
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
              {/* Admin Panel - only for admin users */}
              {isAdmin && (
                <button 
                  className={`nav-link admin-nav ${currentView === 'admin' ? 'active' : ''}`}
                  onClick={() => setCurrentView('admin')}
                >
                  ⚙️ {t.adminPanel}
                </button>
              )}
              
              {/* Chat Button */}
              <button 
                className="nav-link chat-button"
                onClick={() => {
                  if (showChatPopup) {
                    setIsChatMinimized(!isChatMinimized);
                  } else {
                    setShowChatPopup(true);
                    setIsChatMinimized(false);
                  }
                  if (!isConnectedToChat) {
                    initializeChatSocket();
                  }
                }}
              >
                💬 Chat
                {unreadMessages > 0 && !showChatPopup && (
                  <span className="unread-badge">{unreadMessages}</span>
                )}
              </button>
              
              {/* Settings Dropdown - Click-based */}
              <div 
                className={`nav-dropdown settings-dropdown ${showSettingsDropdown ? 'mobile-open' : ''}`}
                style={{ position: 'relative' }}
              >
                <button 
                  className={`nav-link dropdown-trigger ${(currentView === 'affiliate' || currentView === 'wallet' || showSettings || showSettingsDropdown) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettingsDropdown(!showSettingsDropdown);
                  }}
                >
                  ⚙️ Settings <span className="dropdown-arrow">▼</span>
                </button>
                
                {showSettingsDropdown && (
                  <div 
                    className="dropdown-menu advanced-settings-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* User Info & Deposit Section */}
                    <div className="settings-user-info">
                      <div className="settings-user-details">
                        <div className="settings-username">
                          {user?.username || 'guest'}
                        </div>
                        <div className="settings-balance">
                          💰 €{mockWalletData.balance.toFixed(2)}
                        </div>
                      </div>
                      <button 
                        className="settings-deposit-btn"
                        onClick={() => {
                          navigateWithHistory('wallet', 'Wallet & Deposits');
                          setShowSettingsDropdown(false);
                        }}
                      >
                        Deposit
                      </button>
                    </div>

                    {/* Withdrawable & Bet Credits */}
                    <div className="settings-balances">
                      <div className="settings-balance-item">
                        <div className="settings-balance-label">Withdrawable</div>
                        <div className="settings-balance-amount">
                          €{mockWalletData.withdrawable.toFixed(2)}
                        </div>
                      </div>
                      <div className="settings-balance-item">
                        <div className="settings-balance-label">Bet Credits</div>
                        <div className="settings-balance-amount">
                          €{mockWalletData.betCredits.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Main Menu Options */}
                    <div className="settings-menu-options">
                      <button 
                        className={`settings-menu-option ${showAccountSubmenu ? 'active' : ''}`}
                        onClick={() => setShowAccountSubmenu(!showAccountSubmenu)}
                      >
                        <span className="menu-icon">👨‍💼</span>
                        <span className="menu-text">Account</span>
                      </button>
                      <button 
                        className="settings-menu-option"
                        onClick={() => {
                          // TODO: Navigate to alerts
                          console.log('Navigate to Alerts');
                          setShowSettingsDropdown(false);
                        }}
                      >
                        <span className="menu-icon">🔔</span>
                        <span className="menu-text">Alerts</span>
                      </button>
                      <button 
                        className="settings-menu-option"
                        onClick={() => {
                          // TODO: Navigate to my offers
                          console.log('Navigate to My Offers');
                          setShowSettingsDropdown(false);
                        }}
                      >
                        <span className="menu-icon">🎯</span>
                        <span className="menu-text">Offers</span>
                      </button>
                      <button 
                        className="settings-menu-option"
                        onClick={() => {
                          openSettings();
                          setShowSettingsDropdown(false);
                        }}
                      >
                        <span className="menu-icon">⚙️</span>
                        <span className="menu-text">Settings</span>
                      </button>
                    </div>

                    {/* Account Submenu */}
                    {showAccountSubmenu && (
                      <div className="account-submenu">
                        <button 
                          className="account-submenu-item"
                          onClick={() => {
                            navigateWithHistory('wallet', 'Bank & Wallet');
                            setShowSettingsDropdown(false);
                            setShowAccountSubmenu(false);
                          }}
                        >
                          <span className="submenu-icon">🏦</span>
                          <span className="submenu-text">Bank</span>
                        </button>
                        <button 
                          className="account-submenu-item"
                          onClick={() => {
                            // TODO: Navigate to messages
                            console.log('Navigate to Messages');
                            setShowSettingsDropdown(false);
                            setShowAccountSubmenu(false);
                          }}
                        >
                          <span className="submenu-icon">✉️</span>
                          <span className="submenu-text">Messages</span>
                        </button>
                        <button 
                          className="account-submenu-item"
                          onClick={() => {
                            openSettings();
                            setShowSettingsDropdown(false);
                            setShowAccountSubmenu(false);
                          }}
                        >
                          <span className="submenu-icon">👤</span>
                          <span className="submenu-text">Profile</span>
                        </button>
                        <button 
                          className="account-submenu-item"
                          onClick={() => {
                            // TODO: Navigate to rules
                            console.log('Navigate to Rules');
                            setShowSettingsDropdown(false);
                            setShowAccountSubmenu(false);
                          }}
                        >
                          <span className="submenu-icon">📝</span>
                          <span className="submenu-text">Rules</span>
                        </button>
                        <button 
                          className="account-submenu-item"
                          onClick={() => {
                            // TODO: Navigate to my activity
                            console.log('Navigate to My Activity');
                            setShowSettingsDropdown(false);
                            setShowAccountSubmenu(false);
                          }}
                        >
                          <span className="submenu-icon">📊</span>
                          <span className="submenu-text">Activity</span>
                        </button>
                        <button 
                          className="account-submenu-item"
                          onClick={() => {
                            // TODO: Navigate to history
                            console.log('Navigate to History');
                            setShowSettingsDropdown(false);
                            setShowAccountSubmenu(false);
                          }}
                        >
                          <span className="submenu-icon">🕒</span>
                          <span className="submenu-text">History</span>
                        </button>
                        <button 
                          className="account-submenu-item"
                          onClick={() => {
                            navigateWithHistory('affiliate', 'Affiliate Program');
                            setShowSettingsDropdown(false);
                            setShowAccountSubmenu(false);
                          }}
                        >
                          <span className="submenu-icon">💰</span>
                          <span className="submenu-text">Affiliate</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
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
      
      {/* Back Navigation Button */}
      {canGoBack() && currentView !== 'home' && currentView !== 'dashboard' && (
        <div className="back-navigation">
          <button 
            className="back-button"
            onClick={goBack}
            title="Go back to previous page"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Debug Navigation Info - Temporary */}
      {currentView !== 'home' && currentView !== 'dashboard' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          <div>Current: {currentView}</div>
          <div>History: {navigationHistoryRef.current?.length || 0}</div>
          <div>Can Go Back: {canGoBack() ? 'Yes' : 'No'}</div>
          <div>Last Entry: {navigationHistoryRef.current?.[navigationHistoryRef.current.length - 1]?.view || 'None'}</div>
        </div>
      )}

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
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
      >
        {/* Breadcrumb Navigation */}
        {breadcrumbPath.length > 1 && (
          <nav className="breadcrumb">
            {breadcrumbPath.map((item, index) => (
              <span key={index}>
                {index < breadcrumbPath.length - 1 ? (
                  <>
                    <a 
                      href="#" 
                      className="breadcrumb-item"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateWithBreadcrumb(item.view, item.label);
                      }}
                    >
                      {item.label}
                    </a>
                    <span className="breadcrumb-separator">›</span>
                  </>
                ) : (
                  <span className="breadcrumb-item active">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        
        {currentView === 'home' && renderHome()}
        {currentView === 'login' && renderLogin()}
        {currentView === 'register' && renderRegister()}
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'rankings' && renderRankings()}
        {currentView === 'worldmap' && renderWorldMap()}
        {currentView === 'tournament' && renderTournament()}
        {currentView === 'teams' && renderTeams()}
        {currentView.startsWith('team-') && renderTeamDetails()}
        {currentView === 'guilds' && renderGuilds()}
        {currentView === 'guild-rankings' && renderGuildRankings()}
        {currentView === 'create-guild' && renderCreateGuild()}
        {currentView === 'my-guild' && renderMyGuild()}
        {currentView.startsWith('guild-') && renderGuildDetails()}
        {currentView === 'guild-wars' && renderGuildWars()}
        {currentView === 'standings' && renderStandings()}
        {currentView === 'fixtures' && renderFixtures()}
        {currentView === 'affiliate' && user && renderAffiliate()}
        {currentView === 'wallet' && user && renderWallet()}
        {currentView === 'sportsduel' && renderSportsDuel()}
        {currentView === 'admin' && isAdmin && renderAdminPanel()}
        {currentView === 'download' && <DownloadBackup />}
        
        {/* Mobile Navigation Indicator */}
        <div className="mobile-nav-indicator">
          <div className="nav-dots">
            {['home', 'rankings', 'worldmap', 'tournament', 'teams', user && 'guilds', user && 'dashboard', user && user.affiliate_id && 'affiliate', user && 'wallet', isAdmin && 'admin'].filter(Boolean).map((view) => (
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
      <AnimatePresence>
        {showCreateTeamModal && (
          <motion.div 
            className="modal-overlay" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateTeamModal(false);
              }
            }}
          >
            <motion.div 
              className="modal modal-large" 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>🏆 Create New Team</h3>
                <motion.button 
                  className="modal-close"
                  onClick={() => setShowCreateTeamModal(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  ✕
                </motion.button>
              </div>
              
              <div className="modal-content">
                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  console.log('FORM SUBMITTED - calling createTeam');
                  createTeam(); 
                }}>
                  <motion.div 
                    className="form-grid"
                    variants={staggerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div className="form-group" variants={itemVariants}>
                      <label>Team Name *</label>
                      <input
                        type="text"
                        value={teamFormData.name}
                        onChange={(e) => setTeamFormData({...teamFormData, name: e.target.value})}
                        placeholder="Enter team name"
                        className="form-input"
                        required
                      />
                    </motion.div>
                    
                    <motion.div className="form-group" variants={itemVariants}>
                      <label>Logo URL</label>
                      <input
                        type="url"
                        value={teamFormData.logo_url}
                        onChange={(e) => setTeamFormData({...teamFormData, logo_url: e.target.value})}
                        placeholder="https://example.com/logo.png"
                        className="form-input"
                      />
                    </motion.div>
                    
                    <motion.div className="form-group" variants={itemVariants}>
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
                    </motion.div>
                    
                    <motion.div className="form-group" variants={itemVariants}>
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
                    </motion.div>
                    
                    <motion.div className="form-group" variants={itemVariants}>
                      <label>City *</label>
                      <input
                        type="text"
                        value={teamFormData.city}
                        onChange={(e) => setTeamFormData({...teamFormData, city: e.target.value})}
                        placeholder="Enter city"
                        className="form-input"
                        required
                      />
                    </motion.div>
                    
                    <motion.div className="form-group" variants={itemVariants}>
                      <label>Country *</label>
                      <input
                        type="text"
                        value={teamFormData.country}
                        onChange={(e) => setTeamFormData({...teamFormData, country: e.target.value})}
                        placeholder="Enter country"
                        className="form-input"
                        required
                      />
                    </motion.div>
                    
                    <motion.div className="form-group" variants={itemVariants}>
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={teamFormData.phone}
                        onChange={(e) => setTeamFormData({...teamFormData, phone: e.target.value})}
                        placeholder="+30 123 456 7890"
                        className="form-input"
                      />
                    </motion.div>
                    
                    <motion.div className="form-group" variants={itemVariants}>
                      <label>Email *</label>
                      <input
                        type="email"
                        value={teamFormData.email}
                        onChange={(e) => setTeamFormData({...teamFormData, email: e.target.value})}
                        placeholder="team@example.com"
                        className="form-input"
                        required
                      />
                    </motion.div>
                  </motion.div>
                  
                  <motion.div 
                    className="modal-actions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        console.log('CANCEL CLICKED');
                        setShowCreateTeamModal(false);
                      }}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      Cancel
                    </motion.button>
                    <motion.button 
                      type="submit"
                      className="btn btn-primary"
                      disabled={teamLoading}
                      onClick={(e) => {
                        console.log('CREATE TEAM BUTTON CLICKED');
                      }}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {teamLoading ? '⏳ Creating...' : '🏆 Create Team'}
                    </motion.button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Team Invitation Modal */}
      <AnimatePresence>
        {showTeamInviteModal && selectedTeamForInvite && (
          <motion.div 
            className="modal-overlay" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowTeamInviteModal(false)}
          >
            <motion.div 
              className="modal" 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>📧 Invite Player to {selectedTeamForInvite.name}</h3>
                <motion.button 
                  className="modal-close"
                  onClick={() => setShowTeamInviteModal(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  ✕
                </motion.button>
              </div>
              
              <div className="modal-content">
                <form onSubmit={(e) => { e.preventDefault(); invitePlayerToTeam(selectedTeamForInvite.id); }}>
                  <motion.div 
                    className="form-group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
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
                  </motion.div>
                  
                  <motion.div 
                    className="team-info-preview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h4>Team: {selectedTeamForInvite.name}</h4>
                    <p>Players: {selectedTeamForInvite.current_player_count}/20</p>
                    <p>Status: {selectedTeamForInvite.status}</p>
                  </motion.div>
                  
                  <motion.div 
                    className="modal-actions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowTeamInviteModal(false)}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      Cancel
                    </motion.button>
                    <motion.button 
                      type="submit"
                      className="btn btn-primary"
                      disabled={teamLoading || !inviteUsername.trim()}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {teamLoading ? '⏳ Sending...' : '📧 Send Invitation'}
                    </motion.button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit Team Modal */}
      <AnimatePresence>
        {showEditTeamModal && selectedTeamForEdit && (
          <motion.div 
            className="modal-overlay" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowEditTeamModal(false)}
          >
            <motion.div 
              className="modal" 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>✏️ Edit Team: {selectedTeamForEdit.name}</h3>
                <motion.button 
                  className="modal-close"
                  onClick={() => setShowEditTeamModal(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  ✕
                </motion.button>
              </div>
              
              <div className="modal-content">
                <form onSubmit={(e) => { e.preventDefault(); updateTeam(); }}>
                  <motion.div 
                    className="form-group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label htmlFor="edit-team-name">Team Name *</label>
                    <input
                      id="edit-team-name"
                      type="text"
                      value={editTeamFormData.name}
                      onChange={(e) => setEditTeamFormData({...editTeamFormData, name: e.target.value})}
                      placeholder="Enter team name"
                      className="form-input"
                      required
                    />
                  </motion.div>
                  
                  <motion.div 
                    className="form-group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label htmlFor="edit-team-logo">Team Logo</label>
                    <div className="logo-upload-container">
                      <input
                        id="edit-team-logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="form-input file-input"
                      />
                      {logoPreview && (
                        <div className="logo-preview">
                          <img src={logoPreview} alt="Logo Preview" />
                        </div>
                      )}
                    </div>
                    <p className="form-help">
                      Upload a logo for your team (max 5MB)
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    className="form-row"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="form-group">
                      <label htmlFor="edit-team-primary-color">Primary Color *</label>
                      <input
                        id="edit-team-primary-color"
                        type="color"
                        value={editTeamFormData.colors.primary}
                        onChange={(e) => setEditTeamFormData({
                          ...editTeamFormData, 
                          colors: { ...editTeamFormData.colors, primary: e.target.value }
                        })}
                        className="form-input color-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="edit-team-secondary-color">Secondary Color</label>
                      <input
                        id="edit-team-secondary-color"
                        type="color"
                        value={editTeamFormData.colors.secondary}
                        onChange={(e) => setEditTeamFormData({
                          ...editTeamFormData, 
                          colors: { ...editTeamFormData.colors, secondary: e.target.value }
                        })}
                        className="form-input color-input"
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="form-row"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="form-group">
                      <label htmlFor="edit-team-city">City *</label>
                      <input
                        id="edit-team-city"
                        type="text"
                        value={editTeamFormData.city}
                        onChange={(e) => setEditTeamFormData({...editTeamFormData, city: e.target.value})}
                        placeholder="Enter city"
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="edit-team-country">Country *</label>
                      <input
                        id="edit-team-country"
                        type="text"
                        value={editTeamFormData.country}
                        onChange={(e) => setEditTeamFormData({...editTeamFormData, country: e.target.value})}
                        placeholder="Enter country"
                        className="form-input"
                        required
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="form-row"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="form-group">
                      <label htmlFor="edit-team-phone">Phone</label>
                      <input
                        id="edit-team-phone"
                        type="tel"
                        value={editTeamFormData.phone}
                        onChange={(e) => setEditTeamFormData({...editTeamFormData, phone: e.target.value})}
                        placeholder="Enter phone number"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="edit-team-email">Email *</label>
                      <input
                        id="edit-team-email"
                        type="email"
                        value={editTeamFormData.email}
                        onChange={(e) => setEditTeamFormData({...editTeamFormData, email: e.target.value})}
                        placeholder="Enter email address"
                        className="form-input"
                        required
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="form-actions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <motion.button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowEditTeamModal(false)}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      Cancel
                    </motion.button>
                    <motion.button 
                      type="submit"
                      className="btn btn-primary"
                      disabled={teamLoading}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {teamLoading ? '⏳ Updating...' : '✏️ Update Team'}
                    </motion.button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast Notifications Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            <div className="toast-content">
              <div className="toast-icon">
                {toast.type === 'success' && '✅'}
                {toast.type === 'error' && '❌'}
                {toast.type === 'warning' && '⚠️'}
                {toast.type === 'info' && 'ℹ️'}
              </div>
              <div className="toast-message">{toast.message}</div>
              <button 
                className="toast-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
              >
                ✕
              </button>
            </div>
            <div className="toast-progress">
              <div 
                className="toast-progress-bar"
                style={{
                  animation: `shrink ${toast.duration}ms linear forwards`
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Floating Action Menu */}
      {user && (
        <div className="floating-action-menu">
          <div className={`fab-menu ${showFloatingMenu ? 'active' : ''}`}>
            <a href="#" className="fab-menu-item" onClick={(e) => {
              e.preventDefault();
              navigateWithBreadcrumb('teams', 'Teams');
              setShowFloatingMenu(false);
            }}>
              👥 Teams
            </a>
            <a href="#" className="fab-menu-item" onClick={(e) => {
              e.preventDefault();
              navigateWithBreadcrumb('tournament', 'Tournaments');
              setShowFloatingMenu(false);
            }}>
              🏆 Tournaments
            </a>
            <a href="#" className="fab-menu-item" onClick={(e) => {
              e.preventDefault();
              navigateWithBreadcrumb('wallet', 'Wallet');
              setShowFloatingMenu(false);
            }}>
              💰 Wallet
            </a>
            {isAdmin && (
              <a href="#" className="fab-menu-item" onClick={(e) => {
                e.preventDefault();
                navigateWithBreadcrumb('admin', 'Admin Panel');
                setShowFloatingMenu(false);
              }}>
                ⚙️ Admin
              </a>
            )}
          </div>
          <button 
            className="fab-main"
            onClick={toggleFloatingMenu}
            aria-label="Quick Actions"
          >
            {showFloatingMenu ? '✕' : '⚡'}
          </button>
        </div>
      )}

      {/* Insufficient Balance Modal */}
      {insufficientBalanceModal.show && (
        <div className="modal-overlay" onClick={() => setInsufficientBalanceModal({show: false, message: '', tournamentId: null})}>
          <div className="modal insufficient-balance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="insufficient-balance-header">
                <div className="balance-icon">
                  💰
                </div>
                <h3>Insufficient Balance</h3>
              </div>
              
              <div className="insufficient-balance-body">
                <div className="balance-message">
                  <p>You don't have enough funds to join this tournament.</p>
                  <div className="balance-details">
                    {insufficientBalanceModal.message.includes('need') && (
                      <div className="balance-info">
                        <span>Required:</span>
                        <span className="required-amount">
                          {insufficientBalanceModal.message.match(/need €([\d.]+)/)?.[1] || '0.00'}€
                        </span>
                      </div>
                    )}
                    {insufficientBalanceModal.message.includes('have') && (
                      <div className="balance-info">
                        <span>Available:</span>
                        <span className="available-amount">
                          {insufficientBalanceModal.message.match(/have €([\d.]+)/)?.[1] || '0.00'}€
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="suggested-actions">
                  <h4>What you can do:</h4>
                  <ul>
                    <li>💎 Deposit funds to your wallet</li>
                    <li>🎯 Join a free tournament instead</li>
                    <li>🏆 Win prizes in other tournaments</li>
                  </ul>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setInsufficientBalanceModal({show: false, message: '', tournamentId: null})}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setInsufficientBalanceModal({show: false, message: '', tournamentId: null});
                    setCurrentView('wallet');
                  }}
                >
                  💰 Go to Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Share Modal */}
      {showSocialShareModal && shareContent && (
        <div className="modal-overlay">
          <div className="modal-content social-share-modal">
            <div className="modal-header">
              <h3>🚀 Share on Social Media</h3>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowSocialShareModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="share-preview">
                <h4>Preview:</h4>
                <div className="share-content-preview">
                  <h5>{shareContent.title}</h5>
                  <p>{shareContent.description}</p>
                  <div className="share-hashtags">
                    {shareContent.hashtags && shareContent.hashtags.map((tag, index) => (
                      <span key={index} className="hashtag">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="social-platforms">
                <h4>Choose Platform:</h4>
                <div className="platform-grid">
                  <motion.button 
                    className="platform-btn twitter"
                    onClick={() => openSocialPlatform('twitter', shareContent)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="platform-icon">🐦</span>
                    <span>Twitter</span>
                  </motion.button>
                  
                  <motion.button 
                    className="platform-btn facebook"
                    onClick={() => openSocialPlatform('facebook', shareContent)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="platform-icon">📘</span>
                    <span>Facebook</span>
                  </motion.button>
                  
                  <motion.button 
                    className="platform-btn instagram"
                    onClick={() => openSocialPlatform('instagram', shareContent)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="platform-icon">📸</span>
                    <span>Instagram</span>
                  </motion.button>
                  
                  <motion.button 
                    className="platform-btn linkedin"
                    onClick={() => openSocialPlatform('linkedin', shareContent)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="platform-icon">💼</span>
                    <span>LinkedIn</span>
                  </motion.button>
                  
                  <motion.button 
                    className="platform-btn whatsapp"
                    onClick={() => openSocialPlatform('whatsapp', shareContent)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="platform-icon">💬</span>
                    <span>WhatsApp</span>
                  </motion.button>
                  
                  <motion.button 
                    className="platform-btn telegram"
                    onClick={() => openSocialPlatform('telegram', shareContent)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="platform-icon">✈️</span>
                    <span>Telegram</span>
                  </motion.button>
                  
                  <motion.button 
                    className="platform-btn discord"
                    onClick={() => openSocialPlatform('discord', shareContent)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="platform-icon">🎮</span>
                    <span>Discord</span>
                  </motion.button>
                  
                  <motion.button 
                    className="platform-btn native"
                    onClick={() => openNativeShare(shareContent)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="platform-icon">📱</span>
                    <span>More</span>
                  </motion.button>
                </div>
              </div>
              
              <div className="share-url-section">
                <h4>Share URL:</h4>
                <div className="share-url-input">
                  <input 
                    type="text" 
                    value={shareContent.share_url} 
                    readOnly 
                    className="form-input"
                  />
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(shareContent.share_url);
                      alert('URL copied to clipboard!');
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowSocialShareModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Success Modal */}
      {showShareSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content share-success-modal">
            <div className="modal-header">
              <h3>🎉 Shared Successfully!</h3>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowShareSuccessModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="success-message">
                <div className="success-icon">🚀</div>
                <h4>Your content has been shared!</h4>
                <p>Thank you for spreading the word about WoBeRa!</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={() => setShowShareSuccessModal(false)}
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friends Modal */}
      {showFriendsModal && (
        <div className="modal-overlay">
          <div className="modal-content friends-modal">
            <div className="modal-header">
              <h3>👥 Friends</h3>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowFriendsModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="friends-tabs">
                <div className="tab-buttons">
                  <button 
                    className={`tab-btn ${friendsModalTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setFriendsModalTab('friends')}
                  >
                    👥 My Friends ({friendsData.length})
                  </button>
                  <button 
                    className={`tab-btn ${friendsModalTab === 'friend-requests' ? 'active' : ''}`}
                    onClick={() => {
                      setFriendsModalTab('friend-requests');
                      fetchFriendRequests();
                    }}
                  >
                    📬 Requests ({friendRequests.length})
                  </button>
                  <button 
                    className={`tab-btn ${friendsModalTab === 'friend-search' ? 'active' : ''}`}
                    onClick={() => setFriendsModalTab('friend-search')}
                  >
                    🔍 Find Friends
                  </button>
                  <button 
                    className={`tab-btn ${friendsModalTab === 'friend-recommendations' ? 'active' : ''}`}
                    onClick={() => {
                      setFriendsModalTab('friend-recommendations');
                      fetchFriendRecommendations();
                    }}
                  >
                    ⭐ Recommendations
                  </button>
                  <button 
                    className={`tab-btn ${friendsModalTab === 'friend-import' ? 'active' : ''}`}
                    onClick={() => setFriendsModalTab('friend-import')}
                  >
                    📥 Import Friends
                  </button>
                </div>
                
                <div className="tab-content">
                  {friendsModalTab === 'friends' && (
                    <div className="friends-list">
                      {friendsLoading ? (
                        <div className="loading">Loading friends...</div>
                      ) : friendsData.length === 0 ? (
                        <div className="no-friends">
                          <h4>No friends yet</h4>
                          <p>Start by searching for friends or check out recommendations!</p>
                        </div>
                      ) : (
                        friendsData.map((friend) => (
                          <div key={friend.friend_id} className="friend-item">
                            <div className="friend-avatar">
                              {friend.avatar_url ? (
                                <img src={friend.avatar_url} alt={friend.friend_username} />
                              ) : (
                                <div className="default-avatar">
                                  {friend.friend_username?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="friend-info">
                              <h4>{friend.friend_username}</h4>
                              <p>{friend.friend_full_name}</p>
                              <span className="friend-country">{friend.country}</span>
                            </div>
                            <div className="friend-actions">
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => removeFriend(friend.friend_id)}
                                disabled={friendActionLoading}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  
                  {friendsModalTab === 'friend-requests' && (
                    <div className="friend-requests">
                      {friendRequests.length === 0 ? (
                        <div className="no-requests">
                          <h4>No pending requests</h4>
                          <p>You have no pending friend requests.</p>
                        </div>
                      ) : (
                        friendRequests.map((request) => (
                          <div key={request.id} className="friend-request-item">
                            <div className="friend-avatar">
                              {request.sender_avatar_url ? (
                                <img src={request.sender_avatar_url} alt={request.sender_username} />
                              ) : (
                                <div className="default-avatar">
                                  {request.sender_username?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="friend-info">
                              <h4>{request.sender_username}</h4>
                              <p>{request.sender_full_name}</p>
                            </div>
                            <div className="friend-actions">
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => respondFriendRequest(request.id, 'accept')}
                                disabled={friendActionLoading}
                              >
                                Accept
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => respondFriendRequest(request.id, 'reject')}
                                disabled={friendActionLoading}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  
                  {friendsModalTab === 'friend-search' && (
                    <div className="friend-search">
                      <div className="search-box">
                        <input 
                          type="text" 
                          placeholder="Search for friends..." 
                          value={friendSearchQuery}
                          onChange={(e) => setFriendSearchQuery(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="search-results">
                        {friendSearchResults.map((user) => (
                          <div key={user.user_id} className="search-result-item">
                            <div className="friend-avatar">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.username} />
                              ) : (
                                <div className="default-avatar">
                                  {user.username?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="friend-info">
                              <h4>{user.username}</h4>
                              <p>{user.full_name}</p>
                              <span className="friend-country">{user.country}</span>
                            </div>
                            <div className="friend-actions">
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => sendFriendRequest(user.user_id)}
                                disabled={friendActionLoading}
                              >
                                Add Friend
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {friendsModalTab === 'friend-recommendations' && (
                    <div className="friend-recommendations">
                      {friendRecommendations.length === 0 ? (
                        <div className="no-recommendations">
                          <h4>No recommendations</h4>
                          <p>We'll show friend recommendations based on your activity.</p>
                        </div>
                      ) : (
                        friendRecommendations.map((rec) => (
                          <div key={rec.user_id} className="recommendation-item">
                            <div className="friend-avatar">
                              {rec.avatar_url ? (
                                <img src={rec.avatar_url} alt={rec.username} />
                              ) : (
                                <div className="default-avatar">
                                  {rec.username?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="friend-info">
                              <h4>{rec.username}</h4>
                              <p>{rec.full_name}</p>
                              <span className="recommendation-reason">{rec.reason}</span>
                            </div>
                            <div className="friend-actions">
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => sendFriendRequest(rec.user_id)}
                                disabled={friendActionLoading}
                              >
                                Add Friend
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  
                  {friendsModalTab === 'friend-import' && (
                    <div className="friend-import">
                      <div className="import-method">
                        <h4>Import Friends</h4>
                        <div className="import-options">
                          <label>
                            <input 
                              type="radio" 
                              name="importProvider"
                              value="email"
                              checked={friendImportProvider === 'email'}
                              onChange={(e) => setFriendImportProvider(e.target.value)}
                            />
                            📧 Email Addresses
                          </label>
                          <label>
                            <input 
                              type="radio" 
                              name="importProvider"
                              value="google"
                              checked={friendImportProvider === 'google'}
                              onChange={(e) => setFriendImportProvider(e.target.value)}
                            />
                            🔗 Google Contacts (Coming Soon)
                          </label>
                          <label>
                            <input 
                              type="radio" 
                              name="importProvider"
                              value="discord"
                              checked={friendImportProvider === 'discord'}
                              onChange={(e) => setFriendImportProvider(e.target.value)}
                            />
                            🎮 Discord Friends (Coming Soon)
                          </label>
                        </div>
                        
                        {friendImportProvider === 'email' && (
                          <div className="email-import">
                            <p>Enter email addresses (one per line):</p>
                            <textarea 
                              value={friendImportEmails}
                              onChange={(e) => setFriendImportEmails(e.target.value)}
                              placeholder="friend1@example.com&#10;friend2@example.com"
                              className="form-textarea"
                              rows="5"
                            />
                            <button 
                              className="btn btn-primary"
                              onClick={importFriends}
                              disabled={friendActionLoading || !friendImportEmails.trim()}
                            >
                              {friendActionLoading ? 'Importing...' : 'Import Friends'}
                            </button>
                          </div>
                        )}
                        
                        {friendImportProvider !== 'email' && (
                          <div className="coming-soon">
                            <p>This import method is coming soon!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>💳 {selectedTournamentForPayment ? 'Tournament Payment' : 'Deposit Funds'}</h3>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  console.log('🚫 Payment modal closed by user');
                  setShowPaymentModal(false);
                  setSelectedTournamentForPayment(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {selectedTournamentForPayment ? (
                <>
                  <div className="payment-summary">
                    <h4>Tournament: {selectedTournamentForPayment.name}</h4>
                    <p>Entry Fee: €{selectedTournamentForPayment.entry_fee}</p>
                  </div>
                  
                  <div className="payment-details">
                    <div className="detail-row">
                      <span>Entry Fee:</span>
                      <span className="amount">€{selectedTournamentForPayment.entry_fee}</span>
                    </div>
                    <div className="detail-row">
                      <span>Prize Pool:</span>
                      <span className="amount">€{selectedTournamentForPayment.prize_pool}</span>
                    </div>
                    <div className="detail-row">
                      <span>Participants:</span>
                      <span>{selectedTournamentForPayment.current_participants}/{selectedTournamentForPayment.max_participants}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="payment-summary">
                  <h4>💰 Add Funds to Your Account</h4>
                  <p>Choose amount and payment method:</p>
                  
                  <div className="deposit-amounts">
                    <button className="amount-btn">€10</button>
                    <button className="amount-btn">€25</button>
                    <button className="amount-btn">€50</button>
                    <button className="amount-btn">€100</button>
                    <button className="amount-btn">€250</button>
                    <button className="amount-btn">€500</button>
                  </div>
                  
                  <div className="custom-amount">
                    <input 
                      type="number" 
                      placeholder="Custom amount..." 
                      min="5"
                      max="5000"
                      className="amount-input"
                    />
                  </div>
                </div>
              )}
              
              <div className="payment-methods">
                <h4>Choose Payment Method:</h4>
                <div className="payment-options">
                  {(paymentConfig?.stripe_enabled !== false) && (
                    <button 
                      className={`payment-option ${selectedPaymentProvider === 'stripe' ? 'selected' : ''}`}
                      onClick={() => setSelectedPaymentProvider('stripe')}
                    >
                      <div className="payment-icon">💳</div>
                      <div className="payment-info">
                        <span className="payment-name">Credit/Debit Card</span>
                        <span className="payment-desc">Powered by Stripe</span>
                      </div>
                    </button>
                  )}
                  
                  {(paymentConfig?.paypal_enabled !== false) && (
                    <button 
                      className={`payment-option ${selectedPaymentProvider === 'paypal' ? 'selected' : ''}`}
                      onClick={() => setSelectedPaymentProvider('paypal')}
                    >
                      <div className="payment-icon">🅿️</div>
                      <div className="payment-info">
                        <span className="payment-name">PayPal</span>
                        <span className="payment-desc">Pay with PayPal account</span>
                      </div>
                    </button>
                  )}
                  
                  {(paymentConfig?.coinbase_enabled !== false) && (
                    <button 
                      className={`payment-option ${selectedPaymentProvider === 'coinbase' ? 'selected' : ''}`}
                      onClick={() => setSelectedPaymentProvider('coinbase')}
                    >
                      <div className="payment-icon">₿</div>
                      <div className="payment-info">
                        <span className="payment-name">Cryptocurrency</span>
                        <span className="payment-desc">Bitcoin, Ethereum, etc.</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  console.log('🚫 Payment modal cancelled by user');
                  setShowPaymentModal(false);
                  setSelectedTournamentForPayment(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  console.log('💳 Payment initiated with provider:', selectedPaymentProvider);
                  if (typeof createPaymentSession === 'function') {
                    createPaymentSession(selectedPaymentProvider);
                  } else {
                    console.log('Payment would be processed here');
                    alert('Payment system integration needed');
                  }
                }}
                disabled={paymentLoading}
              >
                {paymentLoading ? 'Processing...' : (selectedTournamentForPayment ? `Pay €${selectedTournamentForPayment.entry_fee}` : 'Deposit Funds')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Payout Request Modal */}
      {showPayoutRequestModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>💰 Request Payout</h3>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowPayoutRequestModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Amount ($):</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={payoutRequestForm.amount}
                  onChange={(e) => setPayoutRequestForm({...payoutRequestForm, amount: e.target.value})}
                  placeholder="Minimum $10.00"
                  min="10"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label>Payment Method:</label>
                <select 
                  className="form-input"
                  value={payoutRequestForm.provider}
                  onChange={(e) => setPayoutRequestForm({...payoutRequestForm, provider: e.target.value})}
                >
                  <option value="stripe">Stripe (Bank Transfer)</option>
                  <option value="paypal">PayPal</option>
                  <option value="coinbase">Cryptocurrency</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>
                  {payoutRequestForm.provider === 'stripe' && 'Bank Account Details:'}
                  {payoutRequestForm.provider === 'paypal' && 'PayPal Email:'}
                  {payoutRequestForm.provider === 'coinbase' && 'Crypto Wallet Address:'}
                </label>
                <input 
                  type="text" 
                  className="form-input"
                  value={payoutRequestForm.payout_account}
                  onChange={(e) => setPayoutRequestForm({...payoutRequestForm, payout_account: e.target.value})}
                  placeholder={
                    payoutRequestForm.provider === 'stripe' ? 'Account holder name and details' :
                    payoutRequestForm.provider === 'paypal' ? 'your@email.com' :
                    '1A2B3C4D5E6F7G8H9I0J...'
                  }
                />
              </div>
              
              <div className="form-group">
                <label>Notes (optional):</label>
                <textarea 
                  className="form-input"
                  value={payoutRequestForm.notes}
                  onChange={(e) => setPayoutRequestForm({...payoutRequestForm, notes: e.target.value})}
                  placeholder="Any additional notes for the payout request"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowPayoutRequestModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handlePayoutRequest}
                disabled={paymentLoading}
              >
                {paymentLoading ? 'Processing...' : 'Submit Payout Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CMS Content Modal */}
      {showCmsContentModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>{editingContent ? 'Edit Content' : 'Create New Content'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCmsContentModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={editingContent ? (e) => {
                e.preventDefault();
                handleUpdateContent(editingContent.id, cmsContentForm);
              } : handleCreateContent}>
                <div className="form-group">
                  <label>Content Key:</label>
                  <input 
                    type="text" 
                    value={cmsContentForm.key}
                    onChange={(e) => setCmsContentForm({...cmsContentForm, key: e.target.value})}
                    className="form-input"
                    placeholder="e.g., hero_title, nav_home"
                    required
                    disabled={editingContent} // Don't allow editing key for existing content
                  />
                  <small className="form-hint">
                    Unique identifier for this content item
                  </small>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Content Type:</label>
                    <select 
                      value={cmsContentForm.content_type}
                      onChange={(e) => setCmsContentForm({...cmsContentForm, content_type: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="text">Text</option>
                      <option value="color">Color</option>
                      <option value="image">Image</option>
                      <option value="theme">Theme</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Context:</label>
                    <select 
                      value={cmsContentForm.context}
                      onChange={(e) => setCmsContentForm({...cmsContentForm, context: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="general">General</option>
                      <option value="navbar">Navigation Bar</option>
                      <option value="hero">Hero Section</option>
                      <option value="features">Features</option>
                      <option value="dashboard">Dashboard</option>
                      <option value="tournament">Tournament</option>
                      <option value="affiliate">Affiliate</option>
                      <option value="wallet">Wallet</option>
                      <option value="team">Team</option>
                      <option value="guild">Guild</option>
                      <option value="footer">Footer</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Content Value:</label>
                  {cmsContentForm.content_type === 'color' ? (
                    <div className="color-input-group">
                      <input 
                        type="color" 
                        value={cmsContentForm.current_value || '#4fc3f7'}
                        onChange={(e) => setCmsContentForm({...cmsContentForm, current_value: e.target.value})}
                        className="color-picker"
                      />
                      <input 
                        type="text" 
                        value={cmsContentForm.current_value}
                        onChange={(e) => setCmsContentForm({...cmsContentForm, current_value: e.target.value})}
                        className="form-input color-text-input"
                        placeholder="#4fc3f7"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        required
                      />
                    </div>
                  ) : (
                    <textarea 
                      value={cmsContentForm.current_value}
                      onChange={(e) => setCmsContentForm({...cmsContentForm, current_value: e.target.value})}
                      className="form-textarea"
                      rows={cmsContentForm.content_type === 'text' ? 3 : 1}
                      placeholder="Enter content value..."
                      required
                    />
                  )}
                </div>
                
                <div className="form-group">
                  <label>Description (Optional):</label>
                  <textarea 
                    value={cmsContentForm.description}
                    onChange={(e) => setCmsContentForm({...cmsContentForm, description: e.target.value})}
                    className="form-textarea"
                    rows={2}
                    placeholder="Description for admin users..."
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary" disabled={cmsLoading}>
                    {cmsLoading ? '⏳ Saving...' : (editingContent ? '💾 Update Content' : '✨ Create Content')}
                  </button>
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCmsContentModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CMS Theme Modal */}
      {showCmsThemeModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Create New Theme</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCmsThemeModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleCreateTheme}>
                <div className="form-group">
                  <label>Theme Name:</label>
                  <input 
                    type="text" 
                    value={cmsThemeForm.name}
                    onChange={(e) => setCmsThemeForm({...cmsThemeForm, name: e.target.value})}
                    className="form-input"
                    placeholder="e.g., WoBeRa Dark, Ocean Blue"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Theme Colors:</label>
                  <div className="color-grid">
                    {Object.entries(cmsThemeForm.colors).map(([colorKey, colorValue]) => (
                      <div key={colorKey} className="color-input-item">
                        <label className="color-label">{colorKey}:</label>
                        <div className="color-input-group">
                          <input 
                            type="color" 
                            value={colorValue}
                            onChange={(e) => setCmsThemeForm({
                              ...cmsThemeForm,
                              colors: {...cmsThemeForm.colors, [colorKey]: e.target.value}
                            })}
                            className="color-picker-small"
                          />
                          <input 
                            type="text" 
                            value={colorValue}
                            onChange={(e) => setCmsThemeForm({
                              ...cmsThemeForm,
                              colors: {...cmsThemeForm.colors, [colorKey]: e.target.value}
                            })}
                            className="form-input color-text-input-small"
                            pattern="^#[0-9A-Fa-f]{6}$"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary" disabled={cmsLoading}>
                    {cmsLoading ? '⏳ Creating...' : '🎨 Create Theme'}
                  </button>
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCmsThemeModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Live Chat System */}
      {renderChatPopup()}
      {renderPrivateMessageModal()}
      {renderAdminChatModal()}
    </div>
  );
}

export default App;