from app.models.ledger import ParticipantSplit
from app.services.ledger import compute_volume


def test_volume_two_person_even():
    # A paid 40, each owes 20 → deltas +20 / -20 → volume 20
    parts = [
        ParticipantSplit(user_id="a", paid=40, share=20),
        ParticipantSplit(user_id="b", paid=0, share=20),
    ]
    assert compute_volume(parts) == 20


def test_volume_three_way():
    parts = [
        ParticipantSplit(user_id="a", paid=30, share=10),
        ParticipantSplit(user_id="b", paid=0, share=10),
        ParticipantSplit(user_id="c", paid=0, share=10),
    ]
    assert compute_volume(parts) == 20
