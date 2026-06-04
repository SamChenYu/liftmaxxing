# - Browser: just go to http://127.0.0.1:8000/health — works for any GET endpoint
# - FastAPI auto-docs: go to http://127.0.0.1:8000/docs — FastAPI generates an interactive Swagger UI where you can try every endpoint with a button click. This is one of its best features.
# - curl: curl http://127.0.0.1:8000/arrivals/elizabeth from another terminal


# District Line / Hammersmith
        # Platform 1 - Eastbound
        # Platform 2 - Westbound

# Windrush Line
        # Platform 5 - Northbound (Where the lift is)
        # Platform 6 - Southbound

# Elizabeth Line
        # Platform A - Eastbound
        # Platform B - Westbound

import os
import httpx
from fastapi import HTTPException
from backend.models import TrainEntry
from zoneinfo import ZoneInfo
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

TFL_BASE_URL = "https://api.tfl.gov.uk"
TFL_APP_KEY = os.getenv("UNIFIED_PRIMARY_KEY", "")

async def fetch_arrivals_api(naptan_id: str) -> list[dict]:
    params = {}
    if TFL_APP_KEY:
        params["app_key"] = TFL_APP_KEY
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{TFL_BASE_URL}/StopPoint/{naptan_id}/Arrivals",
            params=params,
            headers={"User-Agent": "liftmaxxing/0.1"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

    # Returns RAW JSON for debugging
    #return resp.json()

    data : list[TrainEntry] = [
        TrainEntry.model_validate(item)
        for item in resp.json()
        if "expectedArrival" in item
    ]

    now = datetime.now(timezone.utc)
    data = [d for d in data if d.timeToLive > now]

    data.sort(key=lambda p: p.timeToStation)

    UK = ZoneInfo("Europe/London")
    for d in data:
        d.expectedArrival = d.expectedArrival.astimezone(UK)#.time()
        d.timeToLive = d.timeToLive.astimezone(UK)#.time()

    return data