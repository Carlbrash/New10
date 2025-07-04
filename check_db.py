from pymongo import MongoClient
import json
from bson import ObjectId
from datetime import datetime

# Custom JSON encoder to handle ObjectId and datetime
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client['betting_federation']

# Check team_invitations collection
invitations = list(db.team_invitations.find({}))
print(f'Found {len(invitations)} invitations')
for inv in invitations:
    print(f'Invitation: {json.dumps(inv, cls=CustomJSONEncoder)}')

# Check teams collection
teams = list(db.teams.find({}))
print(f'\nFound {len(teams)} teams')
for team in teams:
    print(f'Team: {json.dumps(team, cls=CustomJSONEncoder)}')

# Check team_members collection
members = list(db.team_members.find({}))
print(f'\nFound {len(members)} team members')
for member in members:
    print(f'Member: {json.dumps(member, cls=CustomJSONEncoder)}')