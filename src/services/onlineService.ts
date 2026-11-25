import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { TERRITORY_DISTRICTS, WORLD_BOSSES } from '../data/gameData';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AuctionListingDoc,
  BountyDoc,
  ClanMemberDoc,
  ClanMessageDoc,
  ClanRaidBossDoc,
  ClanRaidDamageDoc,
  ClanWarDoc,
  CoopHeistDoc,
  CoopHeistTemplateDef,
  FactionId,
  GlobalChatMessageDoc,
  LiveDuelAction,
  LivePvpDuelDoc,
  OnlineClanDoc,
  PlayerSaveState,
  PublicOperativeDoc,
  PvpAlertDoc,
  SeasonHallEntryDoc,
  ServerBossDamageDoc,
  ServerBossDoc,
  TerritorySectorState,
  TimedAuctionDoc,
} from '../types/game';
import { getClanPowerScore, getEffectiveAttributes, getPlayerPowerScore } from '../utils/combatEngine';

export async function ensureUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        email: (user.email || '').slice(0, 120),
        displayName: (user.displayName || 'عميل الظل').slice(0, 80),
        role: user.email === 'ilove201025@yahoo.com' && user.emailVerified ? 'admin' : 'player',
        createdAt: Date.now(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadCloudOperative(uid: string): Promise<Partial<PlayerSaveState> | null> {
  const path = `operatives/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'operatives', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (typeof data.saveJson !== 'string') return null;
    return JSON.parse(data.saveJson) as Partial<PlayerSaveState>;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function syncOperativeToCloud(uid: string, player: PlayerSaveState): Promise<void> {
  const now = Date.now();
  const trimmedPlayer: PlayerSaveState = {
    ...player,
    logs: player.logs.slice(0, 20),
  };
  const saveJson = JSON.stringify(trimmedPlayer);
  if (saveJson.length > 440000) return;

  const codename = (player.codename || 'شبح الليل').slice(0, 32);
  const attrs = getEffectiveAttributes(player);
  const powerScore = getPlayerPowerScore(attrs, getClanPowerScore(player));

  try {
    await setDoc(doc(db, 'operatives', uid), {
      uid,
      codename,
      factionId: player.factionId,
      level: Math.max(1, player.level),
      prestigeRank: Math.max(0, player.prestigeRank),
      saveJson,
      updatedAt: now,
    });

    await setDoc(doc(db, 'public_operatives', uid), {
      uid,
      codename,
      factionId: player.factionId,
      subSpecId: player.subSpecId || '',
      level: Math.max(1, player.level),
      prestigeRank: Math.max(0, player.prestigeRank),
      powerScore,
      arenaRating: Math.max(0, player.arenaRating),
      defenseScore: Math.max(0, attrs.defense + attrs.agility),
      vaultGold: Math.max(0, player.gold),
      clanId: player.clanId || '',
      clanName: (player.clanName || '').slice(0, 40),
      referralCode: uid.slice(0, 8).toUpperCase(),
      nameFrame: player.equippedFrame || '',
      seasonMedals: player.seasonMedals || 0,
      equippedWeaponId: (player.equipped.weapon || '').slice(0, 80),
      equippedArmorId: (player.equipped.armor || '').slice(0, 80),
      equippedRelicId: (player.equipped.relic || '').slice(0, 80),
      activeCompanionId: (player.activeCompanion || '').slice(0, 40),
      attackStat: Math.max(0, Math.min(10000000, Math.round(attrs.attack))),
      defenseStat: Math.max(0, Math.min(10000000, Math.round(attrs.defense))),
      agilityStat: Math.max(0, Math.min(10000000, Math.round(attrs.agility))),
      masteryStat: Math.max(0, Math.min(10000000, Math.round(attrs.mastery))),
      influenceStat: Math.max(0, Math.min(10000000, Math.round(attrs.influence))),
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `operatives/${uid}`);
  }
}

export function subscribePublicOperatives(
  onData: (rows: PublicOperativeDoc[]) => void
): () => void {
  const q = query(collection(db, 'public_operatives'), orderBy('powerScore', 'desc'), limit(30));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as PublicOperativeDoc);
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'public_operatives');
    }
  );
}

export function subscribeOnlineClans(onData: (clans: OnlineClanDoc[]) => void): () => void {
  const q = query(collection(db, 'clans'), orderBy('powerScore', 'desc'), limit(25));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OnlineClanDoc, 'id'>) }));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'clans');
    }
  );
}

export async function createOnlineClan(
  uid: string,
  player: PlayerSaveState,
  clanName: string
): Promise<string | null> {
  const cleanName = clanName.trim().slice(0, 32);
  if (cleanName.length < 2) return null;
  const now = Date.now();
  const powerScore = getPlayerPowerScore(getEffectiveAttributes(player), getClanPowerScore(player));

  try {
    const clanRef = await addDoc(collection(db, 'clans'), {
      name: cleanName,
      factionId: player.factionId,
      leaderUid: uid,
      treasuryGold: 0,
      treasuryContraband: 0,
      clanLevel: 1,
      powerScore,
      warPoints: 0,
      memberCount: 1,
      createdAt: now,
    });

    await setDoc(doc(db, 'clans', clanRef.id, 'members', uid), {
      uid,
      codename: player.codename.slice(0, 32),
      factionId: player.factionId,
      powerScore,
      role: 'leader',
      joinedAt: now,
    });

    return clanRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'clans');
    return null;
  }
}

export async function joinOnlineClan(
  uid: string,
  player: PlayerSaveState,
  clan: OnlineClanDoc
): Promise<boolean> {
  const now = Date.now();
  const powerScore = getPlayerPowerScore(getEffectiveAttributes(player), getClanPowerScore(player));
  try {
    await setDoc(doc(db, 'clans', clan.id, 'members', uid), {
      uid,
      codename: player.codename.slice(0, 32),
      factionId: player.factionId,
      powerScore,
      role: 'member',
      joinedAt: now,
    });

    await updateDoc(doc(db, 'clans', clan.id), {
      memberCount: clan.memberCount + 1,
      powerScore: clan.powerScore + powerScore,
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `clans/${clan.id}`);
    return false;
  }
}

export async function leaveOnlineClan(uid: string, clan: OnlineClanDoc): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'clans', clan.id), {
      memberCount: Math.max(0, clan.memberCount - 1),
    });
    await deleteDoc(doc(db, 'clans', clan.id, 'members', uid));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `clans/${clan.id}/members/${uid}`);
    return false;
  }
}

export async function donateToOnlineClan(
  clan: OnlineClanDoc,
  goldAmount: number,
  contrabandAmount: number
): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'clans', clan.id), {
      treasuryGold: clan.treasuryGold + Math.max(0, goldAmount),
      treasuryContraband: clan.treasuryContraband + Math.max(0, contrabandAmount),
      powerScore: clan.powerScore + Math.round(goldAmount / 25) + contrabandAmount * 4,
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `clans/${clan.id}`);
    return false;
  }
}

export async function upgradeOnlineClan(clan: OnlineClanDoc, goldCost: number): Promise<boolean> {
  if (clan.treasuryGold < goldCost) return false;
  try {
    await updateDoc(doc(db, 'clans', clan.id), {
      treasuryGold: clan.treasuryGold - goldCost,
      clanLevel: clan.clanLevel + 1,
      powerScore: clan.powerScore + 250,
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `clans/${clan.id}`);
    return false;
  }
}

export function subscribeClanMembers(
  clanId: string,
  onData: (members: ClanMemberDoc[]) => void
): () => void {
  const q = query(collection(db, 'clans', clanId, 'members'), orderBy('powerScore', 'desc'), limit(40));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as ClanMemberDoc));
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `clans/${clanId}/members`);
    }
  );
}

export function subscribeClanMessages(
  clanId: string,
  onData: (msgs: ClanMessageDoc[]) => void
): () => void {
  const q = query(collection(db, 'clans', clanId, 'messages'), orderBy('createdAt', 'desc'), limit(40));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClanMessageDoc, 'id'>) }));
      onData(list.reverse());
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `clans/${clanId}/messages`);
    }
  );
}

export async function sendClanChatMessage(
  clanId: string,
  uid: string,
  codename: string,
  text: string
): Promise<boolean> {
  const trimmed = text.trim().slice(0, 400);
  if (!trimmed) return false;
  try {
    await addDoc(collection(db, 'clans', clanId, 'messages'), {
      uid,
      codename: codename.slice(0, 32),
      text: trimmed,
      createdAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `clans/${clanId}/messages`);
    return false;
  }
}

export function subscribeAuctionListings(onData: (listings: AuctionListingDoc[]) => void): () => void {
  const q = query(collection(db, 'auction_listings'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const openList = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<AuctionListingDoc, 'id'>) }))
        .filter((l) => l.status === 'open');
      onData(openList);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'auction_listings');
    }
  );
}

export async function createAuctionListing(params: {
  sellerUid: string;
  sellerName: string;
  itemType: AuctionListingDoc['itemType'];
  itemId: string;
  itemName: string;
  enhanceLevel?: number;
  quantity: number;
  priceGold: number;
}): Promise<boolean> {
  try {
    await addDoc(collection(db, 'auction_listings'), {
      sellerUid: params.sellerUid,
      sellerName: params.sellerName.slice(0, 32),
      itemType: params.itemType,
      itemId: params.itemId.slice(0, 64),
      itemName: params.itemName.slice(0, 64),
      enhanceLevel: params.enhanceLevel ?? 0,
      quantity: Math.max(1, Math.min(1000, params.quantity)),
      priceGold: Math.max(10, Math.min(50000000, Math.round(params.priceGold))),
      status: 'open',
      createdAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'auction_listings');
    return false;
  }
}

export async function buyAuctionListing(listingId: string, buyerUid: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'auction_listings', listingId), {
      status: 'sold',
      buyerUid,
      soldAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `auction_listings/${listingId}`);
    return false;
  }
}

export async function cancelAuctionListing(listingId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'auction_listings', listingId), {
      status: 'cancelled',
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `auction_listings/${listingId}`);
    return false;
  }
}

export function subscribeTerritorySectors(onData: (sectors: TerritorySectorState[]) => void): () => void {
  return onSnapshot(
    collection(db, 'territory_sectors'),
    async (snap) => {
      if (snap.empty) {
        const now = Date.now();
        for (let i = 0; i < TERRITORY_DISTRICTS.length; i++) {
          const d = TERRITORY_DISTRICTS[i];
          const initFaction: FactionId =
            i % 3 === 0 ? 'shadow_hunters' : i % 3 === 1 ? 'tech_wardens' : 'blood_mages';
          try {
            await setDoc(doc(db, 'territory_sectors', d.id), {
              sectorId: d.id,
              name: d.name,
              controllingFaction: initFaction,
              shadowHuntersScore: initFaction === 'shadow_hunters' ? 350 : 220,
              techWardensScore: initFaction === 'tech_wardens' ? 350 : 220,
              bloodMagesScore: initFaction === 'blood_mages' ? 350 : 220,
              updatedAt: now,
            });
          } catch {
            // ignore concurrent seed race
          }
        }
        return;
      }
      const list = snap.docs.map((d) => d.data() as TerritorySectorState);
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'territory_sectors');
    }
  );
}

export async function contributeTerritoryScore(
  sector: TerritorySectorState,
  factionId: FactionId,
  points: number
): Promise<void> {
  const safePts = Math.max(1, Math.min(450, Math.round(points)));
  const nextSh = sector.shadowHuntersScore + (factionId === 'shadow_hunters' ? safePts : 0);
  const nextTw = sector.techWardensScore + (factionId === 'tech_wardens' ? safePts : 0);
  const nextBm = sector.bloodMagesScore + (factionId === 'blood_mages' ? safePts : 0);

  let controllingFaction: FactionId = sector.controllingFaction;
  if (nextSh >= nextTw && nextSh >= nextBm) controllingFaction = 'shadow_hunters';
  else if (nextTw >= nextSh && nextTw >= nextBm) controllingFaction = 'tech_wardens';
  else controllingFaction = 'blood_mages';

  try {
    await updateDoc(doc(db, 'territory_sectors', sector.sectorId), {
      controllingFaction,
      shadowHuntersScore: increment(factionId === 'shadow_hunters' ? safePts : 0),
      techWardensScore: increment(factionId === 'tech_wardens' ? safePts : 0),
      bloodMagesScore: increment(factionId === 'blood_mages' ? safePts : 0),
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `territory_sectors/${sector.sectorId}`);
  }
}

export async function addClanWarPoints(clanId: string, points: number): Promise<void> {
  if (!clanId || points <= 0) return;
  try {
    await updateDoc(doc(db, 'clans', clanId), {
      warPoints: increment(Math.min(250, Math.round(points))),
      powerScore: increment(Math.round(points / 2)),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `clans/${clanId}`);
  }
}

// ===============================================================
// PvP Incoming Raid & Auction Notifications (with Revenge)
// ===============================================================
export function subscribePvpAlerts(
  myUid: string,
  onData: (alerts: PvpAlertDoc[]) => void
): () => void {
  const q = query(collection(db, 'pvp_alerts'), where('targetUid', '==', myUid), limit(30));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<PvpAlertDoc, 'id'>) }))
        .sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'pvp_alerts');
    }
  );
}

export async function sendPvpAlert(params: {
  targetUid: string;
  attackerUid: string;
  attackerName: string;
  attackerFaction: FactionId;
  attackerPower: number;
  alertType: 'raid_incoming' | 'auction_sold' | 'referral_bonus' | 'bounty_claimed';
  summary: string;
  goldAmount: number;
  crystalAmount?: number;
}): Promise<void> {
  try {
    await addDoc(collection(db, 'pvp_alerts'), {
      targetUid: params.targetUid.slice(0, 64),
      attackerUid: params.attackerUid,
      attackerName: params.attackerName.slice(0, 32),
      attackerFaction: params.attackerFaction,
      attackerPower: Math.max(0, Math.round(params.attackerPower)),
      alertType: params.alertType,
      summary: params.summary.slice(0, 160),
      goldAmount: Math.max(0, Math.round(params.goldAmount)),
      crystalAmount: Math.max(0, Math.round(params.crystalAmount || 0)),
      resolved: false,
      createdAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'pvp_alerts');
  }
}

export async function resolvePvpAlert(alertId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'pvp_alerts', alertId), {
      resolved: true,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `pvp_alerts/${alertId}`);
  }
}

// ===============================================================
// Co-op Server-Wide World Boss
// ===============================================================
const SERVER_BOSS_BASE_HP = 35000;

export function subscribeServerBoss(onData: (boss: ServerBossDoc | null) => void): () => void {
  const ref = doc(db, 'server_boss', 'active');
  return onSnapshot(
    ref,
    async (snap) => {
      if (!snap.exists()) {
        const firstBoss = WORLD_BOSSES[0];
        const initDoc: ServerBossDoc = {
          cycle: 1,
          bossIndex: 0,
          bossName: `${firstBoss.name} (زعيم السيرفر)`,
          maxHp: SERVER_BOSS_BASE_HP,
          currentHp: SERVER_BOSS_BASE_HP,
          lastDefeatedCycle: 0,
          lastFinisherName: '',
          updatedAt: Date.now(),
        };
        try {
          await setDoc(ref, initDoc);
        } catch {
          // ignore concurrent initialization
        }
        onData(initDoc);
        return;
      }
      onData(snap.data() as ServerBossDoc);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'server_boss/active');
    }
  );
}

export function subscribeServerBossDamage(onData: (rows: ServerBossDamageDoc[]) => void): () => void {
  const q = query(collection(db, 'server_boss_damage'), orderBy('damage', 'desc'), limit(15));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as ServerBossDamageDoc));
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'server_boss_damage');
    }
  );
}

export async function strikeSharedServerBoss(params: {
  boss: ServerBossDoc;
  uid: string;
  codename: string;
  factionId: FactionId;
  damage: number;
  existingMyDamage: ServerBossDamageDoc | null;
}): Promise<{ defeatedCycle: boolean }> {
  const safeDamage = Math.max(25, Math.min(250000, Math.round(params.damage)));
  const remaining = params.boss.currentHp - safeDamage;
  const bossRef = doc(db, 'server_boss', 'active');
  const dmgRef = doc(db, 'server_boss_damage', params.uid);
  const now = Date.now();

  try {
    const prevCycleDamage =
      params.existingMyDamage && params.existingMyDamage.cycle === params.boss.cycle
        ? params.existingMyDamage.damage
        : 0;

    await setDoc(dmgRef, {
      uid: params.uid,
      codename: params.codename.slice(0, 32),
      factionId: params.factionId,
      cycle: params.boss.cycle,
      damage: prevCycleDamage + safeDamage,
      updatedAt: now,
    });

    if (remaining <= 0) {
      const nextBossIdx = (params.boss.bossIndex + 1) % WORLD_BOSSES.length;
      const nextBossDef = WORLD_BOSSES[nextBossIdx];
      const nextMaxHp = Math.min(250000000, SERVER_BOSS_BASE_HP + params.boss.cycle * 12000);
      await updateDoc(bossRef, {
        cycle: params.boss.cycle + 1,
        bossIndex: nextBossIdx,
        bossName: `${nextBossDef.name} (زعيم السيرفر)`,
        maxHp: nextMaxHp,
        currentHp: nextMaxHp,
        lastDefeatedCycle: params.boss.cycle,
        lastFinisherName: params.codename.slice(0, 32),
        updatedAt: now,
      });
      return { defeatedCycle: true };
    }

    await updateDoc(bossRef, {
      currentHp: remaining,
      updatedAt: now,
    });
    return { defeatedCycle: false };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'server_boss/active');
    return { defeatedCycle: false };
  }
}

// ===============================================================
// Global City Chat Channel
// ===============================================================
export function subscribeGlobalChat(onData: (msgs: GlobalChatMessageDoc[]) => void): () => void {
  const q = query(collection(db, 'global_chat'), orderBy('createdAt', 'desc'), limit(40));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GlobalChatMessageDoc, 'id'>) }));
      onData(list.reverse());
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'global_chat');
    }
  );
}

export async function sendGlobalChatMessage(params: {
  uid: string;
  codename: string;
  factionId: FactionId;
  titleTag?: string;
  chatColor?: string;
  nameFrame?: string;
  text: string;
}): Promise<boolean> {
  const trimmed = params.text.trim().slice(0, 300);
  if (!trimmed) return false;
  try {
    await addDoc(collection(db, 'global_chat'), {
      uid: params.uid,
      codename: params.codename.slice(0, 32),
      factionId: params.factionId,
      titleTag: (params.titleTag || '').slice(0, 32),
      chatColor: (params.chatColor || '').slice(0, 40),
      nameFrame: (params.nameFrame || '').slice(0, 40),
      text: trimmed,
      createdAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'global_chat');
    return false;
  }
}

// ===============================================================
// Bounty Board (Hitlist)
// ===============================================================
export function subscribeBounties(onData: (bounties: BountyDoc[]) => void): () => void {
  const q = query(collection(db, 'bounties'), where('status', '==', 'open'), limit(30));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<BountyDoc, 'id'>) }))
        .sort((a, b) => b.rewardGold - a.rewardGold || b.createdAt - a.createdAt);
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'bounties');
    }
  );
}

export async function createBounty(params: {
  posterUid: string;
  posterName: string;
  targetUid: string;
  targetName: string;
  targetFaction: FactionId;
  rewardGold: number;
  rewardCrystals: number;
  reason: string;
}): Promise<boolean> {
  try {
    await addDoc(collection(db, 'bounties'), {
      posterUid: params.posterUid,
      posterName: params.posterName.slice(0, 32),
      targetUid: params.targetUid.slice(0, 64),
      targetName: params.targetName.slice(0, 32),
      targetFaction: params.targetFaction,
      rewardGold: Math.max(200, Math.min(10000000, Math.round(params.rewardGold))),
      rewardCrystals: Math.max(0, Math.min(200, Math.round(params.rewardCrystals))),
      reason: params.reason.trim().slice(0, 100) || 'تصفية حساب في المدينة السفلية',
      status: 'open',
      createdAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'bounties');
    return false;
  }
}

export async function claimBounty(bountyId: string, hunterUid: string, hunterName: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'bounties', bountyId), {
      status: 'claimed',
      hunterUid,
      hunterName: hunterName.slice(0, 32),
      claimedAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bounties/${bountyId}`);
    return false;
  }
}

