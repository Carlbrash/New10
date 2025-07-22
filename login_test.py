import requests
import unittest

class LoginCredentialsTester(unittest.TestCase):
    base_url = "https://49f63d92-acd8-4e16-a4be-50baa0fb091a.preview.emergentagent.com"
    
    def test_01_testuser_login(self):
        """Test login with username: testuser, password: test123"""
        print("\n🔍 Testing login with testuser/test123...")
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
        self.assertIn("user_id", data)
        print("✅ Login successful with testuser/test123")
        
        # Verify token is valid by making a request to a protected endpoint
        headers = {"Authorization": f"Bearer {data['token']}"}
        profile_response = requests.get(
            f"{self.base_url}/api/profile",
            headers=headers
        )
        self.assertEqual(profile_response.status_code, 200)
        profile_data = profile_response.json()
        self.assertEqual(profile_data["username"], "testuser")
        print("✅ Token verification successful - able to access protected endpoint")
    
    def test_02_admin_login(self):
        """Test login with username: admin, password: Kiki1999@"""
        print("\n🔍 Testing login with admin/Kiki1999@...")
        login_data = {
            "username": "admin",
            "password": "Kiki1999@"
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
        self.assertIn("user_id", data)
        print("✅ Login successful with admin/Kiki1999@")
        
        # Verify token is valid by making a request to a protected endpoint
        headers = {"Authorization": f"Bearer {data['token']}"}
        profile_response = requests.get(
            f"{self.base_url}/api/profile",
            headers=headers
        )
        self.assertEqual(profile_response.status_code, 200)
        profile_data = profile_response.json()
        self.assertEqual(profile_data["username"], "admin")
        print("✅ Token verification successful - able to access protected endpoint")
    
    def test_03_god_login(self):
        """Test login with username: God, password: Kiki1999@"""
        print("\n🔍 Testing login with God/Kiki1999@...")
        login_data = {
            "username": "God",
            "password": "Kiki1999@"
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
        self.assertIn("user_id", data)
        print("✅ Login successful with God/Kiki1999@")
        
        # Verify token is valid by making a request to a protected endpoint
        headers = {"Authorization": f"Bearer {data['token']}"}
        profile_response = requests.get(
            f"{self.base_url}/api/profile",
            headers=headers
        )
        self.assertEqual(profile_response.status_code, 200)
        profile_data = profile_response.json()
        self.assertEqual(profile_data["username"], "God")
        print("✅ Token verification successful - able to access protected endpoint")

if __name__ == "__main__":
    # Create a test suite for login credentials testing
    login_test_suite = unittest.TestSuite()
    login_test_suite.addTest(LoginCredentialsTester('test_01_testuser_login'))
    login_test_suite.addTest(LoginCredentialsTester('test_02_admin_login'))
    login_test_suite.addTest(LoginCredentialsTester('test_03_god_login'))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    print("\n" + "=" * 50)
    print("TESTING LOGIN CREDENTIALS")
    print("=" * 50)
    runner.run(login_test_suite)