# Citrus FastAPI — Merge & Rewrite Plan

One API supports **both** Citrus-V3 (web) and CitrusNative (mobile). There is no dual backend: clients share one canonical domain. Feature gaps between the old apps become **optional fields / endpoints**, not separate schemas.

## Goal

| Today | Target |
|-------|--------|
| Business logic in each client’s ObjectManagers | Logic in FastAPI services |
| Firestore written from browsers/devices | MongoDB written only by the API |
| Divergent UserRelation / Group models | One merged ledger model |
| Express static host only (V3) | Real application server |

### Auth (no Firebase on the API)

**Browser (citrus.joed.dev / citrusnative.joed.dev):** joed.dev Traefik SSO (oauth2-proxy Google)

1. Traefik `sso@file` gates the UI and API hosts
2. Client calls `POST /auth/sso` with SSO cookies; Traefik injects `X-Auth-Request-Email`
3. User `_id` = normalized email; API returns **Citrus JWT**
4. Clients send `Authorization: Bearer <accessToken>`

**Mobile (optional):** `POST /auth/google` with a Google ID token (`GOOGLE_CLIENT_IDS`) — user `_id` = Google `sub`.

Mongo is the system of record — no Firebase Auth/Firestore on the backend.
Legacy Firebase projects (`citrus-v3` / `citrusnative`) are migration sources only.

---

## Merge strategy (both UIs)

```
                    ┌─────────────────┐
   Web (V3)  ──────►│  citrus-fastapi │──────► MongoDB
   Native    ──────►│  (canonical)    │
                    └─────────────────┘
```

**Union of features, single debt engine:**

| Capability | Source of truth for behavior | Used by |
|------------|------------------------------|---------|
| Split / delta / volume math | Merged algorithm (both apps) | both |
| Family mode multipliers | Native | Native UI; Web can ignore or adopt |
| Group balances + IOU `settleGroups` on txn | V3 | both (Native gains correct settle) |
| Relation `groupBalances` auto-settle | Native `UserRelation.addHistory` | both (server-only) |
| Invite codes / link / QR | V3 | Web; Native can call same APIs |
| Friend requests + in-app notifications | Native | Native; Web can adopt later |
| Phone + Google auth | V3 (phone) + both (Google) | both |

**Hard rule:** UIs never patch `relations`, group balances, or transaction ledgers directly. They call use-case endpoints.

---

## Canonical domain (Mongo collections)

See [docs/domain.md](./docs/domain.md) for field-level detail.

1. **users** — profile, friends, friendRequests, notifications, mutes, groupIds  
2. **groups** — members, familyMode/multipliers, invites metadata, optional stored balances  
3. **transactions** — amounts, currency, participant deltas, group?, isIOU, settleGroups  
4. **invitations** — code/link/qr targets (from V3)  
5. **relations** — *optional separate collection* keyed by sorted user pair; or nested under users (start nested for Firestore parity, extract if documents grow)

**Debt engine (merged):**

1. On create: compute `delta_i = paid_i − share_i` (family multipliers affect even split when group.familyMode).  
2. `volume = Σ|delta| / 2`.  
3. Pairwise histories with opposite signs.  
4. Update each user’s relation: balances + groupBalances (Native settle walk when applicable).  
5. Persist transaction with `settleGroups` when IOU (V3 audit trail).  
6. Update group.balances in the **same** Mongo transaction (V3 behavior).  

Delete / reverse uses the same ledger path in reverse (V3 `cleanDelete`).

---

## Error model

All failures return:

```json
{
  "code": "INSUFFICIENT_BALANCE",
  "message": "Human-readable summary",
  "details": {}
}
```

Map domain exceptions → HTTP status in one place (`app/core/errors.py`). Never leak stack traces in production.

---

## API surface (MVP → full)

### Phase 1 — Skeleton + auth + reads
- `GET /health`
- `POST /auth/google` — Google ID token → Citrus JWT + user upsert
- `GET /me` / `PATCH /me`
- `GET /users/search?q=`
- `GET /friends`
- `GET /groups` / `GET /groups/{id}`
- `GET /transactions/{id}`
- `GET /relations/{userId}`

### Phase 2 — Core writes (unlock both UIs)
- `POST /transactions` — create expense / IOU (the big one)
- `DELETE /transactions/{id}` — reverse ledger + delete
- `POST /groups`
- `PATCH /groups/{id}`
- `POST /groups/{id}/invites`
- `POST /invites/{code}/redeem`
- `POST /groups/{id}/members` / leave
- `POST /groups/{id}/family-mode`

### Phase 3 — Social (Native parity)
- `POST /friends/requests`
- `POST /friends/requests/{fromUserId}/accept|reject`
- `GET /notifications`
- `POST /notifications/{id}/ack`
- Mute group/user endpoints

### Phase 4 — Migration & cutover
- Firestore export → Mongo migrator (normalize forked relation shapes)
- Dual-read optional; **single-write** on API ASAP
- Tighten Firestore rules to deny client writes (or retire client SDK writes)

---

## Project layout

```
citrus-fastapi/
├── PLAN.md
├── README.md
├── docs/domain.md
├── requirements.txt
├── .env.example
├── app/
│   ├── main.py
│   ├── core/          # config, auth, errors, db
│   ├── models/        # Pydantic + Mongo document shapes
│   ├── repositories/  # Mongo access
│   ├── services/      # use-cases (ledger, groups, friends)
│   ├── api/           # routers
│   └── migrations/    # Firestore → Mongo scripts
└── tests/
```

---

## Implementation order

1. **Scaffold** ✅: app shell, config, health, error envelope  
2. **Auth + `/me`** ✅: Google SSO → Citrus JWT; `GET/PATCH /me` upserts Mongo user (`_id` = Google `sub`)  
3. **User + Group read/write** (no ledger yet)  
4. **Ledger service + `POST /transactions`** with unit tests for:
   - even split, manual split, percent
   - 2-person IOU + settleGroups
   - family mode multipliers
   - reverse/delete  
5. **Invites** (V3 codes)  
6. **Friend requests + notifications** (Native)  
7. **Migrator** from existing Firestore  
8. Point V3 and Native at the API (feature-flagged)

---

## Supporting both UIs without breaking either

| UI need | API approach |
|---------|----------------|
| V3 invite codes | Full invitation resources |
| V3 group.balances display | Returned on `GET /groups/{id}` |
| Native family mode | Fields on group; applied only in `POST /transactions` |
| Native friend requests | Dedicated endpoints; V3 can keep mutual-add via invite until migrated |
| Native notifications | Stored on user; poll or later SSE |
| Different auth entry | Same bearer token after Firebase sign-in |

Response DTOs can include fields a given UI ignores. Prefer additive schemas over client-specific forks.

---

## Non-goals (v1)

- Real money movement / Stripe  
- Porting ObjectManager Change queues  
- Perfect realtime (start with request/response; add SSE later if needed)  
- Keeping Firestore as the long-term system of record  

---

## Success criteria

- [ ] Creating a transaction from either UI produces identical Mongo state for the same inputs  
- [ ] No client write path to ledger fields  
- [ ] Authz: only members can mutate their groups/transactions  
- [ ] Integration tests cover split, IOU, family mode, settle, delete  
- [ ] Both UIs can run against the same OpenAPI (`/docs`)
