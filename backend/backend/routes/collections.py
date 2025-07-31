import uuid

from fastapi import APIRouter, Depends, Query, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.db import database
from backend.routes.companies import (
    CompanyBatchOutput,
    fetch_companies_with_liked,
)
from backend.routes.companies import CompanyOutput
from typing import List


router = APIRouter(
    prefix="/collections",
    tags=["collections"],
)


class CompanyCollectionMetadata(BaseModel):
    id: uuid.UUID
    collection_name: str


class CompanyCollectionOutput(CompanyBatchOutput, CompanyCollectionMetadata):
    pass

class CompanyAddRequest(BaseModel):
    company_id: int

class CompanyBulkAddOrRemoveRequest(BaseModel):
    company_ids: List[int]

@router.get("", response_model=list[CompanyCollectionMetadata])
def get_all_collection_metadata(
    db: Session = Depends(database.get_db),
):
    collections = db.query(database.CompanyCollection).all()

    return [
        CompanyCollectionMetadata(
            id=collection.id,
            collection_name=collection.collection_name,
        )
        for collection in collections
    ]


@router.get("/{collection_id}", response_model=CompanyCollectionOutput)
def get_company_collection_by_id(
    collection_id: uuid.UUID,
    offset: int = Query(
        0, description="The number of items to skip from the beginning"
    ),
    limit: int = Query(10, description="The number of items to fetch"),
    db: Session = Depends(database.get_db),
):
    query = (
        db.query(database.CompanyCollectionAssociation, database.Company)
        .join(database.Company)
        .filter(database.CompanyCollectionAssociation.collection_id == collection_id)
    )

    total_count = query.with_entities(func.count()).scalar()

    results = query.offset(offset).limit(limit).all()
    companies = fetch_companies_with_liked(db, [company.id for _, company in results])

    return CompanyCollectionOutput(
        id=collection_id,
        collection_name=db.query(database.CompanyCollection)
        .get(collection_id)
        .collection_name,
        companies=companies,
        total=total_count,
    )

@router.post("/{collection_id}/companies", response_model=CompanyOutput)
def add_company_to_collection(
    collection_id: uuid.UUID,
    request: CompanyAddRequest,
    db: Session = Depends(database.get_db),
):
    """
    Adds a single company to the specified collection
    """
    company_id = request.company_id
    # Check that the collection exists
    collection = db.query(database.CompanyCollection).get(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Check that the company exists
    company = db.query(database.Company).get(company_id)
    print("company: ", company)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Check if association already exists
    existing = (db.query(database.CompanyCollectionAssociation)
    .filter(
        database.CompanyCollectionAssociation.collection_id == collection_id,
        database.CompanyCollectionAssociation.company_id == company_id
    )
    .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Company already in collection")

    # Create association
    association = database.CompanyCollectionAssociation(
        collection_id=collection_id,
        company_id=company_id
    )
    db.add(association)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

    # Fetch updated liked status
    updated_company = fetch_companies_with_liked(db, [company_id])[0]

    return updated_company


@router.delete("/{collection_id}/companies/bulk", response_model=CompanyBatchOutput)
async def bulk_remove_companies_from_collection(
    collection_id: uuid.UUID,
    request: CompanyBulkAddOrRemoveRequest = Body(...),
    db: Session = Depends(database.get_db),
):
    """
    Removes multiple companies from the specified collection.
    """
    company_ids = request.company_ids

    db.query(database.CompanyCollectionAssociation).filter(
        database.CompanyCollectionAssociation.collection_id == collection_id,
        database.CompanyCollectionAssociation.company_id.in_(company_ids)
    ).delete(synchronize_session=False)

    db.commit()

    updated_companies = fetch_companies_with_liked(db, company_ids)
    return {"companies": updated_companies, "total": len(updated_companies)}

    
@router.delete("/{collection_id}/companies/{company_id}", response_model=dict)
def remove_company_from_collection(
    collection_id: uuid.UUID,
    company_id: int,
    db: Session = Depends(database.get_db),
):
    """
    Removes a single company from the specified collection.
    """
    # Check that the collection exists
    collection = db.query(database.CompanyCollection).get(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Check association
    association = (
        db.query(database.CompanyCollectionAssociation)
        .filter_by(collection_id=collection_id, company_id=company_id)
        .first()
    )
    if not association:
        raise HTTPException(status_code=404, detail="Company not in collection")

    # Delete association
    db.delete(association)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

    return {"message": "Company removed from collection"}

@router.post("/{collection_id}/companies/bulk", response_model=CompanyBatchOutput)
def bulk_add_companies_to_collection(
    collection_id: uuid.UUID,
    request: CompanyBulkAddOrRemoveRequest,  # list of IDs
    db: Session = Depends(database.get_db),
):
    """
    Adds multiple companies to the specified collection.
    """
    company_ids = request.company_ids

    associations = []
    for company_id in company_ids:
        exists = (
            db.query(database.CompanyCollectionAssociation)
            .filter_by(collection_id=collection_id, company_id=company_id)
            .first()
        )
        if not exists:
            associations.append(
                database.CompanyCollectionAssociation(
                    collection_id=collection_id,
                    company_id=company_id
                )
            )

    db.add_all(associations)
    db.commit()

    updated_companies = fetch_companies_with_liked(db, company_ids)
    return {"companies": updated_companies, "total": len(updated_companies)}