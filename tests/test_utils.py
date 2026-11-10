import os
import subprocess
import time
import urllib.request
from typing import Optional, Tuple


def get_output_dir() -> str:
    """Return the output directory for test artifacts (screenshots, logs)."""
    out = os.getenv("OUTPUT_DIR", os.path.join(os.getcwd(), "test-results"))
    os.makedirs(out, exist_ok=True)
    return out


def wait_for_url(url: str, timeout: float = 15.0) -> bool:
    """Poll a URL until it returns a successful HTTP status code or times out."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=1.0) as resp:
                if resp.status < 400:
                    return True
        except Exception:
            pass
        time.sleep(0.1)
    return False


def ensure_server(default_port: int = 4173) -> Tuple[str, Optional[subprocess.Popen]]:
    """
    Resolve base URL. If GAME_BASE_URL is set, use it (no child process spawned).
    Otherwise, launch a local Vite preview server with readiness polling.
    """
    base_url = os.getenv("GAME_BASE_URL")
    if base_url:
        return base_url.rstrip("/"), None

    port = str(default_port)
    proc = subprocess.Popen(
        ["npx", "vite", "preview", "--host", "127.0.0.1", "--port", port],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    url = f"http://127.0.0.1:{port}"
    if not wait_for_url(url, timeout=15.0):
        proc.terminate()
        raise RuntimeError(f"Preview server failed to respond at {url} within 15 seconds")
    return url, proc
