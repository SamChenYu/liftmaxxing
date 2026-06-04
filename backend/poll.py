import asyncio
from backend.tfl import fetch_arrivals_api
from backend.models import StationEntry
from collections import deque
from datetime import datetime


ELIZABETH_LINE_NAPTAN = "910GWCHAPXR"
OVERGROUND_NAPTAN = "910GWCHAPEL"
DISTRICTHAMMERSMITH_NAPTAN = "940GZZLUWPL"

arrivals_buffer = deque(maxlen = 30)    # ping every 30 seconds, hold up to 10 mins data
                                        # contains the next train ONLY for each platform
platform_map = {
    "A": "elizabeth_a",
    "B": "elizabeth_b",
    "Platform 5": "windrush_5",
    "Platform 6": "windrush_6",
    "Eastbound - Platform 1": "dhs_1",
    "Westbound - Platform 2": "dhs_2",
}


async def poll():
    while True:
        await fetch_and_process_arrivals()
        await asyncio.sleep(30)

async def fetch_and_process_arrivals():
    next_entry = {}

    arrivals = await get_elizabeth_arrivals_api()
    arrivals += await get_overground_arrivals_api()
    arrivals += await get_district_hammersmith_arrivals_api()
    
    # list has already been sorted time wise - traverse and just take the next unique station as the next incoming train for this entry
    for entry in arrivals:
        key = platform_map.get(entry.platformName)

        if key and key not in next_entry:
            next_entry[key] = entry

        if len(next_entry) == len(platform_map):
            break

    arrivals_buffer.append(next_entry)


async def get_last_next_trains():
    if len(arrivals_buffer) == 0:
        return "empty"
    
    await fetch_and_process_arrivals() # pre-emptive

    next_snapshot = arrivals_buffer[-1]

    last_snapshot = {}

    for key, latest_train in next_snapshot.items():
        latest_vehicle = latest_train.vehicleId

        # walk backwards to find previous DIFFERENT vehicleId
        prev_train = None

        for snapshot in reversed(list(arrivals_buffer)[:-1]):
            if key in snapshot:
                candidate = snapshot[key]

                if candidate.vehicleId != latest_vehicle:
                    prev_train = candidate
                    break

        if prev_train:
            last_snapshot[key] = prev_train

    station_entry = StationEntry()
    station_entry.next = next_snapshot
    station_entry.last = last_snapshot

    return station_entry


# Including some validation because for some reason the OVERGROUND_NAPTAN sometimes returns elizabeth line entries too? Need them to be sorted for time due to polling function
async def get_elizabeth_arrivals_api():
    elizabeth_arrivals = await fetch_arrivals_api(ELIZABETH_LINE_NAPTAN)
    elizabeth_arrivals = [a for a in elizabeth_arrivals if a.lineId == "elizabeth"]
    return elizabeth_arrivals

async def get_overground_arrivals_api():
    overground_arrivals = await fetch_arrivals_api(OVERGROUND_NAPTAN)
    overground_arrivals = [a for a in overground_arrivals if a.lineId == "windrush"]
    return overground_arrivals

async def get_district_hammersmith_arrivals_api():
    dhs_arrivals = await fetch_arrivals_api(DISTRICTHAMMERSMITH_NAPTAN)
    dhs_arrivals = [a for a in dhs_arrivals if a.lineId == "district" or a.lineId == "hammersmith"]
    return dhs_arrivals