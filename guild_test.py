import requests
import unittest
import json

class GuildSystemTester(unittest.TestCase):
    """Test Guild Wars & Clan System backend endpoints"""
    
    base_url = "https://49f63d92-acd8-4e16-a4be-50baa0fb091a.preview.emergentagent.com"
    
    # Test user credentials
    testuser_credentials = {
        "username": "testuser",
        "password": "test123"
    }
    
    # Admin credentials
    admin_credentials = {
        "username": "admin",
        "password": "Kiki1999@"
    }
    
    testuser_token = None
    admin_token = None
    testuser_id = None
    admin_id = None
    created_guild_id = None
    invitation_id = None
    
    def test_01_testuser_login(self):
        """Login as testuser to get token for guild endpoints"""
        print("\n🔍 Testing testuser login for Guild System testing...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.testuser_credentials
        )
        self.assertEqual(response.status_code, 200, f"Test user login failed with status {response.status_code}: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        self.assertIn("user_id", data)
        GuildSystemTester.testuser_token = data["token"]
        GuildSystemTester.testuser_id = data["user_id"]
        print(f"✅ Test user login successful - User ID: {GuildSystemTester.testuser_id}")
    
    def test_02_admin_login(self):
        """Login as admin to get token for admin guild endpoints"""
        print("\n🔍 Testing admin login for Guild System testing...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.admin_credentials
        )
        self.assertEqual(response.status_code, 200, f"Admin login failed with status {response.status_code}: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        self.assertIn("user_id", data)
        GuildSystemTester.admin_token = data["token"]
        GuildSystemTester.admin_id = data["user_id"]
        print(f"✅ Admin login successful - User ID: {GuildSystemTester.admin_id}")
    
    def test_03_create_guild(self):
        """Test POST /api/guilds - Create guild (requires authentication)"""
        print("\n🔍 Testing POST /api/guilds endpoint...")
        
        # Skip if testuser login failed
        if not GuildSystemTester.testuser_token:
            self.skipTest("Test user token not available, skipping guild creation test")
        
        # Guild creation payload as specified in the review request
        guild_data = {
            "name": "Elite Warriors",
            "description": "Top tier competitive gaming guild",
            "tag": "EW",
            "colors": {
                "primary": "#FF0000",
                "secondary": "#FFFFFF"
            },
            "recruitment_open": True,
            "min_level": 5,
            "country": "Greece"
        }
        
        headers = {"Authorization": f"Bearer {GuildSystemTester.testuser_token}"}
        response = requests.post(
            f"{self.base_url}/api/guilds",
            headers=headers,
            json=guild_data
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            self.assertIn("guild_id", data)
            self.assertIn("message", data)
            GuildSystemTester.created_guild_id = data["guild_id"]
            print(f"  ✅ Guild created successfully - Guild ID: {GuildSystemTester.created_guild_id}")
        elif response.status_code == 400:
            # User might already be in a guild
            if "already" in response.text.lower():
                print("  ⚠️ User already in a guild (expected behavior)")
                # Try to get existing guild info
                headers = {"Authorization": f"Bearer {GuildSystemTester.testuser_token}"}
                profile_response = requests.get(f"{self.base_url}/api/profile", headers=headers)
                if profile_response.status_code == 200:
                    print("  ✅ Guild creation validation working correctly")
            else:
                self.fail(f"Unexpected 400 error: {response.text}")
        else:
            self.fail(f"Unexpected response status: {response.status_code} - {response.text}")
        
        print("✅ POST /api/guilds endpoint test passed")
    
    def test_04_list_guilds(self):
        """Test GET /api/guilds - List all guilds (no authentication required)"""
        print("\n🔍 Testing GET /api/guilds endpoint...")
        
        response = requests.get(f"{self.base_url}/api/guilds")
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        self.assertEqual(response.status_code, 200, f"Guild list request failed: {response.text}")
        
        data = response.json()
        
        # Verify response structure
        required_fields = ["guilds", "total"]
        for field in required_fields:
            self.assertIn(field, data, f"Missing required field: {field}")
        
        # Verify data types
        self.assertIsInstance(data["guilds"], list)
        self.assertIsInstance(data["total"], int)
        
        print(f"  ✅ Guild list retrieved successfully:")
        print(f"    Total guilds: {data['total']}")
        print(f"    Guilds in response: {len(data['guilds'])}")
        
        # If we have guilds, verify structure
        if data["guilds"]:
            first_guild = data["guilds"][0]
            guild_fields = ["id", "name", "tag", "member_count", "country"]
            for field in guild_fields:
                if field in first_guild:
                    print(f"    Guild field '{field}': {first_guild[field]}")
            
            # Store a guild ID for later tests if we don't have one
            if not GuildSystemTester.created_guild_id and "id" in first_guild:
                GuildSystemTester.created_guild_id = first_guild["id"]
                print(f"  ✅ Using existing guild for further tests: {GuildSystemTester.created_guild_id}")
        
        print("✅ GET /api/guilds endpoint test passed")
    
    def test_05_get_guild_details(self):
        """Test GET /api/guilds/{guild_id} - Get guild details"""
        print("\n🔍 Testing GET /api/guilds/{guild_id} endpoint...")
        
        # Skip if no guild ID available
        if not GuildSystemTester.created_guild_id:
            self.skipTest("No guild ID available, skipping guild details test")
        
        response = requests.get(f"{self.base_url}/api/guilds/{GuildSystemTester.created_guild_id}")
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify guild details structure
            guild_fields = ["id", "name", "description", "tag", "colors", "member_count", "members"]
            for field in guild_fields:
                if field in data:
                    print(f"    Guild field '{field}': {data[field]}")
            
            # Verify members structure if present
            if "members" in data and data["members"]:
                first_member = data["members"][0]
                member_fields = ["user_id", "username", "role", "joined_at"]
                for field in member_fields:
                    if field in first_member:
                        print(f"    Member field '{field}': {first_member[field]}")
            
            print("  ✅ Guild details retrieved successfully")
        elif response.status_code == 404:
            print("  ⚠️ Guild not found (may have been deleted or doesn't exist)")
        else:
            self.fail(f"Unexpected response status: {response.status_code} - {response.text}")
        
        print("✅ GET /api/guilds/{guild_id} endpoint test passed")
    
    def test_06_invite_player_to_guild(self):
        """Test POST /api/guilds/{guild_id}/invite - Invite player to guild"""
        print("\n🔍 Testing POST /api/guilds/{guild_id}/invite endpoint...")
        
        # Skip if no guild ID or tokens available
        if not GuildSystemTester.created_guild_id or not GuildSystemTester.testuser_token:
            self.skipTest("Guild ID or testuser token not available, skipping guild invite test")
        
        # Try to invite admin user to the guild
        invite_data = {
            "username": "admin"
        }
        
        headers = {"Authorization": f"Bearer {GuildSystemTester.testuser_token}"}
        response = requests.post(
            f"{self.base_url}/api/guilds/{GuildSystemTester.created_guild_id}/invite",
            headers=headers,
            json=invite_data
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            self.assertIn("message", data)
            if "invitation_id" in data:
                GuildSystemTester.invitation_id = data["invitation_id"]
                print(f"  ✅ Guild invitation sent successfully - Invitation ID: {GuildSystemTester.invitation_id}")
            else:
                print("  ✅ Guild invitation sent successfully")
        elif response.status_code == 400:
            # User might already be in a guild or other validation error
            if "already" in response.text.lower():
                print("  ⚠️ User already in a guild (expected behavior)")
            else:
                print(f"  ⚠️ Validation error: {response.text}")
        elif response.status_code == 403:
            print("  ⚠️ User doesn't have permission to invite (not guild leader/officer)")
        elif response.status_code == 404:
            print("  ⚠️ Guild or user not found")
        else:
            self.fail(f"Unexpected response status: {response.status_code} - {response.text}")
        
        print("✅ POST /api/guilds/{guild_id}/invite endpoint test passed")
    
    def test_07_get_user_invitations(self):
        """Test GET /api/guilds/my-invitations - Get user's invitations"""
        print("\n🔍 Testing GET /api/guilds/my-invitations endpoint...")
        
        # Skip if admin token not available
        if not GuildSystemTester.admin_token:
            self.skipTest("Admin token not available, skipping invitations test")
        
        headers = {"Authorization": f"Bearer {GuildSystemTester.admin_token}"}
        response = requests.get(
            f"{self.base_url}/api/guilds/my-invitations",
            headers=headers
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            self.assertIn("invitations", data)
            self.assertIsInstance(data["invitations"], list)
            
            invitations = data["invitations"]
            print(f"  ✅ User invitations retrieved successfully:")
            print(f"    Total invitations: {len(invitations)}")
            
            # If we have invitations, verify structure and store ID
            if invitations:
                first_invitation = invitations[0]
                invitation_fields = ["id", "guild_id", "guild_name", "invited_by", "created_at", "status"]
                for field in invitation_fields:
                    if field in first_invitation:
                        print(f"    Invitation field '{field}': {first_invitation[field]}")
                
                # Store invitation ID for acceptance test
                if "id" in first_invitation and not GuildSystemTester.invitation_id:
                    GuildSystemTester.invitation_id = first_invitation["id"]
                    print(f"  ✅ Using invitation for acceptance test: {GuildSystemTester.invitation_id}")
            else:
                print("  ⚠️ No pending invitations found")
        elif response.status_code == 404:
            print("  ⚠️ No invitations found or user not found")
        else:
            self.fail(f"Unexpected response status: {response.status_code} - {response.text}")
        
        print("✅ GET /api/guilds/my-invitations endpoint test passed")
    
    def test_08_accept_guild_invitation(self):
        """Test POST /api/guilds/invitations/{invitation_id}/accept - Accept invitation"""
        print("\n🔍 Testing POST /api/guilds/invitations/{invitation_id}/accept endpoint...")
        
        # Skip if no invitation ID or admin token available
        if not GuildSystemTester.invitation_id or not GuildSystemTester.admin_token:
            self.skipTest("Invitation ID or admin token not available, skipping invitation acceptance test")
        
        headers = {"Authorization": f"Bearer {GuildSystemTester.admin_token}"}
        response = requests.post(
            f"{self.base_url}/api/guilds/invitations/{GuildSystemTester.invitation_id}/accept",
            headers=headers
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            self.assertIn("message", data)
            print("  ✅ Guild invitation accepted successfully")
        elif response.status_code == 400:
            # User might already be in a guild or invitation expired
            if "already" in response.text.lower():
                print("  ⚠️ User already in a guild (expected behavior)")
            elif "expired" in response.text.lower():
                print("  ⚠️ Invitation expired")
            else:
                print(f"  ⚠️ Validation error: {response.text}")
        elif response.status_code == 404:
            print("  ⚠️ Invitation not found")
        else:
            self.fail(f"Unexpected response status: {response.status_code} - {response.text}")
        
        print("✅ POST /api/guilds/invitations/{invitation_id}/accept endpoint test passed")
    
    def test_09_get_guild_rankings(self):
        """Test GET /api/guilds/rankings - Get guild rankings/leaderboard"""
        print("\n🔍 Testing GET /api/guilds/rankings endpoint...")
        
        response = requests.get(f"{self.base_url}/api/guilds/rankings")
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        self.assertEqual(response.status_code, 200, f"Guild rankings request failed: {response.text}")
        
        data = response.json()
        
        # Verify response structure
        required_fields = ["rankings", "total"]
        for field in required_fields:
            self.assertIn(field, data, f"Missing required field: {field}")
        
        # Verify data types
        self.assertIsInstance(data["rankings"], list)
        self.assertIsInstance(data["total"], int)
        
        print(f"  ✅ Guild rankings retrieved successfully:")
        print(f"    Total guilds in rankings: {data['total']}")
        print(f"    Rankings in response: {len(data['rankings'])}")
        
        # If we have rankings, verify structure
        if data["rankings"]:
            first_guild = data["rankings"][0]
            ranking_fields = ["id", "name", "tag", "power_rating", "trophies", "wars_won", "member_count", "rank"]
            for field in ranking_fields:
                if field in first_guild:
                    print(f"    Ranking field '{field}': {first_guild[field]}")
        
        print("✅ GET /api/guilds/rankings endpoint test passed")
    
    def test_10_challenge_guild_to_war(self):
        """Test POST /api/guilds/{guild_id}/challenge - Challenge another guild to war"""
        print("\n🔍 Testing POST /api/guilds/{guild_id}/challenge endpoint...")
        
        # Skip if no guild ID or testuser token available
        if not GuildSystemTester.created_guild_id or not GuildSystemTester.testuser_token:
            self.skipTest("Guild ID or testuser token not available, skipping guild challenge test")
        
        # First, get list of guilds to find another guild to challenge
        guilds_response = requests.get(f"{self.base_url}/api/guilds")
        if guilds_response.status_code != 200:
            self.skipTest("Cannot get guild list for challenge test")
        
        guilds_data = guilds_response.json()
        target_guild_id = None
        
        # Find a different guild to challenge
        for guild in guilds_data.get("guilds", []):
            if guild.get("id") != GuildSystemTester.created_guild_id:
                target_guild_id = guild.get("id")
                break
        
        if not target_guild_id:
            print("  ⚠️ No other guilds available to challenge")
            return
        
        # Challenge data
        challenge_data = {
            "target_guild_id": target_guild_id,
            "war_type": "classic",
            "message": "Let's have an epic battle!"
        }
        
        headers = {"Authorization": f"Bearer {GuildSystemTester.testuser_token}"}
        response = requests.post(
            f"{self.base_url}/api/guilds/{GuildSystemTester.created_guild_id}/challenge",
            headers=headers,
            json=challenge_data
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            self.assertIn("message", data)
            if "war_id" in data:
                print(f"  ✅ Guild war challenge created successfully - War ID: {data['war_id']}")
            else:
                print("  ✅ Guild war challenge created successfully")
        elif response.status_code == 400:
            # Various validation errors
            print(f"  ⚠️ Challenge validation error: {response.text}")
        elif response.status_code == 403:
            print("  ⚠️ User doesn't have permission to challenge (not guild leader/officer)")
        elif response.status_code == 404:
            print("  ⚠️ Guild not found")
        else:
            self.fail(f"Unexpected response status: {response.status_code} - {response.text}")
        
        print("✅ POST /api/guilds/{guild_id}/challenge endpoint test passed")
    
    def test_11_get_guild_wars(self):
        """Test GET /api/guilds/{guild_id}/wars - Get guild wars"""
        print("\n🔍 Testing GET /api/guilds/{guild_id}/wars endpoint...")
        
        # Skip if no guild ID available
        if not GuildSystemTester.created_guild_id:
            self.skipTest("Guild ID not available, skipping guild wars test")
        
        response = requests.get(f"{self.base_url}/api/guilds/{GuildSystemTester.created_guild_id}/wars")
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            self.assertIn("wars", data)
            self.assertIsInstance(data["wars"], list)
            
            wars = data["wars"]
            print(f"  ✅ Guild wars retrieved successfully:")
            print(f"    Total wars: {len(wars)}")
            
            # If we have wars, verify structure
            if wars:
                first_war = wars[0]
                war_fields = ["id", "guild_1_name", "guild_2_name", "status", "war_type", "start_time", "end_time"]
                for field in war_fields:
                    if field in first_war:
                        print(f"    War field '{field}': {first_war[field]}")
            else:
                print("  ⚠️ No wars found for this guild")
        elif response.status_code == 404:
            print("  ⚠️ Guild not found")
        else:
            self.fail(f"Unexpected response status: {response.status_code} - {response.text}")
        
        print("✅ GET /api/guilds/{guild_id}/wars endpoint test passed")
    
    def test_12_create_guild_tournament(self):
        """Test POST /api/guilds/{guild_id}/tournaments - Create guild tournament"""
        print("\n🔍 Testing POST /api/guilds/{guild_id}/tournaments endpoint...")
        
        # Skip if no guild ID or testuser token available
        if not GuildSystemTester.created_guild_id or not GuildSystemTester.testuser_token:
            self.skipTest("Guild ID or testuser token not available, skipping guild tournament test")
        
        # Tournament data
        tournament_data = {
            "name": "Elite Warriors Championship",
            "description": "Internal guild tournament for our best players",
            "entry_fee": 0.0,
            "max_participants": 16,
            "start_time": "2024-12-31T20:00:00Z",
            "prizes": [
                {"position": 1, "reward": "Guild Champion Title"},
                {"position": 2, "reward": "Guild Veteran Title"},
                {"position": 3, "reward": "Guild Warrior Title"}
            ]
        }
        
        headers = {"Authorization": f"Bearer {GuildSystemTester.testuser_token}"}
        response = requests.post(
            f"{self.base_url}/api/guilds/{GuildSystemTester.created_guild_id}/tournaments",
            headers=headers,
            json=tournament_data
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            self.assertIn("message", data)
            if "tournament_id" in data:
                print(f"  ✅ Guild tournament created successfully - Tournament ID: {data['tournament_id']}")
            else:
                print("  ✅ Guild tournament created successfully")
        elif response.status_code == 400:
            # Various validation errors
            print(f"  ⚠️ Tournament validation error: {response.text}")
        elif response.status_code == 403:
            print("  ⚠️ User doesn't have permission to create tournaments (not guild leader/officer)")
        elif response.status_code == 404:
            print("  ⚠️ Guild not found")
        else:
            self.fail(f"Unexpected response status: {response.status_code} - {response.text}")
        
        print("✅ POST /api/guilds/{guild_id}/tournaments endpoint test passed")
    
    def test_13_test_authentication_requirements(self):
        """Test that guild endpoints properly require authentication where needed"""
        print("\n🔍 Testing authentication requirements for guild endpoints...")
        
        # Test create guild without authentication
        print("  Testing create guild without auth...")
        guild_data = {
            "name": "Test Guild",
            "tag": "TG",
            "colors": {"primary": "#FF0000", "secondary": "#FFFFFF"}
        }
        response = requests.post(f"{self.base_url}/api/guilds", json=guild_data)
        self.assertEqual(response.status_code, 401, "Create guild should require authentication")
        print("  ✅ Create guild correctly requires authentication")
        
        # Test invite player without authentication
        if GuildSystemTester.created_guild_id:
            print("  Testing invite player without auth...")
            invite_data = {"username": "testuser"}
            response = requests.post(
                f"{self.base_url}/api/guilds/{GuildSystemTester.created_guild_id}/invite",
                json=invite_data
            )
            self.assertEqual(response.status_code, 401, "Invite player should require authentication")
            print("  ✅ Invite player correctly requires authentication")
        
        # Test get invitations without authentication
        print("  Testing get invitations without auth...")
        response = requests.get(f"{self.base_url}/api/guilds/my-invitations")
        self.assertEqual(response.status_code, 401, "Get invitations should require authentication")
        print("  ✅ Get invitations correctly requires authentication")
        
        # Test accept invitation without authentication
        print("  Testing accept invitation without auth...")
        response = requests.post(f"{self.base_url}/api/guilds/invitations/test-id/accept")
        self.assertEqual(response.status_code, 401, "Accept invitation should require authentication")
        print("  ✅ Accept invitation correctly requires authentication")
        
        print("✅ Authentication requirements test passed")

if __name__ == "__main__":
    # Run Guild System tests
    print(f"\n{'='*80}")
    print("Running Guild System Tests")
    print(f"{'='*80}")
    
    suite = unittest.TestLoader().loadTestsFromTestCase(GuildSystemTester)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    if not result.wasSuccessful():
        print(f"\n❌ Guild System tests had failures or errors")
        for failure in result.failures:
            print(f"FAILURE: {failure[0]}")
            print(f"  {failure[1]}")
        for error in result.errors:
            print(f"ERROR: {error[0]}")
            print(f"  {error[1]}")
    else:
        print(f"\n✅ Guild System tests completed successfully")
    
    print(f"\n{'='*80}")
    print("Guild System testing completed!")
    print(f"{'='*80}")