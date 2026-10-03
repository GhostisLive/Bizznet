import asyncio
import uuid
from datetime import datetime, timezone
from app.database import get_db
from app.modules.network.models import Organization, Facility
from app.modules.marketplace.models import Listing
from app.modules.provenance.models import ProvenanceRecord, ListingProvenanceSnapshot
from app.modules.negotiation.models import Negotiation, NegotiationBid

async def seed():
    async for session in get_db():
        # Create organizations
        org1 = Organization(
            id=uuid.uuid4(),
            name="Tata Steel Ltd.",
            tax_id="TATA12345",
            role="raw_material_supplier",
            status="verified",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        org2 = Organization(
            id=uuid.uuid4(),
            name="Greenfield Polymers Ltd.",
            tax_id="GREEN123",
            role="raw_material_supplier",
            status="verified",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        org3 = Organization(
            id=uuid.uuid4(),
            name="Vardhman Textiles",
            tax_id="VARD123",
            role="raw_material_supplier",
            status="verified",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        org4 = Organization(
            id=uuid.uuid4(),
            name="Hindalco Industries",
            tax_id="HIND123",
            role="raw_material_supplier",
            status="verified",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        org5 = Organization(
            id=uuid.uuid4(),
            name="Dalmia Polypro",
            tax_id="DALM123",
            role="raw_material_supplier",
            status="verified",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        org6 = Organization(
            id=uuid.uuid4(),
            name="Manufacturer Alpha",
            tax_id="MFG123",
            role="manufacturer",
            status="verified",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        session.add_all([org1, org2, org3, org4, org5, org6])
        await session.commit()
        
        # Create facilities
        fac1 = Facility(
            id=uuid.uuid4(),
            organization_id=org1.id,
            name="Tata Steel Jamshedpur Works",
            location={"city": "Jamshedpur", "state": "Jharkhand", "country": "India"},
            carbon_intensity_factor=2.1,
            created_at=datetime.now(timezone.utc)
        )
        
        fac2 = Facility(
            id=uuid.uuid4(),
            organization_id=org2.id,
            name="Greenfield Polymers Dahej Plant",
            location={"city": "Dahej", "state": "Gujarat", "country": "India"},
            carbon_intensity_factor=1.8,
            created_at=datetime.now(timezone.utc)
        )
        
        fac3 = Facility(
            id=uuid.uuid4(),
            organization_id=org3.id,
            name="Vardhman Textiles Ludhiana Unit",
            location={"city": "Ludhiana", "state": "Punjab", "country": "India"},
            carbon_intensity_factor=5.4,
            created_at=datetime.now(timezone.utc)
        )
        
        fac4 = Facility(
            id=uuid.uuid4(),
            organization_id=org4.id,
            name="Hindalco Renukoot Works",
            location={"city": "Renukoot", "state": "Uttar Pradesh", "country": "India"},
            carbon_intensity_factor=8.4,
            created_at=datetime.now(timezone.utc)
        )
        
        fac5 = Facility(
            id=uuid.uuid4(),
            organization_id=org5.id,
            name="Dalmia Polypro Vapi Facility",
            location={"city": "Vapi", "state": "Gujarat", "country": "India"},
            carbon_intensity_factor=1.2,
            created_at=datetime.now(timezone.utc)
        )
        
        session.add_all([fac1, fac2, fac3, fac4, fac5])
        await session.commit()
        
        # Create listings
        listings = [
            Listing(
                id=uuid.uuid4(),
                organization_id=org1.id,
                facility_id=fac1.id,
                title="Cold-Rolled Steel Sheets CR4",
                description="High-quality cold-rolled steel sheets for automotive and industrial applications",
                category="steel",
                price=48200.0,
                currency="INR",
                moq=25.0,
                unit="MT",
                status="active",
                created_at=datetime.now(timezone.utc)
            ),
            Listing(
                id=uuid.uuid4(),
                organization_id=org2.id,
                facility_id=fac2.id,
                title="Recycled HDPE Pellets",
                description="Food-grade recycled HDPE pellets for packaging applications",
                category="plastics",
                price=72500.0,
                currency="INR",
                moq=10.0,
                unit="MT",
                status="active",
                created_at=datetime.now(timezone.utc)
            ),
            Listing(
                id=uuid.uuid4(),
                organization_id=org3.id,
                facility_id=fac3.id,
                title="Organic Cotton Yarn 30Ne",
                description="GOTS certified organic cotton yarn for premium textiles",
                category="textiles",
                price=890.0,
                currency="INR",
                moq=500.0,
                unit="kg",
                status="active",
                created_at=datetime.now(timezone.utc)
            ),
            Listing(
                id=uuid.uuid4(),
                organization_id=org4.id,
                facility_id=fac4.id,
                title="Virgin Aluminum Ingots AL-99",
                description="99.7% purity aluminum ingots for aerospace and automotive",
                category="aluminum",
                price=210000.0,
                currency="INR",
                moq=15.0,
                unit="MT",
                status="active",
                created_at=datetime.now(timezone.utc)
            ),
            Listing(
                id=uuid.uuid4(),
                organization_id=org5.id,
                facility_id=fac5.id,
                title="Recycled PET Flakes Green",
                description="Post-consumer recycled PET flakes, bottle grade",
                category="plastics",
                price=64000.0,
                currency="INR",
                moq=40.0,
                unit="MT",
                status="active",
                created_at=datetime.now(timezone.utc)
            ),
        ]
        
        session.add_all(listings)
        await session.commit()
        
        # Create provenance records
        prov_records = [
            ProvenanceRecord(
                id=uuid.uuid4(),
                organization_id=org1.id,
                type="third_party_verified",
                verifying_party="Bureau Veritas",
                evidence_url="https://certs.bizznet.io/tata-steel-cr4.pdf",
                verified_at=datetime.now(timezone.utc),
                expiration_date=datetime(2027, 3, 1, tzinfo=timezone.utc),
                payload={"standard": "ISO 14064", "scope": "Scope 1+2+3"},
                created_at=datetime.now(timezone.utc)
            ),
            ProvenanceRecord(
                id=uuid.uuid4(),
                organization_id=org2.id,
                type="third_party_verified",
                verifying_party="SGS",
                evidence_url="https://certs.bizznet.io/greenfield-hdpe.pdf",
                verified_at=datetime.now(timezone.utc),
                expiration_date=datetime(2027, 2, 15, tzinfo=timezone.utc),
                payload={"standard": "ISO 14064", "recycled_content": "95%"},
                created_at=datetime.now(timezone.utc)
            ),
            ProvenanceRecord(
                id=uuid.uuid4(),
                organization_id=org3.id,
                type="audited",
                verifying_party="Control Union",
                evidence_url="https://certs.bizznet.io/vardhman-cotton.pdf",
                verified_at=datetime.now(timezone.utc),
                expiration_date=datetime(2026, 12, 1, tzinfo=timezone.utc),
                payload={"standard": "GOTS", "organic_content": "100%"},
                created_at=datetime.now(timezone.utc)
            ),
            ProvenanceRecord(
                id=uuid.uuid4(),
                organization_id=org4.id,
                type="third_party_verified",
                verifying_party="DNV",
                evidence_url="https://certs.bizznet.io/hindalco-al.pdf",
                verified_at=datetime.now(timezone.utc),
                expiration_date=datetime(2027, 5, 1, tzinfo=timezone.utc),
                payload={"standard": "ISO 14064", "purity": "99.7%"},
                created_at=datetime.now(timezone.utc)
            ),
            ProvenanceRecord(
                id=uuid.uuid4(),
                organization_id=org5.id,
                type="self_reported",
                verifying_party=None,
                evidence_url=None,
                verified_at=None,
                expiration_date=None,
                payload={"claim": "Recycled content 85%"},
                created_at=datetime.now(timezone.utc)
            ),
        ]
        
        session.add_all(prov_records)
        await session.commit()
        
        # Link listings to provenance records
        snapshots = []
        for i, (listing, prov) in enumerate(zip(listings, prov_records)):
            snapshot = ListingProvenanceSnapshot(
                id=uuid.uuid4(),
                listing_id=listing.id,
                confidence_score=0.95 if i < 4 else 0.65,
                provenance_grade=prov.type,
                active_provenance_records=[str(prov.id)],
            )
            snapshots.append(snapshot)
        
        session.add_all(snapshots)
        await session.commit()
        
        # Create some negotiations
        neg1 = Negotiation(
            id=uuid.uuid4(),
            buyer_id=org6.id,
            seller_id=org1.id,
            listing_id=listings[0].id,
            status="active",
            provenance_reviewed=True,
            created_at=datetime.now(timezone.utc)
        )
        
        neg2 = Negotiation(
            id=uuid.uuid4(),
            buyer_id=org6.id,
            seller_id=org2.id,
            listing_id=listings[1].id,
            status="active",
            provenance_reviewed=False,
            created_at=datetime.now(timezone.utc)
        )
        
        session.add_all([neg1, neg2])
        await session.commit()
        
        # Create some bids
        bid1 = NegotiationBid(
            id=uuid.uuid4(),
            negotiation_id=neg1.id,
            sender_id=org1.id,
            price=49500.0,
            moq=25.0,
            provenance_requirement="third_party_verified",
            terms="Standard payment terms, delivery within 30 days",
            timestamp=datetime.now(timezone.utc)
        )
        
        bid2 = NegotiationBid(
            id=uuid.uuid4(),
            negotiation_id=neg1.id,
            sender_id=org6.id,
            price=48200.0,
            moq=25.0,
            provenance_requirement="third_party_verified",
            terms="Agreed to seller terms",
            timestamp=datetime.now(timezone.utc)
        )
        
        bid3 = NegotiationBid(
            id=uuid.uuid4(),
            negotiation_id=neg2.id,
            sender_id=org2.id,
            price=74000.0,
            moq=10.0,
            provenance_requirement="third_party_verified",
            terms="Delivery within 21 days",
            timestamp=datetime.now(timezone.utc)
        )
        
        session.add_all([bid1, bid2, bid3])
        await session.commit()
        
        print("Seed data created successfully!")
        print(f"Created {len([org1, org2, org3, org4, org5, org6])} organizations")
        print(f"Created {len([fac1, fac2, fac3, fac4, fac5])} facilities")
        print(f"Created {len(listings)} listings")
        print(f"Created {len(prov_records)} provenance records")
        print(f"Created 2 negotiations with 3 bids")

asyncio.run(seed())