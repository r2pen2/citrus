"""Shared ledger DTOs — full create-transaction schema lands with the service."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.currency import Currency


class ParticipantSplit(BaseModel):
    user_id: str
    paid: float = 0
    share: float = 0

    @property
    def delta(self) -> float:
        return self.paid - self.share


class CreateTransactionRequest(BaseModel):
    """MVP shape for POST /transactions (implemented in Phase 2)."""

    title: str | None = None
    amount: float = Field(gt=0)
    currency: Currency
    participants: list[ParticipantSplit] = Field(min_length=2)
    group_id: str | None = None
    is_iou: bool = False
    date: datetime | None = None


class UserRelationHistory(BaseModel):
    currency: Currency
    amount: float
    transaction: str
    transaction_title: str | None = None
    group: str | None = None
    date: datetime
    settle_groups: dict[str, float] = Field(default_factory=dict)
