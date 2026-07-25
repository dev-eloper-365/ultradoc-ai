"""Generate sample logistics documents for local testing and the eval script.

Usage:
    uv run python scripts/make_sample_docs.py
"""

from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

SAMPLES_DIR = Path(__file__).resolve().parent.parent / "data" / "samples"


def make_rate_confirmation_pdf(path: Path) -> None:
    """A typical carrier rate confirmation, with shipment fields spread across
    running text and a small table — mirrors real freight-broker paperwork."""
    document = canvas.Canvas(str(path), pagesize=LETTER)
    _width, height = LETTER
    y = height - inch

    def line(text: str, size: int = 11, gap: float = 0.28) -> None:
        nonlocal y
        document.setFont("Helvetica", size)
        document.drawString(inch, y, text)
        y -= gap * inch

    line("RATE CONFIRMATION", size=16, gap=0.4)
    line("Carrier: Northbound Freight Lines LLC")
    line("Shipment ID: RC-48213")
    line("Mode: FTL (Full Truckload)")
    line("Equipment Type: 53' Dry Van")
    line("")
    line("Shipper: Meridian Consumer Goods, 1200 Harbor Ave, Newark, NJ 07105")
    line("Consignee: Lakeside Distribution Center, 88 Commerce Dr, Columbus, OH 43215")
    line("")
    line("Pickup Date/Time: 2026-08-03 08:00 AM (EST)")
    line("Delivery Date/Time: 2026-08-05 02:00 PM (EST)")
    line("")
    line("Agreed Rate: $2,450.00 USD")
    line("Total Weight: 38,500 lbs")
    line("")
    line("Special Instructions: Driver must call consignee 1 hour before arrival.")
    line("Detention after 2 hours free time: $65/hour.")
    document.showPage()
    document.save()


def make_bill_of_lading_txt(path: Path) -> None:
    """A bill of lading with mostly logistics/handling detail and few of the
    structured extraction fields — good for testing null handling."""
    path.write_text(
        "STRAIGHT BILL OF LADING\n"
        "Non-Negotiable\n\n"
        "Carrier Name: Northbound Freight Lines LLC\n"
        "Trailer Number: NFL-8842\n"
        "Seal Number: 0091273\n\n"
        "Ship From: Meridian Consumer Goods, Newark, NJ\n"
        "Ship To: Lakeside Distribution Center, Columbus, OH\n\n"
        "Handling Unit Count: 24 pallets\n"
        "Commodity Description: Packaged consumer goods, non-hazardous\n"
        "Freight Class: 85\n\n"
        "Special Instructions: Do not stack. Keep dry.\n"
        "Received by consignee in good order except as noted:\n"
        "Signature: ______________________  Date: ______________\n",
        encoding="utf-8",
    )


def main() -> None:
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    make_rate_confirmation_pdf(SAMPLES_DIR / "sample_rate_confirmation.pdf")
    make_bill_of_lading_txt(SAMPLES_DIR / "sample_bill_of_lading.txt")
    print(f"Wrote sample documents to {SAMPLES_DIR}")


if __name__ == "__main__":
    main()
