import requests
import unittest
import json

class TeamCreationTest(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(TeamCreationTest, self).__init__(*args, **kwargs)
        # Use the public endpoint from frontend/.env
        self.base_url = "https://67792974-48a1-4e2d-b2d0-93fe13b22f8f.preview.emergentagent.com"
        self.token = None
        
    def test_01_login_as_testuser(self):
        """Test login as testuser to get token"""
        print("\n🔍 Testing login as testuser...")
        login_data = {
            "username": "testuser",
            "password": "test123"
        }
        response = requests.post(
            f"{self.base_url}/api/login",
            json=login_data
        )
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.token = data["token"]
        print("✅ Login as testuser successful")
        
    def test_02_get_teams(self):
        """Test GET /api/teams endpoint to see initial state"""
        print("\n🔍 Testing GET /api/teams endpoint...")
        response = requests.get(f"{self.base_url}/api/teams")
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text[:500]}...")  # Show first 500 chars to avoid too much output
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("teams", data)
        print(f"✅ GET /api/teams successful - Found {len(data['teams'])} teams")
        
    def test_03_create_team(self):
        """Test POST /api/teams endpoint to create a new team"""
        print("\n🔍 Testing POST /api/teams endpoint...")
        
        # Skip if login failed
        if not self.token:
            self.skipTest("Login failed, skipping team creation test")
            
        team_data = {
            "name": "Test Warriors Backend",
            "logo_url": "https://via.placeholder.com/100",
            "colors": {
                "primary": "#FF0000",
                "secondary": "#FFFFFF"
            },
            "city": "Athens",
            "country": "Greece",
            "phone": "+30123456789",
            "email": "testwarriors@example.com"
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.post(
            f"{self.base_url}/api/teams",
            headers=headers,
            json=team_data
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        # If team already exists, this is expected
        if response.status_code == 400 and "already exists" in response.text:
            print("⚠️ Team already exists - This is expected if the test has been run before")
            return
            
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("team_id", data)
        self.assertIn("team_name", data)
        self.assertEqual(data["team_name"], team_data["name"])
        print(f"✅ Team created successfully - Team ID: {data['team_id']}")
        
    def test_04_verify_team_created(self):
        """Test GET /api/teams endpoint again to verify the team was created"""
        print("\n🔍 Verifying team was created...")
        response = requests.get(f"{self.base_url}/api/teams")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Look for our team
        found = False
        for team in data["teams"]:
            if team["name"] == "Test Warriors Backend":
                found = True
                print(f"✅ Team found in GET /api/teams response")
                print(f"  Team ID: {team['id']}")
                print(f"  Team Name: {team['name']}")
                print(f"  Captain: {team.get('captain_name', 'Unknown')}")
                print(f"  Player Count: {team.get('current_player_count', 0)}")
                break
                
        if not found:
            print("❌ Team not found in GET /api/teams response")
            
        self.assertTrue(found, "Team should be found in GET /api/teams response")

if __name__ == "__main__":
    # Create a test suite
    test_suite = unittest.TestSuite()
    test_suite.addTest(TeamCreationTest('test_01_login_as_testuser'))
    test_suite.addTest(TeamCreationTest('test_02_get_teams'))
    test_suite.addTest(TeamCreationTest('test_03_create_team'))
    test_suite.addTest(TeamCreationTest('test_04_verify_team_created'))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(test_suite)