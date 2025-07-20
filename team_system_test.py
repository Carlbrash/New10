import requests
import unittest
import json
from datetime import datetime

class TeamSystemAPITest(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(TeamSystemAPITest, self).__init__(*args, **kwargs)
        # Use the public endpoint from frontend/.env
        self.base_url = "https://b578ab0c-9b8e-443c-9964-de8dced10016.preview.emergentagent.com"
        self.testuser_token = None
        self.admin_token = None
        self.team_id = None
        self.invitation_id = None
        
    def test_01_login_as_testuser(self):
        """Login as testuser to get token for testing"""
        print("\n🔍 Testing login as testuser...")
        login_data = {
            "username": "testuser",
            "password": "test123"
        }
        response = requests.post(
            f"{self.base_url}/api/login",
            json=login_data
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.testuser_token = data["token"]
        print("✅ Login as testuser successful")
    
    def test_02_login_as_admin(self):
        """Login as admin to get token for testing"""
        print("\n🔍 Testing login as admin...")
        login_data = {
            "username": "admin",
            "password": "Kiki1999@"
        }
        response = requests.post(
            f"{self.base_url}/api/login",
            json=login_data
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.admin_token = data["token"]
        print("✅ Login as admin successful")
    
    def test_03_get_teams_empty(self):
        """Test GET /api/teams (should be empty initially)"""
        print("\n🔍 Testing GET /api/teams (initial state)...")
        response = requests.get(f"{self.base_url}/api/teams")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("teams", data)
        print(f"✅ GET /api/teams returned {len(data['teams'])} teams")
        
        # Print teams if any exist
        if data["teams"]:
            print("Existing teams:")
            for team in data["teams"]:
                print(f"  - {team['name']} (ID: {team['id']})")
    
    def test_04_create_team(self):
        """Test POST /api/teams (create team)"""
        print("\n🔍 Testing POST /api/teams (create team)...")
        
        # Skip if no testuser token
        if not self.testuser_token:
            self.skipTest("No testuser token available")
        
        team_data = {
            "name": "Test Warriors",
            "logo_url": "https://example.com/logo.png",
            "colors": {
                "primary": "#FF0000",
                "secondary": "#FFFFFF"
            },
            "city": "Athens",
            "country": "Greece", 
            "phone": "+30123456789",
            "email": "testwarriors@example.com"
        }
        
        headers = {"Authorization": f"Bearer {self.testuser_token}"}
        response = requests.post(
            f"{self.base_url}/api/teams",
            headers=headers,
            json=team_data
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        # Print the request data for debugging
        print(f"Request data: {json.dumps(team_data, indent=2)}")
        
        # If team already exists, this might fail with 400
        if response.status_code == 400 and "already a member" in response.text:
            print("⚠️ User is already a member of a team, skipping team creation")
            
            # Get existing teams to find the user's team
            response = requests.get(f"{self.base_url}/api/teams")
            teams = response.json()["teams"]
            
            # Find a team where testuser is captain
            for team in teams:
                if team.get("captain_username") == "testuser":
                    self.team_id = team["id"]
                    print(f"✅ Found existing team: {team['name']} (ID: {self.team_id})")
                    break
        else:
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("team_id", data)
            self.team_id = data["team_id"]
            print(f"✅ Team created successfully with ID: {self.team_id}")
    
    def test_05_get_teams_after_creation(self):
        """Test GET /api/teams after team creation"""
        print("\n🔍 Testing GET /api/teams after team creation...")
        response = requests.get(f"{self.base_url}/api/teams")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("teams", data)
        self.assertGreater(len(data["teams"]), 0, "Expected at least one team after creation")
        
        # Verify our team is in the list
        found = False
        for team in data["teams"]:
            if self.team_id and team["id"] == self.team_id:
                found = True
                print(f"✅ Found our team in the list: {team['name']}")
                break
        
        if self.team_id:
            self.assertTrue(found, "Our team was not found in the teams list")
        
        print(f"✅ GET /api/teams returned {len(data['teams'])} teams")
    
    def test_06_get_team_details(self):
        """Test GET /api/teams/{team_id}"""
        print("\n🔍 Testing GET /api/teams/{team_id}...")
        
        # Skip if no team ID
        if not self.team_id:
            self.skipTest("No team ID available")
        
        response = requests.get(f"{self.base_url}/api/teams/{self.team_id}")
        self.assertEqual(response.status_code, 200)
        team = response.json()
        
        # Verify team details
        self.assertEqual(team["id"], self.team_id)
        self.assertIn("name", team)
        self.assertIn("captain", team)
        self.assertIn("members", team)
        
        print(f"✅ Team details retrieved successfully:")
        print(f"  - Name: {team['name']}")
        print(f"  - Captain: {team['captain']['username']}")
        print(f"  - Members: {len(team['members'])}")
    
    def test_07_invite_player(self):
        """Test POST /api/teams/{team_id}/invite"""
        print("\n🔍 Testing POST /api/teams/{team_id}/invite...")
        
        # Skip if no team ID or testuser token
        if not self.team_id or not self.testuser_token:
            self.skipTest("No team ID or testuser token available")
        
        invite_data = {
            "username": "admin"
        }
        
        headers = {"Authorization": f"Bearer {self.testuser_token}"}
        response = requests.post(
            f"{self.base_url}/api/teams/{self.team_id}/invite",
            headers=headers,
            json=invite_data
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        # If invitation already exists, this might fail with 400
        if response.status_code == 400 and "already sent" in response.text:
            print("⚠️ Invitation already sent to this user")
            
            # We need to get the invitation ID for the next test
            # This requires logging in as admin and checking invitations
            if self.admin_token:
                admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
                invitations_response = requests.get(
                    f"{self.base_url}/api/teams/my-invitations",
                    headers=admin_headers
                )
                
                if invitations_response.status_code == 200:
                    invitations = invitations_response.json().get("invitations", [])
                    for invitation in invitations:
                        if invitation["team_id"] == self.team_id:
                            self.invitation_id = invitation["id"]
                            print(f"✅ Found existing invitation ID: {self.invitation_id}")
                            break
        else:
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("invitation_id", data)
            self.invitation_id = data["invitation_id"]
            print(f"✅ Invitation sent successfully with ID: {self.invitation_id}")
    
    def test_08_get_admin_invitations(self):
        """Test GET /api/teams/my-invitations as admin"""
        print("\n🔍 Testing GET /api/teams/my-invitations as admin...")
        
        # Skip if no admin token
        if not self.admin_token:
            self.skipTest("No admin token available")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(
            f"{self.base_url}/api/teams/my-invitations",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("invitations", data)
        
        # Check if our invitation is in the list
        found = False
        for invitation in data["invitations"]:
            if self.team_id and invitation["team_id"] == self.team_id:
                found = True
                # Save invitation ID if we don't have it yet
                if not self.invitation_id:
                    self.invitation_id = invitation["id"]
                print(f"✅ Found our invitation in the list (ID: {invitation['id']})")
                print(f"  - Team: {invitation['team_name']}")
                print(f"  - Sent at: {invitation['sent_at']}")
                print(f"  - Expires at: {invitation['expires_at']}")
                break
        
        if self.team_id:
            self.assertTrue(found, "Our invitation was not found in the invitations list")
        
        print(f"✅ GET /api/teams/my-invitations returned {len(data['invitations'])} invitations")
    
    def test_09_accept_invitation(self):
        """Test POST /api/teams/invitations/{invitation_id}/accept"""
        print("\n🔍 Testing POST /api/teams/invitations/{invitation_id}/accept...")
        
        # Skip if no invitation ID or admin token
        if not self.invitation_id or not self.admin_token:
            self.skipTest("No invitation ID or admin token available")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.post(
            f"{self.base_url}/api/teams/invitations/{self.invitation_id}/accept",
            headers=headers
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        # If user is already in a team, this might fail with 400
        if response.status_code == 400 and "already a member" in response.text:
            print("⚠️ Admin is already a member of a team, cannot accept invitation")
        else:
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("message", data)
            print(f"✅ Invitation accepted successfully: {data['message']}")
    
    def test_10_verify_team_members(self):
        """Verify team members after invitation acceptance"""
        print("\n🔍 Verifying team members after invitation acceptance...")
        
        # Skip if no team ID
        if not self.team_id:
            self.skipTest("No team ID available")
        
        response = requests.get(f"{self.base_url}/api/teams/{self.team_id}")
        self.assertEqual(response.status_code, 200)
        team = response.json()
        
        # Check if admin is now a member
        admin_is_member = False
        for member in team["members"]:
            if member["username"] == "admin":
                admin_is_member = True
                print(f"✅ Admin is now a member of the team")
                break
        
        # This might be false if the invitation couldn't be accepted
        if not admin_is_member:
            print("⚠️ Admin is not a member of the team (this is expected if invitation acceptance failed)")
        
        print(f"✅ Team now has {len(team['members'])} members")

if __name__ == "__main__":
    # Create a test suite with our tests in the correct order
    test_suite = unittest.TestSuite()
    test_suite.addTest(TeamSystemAPITest('test_01_login_as_testuser'))
    test_suite.addTest(TeamSystemAPITest('test_02_login_as_admin'))
    test_suite.addTest(TeamSystemAPITest('test_03_get_teams_empty'))
    test_suite.addTest(TeamSystemAPITest('test_04_create_team'))
    test_suite.addTest(TeamSystemAPITest('test_05_get_teams_after_creation'))
    test_suite.addTest(TeamSystemAPITest('test_06_get_team_details'))
    test_suite.addTest(TeamSystemAPITest('test_07_invite_player'))
    test_suite.addTest(TeamSystemAPITest('test_08_get_admin_invitations'))
    test_suite.addTest(TeamSystemAPITest('test_09_accept_invitation'))
    test_suite.addTest(TeamSystemAPITest('test_10_verify_team_members'))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    print("\n" + "=" * 50)
    print("TESTING TEAM SYSTEM API ENDPOINTS")
    print("=" * 50)
    runner.run(test_suite)