import httpx


async def fetch_moto_image(brand: str, model: str, year: int | None = None) -> tuple[str | None, bool]:
    """Try to find a motorcycle image from Wikipedia or return None."""
    query = f"{brand} {model}"
    if year:
        query += f" {year}"
    query += " motorcycle"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            search_url = "https://en.wikipedia.org/w/api.php"
            resp = await client.get(
                search_url,
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": query,
                    "format": "json",
                    "srlimit": 1,
                },
            )
            data = resp.json()
            results = data.get("query", {}).get("search", [])
            if not results:
                return None, False
            title = results[0]["title"]
            page_resp = await client.get(
                search_url,
                params={
                    "action": "query",
                    "titles": title,
                    "prop": "pageimages",
                    "format": "json",
                    "pithumbsize": 400,
                },
            )
            page_data = page_resp.json()
            pages = page_data.get("query", {}).get("pages", {})
            for page in pages.values():
                thumb = page.get("thumbnail", {}).get("source")
                if thumb:
                    return thumb, True
    except Exception:
        pass

    return f"https://placehold.co/400x300/1a1a1f/ea580c?text={brand}+{model}", True
