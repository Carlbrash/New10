from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from enum import Enum
import asyncio


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Wobera Admin Dashboard API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BANNED = "banned"

class ContentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class ContentType(str, Enum):
    ARTICLE = "article"
    POST = "post"
    PAGE = "page"

# Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    avatar_url: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    avatar_url: Optional[str] = None

class UserStats(BaseModel):
    total_users: int
    active_users: int
    new_users_today: int
    new_users_this_week: int
    users_by_role: Dict[str, int]

# Content Models
class Content(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    content_type: ContentType = ContentType.ARTICLE
    status: ContentStatus = ContentStatus.DRAFT
    author_id: str
    author_name: str
    tags: List[str] = []
    featured_image: Optional[str] = None
    views: int = 0
    likes: int = 0
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ContentCreate(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    content_type: ContentType = ContentType.ARTICLE
    status: ContentStatus = ContentStatus.DRAFT
    author_id: str
    author_name: str
    tags: List[str] = []
    featured_image: Optional[str] = None

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    content_type: Optional[ContentType] = None
    status: Optional[ContentStatus] = None
    tags: Optional[List[str]] = None
    featured_image: Optional[str] = None

class ContentStats(BaseModel):
    total_content: int
    published_content: int
    draft_content: int
    total_views: int
    content_by_type: Dict[str, int]

# Analytics Models
class AnalyticsOverview(BaseModel):
    total_users: int
    total_content: int
    total_views: int
    total_likes: int
    users_growth: float
    content_growth: float
    popular_content: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]

class ActivityLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    action: str
    resource_type: str
    resource_id: str
    details: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Settings Models
class SystemSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    site_name: str = "Wobera Dashboard"
    site_description: str = "Admin Dashboard for Wobera"
    site_logo: Optional[str] = None
    maintenance_mode: bool = False
    registration_enabled: bool = True
    email_notifications: bool = True
    max_upload_size: int = 10  # MB
    allowed_file_types: List[str] = ["jpg", "jpeg", "png", "gif", "pdf"]
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SettingsUpdate(BaseModel):
    site_name: Optional[str] = None
    site_description: Optional[str] = None
    site_logo: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    registration_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None
    max_upload_size: Optional[int] = None
    allowed_file_types: Optional[List[str]] = None

# System Health Models
class SystemHealth(BaseModel):
    status: str
    database_status: str
    uptime: str
    memory_usage: str
    disk_usage: str
    last_backup: Optional[datetime] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Helper Functions
async def log_activity(user_id: str, user_name: str, action: str, resource_type: str, resource_id: str, details: Dict = {}):
    """Log user activity for admin monitoring"""
    activity = ActivityLog(
        user_id=user_id,
        user_name=user_name,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )
    await db.activity_logs.insert_one(activity.dict())

# Original routes (keeping compatibility)
@api_router.get("/")
async def root():
    return {"message": "Wobera Admin Dashboard API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Admin User Management APIs
@api_router.get("/admin/users", response_model=List[User])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    search: Optional[str] = None
):
    """Get all users with pagination and filtering"""
    filter_query = {}
    
    if role:
        filter_query["role"] = role
    if status:
        filter_query["status"] = status
    if search:
        filter_query["$or"] = [
            {"username": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"full_name": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(filter_query).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    return [User(**user) for user in users]

@api_router.post("/admin/users", response_model=User)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    # Check if username or email already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"username": user_data.username},
            {"email": user_data.email}
        ]
    })
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    
    # Log activity
    await log_activity("system", "System", "CREATE", "user", user.id, {"username": user.username})
    
    return user

