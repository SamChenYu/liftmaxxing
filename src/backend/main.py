# - Browser: just go to http://127.0.0.1:8000/health — works for any GET endpoint
# - FastAPI auto-docs: go to http://127.0.0.1:8000/docs — FastAPI generates an interactive Swagger UI where you can try every endpoint with a button click. This is one of its best features.
# - curl: curl http://127.0.0.1:8000/arrivals/elizabeth from another terminal

import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

load_dotenv()

app = FastAPI(title="Liftmaxxing API")

TFL_BASE_URL = "https://api.tfl.gov.uk"
TFL_APP_KEY = os.getenv("UNIFIED_PRIMARY_KEY", "")

ELIZABETH_LINE_NAPTAN = "910GWCHAPXR"
OVERGROUND_NAPTAN = "910GWCHAPEL"


async def fetch_arrivals(naptan_id: str) -> list[dict]:
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
        return resp.json()

@app.get("/")
async def landing():
    return {"status": "Hello, World!"}

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/arrivals/elizabeth")
async def elizabeth_arrivals():
    return await fetch_arrivals(ELIZABETH_LINE_NAPTAN)


@app.get("/arrivals/overground")
async def overground_arrivals():
    return await fetch_arrivals(OVERGROUND_NAPTAN)
