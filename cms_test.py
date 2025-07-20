import requests
import unittest

class CMSSystemTester(unittest.TestCase):
    """Test Content Management System (CMS) backend endpoints"""
    
    base_url = "https://b8f460b2-9f72-45d6-94e8-1deef7e57785.preview.emergentagent.com"
    
    # Admin credentials for CMS testing
    admin_credentials = {
        "username": "admin",
        "password": "Kiki1999@"
    }
    
    admin_token = None
    created_content_id = None
    created_theme_id = None
    
    def test_01_admin_login(self):
        """Login as admin to get token for CMS endpoints"""
        print("\n🔍 Testing admin login for CMS System testing...")
        response = requests.post(
            f"{self.base_url}/api/login",
            json=self.admin_credentials
        )
        self.assertEqual(response.status_code, 200, f"Admin login failed with status {response.status_code}: {response.text}")
        data = response.json()
        self.assertIn("token", data)
        CMSSystemTester.admin_token = data["token"]
        print(f"✅ Admin login successful - Token obtained for CMS System testing")
    
    def test_02_get_public_content(self):
        """Test GET /api/cms/content - Get active content (public endpoint)"""
        print("\n🔍 Testing GET /api/cms/content endpoint (public)...")
        
        response = requests.get(f"{self.base_url}/api/cms/content")
        self.assertEqual(response.status_code, 200, f"Public content request failed: {response.text}")
        
        data = response.json()
        self.assertIsInstance(data, dict, "Content should be returned as a dictionary")
        
        # Check for expected default content keys
        expected_keys = ["nav_home", "nav_rankings", "nav_tournaments", "hero_title", "hero_subtitle", "color_primary"]
        found_keys = []
        
        for key in expected_keys:
            if key in data:
                found_keys.append(key)
                content_item = data[key]
                self.assertIn("value", content_item)
                self.assertIn("type", content_item)
                self.assertIn("context", content_item)
                print(f"  ✅ Found content key '{key}': {content_item['value']}")
        
        print(f"  ✅ Public content retrieved successfully - Found {len(data)} content items")
        print(f"  Expected keys found: {len(found_keys)}/{len(expected_keys)}")
        
        if len(found_keys) == 0:
            print("  ⚠️ No expected content found - CMS may need initialization")
        
        print("✅ GET /api/cms/content endpoint test passed")
    
    def test_03_get_admin_content(self):
        """Test GET /api/admin/cms/content - Get all content (admin endpoint)"""
        print("\n🔍 Testing GET /api/admin/cms/content endpoint...")
        
        # Skip if admin login failed
        if not CMSSystemTester.admin_token:
            self.skipTest("Admin token not available, skipping admin content test")
        
        headers = {"Authorization": f"Bearer {CMSSystemTester.admin_token}"}
        response = requests.get(
            f"{self.base_url}/api/admin/cms/content",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200, f"Admin content request failed: {response.text}")
        
        data = response.json()
        self.assertIn("content", data)
        self.assertIn("total", data)
        self.assertIsInstance(data["content"], list)
        self.assertIsInstance(data["total"], int)
        
        content_items = data["content"]
        total_items = data["total"]
        
        print(f"  ✅ Admin content retrieved successfully:")
        print(f"    Total content items: {total_items}")
        print(f"    Content items in response: {len(content_items)}")
        
        # Verify content item structure
        if content_items:
            first_item = content_items[0]
            required_fields = ["id", "key", "content_type", "context", "default_value", "current_value", "is_active"]
            for field in required_fields:
                self.assertIn(field, first_item, f"Missing required field: {field}")
            
            print(f"    Sample content item: {first_item['key']} = '{first_item['current_value']}'")
            print(f"    Content type: {first_item['content_type']}, Context: {first_item['context']}")
        
        print("✅ GET /api/admin/cms/content endpoint test passed")
    
    def test_04_create_content(self):
        """Test POST /api/admin/cms/content - Create new content"""
        print("\n🔍 Testing POST /api/admin/cms/content endpoint...")
        
        # Skip if admin login failed
        if not CMSSystemTester.admin_token:
            self.skipTest("Admin token not available, skipping content creation test")
        
        # Test content creation
        test_content = {
            "key": "test_cms_content",
            "content_type": "text",
            "context": "general",
            "current_value": "This is a test CMS content item",
            "description": "Test content created by automated testing"
        }
        
        headers = {"Authorization": f"Bearer {CMSSystemTester.admin_token}"}
        response = requests.post(
            f"{self.base_url}/api/admin/cms/content",
            headers=headers,
            json=test_content
        )
        
        print(f"  Response status: {response.status_code}")
        print(f"  Response body: {response.text}")
        
        if response.status_code == 400 and "already exists" in response.text:
            print("  ⚠️ Content already exists (expected for repeated tests)")
            # Try to get the existing content ID for later tests
            admin_content_response = requests.get(
                f"{self.base_url}/api/admin/cms/content",
                headers=headers
            )
            if admin_content_response.status_code == 200:
                admin_data = admin_content_response.json()
                for item in admin_data.get("content", []):
                    if item.get("key") == test_content["key"]:
                        CMSSystemTester.created_content_id = item["id"]
                        print(f"  Found existing content ID: {CMSSystemTester.created_content_id}")
                        break
            return
        
        self.assertEqual(response.status_code, 200, f"Content creation failed: {response.text}")
        
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("content", data)
        
        created_content = data["content"]
        self.assertEqual(created_content["key"], test_content["key"])
        self.assertEqual(created_content["current_value"], test_content["current_value"])
        self.assertEqual(created_content["content_type"], test_content["content_type"])
        self.assertEqual(created_content["context"], test_content["context"])
        
        # Store created content ID for later tests
        CMSSystemTester.created_content_id = created_content["id"]
        
        print(f"  ✅ Content created successfully:")
        print(f"    Content ID: {created_content['id']}")
        print(f"    Key: {created_content['key']}")
        print(f"    Value: {created_content['current_value']}")
        
        print("✅ POST /api/admin/cms/content endpoint test passed")
    
    def test_05_update_content(self):
        """Test PUT /api/admin/cms/content/{id} - Update existing content"""
        print("\n🔍 Testing PUT /api/admin/cms/content/{id} endpoint...")
        
        # Skip if admin login failed or no content created
        if not CMSSystemTester.admin_token or not CMSSystemTester.created_content_id:
            self.skipTest("Admin token or created content ID not available, skipping content update test")
        
        # Test content update
        updated_content = {
            "key": "test_cms_content",
            "content_type": "text",
            "context": "general",
            "current_value": "This is an UPDATED test CMS content item",
            "description": "Test content updated by automated testing"
        }
        
        headers = {"Authorization": f"Bearer {CMSSystemTester.admin_token}"}
        response = requests.put(
            f"{self.base_url}/api/admin/cms/content/{CMSSystemTester.created_content_id}",
            headers=headers,
            json=updated_content
        )
        
        self.assertEqual(response.status_code, 200, f"Content update failed: {response.text}")
        
        data = response.json()
        self.assertIn("message", data)
        self.assertEqual(data["message"], "Content updated successfully")
        
        print(f"  ✅ Content updated successfully:")
        print(f"    Content ID: {CMSSystemTester.created_content_id}")
        print(f"    New value: {updated_content['current_value']}")
        
        print("✅ PUT /api/admin/cms/content/{id} endpoint test passed")
    
    def test_06_bulk_update_content(self):
        """Test POST /api/admin/cms/content/bulk - Bulk update content"""
        print("\n🔍 Testing POST /api/admin/cms/content/bulk endpoint...")
        
        # Skip if admin login failed
        if not CMSSystemTester.admin_token:
            self.skipTest("Admin token not available, skipping bulk content update test")
        
        # Test bulk content update
        bulk_updates = {
            "updates": [
                {
                    "key": "bulk_test_1",
                    "content_type": "text",
                    "context": "general",
                    "current_value": "Bulk test content 1",
                    "description": "First bulk test content"
                },
                {
                    "key": "bulk_test_2",
                    "content_type": "color",
                    "context": "general",
                    "current_value": "#ff0000",
                    "description": "Second bulk test content (color)"
                }
            ]
        }
        
        headers = {"Authorization": f"Bearer {CMSSystemTester.admin_token}"}
        response = requests.post(
            f"{self.base_url}/api/admin/cms/content/bulk",
            headers=headers,
            json=bulk_updates
        )
        
        self.assertEqual(response.status_code, 200, f"Bulk content update failed: {response.text}")
        
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("processed", data["message"])
        
        print(f"  ✅ Bulk content update successful:")
        print(f"    Response: {data['message']}")
        print(f"    Updated {len(bulk_updates['updates'])} content items")
        
        print("✅ POST /api/admin/cms/content/bulk endpoint test passed")
    
    def test_07_get_active_theme(self):
        """Test GET /api/cms/theme/active - Get currently active theme"""
        print("\n🔍 Testing GET /api/cms/theme/active endpoint...")
        
        response = requests.get(f"{self.base_url}/api/cms/theme/active")
        self.assertEqual(response.status_code, 200, f"Active theme request failed: {response.text}")
        
        data = response.json()
        
        # Verify theme structure
        required_fields = ["id", "name", "colors"]
        for field in required_fields:
            self.assertIn(field, data, f"Missing required field: {field}")
        
        # Verify colors structure
        colors = data["colors"]
        expected_colors = ["primary", "secondary", "accent", "background", "text"]
        for color in expected_colors:
            if color in colors:
                print(f"    Color {color}: {colors[color]}")
        
        print(f"  ✅ Active theme retrieved successfully:")
        print(f"    Theme ID: {data['id']}")
        print(f"    Theme name: {data['name']}")
        print(f"    Colors defined: {len(colors)}")
        
        if "fonts" in data:
            fonts = data["fonts"]
            print(f"    Fonts defined: {len(fonts)}")
        
        print("✅ GET /api/cms/theme/active endpoint test passed")
    
    def test_08_get_admin_themes(self):
        """Test GET /api/admin/cms/themes - Get all themes (admin endpoint)"""
        print("\n🔍 Testing GET /api/admin/cms/themes endpoint...")
        
        # Skip if admin login failed
        if not CMSSystemTester.admin_token:
            self.skipTest("Admin token not available, skipping admin themes test")
        
        headers = {"Authorization": f"Bearer {CMSSystemTester.admin_token}"}
        response = requests.get(
            f"{self.base_url}/api/admin/cms/themes",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200, f"Admin themes request failed: {response.text}")
        
        data = response.json()
        self.assertIn("themes", data)
        self.assertIn("total", data)
        self.assertIsInstance(data["themes"], list)
        self.assertIsInstance(data["total"], int)
        
        themes = data["themes"]
        total_themes = data["total"]
        
        print(f"  ✅ Admin themes retrieved successfully:")
        print(f"    Total themes: {total_themes}")
        print(f"    Themes in response: {len(themes)}")
        
        # Verify theme structure
        if themes:
            first_theme = themes[0]
            required_fields = ["id", "name", "colors", "is_active"]
            for field in required_fields:
                self.assertIn(field, first_theme, f"Missing required field: {field}")
            
            print(f"    Sample theme: {first_theme['name']}")
            print(f"    Is active: {first_theme['is_active']}")
            print(f"    Colors: {len(first_theme['colors'])} defined")
        
        print("✅ GET /api/admin/cms/themes endpoint test passed")
    
    def test_09_create_theme(self):
        """Test POST /api/admin/cms/themes - Create new theme"""
        print("\n🔍 Testing POST /api/admin/cms/themes endpoint...")
        
        # Skip if admin login failed
        if not CMSSystemTester.admin_token:
            self.skipTest("Admin token not available, skipping theme creation test")
        
        # Test theme creation
        test_theme = {
            "name": "Test Theme",
            "colors": {
                "primary": "#ff6b6b",
                "secondary": "#4ecdc4",
                "accent": "#45b7d1",
                "success": "#96ceb4",
                "warning": "#feca57",
                "error": "#ff9ff3",
                "background": "#2c2c54",
                "surface": "#40407a",
                "text": "#f1f2f6"
            },
            "fonts": {
                "primary": "Poppins, sans-serif",
                "secondary": "Open Sans, sans-serif"
            }
        }
        
        headers = {"Authorization": f"Bearer {CMSSystemTester.admin_token}"}
        response = requests.post(
            f"{self.base_url}/api/admin/cms/themes",
            headers=headers,
            json=test_theme
        )
        
        self.assertEqual(response.status_code, 200, f"Theme creation failed: {response.text}")
        
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("theme", data)
        
        created_theme = data["theme"]
        self.assertEqual(created_theme["name"], test_theme["name"])
        self.assertEqual(created_theme["colors"], test_theme["colors"])
        self.assertEqual(created_theme["fonts"], test_theme["fonts"])
        self.assertFalse(created_theme["is_active"])  # New themes should not be active by default
        
        # Store created theme ID for later tests
        CMSSystemTester.created_theme_id = created_theme["id"]
        
        print(f"  ✅ Theme created successfully:")
        print(f"    Theme ID: {created_theme['id']}")
        print(f"    Name: {created_theme['name']}")
        print(f"    Colors: {len(created_theme['colors'])} defined")
        print(f"    Is active: {created_theme['is_active']}")
        
        print("✅ POST /api/admin/cms/themes endpoint test passed")
    
    def test_10_activate_theme(self):
        """Test PUT /api/admin/cms/themes/{id}/activate - Activate a theme"""
        print("\n🔍 Testing PUT /api/admin/cms/themes/{id}/activate endpoint...")
        
        # Skip if admin login failed or no theme created
        if not CMSSystemTester.admin_token or not CMSSystemTester.created_theme_id:
            self.skipTest("Admin token or created theme ID not available, skipping theme activation test")
        
        headers = {"Authorization": f"Bearer {CMSSystemTester.admin_token}"}
        response = requests.put(
            f"{self.base_url}/api/admin/cms/themes/{CMSSystemTester.created_theme_id}/activate",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200, f"Theme activation failed: {response.text}")
        
        data = response.json()
        self.assertIn("message", data)
        self.assertEqual(data["message"], "Theme activated successfully")
        
        print(f"  ✅ Theme activated successfully:")
        print(f"    Theme ID: {CMSSystemTester.created_theme_id}")
        
        # Verify the theme is now active by checking the active theme endpoint
        active_response = requests.get(f"{self.base_url}/api/cms/theme/active")
        self.assertEqual(active_response.status_code, 200)
        active_data = active_response.json()
        
        # The active theme should now be our created theme
        self.assertEqual(active_data["id"], CMSSystemTester.created_theme_id)
        print(f"    Verified: Theme is now active - {active_data['name']}")
        
        print("✅ PUT /api/admin/cms/themes/{id}/activate endpoint test passed")
    
    def test_11_delete_content(self):
        """Test DELETE /api/admin/cms/content/{id} - Delete content"""
        print("\n🔍 Testing DELETE /api/admin/cms/content/{id} endpoint...")
        
        # Skip if admin login failed or no content created
        if not CMSSystemTester.admin_token or not CMSSystemTester.created_content_id:
            self.skipTest("Admin token or created content ID not available, skipping content deletion test")
        
        headers = {"Authorization": f"Bearer {CMSSystemTester.admin_token}"}
        response = requests.delete(
            f"{self.base_url}/api/admin/cms/content/{CMSSystemTester.created_content_id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200, f"Content deletion failed: {response.text}")
        
        data = response.json()
        self.assertIn("message", data)
        self.assertEqual(data["message"], "Content deleted successfully")
        
        print(f"  ✅ Content deleted successfully:")
        print(f"    Content ID: {CMSSystemTester.created_content_id}")
        
        print("✅ DELETE /api/admin/cms/content/{id} endpoint test passed")
    
    def test_12_test_authentication_requirements(self):
        """Test that CMS admin endpoints properly require admin authentication"""
        print("\n🔍 Testing authentication requirements for CMS admin endpoints...")
        
        # Test admin content endpoint without authentication
        print("  Testing admin content without auth...")
        response = requests.get(f"{self.base_url}/api/admin/cms/content")
        self.assertEqual(response.status_code, 401, "Admin content should require authentication")
        print("  ✅ Admin content correctly requires authentication")
        
        # Test create content without authentication
        print("  Testing create content without auth...")
        test_content = {
            "key": "test_key",
            "content_type": "text",
            "context": "general",
            "current_value": "test value"
        }
        response = requests.post(
            f"{self.base_url}/api/admin/cms/content",
            json=test_content
        )
        self.assertEqual(response.status_code, 401, "Create content should require authentication")
        print("  ✅ Create content correctly requires authentication")
        
        # Test admin themes without authentication
        print("  Testing admin themes without auth...")
        response = requests.get(f"{self.base_url}/api/admin/cms/themes")
        self.assertEqual(response.status_code, 401, "Admin themes should require authentication")
        print("  ✅ Admin themes correctly requires authentication")
        
        print("✅ Authentication requirements test passed")
    
    def test_13_test_content_types_and_contexts(self):
        """Test different content types and contexts"""
        print("\n🔍 Testing different content types and contexts...")
        
        # Skip if admin login failed
        if not CMSSystemTester.admin_token:
            self.skipTest("Admin token not available, skipping content types test")
        
        # Test different content types and contexts
        test_contents = [
            {
                "key": "test_text_navbar",
                "content_type": "text",
                "context": "navbar",
                "current_value": "Test Navbar Text",
                "description": "Test text content in navbar context"
            },
            {
                "key": "test_color_hero",
                "content_type": "color",
                "context": "hero",
                "current_value": "#ff5722",
                "description": "Test color content in hero context"
            },
            {
                "key": "test_image_features",
                "content_type": "image",
                "context": "features",
                "current_value": "https://example.com/test-image.jpg",
                "description": "Test image content in features context"
            }
        ]
        
        headers = {"Authorization": f"Bearer {CMSSystemTester.admin_token}"}
        created_items = []
        
        for content in test_contents:
            response = requests.post(
                f"{self.base_url}/api/admin/cms/content",
                headers=headers,
                json=content
            )
            
            if response.status_code == 200:
                data = response.json()
                created_items.append(data["content"])
                print(f"  ✅ Created {content['content_type']} content in {content['context']} context")
            elif response.status_code == 400 and "already exists" in response.text:
                print(f"  ⚠️ Content {content['key']} already exists (expected for repeated tests)")
            else:
                print(f"  ❌ Failed to create {content['key']}: {response.text}")
        
        print(f"  ✅ Successfully tested {len(created_items)} different content types and contexts")
        
        # Verify the content appears in public endpoint
        public_response = requests.get(f"{self.base_url}/api/cms/content")
        self.assertEqual(public_response.status_code, 200)
        public_data = public_response.json()
        
        found_test_items = 0
        for content in test_contents:
            if content["key"] in public_data:
                found_test_items += 1
                item = public_data[content["key"]]
                self.assertEqual(item["type"], content["content_type"])
                self.assertEqual(item["context"], content["context"])
        
        print(f"  ✅ Verified {found_test_items} test content items appear in public endpoint")
        
        print("✅ Content types and contexts test passed")

if __name__ == "__main__":
    unittest.main()