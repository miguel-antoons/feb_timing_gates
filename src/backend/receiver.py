import os
import sys
import time
import serial
import asyncio
import logging
import threading
from contextlib import asynccontextmanager
from typing import Set, Tuple, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration
SERIAL_PORT = os.getenv("SERIAL_PORT", "COM8")
BAUD_RATE = int(os.getenv("BAUD_RATE", "115200"))

# --- Models ---
class TimingEvent(BaseModel):
    gate_id: int
    gps_s: int
    gps_us: int
    beam: bool
    event_id: int
    timestamp: float

# --- Global State ---
# Using a set for duplicate filtering as per original requirements
# key: (gate_id, event_id)
seen_events: Set[Tuple[int, int]] = set()

# --- Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, event: TimingEvent):
        if not self.active_connections:
            return
            
        message = event.model_dump_json()
        logger.debug(f"Broadcasting: {message}")
        
        # Broadcast to all connected clients
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to client: {e}")
                disconnected.append(connection)
        
        # Cleanup failed connections
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()

# --- Serial Logic ---
class SerialReader:
    def __init__(self, port: str, baudrate: int, loop: asyncio.AbstractEventLoop):
        self.port = port
        self.baudrate = baudrate
        self.loop = loop
        self.running = False
        self.thread = None
        self.ser = None

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._read_loop, daemon=True)
        self.thread.start()
        logger.info(f"Serial reader started on {self.port} @ {self.baudrate}")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        self.close_serial()
        logger.info("Serial reader stopped")

    def close_serial(self):
        if self.ser and self.ser.is_open:
            self.ser.close()
            logger.info("Serial port closed")

    def _read_loop(self):
        # Retry loop for connection
        while self.running:
            try:
                if not self.ser or not self.ser.is_open:
                    logger.info(f"Attempting to connect to {self.port}...")
                    self.ser = serial.Serial(self.port, self.baudrate, timeout=1.0)
                    logger.info(f"Connected to {self.port}")

                while self.running and self.ser and self.ser.is_open:
                    try:
                        line = self.ser.readline()
                        if not line:
                            continue
                            
                        decoded_line = line.decode('utf-8', errors='ignore').strip()
                        if not decoded_line:
                            continue
                            
                        self._process_line(decoded_line)
                        
                    except serial.SerialException as e:
                        logger.error(f"Serial read error: {e}")
                        self.close_serial()
                        break 
                    except Exception as e:
                        logger.error(f"Unexpected error in read loop: {e}")
            
            except serial.SerialException as e:
                logger.error(f"Connection failed: {e}. Retrying in 5 seconds...")
                time.sleep(5)
            except Exception as e:
                logger.error(f"Unexpected error in connection loop: {e}")
                time.sleep(5)

    def _process_line(self, line: str):
        # Format: gate_id,gps_s,gps_us,beam,event_id
        # Example: 1,1708081234,123456,1,42
        try:
            parts = line.split(',')
            if len(parts) != 5:
                logger.warning(f"Invalid line format (wrong parts count): {line}")
                return

            gate_id = int(parts[0])
            gps_s = int(parts[1])
            gps_us = int(parts[2])
            beam = bool(int(parts[3]))
            event_id = int(parts[4])

            # Duplicate check
            key = (gate_id, event_id)
            if key in seen_events:
                logger.debug(f"Duplicate event ignored: {key}")
                return
            
            seen_events.add(key)
            
            # Create timestamp
            timestamp = float(gps_s) + (float(gps_us) / 1_000_000.0)
            
            event = TimingEvent(
                gate_id=gate_id,
                gps_s=gps_s,
                gps_us=gps_us,
                beam=beam,
                event_id=event_id,
                timestamp=timestamp
            )

            logger.info(f"New Event: {event}")
            
            # Schedule broadcast in the main event loop
            if self.loop and self.loop.is_running():
                asyncio.run_coroutine_threadsafe(manager.broadcast(event), self.loop)

        except ValueError as e:
            logger.warning(f"Parse error for line '{line}': {e}")
        except Exception as e:
            logger.error(f"Error processing line '{line}': {e}")

# ... (imports already at top, adding contextlib there separately)
# checking imports via view_file would be safer but let's just fix the block structure first.

# --- Global State ---
# ... (seen_events)

# --- Connection Manager ---
# ... (ConnectionManager)

# ... (SerialReader)

#Reference to the serial reader
reader: SerialReader = None

# --- FastAPI App ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Timing Server...")
    global reader
    try:
        loop = asyncio.get_running_loop()
        reader = SerialReader(SERIAL_PORT, BAUD_RATE, loop)
        reader.start()
    except Exception as e:
        logger.error(f"Failed to start serial reader: {e}")
        
    yield
    # Shutdown
    logger.info("Shutting down Timing Server...")
    if reader:
        reader.stop()

app = FastAPI(title="Timing Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws/timing")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, maybe handle client messages if needed
            # For now just wait for disconnection
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# --- Simulation Endpoint ---
class SimulateRequest(BaseModel):
    raw_line: str = None
    event: TimingEvent = None

@app.post("/api/simulate")
async def simulate_event(req: SimulateRequest):
    """
    Simulate an event for testing.
    Can accept either a raw CSV string ('raw_line') OR a structured event object ('event').
    """
    if req.raw_line:
        # Simulate as if coming from serial
        if reader:
            reader._process_line(req.raw_line)
        return {"status": "processed raw line"}
    
    if req.event:
        # Direct broadcast bypass
        await manager.broadcast(req.event)
        # Also simulate "seeing" it to prevent replay if sent again?
        seen_events.add((req.event.gate_id, req.event.event_id))
        return {"status": "broadcasted event"}
        
    return {"error": "Provide raw_line or event"}

if __name__ == "__main__":
    import uvicorn
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000)