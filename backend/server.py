from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from pymongo import MongoClient
from bson import ObjectId
from typing import Optional, List, Dict, Set, Any
import os
import hashlib
import jwt
from datetime import datetime, timedelta
import uuid
from enum import Enum
import json
import asyncio

# Payment Gateway Imports
import stripe
import paypalrestsdk
from coinbase_commerce.client import Client as CoinbaseClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Custom JSON encoder to handle ObjectId
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

# Custom JSONResponse class
class CustomJSONResponse(JSONResponse):
    def render(self, content: any) -> bytes:
        return json.dumps(
            content, ensure_ascii=False, allow_nan=False, indent=None, separators=(",", ":"), cls=CustomJSONEncoder
        ).encode("utf-8")

# Admin Role Levels
class AdminRole(str, Enum):
    GOD = "god"
    SUPER_ADMIN = "super_admin"  
    ADMIN = "admin"
    USER = "user"

# Environment variables
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'betting_federation')
SECRET_KEY = "your-secret-key-here"

# Payment Gateway Configuration
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')

PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', '')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', '')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')

COINBASE_API_KEY = os.environ.get('COINBASE_API_KEY', '')
COINBASE_WEBHOOK_SECRET = os.environ.get('COINBASE_WEBHOOK_SECRET', '')

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Initialize Payment Gateways
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

if PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET:
    paypalrestsdk.configure({
        "mode": PAYPAL_MODE,
        "client_id": PAYPAL_CLIENT_ID,
        "client_secret": PAYPAL_CLIENT_SECRET
    })

if COINBASE_API_KEY:
    coinbase_client = CoinbaseClient(api_key=COINBASE_API_KEY)
else:
    coinbase_client = None

# MongoDB connection
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# MongoDB Collections
users_collection = db.users
competitions_collection = db.competitions
site_messages_collection = db.site_messages
tournaments_collection = db.tournaments
tournament_participants_collection = db.tournament_participants
tournament_brackets_collection = db.tournament_brackets
tournament_matches_collection = db.tournament_matches
admin_actions_collection = db.admin_actions
affiliates_collection = db.affiliates
affiliate_applications_collection = db.affiliate_applications
referrals_collection = db.referrals
commissions_collection = db.commissions
payouts_collection = db.payouts
wallet_balances_collection = db.wallet_balances
transactions_collection = db.transactions
rankings_collection = db.rankings
content_pages_collection = db.content_pages
menu_items_collection = db.menu_items

# Team System Collections
teams_collection = db.teams
team_members_collection = db.team_members
team_invitations_collection = db.team_invitations

# Guild System Collections
guilds_collection = db.guilds
guild_members_collection = db.guild_members
guild_invitations_collection = db.guild_invitations
guild_applications_collection = db.guild_applications
guild_wars_collection = db.guild_wars
guild_stats_collection = db.guild_stats
guild_tournaments_collection = db.guild_tournaments
guild_benefits_collection = db.guild_benefits
guild_war_objectives_collection = db.guild_war_objectives

# National League System Collections
national_leagues_collection = db.national_leagues
team_standings_collection = db.team_standings
league_assignments_collection = db.league_assignments
match_fixtures_collection = db.match_fixtures
team_applications_collection = db.team_applications

# Payment System Collections
payments_collection = db.payments
payment_sessions_collection = db.payment_sessions
payment_webhooks_collection = db.payment_webhooks
tournament_entries_collection = db.tournament_entries

# Social Sharing System Collections
social_shares_collection = db.social_shares
share_templates_collection = db.share_templates
share_stats_collection = db.share_stats
viral_metrics_collection = db.viral_metrics
share_clicks_collection = db.share_clicks

# Content Management System Collections
cms_content_collection = db.cms_content
cms_translations_collection = db.cms_translations
cms_themes_collection = db.cms_themes

# SportsDuel System Collections
sportsduel_leagues_collection = db.sportsduel_leagues
sportsduel_teams_collection = db.sportsduel_teams  # Sports Cafes
sportsduel_players_collection = db.sportsduel_players  # Cafe customers
sportsduel_matches_collection = db.sportsduel_matches
sportsduel_coupons_collection = db.sportsduel_coupons
sportsduel_bets_collection = db.sportsduel_bets
sportsduel_time_slots_collection = db.sportsduel_time_slots
sportsduel_sports_events_collection = db.sportsduel_sports_events
sportsduel_match_results_collection = db.sportsduel_match_results

app = FastAPI(title="WoBeRa - World Betting Rank API", default_response_class=CustomJSONResponse)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    country: str
    full_name: str
    avatar_url: Optional[str] = None
    admin_role: Optional[AdminRole] = AdminRole.USER
    referral_code: Optional[str] = None  # For affiliate referrals

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: str
    username: str
    email: str
    country: str
    full_name: str
    avatar_url: Optional[str] = None
    admin_role: AdminRole = AdminRole.USER
    is_blocked: bool = False
    blocked_until: Optional[datetime] = None
    blocked_reason: Optional[str] = None
    created_at: datetime
    total_bets: int = 0
    won_bets: int = 0
    lost_bets: int = 0
    total_amount: float = 0.0
    total_winnings: float = 0.0
    avg_odds: float = 0.0
    rank: int = 0
    score: float = 0.0

class RankingEntry(BaseModel):
    user_id: str
    username: str
    country: str
    full_name: str
    avatar_url: Optional[str] = None
    total_bets: int
    won_bets: int
    lost_bets: int
    total_amount: float
    total_winnings: float
    avg_odds: float
    score: float
    rank: int

class AdminAction(BaseModel):
    action_type: str  # 'block_user', 'unblock_user', 'adjust_points', 'create_competition', etc.
    target_user_id: Optional[str] = None
    target_competition_id: Optional[str] = None
    details: Optional[dict] = None
    reason: Optional[str] = None

class BlockUserRequest(BaseModel):
    user_id: str
    block_type: str  # 'temporary' or 'permanent'
    duration_hours: Optional[int] = None
    reason: str

class AdjustPointsRequest(BaseModel):
    user_id: str
    points_change: int  # positive or negative
    reason: str

class Competition(BaseModel):
    id: str
    name: str
    description: str
    region: str
    start_date: datetime
    end_date: datetime
    max_participants: int
    current_participants: int
    status: str  # active, upcoming, finished
    prize_pool: float
    created_by: Optional[str] = None

class SiteMessage(BaseModel):
    message: str
    message_type: str  # 'announcement', 'warning', 'info'
    expires_at: Optional[datetime] = None

class ContentPage(BaseModel):
    id: str
    title: str
    content: str
    page_type: str  # 'hero', 'page', 'legal'
    is_active: bool = True
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class MenuItem(BaseModel):
    id: str
    label: str
    url: str
    order: int
    is_active: bool = True
    parent_id: Optional[str] = None  # For submenus
    icon: Optional[str] = None

# Tournament System Models
class TournamentDuration(str, Enum):
    INSTANT = "instant"
    DAILY = "daily"
    TWO_DAY = "two_day"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    LONG_TERM = "long_term"

class TournamentStatus(str, Enum):
    UPCOMING = "upcoming"
    OPEN = "open"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TournamentFormat(str, Enum):
    SINGLE_ELIMINATION = "single_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss"

class PrizeDistribution(str, Enum):
    WINNER_TAKES_ALL = "winner_takes_all"
    TOP_THREE = "top_three"

class EntryFeeCategory(str, Enum):
    FREE = "free"          # €0
    BASIC = "basic"        # €1-10
    STANDARD = "standard"  # €11-50
    PREMIUM = "premium"    # €51-100
    VIP = "vip"           # €101-10000

class Tournament(BaseModel):
    id: str
    name: str
    description: str
    duration_type: TournamentDuration
    tournament_format: TournamentFormat = TournamentFormat.SINGLE_ELIMINATION
    status: TournamentStatus = TournamentStatus.UPCOMING
    
    # Entry & Participants
    entry_fee: float
    entry_fee_category: EntryFeeCategory
    max_participants: int
    current_participants: int = 0
    
    # Prize Distribution
    prize_distribution: PrizeDistribution
    total_prize_pool: float = 0.0
    
    # Dates
    created_at: datetime
    registration_start: datetime
    registration_end: datetime
    tournament_start: datetime
    tournament_end: datetime
    
    # Tournament Details
    rules: str
    region: Optional[str] = None
    created_by: str  # Admin who created it
    
    # Tournament State
    is_active: bool = True
    winner_id: Optional[str] = None
    results: Optional[dict] = None

class TournamentParticipant(BaseModel):
    id: str
    tournament_id: str
    user_id: str
    username: str
    full_name: str
    country: str
    avatar_url: Optional[str] = None
    
    # Registration
    registered_at: datetime
    payment_status: str = "pending"  # pending, paid, refunded
    
    # Tournament Progress
    current_round: int = 1
    is_eliminated: bool = False
    eliminated_at: Optional[datetime] = None
    final_position: Optional[int] = None
    prize_won: Optional[float] = None

class TournamentCreate(BaseModel):
    name: str
    description: str
    duration_type: TournamentDuration
    tournament_format: TournamentFormat = TournamentFormat.SINGLE_ELIMINATION
    entry_fee: float
    max_participants: int
    prize_distribution: PrizeDistribution
    registration_start: datetime
    registration_end: datetime
    tournament_start: datetime
    tournament_end: datetime
    rules: str
    region: Optional[str] = None

class TournamentJoin(BaseModel):
    tournament_id: str

# =============================================================================
# BRACKET SYSTEM MODELS
# =============================================================================

class MatchStatus(str, Enum):
    PENDING = "pending"
    ONGOING = "ongoing"
    COMPLETED = "completed"

class Match(BaseModel):
    id: str
    tournament_id: str
    round_number: int
    match_number: int  # Position in round (1, 2, 3, etc.)
    
    # Players
    player1_id: Optional[str] = None
    player1_username: Optional[str] = None
    player2_id: Optional[str] = None  
    player2_username: Optional[str] = None
    
    # Match Results
    winner_id: Optional[str] = None
    winner_username: Optional[str] = None
    status: MatchStatus = MatchStatus.PENDING
    
    # Timestamps
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Next match progression
    next_match_id: Optional[str] = None

class TournamentRound(BaseModel):
    round_number: int
    round_name: str  # "Round 1", "Quarter-Finals", "Semi-Finals", "Finals"
    total_matches: int
    completed_matches: int = 0
    status: str = "pending"  # pending, ongoing, completed

class TournamentBracket(BaseModel):
    id: str
    tournament_id: str
    total_rounds: int
    current_round: int = 1
    rounds: List[TournamentRound] = []
    matches: List[Match] = []
    
    # Bracket metadata
    created_at: datetime
    updated_at: datetime
    is_generated: bool = False

# =============================================================================
# TEAM SYSTEM MODELS
# =============================================================================

class TeamColors(BaseModel):
    primary: str
    secondary: str = None

class TeamStatus(str, Enum):
    AMATEUR = "amateur"
    OFFICIAL = "official"

class TeamCreate(BaseModel):
    name: str
    logo_url: str = None
    colors: TeamColors
    city: str
    country: str
    phone: str
    email: str

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    colors: Optional[TeamColors] = None
    city: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class TeamInvite(BaseModel):
    username: str

class TeamApplicationRequest(BaseModel):
    application_text: str

class TeamTransferCaptaincy(BaseModel):
    new_captain_id: str

class LeagueType(str, Enum):
    PREMIER = "premier"
    LEAGUE_2 = "league_2"

class TeamLeagueAssignment(BaseModel):
    team_id: str
    country: str
    league_type: LeagueType
    assigned_by: str  # admin user id
    assigned_at: datetime

class NationalLeague(BaseModel):
    id: str
    country: str
    league_type: LeagueType
    name: str  # e.g., "Greek Premier", "Greek League 2"
    season: str
    teams: List[str] = []  # team IDs
    standings: List[dict] = []
    created_at: datetime
    updated_at: datetime

class TeamStanding(BaseModel):
    team_id: str
    team_name: str
    matches_played: int = 0
    wins: int = 0
    draws: int = 0
    losses: int = 0
    goals_for: int = 0
    goals_against: int = 0
    goal_difference: int = 0
    points: int = 0
    position: int = 0

class MatchFixture(BaseModel):
    id: str
    league_id: str
    matchday: int  # 1-38 for full season
    home_team_id: str
    away_team_id: str
    home_team_name: str
    away_team_name: str
    match_date: Optional[datetime] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    status: str = "scheduled"  # scheduled, played, postponed
    created_at: datetime
    updated_at: datetime

class MatchdaySchedule(BaseModel):
    matchday: int
    league_id: str
    league_name: str
    matches: List[MatchFixture]
    total_matches: int
    played_matches: int
    scheduled_date: Optional[datetime] = None

class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# =============================================================================
# AFFILIATE SYSTEM MODELS
# =============================================================================

class AffiliateStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class CommissionType(str, Enum):
    REGISTRATION = "registration"  # Commission for new user registration
    TOURNAMENT_ENTRY = "tournament_entry"  # Commission for tournament entry fees
    DEPOSIT = "deposit"  # Commission for user deposits (future payment integration)

class PayoutStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class TransactionType(str, Enum):
    COMMISSION_EARNED = "commission_earned"
    PAYOUT_REQUESTED = "payout_requested"
    PAYOUT_COMPLETED = "payout_completed"
    PAYOUT_FAILED = "payout_failed"
    MANUAL_ADJUSTMENT = "manual_adjustment"
    BONUS = "bonus"
    PENALTY = "penalty"
    TOURNAMENT_ENTRY = "tournament_entry"
    TOURNAMENT_REFUND = "tournament_refund"
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"

# Payment System Enums and Models
class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentProvider(str, Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    COINBASE = "coinbase"

class PaymentRequest(BaseModel):
    user_id: str
    tournament_id: str
    amount: float
    currency: str = "USD"
    provider: PaymentProvider
    return_url: Optional[str] = None
    cancel_url: Optional[str] = None

class PaymentSession(BaseModel):
    id: str
    user_id: str
    tournament_id: str
    amount: float
    currency: str
    provider: PaymentProvider
    provider_session_id: str
    status: PaymentStatus
    checkout_url: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    metadata: Optional[Dict] = None

class PaymentRecord(BaseModel):
    id: str
    user_id: str
    tournament_id: str
    session_id: str
    amount: float
    currency: str
    provider: PaymentProvider
    provider_transaction_id: str
    status: PaymentStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None
    metadata: Optional[Dict] = None

class TournamentEntry(BaseModel):
    id: str
    user_id: str
    tournament_id: str
    payment_id: Optional[str] = None
    entry_fee: float
    currency: str = "USD"
    payment_status: PaymentStatus
    created_at: datetime
    paid_at: Optional[datetime] = None

class PayoutRequest(BaseModel):
    user_id: str
    amount: float
    currency: str = "USD"
    provider: PaymentProvider
    payout_account: str  # Stripe account ID, PayPal email, or crypto wallet address
    metadata: Optional[Dict] = None

# =============================================================================
# GUILD SYSTEM MODELS
# =============================================================================

class GuildRole(str, Enum):
    LEADER = "leader"
    OFFICER = "officer" 
    MEMBER = "member"

class GuildStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISBANDED = "disbanded"

class GuildWarStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class GuildCreate(BaseModel):
    name: str
    description: str = ""
    logo_url: str = None
    tag: str  # 3-5 character guild tag
    colors: TeamColors
    recruitment_open: bool = True
    min_level: int = 1
    country: Optional[str] = None

class GuildUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    tag: Optional[str] = None
    colors: Optional[TeamColors] = None
    recruitment_open: Optional[bool] = None
    min_level: Optional[int] = None
    country: Optional[str] = None

class GuildMember(BaseModel):
    user_id: str
    username: str
    role: GuildRole = GuildRole.MEMBER
    joined_at: datetime
    contributions: int = 0
    last_active: datetime

class GuildInvite(BaseModel):
    username: str
    message: str = ""

class GuildApplication(BaseModel):
    user_id: str
    username: str
    message: str
    applied_at: datetime
    status: str = "pending"  # pending, accepted, rejected

class GuildWar(BaseModel):
    id: str
    guild_1_id: str
    guild_1_name: str
    guild_2_id: str
    guild_2_name: str
    status: GuildWarStatus = GuildWarStatus.PENDING
    war_type: str = "classic"  # classic, blitz, tournament
    start_time: datetime
    end_time: datetime
    objectives: List[dict] = []
    guild_1_score: int = 0
    guild_2_score: int = 0
    winner_guild_id: Optional[str] = None
    created_at: datetime
    created_by: str

class GuildWarObjective(BaseModel):
    id: str
    name: str
    description: str
    points: int
    completed_by: Optional[str] = None  # guild_id
    completed_at: Optional[datetime] = None

class GuildStats(BaseModel):
    guild_id: str
    level: int = 1
    experience: int = 0
    power_rating: int = 1000
    total_wars: int = 0
    wars_won: int = 0
    wars_lost: int = 0
    tournament_victories: int = 0
    total_trophies: int = 0
    season_trophies: int = 0
    contributions_this_season: int = 0
    updated_at: datetime

class GuildTournament(BaseModel):
    id: str
    name: str
    description: str
    guild_id: str
    entry_fee: float = 0.0
    max_participants: int = 16
    participants: List[str] = []  # user_ids
    status: str = "upcoming"
    start_time: datetime
    end_time: Optional[datetime] = None
    prizes: List[dict] = []
    created_at: datetime

class GuildBenefit(BaseModel):
    benefit_type: str  # xp_boost, tournament_discount, special_access
    description: str
    value: float  # percentage or fixed amount
    duration_hours: int = 24
    active: bool = True

# =============================================================================
# SOCIAL SHARING SYSTEM MODELS
# =============================================================================

class ShareType(str, Enum):
    TOURNAMENT_VICTORY = "tournament_victory"
    TOURNAMENT_PARTICIPATION = "tournament_participation"
    TEAM_FORMATION = "team_formation"
    TEAM_ACHIEVEMENT = "team_achievement"
    PERSONAL_ACHIEVEMENT = "personal_achievement"
    TOURNAMENT_INVITATION = "tournament_invitation"
    TEAM_INVITATION = "team_invitation"
    MILESTONE = "milestone"
    RANKING_ACHIEVEMENT = "ranking_achievement"

class SocialPlatform(str, Enum):
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    DISCORD = "discord"
    WHATSAPP = "whatsapp"
    TELEGRAM = "telegram"
    NATIVE = "native"  # Native share API

class ShareContent(BaseModel):
    id: str
    user_id: str
    share_type: ShareType
    platform: SocialPlatform
    title: str
    description: str
    image_url: Optional[str] = None
    share_url: str
    metadata: Optional[Dict] = None  # Additional data specific to share type
    created_at: datetime
    shared_at: Optional[datetime] = None
    clicks: int = 0
    engagement_score: float = 0.0
    is_viral: bool = False

class ShareTemplate(BaseModel):
    id: str
    share_type: ShareType
    platform: SocialPlatform
    title_template: str
    description_template: str
    hashtags: List[str] = []
    call_to_action: str
    image_template: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class ShareRequest(BaseModel):
    share_type: ShareType
    platform: SocialPlatform
    reference_id: str  # Tournament ID, Team ID, etc.
    custom_message: Optional[str] = None
    include_image: bool = True

class ShareStats(BaseModel):
    total_shares: int
    shares_by_platform: Dict[str, int]
    shares_by_type: Dict[str, int]
    total_clicks: int
    viral_shares: int
    engagement_rate: float
    top_performing_content: List[str]

class ViralMetrics(BaseModel):
    share_id: str
    original_user_id: str
    referred_users: int = 0
    tournament_joins: int = 0
    team_joins: int = 0
    conversion_rate: float = 0.0
    revenue_generated: float = 0.0
    viral_coefficient: float = 0.0

class WalletBalance(BaseModel):
    id: str
    user_id: str
    
    # Balance breakdown
    total_earned: float = 0.0          # Total ever earned
    available_balance: float = 0.0     # Available for withdrawal
    pending_balance: float = 0.0       # Pending approval
    withdrawn_balance: float = 0.0     # Already withdrawn
    
    # Commission breakdown
    registration_commissions: float = 0.0
    tournament_commissions: float = 0.0
    deposit_commissions: float = 0.0
    bonus_earnings: float = 0.0
    
    # Payout info
    lifetime_withdrawals: float = 0.0
    pending_withdrawal: float = 0.0
    last_payout_date: Optional[datetime] = None
    
    # Settings
    auto_payout_enabled: bool = False
    auto_payout_threshold: float = 100.0  # Auto payout when balance reaches this
    preferred_payout_method: str = "bank_transfer"
    
    # Timestamps
    created_at: datetime
    updated_at: datetime

class Transaction(BaseModel):
    id: str
    user_id: str
    
    # Transaction details
    transaction_type: TransactionType
    amount: float
    currency: str = "EUR"
    
    # Related records
    commission_id: Optional[str] = None
    payout_id: Optional[str] = None
    referral_id: Optional[str] = None
    tournament_id: Optional[str] = None
    
    # Balance impact
    balance_before: float
    balance_after: float
    
    # Description and metadata
    description: str
    metadata: dict = {}
    
    # Admin info
    processed_by: Optional[str] = None  # Admin who processed (for manual adjustments)
    admin_notes: Optional[str] = None
    
    # Status
    is_processed: bool = True
    processed_at: datetime
    
    # Timestamps
    created_at: datetime

class Affiliate(BaseModel):
    id: str
    user_id: str  # The user who becomes an affiliate
    referral_code: str  # Unique referral code
    referral_link: str  # Full referral link
    
    # Status
    status: AffiliateStatus = AffiliateStatus.PENDING
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None  # Admin who approved
    
    # Statistics
    total_referrals: int = 0
    active_referrals: int = 0  # Users who are still active
    total_earnings: float = 0.0
    pending_earnings: float = 0.0
    paid_earnings: float = 0.0
    
    # Settings
    commission_rate_registration: float = 5.0  # €5 per registration
    commission_rate_tournament: float = 0.1   # 10% of tournament entry fees
    commission_rate_deposit: float = 0.05     # 5% of deposits (future)
    
    # Timestamps
    created_at: datetime
    updated_at: datetime

class Referral(BaseModel):
    id: str
    affiliate_user_id: str  # Who referred
    referred_user_id: str   # Who was referred
    referral_code: str      # Code used for referral
    
    # Registration details
    registered_at: datetime
    registration_ip: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Activity tracking
    is_active: bool = True  # Is the referred user still active
    last_activity: Optional[datetime] = None
    
    # Commissions earned from this referral
    total_commissions_earned: float = 0.0
    
    # Tournament participation
    tournaments_joined: int = 0
    total_tournament_fees: float = 0.0

class Commission(BaseModel):
    id: str
    affiliate_user_id: str
    referred_user_id: str
    referral_id: str
    
    # Commission details
    commission_type: CommissionType
    amount: float
    rate_applied: float  # Rate that was applied (for record keeping)
    
    # Related transaction
    tournament_id: Optional[str] = None  # If tournament entry commission
    transaction_id: Optional[str] = None  # If payment commission (future)
    
    # Status
    is_paid: bool = False
    paid_at: Optional[datetime] = None
    payout_id: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    description: str  # Human readable description

class Payout(BaseModel):
    id: str
    affiliate_user_id: str
    
    # Payout details
    amount: float
    currency: str = "EUR"
    status: PayoutStatus = PayoutStatus.PENDING
    
    # Payment details
    payment_method: str  # bank_transfer, paypal, crypto, etc.
    payment_details: dict  # Bank account, PayPal email, wallet address, etc.
    
    # Commission IDs included in this payout
    commission_ids: List[str] = []
    
    # Processing
    processed_by: Optional[str] = None  # Admin who processed
    processed_at: Optional[datetime] = None
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime

# Request/Response Models
class AffiliateApplicationRequest(BaseModel):
    user_id: str
    desired_referral_code: Optional[str] = None  # User can suggest a code
    motivation: Optional[str] = None  # Why they want to be an affiliate

class ReferralStatsResponse(BaseModel):
    total_referrals: int
    active_referrals: int
    total_earnings: float
    pending_earnings: float
    paid_earnings: float
    this_month_referrals: int
    this_month_earnings: float
    recent_referrals: List[dict]
    recent_commissions: List[dict]

class AffiliatePayoutRequest(BaseModel):
    affiliate_user_id: str
    amount: float
    payment_method: str
    payment_details: dict
    notes: Optional[str] = None

class WalletStatsResponse(BaseModel):
    balance: WalletBalance
    recent_transactions: List[Transaction]
    monthly_earnings: List[dict]  # Last 12 months
    commission_breakdown: dict
    payout_summary: dict
    performance_metrics: dict

class AdminFinancialOverview(BaseModel):
    total_affiliates: int
    active_affiliates: int
    total_pending_payouts: float
    total_commissions_owed: float
    monthly_commission_costs: float
    platform_revenue: float
    affiliate_conversion_rate: float
    top_affiliates: List[dict]
    pending_payouts: List[dict]
    recent_transactions: List[dict]
    financial_summary: dict

class ManualAdjustmentRequest(BaseModel):
    user_id: str
    amount: float  # Can be positive or negative
    reason: str
    admin_notes: Optional[str] = None

# =============================================================================
# CONTENT MANAGEMENT SYSTEM MODELS
# =============================================================================

class ContentType(str, Enum):
    TEXT = "text"
    COLOR = "color"
    IMAGE = "image"
    THEME = "theme"

class ContentContext(str, Enum):
    NAVBAR = "navbar"
    HERO = "hero"
    FEATURES = "features"
    FOOTER = "footer"
    DASHBOARD = "dashboard"
    TOURNAMENT = "tournament"
    AFFILIATE = "affiliate"
    WALLET = "wallet"
    TEAM = "team"
    GUILD = "guild"
    GENERAL = "general"

class CMSContent(BaseModel):
    id: str
    key: str  # Unique identifier for content (e.g., "hero_title", "nav_login_text")
    content_type: ContentType
    context: ContentContext
    default_value: str  # Original/default value
    current_value: str  # Current customized value
    description: Optional[str] = None  # Description for admin users
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    created_by: str  # Admin user ID who created this
    updated_by: Optional[str] = None  # Admin user ID who last updated

class CMSTranslation(BaseModel):
    id: str
    content_id: str  # Reference to CMSContent
    language: str  # 'en', 'gr'
    translated_value: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: Optional[str] = None

class CMSTheme(BaseModel):
    id: str
    name: str  # Theme name
    colors: Dict[str, str]  # Color mappings (e.g., {"primary": "#4fc3f7", "secondary": "#29b6f6"})
    fonts: Dict[str, str]  # Font mappings (e.g., {"primary": "Inter", "secondary": "Roboto"})
    is_active: bool = True
    is_default: bool = False
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: Optional[str] = None

# Request/Response Models for CMS
class ContentUpdateRequest(BaseModel):
    key: str
    content_type: ContentType
    context: ContentContext
    current_value: str
    description: Optional[str] = None

class ContentBulkUpdateRequest(BaseModel):
    updates: List[ContentUpdateRequest]

class ThemeUpdateRequest(BaseModel):
    name: str
    colors: Dict[str, str]
    fonts: Optional[Dict[str, str]] = {}

class TranslationUpdateRequest(BaseModel):
    content_id: str
    language: str
    translated_value: str

# ===== SPORTSDUEL SYSTEM MODELS =====

class SportsDuelLeague(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    season: str
    max_teams: int = 16
    status: str = "active"  # active, inactive, completed
    entry_fee: Optional[float] = None
    prize_pool: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SportsDuelTeam(BaseModel):  # Sports Cafe
    id: Optional[str] = None
    name: str
    cafe_name: str
    location: str
    country: str
    city: str
    logo_url: Optional[str] = None
    owner_user_id: str  # Cafe owner
    contact_email: str
    contact_phone: str
    league_id: Optional[str] = None
    status: str = "active"  # active, inactive, suspended
    wins: int = 0
    losses: int = 0
    draws: int = 0
    points: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SportsDuelPlayer(BaseModel):  # Cafe Customer
    id: Optional[str] = None
    user_id: str  # Reference to main user system
    team_id: str
    nickname: str
    avatar_url: Optional[str] = None
    skill_rating: float = 1000.0
    wins: int = 0
    losses: int = 0
    draws: int = 0
    total_matches: int = 0
    average_accuracy: float = 0.0
    best_streak: int = 0
    current_streak: int = 0
    status: str = "active"  # active, inactive, suspended
    joined_at: Optional[datetime] = None
    last_match_at: Optional[datetime] = None

class SportsDuelTimeSlot(BaseModel):
    id: Optional[str] = None
    slot_name: str  # e.g., "Morning Slot", "Evening Slot"
    start_time: datetime
    end_time: datetime
    match_day: str  # e.g., "2024-01-15"
    max_concurrent_matches: int = 10
    status: str = "scheduled"  # scheduled, active, completed, cancelled
    created_at: Optional[datetime] = None

class SportsDuelSportsEvent(BaseModel):
    id: Optional[str] = None
    event_name: str  # e.g., "Chelsea vs Arsenal"
    sport_type: str  # football, basketball, tennis, etc.
    league: str  # e.g., "Premier League", "NBA"
    start_time: datetime
    home_team: str
    away_team: str
    odds_1: float  # Home win
    odds_x: Optional[float] = None  # Draw (if applicable)
    odds_2: float  # Away win
    total_goals_over: Optional[float] = None
    total_goals_under: Optional[float] = None
    status: str = "scheduled"  # scheduled, live, completed, cancelled
    result: Optional[str] = None  # "1", "X", "2", "over", "under"
    time_slot_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SportsDuelBet(BaseModel):
    id: Optional[str] = None
    event_id: str
    selection: str  # "1", "X", "2", "over", "under"
    odds: float
    is_correct: Optional[bool] = None
    created_at: Optional[datetime] = None

class SportsDuelCoupon(BaseModel):
    id: Optional[str] = None
    player_id: str
    match_id: str
    time_slot_id: str
    bets: List[SportsDuelBet] = []
    max_bets: int = 3  # 1 to 3 bets allowed
    total_odds: float = 1.0  # Product of all odds
    correct_predictions: int = 0
    wrong_predictions: int = 0
    has_winning_selection: bool = False  # Must have at least 1 correct
    is_winner: Optional[bool] = None
    status: str = "pending"  # pending, evaluated, disqualified
    created_at: Optional[datetime] = None
    evaluated_at: Optional[datetime] = None

class SportsDuelMatch(BaseModel):  # 1v1 Player Match
    id: Optional[str] = None
    league_id: str
    time_slot_id: str
    team1_id: str
    team2_id: str
    player1_id: str
    player2_id: str
    player1_coupon_id: Optional[str] = None
    player2_coupon_id: Optional[str] = None
    winner_player_id: Optional[str] = None
    match_result: Optional[str] = None  # "player1", "player2", "draw"
    status: str = "scheduled"  # scheduled, active, completed, cancelled
    scheduled_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class SportsDuelMatchResult(BaseModel):
    id: Optional[str] = None
    match_id: str
    player1_id: str
    player2_id: str
    player1_correct: int
    player1_wrong: int
    player1_odds_product: float
    player1_has_winning: bool
    player2_correct: int
    player2_wrong: int
    player2_odds_product: float
    player2_has_winning: bool
    winner_player_id: Optional[str] = None
    win_reason: str  # "fewer_wrong", "higher_odds", "disqualified"
    created_at: Optional[datetime] = None

# SportsDuel Request Models
class SportsDuelLeagueCreate(BaseModel):
    name: str
    description: Optional[str] = None
    season: str
    max_teams: int = 16
    entry_fee: Optional[float] = None
    prize_pool: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SportsDuelTeamCreate(BaseModel):
    name: str
    cafe_name: str
    location: str
    country: str
    city: str
    contact_email: str
    contact_phone: str
    logo_url: Optional[str] = None

class SportsDuelPlayerCreate(BaseModel):
    team_id: str
    nickname: str
    avatar_url: Optional[str] = None

class SportsDuelCouponCreate(BaseModel):
    match_id: str
    bets: List[Dict[str, Any]]  # event_id, selection, odds

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload["user_id"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(user_id: str = Depends(verify_token)) -> dict:
    """Get current user from token"""
    user = users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def verify_admin_token(min_role: AdminRole = AdminRole.ADMIN):
    def admin_check(credentials: HTTPAuthorizationCredentials = Depends(security)):
        try:
            payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
            user_id = payload["user_id"]
            
            # Get user and check admin role
            user = users_collection.find_one({"id": user_id})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_role = AdminRole(user.get("admin_role", "user"))
            
            # Check role hierarchy: god > super_admin > admin > user
            role_hierarchy = {
                AdminRole.GOD: 4,
                AdminRole.SUPER_ADMIN: 3,
                AdminRole.ADMIN: 2,
                AdminRole.USER: 1
            }
            
            if role_hierarchy[user_role] < role_hierarchy[min_role]:
                raise HTTPException(status_code=403, detail="Insufficient admin privileges")
            
            return user_id
        except HTTPException:
            raise
        except:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    return admin_check

def calculate_user_score(user_data):
    """Calculate user betting score based on various factors plus manual adjustments"""
    base_score = 0.0
    
    if user_data["total_bets"] > 0:
        win_rate = user_data["won_bets"] / user_data["total_bets"]
        profit = user_data["total_winnings"] - user_data["total_amount"]
        roi = profit / user_data["total_amount"] if user_data["total_amount"] > 0 else 0
        
        # Base score calculation from betting performance
        base_score = (win_rate * 100) + (roi * 50) + (user_data["avg_odds"] * 10)
    
    # Add manually adjusted score (from admin point adjustments)
    manual_score = user_data.get("score", 0) or 0
    
    # If user has manual score adjustments, use that as the primary score
    # Otherwise use the calculated score
    if manual_score > base_score:
        return manual_score
    else:
        return base_score

# =============================================================================
# AFFILIATE SYSTEM HELPER FUNCTIONS
# =============================================================================

def generate_referral_code(username: str, user_id: str) -> str:
    """Generate a unique referral code for user"""
    # Start with username (first 4 chars) + random string
    base_code = username[:4].upper()
    random_suffix = str(uuid.uuid4())[:6].upper()
    referral_code = f"{base_code}{random_suffix}"
    
    # Ensure uniqueness
    while affiliates_collection.find_one({"referral_code": referral_code}):
        random_suffix = str(uuid.uuid4())[:6].upper()
        referral_code = f"{base_code}{random_suffix}"
    
    return referral_code

def generate_referral_link(referral_code: str) -> str:
    """Generate full referral link"""
    base_url = "https://49f63d92-acd8-4e16-a4be-50baa0fb091a.preview.emergentagent.com"
    return f"{base_url}/?ref={referral_code}"

def process_referral_registration(referred_user_id: str, referral_code: str, registration_ip: str = None) -> bool:
    """Process a new referral registration and award commission"""
    try:
        # Find the affiliate
        affiliate = affiliates_collection.find_one({"referral_code": referral_code, "status": "active"})
        if not affiliate:
            return False
        
        # Create referral record
        referral_id = str(uuid.uuid4())
        referral_data = {
            "id": referral_id,
            "affiliate_user_id": affiliate["user_id"],
            "referred_user_id": referred_user_id,
            "referral_code": referral_code,
            "registered_at": datetime.utcnow(),
            "registration_ip": registration_ip,
            "is_active": True,
            "total_commissions_earned": 0.0,
            "tournaments_joined": 0,
            "total_tournament_fees": 0.0
        }
        referrals_collection.insert_one(referral_data)
        
        # Create registration commission
        commission_id = str(uuid.uuid4())
        commission_amount = affiliate.get("commission_rate_registration", 5.0)
        commission_data = {
            "id": commission_id,
            "affiliate_user_id": affiliate["user_id"],
            "referred_user_id": referred_user_id,
            "referral_id": referral_id,
            "commission_type": "registration",
            "amount": commission_amount,
            "rate_applied": commission_amount,
            "is_paid": False,
            "created_at": datetime.utcnow(),
            "description": f"Registration commission for new user referral"
        }
        commissions_collection.insert_one(commission_data)
        
        # Add transaction to wallet
        add_transaction(
            user_id=affiliate["user_id"],
            transaction_type="commission_earned",
            amount=commission_amount,
            description=f"Registration commission for new user referral",
            commission_id=commission_id,
            referral_id=referral_id
        )
        
        # Update affiliate stats
        affiliates_collection.update_one(
            {"user_id": affiliate["user_id"]},
            {
                "$inc": {
                    "total_referrals": 1,
                    "active_referrals": 1,
                    "total_earnings": commission_amount,
                    "pending_earnings": commission_amount
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return True
        
    except Exception as e:
        print(f"Error processing referral: {e}")
        return False

def process_tournament_commission(user_id: str, tournament_id: str, entry_fee: float) -> bool:
    """Process tournament entry commission for referred users"""
    try:
        # Check if this user was referred by someone
        referral = referrals_collection.find_one({"referred_user_id": user_id, "is_active": True})
        if not referral:
            return False
        
        # Get affiliate
        affiliate = affiliates_collection.find_one({"user_id": referral["affiliate_user_id"], "status": "active"})
        if not affiliate:
            return False
        
        # Calculate commission
        commission_rate = affiliate.get("commission_rate_tournament", 0.1)  # 10%
        commission_amount = entry_fee * commission_rate
        
        # Create tournament commission
        commission_id = str(uuid.uuid4())
        commission_data = {
            "id": commission_id,
            "affiliate_user_id": affiliate["user_id"],
            "referred_user_id": user_id,
            "referral_id": referral["id"],
            "commission_type": "tournament_entry",
            "amount": commission_amount,
            "rate_applied": commission_rate,
            "tournament_id": tournament_id,
            "is_paid": False,
            "created_at": datetime.utcnow(),
            "description": f"Tournament entry commission (€{entry_fee} × {commission_rate*100}%)"
        }
        commissions_collection.insert_one(commission_data)
        
        # Add transaction to wallet
        add_transaction(
            user_id=affiliate["user_id"],
            transaction_type="commission_earned",
            amount=commission_amount,
            description=f"Tournament entry commission (€{entry_fee} × {commission_rate*100}%)",
            commission_id=commission_id,
            referral_id=referral["id"],
            tournament_id=tournament_id
        )
        
        # Update affiliate stats
        affiliates_collection.update_one(
            {"user_id": affiliate["user_id"]},
            {
                "$inc": {
                    "total_earnings": commission_amount,
                    "pending_earnings": commission_amount
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # Update referral stats
        referrals_collection.update_one(
            {"id": referral["id"]},
            {
                "$inc": {
                    "tournaments_joined": 1,
                    "total_tournament_fees": entry_fee,
                    "total_commissions_earned": commission_amount
                },
                "$set": {"last_activity": datetime.utcnow()}
            }
        )
        
        return True
        
    except Exception as e:
        print(f"Error processing tournament commission: {e}")
        return False

def calculate_affiliate_stats(affiliate_user_id: str) -> dict:
    """Calculate comprehensive affiliate statistics"""
    try:
        # Get basic affiliate data
        affiliate = affiliates_collection.find_one({"user_id": affiliate_user_id})
        if not affiliate:
            return {}
        
        # Get referrals
        referrals = list(referrals_collection.find({"affiliate_user_id": affiliate_user_id}))
        
        # Get commissions
        commissions = list(commissions_collection.find({"affiliate_user_id": affiliate_user_id}))
        
        # This month stats
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        this_month_referrals = len([r for r in referrals if r["registered_at"] >= current_month_start])
        this_month_earnings = sum([c["amount"] for c in commissions if c["created_at"] >= current_month_start])
        
        # Recent activity
        recent_referrals = sorted(referrals, key=lambda x: x["registered_at"], reverse=True)[:5]
        recent_commissions = sorted(commissions, key=lambda x: x["created_at"], reverse=True)[:10]
        
        return {
            "total_referrals": len(referrals),
            "active_referrals": len([r for r in referrals if r["is_active"]]),
            "total_earnings": affiliate.get("total_earnings", 0.0),
            "pending_earnings": affiliate.get("pending_earnings", 0.0),
            "paid_earnings": affiliate.get("paid_earnings", 0.0),
            "this_month_referrals": this_month_referrals,
            "this_month_earnings": this_month_earnings,
            "recent_referrals": [
                {
                    "user_id": r["referred_user_id"],
                    "registered_at": r["registered_at"],
                    "tournaments_joined": r.get("tournaments_joined", 0),
                    "total_fees": r.get("total_tournament_fees", 0.0)
                } for r in recent_referrals
            ],
            "recent_commissions": [
                {
                    "amount": c["amount"],
                    "type": c["commission_type"],
                    "created_at": c["created_at"],
                    "description": c["description"],
                    "is_paid": c["is_paid"]
                } for c in recent_commissions
            ]
        }
        
    except Exception as e:
        print(f"Error calculating affiliate stats: {e}")
        return {}

# =============================================================================
# WALLET SYSTEM HELPER FUNCTIONS
# =============================================================================

def get_or_create_wallet(user_id: str) -> dict:
    """Get or create wallet balance for user"""
    try:
        wallet = wallet_balances_collection.find_one({"user_id": user_id})
        if not wallet:
            # Create new wallet
            wallet_id = str(uuid.uuid4())
            wallet_data = {
                "id": wallet_id,
                "user_id": user_id,
                "total_earned": 0.0,
                "available_balance": 0.0,
                "pending_balance": 0.0,
                "withdrawn_balance": 0.0,
                "registration_commissions": 0.0,
                "tournament_commissions": 0.0,
                "deposit_commissions": 0.0,
                "bonus_earnings": 0.0,
                "lifetime_withdrawals": 0.0,
                "pending_withdrawal": 0.0,
                "auto_payout_enabled": False,
                "auto_payout_threshold": 100.0,
                "preferred_payout_method": "bank_transfer",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            wallet_balances_collection.insert_one(wallet_data)
            return wallet_data
        
        # Clean wallet data for JSON serialization
        clean_wallet = {}
        for key, value in wallet.items():
            if key == "_id":
                clean_wallet[key] = str(value)
            elif isinstance(value, datetime):
                clean_wallet[key] = value.isoformat()
            elif hasattr(value, "__dict__"):
                # Skip complex objects that can't be serialized
                continue
            else:
                clean_wallet[key] = value
        
        return clean_wallet
    except Exception as e:
        print(f"Error getting/creating wallet: {e}")
        return {}

def add_transaction(user_id: str, transaction_type: str, amount: float, description: str, 
                   commission_id: str = None, payout_id: str = None, referral_id: str = None,
                   tournament_id: str = None, metadata: dict = None, processed_by: str = None,
                   admin_notes: str = None) -> bool:
    """Add a transaction and update wallet balance"""
    try:
        # Get current wallet
        wallet = get_or_create_wallet(user_id)
        
        # Calculate new balance
        balance_before = wallet.get("available_balance", 0.0)
        
        if transaction_type in ["commission_earned", "bonus", "manual_adjustment"]:
            balance_after = balance_before + amount
        elif transaction_type in ["payout_requested", "payout_completed", "penalty", "tournament_entry"]:
            balance_after = balance_before - amount
        else:
            balance_after = balance_before
        
        # Create transaction record
        transaction_id = str(uuid.uuid4())
        transaction_data = {
            "id": transaction_id,
            "user_id": user_id,
            "transaction_type": transaction_type,
            "amount": amount,
            "currency": "EUR",
            "commission_id": commission_id,
            "payout_id": payout_id,
            "referral_id": referral_id,
            "tournament_id": tournament_id,
            "balance_before": balance_before,
            "balance_after": balance_after,
            "description": description,
            "metadata": metadata or {},
            "processed_by": processed_by,
            "admin_notes": admin_notes,
            "is_processed": True,
            "processed_at": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        transactions_collection.insert_one(transaction_data)
        
        # Update wallet balance
        update_data = {"updated_at": datetime.utcnow()}
        
        if transaction_type == "commission_earned":
            update_data.update({
                "available_balance": balance_after,
                "total_earned": wallet.get("total_earned", 0.0) + amount,
            })
            
            # Update commission type breakdown
            if commission_id:
                commission = commissions_collection.find_one({"id": commission_id})
                if commission and commission.get("commission_type") == "registration":
                    update_data["registration_commissions"] = wallet.get("registration_commissions", 0.0) + amount
                elif commission and commission.get("commission_type") == "tournament_entry":
                    update_data["tournament_commissions"] = wallet.get("tournament_commissions", 0.0) + amount
                elif commission and commission.get("commission_type") == "deposit":
                    update_data["deposit_commissions"] = wallet.get("deposit_commissions", 0.0) + amount
        
        elif transaction_type == "bonus":
            update_data.update({
                "available_balance": balance_after,
                "total_earned": wallet.get("total_earned", 0.0) + amount,
                "bonus_earnings": wallet.get("bonus_earnings", 0.0) + amount
            })
        
        elif transaction_type == "payout_requested":
            update_data.update({
                "available_balance": balance_after,
                "pending_withdrawal": wallet.get("pending_withdrawal", 0.0) + amount
            })
        
        elif transaction_type == "payout_completed":
            update_data.update({
                "lifetime_withdrawals": wallet.get("lifetime_withdrawals", 0.0) + amount,
                "withdrawn_balance": wallet.get("withdrawn_balance", 0.0) + amount,
                "pending_withdrawal": max(0, wallet.get("pending_withdrawal", 0.0) - amount),
                "last_payout_date": datetime.utcnow()
            })
        
        elif transaction_type == "payout_failed":
            # Return money to available balance
            update_data.update({
                "available_balance": balance_after + amount,  # Add back the amount
                "pending_withdrawal": max(0, wallet.get("pending_withdrawal", 0.0) - amount)
            })
        
        elif transaction_type == "manual_adjustment":
            update_data.update({
                "available_balance": balance_after,
                "total_earned": wallet.get("total_earned", 0.0) + amount if amount > 0 else wallet.get("total_earned", 0.0)
            })
        
        wallet_balances_collection.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
        
        return True
        
    except Exception as e:
        print(f"Error adding transaction: {e}")
        return False

def calculate_wallet_stats(user_id: str) -> dict:
    """Calculate comprehensive wallet statistics"""
    try:
        wallet = get_or_create_wallet(user_id)
        transactions = list(transactions_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1))
        
        # Convert ObjectId to string in transactions
        for transaction in transactions:
            if "_id" in transaction:
                transaction["_id"] = str(transaction["_id"])
        
        # Monthly earnings (last 12 months)
        monthly_earnings = []
        now = datetime.utcnow()
        for i in range(12):
            month_start = (now.replace(day=1) - timedelta(days=i*30))
            month_end = month_start.replace(day=28) + timedelta(days=4)
            month_end = month_end - timedelta(days=month_end.day)
            
            month_transactions = [
                t for t in transactions 
                if month_start <= t["created_at"] <= month_end and 
                t["transaction_type"] in ["commission_earned", "bonus"]
            ]
            month_total = sum([t["amount"] for t in month_transactions])
            
            monthly_earnings.append({
                "month": month_start.strftime("%Y-%m"),
                "earnings": month_total,
                "transactions": len(month_transactions)
            })
        
        # Commission breakdown
        commission_breakdown = {
            "registration": wallet.get("registration_commissions", 0.0),
            "tournament": wallet.get("tournament_commissions", 0.0),
            "deposit": wallet.get("deposit_commissions", 0.0),
            "bonus": wallet.get("bonus_earnings", 0.0)
        }
        
        # Payout summary
        completed_payouts = [t for t in transactions if t["transaction_type"] == "payout_completed"]
        pending_payouts = [t for t in transactions if t["transaction_type"] == "payout_requested"]
        
        payout_summary = {
            "total_withdrawn": wallet.get("lifetime_withdrawals", 0.0),
            "pending_withdrawal": wallet.get("pending_withdrawal", 0.0),
            "total_payouts": len(completed_payouts),
            "last_payout": wallet.get("last_payout_date"),
            "next_auto_payout": wallet.get("available_balance", 0.0) >= wallet.get("auto_payout_threshold", 100.0)
        }
        
        # Performance metrics
        total_commissions = len([t for t in transactions if t["transaction_type"] == "commission_earned"])
        avg_commission = sum([t["amount"] for t in transactions if t["transaction_type"] == "commission_earned"]) / max(1, total_commissions)
        
        performance_metrics = {
            "total_commissions": total_commissions,
            "average_commission": avg_commission,
            "conversion_rate": 0.0,  # Calculate based on referrals vs successful registrations
            "monthly_growth": 0.0,   # Calculate based on month-over-month growth
            "efficiency_score": min(100, (total_commissions * avg_commission) / 10)  # Custom score
        }
        
        return {
            "balance": wallet,
            "recent_transactions": transactions[:20],
            "monthly_earnings": monthly_earnings,
            "commission_breakdown": commission_breakdown,
            "payout_summary": payout_summary,
            "performance_metrics": performance_metrics
        }
        
    except Exception as e:
        print(f"Error calculating wallet stats: {e}")
        return {}

def calculate_admin_financial_overview() -> dict:
    """Calculate comprehensive financial overview for admins"""
    try:
        # Basic affiliate stats
        total_affiliates = affiliates_collection.count_documents({})
        active_affiliates = affiliates_collection.count_documents({"status": "active"})
        
        # Pending payouts
        pending_payouts = list(payouts_collection.find({"status": "pending"}))
        # Convert ObjectId to string
        for payout in pending_payouts:
            if "_id" in payout:
                payout["_id"] = str(payout["_id"])
        
        total_pending_payouts = sum([p["amount"] for p in pending_payouts])
        
        # Total commissions owed (all unpaid commissions)
        unpaid_commissions = list(commissions_collection.find({"is_paid": False}))
        # Convert ObjectId to string
        for commission in unpaid_commissions:
            if "_id" in commission:
                commission["_id"] = str(commission["_id"])
        
        total_commissions_owed = sum([c["amount"] for c in unpaid_commissions])
        
        # Monthly commission costs
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_commissions = list(commissions_collection.find({
            "created_at": {"$gte": current_month_start}
        }))
        # Convert ObjectId to string
        for commission in monthly_commissions:
            if "_id" in commission:
                commission["_id"] = str(commission["_id"])
        
        monthly_commission_costs = sum([c["amount"] for c in monthly_commissions])
        
        # Platform revenue (this would be calculated based on tournament entries, deposits, etc.)
        # For now, let's estimate based on tournament entries
        monthly_tournaments = list(tournament_participants_collection.find({
            "joined_at": {"$gte": current_month_start}
        }))
        # Convert ObjectId to string
        for tournament in monthly_tournaments:
            if "_id" in tournament:
                tournament["_id"] = str(tournament["_id"])
        
        estimated_revenue = len(monthly_tournaments) * 10  # Estimate €10 average per entry
        
        # Affiliate conversion rate
        total_referrals = referrals_collection.count_documents({})
        active_referrals = referrals_collection.count_documents({"is_active": True})
        affiliate_conversion_rate = (active_referrals / max(1, total_referrals)) * 100
        
        # Top affiliates
        top_affiliates_data = list(affiliates_collection.find({}).sort("total_earnings", -1).limit(10))
        # Convert ObjectId to string
        for affiliate in top_affiliates_data:
            if "_id" in affiliate:
                affiliate["_id"] = str(affiliate["_id"])
        
        top_affiliates = []
        for affiliate in top_affiliates_data:
            user = users_collection.find_one({"id": affiliate["user_id"]})
            if user:
                top_affiliates.append({
                    "user_id": affiliate["user_id"],
                    "username": user["username"],
                    "full_name": user["full_name"],
                    "total_earnings": affiliate.get("total_earnings", 0.0),
                    "total_referrals": affiliate.get("total_referrals", 0),
                    "status": affiliate["status"]
                })
        
        # Recent transactions (all users)
        recent_transactions = list(transactions_collection.find({}).sort("created_at", -1).limit(20))
        # Convert ObjectId to string
        for transaction in recent_transactions:
            if "_id" in transaction:
                transaction["_id"] = str(transaction["_id"])
        
        for transaction in recent_transactions:
            user = users_collection.find_one({"id": transaction["user_id"]})
            if user:
                transaction["username"] = user["username"]
        
        # Financial summary
        total_platform_costs = total_commissions_owed + total_pending_payouts
        profit_margin = ((estimated_revenue - monthly_commission_costs) / max(1, estimated_revenue)) * 100
        
        financial_summary = {
            "total_platform_costs": total_platform_costs,
            "estimated_monthly_revenue": estimated_revenue,
            "monthly_commission_costs": monthly_commission_costs,
            "profit_margin": profit_margin,
            "cost_per_acquisition": monthly_commission_costs / max(1, len(monthly_tournaments)),
            "roi_percentage": ((estimated_revenue - monthly_commission_costs) / max(1, monthly_commission_costs)) * 100
        }
        
        return {
            "total_affiliates": total_affiliates,
            "active_affiliates": active_affiliates,
            "total_pending_payouts": total_pending_payouts,
            "total_commissions_owed": total_commissions_owed,
            "monthly_commission_costs": monthly_commission_costs,
            "platform_revenue": estimated_revenue,
            "affiliate_conversion_rate": affiliate_conversion_rate,
            "top_affiliates": top_affiliates,
            "pending_payouts": [
                {
                    **p,
                    "username": users_collection.find_one({"id": p["affiliate_user_id"]}, {"username": 1, "_id": 0}).get("username", "Unknown") if users_collection.find_one({"id": p["affiliate_user_id"]}) else "Unknown"
                } for p in pending_payouts
            ],
            "recent_transactions": recent_transactions,
            "financial_summary": financial_summary
        }
        
    except Exception as e:
        print(f"Error calculating admin financial overview: {e}")
        return {}

# =============================================================================
# SPORTSDUEL SYSTEM HELPER FUNCTIONS
# =============================================================================

def calculate_sportsduel_match_winner(player1_coupon: dict, player2_coupon: dict) -> dict:
    """Calculate match winner based on SportsDuel rules"""
    try:
        result = {
            "winner_player_id": None,
            "win_reason": "draw",
            "player1_stats": {
                "correct": player1_coupon["correct_predictions"],
                "wrong": player1_coupon["wrong_predictions"],
                "odds_product": player1_coupon["total_odds"],
                "has_winning": player1_coupon["has_winning_selection"]
            },
            "player2_stats": {
                "correct": player2_coupon["correct_predictions"],
                "wrong": player2_coupon["wrong_predictions"],
                "odds_product": player2_coupon["total_odds"],
                "has_winning": player2_coupon["has_winning_selection"]
            }
        }
        
        # Rule 1: Must have at least 1 winning selection
        if not player1_coupon["has_winning_selection"] and not player2_coupon["has_winning_selection"]:
            return result  # Both disqualified, draw
        
        if not player1_coupon["has_winning_selection"]:
            result["winner_player_id"] = player2_coupon["player_id"]
            result["win_reason"] = "player1_disqualified"
            return result
            
        if not player2_coupon["has_winning_selection"]:
            result["winner_player_id"] = player1_coupon["player_id"]
            result["win_reason"] = "player2_disqualified"
            return result
        
        # Rule 2: Fewer wrong predictions wins
        if player1_coupon["wrong_predictions"] < player2_coupon["wrong_predictions"]:
            result["winner_player_id"] = player1_coupon["player_id"]
            result["win_reason"] = "fewer_wrong_predictions"
        elif player2_coupon["wrong_predictions"] < player1_coupon["wrong_predictions"]:
            result["winner_player_id"] = player2_coupon["player_id"]
            result["win_reason"] = "fewer_wrong_predictions"
        else:
            # Rule 3: Same wrong predictions, higher odds product wins
            if player1_coupon["total_odds"] > player2_coupon["total_odds"]:
                result["winner_player_id"] = player1_coupon["player_id"]
                result["win_reason"] = "higher_odds_product"
            elif player2_coupon["total_odds"] > player1_coupon["total_odds"]:
                result["winner_player_id"] = player2_coupon["player_id"]
                result["win_reason"] = "higher_odds_product"
            # else: draw (same wrong predictions and same odds)
        
        return result
        
    except Exception as e:
        print(f"Error calculating match winner: {e}")
        return {"winner_player_id": None, "win_reason": "error"}

def evaluate_sportsduel_coupon(coupon_id: str, sports_events_results: dict) -> dict:
    """Evaluate a SportsDuel coupon against actual results"""
    try:
        coupon = sportsduel_coupons_collection.find_one({"id": coupon_id})
        if not coupon:
            return {"error": "Coupon not found"}
        
        correct_predictions = 0
        wrong_predictions = 0
        total_odds = 1.0
        has_winning_selection = False
        
        # Evaluate each bet in the coupon
        for bet in coupon["bets"]:
            event_id = bet["event_id"]
            selection = bet["selection"]
            odds = bet["odds"]
            
            # Get actual result
            actual_result = sports_events_results.get(event_id)
            if actual_result is None:
                continue  # Event not completed yet
            
            # Check if prediction is correct
            is_correct = (selection == actual_result)
            
            if is_correct:
                correct_predictions += 1
                has_winning_selection = True
                total_odds *= odds
            else:
                wrong_predictions += 1
            
            # Update bet result
            sportsduel_bets_collection.update_one(
                {"coupon_id": coupon_id, "event_id": event_id},
                {"$set": {"is_correct": is_correct}}
            )
        
        # Update coupon with evaluation results
        sportsduel_coupons_collection.update_one(
            {"id": coupon_id},
            {
                "$set": {
                    "correct_predictions": correct_predictions,
                    "wrong_predictions": wrong_predictions,
                    "total_odds": total_odds,
                    "has_winning_selection": has_winning_selection,
                    "status": "evaluated",
                    "evaluated_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "coupon_id": coupon_id,
            "correct_predictions": correct_predictions,
            "wrong_predictions": wrong_predictions,
            "total_odds": total_odds,
            "has_winning_selection": has_winning_selection
        }
        
    except Exception as e:
        print(f"Error evaluating coupon: {e}")
        return {"error": str(e)}

def create_sportsduel_time_slots_for_day(match_date: str, league_id: str) -> list:
    """Create default time slots for a match day"""
    try:
        base_date = datetime.fromisoformat(match_date)
        time_slots = []
        
        # Morning Slot (9:00 AM - 12:00 PM)
        morning_slot = {
            "id": str(uuid.uuid4()),
            "slot_name": "Morning Slot",
            "start_time": base_date.replace(hour=9, minute=0),
            "end_time": base_date.replace(hour=12, minute=0),
            "match_day": match_date,
            "league_id": league_id,
            "max_concurrent_matches": 10,
            "status": "scheduled",
            "created_at": datetime.utcnow()
        }
        
        # Afternoon Slot (1:00 PM - 4:00 PM)
        afternoon_slot = {
            "id": str(uuid.uuid4()),
            "slot_name": "Afternoon Slot", 
            "start_time": base_date.replace(hour=13, minute=0),
            "end_time": base_date.replace(hour=16, minute=0),
            "match_day": match_date,
            "league_id": league_id,
            "max_concurrent_matches": 10,
            "status": "scheduled",
            "created_at": datetime.utcnow()
        }
        
        # Evening Slot (6:00 PM - 9:00 PM)
        evening_slot = {
            "id": str(uuid.uuid4()),
            "slot_name": "Evening Slot",
            "start_time": base_date.replace(hour=18, minute=0),
            "end_time": base_date.replace(hour=21, minute=0),
            "match_day": match_date,
            "league_id": league_id,
            "max_concurrent_matches": 10,
            "status": "scheduled",
            "created_at": datetime.utcnow()
        }
        
        # Insert into database
        slots_to_insert = [morning_slot, afternoon_slot, evening_slot]
        sportsduel_time_slots_collection.insert_many(slots_to_insert)
        time_slots.extend(slots_to_insert)
        
        return time_slots
        
    except Exception as e:
        print(f"Error creating time slots: {e}")
        return []

def get_sportsduel_player_stats(player_id: str) -> dict:
    """Calculate comprehensive player statistics"""
    try:
        player = sportsduel_players_collection.find_one({"id": player_id})
        if not player:
            return {}
        
        # Get player matches
        matches = list(sportsduel_matches_collection.find({
            "$or": [{"player1_id": player_id}, {"player2_id": player_id}],
            "status": "completed"
        }))
        
        stats = {
            "player_id": player_id,
            "nickname": player.get("nickname", ""),
            "total_matches": len(matches),
            "wins": 0,
            "losses": 0,
            "draws": 0,
            "win_percentage": 0.0,
            "current_streak": 0,
            "best_streak": 0,
            "average_odds": 0.0,
            "total_correct_predictions": 0,
            "total_wrong_predictions": 0,
            "accuracy_percentage": 0.0
        }
        
        # Calculate match statistics
        current_streak = 0
        best_streak = 0
        total_odds = 0
        total_predictions = 0
        
        for match in matches:
            if match["winner_player_id"] == player_id:
                stats["wins"] += 1
                current_streak += 1
                best_streak = max(best_streak, current_streak)
            elif match["winner_player_id"] is None:
                stats["draws"] += 1
                current_streak = 0
            else:
                stats["losses"] += 1
                current_streak = 0
            
            # Get coupon stats for this match
            if match["player1_id"] == player_id and match["player1_coupon_id"]:
                coupon = sportsduel_coupons_collection.find_one({"id": match["player1_coupon_id"]})
                if coupon:
                    stats["total_correct_predictions"] += coupon.get("correct_predictions", 0)
                    stats["total_wrong_predictions"] += coupon.get("wrong_predictions", 0)
                    total_odds += coupon.get("total_odds", 0)
                    total_predictions += len(coupon.get("bets", []))
                    
            elif match["player2_id"] == player_id and match["player2_coupon_id"]:
                coupon = sportsduel_coupons_collection.find_one({"id": match["player2_coupon_id"]})
                if coupon:
                    stats["total_correct_predictions"] += coupon.get("correct_predictions", 0)
                    stats["total_wrong_predictions"] += coupon.get("wrong_predictions", 0)
                    total_odds += coupon.get("total_odds", 0)
                    total_predictions += len(coupon.get("bets", []))
        
        # Calculate percentages
        if stats["total_matches"] > 0:
            stats["win_percentage"] = (stats["wins"] / stats["total_matches"]) * 100
            
        if total_predictions > 0:
            stats["accuracy_percentage"] = (stats["total_correct_predictions"] / total_predictions) * 100
            stats["average_odds"] = total_odds / len(matches) if matches else 0
        
        stats["current_streak"] = current_streak
        stats["best_streak"] = best_streak
        
        return stats
        
    except Exception as e:
        print(f"Error calculating player stats: {e}")
        return {}

def generate_sample_sports_events(time_slot_id: str, match_date: str) -> list:
    """Generate sample sports events for testing"""
    try:
        events = []
        base_date = datetime.fromisoformat(match_date)
        
        # Premier League matches
        premier_league_matches = [
            ("Chelsea", "Arsenal", 2.10, 3.40, 3.50),
            ("Manchester United", "Liverpool", 2.80, 3.20, 2.60),
            ("Manchester City", "Tottenham", 1.85, 3.60, 4.20),
            ("Newcastle", "Brighton", 2.30, 3.10, 3.40),
            ("West Ham", "Everton", 2.20, 3.25, 3.30)
        ]
        
        for i, (home_team, away_team, odds_1, odds_x, odds_2) in enumerate(premier_league_matches):
            event = {
                "id": str(uuid.uuid4()),
                "event_name": f"{home_team} vs {away_team}",
                "sport_type": "football",
                "league": "Premier League",
                "start_time": base_date.replace(hour=15, minute=i*30),
                "home_team": home_team,
                "away_team": away_team,
                "odds_1": odds_1,
                "odds_x": odds_x,
                "odds_2": odds_2,
                "total_goals_over": 2.25,
                "total_goals_under": 1.65,
                "status": "scheduled",
                "time_slot_id": time_slot_id,
                "created_at": datetime.utcnow()
            }
            events.append(event)
        
        # Insert into database
        sportsduel_sports_events_collection.insert_many(events)
        return events
        
    except Exception as e:
        print(f"Error generating sample events: {e}")
        return []

# Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "WoBeRa - World Betting Rank API is running"}

@app.post("/api/register")
async def register_user(user: UserRegister):
    # Check if user already exists
    if users_collection.find_one({"$or": [{"username": user.username}, {"email": user.email}]}):
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    # Create new user
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password),
        "country": user.country,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "admin_role": user.admin_role.value,
        "is_blocked": False,
        "blocked_until": None,
        "blocked_reason": None,
        "created_at": datetime.utcnow(),
        "total_bets": 0,
        "won_bets": 0,
        "lost_bets": 0,
        "total_amount": 0.0,
        "total_winnings": 0.0,
        "avg_odds": 0.0,
        "rank": 0,
        "score": 0.0
    }
    
    users_collection.insert_one(user_data)
    token = create_token(user_id)
    
    # Process referral if provided
    referral_success = False
    if user.referral_code:
        referral_success = process_referral_registration(
            referred_user_id=user_id,
            referral_code=user.referral_code,
            registration_ip=None  # Could extract from request in the future
        )
    
    response_data = {
        "message": "User registered successfully",
        "token": token,
        "user_id": user_id
    }
    
    if user.referral_code:
        response_data["referral_processed"] = referral_success
        if referral_success:
            response_data["referral_message"] = "Referral bonus applied successfully!"
        else:
            response_data["referral_message"] = "Invalid referral code"
    
    return response_data

@app.post("/api/login")
async def login_user(user: UserLogin):
    # Find user
    user_data = users_collection.find_one({"username": user.username})
    if not user_data or not verify_password(user.password, user_data["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Handle both old users (with 'id' field) and new users (with 'user_id' field)
    user_id = user_data.get("user_id") or user_data.get("id")
    if not user_id:
        raise HTTPException(status_code=500, detail="User ID not found")
    
    token = create_token(user_id)
    return {"message": "Login successful", "token": token, "user_id": user_id}

@app.get("/api/profile")
async def get_profile(user_id: str = Depends(verify_token)):
    user_data = users_collection.find_one({"id": user_id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data.pop("password", None)
    user_data.pop("_id", None)
    return user_data

@app.put("/api/profile")
async def update_profile(profile_data: dict, user_id: str = Depends(verify_token)):
    """Update user profile"""
    user = users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Allowed fields to update
    allowed_fields = ['full_name', 'email', 'avatar_url', 'country', 'phone', 'nickname']
    update_data = {}
    
    for field in allowed_fields:
        if field in profile_data:
            # Check if email already exists (if updating email)
            if field == 'email' and profile_data[field] != user['email']:
                existing_user = users_collection.find_one({"email": profile_data[field]})
                if existing_user and existing_user['id'] != user_id:
                    raise HTTPException(status_code=400, detail="Email already exists")
            update_data[field] = profile_data[field]
    
    if update_data:
        users_collection.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
    
    return {"message": "Profile updated successfully"}

@app.put("/api/profile/password")
async def change_password(password_data: dict, user_id: str = Depends(verify_token)):
    """Change user password"""
    current_password = password_data.get('current_password')
    new_password = password_data.get('new_password')
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Current and new password required")
    
    user = users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(current_password, user['password']):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    hashed_new_password = hash_password(new_password)
    users_collection.update_one(
        {"id": user_id},
        {"$set": {"password": hashed_new_password}}
    )
    
    return {"message": "Password changed successfully"}

@app.get("/api/rankings")
async def get_rankings(limit: int = 50, skip: int = 0):
    # Get all users and calculate their scores
    users = list(users_collection.find({}, {"password": 0, "_id": 0}))
    
    # Calculate scores and sort
    for user in users:
        user["score"] = calculate_user_score(user)
    
    users.sort(key=lambda x: x["score"], reverse=True)
    
    # Assign ranks
    for i, user in enumerate(users):
        user["rank"] = i + 1
    
    # Return paginated results
    return {
        "rankings": users[skip:skip + limit],
        "total": len(users)
    }

@app.get("/api/rankings/country/{country}")
async def get_country_rankings(country: str, limit: int = 20):
    # Get users from specific country
    users = list(users_collection.find({"country": country}, {"password": 0, "_id": 0}))
    
    # Calculate scores and sort
    for user in users:
        user["score"] = calculate_user_score(user)
    
    users.sort(key=lambda x: x["score"], reverse=True)
    
    # Assign ranks
    for i, user in enumerate(users):
        user["rank"] = i + 1
    
    return {
        "country": country,
        "rankings": users[:limit],
        "total": len(users)
    }

@app.get("/api/competitions")
async def get_competitions(region: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if region:
        query["region"] = region
    if status:
        query["status"] = status
    
    competitions = list(competitions_collection.find(query, {"_id": 0}))
    return {"competitions": competitions}

@app.post("/api/competitions/{competition_id}/join")
async def join_competition(competition_id: str, user_id: str = Depends(verify_token)):
    # Check if competition exists
    competition = competitions_collection.find_one({"id": competition_id})
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    # Check if user exists
    user = users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # TODO: Add logic to join competition
    return {"message": "Successfully joined competition"}

@app.get("/api/stats/countries")
async def get_country_stats():
    # Get stats by country
    pipeline = [
        {"$group": {
            "_id": "$country",
            "total_users": {"$sum": 1},
            "total_bets": {"$sum": "$total_bets"},
            "total_amount": {"$sum": "$total_amount"},
            "total_winnings": {"$sum": "$total_winnings"}
        }},
        {"$sort": {"total_users": -1}}
    ]
    
    stats = list(users_collection.aggregate(pipeline))
    return {"country_stats": stats}

# ADMIN ENDPOINTS
@app.post("/api/admin/block-user")
async def block_user(request: BlockUserRequest, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Block a user temporarily or permanently"""
    user = users_collection.find_one({"id": request.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate block end time for temporary blocks
    blocked_until = None
    if request.block_type == "temporary" and request.duration_hours:
        blocked_until = datetime.utcnow() + timedelta(hours=request.duration_hours)
    
    # Update user
    users_collection.update_one(
        {"id": request.user_id},
        {
            "$set": {
                "is_blocked": True,
                "blocked_until": blocked_until,
                "blocked_reason": request.reason
            }
        }
    )
    
    # Log admin action
    admin_actions_collection.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin_id,
        "action_type": "block_user",
        "target_user_id": request.user_id,
        "details": {
            "block_type": request.block_type,
            "duration_hours": request.duration_hours,
            "reason": request.reason
        },
        "timestamp": datetime.utcnow()
    })
    
    return {"message": f"User blocked {request.block_type}ly"}

@app.post("/api/admin/unblock-user/{user_id}")
async def unblock_user(user_id: str, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Unblock a user"""
    users_collection.update_one(
        {"id": user_id},
        {
            "$set": {
                "is_blocked": False,
                "blocked_until": None,
                "blocked_reason": None
            }
        }
    )
    
    # Log admin action
    admin_actions_collection.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin_id,
        "action_type": "unblock_user",
        "target_user_id": user_id,
        "timestamp": datetime.utcnow()
    })
    
    return {"message": "User unblocked successfully"}

@app.post("/api/admin/adjust-points")
async def adjust_user_points(request: AdjustPointsRequest, admin_id: str = Depends(verify_admin_token(AdminRole.GOD))):
    """Adjust user points (God level only)"""
    user = users_collection.find_one({"id": request.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get admin info for better logging
    admin_user = users_collection.find_one({"id": admin_id})
    admin_name = admin_user.get("username", "Unknown") if admin_user else "Unknown"
    
    # Update user score
    new_score = max(0, user["score"] + request.points_change)
    users_collection.update_one(
        {"id": request.user_id},
        {"$set": {"score": new_score}}
    )
    
    # Log admin action with more details
    admin_actions_collection.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin_name,
        "action_type": "adjust_points",
        "target_user_id": user.get("username", "Unknown"),
        "details": {
            "points_change": request.points_change,
            "old_score": user["score"],
            "new_score": new_score,
            "reason": request.reason,
            "target_user_name": user.get("full_name", "Unknown User")
        },
        "timestamp": datetime.utcnow()
    })
    
    return {"message": f"Points adjusted by {request.points_change}"}

@app.post("/api/admin/create-competition")
async def create_competition(competition: Competition, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Create a new competition"""
    competition_data = competition.dict()
    competition_data["id"] = str(uuid.uuid4())
    competition_data["created_by"] = admin_id
    competition_data["current_participants"] = 0
    
    competitions_collection.insert_one(competition_data)
    
    # Log admin action
    admin_actions_collection.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin_id,
        "action_type": "create_competition",
        "target_competition_id": competition_data["id"],
        "details": {"name": competition.name, "region": competition.region},
        "timestamp": datetime.utcnow()
    })
    
    return {"message": "Competition created successfully", "competition_id": competition_data["id"]}

@app.post("/api/admin/site-message")
async def create_site_message(message: SiteMessage, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Create a site-wide message"""
    message_data = message.dict()
    message_data["id"] = str(uuid.uuid4())
    message_data["created_by"] = admin_id
    message_data["created_at"] = datetime.utcnow()
    message_data["is_active"] = True
    
    site_messages_collection.insert_one(message_data)
    
    return {"message": "Site message created successfully", "message_id": message_data["id"]}

@app.get("/api/admin/users")
async def get_all_users(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get all users for admin management"""
    users = list(users_collection.find({}, {"password": 0, "_id": 0}))
    return {"users": users}

@app.get("/api/admin/users/top100")
async def get_top_100_users(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get top 100 users by score for ranking display"""
    try:
        top_users = list(users_collection.find(
            {}, 
            {"_id": 0, "full_name": 1, "username": 1, "score": 1, "country": 1, "avatar_url": 1}
        ).sort("score", -1).limit(100))
        
        return {"top_users": top_users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching top 100 users: {str(e)}")

@app.get("/api/admin/actions")
async def get_admin_actions(admin_id: str = Depends(verify_admin_token(AdminRole.GOD))):
    """Get all admin actions (God level only)"""
    actions = list(admin_actions_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(100))
    return {"actions": actions}

@app.get("/api/site-messages")
async def get_active_site_messages():
    """Get active site messages"""
    messages = list(site_messages_collection.find({
        "is_active": True,
        "$or": [
            {"expires_at": None},
            {"expires_at": {"$gt": datetime.utcnow()}}
        ]
    }, {"_id": 0}))
    return {"messages": messages}

@app.get("/api/admin/analytics/overview")
async def get_analytics_overview(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get analytics overview data"""
    try:
        # User statistics
        total_users = users_collection.count_documents({})
        active_users = users_collection.count_documents({"is_blocked": {"$ne": True}})
        blocked_users = users_collection.count_documents({"is_blocked": True})
        
        # Competition statistics
        total_competitions = competitions_collection.count_documents({})
        active_competitions = competitions_collection.count_documents({"status": "active"})
        
        # Rankings statistics
        total_rankings = rankings_collection.count_documents({})
        
        # User distribution by country
        user_countries = list(users_collection.aggregate([
            {"$group": {"_id": "$country", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        # Recent user registrations (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_registrations = users_collection.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        # Points distribution
        points_stats = list(users_collection.aggregate([
            {"$group": {
                "_id": None,
                "avg_points": {"$avg": "$points"},
                "max_points": {"$max": "$points"},
                "min_points": {"$min": "$points"},
                "total_points": {"$sum": "$points"}
            }}
        ]))
        
        return {
            "overview": {
                "total_users": total_users,
                "active_users": active_users,
                "blocked_users": blocked_users,
                "total_competitions": total_competitions,
                "active_competitions": active_competitions,
                "total_rankings": total_rankings,
                "recent_registrations": recent_registrations
            },
            "user_countries": user_countries,
            "points_stats": points_stats[0] if points_stats else {}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")

@app.get("/api/admin/analytics/users")
async def get_user_analytics(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get detailed user analytics"""
    try:
        # User registration timeline (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        registration_timeline = list(users_collection.aggregate([
            {"$match": {"created_at": {"$gte": six_months_ago}}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]))
        
        # Top users by points
        top_users = list(users_collection.find(
            {}, 
            {"_id": 0, "full_name": 1, "username": 1, "score": 1, "country": 1}
        ).sort("score", -1).limit(10))
        
        # User activity by admin role
        admin_role_distribution = list(users_collection.aggregate([
            {"$group": {"_id": "$admin_role", "count": {"$sum": 1}}}
        ]))
        
        return {
            "registration_timeline": registration_timeline,
            "top_users": top_users,
            "admin_role_distribution": admin_role_distribution
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user analytics: {str(e)}")

@app.get("/api/admin/analytics/competitions")
async def get_competition_analytics(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get competition analytics"""
    try:
        # Competition by status
        competition_status = list(competitions_collection.aggregate([
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]))
        
        # Competition by region
        competition_regions = list(competitions_collection.aggregate([
            {"$group": {"_id": "$region", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        # Prize pool statistics
        prize_stats = list(competitions_collection.aggregate([
            {"$group": {
                "_id": None,
                "total_prize_pool": {"$sum": "$prize_pool"},
                "avg_prize_pool": {"$avg": "$prize_pool"},
                "max_prize_pool": {"$max": "$prize_pool"}
            }}
        ]))
        
        return {
            "competition_status": competition_status,
            "competition_regions": competition_regions,
            "prize_stats": prize_stats[0] if prize_stats else {}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching competition analytics: {str(e)}")

@app.get("/api/admin/analytics/advanced-dashboard")
async def get_advanced_dashboard_analytics(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get advanced dashboard analytics for charts and KPIs"""
    try:
        # User Registration Trends (last 12 months)
        twelve_months_ago = datetime.utcnow() - timedelta(days=365)
        registration_trends = list(users_collection.aggregate([
            {"$match": {"created_at": {"$gte": twelve_months_ago}}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"},
                    "day": {"$dayOfMonth": "$created_at"}
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
        ]))
        
        # Tournament Participation Analytics
        tournament_participation = list(tournament_participants_collection.aggregate([
            {"$group": {
                "_id": "$tournament_id",
                "participants": {"$sum": 1}
            }},
            {"$sort": {"participants": -1}},
            {"$limit": 10}
        ]))
        
        # Enhance with tournament details
        for tp in tournament_participation:
            tournament = tournaments_collection.find_one({"id": tp["_id"]})
            if tournament:
                tp["tournament_name"] = tournament.get("name", "Unknown")
                tp["entry_fee"] = tournament.get("entry_fee", 0)
        
        # Revenue Analytics by Tournament Categories
        revenue_by_category = list(tournaments_collection.aggregate([
            {"$group": {
                "_id": "$entry_fee_category",
                "total_revenue": {"$sum": {"$multiply": ["$entry_fee", "$current_participants"]}},
                "tournament_count": {"$sum": 1},
                "avg_participants": {"$avg": "$current_participants"}
            }},
            {"$sort": {"total_revenue": -1}}
        ]))
        
        # Geographic Distribution (Enhanced)
        geographic_data = list(users_collection.aggregate([
            {"$group": {
                "_id": "$country",
                "user_count": {"$sum": 1},
                "total_bets": {"$sum": "$total_bets"},
                "total_winnings": {"$sum": "$total_winnings"},
                "avg_score": {"$avg": "$score"}
            }},
            {"$sort": {"user_count": -1}}
        ]))
        
        # Performance KPIs
        total_users = users_collection.count_documents({})
        active_users_last_30_days = users_collection.count_documents({
            "created_at": {"$gte": datetime.utcnow() - timedelta(days=30)}
        })
        
        total_tournaments = tournaments_collection.count_documents({})
        active_tournaments = tournaments_collection.count_documents({"status": "open"})
        
        total_revenue = sum([item["total_revenue"] for item in revenue_by_category])
        
        # Affiliate metrics
        total_affiliates = affiliates_collection.count_documents({})
        active_affiliates = affiliates_collection.count_documents({"status": "active"})
        total_commissions = sum([c["amount"] for c in commissions_collection.find({})])
        
        performance_kpis = {
            "total_users": total_users,
            "active_users_last_30_days": active_users_last_30_days,
            "user_growth_rate": (active_users_last_30_days / max(total_users, 1)) * 100,
            "total_tournaments": total_tournaments,
            "active_tournaments": active_tournaments,
            "tournament_completion_rate": ((total_tournaments - active_tournaments) / max(total_tournaments, 1)) * 100,
            "total_revenue": total_revenue,
            "avg_revenue_per_tournament": total_revenue / max(total_tournaments, 1),
            "total_affiliates": total_affiliates,
            "active_affiliates": active_affiliates,
            "affiliate_conversion_rate": (active_affiliates / max(total_affiliates, 1)) * 100,
            "total_commissions": total_commissions
        }
        
        return {
            "registration_trends": registration_trends,
            "tournament_participation": tournament_participation,
            "revenue_by_category": revenue_by_category,
            "geographic_distribution": geographic_data,
            "performance_kpis": performance_kpis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching advanced dashboard analytics: {str(e)}")

@app.get("/api/admin/analytics/engagement-metrics")
async def get_engagement_metrics(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get user engagement metrics"""
    try:
        # Daily Active Users (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        daily_active_users = []
        
        for i in range(30):
            day_start = thirty_days_ago + timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            # Count users who joined tournaments on that day
            active_count = tournament_participants_collection.count_documents({
                "registered_at": {"$gte": day_start, "$lt": day_end}
            })
            
            daily_active_users.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "active_users": active_count
            })
        
        # Tournament Success Rates
        tournament_success_rates = []
        tournaments = list(tournaments_collection.find({"status": {"$in": ["completed", "ongoing"]}}))
        
        for tournament in tournaments:
            participants = tournament_participants_collection.count_documents({
                "tournament_id": tournament["id"]
            })
            
            completion_rate = (participants / max(tournament.get("max_participants", 1), 1)) * 100
            
            tournament_success_rates.append({
                "tournament_id": tournament["id"],
                "tournament_name": tournament.get("name", "Unknown"),
                "completion_rate": completion_rate,
                "participants": participants,
                "max_participants": tournament.get("max_participants", 0)
            })
        
        # Affiliate Conversion Funnel
        total_referrals = referrals_collection.count_documents({})
        active_referrals = referrals_collection.count_documents({"is_active": True})
        
        # Users who joined tournaments after referral
        referral_tournament_participation = 0
        referrals = list(referrals_collection.find({}))
        
        for referral in referrals:
            participant_count = tournament_participants_collection.count_documents({
                "user_id": referral["referred_user_id"]
            })
            if participant_count > 0:
                referral_tournament_participation += 1
        
        affiliate_funnel = {
            "total_referrals": total_referrals,
            "active_referrals": active_referrals,
            "referral_to_active_rate": (active_referrals / max(total_referrals, 1)) * 100,
            "referral_tournament_participation": referral_tournament_participation,
            "referral_to_tournament_rate": (referral_tournament_participation / max(total_referrals, 1)) * 100
        }
        
        # Financial Performance Indicators
        total_entry_fees = 0
        total_prize_pools = 0
        tournaments_with_revenue = list(tournaments_collection.find({}))
        
        for tournament in tournaments_with_revenue:
            entry_fee = tournament.get("entry_fee", 0)
            participants = tournament.get("current_participants", 0)
            total_entry_fees += entry_fee * participants
            total_prize_pools += tournament.get("total_prize_pool", 0)
        
        platform_revenue = total_entry_fees - total_prize_pools
        
        financial_indicators = {
            "total_entry_fees": total_entry_fees,
            "total_prize_pools": total_prize_pools,
            "platform_revenue": platform_revenue,
            "profit_margin": (platform_revenue / max(total_entry_fees, 1)) * 100,
            "avg_tournament_revenue": total_entry_fees / max(len(tournaments_with_revenue), 1)
        }
        
        # User Retention Analytics
        # Calculate retention based on tournament participation over time
        current_month = datetime.utcnow().replace(day=1)
        last_month = current_month - timedelta(days=30)
        
        current_month_users = set()
        last_month_users = set()
        
        # Get users who participated in tournaments this month
        current_participants = list(tournament_participants_collection.find({
            "registered_at": {"$gte": current_month}
        }))
        for p in current_participants:
            current_month_users.add(p["user_id"])
        
        # Get users who participated in tournaments last month
        last_participants = list(tournament_participants_collection.find({
            "registered_at": {"$gte": last_month, "$lt": current_month}
        }))
        for p in last_participants:
            last_month_users.add(p["user_id"])
        
        retained_users = current_month_users.intersection(last_month_users)
        retention_rate = (len(retained_users) / max(len(last_month_users), 1)) * 100
        
        retention_analytics = {
            "current_month_active": len(current_month_users),
            "last_month_active": len(last_month_users),
            "retained_users": len(retained_users),
            "retention_rate": retention_rate,
            "churn_rate": 100 - retention_rate
        }
        
        return {
            "daily_active_users": daily_active_users,
            "tournament_success_rates": tournament_success_rates,
            "affiliate_conversion_funnel": affiliate_funnel,
            "financial_performance": financial_indicators,
            "retention_analytics": retention_analytics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching engagement metrics: {str(e)}")

@app.get("/api/admin/content/pages")
async def get_content_pages(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get all content pages for management"""
    try:
        # Get content pages from database
        pages = list(content_pages_collection.find({}, {"_id": 0}))
        
        # If no pages exist, create default ones
        if not pages:
            default_pages = [
                {
                    "id": "home_hero",
                    "title": "Home Page Hero Section",
                    "page_type": "hero",
                    "content": "Welcome to WoBeRa - World Betting Rank Platform",
                    "is_active": True,
                    "meta_title": "WoBeRa - Παγκόσμια Ομοσπονδία Αθλητικού Betting",
                    "meta_description": "Η κορυφαία πλατφόρμα αθλητικών στοιχημάτων με παγκόσμια κατάταξη",
                    "created_at": datetime.utcnow(),
                    "last_updated": datetime.utcnow()
                },
                {
                    "id": "about_us",
                    "title": "About Us Page",
                    "page_type": "page",
                    "content": "WoBeRa is the premier luxury sports betting federation platform connecting betting enthusiasts worldwide.",
                    "is_active": True,
                    "meta_title": "About WoBeRa - World Betting Rank",
                    "meta_description": "Learn about WoBeRa, the luxury sports betting federation platform",
                    "created_at": datetime.utcnow(),
                    "last_updated": datetime.utcnow()
                },
                {
                    "id": "terms_of_service",
                    "title": "Terms of Service",
                    "page_type": "legal",
                    "content": "Terms and conditions for using the WoBeRa platform...",
                    "is_active": True,
                    "meta_title": "Terms of Service - WoBeRa",
                    "meta_description": "Terms and conditions for using WoBeRa platform",
                    "created_at": datetime.utcnow(),
                    "last_updated": datetime.utcnow()
                }
            ]
            
            # Insert default pages
            content_pages_collection.insert_many(default_pages)
            pages = default_pages
            
        return {"pages": pages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching content pages: {str(e)}")

@app.get("/api/content/page/{page_id}")
async def get_public_content_page(page_id: str):
    """Get public content page by ID"""
    try:
        page = content_pages_collection.find_one({"id": page_id, "is_active": True}, {"_id": 0})
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        return page
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching page: {str(e)}")

@app.put("/api/admin/content/page/{page_id}")
async def update_content_page(page_id: str, page_data: dict, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Update content page"""
    try:
        # Update the page
        update_data = {
            "title": page_data.get("title"),
            "content": page_data.get("content"),
            "meta_title": page_data.get("meta_title"),
            "meta_description": page_data.get("meta_description"),
            "is_active": page_data.get("is_active", True),
            "last_updated": datetime.utcnow()
        }
        
        result = content_pages_collection.update_one(
            {"id": page_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Page not found")
            
        # Log admin action
        admin_actions_collection.insert_one({
            "id": str(uuid.uuid4()),
            "admin_id": admin_id,
            "action_type": "update_content_page",
            "target_user_id": page_id,
            "details": {
                "page_id": page_id,
                "page_title": page_data.get("title", "Unknown")
            },
            "timestamp": datetime.utcnow()
        })
        
        return {"message": "Page updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating page: {str(e)}")

@app.get("/api/admin/menu/items")
async def get_menu_items(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get all menu items for management"""
    try:
        # Get menu items from database
        items = list(menu_items_collection.find({}, {"_id": 0}).sort("order", 1))
        
        # If no items exist, create default ones
        if not items:
            default_items = [
                {
                    "id": "home",
                    "label": "Home",
                    "url": "/",
                    "order": 1,
                    "is_active": True,
                    "icon": "🏠",
                    "created_at": datetime.utcnow()
                },
                {
                    "id": "rankings",
                    "label": "Rankings",
                    "url": "/rankings",
                    "order": 2,
                    "is_active": True,
                    "icon": "🏆",
                    "created_at": datetime.utcnow()
                },
                {
                    "id": "competitions",
                    "label": "Competitions",
                    "url": "/competitions",
                    "order": 3,
                    "is_active": True,
                    "icon": "🥇",
                    "created_at": datetime.utcnow()
                },
                {
                    "id": "world_map",
                    "label": "World Map",
                    "url": "/world-map",
                    "order": 4,
                    "is_active": True,
                    "icon": "🌍",
                    "created_at": datetime.utcnow()
                },
                {
                    "id": "about",
                    "label": "About",
                    "url": "/about",
                    "order": 5,
                    "is_active": True,
                    "icon": "ℹ️",
                    "created_at": datetime.utcnow()
                }
            ]
            
            # Insert default items
            menu_items_collection.insert_many(default_items)
            items = default_items
            
        return {"menu_items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching menu items: {str(e)}")

@app.get("/api/menu/items")
async def get_public_menu_items():
    """Get public menu items"""
    try:
        items = list(menu_items_collection.find({"is_active": True}, {"_id": 0}).sort("order", 1))
        return {"menu_items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching menu items: {str(e)}")

@app.put("/api/admin/menu/item/{item_id}")
async def update_menu_item(item_id: str, item_data: dict, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Update menu item"""
    try:
        update_data = {
            "label": item_data.get("label"),
            "url": item_data.get("url"),
            "order": item_data.get("order"),
            "is_active": item_data.get("is_active", True),
            "icon": item_data.get("icon")
        }
        
        result = menu_items_collection.update_one(
            {"id": item_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Menu item not found")
            
        return {"message": "Menu item updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating menu item: {str(e)}")

# =============================================================================
# BRACKET GENERATION UTILITIES
# =============================================================================

def generate_bracket(tournament_id: str, participants: List[dict]) -> dict:
    """Generate tournament bracket for single elimination"""
    import math
    import random
    
    # Ensure we have a power of 2 participants (pad with byes if needed)
    participant_count = len(participants)
    next_power_of_2 = 2 ** math.ceil(math.log2(max(participant_count, 2)))
    
    # Calculate total rounds needed
    total_rounds = int(math.log2(next_power_of_2))
    
    # Shuffle participants for fair pairing
    shuffled_participants = participants.copy()
    random.shuffle(shuffled_participants)
    
    # Pad with byes if needed
    while len(shuffled_participants) < next_power_of_2:
        shuffled_participants.append(None)  # Bye
    
    # Create bracket structure
    bracket_id = str(uuid.uuid4())
    
    # Generate round names
    round_names = []
    if total_rounds == 1:
        round_names = ["Finals"]
    elif total_rounds == 2:
        round_names = ["Semi-Finals", "Finals"] 
    elif total_rounds == 3:
        round_names = ["Quarter-Finals", "Semi-Finals", "Finals"]
    elif total_rounds == 4:
        round_names = ["Round 1", "Quarter-Finals", "Semi-Finals", "Finals"]
    else:
        round_names = [f"Round {i}" for i in range(1, total_rounds-1)] + ["Semi-Finals", "Finals"]
    
    # Create rounds
    rounds = []
    matches = []
    
    for round_num in range(1, total_rounds + 1):
        matches_in_round = next_power_of_2 // (2 ** round_num)
        round_name = round_names[round_num - 1] if round_num <= len(round_names) else f"Round {round_num}"
        
        round_data = {
            "round_number": round_num,
            "round_name": round_name,
            "total_matches": matches_in_round,
            "completed_matches": 0,
            "status": "pending"
        }
        rounds.append(round_data)
        
        # Create matches for this round
        for match_num in range(1, matches_in_round + 1):
            match_id = str(uuid.uuid4())
            
            match_data = {
                "id": match_id,
                "tournament_id": tournament_id,
                "round_number": round_num,
                "match_number": match_num,
                "player1_id": None,
                "player1_username": None,
                "player2_id": None,
                "player2_username": None,
                "winner_id": None,
                "winner_username": None,
                "status": "pending",
                "scheduled_at": None,
                "started_at": None,
                "completed_at": None,
                "next_match_id": None
            }
            
            # For first round, assign participants
            if round_num == 1:
                player1_idx = (match_num - 1) * 2
                player2_idx = player1_idx + 1
                
                if player1_idx < len(shuffled_participants) and shuffled_participants[player1_idx]:
                    participant1 = shuffled_participants[player1_idx]
                    match_data["player1_id"] = participant1["user_id"]
                    match_data["player1_username"] = participant1["username"]
                
                if player2_idx < len(shuffled_participants) and shuffled_participants[player2_idx]:
                    participant2 = shuffled_participants[player2_idx]
                    match_data["player2_id"] = participant2["user_id"]
                    match_data["player2_username"] = participant2["username"]
                
                # Handle byes (auto-advance if one player is missing)
                if match_data["player1_id"] and not match_data["player2_id"]:
                    match_data["winner_id"] = match_data["player1_id"]
                    match_data["winner_username"] = match_data["player1_username"]
                    match_data["status"] = "completed"
                    match_data["completed_at"] = datetime.utcnow()
                elif match_data["player2_id"] and not match_data["player1_id"]:
                    match_data["winner_id"] = match_data["player2_id"]
                    match_data["winner_username"] = match_data["player2_username"]
                    match_data["status"] = "completed"
                    match_data["completed_at"] = datetime.utcnow()
            
            matches.append(match_data)
    
    # Create bracket
    bracket_data = {
        "id": bracket_id,
        "tournament_id": tournament_id,
        "total_rounds": total_rounds,
        "current_round": 1,
        "rounds": rounds,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_generated": True
    }
    
    # Save bracket and matches to database
    tournament_brackets_collection.insert_one(bracket_data)
    if matches:
        tournament_matches_collection.insert_many(matches)
    
    return bracket_data

def advance_winner(match_id: str, winner_id: str) -> bool:
    """Advance winner to next round and update bracket"""
    try:
        # Get the match
        match = tournament_matches_collection.find_one({"id": match_id})
        if not match:
            return False
        
        # Get winner username
        winner_username = match["player1_username"] if winner_id == match["player1_id"] else match["player2_username"]
        
        # Update match with winner
        tournament_matches_collection.update_one(
            {"id": match_id},
            {
                "$set": {
                    "winner_id": winner_id,
                    "winner_username": winner_username,
                    "status": "completed",
                    "completed_at": datetime.utcnow()
                }
            }
        )
        
        # Find next round match to advance winner to
        tournament_id = match["tournament_id"]
        current_round = match["round_number"]
        next_round = current_round + 1
        
        # Find next match in the next round
        next_round_matches = list(tournament_matches_collection.find({
            "tournament_id": tournament_id,
            "round_number": next_round
        }).sort("match_number", 1))
        
        if next_round_matches:
            # Determine which match to advance to based on current match position
            current_match_num = match["match_number"]
            next_match_index = (current_match_num - 1) // 2
            
            if next_match_index < len(next_round_matches):
                next_match = next_round_matches[next_match_index]
                
                # Determine if winner goes to player1 or player2 slot
                if current_match_num % 2 == 1:  # Odd match number -> player1
                    tournament_matches_collection.update_one(
                        {"id": next_match["id"]},
                        {
                            "$set": {
                                "player1_id": winner_id,
                                "player1_username": winner_username
                            }
                        }
                    )
                else:  # Even match number -> player2
                    tournament_matches_collection.update_one(
                        {"id": next_match["id"]},
                        {
                            "$set": {
                                "player2_id": winner_id,
                                "player2_username": winner_username
                            }
                        }
                    )
        
        # Check if tournament is complete (finals completed)
        bracket = tournament_brackets_collection.find_one({"tournament_id": tournament_id})
        if bracket:
            final_round = bracket["total_rounds"]
            final_matches = list(tournament_matches_collection.find({
                "tournament_id": tournament_id,
                "round_number": final_round,
                "status": "completed"
            }))
            
            if len(final_matches) > 0:
                # Tournament is complete - update tournament with winner
                tournaments_collection.update_one(
                    {"id": tournament_id},
                    {
                        "$set": {
                            "status": "completed",
                            "winner_id": winner_id
                        }
                    }
                )
        
        return True
        
    except Exception as e:
        print(f"Error advancing winner: {e}")
        return False

# =============================================================================
# TOURNAMENT SYSTEM ENDPOINTS
# =============================================================================

@app.get("/api/tournaments")
async def get_tournaments(
    status: Optional[str] = None,
    category: Optional[str] = None,
    duration: Optional[str] = None,
    user_id: Optional[str] = Depends(lambda: None)
):
    """Get list of tournaments with optional filters"""
    try:
        query = {"is_active": True}
        
        if status:
            query["status"] = status
        if category:
            query["entry_fee_category"] = category
        if duration:
            query["duration_type"] = duration
            
        tournaments = list(tournaments_collection.find(query))
        
        # Convert ObjectId to string and add participant info
        for tournament in tournaments:
            tournament.pop("_id", None)
            
            # Get participant count
            participant_count = tournament_participants_collection.count_documents({
                "tournament_id": tournament["id"]
            })
            tournament["current_participants"] = participant_count
            
            # Calculate total prize pool
            tournament["total_prize_pool"] = participant_count * tournament["entry_fee"]
            
            # Check if current user is registered (if user_id provided)
            if user_id:
                user_registered = tournament_participants_collection.find_one({
                    "tournament_id": tournament["id"],
                    "user_id": user_id
                })
                tournament["user_registered"] = user_registered is not None
            else:
                tournament["user_registered"] = False
                
        return {"tournaments": tournaments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tournaments: {str(e)}")

@app.get("/api/tournaments/{tournament_id}")
async def get_tournament_details(tournament_id: str, user_id: Optional[str] = Depends(lambda: None)):
    """Get detailed tournament information"""
    try:
        tournament = tournaments_collection.find_one({"id": tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
            
        tournament.pop("_id", None)
        
        # Get participants
        participants = list(tournament_participants_collection.find({"tournament_id": tournament_id}))
        for participant in participants:
            participant.pop("_id", None)
            
        tournament["participants"] = participants
        tournament["current_participants"] = len(participants)
        tournament["total_prize_pool"] = len(participants) * tournament["entry_fee"]
        
        # Check if current user is registered
        if user_id:
            user_registered = tournament_participants_collection.find_one({
                "tournament_id": tournament_id,
                "user_id": user_id
            })
            tournament["user_registered"] = user_registered is not None
        else:
            tournament["user_registered"] = False
            
        return tournament
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tournament details: {str(e)}")

@app.post("/api/tournaments/{tournament_id}/join")
async def join_tournament(tournament_id: str, user_id: str = Depends(verify_token)):
    """Join a tournament"""
    try:
        # Check if tournament exists and is open
        tournament = tournaments_collection.find_one({"id": tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
            
        if tournament["status"] != "open":
            raise HTTPException(status_code=400, detail="Tournament is not open for registration")
            
        # Check if user is already registered
        existing_participant = tournament_participants_collection.find_one({
            "tournament_id": tournament_id,
            "user_id": user_id
        })
        if existing_participant:
            raise HTTPException(status_code=400, detail="User already registered for this tournament")
            
        # Check if tournament is full
        current_participants = tournament_participants_collection.count_documents({
            "tournament_id": tournament_id
        })
        if current_participants >= tournament["max_participants"]:
            raise HTTPException(status_code=400, detail="Tournament is full")
            
        # Get user data
        user_data = users_collection.find_one({"id": user_id})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Check wallet balance for tournaments with entry fee
        entry_fee = tournament.get("entry_fee", 0.0)
        if entry_fee > 0:
            wallet = get_or_create_wallet(user_id)
            available_balance = wallet.get("available_balance", 0.0)
            
            if available_balance < entry_fee:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient balance. You need €{entry_fee:.2f} but only have €{available_balance:.2f}. Please deposit funds or join a free tournament."
                )
        
        # Create participant record
        participant_id = str(uuid.uuid4())
        participant_data = {
            "id": participant_id,
            "tournament_id": tournament_id,
            "user_id": user_id,
            "username": user_data["username"],
            "full_name": user_data["full_name"],
            "country": user_data["country"],
            "avatar_url": user_data.get("avatar_url"),
            "registered_at": datetime.utcnow(),
            "payment_status": "completed" if entry_fee == 0 else "completed",  # Mark as completed after balance check
            "current_round": 1,
            "is_eliminated": False,
            "eliminated_at": None,
            "final_position": None,
            "prize_won": None
        }
        
        tournament_participants_collection.insert_one(participant_data)
        
        # Deduct entry fee from wallet if tournament has entry fee
        if entry_fee > 0:
            transaction_success = add_transaction(
                user_id=user_id,
                transaction_type="tournament_entry",
                amount=entry_fee,
                description=f"Tournament entry fee: {tournament['name']}",
                tournament_id=tournament_id,
                metadata={"tournament_name": tournament["name"], "entry_fee": entry_fee}
            )
            
            if not transaction_success:
                # Remove participant if transaction failed
                tournament_participants_collection.delete_one({"id": participant_id})
                raise HTTPException(status_code=500, detail="Failed to process tournament entry fee")
        
        # Update tournament participant count
        new_participant_count = current_participants + 1
        tournaments_collection.update_one(
            {"id": tournament_id},
            {"$set": {"current_participants": new_participant_count}}
        )
        
        # Process affiliate commission for tournament entry
        if tournament["entry_fee"] > 0:
            commission_processed = process_tournament_commission(
                user_id=user_id,
                tournament_id=tournament_id,
                entry_fee=tournament["entry_fee"]
            )
        
        return {
            "message": "Successfully joined tournament", 
            "participant_id": participant_id,
            "entry_fee_paid": entry_fee,
            "remaining_balance": wallet.get("available_balance", 0.0) - entry_fee if entry_fee > 0 else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error joining tournament: {str(e)}")

@app.delete("/api/tournaments/{tournament_id}/leave")
async def leave_tournament(tournament_id: str, user_id: str = Depends(verify_token)):
    """Leave a tournament (only if it hasn't started)"""
    try:
        # Check if tournament exists
        tournament = tournaments_collection.find_one({"id": tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
            
        # Check if tournament has started
        if tournament["status"] in ["ongoing", "completed"]:
            raise HTTPException(status_code=400, detail="Cannot leave tournament that has started")
            
        # Check if user is registered
        participant = tournament_participants_collection.find_one({
            "tournament_id": tournament_id,
            "user_id": user_id
        })
        if not participant:
            raise HTTPException(status_code=404, detail="User not registered for this tournament")
            
        # Remove participant
        tournament_participants_collection.delete_one({
            "tournament_id": tournament_id,
            "user_id": user_id
        })
        
        # Update tournament participant count
        new_participant_count = tournament_participants_collection.count_documents({
            "tournament_id": tournament_id
        })
        tournaments_collection.update_one(
            {"id": tournament_id},
            {"$set": {"current_participants": new_participant_count}}
        )
        
        return {"message": "Successfully left tournament"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leaving tournament: {str(e)}")

@app.get("/api/tournaments/user/{user_id}")
async def get_user_tournaments(user_id: str, requesting_user_id: str = Depends(verify_token)):
    """Get tournaments that a user has joined"""
    try:
        # Users can only see their own tournaments unless they're admin
        if user_id != requesting_user_id:
            # Check if requesting user is admin
            user_data = users_collection.find_one({"id": requesting_user_id})
            if not user_data or user_data.get("admin_role", "user") == "user":
                raise HTTPException(status_code=403, detail="Access denied")
        
        # Get user's tournament participations
        participants = list(tournament_participants_collection.find({"user_id": user_id}))
        
        tournaments = []
        for participant in participants:
            tournament = tournaments_collection.find_one({"id": participant["tournament_id"]})
            if tournament:
                tournament.pop("_id", None)
                participant.pop("_id", None)
                tournament["participation"] = participant
                tournaments.append(tournament)
                
        return {"tournaments": tournaments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user tournaments: {str(e)}")

# =============================================================================
# ADMIN TOURNAMENT ENDPOINTS
# =============================================================================

@app.post("/api/admin/tournaments")
async def create_tournament(tournament: TournamentCreate, user_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Create a new tournament (Admin only)"""
    try:
        # Determine entry fee category
        entry_fee_category = EntryFeeCategory.FREE
        if tournament.entry_fee == 0:
            entry_fee_category = EntryFeeCategory.FREE
        elif tournament.entry_fee <= 10:
            entry_fee_category = EntryFeeCategory.BASIC
        elif tournament.entry_fee <= 50:
            entry_fee_category = EntryFeeCategory.STANDARD
        elif tournament.entry_fee <= 100:
            entry_fee_category = EntryFeeCategory.PREMIUM
        else:
            entry_fee_category = EntryFeeCategory.VIP
            
        # Create tournament
        tournament_id = str(uuid.uuid4())
        tournament_data = {
            "id": tournament_id,
            "name": tournament.name,
            "description": tournament.description,
            "duration_type": tournament.duration_type.value,
            "tournament_format": tournament.tournament_format.value,
            "status": TournamentStatus.UPCOMING.value,
            "entry_fee": tournament.entry_fee,
            "entry_fee_category": entry_fee_category.value,
            "max_participants": tournament.max_participants,
            "current_participants": 0,
            "prize_distribution": tournament.prize_distribution.value,
            "total_prize_pool": 0.0,
            "created_at": datetime.utcnow(),
            "registration_start": tournament.registration_start,
            "registration_end": tournament.registration_end,
            "tournament_start": tournament.tournament_start,
            "tournament_end": tournament.tournament_end,
            "rules": tournament.rules,
            "region": tournament.region,
            "created_by": user_id,
            "is_active": True,
            "winner_id": None,
            "results": None
        }
        
        tournaments_collection.insert_one(tournament_data)
        
        # Log admin action
        log_admin_action(
            user_id=user_id,
            action_type="create_tournament",
            target_tournament_id=tournament_id,
            details={"tournament_name": tournament.name, "entry_fee": tournament.entry_fee}
        )
        
        return {"message": "Tournament created successfully", "tournament_id": tournament_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating tournament: {str(e)}")

@app.get("/api/admin/tournaments")
async def get_all_tournaments(user_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get all tournaments for admin management"""
    try:
        tournaments = list(tournaments_collection.find({}))
        
        for tournament in tournaments:
            tournament.pop("_id", None)
            
            # Get participant count
            participant_count = tournament_participants_collection.count_documents({
                "tournament_id": tournament["id"]
            })
            tournament["current_participants"] = participant_count
            tournament["total_prize_pool"] = participant_count * tournament["entry_fee"]
            
        return {"tournaments": tournaments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tournaments: {str(e)}")

@app.put("/api/admin/tournaments/{tournament_id}")
async def update_tournament(
    tournament_id: str, 
    tournament_update: dict, 
    user_id: str = Depends(verify_admin_token(AdminRole.ADMIN))
):
    """Update tournament details (Admin only)"""
    try:
        # Check if tournament exists
        tournament = tournaments_collection.find_one({"id": tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
            
        # Don't allow updating if tournament is ongoing or completed
        if tournament["status"] in ["ongoing", "completed"]:
            raise HTTPException(status_code=400, detail="Cannot update tournament that is ongoing or completed")
            
        # Update tournament
        tournaments_collection.update_one(
            {"id": tournament_id},
            {"$set": tournament_update}
        )
        
        # Log admin action
        log_admin_action(
            user_id=user_id,
            action_type="update_tournament",
            target_tournament_id=tournament_id,
            details=tournament_update
        )
        
        return {"message": "Tournament updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating tournament: {str(e)}")

@app.delete("/api/admin/tournaments/{tournament_id}")
async def delete_tournament(tournament_id: str, user_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Delete/cancel a tournament (Admin only)"""
    try:
        # Check if tournament exists
        tournament = tournaments_collection.find_one({"id": tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
            
        # Mark as cancelled instead of deleting
        tournaments_collection.update_one(
            {"id": tournament_id},
            {"$set": {"status": "cancelled", "is_active": False}}
        )
        
        # Log admin action
        log_admin_action(
            user_id=user_id,
            action_type="cancel_tournament",
            target_tournament_id=tournament_id,
            details={"tournament_name": tournament["name"]}
        )
        
        return {"message": "Tournament cancelled successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cancelling tournament: {str(e)}")

# =============================================================================
# TOURNAMENT BRACKET ENDPOINTS
# =============================================================================

@app.get("/api/tournaments/{tournament_id}/bracket")
async def get_tournament_bracket(tournament_id: str):
    """Get tournament bracket and matches"""
    try:
        # Get tournament
        tournament = tournaments_collection.find_one({"id": tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Get bracket
        bracket = tournament_brackets_collection.find_one({"tournament_id": tournament_id})
        if bracket:
            bracket.pop("_id", None)
        
        # Get matches
        matches = list(tournament_matches_collection.find({"tournament_id": tournament_id}))
        for match in matches:
            match.pop("_id", None)
        
        return {
            "tournament": {
                "id": tournament["id"],
                "name": tournament["name"],
                "status": tournament["status"],
                "current_participants": tournament.get("current_participants", 0),
                "max_participants": tournament["max_participants"]
            },
            "bracket": bracket,
            "matches": matches
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tournament bracket: {str(e)}")

@app.post("/api/tournaments/{tournament_id}/generate-bracket")
async def generate_tournament_bracket(tournament_id: str, user_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Generate bracket for tournament (Admin only)"""
    try:
        # Get tournament
        tournament = tournaments_collection.find_one({"id": tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Check if bracket already exists
        existing_bracket = tournament_brackets_collection.find_one({"tournament_id": tournament_id})
        if existing_bracket:
            raise HTTPException(status_code=400, detail="Bracket already generated for this tournament")
        
        # Get participants
        participants = list(tournament_participants_collection.find({"tournament_id": tournament_id}))
        if len(participants) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 participants to generate bracket")
        
        # Generate bracket
        bracket_data = generate_bracket(tournament_id, participants)
        
        # Update tournament status to ongoing
        tournaments_collection.update_one(
            {"id": tournament_id},
            {"$set": {"status": "ongoing"}}
        )
        
        # Log admin action
        log_admin_action(
            user_id=user_id,
            action_type="generate_bracket",
            target_tournament_id=tournament_id,
            details={"participants_count": len(participants), "total_rounds": bracket_data["total_rounds"]}
        )
        
        return {"message": "Bracket generated successfully", "bracket_id": bracket_data["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating bracket: {str(e)}")

@app.post("/api/tournaments/matches/{match_id}/winner")
async def set_match_winner(match_id: str, winner_data: dict, user_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Set winner for a match (Admin only)"""
    try:
        winner_id = winner_data.get("winner_id")
        if not winner_id:
            raise HTTPException(status_code=400, detail="Winner ID required")
        
        # Get match
        match = tournament_matches_collection.find_one({"id": match_id})
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Validate winner is one of the players
        if winner_id not in [match.get("player1_id"), match.get("player2_id")]:
            raise HTTPException(status_code=400, detail="Winner must be one of the match players")
        
        # Advance winner
        success = advance_winner(match_id, winner_id)
        if not success:
            raise HTTPException(status_code=500, detail="Error advancing winner")
        
        # Log admin action
        log_admin_action(
            user_id=user_id,
            action_type="set_match_winner",
            target_tournament_id=match["tournament_id"],
            details={"match_id": match_id, "winner_id": winner_id}
        )
        
        return {"message": "Match winner set successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error setting match winner: {str(e)}")

@app.get("/api/tournaments/{tournament_id}/matches")
async def get_tournament_matches(tournament_id: str):
    """Get all matches for a tournament"""
    try:
        matches = list(tournament_matches_collection.find({"tournament_id": tournament_id}))
        for match in matches:
            match.pop("_id", None)
        
        # Group matches by round
        matches_by_round = {}
        for match in matches:
            round_num = match["round_number"]
            if round_num not in matches_by_round:
                matches_by_round[round_num] = []
            matches_by_round[round_num].append(match)
        
        return {"matches_by_round": matches_by_round, "total_matches": len(matches)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tournament matches: {str(e)}")

# Helper function for admin actions
def log_admin_action(user_id: str, action_type: str, target_tournament_id: str = None, target_user_id: str = None, details: dict = None):
    """Log admin action for tournaments"""
    try:
        action_data = {
            "id": str(uuid.uuid4()),
            "admin_id": user_id,
            "action_type": action_type,
            "target_tournament_id": target_tournament_id,
            "target_user_id": target_user_id,
            "details": details or {},
            "timestamp": datetime.utcnow()
        }
        admin_actions_collection.insert_one(action_data)
    except Exception as e:
        print(f"Error logging admin action: {e}")

# =============================================================================
# AFFILIATE SYSTEM API ENDPOINTS
# =============================================================================

@app.post("/api/affiliate/apply")
async def apply_for_affiliate(request: AffiliateApplicationRequest, user_id: str = Depends(verify_token)):
    """Apply to become an affiliate"""
    try:
        # Check if user exists
        user = users_collection.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user already has an affiliate account
        existing_affiliate = affiliates_collection.find_one({"user_id": user_id})
        if existing_affiliate:
            raise HTTPException(status_code=400, detail="User already has an affiliate account")
        
        # Generate referral code
        desired_code = request.desired_referral_code
        if desired_code and affiliates_collection.find_one({"referral_code": desired_code}):
            raise HTTPException(status_code=400, detail="Desired referral code already taken")
        
        referral_code = desired_code if desired_code else generate_referral_code(user["username"], user_id)
        referral_link = generate_referral_link(referral_code)
        
        # Create affiliate record
        affiliate_id = str(uuid.uuid4())
        affiliate_data = {
            "id": affiliate_id,
            "user_id": user_id,
            "referral_code": referral_code,
            "referral_link": referral_link,
            "status": "active",  # Auto-approve for now, can be changed to "pending"
            "approved_at": datetime.utcnow(),
            "approved_by": "system",
            "total_referrals": 0,
            "active_referrals": 0,
            "total_earnings": 0.0,
            "pending_earnings": 0.0,
            "paid_earnings": 0.0,
            "commission_rate_registration": 5.0,
            "commission_rate_tournament": 0.1,
            "commission_rate_deposit": 0.05,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        affiliates_collection.insert_one(affiliate_data)
        
        return {
            "message": "Affiliate application approved!",
            "affiliate_id": affiliate_id,
            "referral_code": referral_code,
            "referral_link": referral_link
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing affiliate application: {str(e)}")

@app.get("/api/affiliate/stats")
async def get_affiliate_stats(user_id: str = Depends(verify_token)):
    """Get affiliate statistics for current user"""
    try:
        # Check if user is an affiliate
        affiliate = affiliates_collection.find_one({"user_id": user_id})
        if not affiliate:
            raise HTTPException(status_code=404, detail="User is not an affiliate")
        
        stats = calculate_affiliate_stats(user_id)
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching affiliate stats: {str(e)}")

@app.get("/api/affiliate/profile")
async def get_affiliate_profile(user_id: str = Depends(verify_token)):
    """Get affiliate profile information"""
    try:
        affiliate = affiliates_collection.find_one({"user_id": user_id}, {"_id": 0})
        if not affiliate:
            raise HTTPException(status_code=404, detail="User is not an affiliate")
        
        return affiliate
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching affiliate profile: {str(e)}")

@app.get("/api/affiliate/commissions")
async def get_affiliate_commissions(user_id: str = Depends(verify_token), limit: int = 50, skip: int = 0):
    """Get affiliate commission history"""
    try:
        # Check if user is an affiliate
        affiliate = affiliates_collection.find_one({"user_id": user_id})
        if not affiliate:
            raise HTTPException(status_code=404, detail="User is not an affiliate")
        
        # Get commissions
        commissions = list(commissions_collection.find(
            {"affiliate_user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit))
        
        total_commissions = commissions_collection.count_documents({"affiliate_user_id": user_id})
        
        return {
            "commissions": commissions,
            "total": total_commissions,
            "page": skip // limit + 1,
            "pages": (total_commissions + limit - 1) // limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching commissions: {str(e)}")

@app.get("/api/affiliate/referrals")
async def get_affiliate_referrals(user_id: str = Depends(verify_token), limit: int = 50, skip: int = 0):
    """Get affiliate referral history"""
    try:
        # Check if user is an affiliate
        affiliate = affiliates_collection.find_one({"user_id": user_id})
        if not affiliate:
            raise HTTPException(status_code=404, detail="User is not an affiliate")
        
        # Get referrals with user details
        referrals = list(referrals_collection.find(
            {"affiliate_user_id": user_id},
            {"_id": 0}
        ).sort("registered_at", -1).skip(skip).limit(limit))
        
        # Enrich with user details
        for referral in referrals:
            user = users_collection.find_one(
                {"id": referral["referred_user_id"]},
                {"username": 1, "full_name": 1, "country": 1, "avatar_url": 1, "_id": 0}
            )
            if user:
                referral["user_details"] = user
        
        total_referrals = referrals_collection.count_documents({"affiliate_user_id": user_id})
        
        return {
            "referrals": referrals,
            "total": total_referrals,
            "page": skip // limit + 1,
            "pages": (total_referrals + limit - 1) // limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching referrals: {str(e)}")

@app.post("/api/affiliate/payout/request")
async def request_payout(request: AffiliatePayoutRequest, user_id: str = Depends(verify_token)):
    """Request a payout of affiliate earnings"""
    try:
        # Check if user is an affiliate
        affiliate = affiliates_collection.find_one({"user_id": user_id})
        if not affiliate:
            raise HTTPException(status_code=404, detail="User is not an affiliate")
        
        # Check minimum payout amount (€50)
        if request.amount < 50.0:
            raise HTTPException(status_code=400, detail="Minimum payout amount is €50")
        
        # Check if user has enough pending earnings
        if affiliate.get("pending_earnings", 0.0) < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient pending earnings")
        
        # Get unpaid commissions up to the requested amount
        unpaid_commissions = list(commissions_collection.find(
            {"affiliate_user_id": user_id, "is_paid": False}
        ).sort("created_at", 1))
        
        commission_total = 0.0
        commission_ids = []
        
        for commission in unpaid_commissions:
            if commission_total + commission["amount"] <= request.amount:
                commission_total += commission["amount"]
                commission_ids.append(commission["id"])
            else:
                break
        
        if commission_total < request.amount:
            raise HTTPException(status_code=400, detail=f"Only €{commission_total:.2f} available for payout")
        
        # Create payout record
        payout_id = str(uuid.uuid4())
        payout_data = {
            "id": payout_id,
            "affiliate_user_id": user_id,
            "amount": commission_total,
            "currency": "EUR",
            "status": "pending",
            "payment_method": request.payment_method,
            "payment_details": request.payment_details,
            "commission_ids": commission_ids,
            "notes": request.notes,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        payouts_collection.insert_one(payout_data)
        
        # Mark commissions as part of this payout (but not paid yet)
        commissions_collection.update_many(
            {"id": {"$in": commission_ids}},
            {"$set": {"payout_id": payout_id}}
        )
        
        return {
            "message": "Payout request submitted successfully",
            "payout_id": payout_id,
            "amount": commission_total,
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error requesting payout: {str(e)}")

# =============================================================================
# ADMIN AFFILIATE MANAGEMENT ENDPOINTS
# =============================================================================

@app.get("/api/admin/affiliates")
async def get_all_affiliates(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN)), limit: int = 50, skip: int = 0):
    """Get all affiliates for admin management"""
    try:
        # Get affiliates with user details
        affiliates = list(affiliates_collection.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit))
        
        # Enrich with user details
        for affiliate in affiliates:
            user = users_collection.find_one(
                {"id": affiliate["user_id"]},
                {"username": 1, "full_name": 1, "email": 1, "country": 1, "_id": 0}
            )
            if user:
                affiliate["user_details"] = user
        
        total_affiliates = affiliates_collection.count_documents({})
        
        return {
            "affiliates": affiliates,
            "total": total_affiliates,
            "page": skip // limit + 1,
            "pages": (total_affiliates + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching affiliates: {str(e)}")

@app.get("/api/admin/payouts")
async def get_all_payouts(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN)), status: Optional[str] = None):
    """Get all payout requests for admin processing"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        payouts = list(payouts_collection.find(query, {"_id": 0}).sort("created_at", -1))
        
        # Enrich with user details
        for payout in payouts:
            user = users_collection.find_one(
                {"id": payout["affiliate_user_id"]},
                {"username": 1, "full_name": 1, "email": 1, "_id": 0}
            )
            if user:
                payout["user_details"] = user
        
        return {"payouts": payouts}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payouts: {str(e)}")

@app.post("/api/admin/payouts/{payout_id}/process")
async def process_payout(payout_id: str, process_data: dict, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Process a payout request"""
    try:
        status = process_data.get("status")  # "completed" or "failed"
        transaction_reference = process_data.get("transaction_reference")
        notes = process_data.get("notes", "")
        
        if status not in ["completed", "failed"]:
            raise HTTPException(status_code=400, detail="Status must be 'completed' or 'failed'")
        
        # Get payout
        payout = payouts_collection.find_one({"id": payout_id})
        if not payout:
            raise HTTPException(status_code=404, detail="Payout not found")
        
        if payout["status"] != "pending":
            raise HTTPException(status_code=400, detail="Payout is not pending")
        
        # Update payout
        update_data = {
            "status": status,
            "processed_by": admin_id,
            "processed_at": datetime.utcnow(),
            "transaction_reference": transaction_reference,
            "notes": notes,
            "updated_at": datetime.utcnow()
        }
        
        payouts_collection.update_one({"id": payout_id}, {"$set": update_data})
        
        if status == "completed":
            # Mark commissions as paid
            commission_ids = payout["commission_ids"]
            commissions_collection.update_many(
                {"id": {"$in": commission_ids}},
                {"$set": {"is_paid": True, "paid_at": datetime.utcnow()}}
            )
            
            # Update affiliate earnings
            payout_amount = payout["amount"]
            affiliates_collection.update_one(
                {"user_id": payout["affiliate_user_id"]},
                {
                    "$inc": {
                        "pending_earnings": -payout_amount,
                        "paid_earnings": payout_amount
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
        
        return {"message": f"Payout {status} successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing payout: {str(e)}")

@app.get("/api/register/check-referral/{referral_code}")
async def check_referral_code(referral_code: str):
    """Check if referral code is valid (public endpoint for registration)"""
    try:
        affiliate = affiliates_collection.find_one({"referral_code": referral_code, "status": "active"})
        if not affiliate:
            return {"valid": False, "message": "Invalid or inactive referral code"}
        
        # Get affiliate user details
        user = users_collection.find_one({"id": affiliate["user_id"]}, {"username": 1, "full_name": 1, "_id": 0})
        
        return {
            "valid": True,
            "affiliate_name": user.get("full_name", user.get("username", "Unknown")) if user else "Unknown",
            "commission_info": {
                "registration_bonus": f"€{affiliate.get('commission_rate_registration', 5.0)}",
                "tournament_commission": f"{affiliate.get('commission_rate_tournament', 0.1) * 100}%"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking referral code: {str(e)}")

# =============================================================================
# WALLET SYSTEM API ENDPOINTS
# =============================================================================

@app.get("/api/wallet/balance")
async def get_wallet_balance(user_id: str = Depends(verify_token)):
    """Get user's wallet balance"""
    try:
        wallet = get_or_create_wallet(user_id)
        return wallet
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching wallet balance: {str(e)}")

@app.get("/api/wallet/stats")
async def get_wallet_stats(user_id: str = Depends(verify_token)):
    """Get comprehensive wallet statistics"""
    try:
        stats = calculate_wallet_stats(user_id)
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching wallet stats: {str(e)}")

@app.get("/api/wallet/transactions")
async def get_wallet_transactions(user_id: str = Depends(verify_token), limit: int = 50, skip: int = 0):
    """Get user's transaction history"""
    try:
        transactions = list(transactions_collection.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit))
        
        total_transactions = transactions_collection.count_documents({"user_id": user_id})
        
        return {
            "transactions": transactions,
            "total": total_transactions,
            "page": skip // limit + 1,
            "pages": (total_transactions + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")

@app.post("/api/wallet/settings")
async def update_wallet_settings(settings: dict, user_id: str = Depends(verify_token)):
    """Update wallet settings"""
    try:
        wallet = get_or_create_wallet(user_id)
        
        # Validate settings
        allowed_settings = [
            "auto_payout_enabled", "auto_payout_threshold", "preferred_payout_method"
        ]
        
        update_data = {"updated_at": datetime.utcnow()}
        for key, value in settings.items():
            if key in allowed_settings:
                update_data[key] = value
        
        wallet_balances_collection.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
        
        return {"message": "Wallet settings updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating wallet settings: {str(e)}")

# =============================================================================
# ADMIN FINANCIAL MANAGEMENT ENDPOINTS
# =============================================================================

@app.get("/api/admin/financial/overview")
async def get_admin_financial_overview(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get comprehensive financial overview for admins"""
    try:
        overview = calculate_admin_financial_overview()
        return overview
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching financial overview: {str(e)}")

@app.get("/api/admin/financial/wallets")
async def get_all_wallets(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN)), limit: int = 50, skip: int = 0):
    """Get all user wallets for admin management"""
    try:
        wallets = list(wallet_balances_collection.find({}, {"_id": 0}).sort("total_earned", -1).skip(skip).limit(limit))
        
        # Enrich with user details
        for wallet in wallets:
            user = users_collection.find_one(
                {"id": wallet["user_id"]},
                {"username": 1, "full_name": 1, "email": 1, "_id": 0}
            )
            if user:
                wallet["user_details"] = user
        
        total_wallets = wallet_balances_collection.count_documents({})
        
        return {
            "wallets": wallets,
            "total": total_wallets,
            "page": skip // limit + 1,
            "pages": (total_wallets + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching wallets: {str(e)}")

@app.get("/api/admin/financial/transactions")
async def get_all_transactions(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN)), 
                              transaction_type: Optional[str] = None, limit: int = 100, skip: int = 0):
    """Get all transactions for admin overview"""
    try:
        query = {}
        if transaction_type:
            query["transaction_type"] = transaction_type
        
        transactions = list(transactions_collection.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit))
        
        # Enrich with user details
        for transaction in transactions:
            user = users_collection.find_one(
                {"id": transaction["user_id"]},
                {"username": 1, "full_name": 1, "_id": 0}
            )
            if user:
                transaction["user_details"] = user
        
        total_transactions = transactions_collection.count_documents(query)
        
        return {
            "transactions": transactions,
            "total": total_transactions,
            "page": skip // limit + 1,
            "pages": (total_transactions + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")

@app.post("/api/admin/financial/manual-adjustment")
async def create_manual_adjustment(request: ManualAdjustmentRequest, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Create a manual wallet adjustment"""
    try:
        # Try to find user by ID first, then by username
        user = users_collection.find_one({"id": request.user_id})
        if not user:
            # Try to find by username
            user = users_collection.find_one({"username": request.user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail=f"User not found with ID or username: {request.user_id}")
        
        # Use the actual user ID from the found user
        actual_user_id = user["id"]
        
        # Add transaction
        transaction_type = "manual_adjustment"
        description = f"Manual adjustment: {request.reason}"
        
        success = add_transaction(
            user_id=actual_user_id,
            transaction_type=transaction_type,
            amount=request.amount,
            description=description,
            processed_by=admin_id,
            admin_notes=request.admin_notes,
            metadata={"reason": request.reason, "admin_id": admin_id}
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to process manual adjustment")
        
        # Log admin action
        log_admin_action(
            user_id=admin_id,
            action_type="manual_wallet_adjustment",
            target_user_id=actual_user_id,
            details={"amount": request.amount, "reason": request.reason, "target_user": user["username"]}
        )
        
        return {
            "message": "Manual adjustment processed successfully",
            "amount": request.amount,
            "user_id": actual_user_id,
            "username": user["username"],
            "full_name": user["full_name"],
            "reason": request.reason
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing manual adjustment: {str(e)}")

# =============================================================================
# TEAM SYSTEM API ENDPOINTS
# =============================================================================

@app.post("/api/teams")
async def create_team(team_data: TeamCreate, user_id: str = Depends(verify_token)):
    """Create a new team with the current user as captain"""
    try:
        # Check if team name is unique
        existing_team = teams_collection.find_one({"name": team_data.name})
        if existing_team:
            raise HTTPException(status_code=400, detail="Team name already exists")
        
        # Check if user is already a captain or member of another team
        user = users_collection.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        existing_membership = team_members_collection.find_one({"user_id": user_id, "status": "active"})
        if existing_membership:
            raise HTTPException(status_code=400, detail="You are already a member of another team")
        
        # Create team
        team_id = str(uuid.uuid4())
        team = {
            "id": team_id,
            "name": team_data.name,
            "logo_url": team_data.logo_url,
            "colors": team_data.colors.dict(),
            "city": team_data.city,
            "country": team_data.country,
            "phone": team_data.phone,
            "email": team_data.email,
            "captain_id": user_id,
            "status": TeamStatus.AMATEUR,
            "player_count": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        teams_collection.insert_one(team)
        
        # Add captain as first team member
        team_member = {
            "id": str(uuid.uuid4()),
            "team_id": team_id,
            "user_id": user_id,
            "joined_at": datetime.utcnow(),
            "status": "active"
        }
        team_members_collection.insert_one(team_member)
        
        # Update user's current team
        users_collection.update_one(
            {"id": user_id},
            {"$set": {"current_team_id": team_id}}
        )
        
        return {
            "message": "Team created successfully",
            "team_id": team_id,
            "team_name": team_data.name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating team: {str(e)}")

@app.get("/api/teams")
async def get_all_teams():
    """Get all teams with basic information"""
    try:
        teams = list(teams_collection.find({}))
        
        # Add member count and captain info for each team
        for team in teams:
            if "_id" in team:
                team["_id"] = str(team["_id"])
            
            # Get captain info
            captain = users_collection.find_one({"id": team["captain_id"]})
            if captain:
                team["captain_name"] = captain["full_name"]
                team["captain_username"] = captain["username"]
            
            # Get current member count
            member_count = team_members_collection.count_documents({
                "team_id": team["id"], 
                "status": "active"
            })
            team["current_player_count"] = member_count
        
        return {"teams": teams}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teams: {str(e)}")

@app.get("/api/teams/{team_id}")
async def get_team_details(team_id: str):
    """Get detailed information about a specific team"""
    try:
        # Get team
        team = teams_collection.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        if "_id" in team:
            team["_id"] = str(team["_id"])
        
        # Get captain info
        captain = users_collection.find_one({"id": team["captain_id"]})
        if captain:
            team["captain"] = {
                "id": captain["id"],
                "username": captain["username"],
                "full_name": captain["full_name"],
                "avatar_url": captain.get("avatar_url")
            }
        
        # Get team members
        members_data = list(team_members_collection.find({
            "team_id": team_id,
            "status": "active"
        }))
        
        members = []
        for member_data in members_data:
            user = users_collection.find_one({"id": member_data["user_id"]})
            if user:
                members.append({
                    "id": user["id"],
                    "username": user["username"],
                    "full_name": user["full_name"],
                    "avatar_url": user.get("avatar_url"),
                    "joined_at": member_data["joined_at"],
                    "is_captain": user["id"] == team["captain_id"]
                })
        
        team["members"] = members
        team["current_player_count"] = len(members)
        
        # Get pending invitations (only for captain)
        pending_invitations = list(team_invitations_collection.find({
            "team_id": team_id,
            "status": InvitationStatus.PENDING
        }))
        team["pending_invitations_count"] = len(pending_invitations)
        
        return team
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching team details: {str(e)}")

@app.post("/api/teams/{team_id}/invite")
async def invite_player(team_id: str, invite_data: TeamInvite, user_id: str = Depends(verify_token)):
    """Invite a player to join the team (Captain only)"""
    try:
        # Verify team exists and user is the captain
        team = teams_collection.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        if team["captain_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only team captain can send invitations")
        
        # Check if team has space (max 20 players)
        current_members = team_members_collection.count_documents({
            "team_id": team_id,
            "status": "active"
        })
        if current_members >= 20:
            raise HTTPException(status_code=400, detail="Team is full (maximum 20 players)")
        
        # Check pending invitations limit (max 20)
        pending_invitations = team_invitations_collection.count_documents({
            "team_id": team_id,
            "status": InvitationStatus.PENDING
        })
        if pending_invitations >= 20:
            raise HTTPException(status_code=400, detail="Maximum pending invitations reached (20)")
        
        # Find the user to invite
        invited_user = users_collection.find_one({"username": invite_data.username})
        if not invited_user:
            raise HTTPException(status_code=404, detail=f"User '{invite_data.username}' not found")
        
        # Check if user is already in a team
        existing_membership = team_members_collection.find_one({
            "user_id": invited_user["id"],
            "status": "active"
        })
        if existing_membership:
            raise HTTPException(status_code=400, detail="User is already a member of another team")
        
        # Check if invitation already exists
        existing_invitation = team_invitations_collection.find_one({
            "team_id": team_id,
            "invited_user_id": invited_user["id"],
            "status": InvitationStatus.PENDING
        })
        if existing_invitation:
            raise HTTPException(status_code=400, detail="Invitation already sent to this user")
        
        # Create invitation
        invitation = {
            "id": str(uuid.uuid4()),
            "team_id": team_id,
            "team_name": team["name"],
            "invited_by": user_id,
            "invited_user_id": invited_user["id"],
            "invited_username": invite_data.username,
            "status": InvitationStatus.PENDING,
            "sent_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7)  # 7 days to respond
        }
        team_invitations_collection.insert_one(invitation)
        
        return {
            "message": f"Invitation sent to {invite_data.username}",
            "invitation_id": invitation["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending invitation: {str(e)}")

@app.get("/api/teams/my-invitations")
async def get_my_invitations(user_id: str = Depends(verify_token)):
    """Get all pending invitations for the current user"""
    try:
        invitations = list(team_invitations_collection.find({
            "invited_user_id": user_id,
            "status": InvitationStatus.PENDING,
            "expires_at": {"$gt": datetime.utcnow()}  # Not expired
        }))
        
        # Add team and captain details
        for invitation in invitations:
            if "_id" in invitation:
                invitation["_id"] = str(invitation["_id"])
            
            # Get team details
            team = teams_collection.find_one({"id": invitation["team_id"]})
            if team:
                invitation["team_details"] = {
                    "name": team["name"],
                    "city": team["city"],
                    "country": team["country"],
                    "colors": team["colors"],
                    "player_count": team.get("player_count", 0)
                }
                
                # Get captain details
                captain = users_collection.find_one({"id": team["captain_id"]})
                if captain:
                    invitation["captain"] = {
                        "username": captain["username"],
                        "full_name": captain["full_name"]
                    }
        
        return {"invitations": invitations}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching invitations: {str(e)}")

@app.post("/api/teams/invitations/{invitation_id}/accept")
async def accept_invitation(invitation_id: str, user_id: str = Depends(verify_token)):
    """Accept a team invitation"""
    try:
        # Find invitation
        invitation = team_invitations_collection.find_one({
            "id": invitation_id,
            "invited_user_id": user_id,
            "status": InvitationStatus.PENDING
        })
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found or already processed")
        
        # Check if invitation is expired
        if invitation["expires_at"] < datetime.utcnow():
            # Mark as expired
            team_invitations_collection.update_one(
                {"id": invitation_id},
                {"$set": {"status": InvitationStatus.EXPIRED}}
            )
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        # Check if user is already in a team
        existing_membership = team_members_collection.find_one({
            "user_id": user_id,
            "status": "active"
        })
        if existing_membership:
            raise HTTPException(status_code=400, detail="You are already a member of another team")
        
        # Check if team has space
        team = teams_collection.find_one({"id": invitation["team_id"]})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        current_members = team_members_collection.count_documents({
            "team_id": invitation["team_id"],
            "status": "active"
        })
        if current_members >= 20:
            raise HTTPException(status_code=400, detail="Team is full")
        
        # Accept invitation
        team_invitations_collection.update_one(
            {"id": invitation_id},
            {"$set": {"status": InvitationStatus.ACCEPTED}}
        )
        
        # Add user to team
        team_member = {
            "id": str(uuid.uuid4()),
            "team_id": invitation["team_id"],
            "user_id": user_id,
            "joined_at": datetime.utcnow(),
            "status": "active"
        }
        team_members_collection.insert_one(team_member)
        
        # Update team player count
        new_count = current_members + 1
        teams_collection.update_one(
            {"id": invitation["team_id"]},
            {"$set": {"player_count": new_count, "updated_at": datetime.utcnow()}}
        )
        
        # Update user's current team
        users_collection.update_one(
            {"id": user_id},
            {"$set": {"current_team_id": invitation["team_id"]}}
        )
        
        return {
            "message": f"Successfully joined {team['name']}",
            "team_id": invitation["team_id"],
            "team_name": team["name"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accepting invitation: {str(e)}")

@app.post("/api/teams/invitations/{invitation_id}/decline")
async def decline_invitation(invitation_id: str, user_id: str = Depends(verify_token)):
    """Decline a team invitation"""
    try:
        # Find and update invitation
        result = team_invitations_collection.update_one(
            {
                "id": invitation_id,
                "invited_user_id": user_id,
                "status": InvitationStatus.PENDING
            },
            {"$set": {"status": InvitationStatus.DECLINED}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Invitation not found or already processed")
        
        return {"message": "Invitation declined"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error declining invitation: {str(e)}")

@app.put("/api/teams/{team_id}")
async def update_team(team_id: str, team_data: TeamUpdate, user_id: str = Depends(verify_token)):
    """Update team information (Captain only)"""
    try:
        # Verify team exists and user is the captain
        team = teams_collection.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        if team["captain_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only team captain can update team information")
        
        # Prepare update data
        update_data = {}
        if team_data.name is not None:
            # Check if new name is unique (if different from current)
            if team_data.name != team["name"]:
                existing_team = teams_collection.find_one({"name": team_data.name})
                if existing_team:
                    raise HTTPException(status_code=400, detail="Team name already exists")
            update_data["name"] = team_data.name
        
        if team_data.logo_url is not None:
            update_data["logo_url"] = team_data.logo_url
        
        if team_data.colors is not None:
            update_data["colors"] = team_data.colors.dict()
        
        if team_data.city is not None:
            update_data["city"] = team_data.city
        
        if team_data.country is not None:
            update_data["country"] = team_data.country
        
        if team_data.phone is not None:
            update_data["phone"] = team_data.phone
        
        if team_data.email is not None:
            update_data["email"] = team_data.email
        
        # Update team
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            teams_collection.update_one(
                {"id": team_id},
                {"$set": update_data}
            )
        
        return {
            "message": "Team updated successfully",
            "team_id": team_id,
            "updated_fields": list(update_data.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating team: {str(e)}")

@app.post("/api/teams/{team_id}/upload-logo")
async def upload_team_logo(team_id: str, logo_data: dict, user_id: str = Depends(verify_token)):
    """Upload team logo (Captain only)"""
    try:
        # Verify team exists and user is the captain
        team = teams_collection.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        if team["captain_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only team captain can upload team logo")
        
        # Validate base64 image data
        if "logo_base64" not in logo_data:
            raise HTTPException(status_code=400, detail="Logo data is required")
        
        logo_base64 = logo_data["logo_base64"]
        
        # Basic validation for base64 image
        if not logo_base64.startswith("data:image/"):
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Update team logo
        teams_collection.update_one(
            {"id": team_id},
            {"$set": {
                "logo_url": logo_base64,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {
            "message": "Team logo uploaded successfully",
            "team_id": team_id,
            "logo_url": logo_base64
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading team logo: {str(e)}")

# =============================================================================
# ADMIN TEAM MANAGEMENT API ENDPOINTS
# =============================================================================

@app.get("/api/admin/teams")
async def get_all_teams_admin(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get all teams for admin management with detailed information"""
    try:
        teams = list(teams_collection.find({}))
        
        # Add detailed information for each team
        for team in teams:
            if "_id" in team:
                team["_id"] = str(team["_id"])
            
            # Get captain info
            captain = users_collection.find_one({"id": team["captain_id"]})
            if captain:
                team["captain_name"] = captain["full_name"]
                team["captain_username"] = captain["username"]
                team["captain_email"] = captain["email"]
            
            # Get member count and details
            members = list(team_members_collection.find({
                "team_id": team["id"], 
                "status": "active"
            }))
            team["current_player_count"] = len(members)
            
            # Get member details
            team_member_details = []
            for member in members:
                user = users_collection.find_one({"id": member["user_id"]})
                if user:
                    team_member_details.append({
                        "id": user["id"],
                        "username": user["username"],
                        "full_name": user["full_name"],
                        "email": user["email"],
                        "country": user["country"],
                        "joined_at": member["joined_at"]
                    })
            team["members"] = team_member_details
            
            # Get pending invitations count
            pending_invitations = list(team_invitations_collection.find({
                "team_id": team["id"],
                "status": InvitationStatus.PENDING,
                "expires_at": {"$gt": datetime.utcnow()}
            }))
            team["pending_invitations_count"] = len(pending_invitations)
            
            # Add verification status
            team["verification_status"] = team.get("verification_status", "unverified")
            team["created_at"] = team.get("created_at", datetime.utcnow())
        
        return {"teams": teams}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching admin teams: {str(e)}")

@app.put("/api/admin/teams/{team_id}/verification")
async def update_team_verification(team_id: str, verification_data: dict, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Update team verification status (Admin only)"""
    try:
        # Verify team exists
        team = teams_collection.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        verification_status = verification_data.get("verification_status")
        admin_notes = verification_data.get("admin_notes", "")
        
        if verification_status not in ["verified", "unverified", "pending", "rejected"]:
            raise HTTPException(status_code=400, detail="Invalid verification status")
        
        # Update team verification
        teams_collection.update_one(
            {"id": team_id},
            {"$set": {
                "verification_status": verification_status,
                "admin_notes": admin_notes,
                "verified_at": datetime.utcnow() if verification_status == "verified" else None,
                "verified_by": admin_id if verification_status == "verified" else None,
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Log admin action
        log_admin_action(
            admin_id, 
            f"Updated team verification status",
            f"Team: {team['name']} -> Status: {verification_status}",
            target_user_id=team["captain_id"]
        )
        
        return {
            "message": f"Team verification status updated to {verification_status}",
            "team_id": team_id,
            "verification_status": verification_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating team verification: {str(e)}")

@app.put("/api/admin/teams/{team_id}/status")
async def update_team_status(team_id: str, status_data: dict, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Update team status (Admin only)"""
    try:
        # Verify team exists
        team = teams_collection.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        new_status = status_data.get("status")
        admin_reason = status_data.get("reason", "")
        
        if new_status not in ["active", "suspended", "disbanded"]:
            raise HTTPException(status_code=400, detail="Invalid team status")
        
        # Update team status
        teams_collection.update_one(
            {"id": team_id},
            {"$set": {
                "status": new_status,
                "admin_reason": admin_reason,
                "status_updated_at": datetime.utcnow(),
                "status_updated_by": admin_id,
                "updated_at": datetime.utcnow()
            }}
        )
        
        # If team is disbanded, also update member statuses
        if new_status == "disbanded":
            team_members_collection.update_many(
                {"team_id": team_id},
                {"$set": {"status": "inactive", "left_at": datetime.utcnow()}}
            )
        
        # Log admin action
        log_admin_action(
            admin_id, 
            f"Updated team status",
            f"Team: {team['name']} -> Status: {new_status}. Reason: {admin_reason}",
            target_user_id=team["captain_id"]
        )
        
        return {
            "message": f"Team status updated to {new_status}",
            "team_id": team_id,
            "status": new_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating team status: {str(e)}")

@app.delete("/api/admin/teams/{team_id}")
async def delete_team_admin(team_id: str, admin_id: str = Depends(verify_admin_token(AdminRole.SUPER_ADMIN))):
    """Delete team (Super Admin only)"""
    try:
        # Verify team exists
        team = teams_collection.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Remove all team members
        team_members_collection.delete_many({"team_id": team_id})
        
        # Cancel all pending invitations
        team_invitations_collection.update_many(
            {"team_id": team_id, "status": InvitationStatus.PENDING},
            {"$set": {"status": InvitationStatus.EXPIRED}}
        )
        
        # Delete the team
        teams_collection.delete_one({"id": team_id})
        
        # Log admin action
        log_admin_action(
            admin_id, 
            f"Deleted team",
            f"Team: {team['name']} (ID: {team_id})",
            target_user_id=team["captain_id"]
        )
        
        return {
            "message": f"Team '{team['name']}' has been permanently deleted",
            "team_id": team_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting team: {str(e)}")

@app.post("/api/admin/teams/bulk-action")
async def bulk_team_action(bulk_data: dict, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Perform bulk actions on multiple teams (Admin only)"""
    try:
        team_ids = bulk_data.get("team_ids", [])
        action = bulk_data.get("action")
        action_data = bulk_data.get("action_data", {})
        
        if not team_ids:
            raise HTTPException(status_code=400, detail="No teams selected")
        
        if action not in ["verify", "unverify", "suspend", "activate", "delete"]:
            raise HTTPException(status_code=400, detail="Invalid bulk action")
        
        successful_actions = []
        failed_actions = []
        
        for team_id in team_ids:
            try:
                team = teams_collection.find_one({"id": team_id})
                if not team:
                    failed_actions.append({"team_id": team_id, "reason": "Team not found"})
                    continue
                
                if action == "verify":
                    teams_collection.update_one(
                        {"id": team_id},
                        {"$set": {
                            "verification_status": "verified",
                            "verified_at": datetime.utcnow(),
                            "verified_by": admin_id,
                            "updated_at": datetime.utcnow()
                        }}
                    )
                elif action == "unverify":
                    teams_collection.update_one(
                        {"id": team_id},
                        {"$set": {
                            "verification_status": "unverified",
                            "verified_at": None,
                            "verified_by": None,
                            "updated_at": datetime.utcnow()
                        }}
                    )
                elif action == "suspend":
                    teams_collection.update_one(
                        {"id": team_id},
                        {"$set": {
                            "status": "suspended",
                            "admin_reason": action_data.get("reason", "Bulk suspension"),
                            "status_updated_at": datetime.utcnow(),
                            "status_updated_by": admin_id,
                            "updated_at": datetime.utcnow()
                        }}
                    )
                elif action == "activate":
                    teams_collection.update_one(
                        {"id": team_id},
                        {"$set": {
                            "status": "active",
                            "admin_reason": action_data.get("reason", "Bulk activation"),
                            "status_updated_at": datetime.utcnow(),
                            "status_updated_by": admin_id,
                            "updated_at": datetime.utcnow()
                        }}
                    )
                elif action == "delete" and admin_id in ["super_admin", "god"]:  # Extra security for delete
                    team_members_collection.delete_many({"team_id": team_id})
                    team_invitations_collection.update_many(
                        {"team_id": team_id, "status": InvitationStatus.PENDING},
                        {"$set": {"status": InvitationStatus.EXPIRED}}
                    )
                    teams_collection.delete_one({"id": team_id})
                
                successful_actions.append({"team_id": team_id, "team_name": team["name"]})
                
                # Log admin action
                log_admin_action(
                    admin_id, 
                    f"Bulk {action}",
                    f"Team: {team['name']} (ID: {team_id})",
                    target_user_id=team["captain_id"]
                )
                
            except Exception as e:
                failed_actions.append({"team_id": team_id, "reason": str(e)})
        
        return {
            "message": f"Bulk {action} completed",
            "successful_actions": successful_actions,
            "failed_actions": failed_actions,
            "total_successful": len(successful_actions),
            "total_failed": len(failed_actions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing bulk action: {str(e)}")

# =============================================================================
# NATIONAL LEAGUE SYSTEM API ENDPOINTS
# =============================================================================

@app.get("/api/national-leagues")
async def get_national_leagues():
    """Get all national leagues organized by country"""
    try:
        leagues = list(national_leagues_collection.find({}))
        
        # Organize by country
        countries = {}
        for league in leagues:
            if "_id" in league:
                league["_id"] = str(league["_id"])
            
            country = league["country"]
            if country not in countries:
                countries[country] = {
                    "country": country,
                    "premier": None,
                    "league_2": None
                }
            
            if league["league_type"] == "premier":
                countries[country]["premier"] = league
            else:
                countries[country]["league_2"] = league
        
        return {"countries": list(countries.values())}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching national leagues: {str(e)}")

@app.get("/api/national-leagues/{country}/{league_type}")
async def get_league_standings(country: str, league_type: str):
    """Get standings for a specific national league"""
    try:
        if league_type not in ["premier", "league_2"]:
            raise HTTPException(status_code=400, detail="Invalid league type")
        
        # Find the league
        league = national_leagues_collection.find_one({
            "country": country,
            "league_type": league_type
        })
        
        if not league:
            raise HTTPException(status_code=404, detail="League not found")
        
        if "_id" in league:
            league["_id"] = str(league["_id"])
        
        # Get team standings for this league
        standings = list(team_standings_collection.find({
            "league_id": league["id"]
        }).sort("position", 1))
        
        for standing in standings:
            if "_id" in standing:
                standing["_id"] = str(standing["_id"])
        
        league["standings"] = standings
        
        return league
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching league standings: {str(e)}")
# =============================================================================
# STANDINGS ENDPOINTS - For Detailed Standings Section
# =============================================================================

@app.get("/api/standings/countries")
async def get_standings_countries():
    """Get list of available countries for standings"""
    try:
        countries = [
            {"name": "Greece", "flag": "🇬🇷"},
            {"name": "Italy", "flag": "🇮🇹"},
            {"name": "Germany", "flag": "🇩🇪"},
            {"name": "England", "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
            {"name": "Spain", "flag": "🇪🇸"},
            {"name": "France", "flag": "🇫🇷"}
        ]
        return {"countries": countries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching countries: {str(e)}")

@app.get("/api/standings/{country}")
async def get_country_standings(country: str):
    """Get standings data for a specific country"""
    try:
        # Mock data structure matching frontend
        standings_data = {
            'England': {
                'premier': {
                    'name': 'England Premier League',
                    'season': '2025/2026',
                    'rounds': [
                        {
                            'round': 1,
                            'matches': [
                                {'date': '15/08', 'time': '22:00', 'homeTeam': 'Liverpool', 'awayTeam': 'Bournemouth', 'homeScore': 3, 'awayScore': 1, 'status': 'FIN'},
                                {'date': '16/08', 'time': '14:30', 'homeTeam': 'Aston Villa', 'awayTeam': 'Newcastle', 'homeScore': 2, 'awayScore': 1, 'status': 'FIN'},
                                {'date': '16/08', 'time': '17:00', 'homeTeam': 'Brighton', 'awayTeam': 'Fulham', 'homeScore': 1, 'awayScore': 0, 'status': 'FIN'},
                                {'date': '16/08', 'time': '17:00', 'homeTeam': 'Sunderland', 'awayTeam': 'West Ham', 'homeScore': None, 'awayScore': None, 'status': 'LIVE', 'liveMinute': '67'},
                                {'date': '16/08', 'time': '17:00', 'homeTeam': 'Tottenham', 'awayTeam': 'Burnley', 'homeScore': 2, 'awayScore': 0, 'status': 'FIN'},
                                {'date': '16/08', 'time': '19:30', 'homeTeam': 'Wolverhampton', 'awayTeam': 'Manchester City', 'homeScore': None, 'awayScore': None, 'status': 'LIVE', 'liveMinute': '45+2'},
                                {'date': '17/08', 'time': '16:00', 'homeTeam': 'Chelsea', 'awayTeam': 'Crystal Palace', 'homeScore': None, 'awayScore': None, 'status': 'UP'},
                                {'date': '17/08', 'time': '16:00', 'homeTeam': 'Nottingham Forest', 'awayTeam': 'Brentford', 'homeScore': None, 'awayScore': None, 'status': 'UP'},
                                {'date': '17/08', 'time': '18:30', 'homeTeam': 'Manchester United', 'awayTeam': 'Arsenal', 'homeScore': None, 'awayScore': None, 'status': 'UP'},
                                {'date': '18/08', 'time': '22:00', 'homeTeam': 'Leeds', 'awayTeam': 'Everton', 'homeScore': None, 'awayScore': None, 'status': 'UP'}
                            ]
                        }
                    ],
                    'standings': [
                        {'pos': 1, 'team': 'Liverpool', 'pl': 1, 'w': 1, 'd': 0, 'l': 0, 'gf': 3, 'ga': 1, 'gd': 2, 'pts': 3, 'form': ['W']},
                        {'pos': 2, 'team': 'Aston Villa', 'pl': 1, 'w': 1, 'd': 0, 'l': 0, 'gf': 2, 'ga': 1, 'gd': 1, 'pts': 3, 'form': ['W']},
                        {'pos': 3, 'team': 'Brighton', 'pl': 1, 'w': 1, 'd': 0, 'l': 0, 'gf': 1, 'ga': 0, 'gd': 1, 'pts': 3, 'form': ['W']},
                        {'pos': 4, 'team': 'Tottenham', 'pl': 1, 'w': 1, 'd': 0, 'l': 0, 'gf': 2, 'ga': 0, 'gd': 2, 'pts': 3, 'form': ['W']},
                        {'pos': 5, 'team': 'Bournemouth', 'pl': 1, 'w': 0, 'd': 0, 'l': 1, 'gf': 1, 'ga': 3, 'gd': -2, 'pts': 0, 'form': ['L']},
                        {'pos': 6, 'team': 'Newcastle', 'pl': 1, 'w': 0, 'd': 0, 'l': 1, 'gf': 1, 'ga': 2, 'gd': -1, 'pts': 0, 'form': ['L']},
                        {'pos': 7, 'team': 'Fulham', 'pl': 1, 'w': 0, 'd': 0, 'l': 1, 'gf': 0, 'ga': 1, 'gd': -1, 'pts': 0, 'form': ['L']},
                        {'pos': 8, 'team': 'Burnley', 'pl': 1, 'w': 0, 'd': 0, 'l': 1, 'gf': 0, 'ga': 2, 'gd': -2, 'pts': 0, 'form': ['L']},
                        {'pos': 9, 'team': 'Arsenal', 'pl': 0, 'w': 0, 'd': 0, 'l': 0, 'gf': 0, 'ga': 0, 'gd': 0, 'pts': 0, 'form': []},
                        {'pos': 10, 'team': 'Brentford', 'pl': 0, 'w': 0, 'd': 0, 'l': 0, 'gf': 0, 'ga': 0, 'gd': 0, 'pts': 0, 'form': []}
                    ],
                    'playerStats': [
                        {'rank': 1, 'player': 'Mohamed Salah', 'team': 'Liverpool', 'goals': 15, 'assists': 8, 'yellowCards': 2, 'redCards': 0, 'minutes': 1240},
                        {'rank': 2, 'player': 'Erling Haaland', 'team': 'Manchester City', 'goals': 18, 'assists': 3, 'yellowCards': 1, 'redCards': 0, 'minutes': 1180},
                        {'rank': 3, 'player': 'Harry Kane', 'team': 'Tottenham', 'goals': 12, 'assists': 6, 'yellowCards': 3, 'redCards': 0, 'minutes': 1320},
                        {'rank': 4, 'player': 'Bukayo Saka', 'team': 'Arsenal', 'goals': 9, 'assists': 11, 'yellowCards': 4, 'redCards': 0, 'minutes': 1410},
                        {'rank': 5, 'player': 'Marcus Rashford', 'team': 'Manchester United', 'goals': 11, 'assists': 4, 'yellowCards': 2, 'redCards': 1, 'minutes': 1200}
                    ]
                }
            },
            'Greece': {
                'premier': {
                    'name': 'Greece Super League',
                    'season': '2025/2026',
                    'rounds': [
                        {
                            'round': 1,
                            'matches': [
                                {'date': '20/08', 'time': '18:00', 'homeTeam': 'Olympiakos', 'awayTeam': 'Panathinaikos', 'homeScore': 2, 'awayScore': 1, 'status': 'FIN'},
                                {'date': '20/08', 'time': '20:30', 'homeTeam': 'AEK Athens', 'awayTeam': 'PAOK', 'homeScore': 1, 'awayScore': 1, 'status': 'FIN'},
                                {'date': '21/08', 'time': '19:00', 'homeTeam': 'Aris', 'awayTeam': 'Atromitos', 'homeScore': None, 'awayScore': None, 'status': 'UP'},
                                {'date': '21/08', 'time': '21:30', 'homeTeam': 'Volos', 'awayTeam': 'OFI Crete', 'homeScore': None, 'awayScore': None, 'status': 'UP'}
                            ]
                        }
                    ],
                    'standings': [
                        {'pos': 1, 'team': 'Olympiakos', 'pl': 1, 'w': 1, 'd': 0, 'l': 0, 'gf': 2, 'ga': 1, 'gd': 1, 'pts': 3, 'form': ['W']},
                        {'pos': 2, 'team': 'AEK Athens', 'pl': 1, 'w': 0, 'd': 1, 'l': 0, 'gf': 1, 'ga': 1, 'gd': 0, 'pts': 1, 'form': ['D']},
                        {'pos': 3, 'team': 'PAOK', 'pl': 1, 'w': 0, 'd': 1, 'l': 0, 'gf': 1, 'ga': 1, 'gd': 0, 'pts': 1, 'form': ['D']},
                        {'pos': 4, 'team': 'Panathinaikos', 'pl': 1, 'w': 0, 'd': 0, 'l': 1, 'gf': 1, 'ga': 2, 'gd': -1, 'pts': 0, 'form': ['L']}
                    ],
                    'playerStats': [
                        {'rank': 1, 'player': 'Kostas Fortounis', 'team': 'Olympiakos', 'goals': 8, 'assists': 5, 'yellowCards': 1, 'redCards': 0, 'minutes': 890},
                        {'rank': 2, 'player': 'Giorgos Giakoumakis', 'team': 'AEK Athens', 'goals': 6, 'assists': 2, 'yellowCards': 2, 'redCards': 0, 'minutes': 780},
                        {'rank': 3, 'player': 'Andraz Sporar', 'team': 'Panathinaikos', 'goals': 5, 'assists': 3, 'yellowCards': 0, 'redCards': 0, 'minutes': 720}
                    ]
                }
            },
            'Italy': {
                'premier': {
                    'name': 'Serie A',
                    'season': '2025/2026',
                    'rounds': [
                        {
                            'round': 1,
                            'matches': [
                                {'date': '18/08', 'time': '18:00', 'homeTeam': 'Inter Milan', 'awayTeam': 'AC Milan', 'homeScore': 2, 'awayScore': 0, 'status': 'FIN'},
                                {'date': '18/08', 'time': '20:45', 'homeTeam': 'Juventus', 'awayTeam': 'Napoli', 'homeScore': 1, 'awayScore': 3, 'status': 'FIN'},
                                {'date': '19/08', 'time': '19:00', 'homeTeam': 'Roma', 'awayTeam': 'Lazio', 'homeScore': None, 'awayScore': None, 'status': 'LIVE', 'liveMinute': '78'},
                                {'date': '19/08', 'time': '21:30', 'homeTeam': 'Atalanta', 'awayTeam': 'Fiorentina', 'homeScore': None, 'awayScore': None, 'status': 'UP'}
                            ]
                        }
                    ],
                    'standings': [
                        {'pos': 1, 'team': 'Napoli', 'pl': 1, 'w': 1, 'd': 0, 'l': 0, 'gf': 3, 'ga': 1, 'gd': 2, 'pts': 3, 'form': ['W']},
                        {'pos': 2, 'team': 'Inter Milan', 'pl': 1, 'w': 1, 'd': 0, 'l': 0, 'gf': 2, 'ga': 0, 'gd': 2, 'pts': 3, 'form': ['W']},
                        {'pos': 3, 'team': 'AC Milan', 'pl': 1, 'w': 0, 'd': 0, 'l': 1, 'gf': 0, 'ga': 2, 'gd': -2, 'pts': 0, 'form': ['L']},
                        {'pos': 4, 'team': 'Juventus', 'pl': 1, 'w': 0, 'd': 0, 'l': 1, 'gf': 1, 'ga': 3, 'gd': -2, 'pts': 0, 'form': ['L']}
                    ],
                    'playerStats': [
                        {'rank': 1, 'player': 'Victor Osimhen', 'team': 'Napoli', 'goals': 12, 'assists': 4, 'yellowCards': 2, 'redCards': 0, 'minutes': 980},
                        {'rank': 2, 'player': 'Lautaro Martinez', 'team': 'Inter Milan', 'goals': 10, 'assists': 6, 'yellowCards': 1, 'redCards': 0, 'minutes': 1050},
                        {'rank': 3, 'player': 'Federico Chiesa', 'team': 'Juventus', 'goals': 7, 'assists': 8, 'yellowCards': 3, 'redCards': 0, 'minutes': 920}
                    ]
                }
            }
        }
        
        country_data = standings_data.get(country)
        if not country_data:
            raise HTTPException(status_code=404, detail="Country not found")
        
        return country_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching standings: {str(e)}")

@app.get("/api/standings/{country}/{league}")
async def get_league_standings_detail(country: str, league: str):
    """Get detailed standings for a specific country and league"""
    try:
        country_data = await get_country_standings(country)
        league_data = country_data.get(league)
        
        if not league_data:
            raise HTTPException(status_code=404, detail="League not found")
            
        return league_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching league standings: {str(e)}")

@app.post("/api/admin/assign-team-to-league")
async def assign_team_to_league(assignment_data: dict, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Assign a team to a national league (Admin only)"""
    try:
        team_id = assignment_data.get("team_id")
        country = assignment_data.get("country")
        league_type = assignment_data.get("league_type")
        
        if not team_id or not country or not league_type:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        if league_type not in ["premier", "league_2"]:
            raise HTTPException(status_code=400, detail="Invalid league type")
        
        # Verify team exists
        team = teams_collection.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check if team country matches assignment country
        if team["country"].lower() != country.lower():
            raise HTTPException(status_code=400, detail="Team country must match league country")
        
        # Find or create the national league
        league_name = f"{country} {league_type.replace('_', ' ').title()}"
        league = national_leagues_collection.find_one({
            "country": country,
            "league_type": league_type
        })
        
        if not league:
            # Create new league
            league_id = str(uuid.uuid4())
            new_league = {
                "id": league_id,
                "country": country,
                "league_type": league_type,
                "name": league_name,
                "season": "2024-2025",
                "teams": [team_id],
                "standings": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            national_leagues_collection.insert_one(new_league)
        else:
            league_id = league["id"]
            # Add team to existing league if not already there
            if team_id not in league.get("teams", []):
                national_leagues_collection.update_one(
                    {"id": league_id},
                    {
                        "$push": {"teams": team_id},
                        "$set": {"updated_at": datetime.utcnow()}
                    }
                )
        
        # Remove team from any other league assignment
        league_assignments_collection.delete_many({"team_id": team_id})
        
        # Create new assignment record
        assignment = {
            "id": str(uuid.uuid4()),
            "team_id": team_id,
            "league_id": league_id,
            "country": country,
            "league_type": league_type,
            "assigned_by": admin_id,
            "assigned_at": datetime.utcnow()
        }
        league_assignments_collection.insert_one(assignment)
        
        # Create initial team standing
        team_standings_collection.delete_many({"team_id": team_id})  # Remove old standings
        initial_standing = {
            "id": str(uuid.uuid4()),
            "team_id": team_id,
            "team_name": team["name"],
            "league_id": league_id,
            "matches_played": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "goals_for": 0,
            "goals_against": 0,
            "goal_difference": 0,
            "points": 0,
            "position": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        team_standings_collection.insert_one(initial_standing)
        
        # Update team with league assignment
        teams_collection.update_one(
            {"id": team_id},
            {
                "$set": {
                    "league_id": league_id,
                    "league_country": country,
                    "league_type": league_type,
                    "league_name": league_name,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Log admin action
        log_admin_action(
            admin_id,
            "Assigned team to league",
            f"Team: {team['name']} → {league_name}",
            target_user_id=team["captain_id"]
        )
        
        return {
            "message": f"Team '{team['name']}' assigned to {league_name}",
            "team_id": team_id,
            "league_name": league_name,
            "league_id": league_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error assigning team to league: {str(e)}")

@app.get("/api/admin/teams-without-league")
async def get_teams_without_league(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get all teams that haven't been assigned to a league (Admin only)"""
    try:
        # Get all teams that don't have a league assignment
        teams_without_league = list(teams_collection.find({
            "$or": [
                {"league_id": {"$exists": False}},
                {"league_id": None},
                {"league_id": ""}
            ]
        }))
        
        for team in teams_without_league:
            if "_id" in team:
                team["_id"] = str(team["_id"])
        
        return {"teams": teams_without_league}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teams without league: {str(e)}")

@app.post("/api/admin/initialize-country-leagues")
async def initialize_country_leagues(country_data: dict, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Initialize Premier and League 2 for a country (Admin only)"""
    try:
        country = country_data.get("country")
        if not country:
            raise HTTPException(status_code=400, detail="Country is required")
        
        leagues_created = []
        
        # Create Premier League
        premier_id = str(uuid.uuid4())
        premier_league = {
            "id": premier_id,
            "country": country,
            "league_type": "premier",
            "name": f"{country} Premier",
            "season": "2024-2025",
            "teams": [],
            "standings": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Create League 2
        league2_id = str(uuid.uuid4())
        league2 = {
            "id": league2_id,
            "country": country,
            "league_type": "league_2",
            "name": f"{country} League 2",
            "season": "2024-2025",
            "teams": [],
            "standings": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Check if leagues already exist
        existing_premier = national_leagues_collection.find_one({
            "country": country,
            "league_type": "premier"
        })
        
        existing_league2 = national_leagues_collection.find_one({
            "country": country,
            "league_type": "league_2"
        })
        
        if not existing_premier:
            national_leagues_collection.insert_one(premier_league)
            leagues_created.append(f"{country} Premier")
        
        if not existing_league2:
            national_leagues_collection.insert_one(league2)
            leagues_created.append(f"{country} League 2")
        
        # Log admin action
        log_admin_action(
            admin_id,
            "Initialized country leagues",
            f"Country: {country}, Leagues: {', '.join(leagues_created)}"
        )
        
        return {
            "message": f"Leagues initialized for {country}",
            "leagues_created": leagues_created,
            "country": country
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing country leagues: {str(e)}")

@app.post("/api/admin/initialize-default-countries")
async def initialize_default_countries(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Initialize the 6 default countries with their leagues (Admin only)"""
    try:
        default_countries = ["Greece", "Italy", "Germany", "England", "Spain", "France", "Turkey", "Austria"]
        results = []
        
        for country in default_countries:
            leagues_created = []
            
            # Create Premier League
            premier_id = str(uuid.uuid4())
            premier_league = {
                "id": premier_id,
                "country": country,
                "league_type": "premier",
                "name": f"{country} Premier",
                "season": "2024-2025",
                "teams": [],
                "standings": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Create League 2
            league2_id = str(uuid.uuid4())
            league2 = {
                "id": league2_id,
                "country": country,
                "league_type": "league_2",
                "name": f"{country} League 2",
                "season": "2024-2025",
                "teams": [],
                "standings": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Check if leagues already exist
            existing_premier = national_leagues_collection.find_one({
                "country": country,
                "league_type": "premier"
            })
            
            existing_league2 = national_leagues_collection.find_one({
                "country": country,
                "league_type": "league_2"
            })
            
            if not existing_premier:
                national_leagues_collection.insert_one(premier_league)
                leagues_created.append(f"{country} Premier")
            
            if not existing_league2:
                national_leagues_collection.insert_one(league2)
                leagues_created.append(f"{country} League 2")
            
            results.append({
                "country": country,
                "leagues_created": leagues_created
            })
        
        # Log admin action
        log_admin_action(
            admin_id,
            "Initialized default countries",
            f"Countries: {', '.join(default_countries)}"
        )
        
        return {
            "message": "Default countries initialized successfully",
            "results": results,
            "total_countries": len(default_countries)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing default countries: {str(e)}")

@app.get("/api/league-fixtures/{country}/{league_type}")
async def get_league_fixtures(country: str, league_type: str):
    """Get fixtures/schedule for a specific league"""
    try:
        if league_type not in ["premier", "league_2"]:
            raise HTTPException(status_code=400, detail="Invalid league type")
        
        # Find the league
        league = national_leagues_collection.find_one({
            "country": country,
            "league_type": league_type
        })
        
        if not league:
            raise HTTPException(status_code=404, detail="League not found")
        
        # Get all fixtures for this league, grouped by matchday
        fixtures = list(match_fixtures_collection.find({
            "league_id": league["id"]
        }).sort("matchday", 1))
        
        # Group fixtures by matchday
        matchdays = {}
        for fixture in fixtures:
            if "_id" in fixture:
                fixture["_id"] = str(fixture["_id"])
            
            matchday = fixture["matchday"]
            if matchday not in matchdays:
                matchdays[matchday] = {
                    "matchday": matchday,
                    "league_id": league["id"],
                    "league_name": league["name"],
                    "matches": [],
                    "total_matches": 0,
                    "played_matches": 0
                }
            
            matchdays[matchday]["matches"].append(fixture)
            matchdays[matchday]["total_matches"] += 1
            if fixture["status"] == "played":
                matchdays[matchday]["played_matches"] += 1
        
        # Convert to list and sort
        matchday_list = list(matchdays.values())
        matchday_list.sort(key=lambda x: x["matchday"])
        
        return {
            "league": league,
            "matchdays": matchday_list,
            "total_matchdays": len(matchday_list)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching league fixtures: {str(e)}")

@app.post("/api/admin/generate-league-fixtures")
async def generate_league_fixtures(fixture_data: dict, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Generate fixtures for a league using round-robin algorithm (Admin only)"""
    try:
        league_id = fixture_data.get("league_id")
        if not league_id:
            raise HTTPException(status_code=400, detail="League ID is required")
        
        # Find the league
        league = national_leagues_collection.find_one({"id": league_id})
        if not league:
            raise HTTPException(status_code=404, detail="League not found")
        
        # Get teams in this league
        team_ids = league.get("teams", [])
        if len(team_ids) < 2:
            raise HTTPException(status_code=400, detail="League must have at least 2 teams to generate fixtures")
        
        # Get team details
        teams = []
        for team_id in team_ids:
            team = teams_collection.find_one({"id": team_id})
            if team:
                teams.append({
                    "id": team["id"],
                    "name": team["name"]
                })
        
        if len(teams) != len(team_ids):
            raise HTTPException(status_code=400, detail="Some teams in league were not found")
        
        # Clear existing fixtures for this league
        match_fixtures_collection.delete_many({"league_id": league_id})
        
        # Generate round-robin fixtures
        fixtures_generated = generate_round_robin_fixtures(teams, league_id, league["name"])
        
        # Insert fixtures into database
        if fixtures_generated:
            match_fixtures_collection.insert_many(fixtures_generated)
        
        # Log admin action
        log_admin_action(
            admin_id,
            "Generated league fixtures",
            f"League: {league['name']}, Teams: {len(teams)}, Fixtures: {len(fixtures_generated)}"
        )
        
        return {
            "message": f"Generated {len(fixtures_generated)} fixtures for {league['name']}",
            "league_id": league_id,
            "total_fixtures": len(fixtures_generated),
            "total_matchdays": max([f["matchday"] for f in fixtures_generated]) if fixtures_generated else 0,
            "teams_count": len(teams)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating league fixtures: {str(e)}")

def generate_round_robin_fixtures(teams, league_id, league_name):
    """Generate round-robin fixtures for teams"""
    if len(teams) % 2 != 0:
        # Add a "bye" team for odd number of teams
        teams.append({"id": "bye", "name": "BYE"})
    
    num_teams = len(teams)
    num_rounds = num_teams - 1
    fixtures = []
    
    # First round (each team plays every other team once)
    for round_num in range(num_rounds):
        matchday = round_num + 1
        
        for i in range(num_teams // 2):
            home_idx = i
            away_idx = num_teams - 1 - i
            
            if round_num > 0:
                # Rotate teams (except the first one which stays fixed)
                if home_idx == 0:
                    away_idx = (away_idx - round_num) % (num_teams - 1)
                    if away_idx == 0:
                        away_idx = num_teams - 1
                else:
                    home_idx = (home_idx - round_num) % (num_teams - 1)
                    if home_idx == 0:
                        home_idx = num_teams - 1
                    away_idx = (away_idx - round_num) % (num_teams - 1)
                    if away_idx == 0:
                        away_idx = num_teams - 1
            
            home_team = teams[home_idx]
            away_team = teams[away_idx]
            
            # Skip matches involving BYE team
            if home_team["id"] != "bye" and away_team["id"] != "bye":
                fixture = {
                    "id": str(uuid.uuid4()),
                    "league_id": league_id,
                    "matchday": matchday,
                    "home_team_id": home_team["id"],
                    "away_team_id": away_team["id"],
                    "home_team_name": home_team["name"],
                    "away_team_name": away_team["name"],
                    "match_date": None,
                    "home_score": None,
                    "away_score": None,
                    "status": "scheduled",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                fixtures.append(fixture)
    
    # Second round (return fixtures - away teams become home teams)
    first_round_fixtures = fixtures.copy()
    for fixture in first_round_fixtures:
        return_fixture = {
            "id": str(uuid.uuid4()),
            "league_id": league_id,
            "matchday": fixture["matchday"] + num_rounds,
            "home_team_id": fixture["away_team_id"],
            "away_team_id": fixture["home_team_id"],
            "home_team_name": fixture["away_team_name"],
            "away_team_name": fixture["home_team_name"],
            "match_date": None,
            "home_score": None,
            "away_score": None,
            "status": "scheduled",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        fixtures.append(return_fixture)
    
    return fixtures

# =============================================================================
# BULK PAYOUT API ENDPOINTS
# =============================================================================

# =============================================================================
# TEAM SYSTEM API ENDPOINTS
# =============================================================================

@app.post("/api/teams")
async def process_bulk_payout(payout_ids: List[str], admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Process multiple payouts in bulk"""
    try:
        processed_payouts = []
        failed_payouts = []
        
        for payout_id in payout_ids:
            try:
                # Get payout
                payout = payouts_collection.find_one({"id": payout_id})
                if not payout or payout["status"] != "pending":
                    failed_payouts.append({"id": payout_id, "reason": "Invalid or non-pending payout"})
                    continue
                
                # Mark as completed
                payouts_collection.update_one(
                    {"id": payout_id},
                    {"$set": {
                        "status": "completed",
                        "processed_by": admin_id,
                        "processed_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }}
                )
                
                # Mark commissions as paid
                commission_ids = payout["commission_ids"]
                commissions_collection.update_many(
                    {"id": {"$in": commission_ids}},
                    {"$set": {"is_paid": True, "paid_at": datetime.utcnow()}}
                )
                
                # Add payout completed transaction
                add_transaction(
                    user_id=payout["affiliate_user_id"],
                    transaction_type="payout_completed",
                    amount=payout["amount"],
                    description=f"Payout completed via {payout['payment_method']}",
                    payout_id=payout_id,
                    processed_by=admin_id
                )
                
                # Update affiliate earnings
                affiliates_collection.update_one(
                    {"user_id": payout["affiliate_user_id"]},
                    {
                        "$inc": {
                            "pending_earnings": -payout["amount"],
                            "paid_earnings": payout["amount"]
                        },
                        "$set": {"updated_at": datetime.utcnow()}
                    }
                )
                
                processed_payouts.append(payout_id)
                
            except Exception as e:
                failed_payouts.append({"id": payout_id, "reason": str(e)})
        
        return {
            "message": f"Processed {len(processed_payouts)} payouts successfully",
            "processed": processed_payouts,
            "failed": failed_payouts,
            "total_processed": len(processed_payouts),
            "total_failed": len(failed_payouts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing bulk payout: {str(e)}")

# Initialize some sample data
@app.on_event("startup")
async def startup_event():
    # Create sample competitions
    if competitions_collection.count_documents({}) == 0:
        sample_competitions = [
            {
                "id": str(uuid.uuid4()),
                "name": "European Championship 2024",
                "description": "Premier European betting competition",
                "region": "Europe",
                "start_date": datetime(2024, 6, 1),
                "end_date": datetime(2024, 6, 30),
                "max_participants": 1000,
                "current_participants": 0,
                "status": "upcoming",
                "prize_pool": 50000.0
            },
            {
                "id": str(uuid.uuid4()),
                "name": "World Cup Betting Challenge",
                "description": "Global betting competition for World Cup",
                "region": "Global",
                "start_date": datetime(2024, 11, 20),
                "end_date": datetime(2024, 12, 18),
                "max_participants": 5000,
                "current_participants": 0,
                "status": "upcoming",
                "prize_pool": 100000.0
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Asian Masters",
                "description": "Asian region betting championship",
                "region": "Asia",
                "start_date": datetime(2024, 8, 1),
                "end_date": datetime(2024, 8, 31),
                "max_participants": 2000,
                "current_participants": 0,
                "status": "upcoming",
                "prize_pool": 30000.0
            }
        ]
        competitions_collection.insert_many(sample_competitions)
        print("Sample competitions created")
    
    # Create sample users for testing World Map
    if users_collection.count_documents({}) < 50:
        import random
        
        # Avatar URLs for realistic testing
        avatar_urls = [
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400", 
            "https://images.unsplash.com/photo-1494790108755-2616b612b829?w=400",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
            None, None  # Some users without avatars
        ]
        
        countries_data = [
            ('GR', ['Dimitris Papadopoulos', 'Maria Konstantinou', 'Yannis Stavros', 'Anna Georgiou', 'Kostas Petrou', 'Eleni Dimitriou', 'Nikos Christou', 'Sofia Andreou']),
            ('US', ['John Smith', 'Emma Johnson', 'Michael Brown', 'Olivia Davis', 'William Wilson', 'Ava Garcia', 'James Martinez']),
            ('UK', ['James Thompson', 'Emily White', 'Harry Taylor', 'Sophie Anderson', 'George Clark', 'Lily Evans', 'Charlie Robinson']),
            ('DE', ['Hans Mueller', 'Anna Schmidt', 'Klaus Weber', 'Petra Fischer', 'Wolfgang Koch', 'Sabine Richter', 'Dieter Hoffman']),
            ('FR', ['Pierre Dubois', 'Marie Martin', 'Jean Bernard', 'Claire Petit', 'Alain Durand', 'Isabelle Moreau', 'François Simon']),
            ('IT', ['Marco Rossi', 'Giulia Bianchi', 'Andrea Ferrari', 'Francesca Romano', 'Alessandro Marino', 'Valentina Greco', 'Davide Conti']),
            ('ES', ['Carlos Garcia', 'Ana Martinez', 'David Rodriguez', 'Laura Fernandez', 'Miguel Lopez', 'Isabel Gonzalez', 'Jose Perez']),
            ('BR', ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Pereira', 'Lucia Almeida', 'Roberto Nascimento']),
            ('AR', ['Diego Fernandez', 'Sofia Gonzalez', 'Mateo Rodriguez', 'Valentina Lopez', 'Santiago Martinez', 'Camila Perez']),
            ('AU', ['Jack Wilson', 'Emma Thompson', 'Liam Johnson', 'Olivia Brown', 'Noah Davis', 'Ava Miller', 'William Garcia'])
        ]
        
        sample_users = []
        user_id_counter = 1
        
        for country_code, names in countries_data:
            for i, full_name in enumerate(names):
                username = f"{full_name.lower().replace(' ', '_')}_{country_code.lower()}"
                
                # Generate random betting stats
                total_bets = random.randint(15, 100)
                won_bets = random.randint(int(total_bets * 0.3), int(total_bets * 0.7))
                lost_bets = total_bets - won_bets
                total_amount = round(random.uniform(500, 5000))
                total_winnings = round(total_amount * random.uniform(0.8, 1.4))
                avg_odds = round(random.uniform(1.5, 3.5), 1)
                
                # Calculate score
                win_rate = won_bets / total_bets if total_bets > 0 else 0
                profit = total_winnings - total_amount
                roi = profit / total_amount if total_amount > 0 else 0
                score = max(0, (win_rate * 100) + (roi * 50) + (avg_odds * 10))
                
                # Random avatar
                avatar_url = random.choice(avatar_urls)
                
                user_data = {
                    "id": str(uuid.uuid4()),
                    "username": username,
                    "email": f"{username}@example.com",
                    "password": hash_password("demo123"),
                    "country": country_code,
                    "full_name": full_name,
                    "avatar_url": avatar_url,
                    "admin_role": "user",
                    "is_blocked": False,
                    "blocked_until": None,
                    "blocked_reason": None,
                    "created_at": datetime.utcnow(),
                    "total_bets": total_bets,
                    "won_bets": won_bets,
                    "lost_bets": lost_bets,
                    "total_amount": total_amount,
                    "total_winnings": total_winnings,
                    "avg_odds": avg_odds,
                    "rank": 0,
                    "score": score
                }
                sample_users.append(user_data)
                user_id_counter += 1
        
        # Insert all sample users
        users_collection.insert_many(sample_users)
        print(f"Created {len(sample_users)} sample users across {len(countries_data)} countries")
        
        # Create the demo user if it doesn't exist
        if not users_collection.find_one({"username": "testuser"}):
            demo_user = {
                "id": str(uuid.uuid4()),
                "username": "testuser",
                "email": "testuser@example.com",
                "password": hash_password("test123"),
                "country": "GR",
                "full_name": "Demo User",
                "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
                "admin_role": "user",
                "is_blocked": False,
                "blocked_until": None,
                "blocked_reason": None,
                "created_at": datetime.utcnow(),
                "total_bets": 50,
                "won_bets": 32,
                "lost_bets": 18,
                "total_amount": 2500,
                "total_winnings": 3200,
                "avg_odds": 2.1,
                "rank": 0,
                "score": 85.5
            }
            users_collection.insert_one(demo_user)
            print("Demo user created")
        
        # Create admin accounts
        admin_accounts = [
            {
                "username": "God",
                "password": "Kiki1999@",
                "admin_role": "god",
                "full_name": "God Administrator",
                "email": "god@wobera.com"
            },
            {
                "username": "Superadmin", 
                "password": "Kiki1999@",
                "admin_role": "super_admin",
                "full_name": "Super Administrator", 
                "email": "superadmin@wobera.com"
            },
            {
                "username": "admin",
                "password": "Kiki1999@", 
                "admin_role": "admin",
                "full_name": "Administrator",
                "email": "admin@wobera.com"
            }
        ]
        
        for admin_data in admin_accounts:
            if not users_collection.find_one({"username": admin_data["username"]}):
                admin_user = {
                    "id": str(uuid.uuid4()),
                    "username": admin_data["username"],
                    "email": admin_data["email"],
                    "password": hash_password(admin_data["password"]),
                    "country": "GR",
                    "full_name": admin_data["full_name"],
                    "avatar_url": None,
                    "admin_role": admin_data["admin_role"],
                    "is_blocked": False,
                    "blocked_until": None,
                    "blocked_reason": None,
                    "created_at": datetime.utcnow(),
                    "total_bets": 0,
                    "won_bets": 0,
                    "lost_bets": 0,
                    "total_amount": 0,
                    "total_winnings": 0,
                    "avg_odds": 0.0,
                    "rank": 0,
                    "score": 0.0
                }
                users_collection.insert_one(admin_user)
                print(f"Admin user created: {admin_data['username']} ({admin_data['admin_role']})")
    # Create sample tournaments
    if tournaments_collection.count_documents({}) == 0:
        now = datetime.utcnow()
        
        sample_tournaments = [
            {
                "id": str(uuid.uuid4()),
                "name": "Weekend Warriors Championship",
                "description": "Quick weekend tournament for skilled players. Single elimination format with high stakes.",
                "duration_type": "two_day",
                "tournament_format": "single_elimination",
                "status": "open",
                "entry_fee": 25.0,
                "entry_fee_category": "standard",
                "max_participants": 32,
                "current_participants": 0,
                "prize_distribution": "top_three",
                "total_prize_pool": 0.0,
                "created_at": now,
                "registration_start": now,
                "registration_end": now + timedelta(days=1),
                "tournament_start": now + timedelta(days=1),
                "tournament_end": now + timedelta(days=3),
                "rules": "Single elimination tournament. Best of 3 matches in each round. Standard betting rules apply.",
                "region": "Global",
                "created_by": "admin",
                "is_active": True,
                "winner_id": None,
                "results": None
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Daily Grind Challenge",
                "description": "Daily tournament for quick earnings. Perfect for beginners and casual players.",
                "duration_type": "daily",
                "tournament_format": "single_elimination",
                "status": "open",
                "entry_fee": 5.0,
                "entry_fee_category": "basic",
                "max_participants": 16,
                "current_participants": 0,
                "prize_distribution": "winner_takes_all",
                "total_prize_pool": 0.0,
                "created_at": now,
                "registration_start": now,
                "registration_end": now + timedelta(hours=12),
                "tournament_start": now + timedelta(hours=12),
                "tournament_end": now + timedelta(days=1),
                "rules": "Winner takes all format. Single elimination. Fast-paced matches.",
                "region": "Europe",
                "created_by": "admin",
                "is_active": True,
                "winner_id": None,
                "results": None
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Monthly Masters Tournament",
                "description": "Premium monthly tournament with massive prize pool. For serious competitors only.",
                "duration_type": "monthly",
                "tournament_format": "single_elimination",
                "status": "upcoming",
                "entry_fee": 100.0,
                "entry_fee_category": "premium",
                "max_participants": 64,
                "current_participants": 0,
                "prize_distribution": "top_three",
                "total_prize_pool": 0.0,
                "created_at": now,
                "registration_start": now + timedelta(days=5),
                "registration_end": now + timedelta(days=20),
                "tournament_start": now + timedelta(days=25),
                "tournament_end": now + timedelta(days=30),
                "rules": "Single elimination tournament with extended rounds. Top 3 prize distribution: 50% winner, 30% runner-up, 20% third place.",
                "region": "Global",
                "created_by": "admin",
                "is_active": True,
                "winner_id": None,
                "results": None
            },
            {
                "id": str(uuid.uuid4()),
                "name": "VIP Elite Championship",
                "description": "Ultra-premium tournament for elite players. Massive stakes and exclusive prizes.",
                "duration_type": "weekly",
                "tournament_format": "single_elimination",
                "status": "upcoming",
                "entry_fee": 500.0,
                "entry_fee_category": "vip",
                "max_participants": 16,
                "current_participants": 0,
                "prize_distribution": "top_three",
                "total_prize_pool": 0.0,
                "created_at": now,
                "registration_start": now + timedelta(days=2),
                "registration_end": now + timedelta(days=5),
                "tournament_start": now + timedelta(days=7),
                "tournament_end": now + timedelta(days=14),
                "rules": "Elite single elimination tournament. Premium betting limits. Professional-level competition.",
                "region": "Global",
                "created_by": "admin",
                "is_active": True,
                "winner_id": None,
                "results": None
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Flash Tournament",
                "description": "Instant tournament starting now! Quick matches, instant results.",
                "duration_type": "instant",
                "tournament_format": "single_elimination",
                "status": "open",
                "entry_fee": 10.0,
                "entry_fee_category": "basic",
                "max_participants": 8,
                "current_participants": 0,
                "prize_distribution": "winner_takes_all",
                "total_prize_pool": 0.0,
                "created_at": now,
                "registration_start": now,
                "registration_end": now + timedelta(hours=1),
                "tournament_start": now + timedelta(hours=1),
                "tournament_end": now + timedelta(hours=3),
                "rules": "Instant tournament with rapid rounds. Winner takes all. Fast-paced action.",
                "region": "Asia",
                "created_by": "admin",
                "is_active": True,
                "winner_id": None,
                "results": None
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Free Beginner Tournament",
                "description": "Free tournament for new players to practice. No entry fee, pure fun competition!",
                "duration_type": "daily",
                "tournament_format": "single_elimination",
                "status": "open",
                "entry_fee": 0.0,
                "entry_fee_category": "free",
                "max_participants": 32,
                "current_participants": 0,
                "prize_distribution": "winner_takes_all",
                "total_prize_pool": 0.0,
                "created_at": now,
                "registration_start": now,
                "registration_end": now + timedelta(hours=18),
                "tournament_start": now + timedelta(hours=20),
                "tournament_end": now + timedelta(days=1, hours=4),
                "rules": "Free tournament for beginners. No entry fee required. Perfect for practice and learning.",
                "region": "Global",
                "created_by": "admin",
                "is_active": True,
                "winner_id": None,
                "results": None
            }
        ]
        
        tournaments_collection.insert_many(sample_tournaments)
        print("Sample tournaments created")

    # Create test user if not exists (but only if we don't have many users yet)
    if not users_collection.find_one({"username": "testuser"}) and users_collection.count_documents({}) < 50:
        test_user = {
            "id": str(uuid.uuid4()),
            "username": "testuser",
            "email": "testuser@example.com",
            "password": hash_password("testpass123"),
            "country": "GR",
            "full_name": "Test User",
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
            "admin_role": "user",
            "is_blocked": False,
            "blocked_until": None,
            "blocked_reason": None,
            "created_at": datetime.utcnow(),
            "total_bets": 25,
            "won_bets": 18,
            "lost_bets": 7,
            "total_amount": 1200.0,
            "total_winnings": 1850.0,
            "avg_odds": 2.8,
            "rank": 0,
            "score": 85.5
        }
        users_collection.insert_one(test_user)
        print("Test user created: testuser")

    # Create sample affiliate data
    if affiliates_collection.count_documents({}) == 0:
        # Create affiliate for the demo user
        demo_user = users_collection.find_one({"username": "testuser"})
        if demo_user:
            affiliate_data = {
                "id": str(uuid.uuid4()),
                "user_id": demo_user["id"],
                "referral_code": "DEMO2024",
                "referral_link": generate_referral_link("DEMO2024"),
                "status": "active",
                "approved_at": datetime.utcnow(),
                "approved_by": "system",
                "total_referrals": 3,
                "active_referrals": 3,
                "total_earnings": 35.0,
                "pending_earnings": 35.0,
                "paid_earnings": 0.0,
                "commission_rate_registration": 5.0,
                "commission_rate_tournament": 0.1,
                "commission_rate_deposit": 0.05,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            affiliates_collection.insert_one(affiliate_data)
            print("Sample affiliate created for demo user")
            
            # Create some sample referrals and commissions
            now = datetime.utcnow()
            
            # Sample referral 1
            ref1_id = str(uuid.uuid4())
            ref1_user_id = str(uuid.uuid4())
            referral1 = {
                "id": ref1_id,
                "affiliate_user_id": demo_user["id"],
                "referred_user_id": ref1_user_id,
                "referral_code": "DEMO2024",
                "registered_at": now - timedelta(days=5),
                "is_active": True,
                "total_commissions_earned": 15.0,
                "tournaments_joined": 2,
                "total_tournament_fees": 100.0
            }
            referrals_collection.insert_one(referral1)
            
            # Sample commissions
            commission1 = {
                "id": str(uuid.uuid4()),
                "affiliate_user_id": demo_user["id"],
                "referred_user_id": ref1_user_id,
                "referral_id": ref1_id,
                "commission_type": "registration",
                "amount": 5.0,
                "rate_applied": 5.0,
                "is_paid": False,
                "created_at": now - timedelta(days=5),
                "description": "Registration commission for new user referral"
            }
            commissions_collection.insert_one(commission1)
            
            commission2 = {
                "id": str(uuid.uuid4()),
                "affiliate_user_id": demo_user["id"],
                "referred_user_id": ref1_user_id,
                "referral_id": ref1_id,
                "commission_type": "tournament_entry",
                "amount": 10.0,
                "rate_applied": 0.1,
                "tournament_id": "sample_tournament_1",
                "is_paid": False,
                "created_at": now - timedelta(days=3),
                "description": "Tournament entry commission (€100 × 10%)"
            }
            commissions_collection.insert_one(commission2)
            
            print("Sample affiliate data created")

@app.get("/api/reset-data")
async def reset_data():
    """Reset all sample data for testing"""
    try:
        # Clear existing data
        users_collection.delete_many({})
        competitions_collection.delete_many({})
        tournaments_collection.delete_many({})
        tournament_participants_collection.delete_many({})
        affiliates_collection.delete_many({})
        referrals_collection.delete_many({})
        commissions_collection.delete_many({})
        payouts_collection.delete_many({})
        wallet_balances_collection.delete_many({})
        transactions_collection.delete_many({})
        
        # Recreate sample data
        await startup_event()
        
        # Force create test user only if it doesn't exist
        if not users_collection.find_one({"username": "testuser"}):
            test_user = {
                "id": str(uuid.uuid4()),
                "username": "testuser",
                "email": "testuser@example.com",
                "password": hash_password("testpass123"),
                "country": "GR",
                "full_name": "Test User",
                "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
                "admin_role": "user",
                "is_blocked": False,
                "blocked_until": None,
                "blocked_reason": None,
                "created_at": datetime.utcnow(),
                "total_bets": 25,
                "won_bets": 18,
                "lost_bets": 7,
                "total_amount": 1200.0,
                "total_winnings": 1850.0,
                "avg_odds": 2.8,
                "rank": 0,
                "score": 85.5
            }
            users_collection.insert_one(test_user)
            print("Test user created: testuser")
        
        return {"message": "Data reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# GUILD SYSTEM API ENDPOINTS
# =============================================================================

@app.post("/api/guilds")
async def create_guild(guild_data: GuildCreate, user_id: str = Depends(verify_token)):
    """Create a new guild with the current user as leader"""
    try:
        # Check if guild name is unique
        existing_guild = guilds_collection.find_one({"name": guild_data.name})
        if existing_guild:
            raise HTTPException(status_code=400, detail="Guild name already exists")
            
        # Check if guild tag is unique
        existing_tag = guilds_collection.find_one({"tag": guild_data.tag.upper()})
        if existing_tag:
            raise HTTPException(status_code=400, detail="Guild tag already exists")
            
        # Check if user is already in a guild
        existing_member = guild_members_collection.find_one({"user_id": user_id})
        if existing_member:
            raise HTTPException(status_code=400, detail="You are already a member of another guild")
        
        # Get user info
        user = users_collection.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create guild
        guild_id = str(uuid.uuid4())
        new_guild = {
            "id": guild_id,
            "name": guild_data.name,
            "description": guild_data.description,
            "logo_url": guild_data.logo_url,
            "tag": guild_data.tag.upper(),
            "colors": guild_data.colors.dict(),
            "recruitment_open": guild_data.recruitment_open,
            "min_level": guild_data.min_level,
            "country": guild_data.country,
            "leader_id": user_id,
            "leader_username": user["username"],
            "member_count": 1,
            "max_members": 50,
            "level": 1,
            "experience": 0,
            "trophies": 0,
            "power_rating": 1000,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        guilds_collection.insert_one(new_guild)
        
        # Add user as guild leader
        guild_member = {
            "id": str(uuid.uuid4()),
            "guild_id": guild_id,
            "user_id": user_id,
            "username": user["username"],
            "role": GuildRole.LEADER,
            "joined_at": datetime.utcnow(),
            "contributions": 0,
            "last_active": datetime.utcnow()
        }
        guild_members_collection.insert_one(guild_member)
        
        # Initialize guild stats
        guild_stats = {
            "id": str(uuid.uuid4()),
            "guild_id": guild_id,
            "level": 1,
            "experience": 0,
            "power_rating": 1000,
            "total_wars": 0,
            "wars_won": 0,
            "wars_lost": 0,
            "tournament_victories": 0,
            "total_trophies": 0,
            "season_trophies": 0,
            "contributions_this_season": 0,
            "updated_at": datetime.utcnow()
        }
        guild_stats_collection.insert_one(guild_stats)
        
        return {"message": "Guild created successfully", "guild_id": guild_id, "guild": serialize_doc(new_guild)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating guild: {str(e)}")

def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == "_id":
                continue  # Skip MongoDB _id field
            elif hasattr(value, '__dict__'):
                result[key] = str(value)  # Convert ObjectId and other objects to string
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif isinstance(value, list):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc

@app.get("/api/guilds")
async def get_all_guilds(
    country: Optional[str] = None,
    recruitment_open: Optional[bool] = None,
    min_level: Optional[int] = None,
    search: Optional[str] = None
):
    """Get all guilds with optional filtering"""
    try:
        # Build filter query
        query = {}
        if country:
            query["country"] = country
        if recruitment_open is not None:
            query["recruitment_open"] = recruitment_open
        if min_level is not None:
            query["min_level"] = {"$lte": min_level}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"tag": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
            
        guilds = list(guilds_collection.find(query))
        
        # Add additional info for each guild
        for guild in guilds:
            # Get member count
            member_count = guild_members_collection.count_documents({"guild_id": guild["id"]})
            guild["member_count"] = member_count
            
            # Get guild stats
            guild_stat = guild_stats_collection.find_one({"guild_id": guild["id"]})
            if guild_stat:
                guild.update({
                    "level": guild_stat.get("level", 1),
                    "power_rating": guild_stat.get("power_rating", 1000),
                    "total_wars": guild_stat.get("total_wars", 0),
                    "wars_won": guild_stat.get("wars_won", 0),
                    "season_trophies": guild_stat.get("season_trophies", 0)
                })
        
        return {"guilds": serialize_doc(guilds), "total": len(guilds)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching guilds: {str(e)}")

@app.get("/api/guilds/rankings")
async def get_guild_rankings(
    country: Optional[str] = None,
    ranking_type: str = "power_rating",  # power_rating, trophies, wars_won
    limit: int = 50
):
    """Get guild rankings/leaderboard"""
    try:
        # Build aggregation pipeline
        pipeline = []
        
        # Match stage for country filter
        if country:
            pipeline.append({"$match": {"country": country}})
        
        # Lookup guild stats
        pipeline.extend([
            {"$lookup": {
                "from": "guild_stats",
                "localField": "id",
                "foreignField": "guild_id",
                "as": "stats"
            }},
            {"$unwind": {"path": "$stats", "preserveNullAndEmptyArrays": True}}
        ])
        
        # Sort based on ranking type
        sort_field = f"stats.{ranking_type}"
        if ranking_type == "power_rating":
            sort_order = -1
        elif ranking_type == "trophies":
            sort_field = "stats.season_trophies"
            sort_order = -1
        elif ranking_type == "wars_won":
            sort_order = -1
        else:
            sort_order = -1
            
        pipeline.extend([
            {"$sort": {sort_field: sort_order}},
            {"$limit": limit}
        ])
        
        # Project final fields
        pipeline.append({
            "$project": {
                "_id": 0,
                "id": 1,
                "name": 1,
                "tag": 1,
                "logo_url": 1,
                "country": 1,
                "member_count": 1,
                "level": "$stats.level",
                "power_rating": "$stats.power_rating",
                "season_trophies": "$stats.season_trophies",
                "total_wars": "$stats.total_wars",
                "wars_won": "$stats.wars_won",
                "wars_lost": "$stats.wars_lost",
                "tournament_victories": "$stats.tournament_victories"
            }
        })
        
        rankings = list(guilds_collection.aggregate(pipeline))
        
        # Add rank numbers
        for i, guild in enumerate(rankings):
            guild["rank"] = i + 1
        
        return {"rankings": serialize_doc(rankings), "ranking_type": ranking_type, "total": len(rankings)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching guild rankings: {str(e)}")

@app.get("/api/guilds/{guild_id}")
async def get_guild_details(guild_id: str):
    """Get detailed information about a specific guild"""
    try:
        # Get guild
        guild = guilds_collection.find_one({"id": guild_id})
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found")
        
        # Get guild members
        members = list(guild_members_collection.find({"guild_id": guild_id}))
        
        # Get user info for each member
        for member in members:
            user = users_collection.find_one({"id": member["user_id"]})
            if user:
                member["user_info"] = {
                    "full_name": user.get("full_name"),
                    "country": user.get("country"),
                    "profile_picture": user.get("profile_picture")
                }
        
        # Get guild stats
        guild_stat = guild_stats_collection.find_one({"guild_id": guild_id})
        if guild_stat:
            guild.update({
                "level": guild_stat.get("level", 1),
                "experience": guild_stat.get("experience", 0),
                "power_rating": guild_stat.get("power_rating", 1000),
                "total_wars": guild_stat.get("total_wars", 0),
                "wars_won": guild_stat.get("wars_won", 0),
                "wars_lost": guild_stat.get("wars_lost", 0),
                "tournament_victories": guild_stat.get("tournament_victories", 0),
                "total_trophies": guild_stat.get("total_trophies", 0),
                "season_trophies": guild_stat.get("season_trophies", 0)
            })
        
        # Get recent wars
        recent_wars = list(guild_wars_collection.find({
            "$or": [{"guild_1_id": guild_id}, {"guild_2_id": guild_id}]
        }).sort("created_at", -1).limit(5))
        
        guild["members"] = members
        guild["member_count"] = len(members)
        guild["recent_wars"] = recent_wars
        
        return {"guild": serialize_doc(guild)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching guild details: {str(e)}")

@app.post("/api/guilds/{guild_id}/invite")
async def invite_to_guild(guild_id: str, invite_data: GuildInvite, user_id: str = Depends(verify_token)):
    """Invite a player to join the guild (Leader/Officer only)"""
    try:
        # Verify guild exists and user has permission
        guild = guilds_collection.find_one({"id": guild_id})
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found")
        
        # Check if user has permission (leader or officer)
        member = guild_members_collection.find_one({"guild_id": guild_id, "user_id": user_id})
        if not member or member["role"] not in [GuildRole.LEADER, GuildRole.OFFICER]:
            raise HTTPException(status_code=403, detail="Only guild leaders and officers can invite members")
        
        # Check if target user exists
        target_user = users_collection.find_one({"username": invite_data.username})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if target user is already in a guild
        existing_member = guild_members_collection.find_one({"user_id": target_user["id"]})
        if existing_member:
            raise HTTPException(status_code=400, detail="User is already a member of another guild")
        
        # Check if invitation already exists
        existing_invite = guild_invitations_collection.find_one({
            "guild_id": guild_id,
            "user_id": target_user["id"],
            "status": "pending"
        })
        if existing_invite:
            raise HTTPException(status_code=400, detail="User already has a pending invitation")
        
        # Check guild member limit
        current_member_count = guild_members_collection.count_documents({"guild_id": guild_id})
        if current_member_count >= guild.get("max_members", 50):
            raise HTTPException(status_code=400, detail="Guild is at maximum capacity")
        
        # Get inviter info
        inviter = users_collection.find_one({"id": user_id})
        
        # Create invitation
        invitation_id = str(uuid.uuid4())
        invitation = {
            "id": invitation_id,
            "guild_id": guild_id,
            "guild_name": guild["name"],
            "guild_tag": guild["tag"],
            "user_id": target_user["id"],
            "username": target_user["username"],
            "inviter_id": user_id,
            "inviter_username": inviter["username"],
            "message": invite_data.message,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7)
        }
        
        guild_invitations_collection.insert_one(invitation)
        
        return {"message": f"Invitation sent to {invite_data.username}", "invitation_id": invitation_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending guild invitation: {str(e)}")

@app.get("/api/guilds/my-invitations")
async def get_my_guild_invitations(user_id: str = Depends(verify_token)):
    """Get user's pending guild invitations"""
    try:
        invitations = list(guild_invitations_collection.find({
            "user_id": user_id,
            "status": "pending",
            "expires_at": {"$gt": datetime.utcnow()}
        }))
        
        return {"invitations": serialize_doc(invitations)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching guild invitations: {str(e)}")

@app.post("/api/guilds/invitations/{invitation_id}/accept")
async def accept_guild_invitation(invitation_id: str, user_id: str = Depends(verify_token)):
    """Accept a guild invitation"""
    try:
        # Get invitation
        invitation = guild_invitations_collection.find_one({"id": invitation_id})
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        if invitation["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="This invitation is not for you")
        
        if invitation["status"] != "pending":
            raise HTTPException(status_code=400, detail="Invitation is no longer pending")
        
        if invitation["expires_at"] < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        # Check if user is already in a guild
        existing_member = guild_members_collection.find_one({"user_id": user_id})
        if existing_member:
            raise HTTPException(status_code=400, detail="You are already a member of another guild")
        
        # Get guild and check capacity
        guild = guilds_collection.find_one({"id": invitation["guild_id"]})
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found")
        
        current_member_count = guild_members_collection.count_documents({"guild_id": invitation["guild_id"]})
        if current_member_count >= guild.get("max_members", 50):
            raise HTTPException(status_code=400, detail="Guild is at maximum capacity")
        
        # Get user info
        user = users_collection.find_one({"id": user_id})
        
        # Add user to guild
        guild_member = {
            "id": str(uuid.uuid4()),
            "guild_id": invitation["guild_id"],
            "user_id": user_id,
            "username": user["username"],
            "role": GuildRole.MEMBER,
            "joined_at": datetime.utcnow(),
            "contributions": 0,
            "last_active": datetime.utcnow()
        }
        guild_members_collection.insert_one(guild_member)
        
        # Update invitation status
        guild_invitations_collection.update_one(
            {"id": invitation_id},
            {"$set": {"status": "accepted", "accepted_at": datetime.utcnow()}}
        )
        
        # Update guild member count
        guilds_collection.update_one(
            {"id": invitation["guild_id"]},
            {"$inc": {"member_count": 1}, "$set": {"updated_at": datetime.utcnow()}}
        )
        
        return {"message": f"Successfully joined guild {guild['name']}", "guild_id": invitation["guild_id"]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accepting guild invitation: {str(e)}")

@app.delete("/api/guilds/invitations/{invitation_id}")
async def decline_guild_invitation(invitation_id: str, user_id: str = Depends(verify_token)):
    """Decline a guild invitation"""
    try:
        # Get invitation
        invitation = guild_invitations_collection.find_one({"id": invitation_id})
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        if invitation["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="This invitation is not for you")
        
        if invitation["status"] != "pending":
            raise HTTPException(status_code=400, detail="Invitation is no longer pending")
        
        # Update invitation status
        guild_invitations_collection.update_one(
            {"id": invitation_id},
            {"$set": {"status": "declined", "declined_at": datetime.utcnow()}}
        )
        
        return {"message": "Guild invitation declined"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error declining guild invitation: {str(e)}")

# =============================================================================
# GUILD WARS SYSTEM API ENDPOINTS
# =============================================================================

@app.post("/api/guilds/{guild_id}/challenge")
async def challenge_guild_to_war(
    guild_id: str, 
    target_guild_data: dict,
    user_id: str = Depends(verify_token)
):
    """Challenge another guild to war (Leader/Officer only)"""
    try:
        # Verify challenging guild exists and user has permission
        guild = guilds_collection.find_one({"id": guild_id})
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found")
        
        member = guild_members_collection.find_one({"guild_id": guild_id, "user_id": user_id})
        if not member or member["role"] not in [GuildRole.LEADER, GuildRole.OFFICER]:
            raise HTTPException(status_code=403, detail="Only guild leaders and officers can challenge other guilds")
        
        # Verify target guild exists
        target_guild_id = target_guild_data.get("target_guild_id")
        target_guild = guilds_collection.find_one({"id": target_guild_id})
        if not target_guild:
            raise HTTPException(status_code=404, detail="Target guild not found")
        
        if guild_id == target_guild_id:
            raise HTTPException(status_code=400, detail="Cannot challenge your own guild")
        
        # Check if there's already an active war between these guilds
        existing_war = guild_wars_collection.find_one({
            "$or": [
                {"guild_1_id": guild_id, "guild_2_id": target_guild_id, "status": {"$in": [GuildWarStatus.PENDING, GuildWarStatus.ACTIVE]}},
                {"guild_1_id": target_guild_id, "guild_2_id": guild_id, "status": {"$in": [GuildWarStatus.PENDING, GuildWarStatus.ACTIVE]}}
            ]
        })
        if existing_war:
            raise HTTPException(status_code=400, detail="There is already an active war with this guild")
        
        # Create war challenge
        war_id = str(uuid.uuid4())
        war_type = target_guild_data.get("war_type", "classic")
        start_time = datetime.utcnow() + timedelta(hours=24)  # War starts 24h after challenge
        end_time = start_time + timedelta(days=3)  # War lasts 3 days
        
        # Define objectives based on war type
        objectives = []
        if war_type == "classic":
            objectives = [
                {"id": str(uuid.uuid4()), "name": "Tournament Wins", "description": "Win tournament matches", "points": 10},
                {"id": str(uuid.uuid4()), "name": "Member Activity", "description": "Guild members stay active", "points": 5},
                {"id": str(uuid.uuid4()), "name": "Recruitment", "description": "Successfully recruit new members", "points": 15}
            ]
        elif war_type == "blitz":
            objectives = [
                {"id": str(uuid.uuid4()), "name": "Quick Victories", "description": "Win quick tournaments", "points": 20},
                {"id": str(uuid.uuid4()), "name": "Speed Challenge", "description": "Complete objectives fast", "points": 25}
            ]
        
        guild_war = {
            "id": war_id,
            "guild_1_id": guild_id,
            "guild_1_name": guild["name"],
            "guild_2_id": target_guild_id,
            "guild_2_name": target_guild["name"],
            "status": GuildWarStatus.PENDING,
            "war_type": war_type,
            "start_time": start_time,
            "end_time": end_time,
            "objectives": objectives,
            "guild_1_score": 0,
            "guild_2_score": 0,
            "winner_guild_id": None,
            "created_at": datetime.utcnow(),
            "created_by": user_id
        }
        
        guild_wars_collection.insert_one(guild_war)
        
        return {"message": f"War challenge sent to {target_guild['name']}", "war_id": war_id, "war": guild_war}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating guild war challenge: {str(e)}")

@app.get("/api/guilds/{guild_id}/wars")
async def get_guild_wars(guild_id: str, status: Optional[str] = None):
    """Get guild wars"""
    try:
        # Build query
        query = {
            "$or": [{"guild_1_id": guild_id}, {"guild_2_id": guild_id}]
        }
        if status:
            query["status"] = status
        
        wars = list(guild_wars_collection.find(query).sort("created_at", -1))
        
        return {"wars": wars}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching guild wars: {str(e)}")

@app.post("/api/guild-wars/{war_id}/accept")
async def accept_guild_war(war_id: str, user_id: str = Depends(verify_token)):
    """Accept a guild war challenge (Leader/Officer only)"""
    try:
        # Get war
        war = guild_wars_collection.find_one({"id": war_id})
        if not war:
            raise HTTPException(status_code=404, detail="War not found")
        
        if war["status"] != GuildWarStatus.PENDING:
            raise HTTPException(status_code=400, detail="War is no longer pending")
        
        # Verify user has permission in the target guild
        member = guild_members_collection.find_one({"guild_id": war["guild_2_id"], "user_id": user_id})
        if not member or member["role"] not in [GuildRole.LEADER, GuildRole.OFFICER]:
            raise HTTPException(status_code=403, detail="Only guild leaders and officers can accept war challenges")
        
        # Activate the war
        guild_wars_collection.update_one(
            {"id": war_id},
            {"$set": {"status": GuildWarStatus.ACTIVE, "accepted_at": datetime.utcnow()}}
        )
        
        # Update guild stats
        guild_stats_collection.update_one(
            {"guild_id": war["guild_1_id"]},
            {"$inc": {"total_wars": 1}}
        )
        guild_stats_collection.update_one(
            {"guild_id": war["guild_2_id"]},
            {"$inc": {"total_wars": 1}}
        )
        
        return {"message": "Guild war accepted and activated", "war_id": war_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accepting guild war: {str(e)}")

@app.post("/api/guild-wars/{war_id}/decline")
async def decline_guild_war(war_id: str, user_id: str = Depends(verify_token)):
    """Decline a guild war challenge"""
    try:
        # Get war
        war = guild_wars_collection.find_one({"id": war_id})
        if not war:
            raise HTTPException(status_code=404, detail="War not found")
        
        if war["status"] != GuildWarStatus.PENDING:
            raise HTTPException(status_code=400, detail="War is no longer pending")
        
        # Verify user has permission in the target guild
        member = guild_members_collection.find_one({"guild_id": war["guild_2_id"], "user_id": user_id})
        if not member or member["role"] not in [GuildRole.LEADER, GuildRole.OFFICER]:
            raise HTTPException(status_code=403, detail="Only guild leaders and officers can decline war challenges")
        
        # Cancel the war
        guild_wars_collection.update_one(
            {"id": war_id},
            {"$set": {"status": GuildWarStatus.CANCELLED, "declined_at": datetime.utcnow()}}
        )
        
        return {"message": "Guild war challenge declined"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error declining guild war: {str(e)}")

@app.get("/api/guild-wars/active")
async def get_active_guild_wars():
    """Get all active guild wars"""
    try:
        wars = list(guild_wars_collection.find({"status": GuildWarStatus.ACTIVE}).sort("start_time", 1))
        
        return {"active_wars": wars}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching active guild wars: {str(e)}")

@app.post("/api/guild-wars/{war_id}/complete-objective")
async def complete_war_objective(
    war_id: str, 
    objective_data: dict,
    user_id: str = Depends(verify_token)
):
    """Complete a war objective (automated by system events)"""
    try:
        # Get war
        war = guild_wars_collection.find_one({"id": war_id})
        if not war:
            raise HTTPException(status_code=404, detail="War not found")
        
        if war["status"] != GuildWarStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="War is not active")
        
        objective_id = objective_data.get("objective_id")
        guild_id = objective_data.get("guild_id")
        
        # Verify guild is part of this war
        if guild_id not in [war["guild_1_id"], war["guild_2_id"]]:
            raise HTTPException(status_code=400, detail="Guild is not part of this war")
        
        # Find and update the objective
        objectives = war.get("objectives", [])
        objective_found = False
        points_awarded = 0
        
        for obj in objectives:
            if obj["id"] == objective_id and not obj.get("completed_by"):
                obj["completed_by"] = guild_id
                obj["completed_at"] = datetime.utcnow()
                points_awarded = obj["points"]
                objective_found = True
                break
        
        if not objective_found:
            raise HTTPException(status_code=400, detail="Objective not found or already completed")
        
        # Update war scores
        update_data = {"objectives": objectives}
        if guild_id == war["guild_1_id"]:
            update_data["guild_1_score"] = war["guild_1_score"] + points_awarded
        else:
            update_data["guild_2_score"] = war["guild_2_score"] + points_awarded
        
        guild_wars_collection.update_one({"id": war_id}, {"$set": update_data})
        
        return {"message": "Objective completed", "points_awarded": points_awarded}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error completing war objective: {str(e)}")

# =============================================================================
# GUILD TOURNAMENTS SYSTEM API ENDPOINTS  
# =============================================================================

@app.post("/api/guilds/{guild_id}/tournaments")
async def create_guild_tournament(
    guild_id: str,
    tournament_data: dict,
    user_id: str = Depends(verify_token)
):
    """Create a guild-exclusive tournament (Leader/Officer only)"""
    try:
        # Verify guild and permissions
        guild = guilds_collection.find_one({"id": guild_id})
        if not guild:
            raise HTTPException(status_code=404, detail="Guild not found")
        
        member = guild_members_collection.find_one({"guild_id": guild_id, "user_id": user_id})
        if not member or member["role"] not in [GuildRole.LEADER, GuildRole.OFFICER]:
            raise HTTPException(status_code=403, detail="Only guild leaders and officers can create guild tournaments")
        
        # Create tournament
        tournament_id = str(uuid.uuid4())
        guild_tournament = {
            "id": tournament_id,
            "name": tournament_data.get("name"),
            "description": tournament_data.get("description", ""),
            "guild_id": guild_id,
            "guild_name": guild["name"],
            "entry_fee": tournament_data.get("entry_fee", 0.0),
            "max_participants": tournament_data.get("max_participants", 16),
            "participants": [],
            "status": "upcoming",
            "start_time": datetime.fromisoformat(tournament_data.get("start_time")),
            "end_time": None,
            "prizes": tournament_data.get("prizes", []),
            "created_at": datetime.utcnow(),
            "created_by": user_id
        }
        
        guild_tournaments_collection.insert_one(guild_tournament)
        
        return {"message": "Guild tournament created successfully", "tournament_id": tournament_id, "tournament": serialize_doc(guild_tournament)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating guild tournament: {str(e)}")

@app.get("/api/guilds/{guild_id}/tournaments")
async def get_guild_tournaments(guild_id: str):
    """Get all tournaments for a guild"""
    try:
        tournaments = list(guild_tournaments_collection.find({"guild_id": guild_id}).sort("created_at", -1))
        
        return {"tournaments": serialize_doc(tournaments)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching guild tournaments: {str(e)}")

@app.post("/api/guild-tournaments/{tournament_id}/join")
async def join_guild_tournament(tournament_id: str, user_id: str = Depends(verify_token)):
    """Join a guild tournament (guild members only)"""
    try:
        # Get tournament
        tournament = guild_tournaments_collection.find_one({"id": tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Verify user is a member of the guild
        member = guild_members_collection.find_one({"guild_id": tournament["guild_id"], "user_id": user_id})
        if not member:
            raise HTTPException(status_code=403, detail="Only guild members can join guild tournaments")
        
        # Check if tournament is open for registration
        if tournament["status"] != "upcoming":
            raise HTTPException(status_code=400, detail="Tournament is not open for registration")
        
        # Check if user is already registered
        if user_id in tournament["participants"]:
            raise HTTPException(status_code=400, detail="You are already registered for this tournament")
        
        # Check capacity
        if len(tournament["participants"]) >= tournament["max_participants"]:
            raise HTTPException(status_code=400, detail="Tournament is full")
        
        # Add user to participants
        guild_tournaments_collection.update_one(
            {"id": tournament_id},
            {"$addToSet": {"participants": user_id}}
        )
        
        return {"message": "Successfully joined guild tournament"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error joining guild tournament: {str(e)}")

# ============================================================================
# LIVE CHAT SYSTEM - WEBSOCKET IMPLEMENTATION
# ============================================================================

# Chat Room Types
class ChatRoomType(str, Enum):
    GENERAL = "general"
    TOURNAMENT = "tournament"
    TEAM = "team"
    PRIVATE = "private"

# Pydantic Models for Chat
class ChatMessage(BaseModel):
    id: str
    room_id: str
    room_type: ChatRoomType
    sender_id: str
    sender_username: str
    message: str
    timestamp: datetime
    is_system: bool = False
    private_recipient: Optional[str] = None

class ChatRoom(BaseModel):
    id: str
    name: str
    type: ChatRoomType
    tournament_id: Optional[str] = None
    team_id: Optional[str] = None
    participants: List[str] = []
    created_at: datetime

class OnlineUser(BaseModel):
    user_id: str
    username: str
    admin_role: str = "user"
    current_room: str = "general"
    last_seen: datetime

# WebSocket Connection Manager
class ChatConnectionManager:
    def __init__(self):
        # WebSocket connections: {user_id: websocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # Online users: {user_id: OnlineUser}
        self.online_users: Dict[str, OnlineUser] = {}
        # Chat rooms: {room_id: ChatRoom}
        self.chat_rooms: Dict[str, ChatRoom] = {}
        # Room messages: {room_id: [ChatMessage]}
        self.room_messages: Dict[str, List[ChatMessage]] = {}
        
        # Initialize default general chat room
        self.initialize_default_rooms()
    
    def initialize_default_rooms(self):
        """Initialize default chat rooms"""
        general_room = ChatRoom(
            id="general",
            name="General Chat",
            type=ChatRoomType.GENERAL,
            participants=[],
            created_at=datetime.utcnow()
        )
        self.chat_rooms["general"] = general_room
        self.room_messages["general"] = []
    
    async def connect(self, websocket: WebSocket, user_id: str, username: str, admin_role: str = "user"):
        """Connect a user to the chat system"""
        await websocket.accept()
        
        # Store connection
        self.active_connections[user_id] = websocket
        
        # Add to online users
        online_user = OnlineUser(
            user_id=user_id,
            username=username,
            admin_role=admin_role,
            current_room="general",
            last_seen=datetime.utcnow()
        )
        self.online_users[user_id] = online_user
        
        # Add to general room
        if "general" not in self.chat_rooms:
            self.initialize_default_rooms()
        
        if user_id not in self.chat_rooms["general"].participants:
            self.chat_rooms["general"].participants.append(user_id)
        
        # Send system message about user joining
        join_message = ChatMessage(
            id=str(uuid.uuid4()),
            room_id="general",
            room_type=ChatRoomType.GENERAL,
            sender_id="system",
            sender_username="System",
            message=f"{username} joined the chat",
            timestamp=datetime.utcnow(),
            is_system=True
        )
        
        # Add to room messages
        self.room_messages["general"].append(join_message)
        
        # Broadcast to all users in general room
        await self.broadcast_to_room("general", join_message.dict())
        
        # Send online users list to the new user
        await self.send_online_users_update()
        
        # Send available rooms to the new user
        await self.send_user_rooms_update(user_id)
    
    async def disconnect(self, user_id: str):
        """Disconnect a user from the chat system"""
        if user_id in self.active_connections:
            username = self.online_users.get(user_id, {}).username if user_id in self.online_users else "Unknown"
            
            # Remove from active connections
            del self.active_connections[user_id]
            
            # Remove from online users
            if user_id in self.online_users:
                del self.online_users[user_id]
            
            # Remove from all room participants
            for room in self.chat_rooms.values():
                if user_id in room.participants:
                    room.participants.remove(user_id)
            
            # Send system message about user leaving
            if username != "Unknown":
                leave_message = ChatMessage(
                    id=str(uuid.uuid4()),
                    room_id="general",
                    room_type=ChatRoomType.GENERAL,
                    sender_id="system",
                    sender_username="System",
                    message=f"{username} left the chat",
                    timestamp=datetime.utcnow(),
                    is_system=True
                )
                
                # Add to room messages
                self.room_messages["general"].append(leave_message)
                
                # Broadcast to all users in general room
                await self.broadcast_to_room("general", leave_message.dict())
            
            # Update online users list
            await self.send_online_users_update()
    
    async def send_personal_message(self, websocket: WebSocket, message: dict):
        """Send message to a specific user"""
        await websocket.send_json(message)
    
    async def broadcast_to_room(self, room_id: str, message: dict):
        """Broadcast message to all users in a room"""
        if room_id in self.chat_rooms:
            room = self.chat_rooms[room_id]
            for user_id in room.participants:
                if user_id in self.active_connections:
                    try:
                        await self.active_connections[user_id].send_json(message)
                    except:
                        # Connection might be closed
                        pass
    
    async def send_private_message(self, sender_id: str, recipient_id: str, message: ChatMessage):
        """Send private message between two users"""
        # Send to sender
        if sender_id in self.active_connections:
            try:
                await self.active_connections[sender_id].send_json(message.dict())
            except:
                pass
        
        # Send to recipient
        if recipient_id in self.active_connections:
            try:
                await self.active_connections[recipient_id].send_json(message.dict())
            except:
                pass
    
    async def send_online_users_update(self):
        """Send updated online users list to all connected users"""
        online_users_list = [
            {
                "user_id": user.user_id,
                "username": user.username,
                "admin_role": user.admin_role,
                "current_room": user.current_room,
                "last_seen": user.last_seen.isoformat()
            }
            for user in self.online_users.values()
        ]
        
        update_message = {
            "type": "online_users_update",
            "data": online_users_list
        }
        
        # Send to all connected users
        for user_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(update_message)
            except:
                pass
    
    async def send_user_rooms_update(self, user_id: str):
        """Send available rooms to a specific user"""
        if user_id not in self.active_connections:
            return
        
        user_rooms = []
        
        # Add general room
        user_rooms.append({
            "id": "general",
            "name": "General Chat",
            "type": "general",
            "participant_count": len(self.chat_rooms["general"].participants) if "general" in self.chat_rooms else 0
        })
        
        # Add tournament rooms for tournaments the user is in
        user_tournaments = list(tournaments_collection.find({"participants": user_id}))
        for tournament in user_tournaments:
            room_id = f"tournament_{tournament['tournament_id']}"
            if room_id not in self.chat_rooms:
                self.create_tournament_room(tournament['tournament_id'], tournament['name'])
            
            user_rooms.append({
                "id": room_id,
                "name": f"Tournament: {tournament['name']}",
                "type": "tournament",
                "tournament_id": tournament['tournament_id'],
                "participant_count": len(self.chat_rooms[room_id].participants) if room_id in self.chat_rooms else 0
            })
        
        # Add team rooms for teams the user is in
        user_teams = list(teams_collection.find({"$or": [{"captain_id": user_id}, {"members.user_id": user_id}]}))
        for team in user_teams:
            room_id = f"team_{team['team_id']}"
            if room_id not in self.chat_rooms:
                self.create_team_room(team['team_id'], team['name'])
            
            user_rooms.append({
                "id": room_id,
                "name": f"Team: {team['name']}",
                "type": "team",
                "team_id": team['team_id'],
                "participant_count": len(self.chat_rooms[room_id].participants) if room_id in self.chat_rooms else 0
            })
        
        rooms_update = {
            "type": "user_rooms_update",
            "data": user_rooms
        }
        
        try:
            await self.active_connections[user_id].send_json(rooms_update)
        except:
            pass
    
    def create_tournament_room(self, tournament_id: str, tournament_name: str):
        """Create a tournament-specific chat room"""
        room_id = f"tournament_{tournament_id}"
        
        tournament_room = ChatRoom(
            id=room_id,
            name=f"Tournament: {tournament_name}",
            type=ChatRoomType.TOURNAMENT,
            tournament_id=tournament_id,
            participants=[],
            created_at=datetime.utcnow()
        )
        
        self.chat_rooms[room_id] = tournament_room
        self.room_messages[room_id] = []
    
    def create_team_room(self, team_id: str, team_name: str):
        """Create a team-specific chat room"""
        room_id = f"team_{team_id}"
        
        team_room = ChatRoom(
            id=room_id,
            name=f"Team: {team_name}",
            type=ChatRoomType.TEAM,
            team_id=team_id,
            participants=[],
            created_at=datetime.utcnow()
        )
        
        self.chat_rooms[room_id] = team_room
        self.room_messages[room_id] = []
    
    async def join_room(self, user_id: str, room_id: str):
        """Join a user to a specific room"""
        if user_id not in self.online_users:
            return
        
        if room_id not in self.chat_rooms:
            return
        
        # Update user's current room
        self.online_users[user_id].current_room = room_id
        
        # Add to room participants
        if user_id not in self.chat_rooms[room_id].participants:
            self.chat_rooms[room_id].participants.append(user_id)
        
        # Send recent messages from this room (last 50 messages)
        if room_id in self.room_messages:
            recent_messages = self.room_messages[room_id][-50:]  # Last 50 messages
            for message in recent_messages:
                if user_id in self.active_connections:
                    try:
                        await self.active_connections[user_id].send_json(message.dict())
                    except:
                        pass
        
        # Update rooms for this user
        await self.send_user_rooms_update(user_id)
    
    async def handle_message(self, user_id: str, message_data: dict):
        """Handle incoming chat message"""
        if user_id not in self.online_users:
            return
        
        user = self.online_users[user_id]
        message_type = message_data.get("type", "room_message")
        
        if message_type == "room_message":
            await self.handle_room_message(user_id, message_data)
        elif message_type == "private_message":
            await self.handle_private_message(user_id, message_data)
        elif message_type == "join_room":
            await self.join_room(user_id, message_data.get("room_id"))
        elif message_type == "admin_delete_message":
            await self.handle_admin_delete_message(user_id, message_data)
        elif message_type == "admin_ban_user":
            await self.handle_admin_ban_user(user_id, message_data)
    
    async def handle_room_message(self, user_id: str, message_data: dict):
        """Handle room message"""
        user = self.online_users[user_id]
        room_id = message_data.get("room_id", user.current_room)
        message_text = message_data.get("message", "").strip()
        
        if not message_text or room_id not in self.chat_rooms:
            return
        
        # Create message
        chat_message = ChatMessage(
            id=str(uuid.uuid4()),
            room_id=room_id,
            room_type=self.chat_rooms[room_id].type,
            sender_id=user_id,
            sender_username=user.username,
            message=message_text,
            timestamp=datetime.utcnow(),
            is_system=False
        )
        
        # Add to room messages
        if room_id not in self.room_messages:
            self.room_messages[room_id] = []
        
        self.room_messages[room_id].append(chat_message)
        
        # Keep only last 100 messages per room (since no history needed)
        if len(self.room_messages[room_id]) > 100:
            self.room_messages[room_id] = self.room_messages[room_id][-100:]
        
        # Broadcast to room
        await self.broadcast_to_room(room_id, chat_message.dict())
    
    async def handle_private_message(self, user_id: str, message_data: dict):
        """Handle private message"""
        user = self.online_users[user_id]
        recipient_id = message_data.get("recipient_id")
        message_text = message_data.get("message", "").strip()
        
        if not message_text or not recipient_id:
            return
        
        # Create private message
        private_message = ChatMessage(
            id=str(uuid.uuid4()),
            room_id="private",
            room_type=ChatRoomType.PRIVATE,
            sender_id=user_id,
            sender_username=user.username,
            message=message_text,
            timestamp=datetime.utcnow(),
            is_system=False,
            private_recipient=recipient_id
        )
        
        # Send to both users
        await self.send_private_message(user_id, recipient_id, private_message)
    
    async def handle_admin_delete_message(self, user_id: str, message_data: dict):
        """Handle admin message deletion"""
        user = self.online_users[user_id]
        
        # Check if user is admin
        if user.admin_role not in ["admin", "super_admin", "god"]:
            return
        
        message_id = message_data.get("message_id")
        room_id = message_data.get("room_id")
        
        if not message_id or room_id not in self.room_messages:
            return
        
        # Find and remove message
        messages = self.room_messages[room_id]
        for i, msg in enumerate(messages):
            if msg.id == message_id:
                del messages[i]
                
                # Send deletion notification
                delete_notification = {
                    "type": "message_deleted",
                    "message_id": message_id,
                    "room_id": room_id,
                    "deleted_by": user.username
                }
                
                await self.broadcast_to_room(room_id, delete_notification)
                break
    
    async def handle_admin_ban_user(self, user_id: str, message_data: dict):
        """Handle admin user ban"""
        user = self.online_users[user_id]
        
        # Check if user is admin
        if user.admin_role not in ["admin", "super_admin", "god"]:
            return
        
        target_user_id = message_data.get("target_user_id")
        reason = message_data.get("reason", "No reason provided")
        
        if not target_user_id or target_user_id not in self.online_users:
            return
        
        target_user = self.online_users[target_user_id]
        
        # Send ban notification to target user
        ban_notification = {
            "type": "user_banned",
            "reason": reason,
            "banned_by": user.username
        }
        
        if target_user_id in self.active_connections:
            try:
                await self.active_connections[target_user_id].send_json(ban_notification)
            except:
                pass
        
        # Disconnect banned user
        await self.disconnect(target_user_id)
        
        # Send system message to general room
        ban_message = ChatMessage(
            id=str(uuid.uuid4()),
            room_id="general",
            room_type=ChatRoomType.GENERAL,
            sender_id="system",
            sender_username="System",
            message=f"{target_user.username} was banned by {user.username}. Reason: {reason}",
            timestamp=datetime.utcnow(),
            is_system=True
        )
        
        self.room_messages["general"].append(ban_message)
        await self.broadcast_to_room("general", ban_message.dict())

# Global chat manager instance
chat_manager = ChatConnectionManager()

# WebSocket endpoint for chat
@app.websocket("/ws/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    """WebSocket endpoint for live chat"""
    user_id = None
    try:
        # Get user info from query params or headers
        query_params = websocket.query_params
        token = query_params.get("token")
        
        if not token:
            await websocket.close(code=4001, reason="Authentication required")
            return
        
        # Verify JWT token
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            
            if not user_id:
                await websocket.close(code=4001, reason="Invalid token")
                return
            
            # Get user details - handle both old and new user ID formats
            user = users_collection.find_one({"$or": [{"user_id": user_id}, {"id": user_id}]})
            if not user:
                await websocket.close(code=4001, reason="User not found")
                return
            
            username = user.get("username", "Unknown")
            admin_role = user.get("admin_role", "user")
            
        except jwt.ExpiredSignatureError:
            await websocket.close(code=4001, reason="Token expired")
            return
        except jwt.InvalidTokenError:
            await websocket.close(code=4001, reason="Invalid token")
            return
        
        # Connect user to chat
        await chat_manager.connect(websocket, user_id, username, admin_role)
        
        # Listen for messages
        while True:
            try:
                data = await websocket.receive_json()
                await chat_manager.handle_message(user_id, data)
            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"Error handling message: {e}")
                break
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if user_id:
            await chat_manager.disconnect(user_id)

# REST API endpoints for chat management
@app.get("/api/chat/rooms")
async def get_user_chat_rooms(user_id: str = Depends(verify_token)):
    """Get available chat rooms for current user"""
    
    user_rooms = []
    
    # Add general room
    user_rooms.append({
        "id": "general",
        "name": "General Chat",
        "type": "general",
        "participant_count": len(chat_manager.chat_rooms["general"].participants) if "general" in chat_manager.chat_rooms else 0
    })
    
    # Add tournament rooms
    user_tournaments = list(tournaments_collection.find({"participants": user_id}))
    for tournament in user_tournaments:
        room_id = f"tournament_{tournament['tournament_id']}"
        user_rooms.append({
            "id": room_id,
            "name": f"Tournament: {tournament['name']}",
            "type": "tournament",
            "tournament_id": tournament['tournament_id'],
            "participant_count": len(chat_manager.chat_rooms[room_id].participants) if room_id in chat_manager.chat_rooms else 0
        })
    
    # Add team rooms
    user_teams = list(teams_collection.find({"$or": [{"captain_id": user_id}, {"members.user_id": user_id}]}))
    for team in user_teams:
        room_id = f"team_{team['id']}"
        user_rooms.append({
            "id": room_id,
            "name": f"Team: {team['name']}",
            "type": "team",
            "team_id": team['id'],
            "participant_count": len(chat_manager.chat_rooms[room_id].participants) if room_id in chat_manager.chat_rooms else 0
        })
    
    return CustomJSONResponse(content={"rooms": user_rooms})

@app.post("/api/chat/admin/ban-user")
async def ban_user_from_chat(
    request: dict,
    user_id: str = Depends(verify_token)
):
    """Admin endpoint to ban user from chat"""
    # Get user details
    user = users_collection.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check admin permissions
    if user.get("admin_role") not in ["admin", "super_admin", "god"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    target_user_id = request.get("user_id")
    reason = request.get("reason", "No reason provided")
    
    if not target_user_id:
        raise HTTPException(status_code=400, detail="User ID required")
    
    # Check if user is online
    if target_user_id not in chat_manager.online_users:
        raise HTTPException(status_code=404, detail="User not found in chat")
    
    # Perform ban
    await chat_manager.handle_admin_ban_user(user_id, {
        "target_user_id": target_user_id,
        "reason": reason
    })
    
    return CustomJSONResponse(content={"message": "User banned successfully"})

@app.get("/api/chat/stats")
async def get_chat_statistics(user_id: str = Depends(verify_token)):
    """Get chat statistics"""
    # Get user details
    user = users_collection.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check admin permissions
    if user.get("admin_role") not in ["admin", "super_admin", "god"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    stats = {
        "total_online_users": len(chat_manager.online_users),
        "total_rooms": len(chat_manager.chat_rooms),
        "rooms_by_type": {},
        "messages_by_room": {}
    }
    
    # Count rooms by type
    for room in chat_manager.chat_rooms.values():
        room_type = room.type
        if room_type not in stats["rooms_by_type"]:
            stats["rooms_by_type"][room_type] = 0
        stats["rooms_by_type"][room_type] += 1
    
    # Count messages by room
    for room_id, messages in chat_manager.room_messages.items():
        stats["messages_by_room"][room_id] = len(messages)
    
    return CustomJSONResponse(content=stats)

# Global chat manager instance
chat_manager = ChatConnectionManager()

# Simple in-memory storage for chat messages (since WebSocket is not working)
chat_messages_storage = {}
online_users_storage = {}

@app.post("/api/chat/send-message")
async def send_chat_message(
    request: dict,
    user_id: str = Depends(verify_token)
):
    """Send a chat message via REST API"""
    # Get user details
    user = users_collection.find_one({"$or": [{"user_id": user_id}, {"id": user_id}]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    room_id = request.get("room_id", "general")
    message = request.get("message", "").strip()
    
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # Create message object
    message_data = {
        "id": str(uuid.uuid4()),
        "room_id": room_id,
        "sender_id": user_id,
        "sender_username": user.get("username", "Unknown"),
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "is_system": False
    }
    
    # Store message in memory
    if room_id not in chat_messages_storage:
        chat_messages_storage[room_id] = []
    
    chat_messages_storage[room_id].append(message_data)
    
    # Keep only last 50 messages per room
    if len(chat_messages_storage[room_id]) > 50:
        chat_messages_storage[room_id] = chat_messages_storage[room_id][-50:]
    
    # Update online users
    online_users_storage[user_id] = {
        "user_id": user_id,
        "username": user.get("username", "Unknown"),
        "admin_role": user.get("admin_role", "user"),
        "current_room": room_id,
        "last_seen": datetime.utcnow().isoformat()
    }
    
    return CustomJSONResponse(content={"message": "Message sent successfully", "data": message_data})

@app.get("/api/chat/messages/{room_id}")
async def get_chat_messages(
    room_id: str,
    user_id: str = Depends(verify_token)
):
    """Get recent chat messages for a room"""
    messages = chat_messages_storage.get(room_id, [])
    return CustomJSONResponse(content={"messages": messages})

@app.get("/api/chat/online-users")
async def get_online_users(user_id: str = Depends(verify_token)):
    """Get list of online users"""
    # Clean up old users (older than 1 minute)
    now = datetime.utcnow()
    active_users = []
    
    for user_data in online_users_storage.values():
        try:
            last_seen = datetime.fromisoformat(user_data["last_seen"])
            if (now - last_seen).total_seconds() < 60:  # 1 minute
                active_users.append(user_data)
        except:
            pass
    
    # Update current user as online
    user = users_collection.find_one({"$or": [{"user_id": user_id}, {"id": user_id}]})
    if user:
        online_users_storage[user_id] = {
            "user_id": user_id,
            "username": user.get("username", "Unknown"),
            "admin_role": user.get("admin_role", "user"),
            "current_room": "general",
            "last_seen": datetime.utcnow().isoformat()
        }
        
        # Add current user to active users if not already there
        if not any(u["user_id"] == user_id for u in active_users):
            active_users.append(online_users_storage[user_id])
    
    return CustomJSONResponse(content={"online_users": active_users})

@app.delete("/api/chat/messages/{message_id}")
async def delete_chat_message(
    message_id: str,
    user_id: str = Depends(verify_token)
):
    """Delete a chat message (Admin only)"""
    # Get user details
    user = users_collection.find_one({"$or": [{"user_id": user_id}, {"id": user_id}]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check admin permissions
    if user.get("admin_role") not in ["admin", "super_admin", "god"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Find and delete message from all rooms
    deleted = False
    for room_id, messages in chat_messages_storage.items():
        for i, msg in enumerate(messages):
            if msg["id"] == message_id:
                del messages[i]
                deleted = True
                break
        if deleted:
            break
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return CustomJSONResponse(content={"message": "Message deleted successfully"})

# Helper function to clean MongoDB documents
def clean_mongo_docs(docs):
    """Clean MongoDB documents for JSON serialization"""
    if not docs:
        return []
    
    cleaned_docs = []
    for doc in docs:
        cleaned_doc = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                cleaned_doc[key] = str(value)
            elif isinstance(value, datetime):
                cleaned_doc[key] = value.isoformat()
            else:
                cleaned_doc[key] = value
        cleaned_docs.append(cleaned_doc)
    
    return cleaned_docs

# ============================================================================
# ADMIN AFFILIATE MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/api/admin/affiliate/requests")
async def get_affiliate_requests(user_id: str = Depends(verify_token)):
    """Get all affiliate requests for admin review"""
    # Get user details
    user = users_collection.find_one({"$or": [{"user_id": user_id}, {"id": user_id}]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check admin permissions
    if user.get("admin_role") not in ["admin", "super_admin", "god"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Get all affiliate applications
        affiliate_requests = list(affiliate_applications_collection.find({}))
        
        # Get user details for each request
        for request in affiliate_requests:
            user_data = users_collection.find_one({"$or": [{"user_id": request["user_id"]}, {"id": request["user_id"]}]})
            if user_data:
                request["user_details"] = {
                    "username": user_data.get("username", "Unknown"),
                    "email": user_data.get("email", "Unknown"),
                    "full_name": user_data.get("full_name", "Unknown"),
                    "created_at": user_data.get("created_at", "Unknown")
                }
        
        return CustomJSONResponse(content={"requests": clean_mongo_docs(affiliate_requests)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/affiliate/approve/{user_id}")
async def approve_affiliate_request(
    user_id: str,
    request: dict,
    admin_user_id: str = Depends(verify_token)
):
    """Approve affiliate request and set bonuses"""
    # Get admin user details
    admin_user = users_collection.find_one({"$or": [{"user_id": admin_user_id}, {"id": admin_user_id}]})
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Check admin permissions
    if admin_user.get("admin_role") not in ["admin", "super_admin", "god"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Update affiliate application
        affiliate_applications_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "status": "approved",
                    "approved_by": admin_user_id,
                    "approved_at": datetime.utcnow(),
                    "referral_bonus": request.get("referral_bonus", 5.0),
                    "deposit_bonus": request.get("deposit_bonus", 10.0),
                    "bonus_type": request.get("bonus_type", "registration"),
                    "is_active": True
                }
            }
        )
        
        # Update user role to affiliate
        users_collection.update_one(
            {"$or": [{"user_id": user_id}, {"id": user_id}]},
            {"$set": {"admin_role": "affiliate"}}
        )
        
        return CustomJSONResponse(content={"message": "Affiliate request approved successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/affiliate/reject/{user_id}")
async def reject_affiliate_request(
    user_id: str,
    request: dict,
    admin_user_id: str = Depends(verify_token)
):
    """Reject affiliate request"""
    # Get admin user details
    admin_user = users_collection.find_one({"$or": [{"user_id": admin_user_id}, {"id": admin_user_id}]})
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Check admin permissions
    if admin_user.get("admin_role") not in ["admin", "super_admin", "god"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Update affiliate application
        affiliate_applications_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "status": "rejected",
                    "rejected_by": admin_user_id,
                    "rejected_at": datetime.utcnow(),
                    "rejection_reason": request.get("reason", "No reason provided")
                }
            }
        )
        
        return CustomJSONResponse(content={"message": "Affiliate request rejected"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/affiliate/stats")
async def get_admin_affiliate_stats(admin_user_id: str = Depends(verify_token)):
    """Get affiliate statistics for admin"""
    # Get admin user details
    admin_user = users_collection.find_one({"$or": [{"user_id": admin_user_id}, {"id": admin_user_id}]})
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Check admin permissions
    if admin_user.get("admin_role") not in ["admin", "super_admin", "god"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Get affiliate statistics
        total_affiliates = affiliate_applications_collection.count_documents({"status": "approved"})
        pending_requests = affiliate_applications_collection.count_documents({"status": "pending"})
        total_referrals = referrals_collection.count_documents({})
        total_commissions = commissions_collection.count_documents({})
        
        # Calculate total commission amount
        commission_pipeline = [
            {"$group": {"_id": None, "total": {"$sum": "$commission_amount"}}}
        ]
        commission_result = list(commissions_collection.aggregate(commission_pipeline))
        total_commission_amount = commission_result[0]["total"] if commission_result else 0.0
        
        # Get recent affiliate activity
        recent_referrals = list(referrals_collection.find().sort("created_at", -1).limit(5))
        recent_commissions = list(commissions_collection.find().sort("created_at", -1).limit(5))
        
        return CustomJSONResponse(content={
            "total_affiliates": total_affiliates,
            "pending_requests": pending_requests,
            "total_referrals": total_referrals,
            "total_commissions": total_commissions,
            "total_commission_amount": total_commission_amount,
            "recent_referrals": clean_mongo_docs(recent_referrals),
            "recent_commissions": clean_mongo_docs(recent_commissions)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/affiliate/users")
async def get_all_affiliate_users(admin_user_id: str = Depends(verify_token)):
    """Get all approved affiliate users"""
    # Get admin user details
    admin_user = users_collection.find_one({"$or": [{"user_id": admin_user_id}, {"id": admin_user_id}]})
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Check admin permissions
    if admin_user.get("admin_role") not in ["admin", "super_admin", "god"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Get all approved affiliate applications
        affiliate_apps = list(affiliate_applications_collection.find({"status": "approved"}))
        
        # Get user details and referral stats for each affiliate
        affiliate_users = []
        for app in affiliate_apps:
            user_data = users_collection.find_one({"$or": [{"user_id": app["user_id"]}, {"id": app["user_id"]}]})
            if user_data:
                # Get referral stats
                referral_count = referrals_collection.count_documents({"referrer_id": app["user_id"]})
                commission_count = commissions_collection.count_documents({"affiliate_id": app["user_id"]})
                
                # Calculate total earnings
                earnings_pipeline = [
                    {"$match": {"affiliate_id": app["user_id"]}},
                    {"$group": {"_id": None, "total": {"$sum": "$commission_amount"}}}
                ]
                earnings_result = list(commissions_collection.aggregate(earnings_pipeline))
                total_earnings = earnings_result[0]["total"] if earnings_result else 0.0
                
                affiliate_users.append({
                    "user_id": app["user_id"],
                    "username": user_data.get("username", "Unknown"),
                    "email": user_data.get("email", "Unknown"),
                    "full_name": user_data.get("full_name", "Unknown"),
                    "referral_code": app.get("referral_code", ""),
                    "referral_bonus": app.get("referral_bonus", 5.0),
                    "deposit_bonus": app.get("deposit_bonus", 10.0),
                    "bonus_type": app.get("bonus_type", "registration"),
                    "is_active": app.get("is_active", True),
                    "approved_at": app.get("approved_at", "Unknown"),
                    "referral_count": referral_count,
                    "commission_count": commission_count,
                    "total_earnings": total_earnings
                })
        
        return CustomJSONResponse(content={"affiliate_users": affiliate_users})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/affiliate/bonuses/{user_id}")
async def update_affiliate_bonuses(
    user_id: str,
    request: dict,
    admin_user_id: str = Depends(verify_token)
):
    """Update affiliate bonuses"""
    # Get admin user details
    admin_user = users_collection.find_one({"$or": [{"user_id": admin_user_id}, {"id": admin_user_id}]})
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Check admin permissions
    if admin_user.get("admin_role") not in ["admin", "super_admin", "god"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Update affiliate bonuses
        affiliate_applications_collection.update_one(
            {"user_id": user_id, "status": "approved"},
            {
                "$set": {
                    "referral_bonus": request.get("referral_bonus", 5.0),
                    "deposit_bonus": request.get("deposit_bonus", 10.0),
                    "bonus_type": request.get("bonus_type", "registration"),
                    "is_active": request.get("is_active", True),
                    "updated_by": admin_user_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return CustomJSONResponse(content={"message": "Affiliate bonuses updated successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# PAYMENT SYSTEM HELPER FUNCTIONS
# =============================================================================

def create_payment_session(user_id: str, tournament_id: str, amount: float, provider: PaymentProvider) -> dict:
    """Create a payment session for tournament entry"""
    try:
        session_id = str(uuid.uuid4())
        
        # Get tournament details
        tournament = tournaments_collection.find_one({"id": tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Create payment session record
        session_data = {
            "id": session_id,
            "user_id": user_id,
            "tournament_id": tournament_id,
            "amount": amount,
            "currency": "USD",
            "provider": provider,
            "status": PaymentStatus.PENDING,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(hours=1),
            "metadata": {
                "tournament_name": tournament.get("name", "Tournament"),
                "tournament_type": tournament.get("type", "single_elimination")
            }
        }
        
        # Create provider-specific session
        if provider == PaymentProvider.STRIPE:
            return create_stripe_session(session_data)
        elif provider == PaymentProvider.PAYPAL:
            return create_paypal_session(session_data)
        elif provider == PaymentProvider.COINBASE:
            return create_coinbase_session(session_data)
        else:
            raise HTTPException(status_code=400, detail="Invalid payment provider")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating payment session: {str(e)}")

def create_stripe_session(session_data: dict) -> dict:
    """Create Stripe checkout session"""
    try:
        if not STRIPE_SECRET_KEY:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        # Create Stripe checkout session
        stripe_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'Tournament Entry - {session_data["metadata"]["tournament_name"]}',
                        'description': f'Entry fee for {session_data["metadata"]["tournament_name"]}',
                    },
                    'unit_amount': int(session_data["amount"] * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{FRONTEND_URL}/payment/cancel?session_id={session_data["id"]}',
            metadata={
                'session_id': session_data["id"],
                'user_id': session_data["user_id"],
                'tournament_id': session_data["tournament_id"]
            }
        )
        
        # Update session with Stripe data
        session_data["provider_session_id"] = stripe_session.id
        session_data["checkout_url"] = stripe_session.url
        
        # Save to database
        payment_sessions_collection.insert_one(session_data)
        
        return {
            "session_id": session_data["id"],
            "checkout_url": stripe_session.url,
            "provider": "stripe"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating Stripe session: {str(e)}")

def create_paypal_session(session_data: dict) -> dict:
    """Create PayPal payment session"""
    try:
        if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
            raise HTTPException(status_code=500, detail="PayPal not configured")
        
        # Create PayPal payment
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "transactions": [{
                "amount": {
                    "total": str(session_data["amount"]),
                    "currency": "USD"
                },
                "description": f'Tournament Entry - {session_data["metadata"]["tournament_name"]}',
                "custom": session_data["id"]  # Our session ID
            }],
            "redirect_urls": {
                "return_url": f'{FRONTEND_URL}/payment/success?session_id={session_data["id"]}',
                "cancel_url": f'{FRONTEND_URL}/payment/cancel?session_id={session_data["id"]}'
            }
        })
        
        if payment.create():
            # Find approval URL
            approval_url = None
            for link in payment.links:
                if link.rel == "approval_url":
                    approval_url = link.href
                    break
            
            if not approval_url:
                raise HTTPException(status_code=500, detail="PayPal approval URL not found")
            
            # Update session with PayPal data
            session_data["provider_session_id"] = payment.id
            session_data["checkout_url"] = approval_url
            
            # Save to database
            payment_sessions_collection.insert_one(session_data)
            
            return {
                "session_id": session_data["id"],
                "checkout_url": approval_url,
                "provider": "paypal"
            }
        else:
            raise HTTPException(status_code=500, detail=f"PayPal payment creation failed: {payment.error}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating PayPal session: {str(e)}")

def create_coinbase_session(session_data: dict) -> dict:
    """Create Coinbase Commerce session"""
    try:
        if not coinbase_client:
            raise HTTPException(status_code=500, detail="Coinbase not configured")
        
        # Create Coinbase charge
        charge = coinbase_client.charge.create(
            name=f'Tournament Entry - {session_data["metadata"]["tournament_name"]}',
            description=f'Entry fee for {session_data["metadata"]["tournament_name"]}',
            pricing_type='fixed_price',
            local_price={
                'amount': str(session_data["amount"]),
                'currency': 'USD'
            },
            metadata={
                'session_id': session_data["id"],
                'user_id': session_data["user_id"],
                'tournament_id': session_data["tournament_id"]
            },
            redirect_url=f'{FRONTEND_URL}/payment/success?session_id={session_data["id"]}',
            cancel_url=f'{FRONTEND_URL}/payment/cancel?session_id={session_data["id"]}'
        )
        
        # Update session with Coinbase data
        session_data["provider_session_id"] = charge.id
        session_data["checkout_url"] = charge.hosted_url
        
        # Save to database
        payment_sessions_collection.insert_one(session_data)
        
        return {
            "session_id": session_data["id"],
            "checkout_url": charge.hosted_url,
            "provider": "coinbase"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating Coinbase session: {str(e)}")

def process_payment_success(session_id: str, provider_data: dict) -> dict:
    """Process successful payment and update tournament entry"""
    try:
        # Get payment session
        session = payment_sessions_collection.find_one({"id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Payment session not found")
        
        # Check if already processed
        if session.get("status") == PaymentStatus.COMPLETED:
            return {"message": "Payment already processed"}
        
        # Create payment record
        payment_id = str(uuid.uuid4())
        payment_record = {
            "id": payment_id,
            "user_id": session["user_id"],
            "tournament_id": session["tournament_id"],
            "session_id": session_id,
            "amount": session["amount"],
            "currency": session["currency"],
            "provider": session["provider"],
            "provider_transaction_id": provider_data.get("transaction_id", ""),
            "status": PaymentStatus.COMPLETED,
            "created_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
            "metadata": provider_data
        }
        
        # Save payment record
        payments_collection.insert_one(payment_record)
        
        # Update payment session
        payment_sessions_collection.update_one(
            {"id": session_id},
            {"$set": {"status": PaymentStatus.COMPLETED, "completed_at": datetime.utcnow()}}
        )
        
        # Create tournament entry
        entry_id = str(uuid.uuid4())
        tournament_entry = {
            "id": entry_id,
            "user_id": session["user_id"],
            "tournament_id": session["tournament_id"],
            "payment_id": payment_id,
            "entry_fee": session["amount"],
            "currency": session["currency"],
            "payment_status": PaymentStatus.COMPLETED,
            "created_at": datetime.utcnow(),
            "paid_at": datetime.utcnow()
        }
        
        tournament_entries_collection.insert_one(tournament_entry)
        
        # Add user to tournament participants
        participant_data = {
            "user_id": session["user_id"],
            "tournament_id": session["tournament_id"],
            "registration_date": datetime.utcnow(),
            "payment_status": "paid"
        }
        
        # Check if user is already registered
        existing_participant = tournament_participants_collection.find_one({
            "user_id": session["user_id"],
            "tournament_id": session["tournament_id"]
        })
        
        if not existing_participant:
            tournament_participants_collection.insert_one(participant_data)
        else:
            # Update payment status
            tournament_participants_collection.update_one(
                {"user_id": session["user_id"], "tournament_id": session["tournament_id"]},
                {"$set": {"payment_status": "paid"}}
            )
        
        # Add transaction to wallet system
        add_transaction(
            user_id=session["user_id"],
            transaction_type=TransactionType.TOURNAMENT_ENTRY,
            amount=-session["amount"],  # Debit from wallet
            description=f'Tournament entry fee for {session["metadata"]["tournament_name"]}',
            tournament_id=session["tournament_id"],
            metadata={"payment_id": payment_id, "provider": session["provider"]}
        )
        
        return {"message": "Payment processed successfully", "entry_id": entry_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing payment: {str(e)}")

def process_payout(user_id: str, amount: float, provider: PaymentProvider, payout_account: str) -> dict:
    """Process payout to user"""
    try:
        # Get user wallet
        wallet = get_or_create_wallet(user_id)
        
        # Check if user has sufficient balance
        if wallet.get("available_balance", 0) < amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        # Create payout record
        payout_id = str(uuid.uuid4())
        payout_record = {
            "id": payout_id,
            "user_id": user_id,
            "amount": amount,
            "currency": "USD",
            "provider": provider,
            "payout_account": payout_account,
            "status": PaymentStatus.PROCESSING,
            "created_at": datetime.utcnow(),
            "metadata": {}
        }
        
        # Process based on provider
        if provider == PaymentProvider.STRIPE:
            # For Stripe, we'd need to create a transfer to connected account
            # This requires the user to have a connected Stripe account
            payout_record["metadata"]["note"] = "Stripe payout requires connected account setup"
            payout_record["status"] = PaymentStatus.PENDING
            
        elif provider == PaymentProvider.PAYPAL:
            # For PayPal, we'd use the Payouts API
            payout_record["metadata"]["paypal_email"] = payout_account
            payout_record["status"] = PaymentStatus.PENDING
            
        elif provider == PaymentProvider.COINBASE:
            # For crypto, we'd need to handle wallet transfers
            payout_record["metadata"]["wallet_address"] = payout_account
            payout_record["status"] = PaymentStatus.PENDING
        
        # Save payout record
        payouts_collection.insert_one(payout_record)
        
        # Update wallet balance
        wallet_balances_collection.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "available_balance": -amount,
                    "pending_withdrawal": amount
                }
            }
        )
        
        # Add transaction
        add_transaction(
            user_id=user_id,
            transaction_type=TransactionType.PAYOUT_REQUESTED,
            amount=-amount,
            description=f"Payout request via {provider}",
            payout_id=payout_id,
            metadata={"provider": provider, "payout_account": payout_account}
        )
        
        return {"message": "Payout request submitted", "payout_id": payout_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing payout: {str(e)}")

# =============================================================================
# PAYMENT SYSTEM API ENDPOINTS
# =============================================================================

@app.post("/api/payments/create-session")
async def create_payment_session_endpoint(request: PaymentRequest, user_id: str = Depends(verify_token)):
    """Create payment session for tournament entry"""
    try:
        # Validate user can join tournament
        tournament = tournaments_collection.find_one({"id": request.tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Check if user is already registered
        existing_participant = tournament_participants_collection.find_one({
            "user_id": user_id,
            "tournament_id": request.tournament_id
        })
        
        if existing_participant:
            raise HTTPException(status_code=400, detail="Already registered for this tournament")
        
        # Check tournament status
        if tournament.get("status") != "open":
            raise HTTPException(status_code=400, detail="Tournament registration is closed")
        
        # Validate entry fee
        expected_fee = tournament.get("entry_fee", 0)
        if abs(request.amount - expected_fee) > 0.01:  # Allow small floating point differences
            raise HTTPException(status_code=400, detail="Invalid entry fee amount")
        
        # Create payment session
        session = create_payment_session(user_id, request.tournament_id, request.amount, request.provider)
        
        return session
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating payment session: {str(e)}")

@app.get("/api/payments/session/{session_id}")
async def get_payment_session(session_id: str, user_id: str = Depends(verify_token)):
    """Get payment session details"""
    try:
        session = payment_sessions_collection.find_one({"id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Payment session not found")
        
        # Check if user owns this session
        if session["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Clean session data for response
        clean_session = {}
        for key, value in session.items():
            if key == "_id":
                continue
            elif isinstance(value, datetime):
                clean_session[key] = value.isoformat()
            else:
                clean_session[key] = value
        
        return clean_session
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payment session: {str(e)}")

@app.post("/api/payments/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        if not STRIPE_WEBHOOK_SECRET:
            raise HTTPException(status_code=500, detail="Stripe webhook secret not configured")
        
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        
        # Store webhook event
        webhook_record = {
            "id": str(uuid.uuid4()),
            "provider": "stripe",
            "event_type": event['type'],
            "event_id": event['id'],
            "processed": False,
            "created_at": datetime.utcnow(),
            "data": event['data']
        }
        payment_webhooks_collection.insert_one(webhook_record)
        
        # Process event
        if event['type'] == 'checkout.session.completed':
            session_data = event['data']['object']
            session_id = session_data['metadata'].get('session_id')
            
            if session_id:
                process_payment_success(session_id, {
                    "transaction_id": session_data['payment_intent'],
                    "provider_data": session_data
                })
        
        # Mark webhook as processed
        payment_webhooks_collection.update_one(
            {"id": webhook_record["id"]},
            {"$set": {"processed": True}}
        )
        
        return {"status": "success"}
        
    except Exception as e:
        print(f"Stripe webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

@app.post("/api/payments/webhook/paypal")
async def paypal_webhook(request: Request):
    """Handle PayPal webhook events"""
    try:
        payload = await request.body()
        webhook_data = json.loads(payload)
        
        # Store webhook event
        webhook_record = {
            "id": str(uuid.uuid4()),
            "provider": "paypal",
            "event_type": webhook_data.get('event_type'),
            "event_id": webhook_data.get('id'),
            "processed": False,
            "created_at": datetime.utcnow(),
            "data": webhook_data
        }
        payment_webhooks_collection.insert_one(webhook_record)
        
        # Process payment completion
        if webhook_data.get('event_type') == 'PAYMENT.SALE.COMPLETED':
            # Extract session ID from custom field
            resource = webhook_data.get('resource', {})
            session_id = resource.get('custom')
            
            if session_id:
                process_payment_success(session_id, {
                    "transaction_id": resource.get('id'),
                    "provider_data": resource
                })
        
        # Mark webhook as processed
        payment_webhooks_collection.update_one(
            {"id": webhook_record["id"]},
            {"$set": {"processed": True}}
        )
        
        return {"status": "success"}
        
    except Exception as e:
        print(f"PayPal webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

@app.post("/api/payments/webhook/coinbase")
async def coinbase_webhook(request: Request):
    """Handle Coinbase Commerce webhook events"""
    try:
        payload = await request.body()
        webhook_data = json.loads(payload)
        
        # Store webhook event
        webhook_record = {
            "id": str(uuid.uuid4()),
            "provider": "coinbase",
            "event_type": webhook_data.get('type'),
            "event_id": webhook_data.get('id'),
            "processed": False,
            "created_at": datetime.utcnow(),
            "data": webhook_data
        }
        payment_webhooks_collection.insert_one(webhook_record)
        
        # Process charge completion
        if webhook_data.get('type') == 'charge:confirmed':
            event_data = webhook_data.get('data', {})
            metadata = event_data.get('metadata', {})
            session_id = metadata.get('session_id')
            
            if session_id:
                process_payment_success(session_id, {
                    "transaction_id": event_data.get('id'),
                    "provider_data": event_data
                })
        
        # Mark webhook as processed
        payment_webhooks_collection.update_one(
            {"id": webhook_record["id"]},
            {"$set": {"processed": True}}
        )
        
        return {"status": "success"}
        
    except Exception as e:
        print(f"Coinbase webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

@app.get("/api/payments/history")
async def get_payment_history(user_id: str = Depends(verify_token), limit: int = 50, skip: int = 0):
    """Get user's payment history"""
    try:
        payments = list(payments_collection.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit))
        
        # Convert datetime objects to ISO strings
        for payment in payments:
            for key, value in payment.items():
                if isinstance(value, datetime):
                    payment[key] = value.isoformat()
        
        total_payments = payments_collection.count_documents({"user_id": user_id})
        
        return {
            "payments": payments,
            "total": total_payments,
            "page": skip // limit + 1,
            "pages": (total_payments + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payment history: {str(e)}")

@app.post("/api/payments/payout")
async def request_payout(request: PayoutRequest, user_id: str = Depends(verify_token)):
    """Request payout from wallet"""
    try:
        result = process_payout(user_id, request.amount, request.provider, request.payout_account)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing payout request: {str(e)}")

@app.get("/api/payments/config")
async def get_payment_config():
    """Get payment configuration for frontend"""
    try:
        config = {
            "stripe_enabled": bool(STRIPE_PUBLISHABLE_KEY),
            "paypal_enabled": bool(PAYPAL_CLIENT_ID),
            "coinbase_enabled": bool(COINBASE_API_KEY),
            "stripe_public_key": STRIPE_PUBLISHABLE_KEY if STRIPE_PUBLISHABLE_KEY else None,
            "paypal_client_id": PAYPAL_CLIENT_ID if PAYPAL_CLIENT_ID else None,
            "supported_currencies": ["USD"],
            "minimum_payout": 10.0
        }
        
        return config
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payment config: {str(e)}")

# =============================================================================
# ADMIN PAYMENT MANAGEMENT ENDPOINTS
# =============================================================================

@app.get("/api/admin/payments")
async def get_all_payments(admin_user_id: str = Depends(verify_admin_token()), limit: int = 50, skip: int = 0):
    """Get all payments for admin"""
    try:
        payments = list(payments_collection.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit))
        
        # Convert datetime objects to ISO strings
        for payment in payments:
            for key, value in payment.items():
                if isinstance(value, datetime):
                    payment[key] = value.isoformat()
        
        total_payments = payments_collection.count_documents({})
        
        return {
            "payments": payments,
            "total": total_payments,
            "page": skip // limit + 1,
            "pages": (total_payments + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payments: {str(e)}")

@app.post("/api/admin/payments/{payment_id}/refund")
async def refund_payment(payment_id: str, admin_user_id: str = Depends(verify_admin_token())):
    """Refund a payment"""
    try:
        # Get payment record
        payment = payments_collection.find_one({"id": payment_id})
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        if payment["status"] != PaymentStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Cannot refund non-completed payment")
        
        # Process refund based on provider
        if payment["provider"] == PaymentProvider.STRIPE:
            # Create Stripe refund
            refund = stripe.Refund.create(
                payment_intent=payment["provider_transaction_id"],
                amount=int(payment["amount"] * 100)  # Convert to cents
            )
            
            # Update payment record
            payments_collection.update_one(
                {"id": payment_id},
                {
                    "$set": {
                        "status": PaymentStatus.REFUNDED,
                        "refunded_at": datetime.utcnow(),
                        "refund_id": refund.id
                    }
                }
            )
            
        elif payment["provider"] == PaymentProvider.PAYPAL:
            # PayPal refund would require additional implementation
            # For now, mark as refunded in our system
            payments_collection.update_one(
                {"id": payment_id},
                {
                    "$set": {
                        "status": PaymentStatus.REFUNDED,
                        "refunded_at": datetime.utcnow()
                    }
                }
            )
            
        elif payment["provider"] == PaymentProvider.COINBASE:
            # Coinbase refunds require manual processing
            payments_collection.update_one(
                {"id": payment_id},
                {
                    "$set": {
                        "status": PaymentStatus.REFUNDED,
                        "refunded_at": datetime.utcnow()
                    }
                }
            )
        
        # Add refund transaction to wallet
        add_transaction(
            user_id=payment["user_id"],
            transaction_type=TransactionType.TOURNAMENT_REFUND,
            amount=payment["amount"],
            description=f"Refund for tournament entry",
            tournament_id=payment["tournament_id"],
            processed_by=admin_user_id,
            metadata={"refund_payment_id": payment_id}
        )
        
        # Remove user from tournament if applicable
        tournament_participants_collection.delete_one({
            "user_id": payment["user_id"],
            "tournament_id": payment["tournament_id"]
        })
        
        return {"message": "Payment refunded successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refunding payment: {str(e)}")

# =============================================================================
# SOCIAL SHARING SYSTEM HELPER FUNCTIONS
# =============================================================================

def generate_share_content(user_id: str, share_type: ShareType, reference_id: str, platform: SocialPlatform, custom_message: Optional[str] = None) -> dict:
    """Generate social sharing content based on type and platform"""
    try:
        # Get user information
        user = users_collection.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get template for this share type and platform
        template = share_templates_collection.find_one({
            "share_type": share_type,
            "platform": platform,
            "is_active": True
        })
        
        if not template:
            # Use default template
            template = get_default_share_template(share_type, platform)
        
        # Generate content based on share type
        if share_type == ShareType.TOURNAMENT_VICTORY:
            return generate_tournament_victory_content(user, reference_id, template, custom_message)
        elif share_type == ShareType.TEAM_FORMATION:
            return generate_team_formation_content(user, reference_id, template, custom_message)
        elif share_type == ShareType.PERSONAL_ACHIEVEMENT:
            return generate_achievement_content(user, reference_id, template, custom_message)
        elif share_type == ShareType.TOURNAMENT_PARTICIPATION:
            return generate_tournament_participation_content(user, reference_id, template, custom_message)
        elif share_type == ShareType.RANKING_ACHIEVEMENT:
            return generate_ranking_achievement_content(user, reference_id, template, custom_message)
        else:
            return generate_generic_content(user, reference_id, template, custom_message)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating share content: {str(e)}")

def generate_tournament_victory_content(user: dict, tournament_id: str, template: dict, custom_message: Optional[str] = None) -> dict:
    """Generate content for tournament victory shares"""
    try:
        # Get tournament details
        tournament = tournaments_collection.find_one({"id": tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Get user's final position and prize
        participant = tournament_participants_collection.find_one({
            "user_id": user["id"],
            "tournament_id": tournament_id
        })
        
        prize_won = participant.get("prize_won", 0) if participant else 0
        position = participant.get("final_position", 1) if participant else 1
        
        # Generate content
        share_data = {
            "title": template["title_template"].format(
                user_name=user["full_name"],
                tournament_name=tournament["name"],
                position=get_position_suffix(position)
            ),
            "description": template["description_template"].format(
                user_name=user["full_name"],
                tournament_name=tournament["name"],
                position=get_position_suffix(position),
                prize_amount=f"€{prize_won:.2f}" if prize_won > 0 else "glory",
                participants=tournament.get("current_participants", 0)
            ),
            "hashtags": template.get("hashtags", []) + ["#WoBeRaTournament", "#Victory", "#Esports"],
            "call_to_action": template.get("call_to_action", "Join WoBeRa and compete in epic tournaments!"),
            "metadata": {
                "tournament_id": tournament_id,
                "tournament_name": tournament["name"],
                "position": position,
                "prize_won": prize_won,
                "participants": tournament.get("current_participants", 0)
            }
        }
        
        if custom_message:
            share_data["description"] = f"{custom_message}\n\n{share_data['description']}"
        
        return share_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating tournament victory content: {str(e)}")

def generate_team_formation_content(user: dict, team_id: str, template: dict, custom_message: Optional[str] = None) -> dict:
    """Generate content for team formation shares"""
    try:
        # Get team details
        team = teams_collection.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Get team members count
        members_count = len(team.get("members", []))
        
        share_data = {
            "title": template["title_template"].format(
                user_name=user["full_name"],
                team_name=team["name"]
            ),
            "description": template["description_template"].format(
                user_name=user["full_name"],
                team_name=team["name"],
                city=team.get("city", "Unknown"),
                country=team.get("country", "Unknown"),
                members_count=members_count
            ),
            "hashtags": template.get("hashtags", []) + ["#WoBeRaTeam", "#TeamFormation", "#Esports", f"#{team.get('country', 'Global')}"],
            "call_to_action": template.get("call_to_action", "Join our team and compete together!"),
            "metadata": {
                "team_id": team_id,
                "team_name": team["name"],
                "members_count": members_count,
                "city": team.get("city"),
                "country": team.get("country")
            }
        }
        
        if custom_message:
            share_data["description"] = f"{custom_message}\n\n{share_data['description']}"
        
        return share_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating team formation content: {str(e)}")

def generate_achievement_content(user: dict, achievement_data: str, template: dict, custom_message: Optional[str] = None) -> dict:
    """Generate content for personal achievement shares"""
    try:
        # Parse achievement data (could be JSON string with achievement details)
        achievement = json.loads(achievement_data) if isinstance(achievement_data, str) else achievement_data
        
        share_data = {
            "title": template["title_template"].format(
                user_name=user["full_name"],
                achievement=achievement.get("title", "New Achievement")
            ),
            "description": template["description_template"].format(
                user_name=user["full_name"],
                achievement=achievement.get("title", "New Achievement"),
                description=achievement.get("description", "Amazing accomplishment!")
            ),
            "hashtags": template.get("hashtags", []) + ["#WoBeRaAchievement", "#Success", "#Esports"],
            "call_to_action": template.get("call_to_action", "Unlock your potential with WoBeRa!"),
            "metadata": {
                "achievement_type": achievement.get("type", "general"),
                "achievement_title": achievement.get("title"),
                "achievement_description": achievement.get("description")
            }
        }
        
        if custom_message:
            share_data["description"] = f"{custom_message}\n\n{share_data['description']}"
        
        return share_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating achievement content: {str(e)}")

def generate_tournament_participation_content(user: dict, tournament_id: str, template: dict, custom_message: Optional[str] = None) -> dict:
    """Generate content for tournament participation shares"""
    try:
        # Get tournament details
        tournament = tournaments_collection.find_one({"id": tournament_id})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        share_data = {
            "title": template["title_template"].format(
                user_name=user["full_name"],
                tournament_name=tournament["name"]
            ),
            "description": template["description_template"].format(
                user_name=user["full_name"],
                tournament_name=tournament["name"],
                prize_pool=f"€{tournament.get('prize_pool', 0):.2f}",
                participants=tournament.get("current_participants", 0),
                start_date=tournament.get("tournament_start", "").split('T')[0] if tournament.get("tournament_start") else "Soon"
            ),
            "hashtags": template.get("hashtags", []) + ["#WoBeRaTournament", "#Competition", "#Esports"],
            "call_to_action": template.get("call_to_action", "Join me in this epic tournament!"),
            "metadata": {
                "tournament_id": tournament_id,
                "tournament_name": tournament["name"],
                "prize_pool": tournament.get("prize_pool", 0),
                "participants": tournament.get("current_participants", 0)
            }
        }
        
        if custom_message:
            share_data["description"] = f"{custom_message}\n\n{share_data['description']}"
        
        return share_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating tournament participation content: {str(e)}")

def generate_ranking_achievement_content(user: dict, ranking_data: str, template: dict, custom_message: Optional[str] = None) -> dict:
    """Generate content for ranking achievement shares"""
    try:
        # Parse ranking data
        ranking = json.loads(ranking_data) if isinstance(ranking_data, str) else ranking_data
        
        share_data = {
            "title": template["title_template"].format(
                user_name=user["full_name"],
                rank=ranking.get("rank", 1),
                rank_suffix=get_position_suffix(ranking.get("rank", 1))
            ),
            "description": template["description_template"].format(
                user_name=user["full_name"],
                rank=ranking.get("rank", 1),
                rank_suffix=get_position_suffix(ranking.get("rank", 1)),
                total_players=ranking.get("total_players", 1000),
                points=ranking.get("points", 0)
            ),
            "hashtags": template.get("hashtags", []) + ["#WoBeRaRankings", "#TopPlayer", "#Esports"],
            "call_to_action": template.get("call_to_action", "Climb the rankings with WoBeRa!"),
            "metadata": {
                "rank": ranking.get("rank"),
                "total_players": ranking.get("total_players"),
                "points": ranking.get("points")
            }
        }
        
        if custom_message:
            share_data["description"] = f"{custom_message}\n\n{share_data['description']}"
        
        return share_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating ranking achievement content: {str(e)}")

def generate_generic_content(user: dict, reference_id: str, template: dict, custom_message: Optional[str] = None) -> dict:
    """Generate generic social sharing content"""
    try:
        share_data = {
            "title": template["title_template"].format(user_name=user["full_name"]),
            "description": template["description_template"].format(user_name=user["full_name"]),
            "hashtags": template.get("hashtags", []) + ["#WoBeRa", "#Gaming", "#Esports"],
            "call_to_action": template.get("call_to_action", "Join WoBeRa today!"),
            "metadata": {"reference_id": reference_id}
        }
        
        if custom_message:
            share_data["description"] = f"{custom_message}\n\n{share_data['description']}"
        
        return share_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating generic content: {str(e)}")

def get_default_share_template(share_type: ShareType, platform: SocialPlatform) -> dict:
    """Get default template for share type and platform"""
    templates = {
        ShareType.TOURNAMENT_VICTORY: {
            "title_template": "🏆 {user_name} claimed victory in {tournament_name}!",
            "description_template": "🎉 {user_name} finished {position} in {tournament_name}! Won {prize_amount} competing against {participants} players. What an incredible achievement!",
            "hashtags": ["#Victory", "#Tournament", "#WoBeRa"],
            "call_to_action": "Join WoBeRa and compete for glory!"
        },
        ShareType.TEAM_FORMATION: {
            "title_template": "🚀 {user_name} formed a new team: {team_name}!",
            "description_template": "🎯 {user_name} just created {team_name} from {city}, {country}! The team now has {members_count} members ready for action.",
            "hashtags": ["#TeamFormation", "#NewTeam", "#WoBeRa"],
            "call_to_action": "Form your team and compete together!"
        },
        ShareType.PERSONAL_ACHIEVEMENT: {
            "title_template": "⭐ {user_name} unlocked: {achievement}!",
            "description_template": "🎊 {user_name} just achieved {achievement}! {description}",
            "hashtags": ["#Achievement", "#Success", "#WoBeRa"],
            "call_to_action": "Unlock your potential with WoBeRa!"
        },
        ShareType.TOURNAMENT_PARTICIPATION: {
            "title_template": "🎮 {user_name} is competing in {tournament_name}!",
            "description_template": "🔥 {user_name} joined {tournament_name} with a {prize_pool} prize pool! {participants} players competing. Starting {start_date}.",
            "hashtags": ["#Competition", "#Tournament", "#WoBeRa"],
            "call_to_action": "Join the tournament and compete!"
        },
        ShareType.RANKING_ACHIEVEMENT: {
            "title_template": "📈 {user_name} reached {rank}{rank_suffix} place!",
            "description_template": "🏅 {user_name} climbed to {rank}{rank_suffix} place out of {total_players} players with {points} points!",
            "hashtags": ["#Rankings", "#TopPlayer", "#WoBeRa"],
            "call_to_action": "Climb the rankings with WoBeRa!"
        }
    }
    
    return templates.get(share_type, templates[ShareType.PERSONAL_ACHIEVEMENT])

def get_position_suffix(position: int) -> str:
    """Get position suffix (1st, 2nd, 3rd, etc.)"""
    if 10 <= position % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(position % 10, "th")
    return suffix

def create_share_url(share_id: str, user_id: str) -> str:
    """Create trackable share URL"""
    base_url = "https://49f63d92-acd8-4e16-a4be-50baa0fb091a.preview.emergentagent.com"
    return f"{base_url}/share/{share_id}?ref={user_id}"

def track_share_click(share_id: str, referrer_id: Optional[str] = None) -> None:
    """Track when someone clicks on a shared link"""
    try:
        # Update share clicks
        social_shares_collection.update_one(
            {"id": share_id},
            {
                "$inc": {"clicks": 1},
                "$set": {"last_clicked": datetime.utcnow()}
            }
        )
        
        # Record click event
        click_record = {
            "id": str(uuid.uuid4()),
            "share_id": share_id,
            "referrer_id": referrer_id,
            "clicked_at": datetime.utcnow(),
            "user_agent": None,  # Could be added from request headers
            "ip_address": None   # Could be added from request
        }
        
        share_clicks_collection.insert_one(click_record)
        
        # Update viral metrics if applicable
        if referrer_id:
            viral_metrics_collection.update_one(
                {"share_id": share_id},
                {
                    "$inc": {"referred_users": 1},
                    "$set": {"updated_at": datetime.utcnow()}
                },
                upsert=True
            )
        
    except Exception as e:
        print(f"Error tracking share click: {str(e)}")

def calculate_viral_coefficient(share_id: str) -> float:
    """Calculate viral coefficient for a share"""
    try:
        share = social_shares_collection.find_one({"id": share_id})
        if not share:
            return 0.0
        
        # Get viral metrics
        metrics = viral_metrics_collection.find_one({"share_id": share_id})
        if not metrics:
            return 0.0
        
        # Calculate viral coefficient
        # Viral coefficient = (New users from share) / (Original shares)
        new_users = metrics.get("referred_users", 0)
        original_shares = 1  # The original share
        
        viral_coefficient = new_users / original_shares if original_shares > 0 else 0.0
        
        # Update metrics
        viral_metrics_collection.update_one(
            {"share_id": share_id},
            {
                "$set": {
                    "viral_coefficient": viral_coefficient,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return viral_coefficient
        
    except Exception as e:
        print(f"Error calculating viral coefficient: {str(e)}")
        return 0.0

# =============================================================================
# SOCIAL SHARING SYSTEM API ENDPOINTS
# =============================================================================

@app.post("/api/social/share")
async def create_share(request: ShareRequest, user_id: str = Depends(verify_token)):
    """Create social share content"""
    try:
        # Generate share content
        share_data = generate_share_content(
            user_id=user_id,
            share_type=request.share_type,
            reference_id=request.reference_id,
            platform=request.platform,
            custom_message=request.custom_message
        )
        
        # Create share record
        share_id = str(uuid.uuid4())
        share_url = create_share_url(share_id, user_id)
        
        share_record = {
            "id": share_id,
            "user_id": user_id,
            "share_type": request.share_type,
            "platform": request.platform,
            "title": share_data["title"],
            "description": share_data["description"],
            "image_url": None,  # Will be implemented later
            "share_url": share_url,
            "metadata": share_data["metadata"],
            "created_at": datetime.utcnow(),
            "shared_at": None,
            "clicks": 0,
            "engagement_score": 0.0,
            "is_viral": False
        }
        
        # Save share record
        social_shares_collection.insert_one(share_record)
        
        # Create viral metrics record
        viral_record = {
            "share_id": share_id,
            "original_user_id": user_id,
            "referred_users": 0,
            "tournament_joins": 0,
            "team_joins": 0,
            "conversion_rate": 0.0,
            "revenue_generated": 0.0,
            "viral_coefficient": 0.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        viral_metrics_collection.insert_one(viral_record)
        
        # Return share content for frontend
        return {
            "share_id": share_id,
            "title": share_data["title"],
            "description": share_data["description"],
            "hashtags": share_data["hashtags"],
            "call_to_action": share_data["call_to_action"],
            "share_url": share_url,
            "platform": request.platform,
            "share_type": request.share_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating share: {str(e)}")

@app.get("/api/social/viral-content")
async def get_viral_content(limit: int = 10):
    """Get trending viral content"""
    try:
        # Get most clicked and shared content
        viral_content = list(social_shares_collection.find(
            {"clicks": {"$gt": 0}},  # Content with clicks
            {"_id": 0}
        ).sort("clicks", -1).limit(limit))
        
        # Clean datetime objects
        for share in viral_content:
            for key, value in share.items():
                if isinstance(value, datetime):
                    share[key] = value.isoformat()
        
        return {
            "viral_content": viral_content,
            "total_viral": len(viral_content)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching viral content: {str(e)}")

@app.get("/api/social/user/shares")
async def get_user_shares(user_id: str = Depends(verify_token), limit: int = 20, skip: int = 0):
    """Get user's share history"""
    try:
        shares = list(social_shares_collection.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit))
        
        # Convert datetime objects to ISO strings
        for share in shares:
            for key, value in share.items():
                if isinstance(value, datetime):
                    share[key] = value.isoformat()
        
        total_shares = social_shares_collection.count_documents({"user_id": user_id})
        
        return {
            "shares": shares,
            "total": total_shares,
            "page": skip // limit + 1,
            "pages": (total_shares + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user shares: {str(e)}")

@app.get("/api/social/stats")
async def get_social_stats(user_id: str = Depends(verify_token)):
    """Get user's social sharing statistics"""
    try:
        # Get user's sharing stats
        stats = share_stats_collection.find_one({"user_id": user_id})
        if not stats:
            stats = {
                "total_shares": 0,
                "shares_by_platform": {},
                "shares_by_type": {},
                "total_clicks": 0,
                "viral_shares": 0,
                "engagement_rate": 0.0,
                "top_performing_content": []
            }
        
        # Get recent shares performance
        recent_shares = list(social_shares_collection.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(10))
        
        # Calculate additional metrics
        total_shares = len(recent_shares)
        total_clicks = sum(share.get("clicks", 0) for share in recent_shares)
        
        # Update stats
        stats["total_clicks"] = total_clicks
        stats["engagement_rate"] = (total_clicks / total_shares) if total_shares > 0 else 0.0
        
        # Clean datetime objects
        for share in recent_shares:
            for key, value in share.items():
                if isinstance(value, datetime):
                    share[key] = value.isoformat()
        
        return {
            "stats": stats,
            "recent_shares": recent_shares,
            "viral_coefficient": calculate_viral_coefficient(recent_shares[0]["id"]) if recent_shares else 0.0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching social stats: {str(e)}")

@app.post("/api/achievements/share")
async def share_achievement(achievement_data: dict, platform: SocialPlatform, user_id: str = Depends(verify_token)):
    """Share personal achievement"""
    try:
        # Generate share content
        share_data = generate_share_content(
            user_id=user_id,
            share_type=ShareType.PERSONAL_ACHIEVEMENT,
            reference_id=json.dumps(achievement_data),
            platform=platform
        )
        
        # Create share record
        share_id = str(uuid.uuid4())
        share_url = create_share_url(share_id, user_id)
        
        share_record = {
            "id": share_id,
            "user_id": user_id,
            "share_type": ShareType.PERSONAL_ACHIEVEMENT,
            "platform": platform,
            "title": share_data["title"],
            "description": share_data["description"],
            "image_url": None,
            "share_url": share_url,
            "metadata": share_data["metadata"],
            "created_at": datetime.utcnow(),
            "shared_at": None,
            "clicks": 0,
            "engagement_score": 0.0,
            "is_viral": False
        }
        
        social_shares_collection.insert_one(share_record)
        
        return {
            "share_id": share_id,
            "title": share_data["title"],
            "description": share_data["description"],
            "hashtags": share_data["hashtags"],
            "call_to_action": share_data["call_to_action"],
            "share_url": share_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sharing achievement: {str(e)}")

@app.post("/api/tournaments/{tournament_id}/share-victory")
async def share_tournament_victory(tournament_id: str, platform: SocialPlatform, user_id: str = Depends(verify_token)):
    """Share tournament victory"""
    try:
        # Check if user actually won/participated in tournament
        participant = tournament_participants_collection.find_one({
            "user_id": user_id,
            "tournament_id": tournament_id
        })
        
        if not participant:
            raise HTTPException(status_code=404, detail="User not found in tournament")
        
        # Generate share content
        share_data = generate_share_content(
            user_id=user_id,
            share_type=ShareType.TOURNAMENT_VICTORY,
            reference_id=tournament_id,
            platform=platform
        )
        
        # Create share record
        share_id = str(uuid.uuid4())
        share_url = create_share_url(share_id, user_id)
        
        share_record = {
            "id": share_id,
            "user_id": user_id,
            "share_type": ShareType.TOURNAMENT_VICTORY,
            "platform": platform,
            "title": share_data["title"],
            "description": share_data["description"],
            "image_url": None,
            "share_url": share_url,
            "metadata": share_data["metadata"],
            "created_at": datetime.utcnow(),
            "shared_at": None,
            "clicks": 0,
            "engagement_score": 0.0,
            "is_viral": False
        }
        
        social_shares_collection.insert_one(share_record)
        
        return {
            "share_id": share_id,
            "title": share_data["title"],
            "description": share_data["description"],
            "hashtags": share_data["hashtags"],
            "call_to_action": share_data["call_to_action"],
            "share_url": share_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sharing tournament victory: {str(e)}")

# =============================================================================
# SOCIAL SHARING ENDPOINTS SETUP
# =============================================================================

# Import and setup social sharing endpoints
try:
    from social_sharing_endpoints import setup_social_sharing_endpoints
    setup_social_sharing_endpoints(
        app, verify_token, verify_admin_token,
        social_shares_collection, share_templates_collection,
        share_stats_collection, viral_metrics_collection,
        share_clicks_collection, tournaments_collection,
        tournament_participants_collection, teams_collection,
        generate_share_content, create_share_url, track_share_click,
        calculate_viral_coefficient, ShareRequest, ShareType,
        SocialPlatform, PaymentStatus
    )
    print("✅ Social sharing endpoints loaded successfully")
except Exception as e:
    print(f"❌ Error loading social sharing endpoints: {str(e)}")

# =============================================================================
# FRIEND IMPORT SYSTEM
# =============================================================================

# Friend Import Collections
friends_collection = db["friends"]
friend_requests_collection = db["friend_requests"]
friend_imports_collection = db["friend_imports"]

# Friend Import Models
class FriendRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    recipient_id: str
    status: str = "pending"  # pending, accepted, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FriendImportRequest(BaseModel):
    provider: str  # google, discord, email
    contacts: List[str] = []
    emails: List[str] = []

class FriendRecommendation(BaseModel):
    user_id: str
    username: str
    full_name: str
    avatar_url: str = ""
    mutual_friends: int = 0
    common_teams: int = 0
    reason: str = ""

# Friend Import Endpoints
@app.get("/api/friends/recommendations")
async def get_friend_recommendations(current_user: dict = Depends(get_current_user)):
    """Get friend recommendations based on mutual connections"""
    try:
        user_id = current_user["id"]
        
        # Get user's current friends
        user_friends = list(friends_collection.find({"user_id": user_id}))
        friend_ids = [f["friend_id"] for f in user_friends]
        
        # Get user's teams
        user_teams = list(teams_collection.find({"$or": [
            {"captain_id": user_id},
            {"members.user_id": user_id}
        ]}))
        user_team_ids = [str(team["id"]) for team in user_teams]
        
        # Find potential friends
        recommendations = []
        
        # 1. Team members who are not friends
        for team in user_teams:
            for member in team.get("members", []):
                if member["user_id"] not in friend_ids and member["user_id"] != user_id:
                    user_data = users_collection.find_one({"id": member["user_id"]})
                    if user_data:
                        recommendations.append({
                            "user_id": member["user_id"],
                            "username": user_data["username"],
                            "full_name": user_data.get("full_name", ""),
                            "avatar_url": user_data.get("avatar_url", ""),
                            "mutual_friends": 0,
                            "common_teams": 1,
                            "reason": f"Team member in {team['name']}"
                        })
        
        # 2. Friends of friends
        for friend_id in friend_ids:
            friend_friends = list(friends_collection.find({"user_id": friend_id}))
            for ff in friend_friends:
                if ff["friend_id"] not in friend_ids and ff["friend_id"] != user_id:
                    user_data = users_collection.find_one({"user_id": ff["friend_id"]})
                    if user_data:
                        # Check if already in recommendations
                        existing = next((r for r in recommendations if r["user_id"] == ff["friend_id"]), None)
                        if existing:
                            existing["mutual_friends"] += 1
                            existing["reason"] += f", mutual friend"
                        else:
                            recommendations.append({
                                "user_id": ff["friend_id"],
                                "username": user_data["username"],
                                "full_name": user_data.get("full_name", ""),
                                "avatar_url": user_data.get("avatar_url", ""),
                                "mutual_friends": 1,
                                "common_teams": 0,
                                "reason": "Mutual friend"
                            })
        
        # Sort by relevance score
        recommendations.sort(key=lambda x: x["mutual_friends"] + x["common_teams"], reverse=True)
        
        return CustomJSONResponse(content={
            "recommendations": recommendations[:20]  # Limit to 20
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting friend recommendations: {str(e)}")

@app.post("/api/friends/send-request")
async def send_friend_request(request: dict, current_user: dict = Depends(get_current_user)):
    """Send friend request"""
    try:
        user_id = current_user["id"]
        recipient_id = request.get("recipient_id")
        
        if not recipient_id:
            raise HTTPException(status_code=400, detail="Recipient ID is required")
        
        # Check if recipient exists
        recipient = users_collection.find_one({"id": recipient_id})
        if not recipient:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if already friends
        existing_friendship = friends_collection.find_one({
            "$or": [
                {"user_id": user_id, "friend_id": recipient_id},
                {"user_id": recipient_id, "friend_id": user_id}
            ]
        })
        if existing_friendship:
            raise HTTPException(status_code=400, detail="Already friends")
        
        # Check if request already exists
        existing_request = friend_requests_collection.find_one({
            "sender_id": user_id,
            "recipient_id": recipient_id,
            "status": "pending"
        })
        if existing_request:
            raise HTTPException(status_code=400, detail="Friend request already sent")
        
        # Create friend request
        friend_request = {
            "id": str(uuid.uuid4()),
            "sender_id": user_id,
            "recipient_id": recipient_id,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        friend_requests_collection.insert_one(friend_request)
        
        return CustomJSONResponse(content={
            "message": "Friend request sent successfully",
            "request_id": friend_request["id"]
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending friend request: {str(e)}")

@app.get("/api/friends/requests")
async def get_friend_requests(current_user: dict = Depends(get_current_user)):
    """Get pending friend requests"""
    try:
        user_id = current_user["id"]
        
        # Get received requests
        received_requests = list(friend_requests_collection.find({
            "recipient_id": user_id,
            "status": "pending"
        }))
        
        # Get sent requests
        sent_requests = list(friend_requests_collection.find({
            "sender_id": user_id,
            "status": "pending"
        }))
        
        # Enrich with user data
        for request in received_requests:
            sender = users_collection.find_one({"id": request["sender_id"]})
            if sender:
                request["sender_username"] = sender["username"]
                request["sender_full_name"] = sender.get("full_name", "")
                request["sender_avatar_url"] = sender.get("avatar_url", "")
        
        for request in sent_requests:
            recipient = users_collection.find_one({"id": request["recipient_id"]})
            if recipient:
                request["recipient_username"] = recipient["username"]
                request["recipient_full_name"] = recipient.get("full_name", "")
                request["recipient_avatar_url"] = recipient.get("avatar_url", "")
        
        return CustomJSONResponse(content={
            "requests": received_requests,
            "received_requests": received_requests,
            "sent_requests": sent_requests
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting friend requests: {str(e)}")

@app.post("/api/friends/respond-request")
async def respond_friend_request(request: dict, current_user: dict = Depends(get_current_user)):
    """Accept or reject friend request"""
    try:
        user_id = current_user["id"]
        request_id = request.get("request_id")
        action = request.get("action")  # accept or reject
        
        if not request_id or not action:
            raise HTTPException(status_code=400, detail="Request ID and action are required")
        
        if action not in ["accept", "reject"]:
            raise HTTPException(status_code=400, detail="Action must be 'accept' or 'reject'")
        
        # Find friend request
        friend_request = friend_requests_collection.find_one({
            "id": request_id,
            "recipient_id": user_id,
            "status": "pending"
        })
        
        if not friend_request:
            raise HTTPException(status_code=404, detail="Friend request not found")
        
        # Update request status
        friend_requests_collection.update_one(
            {"id": request_id},
            {
                "$set": {
                    "status": "accepted" if action == "accept" else "rejected",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # If accepted, create friendship
        if action == "accept":
            friendship_data = {
                "user_id": user_id,
                "friend_id": friend_request["sender_id"],
                "created_at": datetime.utcnow()
            }
            friends_collection.insert_one(friendship_data)
            
            # Create reverse friendship
            reverse_friendship = {
                "user_id": friend_request["sender_id"],
                "friend_id": user_id,
                "created_at": datetime.utcnow()
            }
            friends_collection.insert_one(reverse_friendship)
        
        return CustomJSONResponse(content={
            "message": f"Friend request {action}ed successfully"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error responding to friend request: {str(e)}")

@app.get("/api/friends/list")
async def get_friends_list(current_user: dict = Depends(get_current_user)):
    """Get user's friends list"""
    try:
        user_id = current_user["id"]
        
        # Get friends
        friends = list(friends_collection.find({"user_id": user_id}))
        
        # Enrich with user data
        friends_data = []
        for friend in friends:
            user_data = users_collection.find_one({"id": friend["friend_id"]})
            if user_data:
                friends_data.append({
                    "friend_id": friend["friend_id"],
                    "friend_username": user_data["username"],
                    "friend_full_name": user_data.get("full_name", ""),
                    "avatar_url": user_data.get("avatar_url", ""),
                    "country": user_data.get("country", ""),
                    "created_at": friend["created_at"],
                    "is_online": False  # Could be enhanced with real-time status
                })
        
        return CustomJSONResponse(content={
            "friends": friends_data,
            "total_friends": len(friends_data)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting friends list: {str(e)}")

@app.post("/api/friends/import")
async def import_friends(request: dict, current_user: dict = Depends(get_current_user)):
    """Import friends from external providers"""
    try:
        user_id = current_user["id"]
        
        # Handle both dict and FriendImportRequest formats
        provider = request.get("provider", "email")
        emails = request.get("emails", [])
        
        imported_friends = []
        
        if provider == "email":
            # Import by email addresses
            for email in emails:
                # Find user by email
                user = users_collection.find_one({"email": email})
                if user and user["id"] != user_id:
                    # Check if already friends
                    existing = friends_collection.find_one({
                        "user_id": user_id,
                        "friend_id": user["id"]
                    })
                    if not existing:
                        imported_friends.append({
                            "user_id": user["id"],
                            "username": user["username"],
                            "full_name": user.get("full_name", ""),
                            "email": email,
                            "found": True
                        })
        
        elif provider == "google":
            # Mock Google import - in real implementation, this would use Google Contacts API
            return CustomJSONResponse(content={
                "message": "Google import not yet implemented",
                "imported_friends": [],
                "total_imported": 0
            })
        
        elif provider == "discord":
            # Mock Discord import - in real implementation, this would use Discord API
            return CustomJSONResponse(content={
                "message": "Discord import not yet implemented", 
                "imported_friends": [],
                "total_imported": 0
            })
        
        # Save import record
        import_record = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "provider": provider,
            "imported_count": len(imported_friends),
            "created_at": datetime.utcnow()
        }
        friend_imports_collection.insert_one(import_record)
        
        return CustomJSONResponse(content={
            "message": f"Successfully found {len(imported_friends)} friends",
            "imported_friends": imported_friends,
            "total_imported": len(imported_friends)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing friends: {str(e)}")

@app.delete("/api/friends/remove")
async def remove_friend(request: dict, current_user: dict = Depends(get_current_user)):
    """Remove friend"""
    try:
        user_id = current_user["user_id"]
        friend_id = request.get("friend_id")
        
        if not friend_id:
            raise HTTPException(status_code=400, detail="Friend ID is required")
        
        # Remove friendship (both directions)
        friends_collection.delete_one({"user_id": user_id, "friend_id": friend_id})
        friends_collection.delete_one({"user_id": friend_id, "friend_id": user_id})
        
        return CustomJSONResponse(content={
            "message": "Friend removed successfully"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing friend: {str(e)}")

@app.get("/api/friends/search")
async def search_friends(q: str, current_user: dict = Depends(get_current_user)):
    """Search for users to add as friends"""
    try:
        user_id = current_user["id"]
        
        if not q or len(q) < 2:
            raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
        
        # Search users by username or full name
        users = list(users_collection.find({
            "$and": [
                {"id": {"$ne": user_id}},  # Exclude self
                {
                    "$or": [
                        {"username": {"$regex": q, "$options": "i"}},
                        {"full_name": {"$regex": q, "$options": "i"}}
                    ]
                }
            ]
        }).limit(20))
        
        # Get user's friends to filter them out
        user_friends = list(friends_collection.find({"user_id": user_id}))
        friend_ids = [f["friend_id"] for f in user_friends]
        
        # Filter out friends and enrich data
        search_results = []
        for user in users:
            if user["id"] not in friend_ids:
                search_results.append({
                    "user_id": user["id"],
                    "username": user["username"],
                    "full_name": user.get("full_name", ""),
                    "avatar_url": user.get("avatar_url", ""),
                    "country": user.get("country", ""),
                    "is_friend": False
                })
        
        return CustomJSONResponse(content={
            "users": search_results,
            "total": len(search_results)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching friends: {str(e)}")

print("✅ Friend Import System endpoints loaded successfully")

# =============================================================================
# CONTENT MANAGEMENT SYSTEM ENDPOINTS
# =============================================================================

@app.get("/api/admin/cms/content")
async def get_all_content(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get all CMS content items (Admin only)"""
    try:
        content_items = list(cms_content_collection.find({}))
        
        # Convert datetime objects to strings for JSON serialization
        for item in content_items:
            if 'created_at' in item:
                item['created_at'] = item['created_at'].isoformat() if item['created_at'] else None
            if 'updated_at' in item:
                item['updated_at'] = item['updated_at'].isoformat() if item['updated_at'] else None
        
        # Get translations for each content item
        for item in content_items:
            translations = list(cms_translations_collection.find({"content_id": item["id"]}))
            for translation in translations:
                if 'created_at' in translation:
                    translation['created_at'] = translation['created_at'].isoformat() if translation['created_at'] else None
                if 'updated_at' in translation:
                    translation['updated_at'] = translation['updated_at'].isoformat() if translation['updated_at'] else None
            item["translations"] = translations
        
        return CustomJSONResponse(content={
            "content": content_items,
            "total": len(content_items)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching content: {str(e)}")

@app.get("/api/cms/content")
async def get_public_content():
    """Get all active CMS content for public use (no auth required)"""
    try:
        content_items = list(cms_content_collection.find({"is_active": True}))
        
        # Create a dictionary for easy frontend access
        content_dict = {}
        for item in content_items:
            content_dict[item["key"]] = {
                "value": item["current_value"],
                "type": item["content_type"],
                "context": item["context"]
            }
        
        return CustomJSONResponse(content=content_dict)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching content: {str(e)}")

@app.post("/api/admin/cms/content")
async def create_content(request: ContentUpdateRequest, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Create new CMS content item (Admin only)"""
    try:
        # Check if content with this key already exists
        existing = cms_content_collection.find_one({"key": request.key})
        if existing:
            raise HTTPException(status_code=400, detail="Content with this key already exists")
        
        now = datetime.utcnow()
        content_data = {
            "id": str(uuid.uuid4()),
            "key": request.key,
            "content_type": request.content_type.value,
            "context": request.context.value,
            "default_value": request.current_value,
            "current_value": request.current_value,
            "description": request.description,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
            "created_by": admin_id,
            "updated_by": None
        }
        
        cms_content_collection.insert_one(content_data)
        
        # Prepare response data with serialized datetime
        response_content = content_data.copy()
        response_content['created_at'] = response_content['created_at'].isoformat()
        response_content['updated_at'] = response_content['updated_at'].isoformat()
        
        return CustomJSONResponse(content={
            "message": "Content created successfully",
            "content": response_content
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating content: {str(e)}")

@app.put("/api/admin/cms/content/{content_id}")
async def update_content(content_id: str, request: ContentUpdateRequest, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Update existing CMS content item (Admin only)"""
    try:
        existing = cms_content_collection.find_one({"id": content_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Content not found")
        
        update_data = {
            "current_value": request.current_value,
            "description": request.description,
            "updated_at": datetime.utcnow(),
            "updated_by": admin_id
        }
        
        cms_content_collection.update_one(
            {"id": content_id},
            {"$set": update_data}
        )
        
        return CustomJSONResponse(content={
            "message": "Content updated successfully"
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating content: {str(e)}")

@app.delete("/api/admin/cms/content/{content_id}")
async def delete_content(content_id: str, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Delete CMS content item (Admin only)"""
    try:
        # Delete content item
        result = cms_content_collection.delete_one({"id": content_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Also delete all translations for this content
        cms_translations_collection.delete_many({"content_id": content_id})
        
        return CustomJSONResponse(content={
            "message": "Content deleted successfully"
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting content: {str(e)}")

@app.post("/api/admin/cms/content/bulk")
async def bulk_update_content(request: ContentBulkUpdateRequest, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Bulk update multiple content items (Admin only)"""
    try:
        updated_count = 0
        
        for update in request.updates:
            # Check if content exists, create if not
            existing = cms_content_collection.find_one({"key": update.key})
            
            if existing:
                # Update existing
                cms_content_collection.update_one(
                    {"key": update.key},
                    {"$set": {
                        "current_value": update.current_value,
                        "description": update.description,
                        "updated_at": datetime.utcnow(),
                        "updated_by": admin_id
                    }}
                )
                updated_count += 1
            else:
                # Create new
                content_data = {
                    "id": str(uuid.uuid4()),
                    "key": update.key,
                    "content_type": update.content_type.value,
                    "context": update.context.value,
                    "default_value": update.current_value,
                    "current_value": update.current_value,
                    "description": update.description,
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "created_by": admin_id,
                    "updated_by": None
                }
                cms_content_collection.insert_one(content_data)
                updated_count += 1
        
        return CustomJSONResponse(content={
            "message": f"Successfully processed {updated_count} content items"
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error bulk updating content: {str(e)}")

@app.get("/api/admin/cms/themes")
async def get_all_themes(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get all CMS themes (Admin only)"""
    try:
        themes = list(cms_themes_collection.find({}))
        
        # Convert datetime objects to strings for JSON serialization
        for theme in themes:
            if 'created_at' in theme:
                theme['created_at'] = theme['created_at'].isoformat() if theme['created_at'] else None
            if 'updated_at' in theme:
                theme['updated_at'] = theme['updated_at'].isoformat() if theme['updated_at'] else None
        
        return CustomJSONResponse(content={
            "themes": themes,
            "total": len(themes)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching themes: {str(e)}")

@app.get("/api/cms/theme/active")
async def get_active_theme():
    """Get the currently active theme (no auth required)"""
    try:
        active_theme = cms_themes_collection.find_one({"is_active": True})
        
        # If no active theme, return default colors
        if not active_theme:
            active_theme = {
                "id": "default",
                "name": "Default Theme",
                "colors": {
                    "primary": "#4fc3f7",
                    "secondary": "#29b6f6",
                    "accent": "#ffd700",
                    "success": "#22c55e",
                    "warning": "#f59e0b",
                    "error": "#ef4444",
                    "background": "#1a1a1a",
                    "surface": "#2a2a2a",
                    "text": "#ffffff"
                },
                "fonts": {
                    "primary": "Inter, sans-serif",
                    "secondary": "Roboto, sans-serif"
                }
            }
        else:
            # Convert datetime objects to strings for JSON serialization
            if 'created_at' in active_theme:
                active_theme['created_at'] = active_theme['created_at'].isoformat() if active_theme['created_at'] else None
            if 'updated_at' in active_theme:
                active_theme['updated_at'] = active_theme['updated_at'].isoformat() if active_theme['updated_at'] else None
        
        return CustomJSONResponse(content=active_theme)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching active theme: {str(e)}")

@app.post("/api/admin/cms/themes")
async def create_theme(request: ThemeUpdateRequest, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Create new CMS theme (Admin only)"""
    try:
        now = datetime.utcnow()
        theme_data = {
            "id": str(uuid.uuid4()),
            "name": request.name,
            "colors": request.colors,
            "fonts": request.fonts or {},
            "is_active": False,  # New themes are not active by default
            "is_default": False,
            "created_at": now,
            "updated_at": now,
            "created_by": admin_id,
            "updated_by": None
        }
        
        cms_themes_collection.insert_one(theme_data)
        
        # Prepare response data with serialized datetime
        response_theme = theme_data.copy()
        response_theme['created_at'] = response_theme['created_at'].isoformat()
        response_theme['updated_at'] = response_theme['updated_at'].isoformat()
        
        return CustomJSONResponse(content={
            "message": "Theme created successfully",
            "theme": response_theme
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating theme: {str(e)}")

@app.put("/api/admin/cms/themes/{theme_id}/activate")
async def activate_theme(theme_id: str, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Activate a theme (deactivates all others) (Admin only)"""
    try:
        # Check if theme exists
        theme = cms_themes_collection.find_one({"id": theme_id})
        if not theme:
            raise HTTPException(status_code=404, detail="Theme not found")
        
        # Deactivate all themes
        cms_themes_collection.update_many(
            {},
            {"$set": {"is_active": False}}
        )
        
        # Activate the selected theme
        cms_themes_collection.update_one(
            {"id": theme_id},
            {"$set": {
                "is_active": True,
                "updated_at": datetime.utcnow(),
                "updated_by": admin_id
            }}
        )
        
        return CustomJSONResponse(content={
            "message": "Theme activated successfully"
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error activating theme: {str(e)}")

@app.get("/api/admin/cms/content/contexts")
async def get_content_contexts(admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Get all content organized by context (Admin only)"""
    try:
        content_items = list(cms_content_collection.find({}))
        
        # Group by context
        contexts = {}
        for item in content_items:
            context = item["context"]
            if context not in contexts:
                contexts[context] = []
            contexts[context].append(item)
        
        return CustomJSONResponse(content=contexts)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching content by context: {str(e)}")

@app.post("/api/admin/cms/translations")
async def create_translation(request: TranslationUpdateRequest, admin_id: str = Depends(verify_admin_token(AdminRole.ADMIN))):
    """Create or update translation for content (Admin only)"""
    try:
        # Check if content exists
        content = cms_content_collection.find_one({"id": request.content_id})
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Check if translation already exists
        existing_translation = cms_translations_collection.find_one({
            "content_id": request.content_id,
            "language": request.language
        })
        
        if existing_translation:
            # Update existing translation
            cms_translations_collection.update_one(
                {"id": existing_translation["id"]},
                {"$set": {
                    "translated_value": request.translated_value,
                    "updated_at": datetime.utcnow(),
                    "updated_by": admin_id
                }}
            )
            message = "Translation updated successfully"
        else:
            # Create new translation
            translation_data = {
                "id": str(uuid.uuid4()),
                "content_id": request.content_id,
                "language": request.language,
                "translated_value": request.translated_value,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": admin_id,
                "updated_by": None
            }
            cms_translations_collection.insert_one(translation_data)
            message = "Translation created successfully"
        
        return CustomJSONResponse(content={"message": message})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating/updating translation: {str(e)}")

print("✅ Content Management System endpoints loaded successfully")

# Initialize default CMS content
def initialize_default_cms_content():
    """Initialize default CMS content items"""
    try:
        # Check if content already exists
        existing_count = cms_content_collection.count_documents({})
        if existing_count > 0:
            print("📝 CMS content already exists, skipping initialization")
            return
        
        default_content = [
            # Navbar content
            {
                "id": str(uuid.uuid4()),
                "key": "nav_home",
                "content_type": "text",
                "context": "navbar",
                "default_value": "Home",
                "current_value": "Home",
                "description": "Navigation home link text",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            {
                "id": str(uuid.uuid4()),
                "key": "nav_rankings",
                "content_type": "text",
                "context": "navbar",
                "default_value": "Rankings",
                "current_value": "Rankings",
                "description": "Navigation rankings link text",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            {
                "id": str(uuid.uuid4()),
                "key": "nav_tournaments",
                "content_type": "text",
                "context": "navbar",
                "default_value": "Tournaments",
                "current_value": "Tournaments",
                "description": "Navigation tournaments link text",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            {
                "id": str(uuid.uuid4()),
                "key": "nav_teams",
                "content_type": "text",
                "context": "navbar",
                "default_value": "Teams",
                "current_value": "Teams",
                "description": "Navigation teams link text",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            {
                "id": str(uuid.uuid4()),
                "key": "nav_guilds",
                "content_type": "text",
                "context": "navbar",
                "default_value": "Guilds",
                "current_value": "Guilds",
                "description": "Navigation guilds link text",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            {
                "id": str(uuid.uuid4()),
                "key": "nav_affiliate",
                "content_type": "text",
                "context": "navbar",
                "default_value": "Affiliate",
                "current_value": "Affiliate",
                "description": "Navigation affiliate link text",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            {
                "id": str(uuid.uuid4()),
                "key": "nav_wallet",
                "content_type": "text",
                "context": "navbar",
                "default_value": "Wallet",
                "current_value": "Wallet",
                "description": "Navigation wallet link text",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            # Hero section content
            {
                "id": str(uuid.uuid4()),
                "key": "hero_title",
                "content_type": "text",
                "context": "hero",
                "default_value": "WoBeRa",
                "current_value": "WoBeRa",
                "description": "Main hero title",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            {
                "id": str(uuid.uuid4()),
                "key": "hero_subtitle",
                "content_type": "text",
                "context": "hero",
                "default_value": "WORLD BETTING RANK",
                "current_value": "WORLD BETTING RANK",
                "description": "Hero subtitle",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            {
                "id": str(uuid.uuid4()),
                "key": "hero_description",
                "content_type": "text",
                "context": "hero",
                "default_value": "Discover your position on the WoBeRa global map. Participate in competitions and conquer the top of the World Betting Rank.",
                "current_value": "Discover your position on the WoBeRa global map. Participate in competitions and conquer the top of the World Betting Rank.",
                "description": "Hero section description text",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            # Color scheme
            {
                "id": str(uuid.uuid4()),
                "key": "color_primary",
                "content_type": "color",
                "context": "general",
                "default_value": "#4fc3f7",
                "current_value": "#4fc3f7",
                "description": "Primary brand color",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            {
                "id": str(uuid.uuid4()),
                "key": "color_secondary",
                "content_type": "color",
                "context": "general",
                "default_value": "#29b6f6",
                "current_value": "#29b6f6",
                "description": "Secondary brand color",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            },
            {
                "id": str(uuid.uuid4()),
                "key": "color_accent",
                "content_type": "color",
                "context": "general",
                "default_value": "#ffd700",
                "current_value": "#ffd700",
                "description": "Accent color for highlights",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system",
                "updated_by": None
            }
        ]
        
        # Insert default content
        cms_content_collection.insert_many(default_content)
        
        # Create default theme
        default_theme = {
            "id": str(uuid.uuid4()),
            "name": "WoBeRa Default",
            "colors": {
                "primary": "#4fc3f7",
                "secondary": "#29b6f6",
                "accent": "#ffd700",
                "success": "#22c55e",
                "warning": "#f59e0b",
                "error": "#ef4444",
                "background": "#1a1a1a",
                "surface": "#2a2a2a",
                "text": "#ffffff"
            },
            "fonts": {
                "primary": "Inter, sans-serif",
                "secondary": "Roboto, sans-serif"
            },
            "is_active": True,
            "is_default": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "system",
            "updated_by": None
        }
        
        cms_themes_collection.insert_one(default_theme)
        
        print(f"✅ Initialized {len(default_content)} default CMS content items and 1 default theme")
    
    except Exception as e:
        print(f"❌ Error initializing default CMS content: {str(e)}")

# Initialize CMS content on startup
initialize_default_cms_content()

# =============================================================================
# SPORTSDUEL API ENDPOINTS
# =============================================================================

# SportsDuel League Management
@app.get("/api/sportsduel/leagues")
async def get_sportsduel_leagues():
    """Get all SportsDuel leagues"""
    try:
        leagues = list(sportsduel_leagues_collection.find({}))
        
        # Convert ObjectId to string for JSON serialization
        for league in leagues:
            if "_id" in league:
                league["_id"] = str(league["_id"])
            
            # Convert datetime objects
            for field in ["start_date", "end_date", "created_at", "updated_at"]:
                if field in league and league[field]:
                    league[field] = league[field].isoformat() if isinstance(league[field], datetime) else league[field]
        
        return CustomJSONResponse(content={"leagues": leagues, "total": len(leagues)})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leagues: {str(e)}")

@app.post("/api/admin/sportsduel/leagues")
async def create_sportsduel_league(league_data: SportsDuelLeagueCreate, current_user: dict = Depends(get_current_user)):
    """Create new SportsDuel league (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        league_id = str(uuid.uuid4())
        league = {
            "id": league_id,
            "name": league_data.name,
            "description": league_data.description,
            "season": league_data.season,
            "max_teams": league_data.max_teams,
            "status": "active",
            "entry_fee": league_data.entry_fee,
            "prize_pool": league_data.prize_pool,
            "start_date": league_data.start_date,
            "end_date": league_data.end_date,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        sportsduel_leagues_collection.insert_one(league)
        
        # Convert datetime for response
        for field in ["start_date", "end_date", "created_at", "updated_at"]:
            if field in league and league[field]:
                league[field] = league[field].isoformat()
        
        return CustomJSONResponse(content={"message": "League created successfully", "league": league})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating league: {str(e)}")

# SportsDuel Team Management (Sports Cafes)
@app.get("/api/sportsduel/teams")
async def get_sportsduel_teams(league_id: str = None):
    """Get all SportsDuel teams (Sports Cafes)"""
    try:
        query = {}
        if league_id:
            query["league_id"] = league_id
            
        teams = list(sportsduel_teams_collection.find(query))
        
        for team in teams:
            if "_id" in team:
                team["_id"] = str(team["_id"])
            
            # Convert datetime objects
            for field in ["created_at", "updated_at"]:
                if field in team and team[field]:
                    team[field] = team[field].isoformat() if isinstance(team[field], datetime) else team[field]
        
        return CustomJSONResponse(content={"teams": teams, "total": len(teams)})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teams: {str(e)}")

@app.post("/api/sportsduel/teams")
async def create_sportsduel_team(team_data: SportsDuelTeamCreate, current_user: dict = Depends(get_current_user)):
    """Create new SportsDuel team (Sports Cafe)"""
    try:
        # Check if user already owns a team
        existing_team = sportsduel_teams_collection.find_one({"owner_user_id": current_user["id"]})
        if existing_team:
            raise HTTPException(status_code=400, detail="You already own a sports cafe team")
        
        team_id = str(uuid.uuid4())
        team = {
            "id": team_id,
            "name": team_data.name,
            "cafe_name": team_data.cafe_name,
            "location": team_data.location,
            "country": team_data.country,
            "city": team_data.city,
            "logo_url": team_data.logo_url,
            "owner_user_id": current_user["id"],
            "contact_email": team_data.contact_email,
            "contact_phone": team_data.contact_phone,
            "league_id": None,
            "status": "active",
            "wins": 0,
            "losses": 0,
            "draws": 0,
            "points": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        sportsduel_teams_collection.insert_one(team)
        
        # Convert datetime for response
        for field in ["created_at", "updated_at"]:
            if field in team and team[field]:
                team[field] = team[field].isoformat()
        
        return CustomJSONResponse(content={"message": "Sports Cafe team created successfully", "team": team})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating team: {str(e)}")

# SportsDuel Player Management
@app.get("/api/sportsduel/teams/{team_id}/players")
async def get_team_players(team_id: str):
    """Get all players for a specific team"""
    try:
        players = list(sportsduel_players_collection.find({"team_id": team_id}))
        
        for player in players:
            if "_id" in player:
                player["_id"] = str(player["_id"])
                
            # Convert datetime objects  
            for field in ["joined_at", "last_match_at"]:
                if field in player and player[field]:
                    player[field] = player[field].isoformat() if isinstance(player[field], datetime) else player[field]
        
        return CustomJSONResponse(content={"players": players, "total": len(players)})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching players: {str(e)}")

@app.post("/api/sportsduel/teams/{team_id}/players")
async def join_sportsduel_team(team_id: str, player_data: SportsDuelPlayerCreate, current_user: dict = Depends(get_current_user)):
    """Join a SportsDuel team as player"""
    try:
        # Check if team exists
        team = sportsduel_teams_collection.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check if user is already a player in any team
        existing_player = sportsduel_players_collection.find_one({"user_id": current_user["id"]})
        if existing_player:
            raise HTTPException(status_code=400, detail="You are already registered as a player")
        
        player_id = str(uuid.uuid4())
        player = {
            "id": player_id,
            "user_id": current_user["id"],
            "team_id": team_id,
            "nickname": player_data.nickname,
            "avatar_url": player_data.avatar_url or current_user.get("avatar_url"),
            "skill_rating": 1000.0,
            "wins": 0,
            "losses": 0,
            "draws": 0,
            "total_matches": 0,
            "average_accuracy": 0.0,
            "best_streak": 0,
            "current_streak": 0,
            "status": "active",
            "joined_at": datetime.utcnow(),
            "last_match_at": None
        }
        
        sportsduel_players_collection.insert_one(player)
        
        # Convert datetime for response
        if player["joined_at"]:
            player["joined_at"] = player["joined_at"].isoformat()
        
        return CustomJSONResponse(content={"message": "Successfully joined team", "player": player})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error joining team: {str(e)}")

# SportsDuel Time Slots & Events
@app.get("/api/sportsduel/time-slots")
async def get_sportsduel_time_slots(match_date: str = None, league_id: str = None):
    """Get SportsDuel time slots for a specific date"""
    try:
        query = {}
        if match_date:
            query["match_day"] = match_date
        if league_id:
            query["league_id"] = league_id
            
        time_slots = list(sportsduel_time_slots_collection.find(query))
        
        for slot in time_slots:
            if "_id" in slot:
                slot["_id"] = str(slot["_id"])
                
            # Convert datetime objects
            for field in ["start_time", "end_time", "created_at"]:
                if field in slot and slot[field]:
                    slot[field] = slot[field].isoformat() if isinstance(slot[field], datetime) else slot[field]
        
        return CustomJSONResponse(content={"time_slots": time_slots, "total": len(time_slots)})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time slots: {str(e)}")

@app.get("/api/sportsduel/events/{time_slot_id}")
async def get_sports_events_for_slot(time_slot_id: str):
    """Get all sports events for a specific time slot"""
    try:
        events = list(sportsduel_sports_events_collection.find({"time_slot_id": time_slot_id}))
        
        for event in events:
            if "_id" in event:
                event["_id"] = str(event["_id"])
                
            # Convert datetime objects
            for field in ["start_time", "created_at", "updated_at"]:
                if field in event and event[field]:
                    event[field] = event[field].isoformat() if isinstance(event[field], datetime) else event[field]
        
        return CustomJSONResponse(content={"events": events, "total": len(events)})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching events: {str(e)}")

# SportsDuel Match System
@app.get("/api/sportsduel/matches")
async def get_sportsduel_matches(league_id: str = None, time_slot_id: str = None, current_user: dict = Depends(get_current_user)):
    """Get SportsDuel matches"""
    try:
        query = {}
        if league_id:
            query["league_id"] = league_id
        if time_slot_id:
            query["time_slot_id"] = time_slot_id
            
        matches = list(sportsduel_matches_collection.find(query))
        
        # Get additional data for each match
        for match in matches:
            if "_id" in match:
                match["_id"] = str(match["_id"])
            
            # Get team and player info
            team1 = sportsduel_teams_collection.find_one({"id": match["team1_id"]})
            team2 = sportsduel_teams_collection.find_one({"id": match["team2_id"]})
            player1 = sportsduel_players_collection.find_one({"id": match["player1_id"]})
            player2 = sportsduel_players_collection.find_one({"id": match["player2_id"]})
            
            match["team1_name"] = team1["name"] if team1 else "Unknown"
            match["team2_name"] = team2["name"] if team2 else "Unknown"
            match["player1_nickname"] = player1["nickname"] if player1 else "Unknown"
            match["player2_nickname"] = player2["nickname"] if player2 else "Unknown"
            
            # Convert datetime objects
            for field in ["scheduled_at", "started_at", "completed_at", "created_at"]:
                if field in match and match[field]:
                    match[field] = match[field].isoformat() if isinstance(match[field], datetime) else match[field]
        
        return CustomJSONResponse(content={"matches": matches, "total": len(matches)})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching matches: {str(e)}")

# SportsDuel Coupon System
@app.post("/api/sportsduel/coupons")
async def create_sportsduel_coupon(coupon_data: SportsDuelCouponCreate, current_user: dict = Depends(get_current_user)):
    """Create a new SportsDuel coupon"""
    try:
        # Get player info
        player = sportsduel_players_collection.find_one({"user_id": current_user["id"]})
        if not player:
            raise HTTPException(status_code=404, detail="You must be registered as a player first")
        
        # Validate bet count (1-3 bets allowed)
        if not coupon_data.bets or len(coupon_data.bets) > 3:
            raise HTTPException(status_code=400, detail="Coupon must have between 1 and 3 bets")
        
        # Check if match exists
        match = sportsduel_matches_collection.find_one({"id": coupon_data.match_id})
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Check if player is part of this match
        if match["player1_id"] != player["id"] and match["player2_id"] != player["id"]:
            raise HTTPException(status_code=403, detail="You are not part of this match")
        
        # Check if player already has a coupon for this match
        existing_coupon = sportsduel_coupons_collection.find_one({
            "player_id": player["id"],
            "match_id": coupon_data.match_id
        })
        if existing_coupon:
            raise HTTPException(status_code=400, detail="You already have a coupon for this match")
        
        coupon_id = str(uuid.uuid4())
        total_odds = 1.0
        bets = []
        
        # Process each bet
        for bet_data in coupon_data.bets:
            bet_id = str(uuid.uuid4())
            bet = {
                "id": bet_id,
                "event_id": bet_data["event_id"],
                "selection": bet_data["selection"],
                "odds": bet_data["odds"],
                "is_correct": None,
                "created_at": datetime.utcnow()
            }
            bets.append(bet)
            total_odds *= bet["odds"]
        
        coupon = {
            "id": coupon_id,
            "player_id": player["id"],
            "match_id": coupon_data.match_id,
            "time_slot_id": match["time_slot_id"],
            "bets": bets,
            "max_bets": 3,
            "total_odds": total_odds,
            "correct_predictions": 0,
            "wrong_predictions": 0,
            "has_winning_selection": False,
            "is_winner": None,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "evaluated_at": None
        }
        
        sportsduel_coupons_collection.insert_one(coupon)
        
        # Update match with coupon ID
        if match["player1_id"] == player["id"]:
            sportsduel_matches_collection.update_one(
                {"id": coupon_data.match_id},
                {"$set": {"player1_coupon_id": coupon_id}}
            )
        else:
            sportsduel_matches_collection.update_one(
                {"id": coupon_data.match_id},
                {"$set": {"player2_coupon_id": coupon_id}}
            )
        
        # Convert datetime for response
        coupon["created_at"] = coupon["created_at"].isoformat()
        for bet in coupon["bets"]:
            bet["created_at"] = bet["created_at"].isoformat()
        
        return CustomJSONResponse(content={"message": "Coupon created successfully", "coupon": coupon})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating coupon: {str(e)}")

@app.get("/api/sportsduel/scoreboard/{league_id}")
async def get_sportsduel_scoreboard(league_id: str):
    """Get live SportsDuel scoreboard for a league"""
    try:
        # Get active matches for the league
        matches = list(sportsduel_matches_collection.find({
            "league_id": league_id,
            "status": {"$in": ["active", "completed"]}
        }))
        
        scoreboard_data = []
        
        for match in matches:
            if "_id" in match:
                match["_id"] = str(match["_id"])
            
            # Get team info
            team1 = sportsduel_teams_collection.find_one({"id": match["team1_id"]})
            team2 = sportsduel_teams_collection.find_one({"id": match["team2_id"]})
            
            # Get player info
            player1 = sportsduel_players_collection.find_one({"id": match["player1_id"]})
            player2 = sportsduel_players_collection.find_one({"id": match["player2_id"]})
            
            # Get coupon info if available
            player1_coupon = None
            player2_coupon = None
            
            if match.get("player1_coupon_id"):
                player1_coupon = sportsduel_coupons_collection.find_one({"id": match["player1_coupon_id"]})
            
            if match.get("player2_coupon_id"):
                player2_coupon = sportsduel_coupons_collection.find_one({"id": match["player2_coupon_id"]})
            
            match_data = {
                "match_id": match["id"],
                "status": match["status"],
                "team1": {
                    "id": team1["id"] if team1 else None,
                    "name": team1["name"] if team1 else "Unknown",
                    "logo_url": team1.get("logo_url") if team1 else None,
                    "player": {
                        "id": player1["id"] if player1 else None,
                        "nickname": player1["nickname"] if player1 else "Unknown",
                        "avatar_url": player1.get("avatar_url") if player1 else None,
                        "coupon_status": player1_coupon["status"] if player1_coupon else "pending",
                        "correct_predictions": player1_coupon["correct_predictions"] if player1_coupon else 0,
                        "wrong_predictions": player1_coupon["wrong_predictions"] if player1_coupon else 0,
                        "total_odds": player1_coupon["total_odds"] if player1_coupon else 0,
                        "has_winning": player1_coupon["has_winning_selection"] if player1_coupon else False
                    }
                },
                "team2": {
                    "id": team2["id"] if team2 else None,
                    "name": team2["name"] if team2 else "Unknown", 
                    "logo_url": team2.get("logo_url") if team2 else None,
                    "player": {
                        "id": player2["id"] if player2 else None,
                        "nickname": player2["nickname"] if player2 else "Unknown",
                        "avatar_url": player2.get("avatar_url") if player2 else None,
                        "coupon_status": player2_coupon["status"] if player2_coupon else "pending",
                        "correct_predictions": player2_coupon["correct_predictions"] if player2_coupon else 0,
                        "wrong_predictions": player2_coupon["wrong_predictions"] if player2_coupon else 0,
                        "total_odds": player2_coupon["total_odds"] if player2_coupon else 0,
                        "has_winning": player2_coupon["has_winning_selection"] if player2_coupon else False
                    }
                },
                "winner_player_id": match.get("winner_player_id"),
                "match_result": match.get("match_result")
            }
            
            # Convert datetime objects
            for field in ["scheduled_at", "started_at", "completed_at"]:
                if field in match and match[field]:
                    match_data[field] = match[field].isoformat() if isinstance(match[field], datetime) else match[field]
            
            scoreboard_data.append(match_data)
        
        return CustomJSONResponse(content={"scoreboard": scoreboard_data, "total": len(scoreboard_data)})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scoreboard: {str(e)}")

print("✅ SportsDuel API endpoints loaded successfully")

# =============================================================================
# SPORTSDUEL SAMPLE DATA INITIALIZATION
# =============================================================================

def initialize_sportsduel_sample_data():
    """Initialize SportsDuel with sample data for testing"""
    try:
        # Check if already initialized
        if sportsduel_leagues_collection.count_documents({}) > 0:
            return  # Already initialized
        
        # Create sample league
        league_id = str(uuid.uuid4())
        sample_league = {
            "id": league_id,
            "name": "SportsDuel Championship 2024",
            "description": "Professional Sports Cafe Championship",
            "season": "2024",
            "max_teams": 16,
            "status": "active",
            "entry_fee": 100.0,
            "prize_pool": 1600.0,
            "start_date": datetime.utcnow(),
            "end_date": datetime.utcnow() + timedelta(days=90),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        sportsduel_leagues_collection.insert_one(sample_league)
        
        # Create sample teams (Sports Cafes)
        sample_teams = [
            {
                "id": str(uuid.uuid4()),
                "name": "Chelsea Wizards",
                "cafe_name": "Blue Moon Sports Cafe",
                "location": "London, UK",
                "country": "UK",
                "city": "London",
                "logo_url": "https://via.placeholder.com/100x100/0055A4/FFFFFF?text=CW",
                "owner_user_id": "demo_owner_1",
                "contact_email": "info@bluemoon.cafe",
                "contact_phone": "+44-123-456-789",
                "league_id": league_id,
                "status": "active",
                "wins": 5,
                "losses": 2,
                "draws": 1,
                "points": 16,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Arsenal Legends",
                "cafe_name": "The Gunners Den",
                "location": "North London, UK",
                "country": "UK", 
                "city": "London",
                "logo_url": "https://via.placeholder.com/100x100/EF0107/FFFFFF?text=AL",
                "owner_user_id": "demo_owner_2",
                "contact_email": "info@gunnersden.cafe",
                "contact_phone": "+44-987-654-321",
                "league_id": league_id,
                "status": "active",
                "wins": 4,
                "losses": 3,
                "draws": 1,
                "points": 13,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        
        sportsduel_teams_collection.insert_many(sample_teams)
        
        # Create sample players
        sample_players = [
            {
                "id": str(uuid.uuid4()),
                "user_id": "demo_player_1",
                "team_id": sample_teams[0]["id"],
                "nickname": "BlueStriker",
                "avatar_url": "https://via.placeholder.com/80x80/0055A4/FFFFFF?text=BS",
                "skill_rating": 1250.0,
                "wins": 8,
                "losses": 3,
                "draws": 1,
                "total_matches": 12,
                "average_accuracy": 75.5,
                "best_streak": 5,
                "current_streak": 2,
                "status": "active",
                "joined_at": datetime.utcnow() - timedelta(days=30),
                "last_match_at": datetime.utcnow() - timedelta(hours=2)
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": "demo_player_2", 
                "team_id": sample_teams[1]["id"],
                "nickname": "CannonBall",
                "avatar_url": "https://via.placeholder.com/80x80/EF0107/FFFFFF?text=CB",
                "skill_rating": 1180.0,
                "wins": 6,
                "losses": 5,
                "draws": 2,
                "total_matches": 13,
                "average_accuracy": 68.2,
                "best_streak": 3,
                "current_streak": 1,
                "status": "active",
                "joined_at": datetime.utcnow() - timedelta(days=25),
                "last_match_at": datetime.utcnow() - timedelta(hours=1)
            }
        ]
        
        sportsduel_players_collection.insert_many(sample_players)
        
        # Create today's time slots
        today = datetime.utcnow().strftime("%Y-%m-%d")
        create_sportsduel_time_slots_for_day(today, league_id)
        
        # Create sample sports events for the afternoon slot
        afternoon_slot = sportsduel_time_slots_collection.find_one({
            "match_day": today,
            "slot_name": "Afternoon Slot"
        })
        
        if afternoon_slot:
            generate_sample_sports_events(afternoon_slot["id"], today)
            
            # Create a sample match
            match_id = str(uuid.uuid4())
            sample_match = {
                "id": match_id,
                "league_id": league_id,
                "time_slot_id": afternoon_slot["id"],
                "team1_id": sample_teams[0]["id"],
                "team2_id": sample_teams[1]["id"],
                "player1_id": sample_players[0]["id"],
                "player2_id": sample_players[1]["id"],
                "player1_coupon_id": None,
                "player2_coupon_id": None,
                "winner_player_id": None,
                "match_result": None,
                "status": "scheduled",
                "scheduled_at": datetime.utcnow() + timedelta(hours=1),
                "started_at": None,
                "completed_at": None,
                "created_at": datetime.utcnow()
            }
            sportsduel_matches_collection.insert_one(sample_match)
        
        print("✅ SportsDuel sample data initialized successfully")
        
    except Exception as e:
        print(f"❌ Error initializing SportsDuel sample data: {e}")

# Initialize SportsDuel sample data on startup
initialize_sportsduel_sample_data()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)