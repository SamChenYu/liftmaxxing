from pydantic import BaseModel, ConfigDict
from datetime import datetime

class TrainEntry(BaseModel): 
    model_config = ConfigDict(extra="ignore")
    vehicleId: int              # e.g. 20260616736886
    lineId: str                 # e.g. elizabeth
    platformName: str           # e.g. B
    expectedArrival: datetime   # e.g. 2026-06-01T22:09:00Z
    timeToLive: datetime        # e.g. 2026-06-01T22:09:00Z
    timeToStation: int          # e.g. 1504 (seconds)

class StationEntry:
    next = {}                   # TrainEntry
    last = {}                   # TrainEntry
