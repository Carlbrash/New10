import requests
import unittest
import json
from datetime import datetime

class ManualAdjustmentTest(unittest.TestCase):
    base_url = "https://d41b4ad2-9fce-48b8-9d2d-ddd215aa202e.preview.emergentagent.com"
    
    # Admin credentials
    admin_credentials = {
        "username": "admin",
        "password": "Kiki1999@"
    }
    
    admin_token = None
    
    def test_01_admin_login(self):
        """Login as admin to get token for manual adjustment testing"""
        print("\n🔍 Testing admin login for manual adjustment testing...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.admin_credentials
        )
        self.assertEqual(response.status_code, 200, f"Admin login failed with status {response.status_code}: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        ManualAdjustmentTest.admin_token = data["token"]
        print(f"✅ Admin login successful - Token obtained for manual adjustment testing")
    
    def test_02_manual_adjustment_with_username(self):
        """Test POST /api/admin/financial/manual-adjustment endpoint with username"""
        print("\n🔍 Testing POST /api/admin/financial/manual-adjustment endpoint with username...")
        
        # Skip if no admin token
        if not ManualAdjustmentTest.admin_token:
            self.skipTest("No admin token available")
        
        # Get current balance for testuser first
        # Login as testuser
        user_credentials = {
            "username": "testuser",
            "password": "test123"
        }
        
        response = requests.post(
            f"{self.base_url}/api/login",
            json=user_credentials
        )
        self.assertEqual(response.status_code, 200)
        user_data = response.json()
        user_token = user_data["token"]
        
        # Get initial balance
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(
            f"{self.base_url}/api/wallet/balance",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        current_balance = response.json()
        initial_balance = current_balance["available_balance"]
        
        # Create adjustment using username
        adjustment_amount = 25.50
        adjustment_data = {
            "user_id": "testuser",  # Using username instead of ID
            "amount": adjustment_amount,
            "reason": "Testing username functionality",
            "admin_notes": "Testing with username instead of user ID"
        }
        
        # Make the adjustment
        admin_headers = {"Authorization": f"Bearer {ManualAdjustmentTest.admin_token}"}
        response = requests.post(
            f"{self.base_url}/api/admin/financial/manual-adjustment",
            headers=admin_headers,
            json=adjustment_data
        )
        
        self.assertEqual(response.status_code, 200, f"Failed to create manual adjustment with username: {response.text}")
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("amount", data)
        self.assertEqual(data["amount"], adjustment_amount)
        self.assertEqual(data["username"], "testuser")
        
        # Verify balance was updated
        response = requests.get(
            f"{self.base_url}/api/wallet/balance",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        updated_balance = response.json()
        expected_balance = initial_balance + adjustment_amount
        self.assertAlmostEqual(updated_balance["available_balance"], expected_balance, places=2)
        
        print(f"✅ Manual adjustment with username created successfully")
        print(f"  Initial balance: €{initial_balance}")
        print(f"  Adjustment amount: €{adjustment_amount}")
        print(f"  New balance: €{updated_balance['available_balance']}")
        
        # Save the new balance for the next test
        ManualAdjustmentTest.testuser_balance = updated_balance["available_balance"]
    
    def test_03_manual_adjustment_with_user_id(self):
        """Test POST /api/admin/financial/manual-adjustment endpoint with user ID"""
        print("\n🔍 Testing POST /api/admin/financial/manual-adjustment endpoint with user ID...")
        
        # Skip if no admin token
        if not ManualAdjustmentTest.admin_token:
            self.skipTest("No admin token available")
        
        # Get user ID for testuser
        # Login as testuser
        user_credentials = {
            "username": "testuser",
            "password": "test123"
        }
        
        response = requests.post(
            f"{self.base_url}/api/login",
            json=user_credentials
        )
        self.assertEqual(response.status_code, 200)
        user_data = response.json()
        user_token = user_data["token"]
        user_id = user_data["user_id"]
        
        # Get initial balance
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(
            f"{self.base_url}/api/wallet/balance",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        current_balance = response.json()
        initial_balance = current_balance["available_balance"]
        
        # Create adjustment using user ID
        adjustment_amount = 15.75
        adjustment_data = {
            "user_id": user_id,  # Using actual user ID
            "amount": adjustment_amount,
            "reason": "Testing user ID functionality",
            "admin_notes": "Testing with actual user ID"
        }
        
        # Make the adjustment
        admin_headers = {"Authorization": f"Bearer {ManualAdjustmentTest.admin_token}"}
        response = requests.post(
            f"{self.base_url}/api/admin/financial/manual-adjustment",
            headers=admin_headers,
            json=adjustment_data
        )
        
        self.assertEqual(response.status_code, 200, f"Failed to create manual adjustment with user ID: {response.text}")
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("amount", data)
        self.assertEqual(data["amount"], adjustment_amount)
        self.assertEqual(data["user_id"], user_id)
        
        # Verify balance was updated
        response = requests.get(
            f"{self.base_url}/api/wallet/balance",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        updated_balance = response.json()
        expected_balance = initial_balance + adjustment_amount
        self.assertAlmostEqual(updated_balance["available_balance"], expected_balance, places=2)
        
        print(f"✅ Manual adjustment with user ID created successfully")
        print(f"  Initial balance: €{initial_balance}")
        print(f"  Adjustment amount: €{adjustment_amount}")
        print(f"  New balance: €{updated_balance['available_balance']}")
        
        # Reverse both adjustments to restore original balance
        total_adjustment = 25.50 + 15.75  # Sum of both adjustments
        reverse_adjustment_data = {
            "user_id": user_id,
            "amount": -total_adjustment,
            "reason": "Reversing test adjustments",
            "admin_notes": "Reversing the test adjustments to restore original balance"
        }
        
        response = requests.post(
            f"{self.base_url}/api/admin/financial/manual-adjustment",
            headers=admin_headers,
            json=reverse_adjustment_data
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify balance was restored
        response = requests.get(
            f"{self.base_url}/api/wallet/balance",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        final_balance = response.json()
        original_balance = ManualAdjustmentTest.testuser_balance - 25.50  # Subtract first adjustment
        self.assertAlmostEqual(final_balance["available_balance"], original_balance, places=2)
        
        print("  Original balance restored")

if __name__ == "__main__":
    # Create a test suite
    test_suite = unittest.TestSuite()
    test_suite.addTest(ManualAdjustmentTest('test_01_admin_login'))
    test_suite.addTest(ManualAdjustmentTest('test_02_manual_adjustment_with_username'))
    test_suite.addTest(ManualAdjustmentTest('test_03_manual_adjustment_with_user_id'))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print test results
    print("\n=== TEST RESULTS ===")
    print(f"Tests run: {result.testsRun}")
    print(f"Errors: {len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    
    if result.errors:
        print("\n=== ERRORS ===")
        for test, error in result.errors:
            print(f"\nTest: {test}")
            print(f"Error: {error}")
    
    if result.failures:
        print("\n=== FAILURES ===")
        for test, failure in result.failures:
            print(f"\nTest: {test}")
            print(f"Failure: {failure}")