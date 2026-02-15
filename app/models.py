import json
import os
import uuid
from datetime import datetime
from typing import Optional

DATA_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "mistakes.json"
)

MISTAKE_TYPES = [
    "Conceptual",
    "Silly/Careless",
    "Calculation",
    "Time Pressure",
    "Misread Question",
    "Memory/Formula",
]


def _load_data() -> list[dict]:
    """Load mistakes from JSON file."""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _save_data(data: list[dict]) -> None:
    """Save mistakes to JSON file atomically."""
    temp_file = DATA_FILE + ".tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(temp_file, DATA_FILE)


def get_all_mistakes(
    topic: Optional[str] = None, mistake_type: Optional[str] = None
) -> list[dict]:
    """Get all mistakes, optionally filtered by topic or mistake type."""
    mistakes = _load_data()

    if topic:
        mistakes = [m for m in mistakes if m.get("topic", "").lower() == topic.lower()]

    if mistake_type:
        mistakes = [
            m
            for m in mistakes
            if m.get("mistake_type", "").lower() == mistake_type.lower()
        ]

    # Sort by date, newest first
    mistakes.sort(key=lambda x: x.get("date_added", ""), reverse=True)
    return mistakes


def get_mistake_by_id(mistake_id: str) -> Optional[dict]:
    """Get a single mistake by ID."""
    mistakes = _load_data()
    for m in mistakes:
        if m.get("id") == mistake_id:
            return m
    return None


def add_mistake(data: dict) -> dict:
    """Add a new mistake entry."""
    mistakes = _load_data()

    now = datetime.now().isoformat()
    new_mistake = {
        "id": str(uuid.uuid4()),
        "topic": data.get("topic", "").strip(),
        "question_image": data.get("question_image", ""),
        "mistake_type": data.get("mistake_type", "Conceptual"),
        "why_happened": data.get("why_happened", "").strip(),
        "how_to_avoid": data.get("how_to_avoid", "").strip(),
        "date_added": now,
        "date_modified": now,
    }

    mistakes.append(new_mistake)
    _save_data(mistakes)
    return new_mistake


def update_mistake(mistake_id: str, data: dict) -> Optional[dict]:
    """Update an existing mistake entry."""
    mistakes = _load_data()

    for i, m in enumerate(mistakes):
        if m.get("id") == mistake_id:
            # Update fields
            if "topic" in data:
                mistakes[i]["topic"] = data["topic"].strip()
            if "question_image" in data:
                mistakes[i]["question_image"] = data["question_image"]
            if "mistake_type" in data:
                mistakes[i]["mistake_type"] = data["mistake_type"]
            if "why_happened" in data:
                mistakes[i]["why_happened"] = data["why_happened"].strip()
            if "how_to_avoid" in data:
                mistakes[i]["how_to_avoid"] = data["how_to_avoid"].strip()

            mistakes[i]["date_modified"] = datetime.now().isoformat()
            _save_data(mistakes)
            return mistakes[i]

    return None


def delete_mistake(mistake_id: str) -> bool:
    """Delete a mistake entry."""
    mistakes = _load_data()
    original_len = len(mistakes)
    mistakes = [m for m in mistakes if m.get("id") != mistake_id]

    if len(mistakes) < original_len:
        _save_data(mistakes)
        return True
    return False


def get_all_topics() -> list[str]:
    """Get all unique topics."""
    mistakes = _load_data()
    topics = set()
    for m in mistakes:
        topic = m.get("topic", "").strip()
        if topic:
            topics.add(topic)
    return sorted(list(topics))


def get_analytics() -> dict:
    """Get analytics data for the dashboard."""
    mistakes = _load_data()

    # Count by mistake type
    type_counts = {}
    for mt in MISTAKE_TYPES:
        type_counts[mt] = 0

    for m in mistakes:
        mt = m.get("mistake_type", "Conceptual")
        if mt in type_counts:
            type_counts[mt] += 1
        else:
            type_counts[mt] = 1

    # Count by topic
    topic_counts = {}
    for m in mistakes:
        topic = m.get("topic", "Uncategorized").strip()
        if not topic:
            topic = "Uncategorized"
        topic_counts[topic] = topic_counts.get(topic, 0) + 1

    # Sort topics by count
    sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)

    return {
        "total_mistakes": len(mistakes),
        "type_distribution": type_counts,
        "topic_distribution": dict(sorted_topics[:10]),  # Top 10 topics
        "most_common_type": max(type_counts.items(), key=lambda x: x[1])[0]
        if type_counts
        else None,
    }
