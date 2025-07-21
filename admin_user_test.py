import requests
import unittest
import json
from datetime import datetime

class AdminUserTest(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(AdminUserTest, self).__init__(*args, **kwargs)
        # Use the public endpoint from frontend/.env
        self.base_url = "https://b90141f8-e066-4425-bc76-e032fe56376a.preview.emergentagent.com"
        self.god_token = None
        self.admin_token = None
        
        # Credentials for testing
        self.god_credentials = {
            "username": "God",
            "password": "Kiki1999@"
        }
        
        self.admin_credentials = {
            "username": "admin",
            "password": "Kiki1999@"
        }

    def test_01_god_login(self):
        """Test login with God credentials"""
        print("\n🔍 Testing login with God credentials...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.god_credentials
        )
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        self.assertEqual(response.status_code, 200, f"God login failed with status {response.status_code}: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        self.god_token = data["token"]
        print("✅ God login successful - Token obtained")

    def test_02_admin_login(self):
        """Test login with admin credentials for comparison"""
        print("\n🔍 Testing login with admin credentials...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.admin_credentials
        )
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        self.assertEqual(response.status_code, 200, f"Admin login failed with status {response.status_code}: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        self.admin_token = data["token"]
        print("✅ Admin login successful - Token obtained")

    def test_03_get_admin_users_with_god(self):
        """Test GET /api/admin/users endpoint with God token"""
        print("\n🔍 Testing GET /api/admin/users endpoint with God token...")
        
        # Skip if no God token
        if not self.god_token:
            self.skipTest("No God token available")
        
        headers = {"Authorization": f"Bearer {self.god_token}"}
        response = requests.get(
            f"{self.base_url}/api/admin/users",
            headers=headers
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text[:200]}...")  # Print first 200 chars
        if response.status_code != 200:
            self.fail(f"Failed to get users with God token: {response.text}")
        
        data = response.json()
        
        # Verify response structure
        self.assertIn("users", data)
        
        users = data["users"]
        print(f"✅ Found {len(users)} users with God token")
        
        # Look for God user and admin user in the list
        god_user = None
        admin_user = None
        test_user = None
        
        for user in users:
            if user["username"] == "God":
                god_user = user
            elif user["username"] == "admin":
                admin_user = user
            elif user["username"] == "testuser":
                test_user = user
        
        # Print details about God, admin, and testuser
        if god_user:
            print(f"\nGod user details:")
            print(f"  Username: {god_user['username']}")
            print(f"  Admin role: {god_user['admin_role']}")
            print(f"  Full name: {god_user['full_name']}")
            print(f"  Email: {god_user['email']}")
            print(f"  Created at: {god_user['created_at']}")
        else:
            print("❌ God user not found in users list")
        
        if admin_user:
            print(f"\nAdmin user details:")
            print(f"  Username: {admin_user['username']}")
            print(f"  Admin role: {admin_user['admin_role']}")
            print(f"  Full name: {admin_user['full_name']}")
            print(f"  Email: {admin_user['email']}")
            print(f"  Created at: {admin_user['created_at']}")
        else:
            print("❌ Admin user not found in users list")
        
        if test_user:
            print(f"\nTest user details:")
            print(f"  Username: {test_user['username']}")
            print(f"  Admin role: {test_user['admin_role']}")
            print(f"  Full name: {test_user['full_name']}")
            print(f"  Email: {test_user['email']}")
            print(f"  Created at: {test_user['created_at']}")
        else:
            print("❌ Test user not found in users list")
        
        print("✅ GET /api/admin/users endpoint test with God token passed")

    def test_04_get_admin_users_with_admin(self):
        """Test GET /api/admin/users endpoint with admin token"""
        print("\n🔍 Testing GET /api/admin/users endpoint with admin token...")
        
        # Skip if no admin token
        if not self.admin_token:
            self.skipTest("No admin token available")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(
            f"{self.base_url}/api/admin/users",
            headers=headers
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text[:200]}...")  # Print first 200 chars
        if response.status_code != 200:
            self.fail(f"Failed to get users with admin token: {response.text}")
        
        data = response.json()
        
        # Verify response structure
        self.assertIn("users", data)
        
        users = data["users"]
        print(f"✅ Found {len(users)} users with admin token")
        
        # Compare with God token results
        print("✅ GET /api/admin/users endpoint test with admin token passed")

if __name__ == "__main__":
    # Create a test suite
    test_suite = unittest.TestSuite()
    test_suite.addTest(AdminUserTest('test_01_god_login'))
    test_suite.addTest(AdminUserTest('test_02_admin_login'))
    test_suite.addTest(AdminUserTest('test_03_get_admin_users_with_god'))
    test_suite.addTest(AdminUserTest('test_04_get_admin_users_with_admin'))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(test_suite)