import requests
from datetime import datetime
import time

response = requests.get("https://timeapi.io/api/Time/current/zone?timeZone=UTC")
time_data = response.json()
# Convert the datetime string to a datetime object
api_time = datetime.fromisoformat(time_data["dateTime"])
# Convert the datetime object to a Unix timestamp
timestamp = int(api_time.timestamp())

print(timestamp)