export async function cancelBounty(bountyId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'bounties', bountyId), {
      status: 'cancelled',
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bounties/${bountyId}`);
    return false;
  }
}

// ===============================================================
// Clan Weekly Co-op Raid Boss
// ===============================================================
const CLAN_BOSS_BASE_HP = 18000;
const CLAN_BOSS_NAMES = [
  'عملاق الحصن المسوّر',
  'حارس البوابة المصفّح',
  'غول القبو الأبدي',
  'تنين الحديد القرمزي',
];

export function subscribeClanRaidBoss(
  clanId: string,
  onData: (boss: ClanRaidBossDoc | null) => void
): () => void {
  const ref = doc(db, 'clans', clanId, 'raid_boss', 'active');
  return onSnapshot(
    ref,
    async (snap) => {
      if (!snap.exists()) {
        const initDoc: ClanRaidBossDoc = {
          cycle: 1,
          bossName: CLAN_BOSS_NAMES[0],
          maxHp: CLAN_BOSS_BASE_HP,
          currentHp: CLAN_BOSS_BASE_HP,
          lastDefeatedCycle: 0,
          lastFinisherName: '',
          updatedAt: Date.now(),
        };
        try {
          await setDoc(ref, initDoc);
        } catch {
          // ignore concurrent initialization
        }
        onData(initDoc);
        return;
      }
      onData(snap.data() as ClanRaidBossDoc);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `clans/${clanId}/raid_boss/active`);
    }
  );
}

export function subscribeClanRaidDamage(
  clanId: string,
  onData: (rows: ClanRaidDamageDoc[]) => void
): () => void {
  const q = query(collection(db, 'clans', clanId, 'raid_damage'), orderBy('damage', 'desc'), limit(20));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as ClanRaidDamageDoc));
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `clans/${clanId}/raid_damage`);
    }
  );
}

export async function strikeClanRaidBoss(params: {
  clanId: string;
  boss: ClanRaidBossDoc;
  uid: string;
  codename: string;
  damage: number;
  existingMyDamage: ClanRaidDamageDoc | null;
}): Promise<{ defeatedCycle: boolean }> {
  const safeDamage = Math.max(40, Math.min(250000, Math.round(params.damage)));
  const remaining = params.boss.currentHp - safeDamage;
  const bossRef = doc(db, 'clans', params.clanId, 'raid_boss', 'active');
  const dmgRef = doc(db, 'clans', params.clanId, 'raid_damage', params.uid);
  const now = Date.now();

  try {
    const prevDmg =
      params.existingMyDamage && params.existingMyDamage.cycle === params.boss.cycle
        ? params.existingMyDamage.damage
        : 0;

    await setDoc(dmgRef, {
      uid: params.uid,
      codename: params.codename.slice(0, 32),
      cycle: params.boss.cycle,
      damage: prevDmg + safeDamage,
      updatedAt: now,
    });

    if (remaining <= 0) {
      const nextCycle = params.boss.cycle + 1;
      const nextName = CLAN_BOSS_NAMES[(nextCycle - 1) % CLAN_BOSS_NAMES.length];
      const nextMaxHp = Math.min(250000000, CLAN_BOSS_BASE_HP + params.boss.cycle * 7500);
      await updateDoc(bossRef, {
        cycle: nextCycle,
        bossName: nextName,
        maxHp: nextMaxHp,
        currentHp: nextMaxHp,
        lastDefeatedCycle: params.boss.cycle,
        lastFinisherName: params.codename.slice(0, 32),
        updatedAt: now,
      });
      return { defeatedCycle: true };
    }

    await updateDoc(bossRef, {
      currentHp: remaining,
      updatedAt: now,
    });
    return { defeatedCycle: false };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `clans/${params.clanId}/raid_boss/active`);
    return { defeatedCycle: false };
  }
}

// ===============================================================
// Live Timed Countdown Auctions
// ===============================================================
const TIMED_AUCTION_POOL: Array<{
  itemType: TimedAuctionDoc['itemType'];
  itemId: string;
  itemName: string;
  quantity: number;
  startBid: number;
}> = [
  { itemType: 'blueprint_pack', itemId: 'bp_3', itemName: 'حزمة مخططات صياغة نادرة ×3', quantity: 3, startBid: 1600 },
  { itemType: 'rune', itemId: 'armor_pierce', itemName: 'حجر اختراق الدروع (نادر)', quantity: 1, startBid: 1800 },
  { itemType: 'essence_crate', itemId: 'ess_40', itemName: 'صندوق جوهر الصياغة الملكي ×40', quantity: 40, startBid: 1400 },
  { itemType: 'crystal_pouch', itemId: 'cry_8', itemName: 'كيس بلورات الظل النقية ×8', quantity: 8, startBid: 3200 },
];

export function buildTimedAuctionPayload(cycle: number, nowTs = Date.now()): Omit<TimedAuctionDoc, 'id'> {
  const pick = TIMED_AUCTION_POOL[(cycle - 1) % TIMED_AUCTION_POOL.length];
  return {
    cycle,
    itemType: pick.itemType,
    itemId: pick.itemId,
    itemName: pick.itemName,
    quantity: pick.quantity,
    currentBid: pick.startBid,
    highestBidderUid: '',
    highestBidderName: '',
    endsAt: nowTs + 5 * 60 * 1000,
    claimedByWinner: false,
    createdAt: nowTs,
  };
}

export function subscribeTimedAuction(onData: (auction: TimedAuctionDoc | null) => void): () => void {
  const ref = doc(db, 'timed_auctions', 'featured');
  return onSnapshot(
    ref,
    async (snap) => {
      if (!snap.exists()) {
        const initDoc = buildTimedAuctionPayload(1, Date.now());
        try {
          await setDoc(ref, initDoc);
        } catch {
          // ignore race
        }
        onData({ id: 'featured', ...initDoc });
        return;
      }
      onData({ id: snap.id, ...(snap.data() as Omit<TimedAuctionDoc, 'id'>) });
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'timed_auctions/featured');
    }
  );
}

export async function placeTimedAuctionBid(params: {
  auction: TimedAuctionDoc;
  bidAmount: number;
  bidderUid: string;
  bidderName: string;
}): Promise<boolean> {
  if (params.bidAmount <= params.auction.currentBid) return false;
  try {
    await updateDoc(doc(db, 'timed_auctions', params.auction.id), {
      currentBid: Math.round(params.bidAmount),
      highestBidderUid: params.bidderUid,
      highestBidderName: params.bidderName.slice(0, 32),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `timed_auctions/${params.auction.id}`);
    return false;
  }
}

export async function claimTimedAuctionPrize(auctionId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'timed_auctions', auctionId), {
      claimedByWinner: true,
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `timed_auctions/${auctionId}`);
    return false;
  }
}

export async function rotateTimedAuction(currentCycle: number): Promise<boolean> {
  try {
    const next = buildTimedAuctionPayload(currentCycle + 1, Date.now());
    await updateDoc(doc(db, 'timed_auctions', 'featured'), next);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'timed_auctions/featured');
    return false;
  }
}

// ===============================================================
// Seasonal Hall of Fame
// ===============================================================
export function subscribeSeasonHall(onData: (entries: SeasonHallEntryDoc[]) => void): () => void {
  const q = query(collection(db, 'season_hall'), orderBy('seasonNumber', 'desc'), limit(12));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SeasonHallEntryDoc, 'id'>) })));
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'season_hall');
    }
  );
}

export async function recordSeasonChampion(entry: Omit<SeasonHallEntryDoc, 'id'>): Promise<boolean> {
  const key = `season_${entry.seasonNumber}`;
  try {
    const ref = doc(db, 'season_hall', key);
    const snap = await getDoc(ref);
    if (snap.exists()) return false;
    await setDoc(ref, entry);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `season_hall/${key}`);
    return false;
  }
}

// ===============================================================
// Referral System
// ===============================================================
export async function checkMyReferralClaimed(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'referrals', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function redeemReferralCode(params: {
  claimantUid: string;
  referrerUid: string;
  referrerCode: string;
}): Promise<boolean> {
  try {
    await setDoc(doc(db, 'referrals', params.claimantUid), {
      claimantUid: params.claimantUid,
      referrerUid: params.referrerUid,
      referrerCode: params.referrerCode.slice(0, 20),
      createdAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `referrals/${params.claimantUid}`);
    return false;
  }
}

// ===============================================================
// Formal 24-Hour Clan vs Clan Wars
// ===============================================================
export function subscribeClanWars(onData: (wars: ClanWarDoc[]) => void): () => void {
  const q = query(collection(db, 'clan_wars'), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClanWarDoc, 'id'>) }));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'clan_wars');
    }
  );
}

export async function declareClanWar(
  challengerClan: OnlineClanDoc,
  defenderClan: OnlineClanDoc
): Promise<boolean> {
  if (challengerClan.id === defenderClan.id) return false;
  const now = Date.now();
  try {
    await addDoc(collection(db, 'clan_wars'), {
      challengerClanId: challengerClan.id.slice(0, 64),
      challengerClanName: challengerClan.name.slice(0, 32),
      challengerFaction: challengerClan.factionId,
      defenderClanId: defenderClan.id.slice(0, 64),
      defenderClanName: defenderClan.name.slice(0, 32),
      defenderFaction: defenderClan.factionId,
      challengerScore: 0,
      defenderScore: 0,
      status: 'active',
      winnerClanId: '',
      createdAt: now,
      endsAt: now + 24 * 60 * 60 * 1000,
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'clan_wars');
    return false;
  }
}

export async function addClanWarScore(
  war: ClanWarDoc,
  actingClanId: string,
  points: number
): Promise<boolean> {
  if (war.status !== 'active') return false;
  const safePts = Math.max(1, Math.min(450, Math.round(points)));
  try {
    if (actingClanId === war.challengerClanId) {
      await updateDoc(doc(db, 'clan_wars', war.id), {
        challengerScore: increment(safePts),
      });
      return true;
    }
    if (actingClanId === war.defenderClanId) {
      await updateDoc(doc(db, 'clan_wars', war.id), {
        defenderScore: increment(safePts),
      });
      return true;
    }
    return false;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `clan_wars/${war.id}`);
    return false;
  }
}

export async function finalizeClanWar(war: ClanWarDoc): Promise<boolean> {
  if (war.status !== 'active') return false;
  const winnerClanId =
    war.challengerScore > war.defenderScore
      ? war.challengerClanId
      : war.defenderScore > war.challengerScore
      ? war.defenderClanId
      : 'draw';
  try {
    await updateDoc(doc(db, 'clan_wars', war.id), {
      status: 'finished',
      winnerClanId,
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `clan_wars/${war.id}`);
    return false;
  }
}

// ===============================================================
// Live Real-Time 1v1 PvP Duels (/live_duels)
// ===============================================================
export function subscribeLiveDuels(onData: (duels: LivePvpDuelDoc[]) => void): () => void {
  const q = query(collection(db, 'live_duels'), orderBy('updatedAt', 'desc'), limit(25));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LivePvpDuelDoc, 'id'>) }));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'live_duels');
    }
  );
}

export async function createLiveDuel(params: {
  challengerUid: string;
  challengerName: string;
  challengerFaction: FactionId;
  challengerPower: number;
  challengerMaxHp: number;
  stakeGold: number;
  targetOpponent?: PublicOperativeDoc | null;
}): Promise<string | null> {
  const now = Date.now();
  const safeMaxHp = Math.max(50, Math.min(100000, Math.round(params.challengerMaxHp)));
  const safeStake = Math.max(0, Math.min(500000, Math.round(params.stakeGold)));
  const target = params.targetOpponent;
  try {
    const docRef = await addDoc(collection(db, 'live_duels'), {
      challengerUid: params.challengerUid,
      challengerName: params.challengerName.slice(0, 32),
      challengerFaction: params.challengerFaction,
      challengerPower: Math.max(0, Math.min(100000000, Math.round(params.challengerPower))),
      challengerHp: safeMaxHp,
      challengerMaxHp: safeMaxHp,
      challengerAction: '',
      opponentUid: target ? target.uid.slice(0, 64) : '',
      opponentName: target ? target.codename.slice(0, 32) : '',
      opponentFaction: target ? target.factionId : params.challengerFaction,
      opponentPower: target ? Math.max(0, Math.round(target.powerScore)) : 0,
      opponentHp: 120,
      opponentMaxHp: 120,
      opponentAction: '',
      turn: 1,
      stakeGold: safeStake,
      status: 'open',
      winnerUid: '',
      lastSummary: target
        ? `تحدي مباشر موجّه إلى ${target.codename} — بانتظار القبول.`
        : 'غرفة مبارزة حية مفتوحة — بانتظار انضمام منافس.',
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'live_duels');
    return null;
  }
}

export async function joinLiveDuel(params: {
  duel: LivePvpDuelDoc;
  opponentUid: string;
  opponentName: string;
  opponentFaction: FactionId;
  opponentPower: number;
  opponentMaxHp: number;
}): Promise<boolean> {
  if (params.duel.status !== 'open' || params.duel.challengerUid === params.opponentUid) return false;
  if (params.duel.opponentUid && params.duel.opponentUid !== params.opponentUid) return false;
  const safeHp = Math.max(50, Math.min(100000, Math.round(params.opponentMaxHp)));
  try {
    await updateDoc(doc(db, 'live_duels', params.duel.id), {
      opponentUid: params.opponentUid,
      opponentName: params.opponentName.slice(0, 32),
      opponentFaction: params.opponentFaction,
      opponentPower: Math.max(0, Math.min(100000000, Math.round(params.opponentPower))),
      opponentHp: safeHp,
      opponentMaxHp: safeHp,
      status: 'active',
      lastSummary: `انضم ${params.opponentName.slice(0, 32)}! بدأت الجولة الأولى — اختر حركتك.`,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `live_duels/${params.duel.id}`);
    return false;
  }
}

export async function cancelLiveDuel(duelId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'live_duels', duelId), {
      status: 'finished',
      lastSummary: 'تم إلغاء التحدي قبل بدء النزال.',
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `live_duels/${duelId}`);
    return false;
  }
}

function getLiveActionLabel(act: LiveDuelAction): string {
  if (act === 'strike') return 'ضربة خاطفة';
  if (act === 'guard') return 'دفاع محصّن';
  if (act === 'counter') return 'هجوم مضاد';
  if (act === 'ultimate') return 'ضربة قاضية';
  return 'انتظار';
}

function resolveLiveTurnExchange(
  attackerAction: LiveDuelAction,
  defenderAction: LiveDuelAction,
  attackerPower: number
): number {
  const baseDmg = Math.max(18, Math.round(attackerPower * 0.14));
  let mult = 1;
  if (attackerAction === 'strike') {
    mult = defenderAction === 'counter' ? 1.35 : defenderAction === 'guard' ? 0.55 : 1.05;
  } else if (attackerAction === 'counter') {
    mult = defenderAction === 'ultimate' ? 1.45 : defenderAction === 'strike' ? 0.65 : 1.0;
  } else if (attackerAction === 'ultimate') {
    mult = defenderAction === 'guard' ? 1.55 : defenderAction === 'counter' ? 0.75 : 1.35;
  } else if (attackerAction === 'guard') {
    mult = 0.25;
  }
  return Math.max(8, Math.round(baseDmg * mult));
}

export async function submitLiveDuelMove(params: {
  duel: LivePvpDuelDoc;
  myUid: string;
  action: Exclude<LiveDuelAction, ''>;
}): Promise<boolean> {
  const { duel, myUid, action } = params;
  if (duel.status !== 'active') return false;
  const isChallenger = myUid === duel.challengerUid;
  const isOpponent = myUid === duel.opponentUid;
  if (!isChallenger && !isOpponent) return false;

  const nextChallengerAct: LiveDuelAction = isChallenger ? action : duel.challengerAction;
  const nextOpponentAct: LiveDuelAction = isOpponent ? action : duel.opponentAction;

  const now = Date.now();
  try {
    // If the other player hasn't chosen yet, record my choice and wait
    if (!nextChallengerAct || !nextOpponentAct) {
      await updateDoc(doc(db, 'live_duels', duel.id), {
        ...(isChallenger ? { challengerAction: action } : { opponentAction: action }),
        lastSummary: `جولة ${duel.turn}: سجّل ${isChallenger ? duel.challengerName : duel.opponentName} حركته — بانتظار الخصم...`,
        updatedAt: now,
      });
      return true;
    }

    // Both actions are ready — deterministically resolve turn!
    const dmgToOpponent = resolveLiveTurnExchange(nextChallengerAct, nextOpponentAct, duel.challengerPower);
    const dmgToChallenger = resolveLiveTurnExchange(nextOpponentAct, nextChallengerAct, duel.opponentPower);

    const healC = nextChallengerAct === 'guard' ? Math.round(duel.challengerMaxHp * 0.06) : 0;
    const healO = nextOpponentAct === 'guard' ? Math.round(duel.opponentMaxHp * 0.06) : 0;

    const nextChallengerHp = Math.max(
      0,
      Math.min(duel.challengerMaxHp, duel.challengerHp - dmgToChallenger + healC)
    );
    const nextOpponentHp = Math.max(
      0,
      Math.min(duel.opponentMaxHp, duel.opponentHp - dmgToOpponent + healO)
    );

    let status: 'active' | 'finished' = 'active';
    let winnerUid = '';
    if (nextChallengerHp === 0 && nextOpponentHp === 0) {
      status = 'finished';
      winnerUid = duel.challengerPower >= duel.opponentPower ? duel.challengerUid : duel.opponentUid;
    } else if (nextOpponentHp === 0) {
      status = 'finished';
      winnerUid = duel.challengerUid;
    } else if (nextChallengerHp === 0) {
      status = 'finished';
      winnerUid = duel.opponentUid;
    }

    const summary = `جولة ${duel.turn}: ${duel.challengerName} (${getLiveActionLabel(nextChallengerAct)} -${dmgToOpponent}) ضد ${duel.opponentName} (${getLiveActionLabel(nextOpponentAct)} -${dmgToChallenger})`.slice(
      0,
      210
    );

    await updateDoc(doc(db, 'live_duels', duel.id), {
      challengerHp: nextChallengerHp,
      opponentHp: nextOpponentHp,
      challengerAction: '',
      opponentAction: '',
      turn: status === 'finished' ? duel.turn : duel.turn + 1,
      status,
      winnerUid,
      lastSummary: summary,
      updatedAt: now,
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `live_duels/${duel.id}`);
    return false;
  }
}

// ===============================================================
// Multiplayer 2-4 Player Co-op Heist Rooms (/coop_heists)
// ===============================================================
export function subscribeCoopHeists(onData: (heists: CoopHeistDoc[]) => void): () => void {
  const q = query(collection(db, 'coop_heists'), orderBy('updatedAt', 'desc'), limit(20));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CoopHeistDoc, 'id'>) }));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'coop_heists');
    }
  );
}

export async function createCoopHeist(params: {
  hostUid: string;
  hostName: string;
  hostFaction: FactionId;
  hostPower: number;
  template: CoopHeistTemplateDef;
}): Promise<string | null> {
  const now = Date.now();
  const cleanName = params.hostName.replace(/\|/g, '').slice(0, 28) || 'عميل';
  const summaryEntry = `${params.hostUid}|${cleanName}|${params.hostFaction}|${Math.round(params.hostPower)}|0`;
  try {
    const docRef = await addDoc(collection(db, 'coop_heists'), {
      hostUid: params.hostUid,
      hostName: cleanName,
      templateId: params.template.id,
      title: params.template.title,
      difficulty: params.template.difficulty,
      bossName: params.template.bossName,
      maxPlayers: 4,
      bossMaxHp: params.template.bossMaxHp,
      bossCurrentHp: params.template.bossMaxHp,
      phase: 1,
      status: 'recruiting',
      memberUids: [params.hostUid],
      memberSummaries: [summaryEntry],
      lastActionText: `أسس ${cleanName} غرفة سطو جديدة — بانتظار انضمام 2–4 عملاء.`,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'coop_heists');
    return null;
  }
}

export async function joinCoopHeist(params: {
  heist: CoopHeistDoc;
  uid: string;
  codename: string;
  factionId: FactionId;
  powerScore: number;
}): Promise<boolean> {
  const { heist, uid, codename, factionId, powerScore } = params;
  if (heist.status !== 'recruiting') return false;
  if (heist.memberUids.includes(uid) || heist.memberUids.length >= 4) return false;
  const cleanName = codename.replace(/\|/g, '').slice(0, 28) || 'عميل';
  const summaryEntry = `${uid}|${cleanName}|${factionId}|${Math.round(powerScore)}|0`;
  try {
    await updateDoc(doc(db, 'coop_heists', heist.id), {
      memberUids: [...heist.memberUids, uid],
      memberSummaries: [...heist.memberSummaries, summaryEntry],
      lastActionText: `انضم ${cleanName} إلى فرقة السطو (${heist.memberUids.length + 1}/4)!`,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `coop_heists/${heist.id}`);
    return false;
  }
}

export async function launchCoopHeist(heist: CoopHeistDoc, hostUid: string): Promise<boolean> {
  if (heist.status !== 'recruiting' || heist.hostUid !== hostUid || heist.memberUids.length < 2) {
    return false;
  }
  try {
    await updateDoc(doc(db, 'coop_heists', heist.id), {
      status: 'active',
      lastActionText: `انطلقت فرقة الـ ${heist.memberUids.length} عملاء! اضربوا ${heist.bossName} قبل نفاد الوقت!`,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `coop_heists/${heist.id}`);
    return false;
  }
}

export async function strikeCoopHeist(params: {
  heist: CoopHeistDoc;
  uid: string;
  codename: string;
  damage: number;
}): Promise<{ completed: boolean }> {
  const { heist, uid, codename, damage } = params;
  if (heist.status !== 'active' || !heist.memberUids.includes(uid)) return { completed: false };
  const safeDamage = Math.max(40, Math.min(heist.bossCurrentHp, Math.round(damage)));
  const nextHp = Math.max(0, heist.bossCurrentHp - safeDamage);
  const ratio = nextHp / Math.max(1, heist.bossMaxHp);
  const nextPhase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
  const completed = nextHp === 0;

  const updatedSummaries = heist.memberSummaries.map((entry) => {
    const parts = entry.split('|');
    if (parts[0] !== uid) return entry;
    const prevDmg = Number(parts[4] || 0);
    return `${parts[0]}|${parts[1]}|${parts[2]}|${parts[3]}|${prevDmg + safeDamage}`;
  });

  try {
    await updateDoc(doc(db, 'coop_heists', heist.id), {
      bossCurrentHp: nextHp,
      phase: nextPhase,
      status: completed ? 'completed' : 'active',
      memberSummaries: updatedSummaries,
      lastActionText: completed
        ? `أسقط ${codename} حارس الخزنة بضربة ${safeDamage}! الخزنة مفتوحة للجميع!`
        : `سدد ${codename} ضربة بـ ${safeDamage} ضرر (المرحلة ${nextPhase}/3)`,
      updatedAt: Date.now(),
    });
    return { completed };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `coop_heists/${heist.id}`);
    return { completed: false };
  }
}




