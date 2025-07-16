# =============================================================================
# SOCIAL SHARING SYSTEM API ENDPOINTS
# =============================================================================

from fastapi import HTTPException, Depends
from typing import Optional
import uuid
from datetime import datetime
import json


def setup_social_sharing_endpoints(app, verify_token, verify_admin_token, 
                                   social_shares_collection, share_templates_collection, 
                                   share_stats_collection, viral_metrics_collection,
                                   share_clicks_collection, tournaments_collection,
                                   tournament_participants_collection, teams_collection,
                                   generate_share_content, create_share_url, track_share_click,
                                   calculate_viral_coefficient, ShareRequest, ShareType,
                                   SocialPlatform, PaymentStatus):
    """Setup social sharing endpoints"""
    
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

    @app.post("/api/social/share/{share_id}/shared")
    async def mark_as_shared(share_id: str, user_id: str = Depends(verify_token)):
        """Mark share as actually shared (user confirmed sharing)"""
        try:
            # Update share record
            result = social_shares_collection.update_one(
                {"id": share_id, "user_id": user_id},
                {"$set": {"shared_at": datetime.utcnow()}}
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Share not found")
            
            return {"message": "Share marked as shared successfully"}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error marking share as shared: {str(e)}")

    @app.get("/api/social/share/{share_id}/click")
    async def track_share_click_endpoint(share_id: str, ref: Optional[str] = None):
        """Track share click and redirect to main page"""
        try:
            # Track the click
            track_share_click(share_id, ref)
            
            # Get share details for redirect
            share = social_shares_collection.find_one({"id": share_id})
            if not share:
                raise HTTPException(status_code=404, detail="Share not found")
            
            # Determine redirect URL based on share type
            redirect_url = "https://256afdf2-fd60-42a3-bf4a-1e98ae9326e2.preview.emergentagent.com"
            
            if share["share_type"] == ShareType.TOURNAMENT_VICTORY:
                redirect_url += f"/tournament/{share['metadata']['tournament_id']}"
            elif share["share_type"] == ShareType.TEAM_FORMATION:
                redirect_url += f"/team/{share['metadata']['team_id']}"
            elif share["share_type"] == ShareType.TOURNAMENT_PARTICIPATION:
                redirect_url += f"/tournament/{share['metadata']['tournament_id']}"
            
            return {
                "redirect_url": redirect_url,
                "share_data": {
                    "title": share["title"],
                    "description": share["description"],
                    "share_type": share["share_type"]
                }
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error tracking share click: {str(e)}")

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

    @app.post("/api/teams/{team_id}/share-formation")
    async def share_team_formation(team_id: str, platform: SocialPlatform, user_id: str = Depends(verify_token)):
        """Share team formation"""
        try:
            # Check if user is team captain
            team = teams_collection.find_one({"id": team_id})
            if not team:
                raise HTTPException(status_code=404, detail="Team not found")
            
            if team.get("captain_id") != user_id:
                raise HTTPException(status_code=403, detail="Only team captain can share team formation")
            
            # Generate share content
            share_data = generate_share_content(
                user_id=user_id,
                share_type=ShareType.TEAM_FORMATION,
                reference_id=team_id,
                platform=platform
            )
            
            # Create share record
            share_id = str(uuid.uuid4())
            share_url = create_share_url(share_id, user_id)
            
            share_record = {
                "id": share_id,
                "user_id": user_id,
                "share_type": ShareType.TEAM_FORMATION,
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
            raise HTTPException(status_code=500, detail=f"Error sharing team formation: {str(e)}")

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

    return app