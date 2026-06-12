"""HTML content cleaning and Markdown-friendly text extraction."""

from __future__ import annotations


def clean_element(element) -> str:
    """Walk a BeautifulSoup element tree and produce readable plain text."""
    tag_names = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "pre", "blockquote", "td", "th"]
    lines: list[str] = []

    for el in element.find_all(tag_names):
        tag = el.name
        txt = el.get_text(separator=" ", strip=True)
        if not txt:
            continue
        if tag.startswith("h"):
            level = int(tag[1])
            lines.append(f"{'#' * level} {txt}")
        elif tag == "li":
            lines.append(f"- {txt}")
        elif tag == "pre":
            lines.append(f"```\n{txt}\n```")
        elif tag == "blockquote":
            lines.append(f"> {txt}")
        else:
            lines.append(txt)

    return "\n\n".join(lines)
