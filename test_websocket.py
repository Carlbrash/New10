#!/usr/bin/env python3
import asyncio
import websockets
import json
import requests

async def test_websocket():
    # First, get a token by logging in
    login_response = requests.post(
        "https://9a6eca50-8db5-4e67-9b01-228d23f9a32e.preview.emergentagent.com/api/login",
        json={"username": "alex", "password": "alex123"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()["token"]
    print(f"✅ Login successful, got token: {token[:50]}...")
    
    # Now test WebSocket connection
    uri = f"wss://52d00773-33f8-49d4-9102-623401ffa370.preview.emergentagent.com/ws/chat?token={token}"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Listen for messages for 5 seconds
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📨 Received message: {message}")
            except asyncio.TimeoutError:
                print("⏰ No message received within 5 seconds")
            
            # Send a test message
            test_message = {
                "type": "room_message",
                "room_id": "general",
                "message": "Hello from test script!"
            }
            
            await websocket.send(json.dumps(test_message))
            print("📤 Test message sent")
            
            # Listen for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📨 Response: {response}")
            except asyncio.TimeoutError:
                print("⏰ No response received within 5 seconds")
                
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())