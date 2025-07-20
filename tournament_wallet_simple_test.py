import requests
import json

def test_tournament_wallet_balance():
    """Test tournament join wallet balance functionality step by step"""
    base_url = "https://24db5e72-6830-4299-9073-d783fecac772.preview.emergentagent.com"
    
    # Test user as requested
    test_user = {
        "username": "alex_test",
        "email": "alex_test@example.com",
        "password": "test123",
        "country": "GR",
        "full_name": "Alex Test User",
        "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400"
    }
    
    # Admin credentials
    admin_credentials = {
        "username": "admin",
        "password": "Kiki1999@"
    }
    
    print("=" * 70)
    print("TESTING TOURNAMENT JOIN WALLET BALANCE FUNCTIONALITY")
    print("=" * 70)
    
    # Step 1: Create/Login test user
    print("\n🔍 Step 1: Creating/Login test user 'alex_test'...")
    try:
        # Try login first
        login_response = requests.post(
            f"{base_url}/api/login",
            json={"username": test_user["username"], "password": test_user["password"]}
        )
        if login_response.status_code == 200:
            print("  ⚠️ User already exists, logging in instead...")
            data = login_response.json()
            token = data["token"]
            user_id = data["user_id"]
            print(f"  ✅ Logged in existing user - User ID: {user_id}")
        else:
            # Create new user
            response = requests.post(f"{base_url}/api/register", json=test_user)
            if response.status_code == 200:
                data = response.json()
                token = data["token"]
                user_id = data["user_id"]
                print(f"  ✅ New user created successfully - User ID: {user_id}")
            else:
                print(f"  ❌ Failed to create user: {response.text}")
                return
    except Exception as e:
        print(f"  ❌ Error in step 1: {e}")
        return
    
    # Step 2: Check initial wallet balance
    print("\n🔍 Step 2: Checking initial wallet balance...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/api/wallet/balance", headers=headers)
        if response.status_code == 200:
            balance_data = response.json()
            initial_balance = balance_data.get("available_balance", 0.0)
            print(f"  ✅ Initial wallet balance: €{initial_balance}")
        else:
            print(f"  ❌ Failed to get wallet balance: {response.text}")
            return
    except Exception as e:
        print(f"  ❌ Error in step 2: {e}")
        return
    
    # Step 3: Get tournaments and find paid/free tournaments
    print("\n🔍 Step 3: Getting tournaments and finding paid tournament...")
    try:
        response = requests.get(f"{base_url}/api/tournaments")
        if response.status_code == 200:
            data = response.json()
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
            
            if paid_tournament:
                print(f"  ✅ Found paid tournament: '{paid_tournament['name']}' - Entry fee: €{paid_tournament['entry_fee']}")
            else:
                print("  ❌ No paid tournament found")
                return
                
            if free_tournament:
                print(f"  ✅ Found free tournament: '{free_tournament['name']}' - Entry fee: €{free_tournament['entry_fee']}")
            else:
                print("  ❌ No free tournament found")
                return
        else:
            print(f"  ❌ Failed to get tournaments: {response.text}")
            return
    except Exception as e:
        print(f"  ❌ Error in step 3: {e}")
        return
    
    # Step 4: Try to join paid tournament with insufficient balance
    print("\n🔍 Step 4: Attempting to join paid tournament with insufficient balance...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{base_url}/api/tournaments/{paid_tournament['id']}/join",
            headers=headers
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
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
            print(f"  ⚠️ Unexpected response code: {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error in step 4: {e}")
    
    # Step 5: Try to join free tournament
    print("\n🔍 Step 5: Attempting to join free tournament...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{base_url}/api/tournaments/{free_tournament['id']}/join",
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
    except Exception as e:
        print(f"  ❌ Error in step 5: {e}")
    
    # Step 6: Admin login and add money to wallet
    print("\n🔍 Step 6: Admin login and adding money to wallet...")
    try:
        # Admin login
        response = requests.post(f"{base_url}/api/login", json=admin_credentials)
        if response.status_code == 200:
            data = response.json()
            admin_token = data["token"]
            print("  ✅ Admin login successful")
            
            # Add money to alex_test's wallet using manual adjustment
            adjustment_amount = 50.0
            adjustment_data = {
                "user_id": test_user["username"],  # Can use username or user_id
                "amount": adjustment_amount,
                "reason": "Test wallet funding for tournament join testing",
                "admin_notes": "Automated test - adding funds to test tournament join functionality"
            }
            
            headers = {"Authorization": f"Bearer {admin_token}"}
            response = requests.post(
                f"{base_url}/api/admin/financial/manual-adjustment",
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
                adjustment_data["user_id"] = user_id
                response = requests.post(
                    f"{base_url}/api/admin/financial/manual-adjustment",
                    headers=headers,
                    json=adjustment_data
                )
                print(f"  Retry with user_id - Status: {response.status_code}")
                print(f"  Retry response: {response.text}")
                
                if response.status_code == 200:
                    print(f"  ✅ Successfully added €{adjustment_amount} to alex_test's wallet (using user_id)")
                else:
                    print(f"  ❌ Failed to add money to wallet: {response.text}")
                    return
        else:
            print(f"  ❌ Admin login failed: {response.text}")
            return
    except Exception as e:
        print(f"  ❌ Error in step 6: {e}")
        return
    
    # Step 7: Verify wallet balance increased
    print("\n🔍 Step 7: Verifying wallet balance increased...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/api/wallet/balance", headers=headers)
        if response.status_code == 200:
            balance_data = response.json()
            current_balance = balance_data.get("available_balance", 0.0)
            
            print(f"  Initial balance: €{initial_balance}")
            print(f"  Current balance: €{current_balance}")
            print(f"  Difference: €{current_balance - initial_balance}")
            
            if current_balance > initial_balance:
                print("  ✅ Wallet balance successfully increased")
                balance_before_tournament = current_balance
            else:
                print("  ❌ Wallet balance did not increase")
                return
        else:
            print(f"  ❌ Failed to get wallet balance: {response.text}")
            return
    except Exception as e:
        print(f"  ❌ Error in step 7: {e}")
        return
    
    # Step 8: Try to join paid tournament again with sufficient balance
    print("\n🔍 Step 8: Attempting to join paid tournament with sufficient balance...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{base_url}/api/tournaments/{paid_tournament['id']}/join",
            headers=headers
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        tournament_joined = False
        if response.status_code == 200:
            print("  ✅ Successfully joined paid tournament")
            tournament_joined = True
        elif response.status_code == 400:
            response_data = response.json()
            error_detail = response_data.get("detail", "")
            
            if "already" in error_detail.lower():
                print("  ⚠️ User already joined this tournament or is already a team member")
            else:
                print(f"  ❌ Failed to join paid tournament: {error_detail}")
        else:
            print(f"  ❌ Unexpected response code: {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error in step 8: {e}")
        tournament_joined = False
    
    # Step 9: Verify final wallet balance
    print("\n🔍 Step 9: Verifying final wallet balance...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/api/wallet/balance", headers=headers)
        if response.status_code == 200:
            balance_data = response.json()
            final_balance = balance_data.get("available_balance", 0.0)
            expected_deduction = paid_tournament.get("entry_fee", 0.0)
            
            print(f"  Balance before tournament: €{balance_before_tournament}")
            print(f"  Final balance: €{final_balance}")
            print(f"  Expected entry fee deduction: €{expected_deduction}")
            print(f"  Tournament joined successfully: {tournament_joined}")
            
            if tournament_joined and expected_deduction > 0:
                expected_final_balance = balance_before_tournament - expected_deduction
                print(f"  Expected final balance: €{expected_final_balance}")
                
                # Allow for small floating point differences
                balance_difference = abs(final_balance - expected_final_balance)
                if balance_difference < 0.01:  # Within 1 cent
                    print("  ✅ Wallet balance correctly reduced by entry fee")
                else:
                    print(f"  ⚠️ Balance difference not as expected. Actual difference: €{balance_before_tournament - final_balance}")
            else:
                print("  ⚠️ Tournament was not joined successfully, so no balance deduction expected")
            
            # Print transaction history to see what happened
            response = requests.get(f"{base_url}/api/wallet/transactions", headers=headers)
            if response.status_code == 200:
                transactions_data = response.json()
                transactions = transactions_data.get("transactions", [])
                print(f"  Recent transactions ({len(transactions)}):")
                for i, transaction in enumerate(transactions[:5]):  # Show last 5 transactions
                    print(f"    {i+1}. {transaction.get('description', 'No description')} - €{transaction.get('amount', 0)} ({transaction.get('transaction_type', 'unknown')})")
            else:
                print(f"  ❌ Failed to get transaction history: {response.text}")
        else:
            print(f"  ❌ Failed to get final wallet balance: {response.text}")
    except Exception as e:
        print(f"  ❌ Error in step 9: {e}")
    
    print("\n" + "=" * 70)
    print("TOURNAMENT WALLET BALANCE TEST COMPLETED")
    print("=" * 70)

if __name__ == "__main__":
    test_tournament_wallet_balance()