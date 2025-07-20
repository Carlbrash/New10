import requests
import unittest
import json
import sys

class InsufficientBalanceModalTester(unittest.TestCase):
    """Test insufficient balance modal fix as requested"""
    
    def __init__(self, *args, **kwargs):
        super(InsufficientBalanceModalTester, self).__init__(*args, **kwargs)
        self.base_url = "https://24db5e72-6830-4299-9073-d783fecac772.preview.emergentagent.com"
        self.token = None
        self.user_id = None
        
        # Test user credentials as specified in the request
        self.test_user_credentials = {
            "username": "modal_test",
            "password": "test123"
        }
        
        # New user registration data
        self.new_user_data = {
            "username": "modal_test",
            "email": "modal_test@example.com",
            "password": "test123",
            "country": "GR",
            "full_name": "Modal Test User",
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400"
        }

    def test_01_create_modal_test_user(self):
        """Create a new user 'modal_test' with password 'test123'"""
        print("\n🔍 Testing modal test user creation...")
        
        # First, try to login if user already exists
        try:
            login_response = requests.post(
                f"{self.base_url}/api/login",
                json=self.test_user_credentials
            )
            if login_response.status_code == 200:
                print("  ⚠️ User already exists, this is expected for testing")
                data = login_response.json()
                self.token = data["token"]
                self.user_id = data["user_id"]
                return
        except:
            pass
        
        # Create new user
        response = requests.post(
            f"{self.base_url}/api/register",
            json=self.new_user_data
        )
        
        if response.status_code == 400 and "already exists" in response.text:
            print("  ⚠️ User already exists, attempting to login instead...")
            login_response = requests.post(
                f"{self.base_url}/api/login",
                json=self.test_user_credentials
            )
            self.assertEqual(login_response.status_code, 200)
            data = login_response.json()
            self.token = data["token"]
            self.user_id = data["user_id"]
            print(f"  ✅ Logged in existing user - User ID: {self.user_id}")
        else:
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("token", data)
            self.assertIn("user_id", data)
            self.token = data["token"]
            self.user_id = data["user_id"]
            print(f"  ✅ New user created successfully - User ID: {self.user_id}")

    def test_02_login_modal_test_user(self):
        """Login with the modal_test user"""
        print("\n🔍 Testing login with modal_test user...")
        
        if not self.token:
            response = requests.post(
                f"{self.base_url}/api/login",
                json=self.test_user_credentials
            )
            self.assertEqual(response.status_code, 200, f"Login failed with status {response.status_code}: {response.text}")
            data = response.json()
            self.assertIn("token", data)
            self.assertIn("user_id", data)
            
            self.token = data["token"]
            self.user_id = data["user_id"]
        
        print(f"✅ Successfully logged in as modal_test - User ID: {self.user_id}")

    def test_03_check_wallet_balance(self):
        """Check modal_test user's wallet balance (should be 0)"""
        print("\n🔍 Checking modal_test user's wallet balance...")
        
        if not self.token:
            self.skipTest("Token not available, skipping wallet balance test")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(
            f"{self.base_url}/api/wallet/balance",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200, f"Wallet balance check failed: {response.text}")
        data = response.json()
        
        # Check wallet balance structure
        self.assertIn("available_balance", data)
        balance = data["available_balance"]
        
        print(f"✅ Modal_test user's wallet balance: €{balance}")
        print(f"   Total earned: €{data.get('total_earned', 0.0)}")
        print(f"   Withdrawn balance: €{data.get('withdrawn_balance', 0.0)}")
        
        # New user should have 0 balance
        self.assertEqual(balance, 0.0, "New user should have 0 available balance")
        self.assertEqual(data.get('total_earned', 0.0), 0.0, "New user should have 0 total earned")
        
        # Store balance for next test
        self.wallet_balance = balance
        return balance

    def test_03_find_high_entry_fee_tournament(self):
        """Find a tournament with entry fee higher than user's balance"""
        print("\n🔍 Finding tournament with entry fee higher than user's balance...")
        
        if not hasattr(self, 'wallet_balance'):
            # Get balance if not already retrieved
            self.test_03_check_wallet_balance()
        
        # Get available tournaments
        response = requests.get(f"{self.base_url}/api/tournaments")
        self.assertEqual(response.status_code, 200, f"Failed to get tournaments: {response.text}")
        
        data = response.json()
        tournaments = data.get("tournaments", [])
        
        # Find paid tournaments (entry_fee > 0) since user has 0 balance
        paid_tournaments = [t for t in tournaments if t.get("entry_fee", 0) > 0]
        self.assertGreater(len(paid_tournaments), 0, "Expected at least one paid tournament")
        
        print(f"  Found {len(tournaments)} total tournaments")
        print(f"  Found {len(paid_tournaments)} paid tournaments")
        
        # Show some paid tournament details
        for i, tournament in enumerate(paid_tournaments[:3]):
            print(f"    Tournament {i+1}: {tournament['name']} - Entry Fee: €{tournament['entry_fee']}")
        
        # Use the first paid tournament for testing
        high_fee_tournament = paid_tournaments[0]
        
        self.high_fee_tournament = high_fee_tournament
        print(f"✅ Selected tournament: {high_fee_tournament['name']}")
        print(f"   Entry fee: €{high_fee_tournament['entry_fee']}")
        print(f"   User balance: €{self.wallet_balance}")
        print(f"   Status: {high_fee_tournament['status']}")
        
        return high_fee_tournament

    def test_04_attempt_join_high_fee_tournament(self):
        """Try to join tournament with entry fee and verify insufficient balance error"""
        print("\n🔍 Attempting to join tournament with insufficient balance...")
        
        if not self.token:
            self.skipTest("Token not available, skipping tournament join test")
        
        if not hasattr(self, 'high_fee_tournament'):
            self.test_03_find_high_entry_fee_tournament()
        
        tournament_id = self.high_fee_tournament["id"]
        entry_fee = self.high_fee_tournament["entry_fee"]
        headers = {"Authorization": f"Bearer {self.token}"}
        
        print(f"  Attempting to join tournament: {self.high_fee_tournament['name']}")
        print(f"  Entry fee: €{entry_fee}")
        print(f"  User balance: €0.0")
        
        response = requests.post(
            f"{self.base_url}/api/tournaments/{tournament_id}/join",
            headers=headers
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        # The response should be an error (400 or similar) with insufficient balance message
        self.assertNotEqual(response.status_code, 200, "Expected error response for insufficient balance")
        
        # Check if it's a 400 Bad Request (most likely for insufficient balance)
        if response.status_code == 400:
            try:
                error_data = response.json()
                error_message = error_data.get("detail", "").lower()
                
                print(f"  Error message: {error_data.get('detail', 'No detail provided')}")
                
                # Check for insufficient balance related error messages
                balance_keywords = ["insufficient", "balance", "€", "funds", "money", "payment"]
                found_keywords = [keyword for keyword in balance_keywords if keyword in error_message]
                
                print(f"  Found balance-related keywords: {found_keywords}")
                
                # Verify that the error message contains balance-related keywords
                self.assertTrue(len(found_keywords) > 0, 
                              f"Expected error message to contain balance-related keywords like 'insufficient', 'balance', or '€'. Got: {error_message}")
                
                print("  ✅ Insufficient balance error message contains expected keywords")
                print("  ✅ Backend correctly validates wallet balance before tournament join")
                
            except json.JSONDecodeError:
                print(f"⚠️ Non-JSON error response: {response.text}")
        
        elif response.status_code == 403:
            print("⚠️ Got 403 Forbidden - might be authorization issue")
        elif response.status_code == 404:
            print("⚠️ Got 404 Not Found - tournament might not exist")
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")
        
        print("✅ Tournament join attempt with insufficient balance test completed")

    def test_05_verify_error_message_format(self):
        """Verify that the error message format is as expected for frontend modal"""
        print("\n🔍 Verifying error message format for frontend modal...")
        
        if not self.token:
            self.skipTest("Token not available, skipping error format test")
        
        if not hasattr(self, 'high_fee_tournament'):
            self.test_03_find_high_entry_fee_tournament()
        
        tournament_id = self.high_fee_tournament["id"]
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.post(
            f"{self.base_url}/api/tournaments/{tournament_id}/join",
            headers=headers
        )
        
        if response.status_code == 400:
            try:
                error_data = response.json()
                
                # Verify error response structure
                self.assertIn("detail", error_data, "Error response should contain 'detail' field")
                
                error_message = error_data["detail"]
                self.assertIsInstance(error_message, str, "Error detail should be a string")
                self.assertGreater(len(error_message), 0, "Error message should not be empty")
                
                print(f"✅ Error response structure is correct:")
                print(f"   Status Code: {response.status_code}")
                print(f"   Error Message: {error_message}")
                print(f"   Response Format: JSON with 'detail' field")
                
                # Check if it's the expected insufficient balance error
                if "insufficient" in error_message.lower() or "balance" in error_message.lower():
                    print("✅ Error message contains balance-related keywords")
                    print("✅ Backend is working correctly for insufficient balance modal")
                else:
                    print("⚠️ Error message doesn't seem to be balance-related")
                    print("   This might be due to tournament status or other validation")
                
            except json.JSONDecodeError:
                print(f"❌ Error response is not valid JSON: {response.text}")
                self.fail("Error response should be valid JSON")
        
        else:
            print(f"⚠️ Expected 400 status code, got {response.status_code}")
            print("   This might indicate the tournament join logic has changed")
        
        print("✅ Error message format verification completed")

if __name__ == "__main__":
    # Run insufficient balance modal tests
    insufficient_balance_suite = unittest.TestSuite()
    insufficient_balance_suite.addTest(InsufficientBalanceModalTester('test_01_create_modal_test_user'))
    insufficient_balance_suite.addTest(InsufficientBalanceModalTester('test_02_login_modal_test_user'))
    insufficient_balance_suite.addTest(InsufficientBalanceModalTester('test_03_check_wallet_balance'))
    insufficient_balance_suite.addTest(InsufficientBalanceModalTester('test_03_find_high_entry_fee_tournament'))
    insufficient_balance_suite.addTest(InsufficientBalanceModalTester('test_04_attempt_join_high_fee_tournament'))
    insufficient_balance_suite.addTest(InsufficientBalanceModalTester('test_05_verify_error_message_format'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    print("\n" + "=" * 60)
    print("TESTING INSUFFICIENT BALANCE MODAL FIX")
    print("=" * 60)
    runner.run(insufficient_balance_suite)