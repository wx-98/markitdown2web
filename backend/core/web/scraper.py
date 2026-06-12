"""Web page fetching and main content extraction."""

from __future__ import annotations

import re

import httpx
from bs4 import BeautifulSoup

from backend.core.web.cleaner import clean_element


async def scrape_url(url: str) -> dict:
    """Fetch a URL and extract its main textual content.

    Returns dict with keys: title, text, url.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        ),
    }

    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "lxml")

    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()

    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript", "iframe"]):
        tag.decompose()

    article = (
        soup.find("article")
        or soup.find("main")
        or soup.find("div", class_=re.compile(r"content|article|post|entry", re.I))
    )
    target = article if article else soup.body or soup

    text = clean_element(target)
    return {"title": title, "text": text, "url": url}
