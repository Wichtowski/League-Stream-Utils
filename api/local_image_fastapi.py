from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Optional
from pathlib import Path
import os
import mimetypes
import time
import threading
import hashlib

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONTENT_TYPES: Dict[str, str] = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml"
}

CACHE_TTL = 30
RESPONSE_CACHE_TTL = 60
MAX_CACHE_SIZE = 100

file_cache: Dict[str, Dict[str, object]] = {}
response_cache: Dict[str, Dict[str, object]] = {}
cache_lock = threading.Lock()

def get_asset_cache_base() -> str:
    asset_cache_path = os.environ.get("ASSET_CACHE_PATH")
    if asset_cache_path:
        return asset_cache_path
    appdata = os.environ.get("APPDATA") or str(Path.home() / "AppData" / "Roaming")
    return str(Path(appdata) / "League Stream Utils" / "assets")

ASSET_CACHE_BASE = get_asset_cache_base()


def check_file_exists(file_path: str) -> Dict[str, object]:
    now = time.time()
    with cache_lock:
        cached = file_cache.get(file_path)
        if cached and (now - cached["timestamp"]) < CACHE_TTL:
            return {"exists": cached["exists"], "stat": cached.get("stat")}
    p = Path(file_path)
    try:
        stat = p.stat()
        result = {"exists": p.is_file(), "stat": stat}
        with cache_lock:
            file_cache[file_path] = {**result, "timestamp": now}
        return result
    except Exception:
        with cache_lock:
            file_cache[file_path] = {"exists": False, "timestamp": now}
        return {"exists": False}

def clean_caches() -> None:
    while True:
        now = time.time()
        with cache_lock:
            for key in list(file_cache.keys()):
                if (now - file_cache[key]["timestamp"]) > CACHE_TTL:
                    del file_cache[key]
            for key in list(response_cache.keys()):
                if (now - response_cache[key]["timestamp"]) > RESPONSE_CACHE_TTL:
                    del response_cache[key]
            if len(response_cache) > MAX_CACHE_SIZE:
                sorted_items = sorted(response_cache.items(), key=lambda x: x[1]["timestamp"])
                for k, _ in sorted_items[:MAX_CACHE_SIZE // 2]:
                    del response_cache[k]
        time.sleep(CACHE_TTL)

threading.Thread(target=clean_caches, daemon=True).start()

def get_etag(stat) -> str:
    return f'"{int(stat.st_mtime * 1000)}"'

@app.get("/local-image")
def get_local_image(path: str, request: Request):
    if not path:
        raise HTTPException(status_code=400, detail="Missing path")
    base = Path(ASSET_CACHE_BASE).resolve()
    safe_path = (base / path).resolve()
    if not str(safe_path).startswith(str(base)):
        raise HTTPException(status_code=400, detail="Invalid path")
    file_info = check_file_exists(str(safe_path))
    if not file_info["exists"]:
        raise HTTPException(status_code=404, detail="Not found")
    stat = file_info["stat"]
    ext = safe_path.suffix.lower()
    content_type = CONTENT_TYPES.get(ext) or mimetypes.guess_type(str(safe_path))[0] or "application/octet-stream"
    etag = get_etag(stat)
    if_none_match = request.headers.get("if-none-match")
    if if_none_match == etag:
        return Response(status_code=304)
    file_size = stat.st_size if stat else 0
    if 0 < file_size < 1024 * 1024:
        with cache_lock:
            cached = response_cache.get(str(safe_path))
            if cached and cached["etag"] == etag:
                return Response(
                    content=cached["data"],
                    media_type=cached["content_type"],
                    headers={
                        "Cache-Control": "public, max-age=31536000, immutable",
                        "ETag": cached["etag"],
                        "Content-Length": str(len(cached["data"]))
                    }
                )
        try:
            data = safe_path.read_bytes()
            with cache_lock:
                response_cache[str(safe_path)] = {
                    "data": data,
                    "content_type": content_type,
                    "etag": etag,
                    "timestamp": time.time()
                }
            return Response(
                content=data,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=31536000, immutable",
                    "ETag": etag,
                    "Content-Length": str(len(data))
                }
            )
        except Exception:
            pass
    def file_stream():
        with open(safe_path, "rb") as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                yield chunk
    return StreamingResponse(
        file_stream(),
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": etag,
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size)
        }
    ) 