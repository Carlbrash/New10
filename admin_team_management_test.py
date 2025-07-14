import requests
import unittest
import uuid

class AdminTeamManagementTester(unittest.TestCase):
    base_url = "https://9984d77a-659e-4322-b6c5-5fd85692930e.preview.emergentagent.com"
    
    # Admin credentials for admin endpoints
    admin_credentials = {
        "username": "admin",
        "password": "Kiki1999@"
    }
    
    # God credentials for super admin endpoints
    god_credentials = {
        "username": "God",
        "password": "Kiki1999@"
    }
    
    # Regular user credentials for testing authorization
    user_credentials = {
        "username": "testuser",
        "password": "test123"
    }
    
    admin_token = None
    god_token = None
    user_token = None
    test_team_id = None
    
    def test_01_admin_login(self):
        """Login as admin to get token for admin team management endpoints"""
        print("\n🔍 Testing admin login for team management...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.admin_credentials
        )
        self.assertEqual(response.status_code, 200, f"Admin login failed with status {response.status_code}: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        AdminTeamManagementTester.admin_token = data["token"]
        print(f"✅ Admin login successful - Token obtained for team management")
    
    def test_02_god_login(self):
        """Login as God (super admin) to get token for delete operations"""
        print("\n🔍 Testing God login for super admin operations...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.god_credentials
        )
        self.assertEqual(response.status_code, 200, f"God login failed with status {response.status_code}: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        AdminTeamManagementTester.god_token = data["token"]
        print(f"✅ God login successful - Token obtained for super admin operations")
    
    def test_03_user_login(self):
        """Login as regular user for authorization testing"""
        print("\n🔍 Testing user login for authorization testing...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.user_credentials
        )
        self.assertEqual(response.status_code, 200, f"User login failed with status {response.status_code}: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        AdminTeamManagementTester.user_token = data["token"]
        print(f"✅ User login successful - Token obtained for authorization testing")
    
    def test_04_get_all_teams_admin(self):
        """Test GET /api/admin/teams - Get all teams for admin management"""
        print("\n🔍 Testing GET /api/admin/teams endpoint...")
        
        # Skip if no admin token
        if not AdminTeamManagementTester.admin_token:
            self.skipTest("No admin token available")
        
        headers = {"Authorization": f"Bearer {AdminTeamManagementTester.admin_token}"}
        response = requests.get(
            f"{self.base_url}/api/admin/teams",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200, f"Failed to get admin teams: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("teams", data)
        teams = data["teams"]
        
        print(f"✅ Found {len(teams)} teams for admin management")
        
        # Verify team structure if any exist
        if teams:
            team = teams[0]
            self.assertIn("id", team)
            self.assertIn("name", team)
            self.assertIn("captain_id", team)
            self.assertIn("captain_name", team)
            self.assertIn("captain_username", team)
            self.assertIn("captain_email", team)
            self.assertIn("current_player_count", team)
            self.assertIn("members", team)
            self.assertIn("pending_invitations_count", team)
            self.assertIn("verification_status", team)
            self.assertIn("created_at", team)
            
            # Save a team ID for further testing
            AdminTeamManagementTester.test_team_id = team["id"]
            
            # Print team details
            for i, team in enumerate(teams[:3]):
                print(f"  Team {i+1}: {team['name']} - Captain: {team['captain_name']} - Members: {team['current_player_count']} - Status: {team.get('verification_status', 'unverified')}")
        else:
            print("  No teams found in the system")
    
    def test_05_update_team_verification(self):
        """Test PUT /api/admin/teams/{team_id}/verification - Update team verification"""
        print("\n🔍 Testing PUT /api/admin/teams/{team_id}/verification endpoint...")
        
        # Skip if no admin token or test team ID
        if not AdminTeamManagementTester.admin_token or not AdminTeamManagementTester.test_team_id:
            self.skipTest("No admin token or test team ID available")
        
        print(f"  Team ID: {AdminTeamManagementTester.test_team_id}")
        
        # Test updating verification status to "verified"
        verification_data = {
            "verification_status": "verified",
            "admin_notes": "Team verified through API testing"
        }
        
        headers = {"Authorization": f"Bearer {AdminTeamManagementTester.admin_token}"}
        response = requests.put(
            f"{self.base_url}/api/admin/teams/{AdminTeamManagementTester.test_team_id}/verification",
            headers=headers,
            json=verification_data
        )
        
        self.assertEqual(response.status_code, 200, f"Failed to update team verification: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("message", data)
        self.assertIn("team_id", data)
        self.assertIn("verification_status", data)
        self.assertEqual(data["verification_status"], "verified")
        self.assertEqual(data["team_id"], AdminTeamManagementTester.test_team_id)
        
        print(f"✅ Successfully updated team verification status to 'verified'")
        
        # Test with invalid verification status (should fail)
        invalid_verification_data = {
            "verification_status": "invalid_status",
            "admin_notes": "Testing invalid status"
        }
        
        response = requests.put(
            f"{self.base_url}/api/admin/teams/{AdminTeamManagementTester.test_team_id}/verification",
            headers=headers,
            json=invalid_verification_data
        )
        
        self.assertEqual(response.status_code, 400, "Expected 400 error for invalid verification status")
        print("  ✅ Correctly rejected invalid verification status")
        
        # Verify the team was actually updated
        response = requests.get(
            f"{self.base_url}/api/admin/teams",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        teams_data = response.json()
        
        # Find our test team
        test_team = None
        for team in teams_data["teams"]:
            if team["id"] == AdminTeamManagementTester.test_team_id:
                test_team = team
                break
        
        if test_team:
            self.assertEqual(test_team["verification_status"], "verified")
            print("  ✅ Team verification status correctly updated in database")
        else:
            print("  Warning: Could not find test team to verify update")
    
    def test_06_update_team_status(self):
        """Test PUT /api/admin/teams/{team_id}/status - Update team status"""
        print("\n🔍 Testing PUT /api/admin/teams/{team_id}/status endpoint...")
        
        # Skip if no admin token or test team ID
        if not AdminTeamManagementTester.admin_token or not AdminTeamManagementTester.test_team_id:
            self.skipTest("No admin token or test team ID available")
        
        print(f"  Team ID: {AdminTeamManagementTester.test_team_id}")
        
        # Test updating team status to "suspended"
        status_data = {
            "status": "suspended",
            "reason": "Team suspended for API testing purposes"
        }
        
        headers = {"Authorization": f"Bearer {AdminTeamManagementTester.admin_token}"}
        response = requests.put(
            f"{self.base_url}/api/admin/teams/{AdminTeamManagementTester.test_team_id}/status",
            headers=headers,
            json=status_data
        )
        
        self.assertEqual(response.status_code, 200, f"Failed to update team status: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("message", data)
        self.assertIn("team_id", data)
        self.assertIn("status", data)
        self.assertEqual(data["status"], "suspended")
        self.assertEqual(data["team_id"], AdminTeamManagementTester.test_team_id)
        
        print(f"✅ Successfully updated team status to 'suspended'")
        
        # Test with invalid status (should fail)
        invalid_status_data = {
            "status": "invalid_status",
            "reason": "Testing invalid status"
        }
        
        response = requests.put(
            f"{self.base_url}/api/admin/teams/{AdminTeamManagementTester.test_team_id}/status",
            headers=headers,
            json=invalid_status_data
        )
        
        self.assertEqual(response.status_code, 400, "Expected 400 error for invalid team status")
        print("  ✅ Correctly rejected invalid team status")
        
        # Restore team to active status
        restore_status_data = {
            "status": "active",
            "reason": "Restoring team status after API testing"
        }
        
        response = requests.put(
            f"{self.base_url}/api/admin/teams/{AdminTeamManagementTester.test_team_id}/status",
            headers=headers,
            json=restore_status_data
        )
        
        self.assertEqual(response.status_code, 200)
        print("  ✅ Team status restored to 'active'")
    
    def test_07_bulk_team_actions(self):
        """Test POST /api/admin/teams/bulk-action - Bulk team actions"""
        print("\n🔍 Testing POST /api/admin/teams/bulk-action endpoint...")
        
        # Skip if no admin token
        if not AdminTeamManagementTester.admin_token:
            self.skipTest("No admin token available")
        
        # Get list of teams first
        headers = {"Authorization": f"Bearer {AdminTeamManagementTester.admin_token}"}
        response = requests.get(
            f"{self.base_url}/api/admin/teams",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        teams_data = response.json()
        teams = teams_data["teams"]
        
        if not teams:
            print("  No teams available for bulk action testing")
            return
        
        # Test bulk verification of multiple teams
        team_ids = [team["id"] for team in teams[:2]]  # Take first 2 teams
        
        bulk_verify_data = {
            "team_ids": team_ids,
            "action": "verify",
            "action_data": {
                "reason": "Bulk verification for API testing"
            }
        }
        
        response = requests.post(
            f"{self.base_url}/api/admin/teams/bulk-action",
            headers=headers,
            json=bulk_verify_data
        )
        
        self.assertEqual(response.status_code, 200, f"Failed to perform bulk verification: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("message", data)
        self.assertIn("successful_actions", data)
        self.assertIn("failed_actions", data)
        self.assertIn("total_successful", data)
        self.assertIn("total_failed", data)
        
        print(f"✅ Bulk verification completed - Success: {data['total_successful']}, Failed: {data['total_failed']}")
        
        # Test bulk status update
        bulk_suspend_data = {
            "team_ids": team_ids,
            "action": "suspend",
            "action_data": {
                "reason": "Bulk suspension for API testing"
            }
        }
        
        response = requests.post(
            f"{self.base_url}/api/admin/teams/bulk-action",
            headers=headers,
            json=bulk_suspend_data
        )
        
        self.assertEqual(response.status_code, 200, f"Failed to perform bulk suspension: {response.text}")
        data = response.json()
        
        print(f"✅ Bulk suspension completed - Success: {data['total_successful']}, Failed: {data['total_failed']}")
        
        # Test with empty team_ids array (should fail)
        empty_bulk_data = {
            "team_ids": [],
            "action": "verify",
            "action_data": {}
        }
        
        response = requests.post(
            f"{self.base_url}/api/admin/teams/bulk-action",
            headers=headers,
            json=empty_bulk_data
        )
        
        self.assertEqual(response.status_code, 400, "Expected 400 error for empty team_ids array")
        print("  ✅ Correctly rejected empty team_ids array")
        
        # Test with invalid action (should fail)
        invalid_bulk_data = {
            "team_ids": team_ids,
            "action": "invalid_action",
            "action_data": {}
        }
        
        response = requests.post(
            f"{self.base_url}/api/admin/teams/bulk-action",
            headers=headers,
            json=invalid_bulk_data
        )
        
        self.assertEqual(response.status_code, 400, "Expected 400 error for invalid bulk action")
        print("  ✅ Correctly rejected invalid bulk action")
        
        # Restore teams to active status
        bulk_activate_data = {
            "team_ids": team_ids,
            "action": "activate",
            "action_data": {
                "reason": "Restoring teams after API testing"
            }
        }
        
        response = requests.post(
            f"{self.base_url}/api/admin/teams/bulk-action",
            headers=headers,
            json=bulk_activate_data
        )
        
        self.assertEqual(response.status_code, 200)
        print("  ✅ Teams restored to active status")
    
    def test_08_delete_team_super_admin_only(self):
        """Test DELETE /api/admin/teams/{team_id} - Delete team (Super Admin only)"""
        print("\n🔍 Testing DELETE /api/admin/teams/{team_id} endpoint (Super Admin only)...")
        
        # Skip if no god token
        if not AdminTeamManagementTester.god_token:
            self.skipTest("No God token available")
        
        # First, test that regular admin cannot delete teams
        if AdminTeamManagementTester.admin_token and AdminTeamManagementTester.test_team_id:
            print("  Testing that regular admin cannot delete teams...")
            admin_headers = {"Authorization": f"Bearer {AdminTeamManagementTester.admin_token}"}
            response = requests.delete(
                f"{self.base_url}/api/admin/teams/{AdminTeamManagementTester.test_team_id}",
                headers=admin_headers
            )
            
            self.assertEqual(response.status_code, 403, "Expected 403 error when regular admin tries to delete team")
            print("  ✅ Correctly prevented regular admin from deleting teams")
        
        # Get list of teams to find one to delete
        god_headers = {"Authorization": f"Bearer {AdminTeamManagementTester.god_token}"}
        response = requests.get(
            f"{self.base_url}/api/admin/teams",
            headers=god_headers
        )
        
        self.assertEqual(response.status_code, 200)
        teams_data = response.json()
        teams = teams_data["teams"]
        
        if not teams:
            print("  No teams available for deletion testing")
            return
        
        # Find a team to delete (preferably not the main test team)
        team_to_delete = None
        for team in teams:
            if team["id"] != AdminTeamManagementTester.test_team_id:
                team_to_delete = team
                break
        
        if not team_to_delete:
            # If no other team, use the test team
            team_to_delete = teams[0]
        
        team_id_to_delete = team_to_delete["id"]
        team_name_to_delete = team_to_delete["name"]
        
        print(f"  Attempting to delete team: {team_name_to_delete} (ID: {team_id_to_delete})")
        
        # Test deletion with God credentials
        response = requests.delete(
            f"{self.base_url}/api/admin/teams/{team_id_to_delete}",
            headers=god_headers
        )
        
        self.assertEqual(response.status_code, 200, f"Failed to delete team: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("message", data)
        self.assertIn("team_id", data)
        self.assertEqual(data["team_id"], team_id_to_delete)
        
        print(f"✅ Successfully deleted team '{team_name_to_delete}'")
        
        # Verify team was actually deleted
        response = requests.get(
            f"{self.base_url}/api/admin/teams",
            headers=god_headers
        )
        
        self.assertEqual(response.status_code, 200)
        updated_teams_data = response.json()
        updated_teams = updated_teams_data["teams"]
        
        # Check that the deleted team is no longer in the list
        deleted_team_found = False
        for team in updated_teams:
            if team["id"] == team_id_to_delete:
                deleted_team_found = True
                break
        
        self.assertFalse(deleted_team_found, "Deleted team should not be found in the teams list")
        print("  ✅ Team successfully removed from database")
        
        # Test deleting non-existent team (should fail)
        fake_team_id = str(uuid.uuid4())
        
        response = requests.delete(
            f"{self.base_url}/api/admin/teams/{fake_team_id}",
            headers=god_headers
        )
        
        self.assertEqual(response.status_code, 404, "Expected 404 error when deleting non-existent team")
        print("  ✅ Correctly handled deletion of non-existent team")
    
    def test_09_authorization_tests(self):
        """Test authorization for admin team management endpoints"""
        print("\n🔍 Testing authorization for admin team management endpoints...")
        
        # Test without authentication (should fail with 403)
        print("  Testing endpoints without authentication...")
        
        # GET /api/admin/teams without auth
        response = requests.get(f"{self.base_url}/api/admin/teams")
        self.assertEqual(response.status_code, 403, "Expected 403 error when accessing admin teams without auth")
        
        # PUT verification without auth
        if AdminTeamManagementTester.test_team_id:
            verification_data = {"verification_status": "verified", "admin_notes": "test"}
            response = requests.put(
                f"{self.base_url}/api/admin/teams/{AdminTeamManagementTester.test_team_id}/verification",
                json=verification_data
            )
            self.assertEqual(response.status_code, 403, "Expected 403 error when updating verification without auth")
        
        # Bulk action without auth
        bulk_data = {"team_ids": ["test"], "action": "verify", "action_data": {}}
        response = requests.post(
            f"{self.base_url}/api/admin/teams/bulk-action",
            json=bulk_data
        )
        self.assertEqual(response.status_code, 403, "Expected 403 error when performing bulk action without auth")
        
        print("  ✅ Correctly rejected requests without authentication")
        
        # Test with regular user token (should fail with 403)
        if AdminTeamManagementTester.user_token:
            print("  Testing endpoints with regular user token...")
            user_headers = {"Authorization": f"Bearer {AdminTeamManagementTester.user_token}"}
            
            # GET /api/admin/teams with user token
            response = requests.get(
                f"{self.base_url}/api/admin/teams",
                headers=user_headers
            )
            self.assertEqual(response.status_code, 403, "Expected 403 error when regular user accesses admin teams")
            
            # PUT verification with user token
            if AdminTeamManagementTester.test_team_id:
                verification_data = {"verification_status": "verified", "admin_notes": "test"}
                response = requests.put(
                    f"{self.base_url}/api/admin/teams/{AdminTeamManagementTester.test_team_id}/verification",
                    headers=user_headers,
                    json=verification_data
                )
                self.assertEqual(response.status_code, 403, "Expected 403 error when regular user updates verification")
            
            # Bulk action with user token
            bulk_data = {"team_ids": ["test"], "action": "verify", "action_data": {}}
            response = requests.post(
                f"{self.base_url}/api/admin/teams/bulk-action",
                headers=user_headers,
                json=bulk_data
            )
            self.assertEqual(response.status_code, 403, "Expected 403 error when regular user performs bulk action")
            
            print("  ✅ Correctly prevented regular user from accessing admin endpoints")
        
        print("✅ Authorization tests passed")

def run_admin_team_management_tests():
    """Run admin team management tests"""
    admin_team_test_suite = unittest.TestSuite()
    admin_team_test_suite.addTest(AdminTeamManagementTester('test_01_admin_login'))
    admin_team_test_suite.addTest(AdminTeamManagementTester('test_02_god_login'))
    admin_team_test_suite.addTest(AdminTeamManagementTester('test_03_user_login'))
    admin_team_test_suite.addTest(AdminTeamManagementTester('test_04_get_all_teams_admin'))
    admin_team_test_suite.addTest(AdminTeamManagementTester('test_05_update_team_verification'))
    admin_team_test_suite.addTest(AdminTeamManagementTester('test_06_update_team_status'))
    admin_team_test_suite.addTest(AdminTeamManagementTester('test_07_bulk_team_actions'))
    admin_team_test_suite.addTest(AdminTeamManagementTester('test_08_delete_team_super_admin_only'))
    admin_team_test_suite.addTest(AdminTeamManagementTester('test_09_authorization_tests'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    print("\n" + "=" * 50)
    print("TESTING ADMIN TEAM MANAGEMENT FUNCTIONALITY")
    print("=" * 50)
    runner.run(admin_team_test_suite)

if __name__ == "__main__":
    run_admin_team_management_tests()