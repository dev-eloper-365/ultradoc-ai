"""Pydantic schemas for POST /extract."""

from pydantic import BaseModel, Field


class ExtractRequest(BaseModel):
    """Request body for POST /extract.

    ``document_ids`` selects which documents to extract from. Omit it (or pass
    an empty list) to extract from every uploaded document.
    """

    document_ids: list[str] | None = None


class ShipmentExtraction(BaseModel):
    """The structured shipment fields extracted from a logistics document.

    Field selection and ordering follows actual repetition across the three
    reference document types (bill of lading, carrier rate confirmation,
    customer/shipper rate confirmation): the first 9 fields appear on every
    one of the three; the last 4 appear on the two rate-confirmation types
    but are typically absent from a bill of lading.

    Every field is optional — the extraction prompt instructs the model to
    return null for anything not explicitly present rather than guessing.
    """

    # Present on all three reference document types.
    reference_id: str | None = Field(
        default=None,
        description="The shipment/load reference number (labeled 'Load ID' or 'Reference ID').",
    )
    pickup_location: str | None = Field(
        default=None,
        description="The pickup address (labeled 'Shipper' on a bill of lading, 'Pickup' on a rate confirmation).",
    )
    delivery_location: str | None = Field(
        default=None,
        description="The delivery address (labeled 'Consignee' on a bill of lading, 'Drop' on a rate confirmation).",
    )
    pickup_date: str | None = None
    delivery_date: str | None = None
    po_number: str | None = Field(
        default=None,
        description="The purchase order / container number associated with the pickup.",
    )
    commodity: str | None = Field(
        default=None, description="The commodity description being shipped."
    )
    weight: float | None = None
    quantity: str | None = Field(
        default=None,
        description="The unit/piece count (e.g. '10000 units', '24 pallets'), as written in the document.",
    )

    # Present on rate confirmations; typically null on a bill of lading.
    equipment_type: str | None = None
    rate: float | None = Field(
        default=None,
        description=(
            "The agreed freight/carrier charge for this shipment (e.g. 'Agreed "
            "Amount', 'Carrier Pay', 'Rate Breakdown Total'). Do not use unrelated "
            "monetary values such as COD/cash-on-delivery value, insurance "
            "value, or invoice totals for other line items."
        ),
    )
    currency: str | None = None
    carrier_name: str | None = None


class ExtractResult(BaseModel):
    """One document's extraction outcome within POST /extract."""

    document_id: str
    filename: str
    data: ShipmentExtraction | None = None
    error: str | None = None


class ExtractResponse(BaseModel):
    """Response returned by POST /extract — one result per requested document."""

    results: list[ExtractResult]
