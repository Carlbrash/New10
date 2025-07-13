#!/usr/bin/env python3

import requests
import json
import sys

def test_advanced_analytics():
    """Test the Advanced Analytics endpoints"""
    base_url = "https://9fc18cff-1249-43ae-83c1-4c2499a8c5c3.preview.emergentagent.com"
    
    # Admin credentials
    admin_credentials = {
        "username": "admin",
        "password": "Kiki1999@"
    }
    
    print("🔍 Testing Advanced Analytics Backend Endpoints")
    print("=" * 60)
    
    # Step 1: Admin Login
    print("\n1. Testing admin login...")
    response = requests.post(f"{base_url}/api/login", json=admin_credentials)
    
    if response.status_code != 200:
        print(f"❌ Admin login failed: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    admin_token = data["token"]
    print("✅ Admin login successful")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Step 2: Test Advanced Dashboard Analytics
    print("\n2. Testing GET /api/admin/analytics/advanced-dashboard...")
    response = requests.get(f"{base_url}/api/admin/analytics/advanced-dashboard", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Advanced dashboard analytics failed: {response.status_code} - {response.text}")
        return False
    
    dashboard_data = response.json()
    
    # Verify required fields
    required_fields = ["registration_trends", "tournament_participation", "revenue_by_category", 
                      "geographic_distribution", "performance_kpis"]
    
    for field in required_fields:
        if field not in dashboard_data:
            print(f"❌ Missing required field: {field}")
            return False
    
    print("✅ Advanced dashboard analytics endpoint working")
    print(f"   - Registration trends: {len(dashboard_data['registration_trends'])} data points")
    print(f"   - Tournament participation: {len(dashboard_data['tournament_participation'])} tournaments")
    print(f"   - Revenue categories: {len(dashboard_data['revenue_by_category'])} categories")
    print(f"   - Geographic distribution: {len(dashboard_data['geographic_distribution'])} countries")
    
    # Check performance KPIs
    kpis = dashboard_data['performance_kpis']
    print(f"   - Performance KPIs:")
    print(f"     * Total Users: {kpis.get('total_users', 0)}")
    print(f"     * Active Users (30d): {kpis.get('active_users_last_30_days', 0)}")
    print(f"     * Total Tournaments: {kpis.get('total_tournaments', 0)}")
    print(f"     * Total Revenue: €{kpis.get('total_revenue', 0)}")
    print(f"     * Total Affiliates: {kpis.get('total_affiliates', 0)}")
    
    # Step 3: Test Engagement Metrics
    print("\n3. Testing GET /api/admin/analytics/engagement-metrics...")
    response = requests.get(f"{base_url}/api/admin/analytics/engagement-metrics", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Engagement metrics failed: {response.status_code} - {response.text}")
        return False
    
    engagement_data = response.json()
    
    # Verify required fields
    required_fields = ["daily_active_users", "tournament_success_rates", "affiliate_conversion_funnel",
                      "financial_performance", "retention_analytics"]
    
    for field in required_fields:
        if field not in engagement_data:
            print(f"❌ Missing required field: {field}")
            return False
    
    print("✅ Engagement metrics endpoint working")
    print(f"   - Daily active users: {len(engagement_data['daily_active_users'])} days")
    print(f"   - Tournament success rates: {len(engagement_data['tournament_success_rates'])} tournaments")
    
    # Check affiliate conversion funnel
    funnel = engagement_data['affiliate_conversion_funnel']
    print(f"   - Affiliate conversion funnel:")
    print(f"     * Total Referrals: {funnel.get('total_referrals', 0)}")
    print(f"     * Active Referrals: {funnel.get('active_referrals', 0)}")
    print(f"     * Referral to Active Rate: {funnel.get('referral_to_active_rate', 0):.2f}%")
    
    # Check financial performance
    financial = engagement_data['financial_performance']
    print(f"   - Financial performance:")
    print(f"     * Total Entry Fees: €{financial.get('total_entry_fees', 0)}")
    print(f"     * Platform Revenue: €{financial.get('platform_revenue', 0)}")
    print(f"     * Profit Margin: {financial.get('profit_margin', 0):.2f}%")
    
    # Check retention analytics
    retention = engagement_data['retention_analytics']
    print(f"   - Retention analytics:")
    print(f"     * Current Month Active: {retention.get('current_month_active', 0)}")
    print(f"     * Retention Rate: {retention.get('retention_rate', 0):.2f}%")
    print(f"     * Churn Rate: {retention.get('churn_rate', 0):.2f}%")
    
    # Step 4: Test existing analytics endpoints for compatibility
    print("\n4. Testing existing analytics endpoints for compatibility...")
    
    # Test analytics overview
    response = requests.get(f"{base_url}/api/admin/analytics/overview", headers=headers)
    if response.status_code != 200:
        print(f"❌ Analytics overview failed: {response.status_code} - {response.text}")
        return False
    print("   ✅ Analytics overview endpoint working")
    
    # Test analytics users
    response = requests.get(f"{base_url}/api/admin/analytics/users", headers=headers)
    if response.status_code != 200:
        print(f"❌ Analytics users failed: {response.status_code} - {response.text}")
        return False
    print("   ✅ Analytics users endpoint working")
    
    # Test analytics competitions
    response = requests.get(f"{base_url}/api/admin/analytics/competitions", headers=headers)
    if response.status_code != 200:
        print(f"❌ Analytics competitions failed: {response.status_code} - {response.text}")
        return False
    print("   ✅ Analytics competitions endpoint working")
    
    print("\n" + "=" * 60)
    print("🎉 ALL ADVANCED ANALYTICS TESTS PASSED!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_advanced_analytics()
    sys.exit(0 if success else 1)