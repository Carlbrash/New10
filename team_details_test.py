import requests
import json

# Base URL from frontend/.env
base_url = "https://49f63d92-acd8-4e16-a4be-50baa0fb091a.preview.emergentagent.com"

# Step 1: Get all teams to find a team ID
print("Step 1: Get all teams")
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

# Step 2: Get team details
print("\nStep 2: Get team details")
response = requests.get(f"{base_url}/api/teams/{team_id}")
print(f"Response status: {response.status_code}")
print(f"Response body: {response.text}")

if response.status_code != 200:
    print("Failed to get team details, exiting")
    exit(1)

team_details = response.json()
print(f"Team name: {team_details.get('name')}")
print(f"Team captain: {team_details.get('captain_name')}")
print(f"Team members: {len(team_details.get('members', []))}")