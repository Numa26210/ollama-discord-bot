"""
API Testing with examples
Test all endpoints with sample data
"""
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Any

BASE_URL = "http://localhost:8000"


class DiscordBotAPIClient:
    """Client for testing Discord Bot API"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
    
    def _print_response(self, method: str, endpoint: str, response: requests.Response):
        """Pretty print API response"""
        print(f"\n{'='*60}")
        print(f"{method} {self.base_url}{endpoint}")
        print(f"Status: {response.status_code}")
        print("-" * 60)
        try:
            print(json.dumps(response.json(), indent=2, default=str))
        except:
            print(response.text)
        print('=' * 60)
    
    def test_health(self):
        """Test health check endpoint"""
        print("\n🏥 Testing Health Check...")
        response = self.session.get(f"{self.base_url}/health")
        self._print_response("GET", "/health", response)
        return response.status_code == 200
    
    def test_root(self):
        """Test root endpoint"""
        print("\n🏠 Testing Root Endpoint...")
        response = self.session.get(f"{self.base_url}/")
        self._print_response("GET", "/", response)
        return response.status_code == 200
    
    def get_overview_stats(self, server_id: str, days: int = 30) -> bool:
        """Test overview stats endpoint"""
        print(f"\n📊 Fetching Overview Stats (server={server_id}, days={days})...")
        endpoint = f"/api/servers/{server_id}/stats/overview?days={days}"
        response = self.session.get(f"{self.base_url}{endpoint}")
        self._print_response("GET", endpoint, response)
        return response.status_code == 200
    
    def get_daily_volumes(self, server_id: str, days: int = 30) -> bool:
        """Test daily volumes endpoint"""
        print(f"\n📈 Fetching Daily Volumes (server={server_id}, days={days})...")
        endpoint = f"/api/servers/{server_id}/stats/daily-volumes?days={days}"
        response = self.session.get(f"{self.base_url}{endpoint}")
        self._print_response("GET", endpoint, response)
        return response.status_code == 200
    
    def get_leaderboards(self, server_id: str, limit: int = 5) -> bool:
        """Test leaderboards endpoint"""
        print(f"\n🏆 Fetching Leaderboards (server={server_id}, limit={limit})...")
        endpoint = f"/api/servers/{server_id}/stats/leaderboards?limit={limit}"
        response = self.session.get(f"{self.base_url}{endpoint}")
        self._print_response("GET", endpoint, response)
        return response.status_code == 200
    
    def toggle_bot(self, server_id: str, is_active: bool) -> bool:
        """Test bot toggle endpoint"""
        print(f"\n🤖 Toggling Bot (server={server_id}, active={is_active})...")
        endpoint = "/api/bot/toggle"
        payload = {
            "server_id": server_id,
            "is_active": is_active
        }
        response = self.session.post(
            f"{self.base_url}{endpoint}",
            json=payload
        )
        self._print_response("POST", endpoint, response)
        return response.status_code == 200
    
    def get_bot_status(self, server_id: str) -> bool:
        """Test bot status endpoint"""
        print(f"\n🔍 Checking Bot Status (server={server_id})...")
        endpoint = f"/api/bot/status/{server_id}"
        response = self.session.get(f"{self.base_url}{endpoint}")
        self._print_response("GET", endpoint, response)
        return response.status_code == 200


def run_all_tests():
    """Run all API tests"""
    client = DiscordBotAPIClient()
    
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║       🚀 Discord Bot API - Complete Test Suite             ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    results = {}
    
    # Health checks
    print("\n" + "="*60)
    print("🔧 BASIC TESTS")
    print("="*60)
    results["health"] = client.test_health()
    results["root"] = client.test_root()
    
    # Server stats (with sample server ID)
    server_id = "123456789"  # Sample Discord server ID
    
    print("\n" + "="*60)
    print("📊 STATISTICS ENDPOINTS")
    print("="*60)
    
    # Note: These will return 404 if no data exists, which is expected
    results["overview_stats"] = client.get_overview_stats(server_id)
    results["daily_volumes"] = client.get_daily_volumes(server_id, days=30)
    results["leaderboards"] = client.get_leaderboards(server_id, limit=5)
    
    # Bot management
    print("\n" + "="*60)
    print("🤖 BOT MANAGEMENT ENDPOINTS")
    print("="*60)
    results["toggle_on"] = client.toggle_bot(server_id, is_active=True)
    results["get_status"] = client.get_bot_status(server_id)
    results["toggle_off"] = client.toggle_bot(server_id, is_active=False)
    
    # Summary
    print("\n" + "="*60)
    print("📋 TEST SUMMARY")
    print("="*60)
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} - {test_name}")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    print(f"\nTotal: {passed}/{total} tests passed")
    print("\n" + "="*60)


def setup_sample_data():
    """
    Helper function to populate sample data
    Run this to create test data in the database
    """
    print("\n⚠️  This would require direct db access (not implemented yet)")
    print("For now, use the db_usage_examples.py script in backend/")


if __name__ == "__main__":
    import sys
    
    try:
        # Check if server is running
        print("🔌 Connecting to API server...")
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        if response.status_code != 200:
            print(f"❌ API server not responding properly")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to API server at {BASE_URL}")
        print("\n💡 Make sure the server is running:")
        print("   cd backend")
        print("   python run.py")
        sys.exit(1)
    
    # Run all tests
    run_all_tests()
