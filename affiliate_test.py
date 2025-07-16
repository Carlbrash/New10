import requests
import unittest
import random
import string
import json
from datetime import datetime
import sys

class AffiliateSystemAPITest(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(AffiliateSystemAPITest, self).__init__(*args, **kwargs)
        # Use the public endpoint from frontend/.env
        self.base_url = "https://78c7ac4b-94f2-4bf0-bbd2-312dbf98f23a.preview.emergentagent.com"
        self.token = None
        self.user_id = None
        self.admin_token = None
        
        # Test user credentials
        self.test_user = {
            "username": "testuser",
            "password": "test123"
        }
        
        # Admin credentials
        self.admin_user = {
            "username": "admin",
            "password": "Kiki1999@"
        }
        
        # Referral code to test
        self.referral_code = "DEMO2024"
        
    def test_01_check_referral_code(self):
        """Test referral code validation endpoint"""
        print("\n🔍 Testing GET /api/register/check-referral/{referral_code} endpoint...")
        response = requests.get(f"{self.base_url}/api/register/check-referral/{self.referral_code}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print(f"Response: {data}")
        
        self.assertIn("valid", data)
        if data["valid"]:
            self.assertIn("affiliate_name", data)
            self.assertIn("commission_info", data)
            print(f"✅ Referral code {self.referral_code} is valid")
            print(f"   Affiliate: {data['affiliate_name']}")
            print(f"   Commission info: {data['commission_info']}")
        else:
            print(f"❌ Referral code {self.referral_code} is invalid: {data.get('message', 'No message')}")
            
        print("✅ Referral code validation test completed")
        
    def test_02_user_login(self):
        """Test login with testuser credentials"""
        print("\n🔍 Testing login with testuser credentials...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.test_user
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.assertIn("user_id", data)
        self.token = data["token"]
        self.user_id = data["user_id"]
        print(f"✅ Login successful - User ID: {self.user_id}")
        
    def test_03_admin_login(self):
        """Test login with admin credentials"""
        print("\n🔍 Testing login with admin credentials...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.admin_user
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.admin_token = data["token"]
        print("✅ Admin login successful")
        
    def test_04_apply_for_affiliate(self):
        """Test affiliate application endpoint"""
        print("\n🔍 Testing POST /api/affiliate/apply endpoint...")
        
        if not self.token:
            self.skipTest("No user token available")
            
        headers = {"Authorization": f"Bearer {self.token}"}
        data = {
            "user_id": self.user_id,
            "desired_referral_code": None,  # Let system generate one
            "motivation": "I want to promote the platform to my friends"
        }
        
        response = requests.post(
            f"{self.base_url}/api/affiliate/apply",
            headers=headers,
            json=data
        )
        
        # If user is already an affiliate, this will return 400
        if response.status_code == 400 and "already has an affiliate account" in response.text:
            print("ℹ️ User is already an affiliate")
            print("✅ Affiliate application test completed (already an affiliate)")
            return
            
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("affiliate_id", data)
        self.assertIn("referral_code", data)
        self.assertIn("referral_link", data)
        
        print(f"✅ Affiliate application successful")
        print(f"   Referral code: {data['referral_code']}")
        print(f"   Referral link: {data['referral_link']}")
        
    def test_05_get_affiliate_stats(self):
        """Test affiliate stats endpoint"""
        print("\n🔍 Testing GET /api/affiliate/stats endpoint...")
        
        if not self.token:
            self.skipTest("No user token available")
            
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(
            f"{self.base_url}/api/affiliate/stats",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check for required fields
        self.assertIn("total_referrals", data)
        self.assertIn("active_referrals", data)
        self.assertIn("total_earnings", data)
        self.assertIn("pending_earnings", data)
        self.assertIn("paid_earnings", data)
        self.assertIn("this_month_referrals", data)
        self.assertIn("this_month_earnings", data)
        self.assertIn("recent_referrals", data)
        self.assertIn("recent_commissions", data)
        
        print(f"✅ Affiliate stats retrieved successfully")
        print(f"   Total referrals: {data['total_referrals']}")
        print(f"   Active referrals: {data['active_referrals']}")
        print(f"   Total earnings: €{data['total_earnings']}")
        print(f"   This month referrals: {data['this_month_referrals']}")
        print(f"   This month earnings: €{data['this_month_earnings']}")
        
    def test_06_get_affiliate_profile(self):
        """Test affiliate profile endpoint"""
        print("\n🔍 Testing GET /api/affiliate/profile endpoint...")
        
        if not self.token:
            self.skipTest("No user token available")
            
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(
            f"{self.base_url}/api/affiliate/profile",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check for required fields
        self.assertIn("id", data)
        self.assertIn("user_id", data)
        self.assertIn("referral_code", data)
        self.assertIn("referral_link", data)
        self.assertIn("status", data)
        self.assertIn("total_referrals", data)
        self.assertIn("active_referrals", data)
        self.assertIn("total_earnings", data)
        self.assertIn("pending_earnings", data)
        self.assertIn("paid_earnings", data)
        self.assertIn("commission_rate_registration", data)
        self.assertIn("commission_rate_tournament", data)
        self.assertIn("commission_rate_deposit", data)
        
        print(f"✅ Affiliate profile retrieved successfully")
        print(f"   Referral code: {data['referral_code']}")
        print(f"   Status: {data['status']}")
        print(f"   Commission rates:")
        print(f"     Registration: €{data['commission_rate_registration']}")
        print(f"     Tournament: {data['commission_rate_tournament'] * 100}%")
        print(f"     Deposit: {data['commission_rate_deposit'] * 100}%")
        
    def test_07_get_affiliate_commissions(self):
        """Test affiliate commissions endpoint"""
        print("\n🔍 Testing GET /api/affiliate/commissions endpoint...")
        
        if not self.token:
            self.skipTest("No user token available")
            
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(
            f"{self.base_url}/api/affiliate/commissions",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check for required fields
        self.assertIn("commissions", data)
        self.assertIn("total", data)
        self.assertIn("page", data)
        self.assertIn("pages", data)
        
        commissions = data["commissions"]
        print(f"✅ Retrieved {len(commissions)} commissions out of {data['total']} total")
        
        # Check commission details if any exist
        if commissions:
            first_commission = commissions[0]
            self.assertIn("id", first_commission)
            self.assertIn("affiliate_user_id", first_commission)
            self.assertIn("referred_user_id", first_commission)
            self.assertIn("commission_type", first_commission)
            self.assertIn("amount", first_commission)
            self.assertIn("is_paid", first_commission)
            self.assertIn("created_at", first_commission)
            
            print(f"   Sample commission:")
            print(f"     Type: {first_commission['commission_type']}")
            print(f"     Amount: €{first_commission['amount']}")
            print(f"     Paid: {'Yes' if first_commission['is_paid'] else 'No'}")
            print(f"     Created: {first_commission['created_at']}")
        else:
            print("   No commissions found")
            
    def test_08_get_affiliate_referrals(self):
        """Test affiliate referrals endpoint"""
        print("\n🔍 Testing GET /api/affiliate/referrals endpoint...")
        
        if not self.token:
            self.skipTest("No user token available")
            
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(
            f"{self.base_url}/api/affiliate/referrals",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check for required fields
        self.assertIn("referrals", data)
        self.assertIn("total", data)
        self.assertIn("page", data)
        self.assertIn("pages", data)
        
        referrals = data["referrals"]
        print(f"✅ Retrieved {len(referrals)} referrals out of {data['total']} total")
        
        # Check referral details if any exist
        if referrals:
            first_referral = referrals[0]
            self.assertIn("id", first_referral)
            self.assertIn("affiliate_user_id", first_referral)
            self.assertIn("referred_user_id", first_referral)
            self.assertIn("referral_code", first_referral)
            self.assertIn("registered_at", first_referral)
            self.assertIn("is_active", first_referral)
            
            print(f"   Sample referral:")
            print(f"     Registered: {first_referral['registered_at']}")
            print(f"     Active: {'Yes' if first_referral['is_active'] else 'No'}")
            if "user_details" in first_referral:
                print(f"     User: {first_referral['user_details'].get('full_name', 'Unknown')}")
        else:
            print("   No referrals found")
            
    def test_09_get_admin_affiliates(self):
        """Test admin affiliates endpoint"""
        print("\n🔍 Testing GET /api/admin/affiliates endpoint...")
        
        if not self.admin_token:
            self.skipTest("No admin token available")
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(
            f"{self.base_url}/api/admin/affiliates",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check for required fields
        self.assertIn("affiliates", data)
        self.assertIn("total", data)
        self.assertIn("page", data)
        self.assertIn("pages", data)
        
        affiliates = data["affiliates"]
        print(f"✅ Retrieved {len(affiliates)} affiliates out of {data['total']} total")
        
        # Check affiliate details if any exist
        if affiliates:
            first_affiliate = affiliates[0]
            self.assertIn("id", first_affiliate)
            self.assertIn("user_id", first_affiliate)
            self.assertIn("referral_code", first_affiliate)
            self.assertIn("status", first_affiliate)
            self.assertIn("total_referrals", first_affiliate)
            self.assertIn("total_earnings", first_affiliate)
            
            print(f"   Sample affiliate:")
            print(f"     Referral code: {first_affiliate['referral_code']}")
            print(f"     Status: {first_affiliate['status']}")
            print(f"     Total referrals: {first_affiliate['total_referrals']}")
            print(f"     Total earnings: €{first_affiliate['total_earnings']}")
            if "user_details" in first_affiliate:
                print(f"     User: {first_affiliate['user_details'].get('full_name', 'Unknown')}")
        else:
            print("   No affiliates found")
            
    def test_10_register_with_referral(self):
        """Test user registration with referral code"""
        print("\n🔍 Testing POST /api/register with referral code...")
        
        # Generate random user data for testing
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        new_user = {
            "username": f"ref_user_{random_suffix}",
            "email": f"ref_{random_suffix}@example.com",
            "password": "Test@123",
            "country": "GR",
            "full_name": f"Referred User {random_suffix}",
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
            "referral_code": self.referral_code
        }
        
        response = requests.post(
            f"{self.base_url}/api/register",
            json=new_user
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check for required fields
        self.assertIn("message", data)
        self.assertIn("token", data)
        self.assertIn("user_id", data)
        self.assertIn("referral_processed", data)
        self.assertIn("referral_message", data)
        
        print(f"✅ User registration with referral code successful")
        print(f"   User ID: {data['user_id']}")
        print(f"   Referral processed: {'Yes' if data['referral_processed'] else 'No'}")
        print(f"   Referral message: {data['referral_message']}")
        
        # If referral was processed, verify it appears in the affiliate's referrals
        if data['referral_processed'] and self.token:
            print("   Verifying referral appears in affiliate's referrals...")
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/api/affiliate/referrals",
                headers=headers
            )
            
            if response.status_code == 200:
                referrals_data = response.json()
                referrals = referrals_data["referrals"]
                
                found = False
                for referral in referrals:
                    if referral["referred_user_id"] == data["user_id"]:
                        found = True
                        print("   ✅ Referral found in affiliate's referrals")
                        break
                        
                if not found:
                    print("   ❌ Referral not found in affiliate's referrals (may take time to update)")
            else:
                print(f"   ❌ Failed to verify referral: {response.status_code}")

if __name__ == "__main__":
    # Create test suite
    affiliate_test_suite = unittest.TestSuite()
    affiliate_test_suite.addTest(AffiliateSystemAPITest('test_01_check_referral_code'))
    affiliate_test_suite.addTest(AffiliateSystemAPITest('test_02_user_login'))
    affiliate_test_suite.addTest(AffiliateSystemAPITest('test_03_admin_login'))
    affiliate_test_suite.addTest(AffiliateSystemAPITest('test_04_apply_for_affiliate'))
    affiliate_test_suite.addTest(AffiliateSystemAPITest('test_05_get_affiliate_stats'))
    affiliate_test_suite.addTest(AffiliateSystemAPITest('test_06_get_affiliate_profile'))
    affiliate_test_suite.addTest(AffiliateSystemAPITest('test_07_get_affiliate_commissions'))
    affiliate_test_suite.addTest(AffiliateSystemAPITest('test_08_get_affiliate_referrals'))
    affiliate_test_suite.addTest(AffiliateSystemAPITest('test_09_get_admin_affiliates'))
    affiliate_test_suite.addTest(AffiliateSystemAPITest('test_10_register_with_referral'))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    print("\n" + "=" * 50)
    print("TESTING AFFILIATE SYSTEM ENDPOINTS")
    print("=" * 50)
    runner.run(affiliate_test_suite)