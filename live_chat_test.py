import requests
import unittest
import json

class LiveChatSystemTester(unittest.TestCase):
    """Test Live Chat System endpoints"""
    
    def __init__(self, *args, **kwargs):
        super(LiveChatSystemTester, self).__init__(*args, **kwargs)
        self.base_url = "https://42b9aa62-6128-4581-a652-e6679123b102.preview.emergentagent.com"
        
        # Test credentials
        self.admin_credentials = {"username": "admin", "password": "Kiki1999@"}
        self.god_credentials = {"username": "God", "password": "Kiki1999@"}
        self.user_credentials = {"username": "testuser", "password": "test123"}
        
        # Tokens will be set during login tests
        self.admin_token = None
        self.god_token = None
        self.user_token = None

    def test_01_admin_login(self):
        """Test admin user login"""
        print("\n🔍 Testing admin user login for Live Chat System...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.admin_credentials
        )
        self.assertEqual(response.status_code, 200, f"Admin login failed: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        self.admin_token = data["token"]
        print("✅ Admin user login successful")

    def test_02_god_login(self):
        """Test god user login"""
        print("\n🔍 Testing god user login for Live Chat System...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.god_credentials
        )
        self.assertEqual(response.status_code, 200, f"God login failed: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        self.god_token = data["token"]
        print("✅ God user login successful")

    def test_03_regular_user_login(self):
        """Test regular user login"""
        print("\n🔍 Testing regular user login for Live Chat System...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.user_credentials
        )
        self.assertEqual(response.status_code, 200, f"Regular user login failed: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        self.user_token = data["token"]
        print("✅ Regular user login successful")

    def test_04_chat_stats_admin_access(self):
        """Test GET /api/chat/stats with admin user"""
        print("\n🔍 Testing GET /api/chat/stats with admin user...")
        
        if not self.admin_token:
            self.skipTest("Admin token not available")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(
            f"{self.base_url}/api/chat/stats",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200, f"Chat stats failed for admin: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("total_online_users", data)
        self.assertIn("total_rooms", data)
        self.assertIn("rooms_by_type", data)
        self.assertIn("messages_by_room", data)
        
        print(f"  Total online users: {data['total_online_users']}")
        print(f"  Total rooms: {data['total_rooms']}")
        print(f"  Rooms by type: {data['rooms_by_type']}")
        print(f"  Messages by room: {data['messages_by_room']}")
        print("✅ Chat stats endpoint works correctly for admin user")

    def test_05_chat_stats_god_access(self):
        """Test GET /api/chat/stats with god user"""
        print("\n🔍 Testing GET /api/chat/stats with god user...")
        
        if not self.god_token:
            self.skipTest("God token not available")
        
        headers = {"Authorization": f"Bearer {self.god_token}"}
        response = requests.get(
            f"{self.base_url}/api/chat/stats",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200, f"Chat stats failed for god: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("total_online_users", data)
        self.assertIn("total_rooms", data)
        self.assertIn("rooms_by_type", data)
        self.assertIn("messages_by_room", data)
        
        print(f"  Total online users: {data['total_online_users']}")
        print(f"  Total rooms: {data['total_rooms']}")
        print("✅ Chat stats endpoint works correctly for god user")

    def test_06_chat_stats_regular_user_forbidden(self):
        """Test GET /api/chat/stats with regular user (should fail with 403)"""
        print("\n🔍 Testing GET /api/chat/stats with regular user (should fail)...")
        
        if not self.user_token:
            self.skipTest("User token not available")
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = requests.get(
            f"{self.base_url}/api/chat/stats",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 403, f"Expected 403 for regular user, got {response.status_code}: {response.text}")
        print("✅ Chat stats endpoint correctly rejects regular user with 403")

    def test_07_chat_stats_no_auth(self):
        """Test GET /api/chat/stats without authentication (should fail with 401)"""
        print("\n🔍 Testing GET /api/chat/stats without authentication (should fail)...")
        
        response = requests.get(f"{self.base_url}/api/chat/stats")
        
        self.assertEqual(response.status_code, 401, f"Expected 401 for no auth, got {response.status_code}: {response.text}")
        print("✅ Chat stats endpoint correctly rejects unauthenticated request with 401")

    def test_08_ban_user_admin_access(self):
        """Test POST /api/chat/admin/ban-user with admin user"""
        print("\n🔍 Testing POST /api/chat/admin/ban-user with admin user...")
        
        if not self.admin_token:
            self.skipTest("Admin token not available")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        ban_data = {
            "user_id": "mock_user_id_123",
            "reason": "Testing ban functionality"
        }
        
        response = requests.post(
            f"{self.base_url}/api/chat/admin/ban-user",
            headers=headers,
            json=ban_data
        )
        
        # Since no users are actually online in chat, we expect a 404
        self.assertEqual(response.status_code, 404, f"Expected 404 for non-existent user, got {response.status_code}: {response.text}")
        self.assertIn("User not found in chat", response.text)
        print("✅ Ban user endpoint correctly validates user existence in chat")

    def test_09_ban_user_god_access(self):
        """Test POST /api/chat/admin/ban-user with god user"""
        print("\n🔍 Testing POST /api/chat/admin/ban-user with god user...")
        
        if not self.god_token:
            self.skipTest("God token not available")
        
        headers = {"Authorization": f"Bearer {self.god_token}"}
        ban_data = {
            "user_id": "mock_user_id_456",
            "reason": "Testing ban functionality with god user"
        }
        
        response = requests.post(
            f"{self.base_url}/api/chat/admin/ban-user",
            headers=headers,
            json=ban_data
        )
        
        # Since no users are actually online in chat, we expect a 404
        self.assertEqual(response.status_code, 404, f"Expected 404 for non-existent user, got {response.status_code}: {response.text}")
        self.assertIn("User not found in chat", response.text)
        print("✅ Ban user endpoint correctly validates user existence in chat for god user")

    def test_10_ban_user_regular_user_forbidden(self):
        """Test POST /api/chat/admin/ban-user with regular user (should fail with 403)"""
        print("\n🔍 Testing POST /api/chat/admin/ban-user with regular user (should fail)...")
        
        if not self.user_token:
            self.skipTest("User token not available")
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        ban_data = {
            "user_id": "mock_user_id_789",
            "reason": "Testing ban functionality"
        }
        
        response = requests.post(
            f"{self.base_url}/api/chat/admin/ban-user",
            headers=headers,
            json=ban_data
        )
        
        self.assertEqual(response.status_code, 403, f"Expected 403 for regular user, got {response.status_code}: {response.text}")
        print("✅ Ban user endpoint correctly rejects regular user with 403")

    def test_11_ban_user_no_auth(self):
        """Test POST /api/chat/admin/ban-user without authentication (should fail with 401)"""
        print("\n🔍 Testing POST /api/chat/admin/ban-user without authentication (should fail)...")
        
        ban_data = {
            "user_id": "mock_user_id_000",
            "reason": "Testing ban functionality"
        }
        
        response = requests.post(
            f"{self.base_url}/api/chat/admin/ban-user",
            json=ban_data
        )
        
        self.assertEqual(response.status_code, 401, f"Expected 401 for no auth, got {response.status_code}: {response.text}")
        print("✅ Ban user endpoint correctly rejects unauthenticated request with 401")

    def test_12_ban_user_missing_user_id(self):
        """Test POST /api/chat/admin/ban-user with missing user_id (should fail with 400)"""
        print("\n🔍 Testing POST /api/chat/admin/ban-user with missing user_id (should fail)...")
        
        if not self.admin_token:
            self.skipTest("Admin token not available")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        ban_data = {
            "reason": "Testing ban functionality without user_id"
        }
        
        response = requests.post(
            f"{self.base_url}/api/chat/admin/ban-user",
            headers=headers,
            json=ban_data
        )
        
        self.assertEqual(response.status_code, 400, f"Expected 400 for missing user_id, got {response.status_code}: {response.text}")
        self.assertIn("User ID required", response.text)
        print("✅ Ban user endpoint correctly validates missing user_id with 400")

    def test_13_ban_user_malformed_json(self):
        """Test POST /api/chat/admin/ban-user with malformed JSON"""
        print("\n🔍 Testing POST /api/chat/admin/ban-user with malformed JSON...")
        
        if not self.admin_token:
            self.skipTest("Admin token not available")
        
        headers = {"Authorization": f"Bearer {self.admin_token}", "Content-Type": "application/json"}
        
        response = requests.post(
            f"{self.base_url}/api/chat/admin/ban-user",
            headers=headers,
            data="invalid json"
        )
        
        # Should return 422 for malformed JSON
        self.assertIn(response.status_code, [400, 422], f"Expected 400 or 422 for malformed JSON, got {response.status_code}: {response.text}")
        print("✅ Ban user endpoint correctly handles malformed JSON")

    def test_14_chat_stats_invalid_token(self):
        """Test GET /api/chat/stats with invalid token"""
        print("\n🔍 Testing GET /api/chat/stats with invalid token...")
        
        headers = {"Authorization": "Bearer invalid_token_123"}
        response = requests.get(
            f"{self.base_url}/api/chat/stats",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 401, f"Expected 401 for invalid token, got {response.status_code}: {response.text}")
        print("✅ Chat stats endpoint correctly rejects invalid token with 401")

    def test_15_ban_user_invalid_token(self):
        """Test POST /api/chat/admin/ban-user with invalid token"""
        print("\n🔍 Testing POST /api/chat/admin/ban-user with invalid token...")
        
        headers = {"Authorization": "Bearer invalid_token_456"}
        ban_data = {
            "user_id": "mock_user_id_999",
            "reason": "Testing with invalid token"
        }
        
        response = requests.post(
            f"{self.base_url}/api/chat/admin/ban-user",
            headers=headers,
            json=ban_data
        )
        
        self.assertEqual(response.status_code, 401, f"Expected 401 for invalid token, got {response.status_code}: {response.text}")
        print("✅ Ban user endpoint correctly rejects invalid token with 401")

if __name__ == "__main__":
    # Run the Live Chat System tests
    live_chat_suite = unittest.TestSuite()
    live_chat_suite.addTest(LiveChatSystemTester('test_01_admin_login'))
    live_chat_suite.addTest(LiveChatSystemTester('test_02_god_login'))
    live_chat_suite.addTest(LiveChatSystemTester('test_03_regular_user_login'))
    live_chat_suite.addTest(LiveChatSystemTester('test_04_chat_stats_admin_access'))
    live_chat_suite.addTest(LiveChatSystemTester('test_05_chat_stats_god_access'))
    live_chat_suite.addTest(LiveChatSystemTester('test_06_chat_stats_regular_user_forbidden'))
    live_chat_suite.addTest(LiveChatSystemTester('test_07_chat_stats_no_auth'))
    live_chat_suite.addTest(LiveChatSystemTester('test_08_ban_user_admin_access'))
    live_chat_suite.addTest(LiveChatSystemTester('test_09_ban_user_god_access'))
    live_chat_suite.addTest(LiveChatSystemTester('test_10_ban_user_regular_user_forbidden'))
    live_chat_suite.addTest(LiveChatSystemTester('test_11_ban_user_no_auth'))
    live_chat_suite.addTest(LiveChatSystemTester('test_12_ban_user_missing_user_id'))
    live_chat_suite.addTest(LiveChatSystemTester('test_13_ban_user_malformed_json'))
    live_chat_suite.addTest(LiveChatSystemTester('test_14_chat_stats_invalid_token'))
    live_chat_suite.addTest(LiveChatSystemTester('test_15_ban_user_invalid_token'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    print("\n" + "=" * 50)
    print("TESTING LIVE CHAT SYSTEM ENDPOINTS")
    print("=" * 50)
    runner.run(live_chat_suite)