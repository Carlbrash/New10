import requests
import json

# Base URL from frontend/.env
base_url = "https://b90141f8-e066-4425-bc76-e032fe56376a.preview.emergentagent.com"

# Step 1: Login as testuser
print("Step 1: Login as testuser")
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

if response.status_code != 200:
    print("Login failed, exiting")
    exit(1)

data = response.json()
token = data["token"]
print(f"Token: {token[:20]}...")

# Step 2: Get all teams to find a team ID
print("\nStep 2: Get all teams")
response = requests.get(f"{base_url}/api/teams")
print(f"Response status: {response.status_code}")
print(f"Response body: {response.text[:500]}...")  # Show first 500 chars

if response.status_code != 200:
    print("Failed to get teams, exiting")
    exit(1)

data = response.json()
teams = data["teams"]

if not teams:
    print("No teams found, exiting")
    exit(1)

# Get the first team's ID
team_id = teams[0]["id"]
print(f"Using team ID: {team_id}")

# Step 3: Invite admin user to the team
print("\nStep 3: Invite admin user to the team")
invite_data = {
    "username": "admin"
}
headers = {"Authorization": f"Bearer {token}"}
response = requests.post(
    f"{base_url}/api/teams/{team_id}/invite",
    headers=headers,
    json=invite_data
)
print(f"Response status: {response.status_code}")
print(f"Response body: {response.text}")

# Step 4: Login as admin
print("\nStep 4: Login as admin")
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

if response.status_code != 200:
    print("Admin login failed, exiting")
    exit(1)

data = response.json()
admin_token = data["token"]
print(f"Admin token: {admin_token[:20]}...")

# Step 5: Get admin's invitations
print("\nStep 5: Get admin's invitations")
headers = {"Authorization": f"Bearer {admin_token}"}
response = requests.get(
    f"{base_url}/api/teams/my-invitations",
    headers=headers
)
print(f"Response status: {response.status_code}")
print(f"Response body: {response.text}")

if response.status_code != 200:
    print("Failed to get invitations, exiting")
    exit(1)

data = response.json()
invitations = data.get("invitations", [])

if not invitations:
    print("No invitations found, admin might already be a member of the team")
    exit(0)

# Get the invitation ID
invitation_id = invitations[0]["id"]
print(f"Using invitation ID: {invitation_id}")

# Step 6: Accept the invitation
print("\nStep 6: Accept the invitation")
headers = {"Authorization": f"Bearer {admin_token}"}
response = requests.post(
    f"{base_url}/api/teams/invitations/{invitation_id}/accept",
    headers=headers
)
print(f"Response status: {response.status_code}")
print(f"Response body: {response.text}")