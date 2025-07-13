from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
from typing import Optional, List
import os
import hashlib
import jwt
from datetime import datetime, timedelta
import uuid
from enum import Enum
import json

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
team_applications_collection = db.team_applications

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

class TeamInvite(BaseModel):
    username: str

class TeamApplicationRequest(BaseModel):
    application_text: str

class TeamTransferCaptaincy(BaseModel):
    new_captain_id: str

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

class PayoutRequest(BaseModel):
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
    base_url = "https://9fc18cff-1249-43ae-83c1-4c2499a8c5c3.preview.emergentagent.com"
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
        
        # Convert ObjectId to string
        if "_id" in wallet:
            wallet["_id"] = str(wallet["_id"])
        
        return wallet
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
        elif transaction_type in ["payout_requested", "payout_completed", "penalty"]:
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
    
    token = create_token(user_data["id"])
    return {"message": "Login successful", "token": token, "user_id": user_data["id"]}

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
            "payment_status": "pending",  # For now, we'll mark as pending
            "current_round": 1,
            "is_eliminated": False,
            "eliminated_at": None,
            "final_position": None,
            "prize_won": None
        }
        
        tournament_participants_collection.insert_one(participant_data)
        
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
        
        return {"message": "Successfully joined tournament", "participant_id": participant_id}
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
async def request_payout(request: PayoutRequest, user_id: str = Depends(verify_token)):
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)