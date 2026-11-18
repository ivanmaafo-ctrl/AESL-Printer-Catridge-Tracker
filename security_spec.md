# AESL PrintFlow Security Specification (Phase 0 TDD)

## 1. Core Data Invariants
1. **Master Auth & Verification Gate**: Every read and write on company data requires `request.auth != null && request.auth.token.email_verified == true`. Unverified emails and anonymous sessions are denied.
2. **Invite-Only / Corporate Identity Boundary**: Listing or reading company inventory requires `orgId == 'aesl'` AND verified corporate authorization (`maafok830@gmail.com`, `@anointedengineering.com`, or an admin-created Email/Password account). External Gmail accounts cannot enumerate company stock or branch records.
3. **Zero Privilege Escalation**: Users cannot create or update `/users/{uid}` with `role: 'SUPER_ADMIN'` or `'ADMIN'` unless they already hold `isSuperAdmin()`, or match an active Super-Admin-authored `/staffInvites/{inviteId}` document. Users cannot self-modify `role` or `status` on update.
4. **PII Isolation (Pillar 6)**: User email and login timestamps live in `/users/{userId}/private/info` and `/staffInvites/{inviteId}` where `get`/`list` are strictly restricted to `isOwner(userId)` or `isSuperAdmin()`.
5. **Relational Integrity (Pillar 4.11)**: Creating a `DispatchRecord` or `UsageRecord` verifies `exists()` on both `branches/{branchId}` and `cartridges/{cartridgeId}`. Creating a `RestockRecord` verifies `exists()` on `cartridges/{cartridgeId}`.
6. **Terminal State Locking**: Once a dispatch reaches `status == 'Delivered'`, non-admin staff cannot alter or revert it (`existing().status != 'Delivered' || isSuperAdmin()`).
7. **Temporal & ID Integrity**: Every `create` enforces `createdAt == request.time`, `updatedAt == request.time`, and `isValidId(docId)`. Every `update` preserves immutable `createdAt`, `orgId`, and `createdByUid`/`uid`.

## 2. "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated List**: `list(/cartridges)` with `auth = null` -> DENIED.
2. **Unverified Email Spoof**: `create(/cartridges/c1)` with `email: 'maafok830@gmail.com'`, `email_verified: false` -> DENIED.
3. **External Google User Scrape**: `list(/cartridges)` with `email: 'random@gmail.com'`, `sign_in_provider: 'google.com'`, `email_verified: true` -> DENIED.
4. **Self-Assigned Super Admin**: `create(/users/u1)` with `role: 'SUPER_ADMIN'` by normal staff -> DENIED.
5. **Admin Claim Escalation**: `update(/users/u1)` adding `role: 'SUPER_ADMIN'` in `affectedKeys` by owner -> DENIED.
6. **Shadow Ghost Field**: `create(/cartridges/c1)` injecting `{ ..., isVerified: true }` -> DENIED (`hasOnly` rejects).
7. **ID Poisoning**: `create(/branches/invalid@id!with$1500chars)` -> DENIED (`isValidId` rejects).
8. **Cross-User PII Read**: `get(/users/u2/private/info)` by `u1` (non-admin) -> DENIED.
9. **Staff Invite Enumeration**: `list(/staffInvites)` by non-admin staff -> DENIED.
10. **Orphan Dispatch**: `create(/dispatches/d1)` referencing non-existent `branchId: 'fake-branch'` -> DENIED (`exists` rejects).
11. **Terminal State Tampering**: `update(/dispatches/d1)` changing `status` back from `'Delivered'` to `'Pending'` by non-admin -> DENIED.
12. **Client Timestamp Spoofing**: `create(/restocks/r1)` with backdated `createdAt` (`!= request.time`) -> DENIED.
