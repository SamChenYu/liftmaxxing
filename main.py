import urllib.request, json
from dotenv import load_dotenv
import os


def main():

    load_dotenv()
    TFL_API_KEY = os.getenv("TFL_API_KEY")

    if TFL_API_KEY is None:
        print("TFL API KEY IS MISSING")
        return

    line = "D"
    station = "WPL"

    request_url = f"https://api.tfl.gov.uk/trackernet/PredictionDetailed/{line}/{station}"

    try:
        url = request_url

        hdr = {
            'app_key': '',
        }

        req = urllib.request.Request(url, headers=hdr)

        req.get_method = lambda: 'GET'
        response = urllib.request.urlopen(req)
        print(response.getcode())
        print(response.read())
    except Exception as e:
        print(e)

if __name__ == "__main__":
    main()

