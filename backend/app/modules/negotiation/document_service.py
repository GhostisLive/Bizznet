"""Agreement document generation for accepted negotiations."""

from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import settings


def _template_agreement(snapshot: dict[str, Any]) -> str:
    return f"""# Commercial Agreement

**Document number:** {snapshot["document_number"]}
**Effective date:** {snapshot["effective_date"]}
**Status:** Accepted terms pending execution by the parties

## 1. Parties

- **Buyer:** {snapshot["buyer_name"]} ({snapshot["buyer_role"]})
- **Seller:** {snapshot["seller_name"]} ({snapshot["seller_role"]})

## 2. Goods and commercial terms

- **Product:** {snapshot["product"]}
- **Category:** {snapshot["category"]}
- **Quantity / MOQ:** {snapshot["moq"]} {snapshot["unit"]}
- **Unit price:** {snapshot["currency"]} {snapshot["unit_price"]:,.2f} per {snapshot["unit"]}
- **Estimated order value:** {snapshot["currency"]} {snapshot["estimated_value"]:,.2f}
- **Provenance requirement:** {snapshot["provenance_requirement"]}
- **Additional terms:** {snapshot["additional_terms"]}

## 3. Performance and delivery

The seller shall supply goods conforming to the product description and the agreed provenance requirement. Delivery schedule, delivery location, inspection, acceptance, title transfer, and risk transfer must be confirmed in a purchase order before dispatch.

## 4. Payment, inspection, and claims

Payment milestones, taxes, freight, insurance, inspection period, warranty, rejection rights, and claims procedure must be recorded in the purchase order or an executed schedule. No party should rely on this document as a substitute for those operational details.

## 5. Compliance and records

Each party shall retain business, tax, provenance, shipment, and payment records relevant to this transaction and shall cooperate with reasonable compliance checks.

## 6. Execution

This document records the negotiated commercial terms. It becomes binding only when the parties execute it or issue matching purchase-order acceptance under their applicable contracting process.

**Buyer authorised representative:** ____________________  Date: __________
**Seller authorised representative:** ____________________  Date: __________

> This generated document is a commercial-term summary, not legal advice. The parties should have their legal and tax advisers review governing law, liability, dispute resolution, payment, delivery, and data-protection terms before execution.
"""


async def generate_agreement(
    snapshot: dict[str, Any],
) -> tuple[str, str, str | None]:
    """Generate agreement prose with Ollama Cloud, retaining a usable fallback."""
    fallback = _template_agreement(snapshot)
    if not settings.OLLAMA_CLOUD_API_KEY:
        return fallback, "template", "OLLAMA_CLOUD_API_KEY is not configured"

    system_prompt = """You draft conservative B2B commercial agreement summaries.
Return only Markdown. Do not invent missing facts, addresses, governing law,
payment dates, delivery dates, warranties, or regulatory claims. Preserve every
provided commercial term exactly. Include sections for parties, goods and price,
delivery and acceptance, payment and claims, compliance/records, execution, and
a short note that legal review is required. This is a term sheet until signed."""
    user_prompt = (
        "Draft a market-standard commercial agreement summary from this JSON. "
        "Use explicit placeholders such as [TO BE CONFIRMED] for missing terms.\n\n"
        f"{snapshot}"
    )

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                settings.OLLAMA_CLOUD_URL,
                headers={
                    "Authorization": f"Bearer {settings.OLLAMA_CLOUD_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.OLLAMA_MODEL,
                    "stream": False,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
            response.raise_for_status()
            payload = response.json()
            content = payload.get("message", {}).get("content")
            if not isinstance(content, str) or not content.strip():
                raise ValueError("Ollama returned no document content")
            return content.strip(), "ollama", None
    except (httpx.HTTPError, ValueError) as exc:
        return fallback, "template", f"Ollama generation failed: {exc}"


def utc_document_date() -> str:
    return datetime.now(timezone.utc).date().isoformat()
