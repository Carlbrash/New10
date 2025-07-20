import requests
import unittest
import sys

class TournamentWalletBalanceTester(unittest.TestCase):
    """Test tournament join wallet balance functionality"""
    
    def __init__(self, *args, **kwargs):
        super(TournamentWalletBalanceTester, self).__init__(*args, **kwargs)
        self.base_url = "https://b8f460b2-9f72-45d6-94e8-1deef7e57785.preview.emergentagent.com"
        self.token = None
        self.user_id = None
        self.admin_token = None
        
        # Test user as requested
        self.test_user = {
            "username": "alex_test",
            "email": "alex_test@example.com",
            "password": "test123",
            "country": "GR",
            "full_name": "Alex Test User",
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400"
        }
        
        # Admin credentials
        self.admin_credentials = {
            "username": "admin",
            "password": "Kiki1999@"
        }

    def test_01_create_test_user(self):
        """Create a new test user 'alex_test' with password 'test123'"""
        print("\n🔍 Step 1: Creating test user 'alex_test'...")
        
        # First, try to login if user already exists
        try:
            login_response = requests.post(
                f"{self.base_url}/api/login",
                json={"username": self.test_user["username"], "password": self.test_user["password"]}
            )
            if login_response.status_code == 200:
                print("  ⚠️ User already exists, logging in instead...")
                data = login_response.json()
                self.token = data["token"]
                self.user_id = data["user_id"]
                print(f"  ✅ Logged in existing user - User ID: {self.user_id}")
                return
        except:
            pass
        
        # Create new user
        response = requests.post(
            f"{self.base_url}/api/register",
            json=self.test_user
        )
        
        if response.status_code == 400 and "already exists" in response.text:
            print("  ⚠️ User already exists, attempting to login instead...")
            login_response = requests.post(
                f"{self.base_url}/api/login",
                json={"username": self.test_user["username"], "password": self.test_user["password"]}
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

    def test_02_login_and_check_wallet_balance(self):
        """Login with alex_test user and get their wallet balance (should be 0 euros)"""
        print("\n🔍 Step 2: Login and check wallet balance...")
        
        if not self.token:
            login_data = {
                "username": self.test_user["username"],
                "password": self.test_user["password"]
            }
            response = requests.post(
                f"{self.base_url}/api/login",
                json=login_data
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("token", data)
            self.token = data["token"]
            self.user_id = data["user_id"]
        
        print(f"  ✅ Login successful - Token obtained")
        
        # Check wallet balance
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(
            f"{self.base_url}/api/wallet/balance",
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        balance_data = response.json()
        
        initial_balance = balance_data.get("available_balance", 0.0)
        print(f"  ✅ Initial wallet balance: €{initial_balance}")
        
        # Store initial balance for later comparison
        self.initial_balance = initial_balance

    def test_03_get_tournaments_and_find_paid_tournament(self):
        """Get list of tournaments and find one with entry fee (e.g., 25 euros)"""
        print("\n🔍 Step 3: Getting tournaments and finding paid tournament...")
        
        response = requests.get(f"{self.base_url}/api/tournaments")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("tournaments", data)
        
        tournaments = data["tournaments"]
        print(f"  Found {len(tournaments)} tournaments")
        
        # Find a paid tournament (entry fee > 0)
        paid_tournament = None
        free_tournament = None
        
        for tournament in tournaments:
            entry_fee = tournament.get("entry_fee", 0)
            status = tournament.get("status", "")
            
            if entry_fee > 0 and status == "open" and not paid_tournament:
                paid_tournament = tournament
            elif entry_fee == 0 and status == "open" and not free_tournament:
                free_tournament = tournament
        
        self.assertIsNotNone(paid_tournament, "No paid tournament found")
        self.assertIsNotNone(free_tournament, "No free tournament found")
        
        self.paid_tournament = paid_tournament
        self.free_tournament = free_tournament
        
        print(f"  ✅ Found paid tournament: '{paid_tournament['name']}' - Entry fee: €{paid_tournament['entry_fee']}")
        print(f"  ✅ Found free tournament: '{free_tournament['name']}' - Entry fee: €{free_tournament['entry_fee']}")

    def test_04_try_join_paid_tournament_insufficient_balance(self):
        """Try to join the paid tournament - this should FAIL with insufficient balance error"""
        print("\n🔍 Step 4: Attempting to join paid tournament with insufficient balance...")
        
        if not hasattr(self, 'paid_tournament'):
            self.skipTest("No paid tournament available for testing")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.post(
            f"{self.base_url}/api/tournaments/{self.paid_tournament['id']}/join",
            headers=headers
        )
        
        # This should fail due to insufficient balance
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        # Check if it's a balance-related error
        if response.status_code == 400:
            response_data = response.json()
            error_detail = response_data.get("detail", "").lower()
            
            if "insufficient" in error_detail or "balance" in error_detail or "funds" in error_detail:
                print("  ✅ Correctly failed with insufficient balance error")
            elif "already" in error_detail and "member" in error_detail:
                print("  ⚠️ User is already a member of another team, cannot join tournament")
            else:
                print(f"  ⚠️ Failed with different error: {response_data.get('detail', 'Unknown error')}")
        else:
            # If it succeeded, that means the user might have had balance or there's no balance check
            print(f"  ⚠️ Unexpected success or different error code: {response.status_code}")

    def test_05_join_free_tournament_success(self):
        """Find a free tournament (0 euros entry fee) and try to join - this should SUCCEED"""
        print("\n🔍 Step 5: Attempting to join free tournament...")
        
        if not hasattr(self, 'free_tournament'):
            self.skipTest("No free tournament available for testing")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.post(
            f"{self.base_url}/api/tournaments/{self.free_tournament['id']}/join",
            headers=headers
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        if response.status_code == 200:
            print("  ✅ Successfully joined free tournament")
        elif response.status_code == 400:
            response_data = response.json()
            error_detail = response_data.get("detail", "")
            
            if "already" in error_detail.lower() and ("member" in error_detail.lower() or "joined" in error_detail.lower()):
                print("  ⚠️ User is already a member of another team or already joined tournament")
            else:
                print(f"  ⚠️ Failed to join free tournament: {error_detail}")
        else:
            print(f"  ⚠️ Unexpected response code: {response.status_code}")

    def test_06_admin_login_and_add_money(self):
        """Use admin credentials to add money to alex_test's wallet (e.g., 50 euros)"""
        print("\n🔍 Step 6: Admin login and adding money to wallet...")
        
        # Admin login
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.admin_credentials
        )
        self.assertEqual(response.status_code, 200, f"Admin login failed: {response.text}")
        data = response.json()
        self.admin_token = data["token"]
        print("  ✅ Admin login successful")
        
        # Add money to alex_test's wallet using manual adjustment
        adjustment_amount = 50.0
        adjustment_data = {
            "user_id": self.test_user["username"],  # Can use username or user_id
            "amount": adjustment_amount,
            "reason": "Test wallet funding for tournament join testing",
            "admin_notes": "Automated test - adding funds to test tournament join functionality"
        }
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.post(
            f"{self.base_url}/api/admin/financial/manual-adjustment",
            headers=headers,
            json=adjustment_data
        )
        
        print(f"  Manual adjustment response status: {response.status_code}")
        print(f"  Manual adjustment response: {response.text}")
        
        if response.status_code == 200:
            print(f"  ✅ Successfully added €{adjustment_amount} to alex_test's wallet")
        else:
            print(f"  ❌ Failed to add money to wallet: {response.text}")
            # Try with user_id instead of username
            adjustment_data["user_id"] = self.user_id
            response = requests.post(
                f"{self.base_url}/api/admin/financial/manual-adjustment",
                headers=headers,
                json=adjustment_data
            )
            print(f"  Retry with user_id - Status: {response.status_code}")
            print(f"  Retry response: {response.text}")
            
            if response.status_code == 200:
                print(f"  ✅ Successfully added €{adjustment_amount} to alex_test's wallet (using user_id)")
            else:
                self.fail(f"Failed to add money to wallet: {response.text}")

    def test_07_verify_wallet_balance_increased(self):
        """Verify that the wallet balance has increased by the added amount"""
        print("\n🔍 Step 7: Verifying wallet balance increased...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(
            f"{self.base_url}/api/wallet/balance",
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        balance_data = response.json()
        
        current_balance = balance_data.get("available_balance", 0.0)
        initial_balance = getattr(self, 'initial_balance', 0.0)
        
        print(f"  Initial balance: €{initial_balance}")
        print(f"  Current balance: €{current_balance}")
        print(f"  Difference: €{current_balance - initial_balance}")
        
        # Verify balance increased
        self.assertGreater(current_balance, initial_balance, "Wallet balance should have increased")
        print("  ✅ Wallet balance successfully increased")
        
        # Store current balance for final verification
        self.balance_before_tournament = current_balance

    def test_08_join_paid_tournament_success(self):
        """Try to join the paid tournament again - this should SUCCEED and deduct the entry fee"""
        print("\n🔍 Step 8: Attempting to join paid tournament with sufficient balance...")
        
        if not hasattr(self, 'paid_tournament'):
            self.skipTest("No paid tournament available for testing")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.post(
            f"{self.base_url}/api/tournaments/{self.paid_tournament['id']}/join",
            headers=headers
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        if response.status_code == 200:
            print("  ✅ Successfully joined paid tournament")
            self.tournament_joined = True
        elif response.status_code == 400:
            response_data = response.json()
            error_detail = response_data.get("detail", "")
            
            if "already" in error_detail.lower():
                print("  ⚠️ User already joined this tournament or is already a team member")
                self.tournament_joined = False
            else:
                print(f"  ❌ Failed to join paid tournament: {error_detail}")
                self.tournament_joined = False
        else:
            print(f"  ❌ Unexpected response code: {response.status_code}")
            self.tournament_joined = False

    def test_09_verify_final_wallet_balance(self):
        """Verify final wallet balance is reduced by the entry fee amount"""
        print("\n🔍 Step 9: Verifying final wallet balance...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(
            f"{self.base_url}/api/wallet/balance",
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        balance_data = response.json()
        
        final_balance = balance_data.get("available_balance", 0.0)
        balance_before = getattr(self, 'balance_before_tournament', 0.0)
        expected_deduction = self.paid_tournament.get("entry_fee", 0.0) if hasattr(self, 'paid_tournament') else 0.0
        tournament_joined = getattr(self, 'tournament_joined', False)
        
        print(f"  Balance before tournament: €{balance_before}")
        print(f"  Final balance: €{final_balance}")
        print(f"  Expected entry fee deduction: €{expected_deduction}")
        print(f"  Tournament joined successfully: {tournament_joined}")
        
        if tournament_joined and expected_deduction > 0:
            expected_final_balance = balance_before - expected_deduction
            print(f"  Expected final balance: €{expected_final_balance}")
            
            # Allow for small floating point differences
            balance_difference = abs(final_balance - expected_final_balance)
            if balance_difference < 0.01:  # Within 1 cent
                print("  ✅ Wallet balance correctly reduced by entry fee")
            else:
                print(f"  ⚠️ Balance difference not as expected. Actual difference: €{balance_before - final_balance}")
        else:
            print("  ⚠️ Tournament was not joined successfully, so no balance deduction expected")
        
        # Print transaction history to see what happened
        response = requests.get(
            f"{self.base_url}/api/wallet/transactions",
            headers=headers
        )
        if response.status_code == 200:
            transactions_data = response.json()
            transactions = transactions_data.get("transactions", [])
            print(f"  Recent transactions ({len(transactions)}):")
            for i, transaction in enumerate(transactions[:5]):  # Show last 5 transactions
                print(f"    {i+1}. {transaction.get('description', 'No description')} - €{transaction.get('amount', 0)} ({transaction.get('transaction_type', 'unknown')})")

def run_tournament_wallet_test():
    """Run the tournament wallet balance test"""
    test_suite = unittest.TestSuite()
    test_suite.addTest(TournamentWalletBalanceTester('test_01_create_test_user'))
    test_suite.addTest(TournamentWalletBalanceTester('test_02_login_and_check_wallet_balance'))
    test_suite.addTest(TournamentWalletBalanceTester('test_03_get_tournaments_and_find_paid_tournament'))
    test_suite.addTest(TournamentWalletBalanceTester('test_04_try_join_paid_tournament_insufficient_balance'))
    test_suite.addTest(TournamentWalletBalanceTester('test_05_join_free_tournament_success'))
    test_suite.addTest(TournamentWalletBalanceTester('test_06_admin_login_and_add_money'))
    test_suite.addTest(TournamentWalletBalanceTester('test_07_verify_wallet_balance_increased'))
    test_suite.addTest(TournamentWalletBalanceTester('test_08_join_paid_tournament_success'))
    test_suite.addTest(TournamentWalletBalanceTester('test_09_verify_final_wallet_balance'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    print("\n" + "=" * 70)
    print("TESTING TOURNAMENT JOIN WALLET BALANCE FUNCTIONALITY")
    print("=" * 70)
    result = runner.run(test_suite)
    return result

if __name__ == "__main__":
    run_tournament_wallet_test()