import asyncio
from fastapi import FastAPI, HTTPException, Request
import json
from pathlib import Path

from backend.poll import poll, get_elizabeth_arrivals_api, get_overground_arrivals_api, get_district_hammersmith_arrivals_api, get_last_next_trains

app = FastAPI(title="Liftmaxxing API")
data_collection_file = Path("data.json")

@app.on_event("startup")
async def startup():
    
    if not data_collection_file.exists():
            data_collection_file.write_text("[]")

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

@app.post("/api/data")
async def data(request: Request):
     
    payload = await request.json()

    if not data_collection_file.exists():
        data_collection_file.write_text("[]")

    with data_collection_file.open("r") as file:
         data = json.load(file)

    data.append(payload)
    data.append((await get_last_next_trains()).model_dump(mode="json"))
    tmp_file = data_collection_file.with_suffix(".tmp")

    with tmp_file.open("w") as file:
        json.dump(data, file, indent=2)

    tmp_file.replace(data_collection_file)

    return {"status": "ok"}



@app.get("/debug/elizabeth")
async def elizabeth():
    return await get_elizabeth_arrivals_api()

@app.get("/debug/overground")
async def overground():
    return await get_overground_arrivals_api()

@app.get("/debug/district-hammersmith")
async def district_hammersmith():
    return await get_district_hammersmith_arrivals_api()