import requests
import json
from datetime import datetime

def run_team_system_tests():
    # Use the public endpoint from frontend/.env
    base_url = "https://b8f460b2-9f72-45d6-94e8-1deef7e57785.preview.emergentagent.com"
    testuser_token = None
    admin_token = None
    team_id = None
    invitation_id = None
    
    print("\n==================================================")
    print("TESTING TEAM SYSTEM API ENDPOINTS")
    print("==================================================")
    
    # Test 1: Login as testuser
    print("\n🔍 Testing login as testuser...")
    login_data = {
        "username": "testuser",
        "password": "test123"
    }
    response = requests.post(
        f"{base_url}/api/login",
        json=login_data
    )
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        testuser_token = data["token"]
        print("✅ Login as testuser successful")
    else:
        print("❌ Login as testuser failed")
        return
    
    # Test 2: Login as admin
    print("\n🔍 Testing login as admin...")
    login_data = {
        "username": "admin",
        "password": "Kiki1999@"
    }
    response = requests.post(
        f"{base_url}/api/login",
        json=login_data
    )
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        admin_token = data["token"]
        print("✅ Login as admin successful")
    else:
        print("❌ Login as admin failed")
        return
    
    # Test 3: Get teams (should be empty initially)
    print("\n🔍 Testing GET /api/teams (initial state)...")
    response = requests.get(f"{base_url}/api/teams")
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ GET /api/teams returned {len(data['teams'])} teams")
        
        # Print teams if any exist
        if data["teams"]:
            print("Existing teams:")
            for team in data["teams"]:
                print(f"  - {team['name']} (ID: {team['id']})")
    else:
        print("❌ GET /api/teams failed")
    
    # Test 4: Create team
    print("\n🔍 Testing POST /api/teams (create team)...")
    team_data = {
        "name": "Test Warriors",
        "logo_url": "https://example.com/logo.png",
        "colors": {
            "primary": "#FF0000",
            "secondary": "#FFFFFF"
        },
        "city": "Athens",
        "country": "Greece", 
        "phone": "+30123456789",
        "email": "testwarriors@example.com"
    }
    
    headers = {"Authorization": f"Bearer {testuser_token}"}
    response = requests.post(
        f"{base_url}/api/teams",
        headers=headers,
        json=team_data
    )
    
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    
    # If team already exists, this might fail with 400
    if response.status_code == 400 and "already a member" in response.text:
        print("⚠️ User is already a member of a team, skipping team creation")
        
        # Get existing teams to find the user's team
        response = requests.get(f"{base_url}/api/teams")
        teams = response.json()["teams"]
        
        # Find a team where testuser is captain
        for team in teams:
            if team.get("captain_username") == "testuser":
                team_id = team["id"]
                print(f"✅ Found existing team: {team['name']} (ID: {team_id})")
                break
    elif response.status_code == 200:
        data = response.json()
        team_id = data["team_id"]
        print(f"✅ Team created successfully with ID: {team_id}")
    else:
        print("❌ Team creation failed")
        if team_id is None:
            return
    
    # Test 5: Get teams after creation
    print("\n🔍 Testing GET /api/teams after team creation...")
    response = requests.get(f"{base_url}/api/teams")
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ GET /api/teams returned {len(data['teams'])} teams")
        
        # Verify our team is in the list
        found = False
        for team in data["teams"]:
            if team_id and team["id"] == team_id:
                found = True
                print(f"✅ Found our team in the list: {team['name']}")
                break
        
        if team_id and not found:
            print("❌ Our team was not found in the teams list")
    else:
        print("❌ GET /api/teams failed")
    
    # Test 6: Get team details
    print("\n🔍 Testing GET /api/teams/{team_id}...")
    if team_id:
        response = requests.get(f"{base_url}/api/teams/{team_id}")
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            team = response.json()
            print(f"✅ Team details retrieved successfully:")
            print(f"  - Name: {team['name']}")
            print(f"  - Captain: {team['captain']['username']}")
            print(f"  - Members: {len(team['members'])}")
        else:
            print("❌ GET /api/teams/{team_id} failed")
    else:
        print("⚠️ Skipping team details test (no team ID available)")
    
    # Test 7: Invite player
    print("\n🔍 Testing POST /api/teams/{team_id}/invite...")
    if team_id and testuser_token:
        invite_data = {
            "username": "admin"
        }
        
        headers = {"Authorization": f"Bearer {testuser_token}"}
        response = requests.post(
            f"{base_url}/api/teams/{team_id}/invite",
            headers=headers,
            json=invite_data
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        # If invitation already exists, this might fail with 400
        if response.status_code == 400 and "already sent" in response.text:
            print("⚠️ Invitation already sent to this user")
            
            # We need to get the invitation ID for the next test
            # This requires logging in as admin and checking invitations
            if admin_token:
                admin_headers = {"Authorization": f"Bearer {admin_token}"}
                invitations_response = requests.get(
                    f"{base_url}/api/teams/my-invitations",
                    headers=admin_headers
                )
                
                print(f"Invitations response status: {invitations_response.status_code}")
                print(f"Invitations response body: {invitations_response.text}")
                
                if invitations_response.status_code == 200:
                    invitations = invitations_response.json().get("invitations", [])
                    for invitation in invitations:
                        if invitation["team_id"] == team_id:
                            invitation_id = invitation["id"]
                            print(f"✅ Found existing invitation ID: {invitation_id}")
                            break
        elif response.status_code == 200:
            data = response.json()
            invitation_id = data["invitation_id"]
            print(f"✅ Invitation sent successfully with ID: {invitation_id}")
        else:
            print("❌ Sending invitation failed")
    else:
        print("⚠️ Skipping invitation test (no team ID or testuser token available)")
    
    # Test 8: Get admin invitations
    print("\n🔍 Testing GET /api/teams/my-invitations as admin...")
    if admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{base_url}/api/teams/my-invitations",
            headers=headers
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ GET /api/teams/my-invitations returned {len(data['invitations'])} invitations")
            
            # Check if our invitation is in the list
            found = False
            for invitation in data["invitations"]:
                if team_id and invitation["team_id"] == team_id:
                    found = True
                    # Save invitation ID if we don't have it yet
                    if not invitation_id:
                        invitation_id = invitation["id"]
                    print(f"✅ Found our invitation in the list (ID: {invitation['id']})")
                    print(f"  - Team: {invitation['team_name']}")
                    print(f"  - Sent at: {invitation['sent_at']}")
                    print(f"  - Expires at: {invitation['expires_at']}")
                    break
            
            if team_id and not found:
                print("❌ Our invitation was not found in the invitations list")
        else:
            print("❌ GET /api/teams/my-invitations failed")
    else:
        print("⚠️ Skipping admin invitations test (no admin token available)")
    
    # Test 9: Accept invitation
    print("\n🔍 Testing POST /api/teams/invitations/{invitation_id}/accept...")
    if invitation_id and admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(
            f"{base_url}/api/teams/invitations/{invitation_id}/accept",
            headers=headers
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        # If user is already in a team, this might fail with 400
        if response.status_code == 400 and "already a member" in response.text:
            print("⚠️ Admin is already a member of a team, cannot accept invitation")
        elif response.status_code == 200:
            data = response.json()
            print(f"✅ Invitation accepted successfully: {data['message']}")
        else:
            print("❌ Accepting invitation failed")
    else:
        print("⚠️ Skipping invitation acceptance test (no invitation ID or admin token available)")
    
    # Test 10: Verify team members after invitation acceptance
    print("\n🔍 Verifying team members after invitation acceptance...")
    if team_id:
        response = requests.get(f"{base_url}/api/teams/{team_id}")
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            team = response.json()
            print(f"✅ Team now has {len(team['members'])} members")
            
            # Check if admin is now a member
            admin_is_member = False
            for member in team["members"]:
                if member["username"] == "admin":
                    admin_is_member = True
                    print(f"✅ Admin is now a member of the team")
                    break
            
            # This might be false if the invitation couldn't be accepted
            if not admin_is_member:
                print("⚠️ Admin is not a member of the team (this is expected if invitation acceptance failed)")
        else:
            print("❌ GET /api/teams/{team_id} failed")
    else:
        print("⚠️ Skipping team members verification (no team ID available)")
    
    print("\n==================================================")
    print("TEAM SYSTEM API TESTING COMPLETED")
    print("==================================================")

if __name__ == "__main__":
    run_team_system_tests()