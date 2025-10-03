# Purpose: Verifies that the /health endpoint responds correctly
import httpx
import pytest

from app.main import app

# 1. Creates a test HTTP client that talks directly to the app (no real server needed)
# 2. Sends a GET request to /health endpoint
# 3. Validates two things:
#    - Response status is 200 (OK)
#    - Response JSON contains {"ok": true}


@pytest.mark.asyncio
async def test_health():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.get("/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True
