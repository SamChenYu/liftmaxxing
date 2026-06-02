import asyncio

async def poll():
    while True:
        print("Polling...")
        await asyncio.sleep(30)