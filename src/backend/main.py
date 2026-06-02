import asyncio
from fastapi import FastAPI
from collections import deque
from src.backend.models import TrainEntry
from src.backend.tfl import fetch_arrivals
from src.backend.poll import poll

app = FastAPI(title="Liftmaxxing API")

arrivals_buffer = deque(maxlen = 10) # ping every 30 seconds, hold up to 5 responses

ELIZABETH_LINE_NAPTAN = "910GWCHAPXR"
OVERGROUND_NAPTAN = "910GWCHAPEL"
DISTRICTHAMMERSMITH_NAPTAN = "940GZZLUWPL"

@app.on_event("startup")
async def startup():
    asyncio.create_task(poll())

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

@app.get("/arrivals/district-hammersmith")
async def district_hammersmith_arrivals():
    return await fetch_arrivals(DISTRICTHAMMERSMITH_NAPTAN)