@api_router.put("/admin/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_update: UserUpdate):
    """Update user information"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id})
    
    # Log activity
    await log_activity("admin", "Admin", "UPDATE", "user", user_id, update_data)
    
    return User(**updated_user)

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str):
    """Delete a user"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.delete_one({"id": user_id})
    
    # Log activity
    await log_activity("admin", "Admin", "DELETE", "user", user_id, {"username": user["username"]})
    
    return {"message": "User deleted successfully"}

@api_router.get("/admin/users/stats", response_model=UserStats)
async def get_user_stats():
    """Get user statistics"""
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"status": "active"})
    
    # Users created today
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    new_users_today = await db.users.count_documents({"created_at": {"$gte": today}})
    
    # Users created this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_this_week = await db.users.count_documents({"created_at": {"$gte": week_ago}})
    
    # Users by role
    pipeline = [
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]
    role_stats = await db.users.aggregate(pipeline).to_list(None)
    users_by_role = {item["_id"]: item["count"] for item in role_stats}
    
    return UserStats(
        total_users=total_users,
        active_users=active_users,
        new_users_today=new_users_today,
        new_users_this_week=new_users_this_week,
        users_by_role=users_by_role
    )

# Admin Content Management APIs
@api_router.get("/admin/content", response_model=List[Content])
async def get_content(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[ContentStatus] = None,
    content_type: Optional[ContentType] = None,
    author_id: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all content with pagination and filtering"""
    filter_query = {}
    
    if status:
        filter_query["status"] = status
    if content_type:
        filter_query["content_type"] = content_type
    if author_id:
        filter_query["author_id"] = author_id
    if search:
        filter_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search]}}
        ]
    
    content_list = await db.content.find(filter_query).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    return [Content(**content) for content in content_list]

@api_router.post("/admin/content", response_model=Content)
async def create_content(content_data: ContentCreate):
    """Create new content"""
    # Check if slug already exists
    existing_content = await db.content.find_one({"slug": content_data.slug})
    if existing_content:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    content = Content(**content_data.dict())
    if content.status == ContentStatus.PUBLISHED:
        content.published_at = datetime.utcnow()
    
    await db.content.insert_one(content.dict())
    
    # Log activity
    await log_activity(content.author_id, content.author_name, "CREATE", "content", content.id, {"title": content.title})
    
    return content

@api_router.put("/admin/content/{content_id}", response_model=Content)
async def update_content(content_id: str, content_update: ContentUpdate):
    """Update content"""
    content = await db.content.find_one({"id": content_id})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    update_data = {k: v for k, v in content_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Set published_at if status changes to published
    if update_data.get("status") == ContentStatus.PUBLISHED and content["status"] != ContentStatus.PUBLISHED:
        update_data["published_at"] = datetime.utcnow()
    
    await db.content.update_one({"id": content_id}, {"$set": update_data})
    
    updated_content = await db.content.find_one({"id": content_id})
    
    # Log activity
    await log_activity("admin", "Admin", "UPDATE", "content", content_id, update_data)
    
    return Content(**updated_content)

@api_router.delete("/admin/content/{content_id}")
async def delete_content(content_id: str):
    """Delete content"""
    content = await db.content.find_one({"id": content_id})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    await db.content.delete_one({"id": content_id})
    
    # Log activity
    await log_activity("admin", "Admin", "DELETE", "content", content_id, {"title": content["title"]})
    
    return {"message": "Content deleted successfully"}

@api_router.get("/admin/content/stats", response_model=ContentStats)
async def get_content_stats():
    """Get content statistics"""
    total_content = await db.content.count_documents({})
    published_content = await db.content.count_documents({"status": "published"})
    draft_content = await db.content.count_documents({"status": "draft"})
    
    # Total views
    pipeline = [{"$group": {"_id": None, "total_views": {"$sum": "$views"}}}]
    views_result = await db.content.aggregate(pipeline).to_list(None)
    total_views = views_result[0]["total_views"] if views_result else 0
    
    # Content by type
    pipeline = [{"$group": {"_id": "$content_type", "count": {"$sum": 1}}}]
    type_stats = await db.content.aggregate(pipeline).to_list(None)
    content_by_type = {item["_id"]: item["count"] for item in type_stats}
    
    return ContentStats(
        total_content=total_content,
        published_content=published_content,
        draft_content=draft_content,
        total_views=total_views,
        content_by_type=content_by_type
    )

# Analytics APIs
@api_router.get("/admin/analytics/overview", response_model=AnalyticsOverview)
async def get_analytics_overview():
    """Get dashboard analytics overview"""
    # Get basic stats
    total_users = await db.users.count_documents({})
    total_content = await db.content.count_documents({})
    
    # Total views and likes
    views_pipeline = [{"$group": {"_id": None, "total_views": {"$sum": "$views"}, "total_likes": {"$sum": "$likes"}}}]
    stats_result = await db.content.aggregate(views_pipeline).to_list(None)
    total_views = stats_result[0]["total_views"] if stats_result else 0
    total_likes = stats_result[0]["total_likes"] if stats_result else 0
    
    # Growth calculations (simplified - you can enhance with actual time-based calculations)
    users_growth = 15.5  # Mock data - implement actual calculation
    content_growth = 8.2  # Mock data - implement actual calculation
    
    # Popular content
    popular_content = await db.content.find({}).sort("views", -1).limit(5).to_list(5)
    popular_content_list = [
        {"id": content["id"], "title": content["title"], "views": content["views"]}
        for content in popular_content
    ]
    
    # Recent activity
    recent_activity = await db.activity_logs.find({}).sort("timestamp", -1).limit(10).to_list(10)
    recent_activity_list = [
        {
            "user_name": activity["user_name"],
            "action": activity["action"],
            "resource_type": activity["resource_type"],
            "timestamp": activity["timestamp"]
        }
        for activity in recent_activity
    ]
    
    return AnalyticsOverview(
        total_users=total_users,
        total_content=total_content,
        total_views=total_views,
        total_likes=total_likes,
        users_growth=users_growth,
        content_growth=content_growth,
        popular_content=popular_content_list,
        recent_activity=recent_activity_list
    )

@api_router.get("/admin/analytics/activity", response_model=List[ActivityLog])
async def get_recent_activity(limit: int = Query(50, ge=1, le=100)):
    """Get recent activity logs"""
    activities = await db.activity_logs.find({}).sort("timestamp", -1).limit(limit).to_list(limit)
    return [ActivityLog(**activity) for activity in activities]

# Settings APIs
@api_router.get("/admin/settings", response_model=SystemSettings)
async def get_settings():
    """Get system settings"""
    settings = await db.settings.find_one({})
    if not settings:
        # Create default settings
        default_settings = SystemSettings()
        await db.settings.insert_one(default_settings.dict())
        return default_settings
    return SystemSettings(**settings)

@api_router.put("/admin/settings", response_model=SystemSettings)
async def update_settings(settings_update: SettingsUpdate):
    """Update system settings"""
    existing_settings = await db.settings.find_one({})
    
    if not existing_settings:
        # Create new settings
        new_settings = SystemSettings(**settings_update.dict(exclude_unset=True))
        await db.settings.insert_one(new_settings.dict())
        return new_settings
    
    update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.settings.update_one({"id": existing_settings["id"]}, {"$set": update_data})
    
    updated_settings = await db.settings.find_one({"id": existing_settings["id"]})
    
    # Log activity
    await log_activity("admin", "Admin", "UPDATE", "settings", existing_settings["id"], update_data)
    
    return SystemSettings(**updated_settings)

# System Health APIs
@api_router.get("/admin/system/health", response_model=SystemHealth)
async def get_system_health():
    """Get system health status"""
    # Check database connection
    try:
        await db.command("ping")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    # Mock system stats (in production, you'd get real system metrics)
    return SystemHealth(
        status="healthy" if db_status == "healthy" else "degraded",
        database_status=db_status,
        uptime="2 days, 5 hours",
        memory_usage="45%",
        disk_usage="23%",
        last_backup=datetime.utcnow() - timedelta(hours=6)
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()