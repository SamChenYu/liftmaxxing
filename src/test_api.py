import urllib.request, json, ssl
from dotenv import load_dotenv
import certifi
import os


STOPS = [
    ("Elizabeth line", "910GWCHAPXR", {"Elizabeth line"}),
    ("Overground (Windrush)", "910GWCHAPEL", {"Windrush"}),
    ("District / H&C", "940GZZLUWPL", {"District", "Hammersmith & City"}),
]


def fetch_arrivals(stop_id, api_key, ssl_context):
    url = f"https://api.tfl.gov.uk/StopPoint/{stop_id}/Arrivals?app_key={api_key}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    response = urllib.request.urlopen(req, context=ssl_context, timeout=10)
    data = json.loads(response.read().decode("utf-8"))
    data.sort(key=lambda x: x["timeToStation"])
    return data


def main():
    load_dotenv()
    TFL_API_KEY = os.getenv("UNIFIED_PRIMARY_KEY")

    if TFL_API_KEY is None:
        print("API KEY IS MISSING")
        return

    ssl_context = ssl.create_default_context(cafile=certifi.where())

    for label, stop_id, line_filter in STOPS:
        print(f"\n=== {label} ===")
        try:
            arrivals = fetch_arrivals(stop_id, TFL_API_KEY, ssl_context)
            arrivals = [a for a in arrivals if a["lineName"] in line_filter]
            if not arrivals:
                print("  No upcoming arrivals")
                continue
            for train in arrivals:
                mins = train["timeToStation"] // 60
                print(f"  {train['lineName']} to {train['destinationName']} - {mins} min ({train['platformName']})")
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    main()

