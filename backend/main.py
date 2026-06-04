import asyncio
from fastapi import FastAPI, HTTPException

from backend.poll import poll, get_elizabeth_arrivals_api, get_overground_arrivals_api, get_district_hammersmith_arrivals_api, get_last_next_trains

app = FastAPI(title="Liftmaxxing API")

@app.on_event("startup")
async def startup():
    asyncio.create_task(poll())

@app.get("/")
async def landing():
    return {"status": "Hello, World!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

# Main API
@app.get("/liftmax")
async def liftmax():
    data = await get_last_next_trains()
    if data == "empty":
            raise HTTPException(status_code=400, detail="Server has not polled data yet")
    return data


@app.get("/debug/elizabeth")
async def elizabeth():
    return await get_elizabeth_arrivals_api()

@app.get("/debug/overground")
async def overground():
    return await get_overground_arrivals_api()

@app.get("/debug/district-hammersmith")
async def district_hammersmith():
    return await get_district_hammersmith_arrivals_api()