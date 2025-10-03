# Verifies that the /retrieve endpoint accepts queries and returns results
import httpx
import pytest

from app.main import app

# 1. Creates a test HTTP client that communicates with the app in-memory
# 2. Sends a POST request to /retrieve with a search query {"q": "hello"}
# 3. Validates two things:
#    - Response status is 200 (OK)
#    - Response JSON contains a "hits" field (search results)


@pytest.mark.asyncio
async def test_retrieve_empty():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.post("/retrieve", json={"q": "hello"})
    assert r.status_code == 200
    assert "hits" in r.json()
