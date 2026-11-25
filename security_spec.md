# Security Specification — Shadow Factions RPG

## 1. Access Control Matrix & Structural Invariants
- **Global Gate**: Every collection requires `isSignedIn()` (`request.auth != null && request.auth.token.email_verified == true`). Unauthenticated access is denied everywhere.
- **PII Isolation (`/users/{userId}`)**: Email and user account metadata live strictly in `/users/{userId}` with owner-only `get`, `create`, `update`, and immutable `role` unless admin. No `list` on `/users`.
- **Cloud Save Isolation (`/operatives/{userId}`)**: Full RPG campaign save JSON (`saveJson`) is strictly owner-only (`isOwner(userId)`). No other player can read or tamper with another player's cloud save.
- **Public Operative Profiles (`/public_operatives/{userId}`)**: Contains zero PII (`codename`, `factionId`, `level`, `prestigeRank`, `powerScore`, `arenaRating`, `defenseScore`, `vaultGold`, `clanId`). Signed-in users can read for Leaderboard and PvP Raid matchmaking; only the owner (`isOwner(userId)`) can create/update/delete their own document.
- **Clans (`/clans/{clanId}`, `/members/{memberUid}`, `/messages/{messageId}`)**:
  - Signed-in players can browse clans (`get`/`list`) to join.
  - Creating a clan requires `leaderUid == request.auth.uid`, initial `clanLevel == 1`, `memberCount == 1`.
  - Membership lives in `/clans/{clanId}/members/{memberUid}` (O(1) lookup via `exists(...)` Master Gate on `/messages`).
  - Only clan members can read or post to `/clans/{clanId}/messages/{messageId}` (`uid == request.auth.uid`), with bounded text length `<= 400`.
  - Clan updates allow members to donate gold/contraband or upgrade clan level without forging `leaderUid` or `factionId`.
- **Player Auction House (`/auction_listings/{listingId}`)**:
  - Signed-in users can browse listings.
  - Sellers can create `'open'` listings with `sellerUid == request.auth.uid`, positive `priceGold` and `quantity`.
  - Status state machine: `'open'` can only transition to `'cancelled'` (by `sellerUid`) or `'sold'` (by a signed-in buyer setting `buyerUid == request.auth.uid`), with `sellerUid`, `itemType`, `itemId`, `priceGold`, and `quantity` immutable.
- **Territory Sectors (`/territory_sectors/{sectorId}`)**:
  - Signed-in users can read all 6 sectors and increment their faction's territory war score by a bounded amount (`<= 500` per write) while keeping `sectorId` and `name` immutable.

## 2. Dirty Dozen Attack Payloads (Explicitly Rejected by Rules)
1. **Unauthenticated read on `/operatives/u1`** -> DENIED (`isSignedIn()` fails).
2. **Cross-user read/write on `/users/u2` or `/operatives/u2` by `u1`** -> DENIED (`isOwner()` fails).
3. **Privilege escalation on `/users/u1` (`role: 'admin'`)** -> DENIED (`role` immutable / locked to `'player'`).
4. **Impersonating another user in `/public_operatives/u2` by `u1`** -> DENIED (`isOwner(userId)` fails).
5. **Creating a Clan with `leaderUid: 'victim'` or `clanLevel: 99`** -> DENIED (`leaderUid == request.auth.uid && clanLevel == 1`).
6. **Non-member reading or posting in `/clans/c1/messages`** -> DENIED (`isClanMember(clanId)` fails).
7. **Spoofing another player's `uid` in clan chat message** -> DENIED (`request.resource.data.uid == request.auth.uid`).
8. **Creating an auction listing on behalf of another `sellerUid`** -> DENIED (`sellerUid == request.auth.uid`).
9. **Buying an already `'sold'` or `'cancelled'` auction listing** -> DENIED (`resource.data.status == 'open'`).
10. **Changing `priceGold` to 1 gold while buying someone else's auction listing** -> DENIED (immutable `priceGold`, `itemId`, `sellerUid`).
11. **Non-seller cancelling an open auction listing** -> DENIED (`resource.data.sellerUid == request.auth.uid`).
12. **Inflating Territory Sector score by `+9999999` in a single request** -> DENIED (bounded score delta `<= 500` and non-negative scores).
13. **Tampering with finished `/live_duels/{duelId}` or modifying opponent's `stakeGold` / `challengerUid`** -> DENIED (terminal lock `oldData.status != 'finished'` + immutable stake/identities + participant gate).
14. **Overfilling `/coop_heists/{heistId}` beyond 4 players or mutating a `'completed'` heist** -> DENIED (bounded `memberUids.size() <= 4`, member-only strike gate, terminal lock `oldData.status != 'completed'`).

## 3. Multiplayer Live Duels & Co-op Heists Invariants
- **Live PvP Duels (`/live_duels/{duelId}`)**:
  - `create`: `challengerUid == request.auth.uid`, `status == 'open'`, `turn == 1`, `winnerUid == ''`, actions cleared.
  - `update`: Terminal lock (`oldData.status != 'finished'`), action-based `affectedKeys` branches for cancel (`challengerUid`), join (`opponentUid != challengerUid`), and combat step (participant only, immutable identities & `stakeGold`).
- **Co-op Heists (`/coop_heists/{heistId}`)**:
  - `create`: `hostUid == request.auth.uid`, `status == 'recruiting'`, `maxPlayers == 4`, `memberUids` size 1 containing `request.auth.uid`.
  - `update`: Terminal lock (`oldData.status != 'completed'`), bounded arrays (`<= 4`), action-based `affectedKeys` branches for join (`status == 'recruiting'`), launch (`hostUid`), and damage strike (participant in `memberUids`, strictly decreasing `bossCurrentHp`).

