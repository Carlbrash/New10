import requests
import json

# Base URL
base_url = "https://42b9aa62-6128-4581-a652-e6679123b102.preview.emergentagent.com"

# Test God login
print("\n=== Testing God login ===")
god_credentials = {
    "username": "God",
    "password": "Kiki1999@"
}

response = requests.post(f"{base_url}/api/login", json=god_credentials)
print(f"Response status: {response.status_code}")
print(f"Response body: {response.text}")

if response.status_code == 200:
    god_data = response.json()
    god_token = god_data["token"]
    print(f"God token: {god_token[:20]}...")
    
    # Test admin users endpoint with God token
    print("\n=== Testing admin users endpoint with God token ===")
    headers = {"Authorization": f"Bearer {god_token}"}
    response = requests.get(f"{base_url}/api/admin/users", headers=headers)
    print(f"Response status: {response.status_code}")
    print(f"Response body preview: {response.text[:200]}...")
    
    if response.status_code == 200:
        users_data = response.json()
        users = users_data.get("users", [])
        print(f"Found {len(users)} users")
        
        # Look for God user
        god_user = None
        admin_user = None
        for user in users:
            if user["username"] == "God":
                god_user = user
            elif user["username"] == "admin":
                admin_user = user
        
        if god_user:
            print("\nGod user details:")
            print(f"  Username: {god_user['username']}")
            print(f"  Admin role: {god_user['admin_role']}")
        else:
            print("God user not found in users list")
        
        if admin_user:
            print("\nAdmin user details:")
            print(f"  Username: {admin_user['username']}")
            print(f"  Admin role: {admin_user['admin_role']}")
        else:
            print("Admin user not found in users list")
    else:
        print("Failed to get users with God token")

# Test admin login
print("\n=== Testing admin login ===")
admin_credentials = {
    "username": "admin",
    "password": "Kiki1999@"
}

response = requests.post(f"{base_url}/api/login", json=admin_credentials)
print(f"Response status: {response.status_code}")
print(f"Response body: {response.text}")

if response.status_code == 200:
    admin_data = response.json()
    admin_token = admin_data["token"]
    print(f"Admin token: {admin_token[:20]}...")
    
    # Test admin users endpoint with admin token
    print("\n=== Testing admin users endpoint with admin token ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{base_url}/api/admin/users", headers=headers)
    print(f"Response status: {response.status_code}")
    print(f"Response body preview: {response.text[:200]}...")
    
    if response.status_code == 200:
        users_data = response.json()
        users = users_data.get("users", [])
        print(f"Found {len(users)} users")
    else:
        print("Failed to get users with admin token")