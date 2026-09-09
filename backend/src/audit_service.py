from datetime import datetime, timezone
from uuid import uuid4


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_audit_entry(
    action: str,
    actor: str,
    target: str,
    details: str,
    metadata: dict | None = None,
) -> dict:
    return {
        "id": str(uuid4()),
        "action": action,
        "actor": actor,
        "target": target,
        "details": details,
        "metadata": metadata or {},
        "created_at": _now_iso(),
    }


def audit_entries_to_csv(entries: list[dict]) -> str:
    lines = ["timestamp,action,actor,target,details"]
    for entry in entries:
        lines.append(
            ",".join([
                entry.get("created_at", ""),
                entry.get("action", "").replace(",", ";"),
                entry.get("actor", "").replace(",", ";"),
                entry.get("target", "").replace(",", ";"),
                entry.get("details", "").replace(",", ";"),
            ])
        )
    return "\n".join(lines)
