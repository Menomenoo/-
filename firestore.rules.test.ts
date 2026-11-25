/**
 * Security Rules Verification Spec — Dirty Dozen Test Matrix
 * Matches security_spec.md and DRAFT_firestore.rules / firestore.rules
 */
export const DIRTY_DOZEN_SECURITY_CASES = [
  { id: 1, name: 'Unauthenticated read on /operatives/u1', expected: 'DENY' },
  { id: 2, name: 'Cross-user read/write on /users/u2 or /operatives/u2 by u1', expected: 'DENY' },
  { id: 3, name: 'Privilege escalation on /users/u1 role=admin by non-admin', expected: 'DENY' },
  { id: 4, name: 'Impersonating another user in /public_operatives/u2 by u1', expected: 'DENY' },
  { id: 5, name: 'Creating a Clan with spoofed leaderUid or clanLevel != 1', expected: 'DENY' },
  { id: 6, name: 'Non-member reading or posting in /clans/c1/messages', expected: 'DENY' },
  { id: 7, name: 'Spoofing another player uid in /clans/c1/messages', expected: 'DENY' },
  { id: 8, name: 'Creating auction listing on behalf of another sellerUid', expected: 'DENY' },
  { id: 9, name: 'Buying already sold or cancelled auction listing', expected: 'DENY' },
  { id: 10, name: 'Tampering priceGold/itemId while buying auction listing', expected: 'DENY' },
  { id: 11, name: 'Non-seller cancelling open auction listing', expected: 'DENY' },
  { id: 12, name: 'Inflating territory_sectors score by > 500 in single request', expected: 'DENY' },
  { id: 13, name: 'Mutating finished live_duels room or joining own duel', expected: 'DENY' },
  { id: 14, name: 'Non-member striking coop_heists boss or exceeding 4 squad members', expected: 'DENY' },
];
