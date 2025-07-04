from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
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

# Collections
users_collection = db.users
rankings_collection = db.rankings
competitions_collection = db.competitions
tournaments_collection = db.tournaments
tournament_participants_collection = db.tournament_participants
admin_actions_collection = db.admin_actions
site_messages_collection = db.site_messages
content_pages_collection = db.content_pages
menu_items_collection = db.menu_items

app = FastAPI(title="WoBeRa - World Betting Rank API")

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
    
    return {"message": "User registered successfully", "token": token, "user_id": user_id}

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
        entry_fee_category = EntryFeeCategory.BASIC
        if tournament.entry_fee <= 10:
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

# Helper function for admin actions
def log_admin_action(user_id: str, action_type: str, target_tournament_id: str = None, details: dict = None):
    """Log admin action for tournaments"""
    try:
        action_data = {
            "id": str(uuid.uuid4()),
            "admin_id": user_id,
            "action_type": action_type,
            "target_tournament_id": target_tournament_id,
            "details": details or {},
            "timestamp": datetime.utcnow()
        }
        admin_actions_collection.insert_one(action_data)
    except Exception as e:
        print(f"Error logging admin action: {e}")

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

@app.get("/api/reset-data")
async def reset_data():
    """Reset all sample data for testing"""
    try:
        # Clear existing data
        users_collection.delete_many({})
        competitions_collection.delete_many({})
        tournaments_collection.delete_many({})
        tournament_participants_collection.delete_many({})
        
        # Recreate sample data
        await startup_event()
        
        # Force create test user
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