#!/usr/bin/env python3
"""
League of Legends Live Client Data Collector
Collects player data from the League client and sends it to MongoDB
"""

import requests
import time
import json
import sys
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import ssl
import urllib3
from typing import Dict, Any, Optional

# Disable SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class LeagueDataCollector:
    def __init__(self, mongodb_uri: str, match_id: str):
        self.mongodb_uri = mongodb_uri
        self.match_id = match_id
        self.api_url = "https://127.0.0.1:2999/liveclientdata/activeplayer"
        self.session = requests.Session()
        self.session.verify = False  # Ignore SSL certificate verification
        
        # MongoDB connection
        self.mongo_client = None
        self.db = None
        self.collection = None
        
    def connect_to_mongodb(self) -> bool:
        """Connect to MongoDB and initialize collection"""
        try:
            self.mongo_client = MongoClient(
                self.mongodb_uri,
                serverSelectionTimeoutMS=5000,
                ssl=True,
                ssl_cert_reqs=ssl.CERT_NONE
            )
            # Test connection
            self.mongo_client.admin.command('ping')
            self.db = self.mongo_client.get_default_database()
            self.collection = self.db.playerLiveInfo
            print(f"✅ Connected to MongoDB successfully")
            return True
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error connecting to MongoDB: {e}")
            return False
    
    def fetch_league_data(self) -> Optional[Dict[str, Any]]:
        """Fetch data from League Client API"""
        try:
            response = self.session.get(self.api_url, timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"⚠️  League API returned status {response.status_code}")
                return None
        except requests.exceptions.ConnectionError:
            print("⚠️  League client not running or API not available")
            return None
        except requests.exceptions.Timeout:
            print("⚠️  Request timeout - League client may be busy")
            return None
        except Exception as e:
            print(f"⚠️  Error fetching League data: {e}")
            return None
    
    def extract_player_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and format player data"""
        payload = {
            "riotId": data.get("riotId"),
            "riotIdGameName": data.get("riotIdGameName"),
            "riotIdTagLine": data.get("riotIdTagLine"),
            "summonerName": data.get("summonerName"),
            "currentGold": data.get("currentGold"),
            "championStats": data.get("championStats"),
            "timestamp": int(time.time()),
            "matchId": self.match_id
        }
        return payload
    
    def update_player_data(self, payload: Dict[str, Any]) -> bool:
        """Update player data in MongoDB (upsert by riotId and matchId)"""
        try:
            if not payload.get("riotId"):
                print("⚠️  No riotId found in payload, skipping update")
                return False
            
            # Create filter for upsert
            filter_query = {
                "riotId": payload["riotId"],
                "matchId": self.match_id
            }
            
            # Update document, create if doesn't exist
            result = self.collection.replace_one(
                filter_query,
                payload,
                upsert=True
            )
            
            if result.upserted_id:
                print(f"✅ Created new player data for {payload.get('summonerName', 'Unknown')}")
            else:
                print(f"🔄 Updated player data for {payload.get('summonerName', 'Unknown')}")
            return True
            
        except Exception as e:
            print(f"❌ Error updating MongoDB: {e}")
            return False
    
    def run_collection_loop(self):
        """Main collection loop - runs every 1 second"""
        print(f"🚀 Starting data collection for match: {self.match_id}")
        print("📊 Collecting data every 1 second...")
        print("Press Ctrl+C to stop")
        
        consecutive_errors = 0
        max_consecutive_errors = 10
        
        try:
            while True:
                # Fetch data from League client
                league_data = self.fetch_league_data()
                
                if league_data:
                    # Extract and format data
                    player_data = self.extract_player_data(league_data)
                    
                    # Update MongoDB
                    if self.update_player_data(player_data):
                        consecutive_errors = 0
                    else:
                        consecutive_errors += 1
                else:
                    consecutive_errors += 1
                
                # If too many consecutive errors, check MongoDB connection
                if consecutive_errors >= max_consecutive_errors:
                    print("⚠️  Too many consecutive errors, checking MongoDB connection...")
                    if not self.connect_to_mongodb():
                        print("❌ MongoDB connection lost, exiting...")
                        break
                    consecutive_errors = 0
                
                # Wait 1 second before next collection
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n🛑 Collection stopped by user")
        except Exception as e:
            print(f"❌ Unexpected error in collection loop: {e}")
        finally:
            if self.mongo_client:
                self.mongo_client.close()
                print("🔌 MongoDB connection closed")

def main():
    """Main function"""
    print("🎮 League of Legends Live Data Collector")
    print("=" * 50)
    
    # Get match ID from user
    if len(sys.argv) > 1:
        match_id = sys.argv[1]
    else:
        match_id = input("Enter Match ID: ").strip()
        if not match_id:
            print("❌ Match ID is required")
            sys.exit(1)
    
    # Set MongoDB URI Yourself, this is for the build script to work
    mongodb_uri = ""
    
    if not mongodb_uri:
        print("❌ MongoDB URI is required")
        sys.exit(1)
    
    # Create collector instance
    collector = LeagueDataCollector(mongodb_uri, match_id)
    
    # Connect to MongoDB
    if not collector.connect_to_mongodb():
        print("❌ Failed to connect to MongoDB, exiting...")
        sys.exit(1)
    
    # Start collection loop
    collector.run_collection_loop()

if __name__ == "__main__":
    main()
