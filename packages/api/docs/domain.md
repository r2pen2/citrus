# Canonical domain

Merged from Citrus-V3 and CitrusNative. MongoDB document shapes (Pydantic mirrors these).

## Conventions

- **Balance sign:** `> 0` means you are owed; `< 0` means you owe.
- **Currency:** `{ "legal": bool, "type": "USD" | "🍺" | "🍕" | "☕" }`  
  Legal types use key `"USD"` in balance maps; emoji types use the emoji string as key.
- **IDs:** User IDs match Firebase Auth `uid`. Group/transaction IDs are Mongo ObjectId strings (or migrated Firestore IDs during cutover).

---

## User

```json
{
  "_id": "firebaseUid",
  "friends": ["uid", "..."],
  "groups": ["groupId", "..."],
  "relations": {
    "otherUid": { /* UserRelation */ }
  },
  "metadata": {
    "createdAt": "datetime",
    "emailVerified": false,
    "lastLoginAt": "datetime"
  },
  "personalData": {
    "displayName": "string",
    "displayNameSearchable": "string",
    "email": "string|null",
    "phoneNumber": "string|null",
    "pfpUrl": "string|null"
  },
  "transactions": ["txnId", "..."],
  "notifications": {},
  "mutedGroups": [],
  "mutedUsers": [],
  "groupInvitations": [],
  "incomingFriendRequests": [],
  "outgoingFriendRequests": []
}
```

### UserRelation (nested)

```json
{
  "balances": { "USD": 0 },
  "groupBalances": {
    "groupId": { "USD": 0 }
  },
  "history": [ /* UserRelationHistory */ ],
  "lastInteracted": "datetime",
  "numTransactions": 0,
  "displayName": "string|null"
}
```

### UserRelationHistory

```json
{
  "currency": { "legal": true, "type": "USD" },
  "amount": -12.5,
  "transaction": "txnId",
  "transactionTitle": "Dinner",
  "group": "groupId|null",
  "date": "datetime",
  "settleGroups": { "groupId": 5.0 }
}
```

---

## Group

```json
{
  "_id": "groupId",
  "createdAt": "datetime",
  "createdBy": "uid",
  "name": "string",
  "description": "string|null",
  "transactions": [],
  "users": ["uid"],
  "balances": {
    "uid": { "USD": 0 }
  },
  "familyMode": false,
  "familyMultipliers": { "uid": 1 },
  "invitedUsers": [],
  "invitations": {
    "link": "url|null",
    "qr": "url|null",
    "code": "inviteCode|null"
  }
}
```

---

## Transaction

```json
{
  "_id": "txnId",
  "createdBy": "uid",
  "currency": { "legal": true, "type": "USD" },
  "amount": 40,
  "date": "datetime",
  "title": "string",
  "balances": { "uidA": 20, "uidB": -20 },
  "group": "groupId|null",
  "settleGroups": { "groupId": 10 },
  "isIOU": false
}
```

`balances` values are participant **deltas** (`paid − share`).

---

## Invitation

```json
{
  "_id": "AppleBananaCherry",
  "targetType": "group|friend|user",
  "inviteMethod": "code|link|qr",
  "invitedAt": "datetime",
  "used": false,
  "target": "groupId|uid",
  "inviteeAttrs": { "location": null },
  "inviterAttrs": { "location": null }
}
```

---

## Ledger invariants (enforced by services)

1. Creating a transaction updates: transaction doc, all affected user relations, optional group.balances / group.transactions, and user.transactions — **atomically**.
2. Opposite relation histories for a pair must sum to ~0 for that event.
3. IOU with two users: fronter delta = +amount, other = −amount (before settleGroups allocation).
4. Family mode only changes how even **split** shares are computed; it does not invent new currencies.
5. Delete reverses history entries for that `transaction` id and undoes settleGroups on group balances.
