import requests
import json

# Base URL from frontend/.env
base_url = "https://3d143e9e-75ad-464c-82db-c896bc1e2a10.preview.emergentagent.com"

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

# Step 2: Get current teams
print("\nStep 2: Get current teams")
response = requests.get(f"{base_url}/api/teams")
print(f"Response status: {response.status_code}")
print(f"Response body: {response.text[:500]}...")  # Show first 500 chars

# Step 3: Create a new team
print("\nStep 3: Create a new team")
team_data = {
    "name": "Test Warriors Backend",
    "logo_url": "https://via.placeholder.com/100",
    "colors": {
        "primary": "#FF0000",
        "secondary": "#FFFFFF"
    },
    "city": "Athens",
    "country": "Greece",
    "phone": "+30123456789",
    "email": "testwarriors@example.com"
}

headers = {"Authorization": f"Bearer {token}"}
response = requests.post(
    f"{base_url}/api/teams",
    headers=headers,
    json=team_data
)

print(f"Response status: {response.status_code}")
print(f"Response body: {response.text}")

# Step 4: Get teams again to verify
print("\nStep 4: Get teams again to verify")
response = requests.get(f"{base_url}/api/teams")
print(f"Response status: {response.status_code}")
print(f"Response body: {response.text[:500]}...")  # Show first 500 chars