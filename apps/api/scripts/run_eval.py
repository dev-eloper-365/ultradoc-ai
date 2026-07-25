"""Golden Q&A evaluation: uploads the sample documents, asks a fixed set of
questions (some answerable, some deliberately not), and prints an accuracy /
refusal table. Paste the output table into the README's "Eval results" section
after any retrieval/guardrail threshold change.

Usage:
    PYTHONPATH=. uv run python scripts/run_eval.py
"""

import asyncio
from pathlib import Path

import yaml

from app.services.ask_service import ask_question
from app.services.document_service import upload_document

_SAMPLES_DIR = Path(__file__).resolve().parent.parent / "data" / "samples"
_GOLDEN_FILE = Path(__file__).resolve().parent / "eval_golden.yaml"


async def _upload_sample(filename: str) -> str:
    path = _SAMPLES_DIR / filename
    content = path.read_bytes()
    content_type = {
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }[path.suffix]
    response = await upload_document(
        filename=filename, content_type=content_type, content=content, max_upload_mb=10
    )
    return response.document_id


async def main() -> None:
    cases = yaml.safe_load(_GOLDEN_FILE.read_text())["golden"]
    document_ids: dict[str, str] = {}

    passed = 0
    rows: list[tuple[str, str, str, str]] = []

    for case in cases:
        filename = case["document"]
        if filename not in document_ids:
            document_ids[filename] = await _upload_sample(filename)

        response = await ask_question(
            question=case["question"], document_id=document_ids[filename]
        )

        if case["expect_refusal"]:
            ok = response.refused
        else:
            answer_lower = response.answer.lower()
            ok = not response.refused and any(
                needle.lower() in answer_lower for needle in case["expect_contains"]
            )

        passed += ok
        rows.append((case["question"], "refused" if response.refused else "answered", "PASS" if ok else "FAIL", response.confidence_tier))

    print(f"{'Question':<55} {'Result':<10} {'Check':<6} {'Tier':<8}")
    print("-" * 85)
    for question, result, check, tier in rows:
        print(f"{question[:53]:<55} {result:<10} {check:<6} {tier:<8}")
    print("-" * 85)
    print(f"Accuracy: {passed}/{len(cases)} ({100 * passed / len(cases):.0f}%)")


if __name__ == "__main__":
    asyncio.run(main())
