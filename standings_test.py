import requests
import unittest
import sys

class DetailedStandingsAPITester(unittest.TestCase):
    """Test Detailed Standings API endpoints"""
    
    def __init__(self, *args, **kwargs):
        super(DetailedStandingsAPITester, self).__init__(*args, **kwargs)
        self.base_url = "https://49f63d92-acd8-4e16-a4be-50baa0fb091a.preview.emergentagent.com"
    
    def test_01_get_standings_countries(self):
        """Test GET /api/standings/countries - Should return list of available countries with names and flag emojis"""
        print("\n🔍 Testing GET /api/standings/countries endpoint...")
        
        response = requests.get(f"{self.base_url}/api/standings/countries")
        self.assertEqual(response.status_code, 200, f"Countries request failed: {response.text}")
        
        data = response.json()
        
        # Verify response structure
        self.assertIn("countries", data, "Response should contain 'countries' field")
        countries = data["countries"]
        self.assertIsInstance(countries, list, "Countries should be a list")
        self.assertGreater(len(countries), 0, "Should have at least one country")
        
        # Expected countries from the implementation
        expected_countries = ["Greece", "Italy", "Germany", "England", "Spain", "France"]
        found_countries = [country["name"] for country in countries]
        
        # Verify all expected countries are present
        for expected in expected_countries:
            self.assertIn(expected, found_countries, f"Expected country '{expected}' not found")
        
        # Verify each country has required fields
        for country in countries:
            self.assertIn("name", country, "Country should have 'name' field")
            self.assertIn("flag", country, "Country should have 'flag' field")
            self.assertIsInstance(country["name"], str, "Country name should be string")
            self.assertIsInstance(country["flag"], str, "Country flag should be string")
            
            print(f"  ✅ Country: {country['name']} {country['flag']}")
        
        print(f"✅ GET /api/standings/countries endpoint test passed - Found {len(countries)} countries")
    
    def test_02_get_england_standings(self):
        """Test GET /api/standings/England - Should return comprehensive England league data"""
        print("\n🔍 Testing GET /api/standings/England endpoint...")
        
        response = requests.get(f"{self.base_url}/api/standings/England")
        self.assertEqual(response.status_code, 200, f"England standings request failed: {response.text}")
        
        data = response.json()
        
        # Verify England has premier league data
        self.assertIn("premier", data, "England should have 'premier' league data")
        premier_data = data["premier"]
        
        # Verify league structure
        required_fields = ["name", "season", "rounds", "standings", "playerStats"]
        for field in required_fields:
            self.assertIn(field, premier_data, f"Premier league should have '{field}' field")
        
        # Verify league name and season
        self.assertEqual(premier_data["name"], "England Premier League")
        self.assertEqual(premier_data["season"], "2025/2026")
        
        # Test fixture data includes live matches with liveMinute field
        rounds = premier_data["rounds"]
        self.assertIsInstance(rounds, list, "Rounds should be a list")
        self.assertGreater(len(rounds), 0, "Should have at least one round")
        
        # Check matches in first round
        first_round = rounds[0]
        self.assertIn("round", first_round, "Round should have 'round' field")
        self.assertIn("matches", first_round, "Round should have 'matches' field")
        
        matches = first_round["matches"]
        self.assertIsInstance(matches, list, "Matches should be a list")
        self.assertGreater(len(matches), 0, "Should have at least one match")
        
        # Verify match structure and find live matches
        live_matches_found = 0
        finished_matches_found = 0
        upcoming_matches_found = 0
        
        for match in matches:
            required_match_fields = ["date", "time", "homeTeam", "awayTeam", "status"]
            for field in required_match_fields:
                self.assertIn(field, match, f"Match should have '{field}' field")
            
            # Check status values
            status = match["status"]
            self.assertIn(status, ["FIN", "LIVE", "UP"], f"Invalid match status: {status}")
            
            if status == "LIVE":
                live_matches_found += 1
                self.assertIn("liveMinute", match, "Live matches should have 'liveMinute' field")
                self.assertIsInstance(match["liveMinute"], str, "liveMinute should be string")
                print(f"  ✅ Live match found: {match['homeTeam']} vs {match['awayTeam']} - {match['liveMinute']}'")
            elif status == "FIN":
                finished_matches_found += 1
                self.assertIn("homeScore", match, "Finished matches should have 'homeScore'")
                self.assertIn("awayScore", match, "Finished matches should have 'awayScore'")
                self.assertIsInstance(match["homeScore"], int, "homeScore should be integer")
                self.assertIsInstance(match["awayScore"], int, "awayScore should be integer")
                print(f"  ✅ Finished match: {match['homeTeam']} {match['homeScore']}-{match['awayScore']} {match['awayTeam']}")
            elif status == "UP":
                upcoming_matches_found += 1
                print(f"  ✅ Upcoming match: {match['homeTeam']} vs {match['awayTeam']}")
        
        print(f"  Match summary: {live_matches_found} live, {finished_matches_found} finished, {upcoming_matches_found} upcoming")
        
        # Verify standings table has proper team statistics
        standings = premier_data["standings"]
        self.assertIsInstance(standings, list, "Standings should be a list")
        self.assertGreater(len(standings), 0, "Should have at least one team in standings")
        
        # Check standings structure
        for i, team in enumerate(standings):
            required_standing_fields = ["pos", "team", "pl", "w", "d", "l", "gf", "ga", "gd", "pts", "form"]
            for field in required_standing_fields:
                self.assertIn(field, team, f"Standing should have '{field}' field")
            
            # Verify data types
            self.assertIsInstance(team["pos"], int, "Position should be integer")
            self.assertIsInstance(team["team"], str, "Team name should be string")
            self.assertIsInstance(team["pl"], int, "Played should be integer")
            self.assertIsInstance(team["w"], int, "Wins should be integer")
            self.assertIsInstance(team["d"], int, "Draws should be integer")
            self.assertIsInstance(team["l"], int, "Losses should be integer")
            self.assertIsInstance(team["pts"], int, "Points should be integer")
            self.assertIsInstance(team["form"], list, "Form should be list")
            
            # Verify position order
            self.assertEqual(team["pos"], i + 1, f"Position should be {i + 1} for team at index {i}")
            
            if i < 3:  # Print first 3 teams
                print(f"  ✅ {team['pos']}. {team['team']} - {team['pts']} pts ({team['w']}W {team['d']}D {team['l']}L)")
        
        # Check player statistics include goals, assists, minutes, cards
        player_stats = premier_data["playerStats"]
        self.assertIsInstance(player_stats, list, "Player stats should be a list")
        self.assertGreater(len(player_stats), 0, "Should have at least one player stat")
        
        for i, player in enumerate(player_stats):
            required_player_fields = ["rank", "player", "team", "goals", "assists", "yellowCards", "redCards", "minutes"]
            for field in required_player_fields:
                self.assertIn(field, player, f"Player stat should have '{field}' field")
            
            # Verify data types
            self.assertIsInstance(player["rank"], int, "Rank should be integer")
            self.assertIsInstance(player["player"], str, "Player name should be string")
            self.assertIsInstance(player["team"], str, "Team should be string")
            self.assertIsInstance(player["goals"], int, "Goals should be integer")
            self.assertIsInstance(player["assists"], int, "Assists should be integer")
            self.assertIsInstance(player["yellowCards"], int, "Yellow cards should be integer")
            self.assertIsInstance(player["redCards"], int, "Red cards should be integer")
            self.assertIsInstance(player["minutes"], int, "Minutes should be integer")
            
            # Verify rank order
            self.assertEqual(player["rank"], i + 1, f"Rank should be {i + 1} for player at index {i}")
            
            if i < 3:  # Print first 3 players
                print(f"  ✅ {player['rank']}. {player['player']} ({player['team']}) - {player['goals']}G {player['assists']}A")
        
        print("✅ GET /api/standings/England endpoint test passed - Comprehensive data structure verified")
    
    def test_03_get_greece_standings(self):
        """Test GET /api/standings/Greece - Should return Greece Super League data"""
        print("\n🔍 Testing GET /api/standings/Greece endpoint...")
        
        response = requests.get(f"{self.base_url}/api/standings/Greece")
        self.assertEqual(response.status_code, 200, f"Greece standings request failed: {response.text}")
        
        data = response.json()
        
        # Verify Greece has premier league data (Super League)
        self.assertIn("premier", data, "Greece should have 'premier' league data")
        premier_data = data["premier"]
        
        # Verify league name is Greece Super League
        self.assertEqual(premier_data["name"], "Greece Super League")
        self.assertEqual(premier_data["season"], "2025/2026")
        
        # Verify different league structure and teams compared to England
        standings = premier_data["standings"]
        self.assertIsInstance(standings, list, "Standings should be a list")
        
        # Check for Greek teams
        greek_teams = [team["team"] for team in standings]
        expected_greek_teams = ["Olympiakos", "AEK Athens", "PAOK", "Panathinaikos"]
        
        for expected_team in expected_greek_teams:
            self.assertIn(expected_team, greek_teams, f"Expected Greek team '{expected_team}' not found")
            print(f"  ✅ Greek team found: {expected_team}")
        
        # Verify matches include Greek teams
        rounds = premier_data["rounds"]
        matches = rounds[0]["matches"]
        
        greek_match_found = False
        for match in matches:
            if any(team in match["homeTeam"] or team in match["awayTeam"] for team in expected_greek_teams):
                greek_match_found = True
                print(f"  ✅ Greek match: {match['homeTeam']} vs {match['awayTeam']} ({match['status']})")
        
        self.assertTrue(greek_match_found, "Should find at least one match with Greek teams")
        
        # Verify player stats include Greek players
        player_stats = premier_data["playerStats"]
        greek_players = [player["player"] for player in player_stats]
        expected_greek_players = ["Kostas Fortounis", "Giorgos Giakoumakis", "Andraz Sporar"]
        
        for expected_player in expected_greek_players:
            self.assertIn(expected_player, greek_players, f"Expected Greek player '{expected_player}' not found")
            print(f"  ✅ Greek player found: {expected_player}")
        
        print("✅ GET /api/standings/Greece endpoint test passed - Greek league data verified")
    
    def test_04_get_england_premier_specific(self):
        """Test GET /api/standings/England/premier - Should return specific Premier League data"""
        print("\n🔍 Testing GET /api/standings/England/premier endpoint...")
        
        response = requests.get(f"{self.base_url}/api/standings/England/premier")
        self.assertEqual(response.status_code, 200, f"England premier request failed: {response.text}")
        
        data = response.json()
        
        # This should return the same data as England endpoint but filtered to just premier league
        # Verify it has the same structure as the premier league from England endpoint
        required_fields = ["name", "season", "rounds", "standings", "playerStats"]
        for field in required_fields:
            self.assertIn(field, data, f"Premier league should have '{field}' field")
        
        # Verify it's specifically Premier League data
        self.assertEqual(data["name"], "England Premier League")
        self.assertEqual(data["season"], "2025/2026")
        
        # Verify standings data
        standings = data["standings"]
        self.assertIsInstance(standings, list, "Standings should be a list")
        self.assertGreater(len(standings), 0, "Should have teams in standings")
        
        # Check for English Premier League teams
        english_teams = [team["team"] for team in standings]
        expected_english_teams = ["Liverpool", "Aston Villa", "Brighton", "Tottenham"]
        
        for expected_team in expected_english_teams:
            self.assertIn(expected_team, english_teams, f"Expected English team '{expected_team}' not found")
        
        print(f"  ✅ Found {len(standings)} teams in Premier League standings")
        print(f"  ✅ League: {data['name']} ({data['season']})")
        
        print("✅ GET /api/standings/England/premier endpoint test passed - Specific league data verified")
    
    def test_05_error_handling_invalid_country(self):
        """Test invalid country - should return 404"""
        print("\n🔍 Testing error handling for invalid country...")
        
        response = requests.get(f"{self.base_url}/api/standings/InvalidCountry")
        self.assertEqual(response.status_code, 404, "Invalid country should return 404")
        
        data = response.json()
        self.assertIn("detail", data, "Error response should have 'detail' field")
        self.assertEqual(data["detail"], "Country not found")
        
        print("  ✅ Invalid country correctly returns 404 with proper error message")
        print("✅ Invalid country error handling test passed")
    
    def test_06_error_handling_invalid_league(self):
        """Test invalid league - should return 404"""
        print("\n🔍 Testing error handling for invalid league...")
        
        response = requests.get(f"{self.base_url}/api/standings/England/invalidLeague")
        self.assertEqual(response.status_code, 404, "Invalid league should return 404")
        
        data = response.json()
        self.assertIn("detail", data, "Error response should have 'detail' field")
        self.assertEqual(data["detail"], "League not found")
        
        print("  ✅ Invalid league correctly returns 404 with proper error message")
        print("✅ Invalid league error handling test passed")
    
    def test_07_data_structure_validation(self):
        """Test comprehensive data structure validation"""
        print("\n🔍 Testing comprehensive data structure validation...")
        
        # Test multiple countries for data consistency
        countries_to_test = ["England", "Greece", "Italy"]
        
        for country in countries_to_test:
            print(f"  Testing data structure for {country}...")
            response = requests.get(f"{self.base_url}/api/standings/{country}")
            self.assertEqual(response.status_code, 200, f"{country} request failed")
            
            data = response.json()
            premier_data = data["premier"]
            
            # Verify matches have proper status values
            rounds = premier_data["rounds"]
            for round_data in rounds:
                matches = round_data["matches"]
                for match in matches:
                    status = match["status"]
                    self.assertIn(status, ["FIN", "LIVE", "UP"], f"Invalid status '{status}' in {country}")
                    
                    # Check live matches have liveMinute field
                    if status == "LIVE":
                        self.assertIn("liveMinute", match, f"Live match missing liveMinute in {country}")
                        live_minute = match["liveMinute"]
                        self.assertIsInstance(live_minute, str, f"liveMinute should be string in {country}")
                        print(f"    ✅ Live match validated: {match['homeTeam']} vs {match['awayTeam']} - {live_minute}'")
            
            # Confirm standings are properly ordered
            standings = premier_data["standings"]
            for i, team in enumerate(standings):
                expected_pos = i + 1
                actual_pos = team["pos"]
                self.assertEqual(actual_pos, expected_pos, f"Position mismatch in {country}: expected {expected_pos}, got {actual_pos}")
            
            # Validate player stats have all required fields
            player_stats = premier_data["playerStats"]
            for player in player_stats:
                required_fields = ["rank", "player", "team", "goals", "assists", "yellowCards", "redCards", "minutes"]
                for field in required_fields:
                    self.assertIn(field, player, f"Player missing '{field}' field in {country}")
                    
                # Verify numeric fields are non-negative
                numeric_fields = ["goals", "assists", "yellowCards", "redCards", "minutes"]
                for field in numeric_fields:
                    value = player[field]
                    self.assertGreaterEqual(value, 0, f"Player {field} should be non-negative in {country}")
            
            print(f"    ✅ {country} data structure validation passed")
        
        print("✅ Comprehensive data structure validation test passed")
    
    def test_08_no_authentication_required(self):
        """Test that standings endpoints don't require authentication"""
        print("\n🔍 Testing that standings endpoints don't require authentication...")
        
        # Test all endpoints without any authentication headers
        endpoints_to_test = [
            "/api/standings/countries",
            "/api/standings/England",
            "/api/standings/Greece",
            "/api/standings/England/premier"
        ]
        
        for endpoint in endpoints_to_test:
            print(f"  Testing {endpoint} without authentication...")
            response = requests.get(f"{self.base_url}{endpoint}")
            self.assertEqual(response.status_code, 200, f"Endpoint {endpoint} should not require authentication")
            
            # Verify we get valid JSON response
            data = response.json()
            self.assertIsInstance(data, dict, f"Endpoint {endpoint} should return valid JSON")
            
            print(f"    ✅ {endpoint} accessible without authentication")
        
        print("✅ No authentication required test passed")

if __name__ == "__main__":
    # Run the standings tests
    standings_test_suite = unittest.TestSuite()
    standings_test_suite.addTest(DetailedStandingsAPITester('test_01_get_standings_countries'))
    standings_test_suite.addTest(DetailedStandingsAPITester('test_02_get_england_standings'))
    standings_test_suite.addTest(DetailedStandingsAPITester('test_03_get_greece_standings'))
    standings_test_suite.addTest(DetailedStandingsAPITester('test_04_get_england_premier_specific'))
    standings_test_suite.addTest(DetailedStandingsAPITester('test_05_error_handling_invalid_country'))
    standings_test_suite.addTest(DetailedStandingsAPITester('test_06_error_handling_invalid_league'))
    standings_test_suite.addTest(DetailedStandingsAPITester('test_07_data_structure_validation'))
    standings_test_suite.addTest(DetailedStandingsAPITester('test_08_no_authentication_required'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    print("\n" + "=" * 50)
    print("TESTING DETAILED STANDINGS API ENDPOINTS")
    print("=" * 50)
    runner.run(standings_test_suite)