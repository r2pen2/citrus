"""
Merged debt engine (V3 + Native).

Implementation order (see PLAN.md Phase 2):
1. compute_deltas — even / manual / percent + family multipliers
2. pairwise_debts — volume = sum(|delta|)/2
3. apply_histories — balances + groupBalances settle walk (Native)
4. persist — Mongo multi-doc transaction + settleGroups on txn (V3)

This module is intentionally a stub so the algorithm lands with tests.
"""

from app.core.errors import AppError
from app.models.ledger import CreateTransactionRequest, ParticipantSplit


def compute_deltas(participants: list[ParticipantSplit]) -> list[ParticipantSplit]:
    """Return participants with paid/share already resolved into deltas."""
    if len(participants) < 2:
        raise AppError("INVALID_PARTICIPANTS", "At least two participants required.", 422)
    return participants


def compute_volume(participants: list[ParticipantSplit]) -> float:
    return sum(abs(p.delta) for p in participants) / 2


async def create_transaction(_payload: CreateTransactionRequest, _actor_uid: str) -> dict:
    raise AppError(
        code="NOT_IMPLEMENTED",
        message="Ledger create_transaction lands in Phase 2. See PLAN.md.",
        status_code=501,
    )
