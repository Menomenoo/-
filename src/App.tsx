import { useCallback, useEffect, useRef, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  ACHIEVEMENTS,
  ARENA_OPPONENTS,
  CLAN_UNITS,
  COMBAT_SKILLS,
  COMPANIONS,
  COOP_HEIST_TEMPLATES,
  COSMETICS_CATALOG,
  DAILY_QUESTS,
  DISTRICT_SHARES,
  FACTIONS,
  FORGED_WEAPON_IMAGE,
  HQ_MODULES,
  LIVE_EVENTS_META,
  MARKET_COMMODITIES,
  MAX_SEASON_TIERS,
  MISSIONS,
  RESEARCH_TRACKS,
  RUNES_CATALOG,
  SEASON_TIER_XP,
  STORY_CASES,
  SUB_SPECS,
  TERRITORY_DISTRICTS,
  WORLD_BOSSES,
  createInitialTerritoryScores,
  createNewPlayerState,
  getAttributeUpgradeCost,
  getCompanionUpgradeCost,
  getCurrentSeasonInfo,
  getEquipmentEnhanceCost,
  getHqUpgradeCost,
  getPrestigeLevelRequirement,
  getResearchUpgradeCost,
  getSeasonDecree,
  getTodayDateKey,
  getTournamentBetCycle,
  getWarHourStatus,
  getWeekendSurgeStatus,
  getXpForNextLevel,
  resolveTournamentBetResult,
} from './data/gameData';
import {
  ActiveDuelState,
  ActiveTab,
  ArenaOpponentDef,
  AuctionListingDoc,
  BountyDoc,
  ClanMemberDoc,
  ClanMessageDoc,
  ClanRaidBossDoc,
  ClanRaidDamageDoc,
  ClanUnitId,
  ClanWarDoc,
  CombatSkillId,
  CompanionId,
  CoopHeistDoc,
  CoopHeistTemplateDef,
  CosmeticId,
  EquipmentItem,
  EquipmentSlot,
  EventLogEntry,
  FactionId,
  GameState,
  GlobalChatMessageDoc,
  HqModuleId,
  LiveDuelAction,
  LiveEventId,
  LivePvpDuelDoc,
  MarketStateItem,
  MissionDef,
  NemesisEntry,
  NightHuntZoneDef,
  OnlineClanDoc,
  PlayerAttributes,
  PlayerSaveState,
  PublicOperativeDoc,
  PvpAlertDoc,
  RaidReport,
  RaidStance,
  RaidTarget,
  ResearchId,
  RuneId,
  SeasonHallEntryDoc,
  ServerBossDamageDoc,
  ServerBossDoc,
  StoryCaseChoice,
  StoryCaseDef,
  SubSpecId,
  TerritorySectorState,
  TimedAuctionDoc,
  TournamentState,
} from './types/game';
import {
  generateRaidTargets,
  getActiveSubSpec,
  getEffectiveAttributes,
  getPlayerPowerScore,
  initArenaDuel,
  simulateCompanionDuel,
  simulateTowerFloorBattle,
  simulateVaultRaid,
  simulateWorldBossStrike,
  stepArenaDuel,
} from './utils/combatEngine';
import { auth, googleProvider, testConnection } from './firebase';
import {
  addClanWarPoints,
  addClanWarScore,
  buyAuctionListing,
  cancelAuctionListing,
  cancelBounty,
  cancelLiveDuel,
  checkMyReferralClaimed,
  claimBounty,
  claimTimedAuctionPrize,
  contributeTerritoryScore,
  createAuctionListing,
  createBounty,
  createCoopHeist,
  createLiveDuel,
  createOnlineClan,
  declareClanWar,
  donateToOnlineClan,
  ensureUserProfile,
  finalizeClanWar,
  joinCoopHeist,
  joinLiveDuel,
  joinOnlineClan,
  launchCoopHeist,
  leaveOnlineClan,
  loadCloudOperative,
  placeTimedAuctionBid,
  recordSeasonChampion,
  redeemReferralCode,
  resolvePvpAlert,
  rotateTimedAuction,
  sendClanChatMessage,
  sendGlobalChatMessage,
  sendPvpAlert,
  strikeClanRaidBoss,
  strikeCoopHeist,
  strikeSharedServerBoss,
  submitLiveDuelMove,
  subscribeAuctionListings,
  subscribeBounties,
  subscribeClanMembers,
  subscribeClanMessages,
  subscribeClanRaidBoss,
  subscribeClanRaidDamage,
  subscribeClanWars,
  subscribeCoopHeists,
  subscribeGlobalChat,
  subscribeLiveDuels,
  subscribeOnlineClans,
  subscribePublicOperatives,
  subscribePvpAlerts,
  subscribeSeasonHall,
  subscribeServerBoss,
  subscribeServerBossDamage,
  subscribeTerritorySectors,
  subscribeTimedAuction,
  syncOperativeToCloud,
  upgradeOnlineClan,
} from './services/onlineService';
import { soundFX } from './utils/sound';
import { TitleScreen } from './components/TitleScreen';
import { TopBar } from './components/TopBar';
import { OperativeHud } from './components/OperativeHud';
import { MissionsView } from './components/MissionsView';
import { RaidsView } from './components/RaidsView';
import { SkillsView } from './components/SkillsView';
import { HqView } from './components/HqView';
import { EconomyView } from './components/EconomyView';
import { SovereigntyModal } from './components/SovereigntyModal';

const STORAGE_KEY = 'shadow_factions_rpg_v1';

const EVENT_ROTATION_ORDER: LiveEventId[] = ['blood_moon', 'market_shock', 'city_invasion'];

const TOURNAMENT_NAMES: Record<FactionId, string[]> = {
  shadow_hunters: ['شبح الخنجر', 'ساري الليل', 'صياد الضباب', 'ظل الأوبسيديان'],
  tech_wardens: ['درع المصفوفة', 'مهندس القوس', 'نبض التيتانيوم', 'حارس البرج'],
  blood_mages: ['ساحر الياقوت', 'وريث الدم', 'أمين الكأس', 'كيميائي الغسق'],
};

function migrateSavedPlayer(rawObj: Partial<PlayerSaveState>): PlayerSaveState | null {
  if (!rawObj || !rawObj.factionId || !FACTIONS[rawObj.factionId]) return null;
  const base = createNewPlayerState(rawObj.codename || 'شبح الليل', rawObj.factionId);
  const defaultTerritory = createInitialTerritoryScores();
  const mergedTerritory: Record<string, Record<FactionId, number>> = { ...defaultTerritory };
  if (rawObj.territoryWarScores) {
    for (const key of Object.keys(defaultTerritory)) {
      if (rawObj.territoryWarScores[key]) {
        mergedTerritory[key] = { ...defaultTerritory[key], ...rawObj.territoryWarScores[key] };
      }
    }
  }

  const merged: PlayerSaveState = {
    ...base,
    ...rawObj,
    subSpecId: rawObj.subSpecId ?? base.subSpecId,
    craftingEssence: rawObj.craftingEssence ?? base.craftingEssence,
    towerFloor: rawObj.towerFloor ?? base.towerFloor,
    towerBestFloor: rawObj.towerBestFloor ?? base.towerBestFloor,
    tournamentWins: rawObj.tournamentWins ?? base.tournamentWins,
    activeEventId: rawObj.activeEventId ?? base.activeEventId,
    eventShockCommodityId: rawObj.eventShockCommodityId ?? base.eventShockCommodityId,
    eventShockMultiplier: rawObj.eventShockMultiplier ?? base.eventShockMultiplier,
    eventStartedAt: rawObj.eventStartedAt ?? base.eventStartedAt,
    invasionWaveHp: rawObj.invasionWaveHp ?? base.invasionWaveHp,
    invasionWaveMaxHp: rawObj.invasionWaveMaxHp ?? base.invasionWaveMaxHp,
    clanId: rawObj.clanId ?? base.clanId,
    firstPurchaseUsed: rawObj.firstPurchaseUsed ?? base.firstPurchaseUsed,
    lastMysteryBoxAt: rawObj.lastMysteryBoxAt ?? base.lastMysteryBoxAt,
    mysteryBoxWins: rawObj.mysteryBoxWins ?? base.mysteryBoxWins,
    lastWheelDate: rawObj.lastWheelDate ?? base.lastWheelDate,
    wheelSpinsToday: rawObj.wheelSpinsToday ?? base.wheelSpinsToday,
    lastClaimedServerBossCycle: rawObj.lastClaimedServerBossCycle ?? base.lastClaimedServerBossCycle,
    lastClaimedClanBossCycle: rawObj.lastClaimedClanBossCycle ?? 0,
    lastClaimedSeasonNumber: rawObj.lastClaimedSeasonNumber ?? 0,
    claimedClanWarIds: rawObj.claimedClanWarIds ?? [],
    seasonMedals: rawObj.seasonMedals ?? 0,
    referralClaimed: rawObj.referralClaimed ?? false,
    tutorialStep: rawObj.tutorialStep ?? 3,
    blueprints: rawObj.blueprints ?? base.blueprints,
    equippedCombatSkills: rawObj.equippedCombatSkills ?? base.equippedCombatSkills,
    craftedItems: rawObj.craftedItems ?? [],
    ownedCosmetics: rawObj.ownedCosmetics ?? [],
    equippedFrame: rawObj.equippedFrame ?? null,
    equippedChatColor: rawObj.equippedChatColor ?? null,
    friendUids: rawObj.friendUids ?? [],
    nemeses: rawObj.nemeses ?? {},
    claimedLiveDuelIds: rawObj.claimedLiveDuelIds ?? [],
    claimedHeistIds: rawObj.claimedHeistIds ?? [],
    activeStoryCase: rawObj.activeStoryCase ?? null,
    storyCaseCooldowns: rawObj.storyCaseCooldowns ?? {},
    activeTournamentBet: rawObj.activeTournamentBet ?? null,
    attributes: { ...base.attributes, ...(rawObj.attributes || {}) },
    researchLevels: { ...base.researchLevels, ...(rawObj.researchLevels || {}) },
    hqLevels: { ...base.hqLevels, ...(rawObj.hqLevels || {}) },
    equipped: { ...base.equipped, ...(rawObj.equipped || {}) },
    equipmentEnhance: { ...(rawObj.equipmentEnhance || {}) },
    ownedRunes: { ...base.ownedRunes, ...(rawObj.ownedRunes || {}) },
    socketedRunes: { ...base.socketedRunes, ...(rawObj.socketedRunes || {}) },
    ownedCompanions: { ...base.ownedCompanions, ...(rawObj.ownedCompanions || {}) },
    clanUnits: { ...base.clanUnits, ...(rawObj.clanUnits || {}) },
    market: { ...base.market, ...(rawObj.market || {}) },
    districtShares: { ...base.districtShares, ...(rawObj.districtShares || {}) },
    dominance: { ...base.dominance, ...(rawObj.dominance || {}) },
    territoryWarScores: mergedTerritory,
    dailyProgress: { ...base.dailyProgress, ...(rawObj.dailyProgress || {}) },
    claimedAchievements: { ...(rawObj.claimedAchievements || {}) },
    stats: { ...base.stats, ...(rawObj.stats || {}) },
  };

  const today = getTodayDateKey();
  if (merged.dailyDateKey !== today) {
    merged.dailyDateKey = today;
    merged.loginStreak = (merged.loginStreak || 0) + 1;
    merged.dailyStreakClaimed = false;
    merged.dailyProgress = { missions: 0, raids: 0, trades: 0, upgrades: 0, bossHits: 0 };
    merged.claimedDailyQuests = [];
    merged.lastWheelDate = today;
    merged.wheelSpinsToday = 0;
  }

  return merged;
}

function loadSavedPlayer(): PlayerSaveState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlayerSaveState>;
    return migrateSavedPlayer(parsed);
  } catch {
    return null;
  }
}

function applyOfflineGains(player: PlayerSaveState): { next: PlayerSaveState; offlineGold: number } {
  const now = Date.now();
  const elapsedSec = Math.min(7 * 86400, Math.max(0, Math.floor((now - (player.lastOnlineAt || now)) / 1000)));
  if (elapsedSec < 30) {
    return { next: { ...player, lastOnlineAt: now }, offlineGold: 0 };
  }

  const cycles = Math.floor(elapsedSec / 15);
  const subSpec = getActiveSubSpec(player);
  const subSpecHqMult = 1 + (subSpec?.bonuses.hqYieldPct || 0) / 100;
  const researchYieldBonus = 1 + (player.researchLevels?.refinery_protocol || 0) * 0.06;
  const refineryBase = 55 + (player.hqLevels.refinery - 1) * 55;
  const refineryMult =
    (player.unlockedPerks.includes('tw_grid_overclock') ? 1.25 : 1) *
    subSpecHqMult *
    researchYieldBonus *
    (1 + player.prestigeRank * 0.25);
  const refineryGold = Math.round(refineryBase * refineryMult);
  const shareGold = Math.round(
    DISTRICT_SHARES.reduce((sum, d) => sum + (player.districtShares[d.id] || 0) * d.dividendPerCycle, 0) *
      researchYieldBonus *
      subSpecHqMult
  );

  const effectiveCycles = Math.min(cycles, 960);
  const offlineGold = (refineryGold + shareGold) * effectiveCycles;
  const energyRecovered = Math.floor(elapsedSec / 12);

  return {
    offlineGold,
    next: {
      ...player,
      pendingVaultGold: player.pendingVaultGold + offlineGold,
      energy: Math.min(player.maxEnergy, player.energy + energyRecovered),
      lastOnlineAt: now,
      lastVaultTick: now,
      lastEnergyTick: now,
    },
  };
}

function applyXpAndLevelUp(player: PlayerSaveState, xpGain: number): { next: PlayerSaveState; leveledUp: boolean } {
  let level = player.level;
  let xp = player.xp + xpGain;
  let maxHp = player.maxHp;
  let hp = player.hp;
  let leveledUp = false;

  while (xp >= getXpForNextLevel(level)) {
    xp -= getXpForNextLevel(level);
    level += 1;
    maxHp += 20;
    hp = maxHp;
    leveledUp = true;
  }

  return {
    next: { ...player, level, xp, maxHp, hp },
    leveledUp,
  };
}

function appendLog(
  logs: EventLogEntry[],
  category: EventLogEntry['category'],
  message: string,
  tone: EventLogEntry['tone'] = 'neutral'
): EventLogEntry[] {
  const entry: EventLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    category,
    message,
    tone,
  };
  return [entry, ...logs].slice(0, 30);
}

function rollMarketPrices(currentMarket: Record<string, MarketStateItem>): Record<string, MarketStateItem> {
  const updated: Record<string, MarketStateItem> = {};
  for (const comm of MARKET_COMMODITIES) {
    const prevItem = currentMarket[comm.id] || {
      id: comm.id,
      currentPrice: comm.basePrice,
      previousPrice: comm.basePrice,
      owned: 0,
      avgBuyPrice: 0,
    };
    const deltaPct = (Math.random() * 2 - 1) * comm.volatility;
    const reversion = ((comm.basePrice - prevItem.currentPrice) / comm.basePrice) * 0.18;
    const rawNext = Math.round(prevItem.currentPrice * (1 + deltaPct + reversion));
    const clamped = Math.max(comm.minPrice, Math.min(comm.maxPrice, rawNext));

    updated[comm.id] = {
      ...prevItem,
      previousPrice: prevItem.currentPrice,
      currentPrice: clamped,
    };
  }
  return updated;
}

function buildNextLiveEventFields(current: PlayerSaveState, nowTs: number): Partial<PlayerSaveState> {
  const currentIdx = EVENT_ROTATION_ORDER.indexOf(current.activeEventId);
  const nextEventId = EVENT_ROTATION_ORDER[(currentIdx + 1) % EVENT_ROTATION_ORDER.length];
  const randomComm = MARKET_COMMODITIES[Math.floor(Math.random() * MARKET_COMMODITIES.length)];
  const isSurge = Math.random() >= 0.45;
  const shockMult = isSurge ? 1.85 : 0.6;
  const waveHp = 4500 + current.level * 450;

  return {
    activeEventId: nextEventId,
    eventShockCommodityId: randomComm.id,
    eventShockMultiplier: shockMult,
    eventStartedAt: nowTs,
    invasionWaveHp: waveHp,
    invasionWaveMaxHp: waveHp,
  };
}

function buildTournamentOpponent(playerPower: number, round: number): {
  opponentName: string;
  opponentFaction: FactionId;
  opponentPower: number;
} {
  const factions = Object.keys(FACTIONS) as FactionId[];
  const faction = factions[Math.floor(Math.random() * factions.length)];
  const pool = TOURNAMENT_NAMES[faction];
  const name = pool[(round + Math.floor(Math.random() * pool.length)) % pool.length];
  const mult = round === 1 ? 0.78 : round === 2 ? 0.95 : round === 3 ? 1.12 : 1.28;
  return {
    opponentName: `${name} · جولة ${round}`,
    opponentFaction: faction,
    opponentPower: Math.max(80, Math.round(playerPower * mult)),
  };
}

export default function App() {
  const [savedPlayer, setSavedPlayer] = useState<PlayerSaveState | null>(() => loadSavedPlayer());
  const [cloudSave, setCloudSave] = useState<PlayerSaveState | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [player, setPlayer] = useState<PlayerSaveState | null>(savedPlayer);
  const [activeTab, setActiveTab] = useState<ActiveTab>('missions');
  const [now, setNow] = useState<number>(() => Date.now());
  const [isMuted, setIsMuted] = useState<boolean>(() => soundFX.isMuted());

  const [raidTargets, setRaidTargets] = useState<RaidTarget[]>([]);
  const [latestRaidReport, setLatestRaidReport] = useState<RaidReport | null>(null);
  const [activeDuel, setActiveDuel] = useState<ActiveDuelState | null>(null);
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [companionDuelLog, setCompanionDuelLog] = useState<{
    victory: boolean;
    title: string;
    logs: string[];
    rewardText: string;
  } | null>(null);
  const [towerLastResult, setTowerLastResult] = useState<{
    floor: number;
    victory: boolean;
    enemyName: string;
    rounds: string[];
    lootText: string;
  } | null>(null);

  const [onlineOperatives, setOnlineOperatives] = useState<PublicOperativeDoc[]>([]);
  const [onlineClans, setOnlineClans] = useState<OnlineClanDoc[]>([]);
  const [myClanMembers, setMyClanMembers] = useState<ClanMemberDoc[]>([]);
  const [myClanMessages, setMyClanMessages] = useState<ClanMessageDoc[]>([]);
  const [auctionListings, setAuctionListings] = useState<AuctionListingDoc[]>([]);
  const [liveSectors, setLiveSectors] = useState<TerritorySectorState[]>([]);
  const [pvpAlerts, setPvpAlerts] = useState<PvpAlertDoc[]>([]);
  const [serverBoss, setServerBoss] = useState<ServerBossDoc | null>(null);
  const [serverBossDamages, setServerBossDamages] = useState<ServerBossDamageDoc[]>([]);
  const [globalChatMessages, setGlobalChatMessages] = useState<GlobalChatMessageDoc[]>([]);
  const [bounties, setBounties] = useState<BountyDoc[]>([]);
  const [clanRaidBoss, setClanRaidBoss] = useState<ClanRaidBossDoc | null>(null);
  const [clanRaidDamages, setClanRaidDamages] = useState<ClanRaidDamageDoc[]>([]);
  const [clanWars, setClanWars] = useState<ClanWarDoc[]>([]);
  const [timedAuction, setTimedAuction] = useState<TimedAuctionDoc | null>(null);
  const [seasonHallEntries, setSeasonHallEntries] = useState<SeasonHallEntryDoc[]>([]);
  const [liveDuels, setLiveDuels] = useState<LivePvpDuelDoc[]>([]);
  const [coopHeists, setCoopHeists] = useState<CoopHeistDoc[]>([]);
  const [pendingRefCode, setPendingRefCode] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get('ref') || '').trim().toUpperCase();
    } catch {
      return '';
    }
  });

  const [storeOpen, setStoreOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: 'positive' | 'warning' } | null>(null);

  const lastCloudSyncRef = useRef<number>(0);
  const seasonDecree = getSeasonDecree(seasonHallEntries);
  const seasonDecreeRef = useRef(seasonDecree);
  seasonDecreeRef.current = seasonDecree;

  const showToast = useCallback((text: string, tone: 'positive' | 'warning' = 'positive') => {
    setToast({ text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Firebase Auth Bootstrap & Cloud Save Fetch
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user && user.emailVerified) {
        await testConnection();
        await ensureUserProfile(user);
        const [rawCloud, alreadyReferred] = await Promise.all([
          loadCloudOperative(user.uid),
          checkMyReferralClaimed(user.uid),
        ]);
        if (rawCloud) {
          const migrated = migrateSavedPlayer(rawCloud);
          setCloudSave(migrated ? { ...migrated, referralClaimed: migrated.referralClaimed || alreadyReferred } : null);
        } else {
          setCloudSave(null);
        }
      } else {
        setCloudSave(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Firestore Real-Time Listeners (only when verified user is signed in)
  useEffect(() => {
    if (!authUser || !authUser.emailVerified) {
      setOnlineOperatives([]);
      setOnlineClans([]);
      setAuctionListings([]);
      setLiveSectors([]);
      setPvpAlerts([]);
      setServerBoss(null);
      setServerBossDamages([]);
      setGlobalChatMessages([]);
      setBounties([]);
      setClanWars([]);
      setTimedAuction(null);
      setSeasonHallEntries([]);
      setLiveDuels([]);
      setCoopHeists([]);
      return;
    }

    const unsubOps = subscribePublicOperatives(setOnlineOperatives);
    const unsubClans = subscribeOnlineClans(setOnlineClans);
    const unsubAuction = subscribeAuctionListings(setAuctionListings);
    const unsubSectors = subscribeTerritorySectors(setLiveSectors);
    const unsubAlerts = subscribePvpAlerts(authUser.uid, setPvpAlerts);
    const unsubBoss = subscribeServerBoss(setServerBoss);
    const unsubBossDmg = subscribeServerBossDamage(setServerBossDamages);
    const unsubGlobalChat = subscribeGlobalChat(setGlobalChatMessages);
    const unsubBounties = subscribeBounties(setBounties);
    const unsubClanWars = subscribeClanWars(setClanWars);
    const unsubTimedAuction = subscribeTimedAuction(setTimedAuction);
    const unsubSeasonHall = subscribeSeasonHall(setSeasonHallEntries);
    const unsubLiveDuels = subscribeLiveDuels(setLiveDuels);
    const unsubCoopHeists = subscribeCoopHeists(setCoopHeists);

    return () => {
      unsubOps();
      unsubClans();
      unsubAuction();
      unsubSectors();
      unsubAlerts();
      unsubBoss();
      unsubBossDmg();
      unsubGlobalChat();
      unsubBounties();
      unsubClanWars();
      unsubTimedAuction();
      unsubSeasonHall();
      unsubLiveDuels();
      unsubCoopHeists();
    };
  }, [authUser]);

  // Auto-Nemesis Rivalry Detection from incoming PvP raid alerts
  useEffect(() => {
    if (!player || !pvpAlerts.length) return;
    const agg: Record<
      string,
      {
        uid: string;
        codename: string;
        factionId: FactionId;
        powerScore: number;
        raidCount: number;
        totalStolen: number;
      }
    > = {};

    for (const a of pvpAlerts) {
      if (a.alertType !== 'raid_incoming' || !a.attackerUid || a.attackerUid === authUser?.uid) continue;
      if (!agg[a.attackerUid]) {
        agg[a.attackerUid] = {
          uid: a.attackerUid,
          codename: a.attackerName,
          factionId: a.attackerFaction,
          powerScore: a.attackerPower,
          raidCount: 0,
          totalStolen: 0,
        };
      }
      agg[a.attackerUid].raidCount += 1;
      agg[a.attackerUid].totalStolen += a.goldAmount || 0;
      agg[a.attackerUid].powerScore = Math.max(agg[a.attackerUid].powerScore, a.attackerPower || 0);
    }

    const currentNemeses = player.nemeses || {};
    let newRivalName: string | null = null;
    let updatedNemeses: Record<string, NemesisEntry> | null = null;

    for (const item of Object.values(agg)) {
      if (item.raidCount >= 2 || item.totalStolen >= 1500) {
        const existing = currentNemeses[item.uid];
        if (!existing || existing.raidCount !== item.raidCount || existing.totalStolen !== item.totalStolen) {
          if (!updatedNemeses) updatedNemeses = { ...currentNemeses };
          if (!existing) newRivalName = item.codename;
          updatedNemeses[item.uid] = {
            uid: item.uid,
            codename: item.codename,
            factionId: item.factionId,
            powerScore: item.powerScore,
            raidCount: item.raidCount,
            totalStolen: item.totalStolen,
            markedAt: existing?.markedAt || Date.now(),
          };
        }
      }
    }

    if (updatedNemeses) {
      setPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          nemeses: updatedNemeses!,
          logs: newRivalName
            ? appendLog(prev.logs, 'raid', `تم تصنيف ${newRivalName} كـ خصم لدود (+25% غنيمة عند هزيمته)!`, 'warning')
            : prev.logs,
        };
      });
      if (newRivalName) {
        showToast(`خصم لدود جديد: ${newRivalName} (+25% غنيمة عند الانتقام!)`, 'warning');
      }
    }
  }, [pvpAlerts, player, authUser?.uid, showToast]);

  // Real-time Clan Members, Clan Chat & Clan Weekly Raid Boss subscription
  const activeClanId = player?.clanId || null;
  useEffect(() => {
    if (!authUser || !authUser.emailVerified || !activeClanId) {
      setMyClanMembers([]);
      setMyClanMessages([]);
      setClanRaidBoss(null);
      setClanRaidDamages([]);
      return;
    }

    const unsubMembers = subscribeClanMembers(activeClanId, setMyClanMembers);
    const unsubMsgs = subscribeClanMessages(activeClanId, setMyClanMessages);
    const unsubClanBoss = subscribeClanRaidBoss(activeClanId, setClanRaidBoss);
    const unsubClanBossDmg = subscribeClanRaidDamage(activeClanId, setClanRaidDamages);

    return () => {
      unsubMembers();
      unsubMsgs();
      unsubClanBoss();
      unsubClanBossDmg();
    };
  }, [authUser, activeClanId]);

  // Local Save Sync + Debounced Cloud Sync
  useEffect(() => {
    if (!player) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
      setSavedPlayer(player);
    } catch {
      // ignore storage errors
    }

    if (authUser && authUser.emailVerified && gameState === 'PLAYING') {
      const elapsed = Date.now() - lastCloudSyncRef.current;
      if (elapsed >= 6000) {
        lastCloudSyncRef.current = Date.now();
        void syncOperativeToCloud(authUser.uid, player);
      } else {
        const timer = setTimeout(() => {
          lastCloudSyncRef.current = Date.now();
          void syncOperativeToCloud(authUser.uid, player);
        }, 6000 - elapsed);
        return () => clearTimeout(timer);
      }
    }
  }, [player, authUser, gameState]);

  useEffect(() => {
    if (player && gameState === 'PLAYING' && raidTargets.length === 0) {
      setRaidTargets(generateRaidTargets(player, onlineOperatives, authUser?.uid));
    }
  }, [player, gameState, raidTargets.length, onlineOperatives, authUser]);

  const resolveMission = useCallback(
    (current: PlayerSaveState, missionDef: MissionDef): PlayerSaveState => {
      const faction = FACTIONS[current.factionId];
      const bloodMoonMult = current.activeEventId === 'blood_moon' ? 2 : 1;
      const weekendSurgeMult = getWeekendSurgeStatus().isActive ? 1.35 : 1;
      const prestigeMult = 1 + current.prestigeRank * 0.25;
      const goldMult =
        faction.bonuses.missionGoldMult * (current.vipActive ? 1.15 : 1) * prestigeMult * bloodMoonMult * weekendSurgeMult;
      const rawGold =
        missionDef.rewardGold[0] +
        Math.floor(Math.random() * (missionDef.rewardGold[1] - missionDef.rewardGold[0] + 1));
      const goldEarned = Math.round(rawGold * goldMult);

      const alchemyBonus = 1 + (current.researchLevels?.alchemy_archive || 0) * 0.02;
      const gotContraband = Math.random() < missionDef.contrabandChance;
      const contrabandEarned = gotContraband
        ? Math.round(
            (missionDef.contrabandAmount[0] +
              Math.floor(Math.random() * (missionDef.contrabandAmount[1] - missionDef.contrabandAmount[0] + 1))) *
              alchemyBonus
          )
        : 0;

      const pactBonus = current.unlockedPerks.includes('bm_ruby_pact') ? 0.12 : 0;
      const gotStone = Math.random() < missionDef.forgeStoneChance + pactBonus;
      const stonesEarned = gotStone ? (missionDef.minLevel >= 10 ? 2 : 1) : 0;

      const gotCrystal = Math.random() < missionDef.crystalChance + pactBonus;
      const crystalsEarned = gotCrystal ? 1 : 0;

      const riskDmg =
        missionDef.riskDamage[0] +
        Math.floor(Math.random() * (missionDef.riskDamage[1] - missionDef.riskDamage[0] + 1));
      const mitigatedDmg = Math.max(2, Math.round(riskDmg - current.attributes.defense * 0.25));

      const decree = seasonDecreeRef.current;
      const decreeXpMult = decree.bonusType === 'mission_xp' && decree.bonusPct > 0 ? 1 + decree.bonusPct / 100 : 1;
      const xpMult =
        (1 + (current.researchLevels?.intel_network || 0) * 0.04 + current.prestigeRank * 0.25) *
        bloodMoonMult *
        weekendSurgeMult *
        decreeXpMult;
      const xpEarned = Math.round(missionDef.rewardXp * xpMult);

      let nextState: PlayerSaveState = {
        ...current,
        activeMission: null,
        gold: current.gold + goldEarned,
        contraband: current.contraband + contrabandEarned,
        forgeStones: current.forgeStones + stonesEarned,
        crystals: current.crystals + crystalsEarned,
        hp: Math.max(5, current.hp - mitigatedDmg),
        seasonXp: current.seasonXp + 40,
        mysteryBoxWins: (current.mysteryBoxWins || 0) + 1,
        tutorialStep: (current.tutorialStep ?? 3) === 0 ? 1 : current.tutorialStep,
        dailyProgress: {
          ...current.dailyProgress,
          missions: current.dailyProgress.missions + 1,
        },
        stats: {
          ...current.stats,
          missionsCompleted: current.stats.missionsCompleted + 1,
          totalGoldEarned: current.stats.totalGoldEarned + goldEarned,
        },
      };

      const { next: leveledState, leveledUp } = applyXpAndLevelUp(nextState, xpEarned);
      nextState = leveledState;

      const summaryMsg = `أتممت "${missionDef.title}": +${goldEarned} ذهب${
        contrabandEarned > 0 ? `، +${contrabandEarned} مهربات` : ''
      }${stonesEarned > 0 ? `، +${stonesEarned} صقل` : ''}${
        crystalsEarned > 0 ? `، +${crystalsEarned} بلورة` : ''
      }، +${xpEarned} XP.`;

      nextState.logs = appendLog(nextState.logs, 'mission', summaryMsg, 'positive');
      if (leveledUp) {
        nextState.logs = appendLog(
          nextState.logs,
          'system',
          `ارتفع مستواك إلى المستوى ${nextState.level} واستعدت كامل صحتك!`,
          'positive'
        );
        soundFX.playLevelUp();
        showToast(`ترقية مستوى! وصلت إلى المستوى ${nextState.level}`, 'positive');
      } else {
        soundFX.playCoin();
        showToast(`اكتملت المهمة: +${goldEarned} ذهب`, 'positive');
      }

      return nextState;
    },
    [showToast]
  );

  // Main 1-second simulation tick
  useEffect(() => {
    if (gameState !== 'PLAYING' || !player) return;

    const interval = setInterval(() => {
      const tickNow = Date.now();
      setNow(tickNow);

      setPlayer((prev) => {
        if (!prev) return prev;
        let updated = { ...prev, lastOnlineAt: tickNow };
        let changed = false;

        if (updated.activeMission && tickNow >= updated.activeMission.endsAt) {
          const def = MISSIONS.find((m) => m.id === updated.activeMission?.missionId);
          if (def) {
            updated = resolveMission(updated, def);
            changed = true;
          } else {
            updated = { ...updated, activeMission: null };
            changed = true;
          }
        }

        const regenIntervalMs = Math.max(4000, 12000 - (updated.hqLevels.power_core - 1) * 350);
        if (updated.energy < updated.maxEnergy && tickNow - updated.lastEnergyTick >= regenIntervalMs) {
          const ticks = Math.floor((tickNow - updated.lastEnergyTick) / regenIntervalMs);
          updated = {
            ...updated,
            energy: Math.min(updated.maxEnergy, updated.energy + ticks),
            lastEnergyTick: tickNow,
          };
          changed = true;
        } else if (updated.energy >= updated.maxEnergy && tickNow - updated.lastEnergyTick >= regenIntervalMs) {
          updated = { ...updated, lastEnergyTick: tickNow };
          changed = true;
        }

        if (tickNow - updated.lastVaultTick >= 15000) {
          const cycles = Math.min(20, Math.floor((tickNow - updated.lastVaultTick) / 15000));
          const subSpec = getActiveSubSpec(updated);
          const subSpecHqMult = 1 + (subSpec?.bonuses.hqYieldPct || 0) / 100;
          const researchYieldBonus = 1 + (updated.researchLevels?.refinery_protocol || 0) * 0.06;
          const refineryBase = 55 + (updated.hqLevels.refinery - 1) * 55;
          const decree = seasonDecreeRef.current;
          const decreeHqMult = decree.bonusType === 'hq_yield' && decree.bonusPct > 0 ? 1 + decree.bonusPct / 100 : 1;
          const refineryMult =
            (updated.unlockedPerks.includes('tw_grid_overclock') ? 1.25 : 1) *
            subSpecHqMult *
            researchYieldBonus *
            decreeHqMult *
            (1 + updated.prestigeRank * 0.25);
          const refineryGold = Math.round(refineryBase * refineryMult);
          const shareGold = Math.round(
            DISTRICT_SHARES.reduce(
              (sum, d) => sum + (updated.districtShares[d.id] || 0) * d.dividendPerCycle,
              0
            ) *
              researchYieldBonus *
              subSpecHqMult *
              decreeHqMult
          );
          const goldAdd = (refineryGold + shareGold) * cycles;
          const contraAdd = Math.random() < 0.38 + updated.hqLevels.refinery * 0.03 ? cycles : 0;

          updated = {
            ...updated,
            pendingVaultGold: updated.pendingVaultGold + goldAdd,
            pendingVaultContraband: updated.pendingVaultContraband + contraAdd,
            lastVaultTick: tickNow,
          };
          changed = true;
        }

        if (tickNow - updated.lastMarketUpdate >= 30000) {
          updated = {
            ...updated,
            market: rollMarketPrices(updated.market),
            lastMarketUpdate: tickNow,
          };
          changed = true;
        }

        if (tickNow - (updated.eventStartedAt || 0) >= 180000) {
          const nextEv = buildNextLiveEventFields(updated, tickNow);
          updated = {
            ...updated,
            ...nextEv,
            logs: appendLog(
              updated.logs,
              'system',
              `بدأ حدث المدينة الجديد: ${LIVE_EVENTS_META[nextEv.activeEventId || 'blood_moon'].title}!`,
              'positive'
            ),
          };
          changed = true;
        }

        const todayKey = getTodayDateKey();
        if (updated.dailyDateKey !== todayKey) {
          updated = {
            ...updated,
            dailyDateKey: todayKey,
            loginStreak: (updated.loginStreak || 0) + 1,
            dailyStreakClaimed: false,
            dailyProgress: { missions: 0, raids: 0, trades: 0, upgrades: 0, bossHits: 0 },
            claimedDailyQuests: [],
            lastWheelDate: todayKey,
            wheelSpinsToday: 0,
          };
          changed = true;
        }

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, player, resolveMission]);

  const handleGoogleSignIn = async () => {
    try {
      soundFX.playClick();
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await ensureUserProfile(result.user);
        const rawCloud = await loadCloudOperative(result.user.uid);
        if (rawCloud) {
          setCloudSave(migrateSavedPlayer(rawCloud));
        }
        showToast(`مرحباً بك ${result.user.displayName || 'في السحابة'}!`, 'positive');
      }
    } catch {
      soundFX.playError();
      showToast('تعذر إتمام تسجيل الدخول عبر Google', 'warning');
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOut(auth);
      setCloudSave(null);
      showToast('تم تسجيل الخروج من الحساب السحابي', 'positive');
    } catch {
      soundFX.playError();
    }
  };

  const handleStartNew = (codename: string, factionId: FactionId) => {
    soundFX.playUpgrade();
    const fresh = createNewPlayerState(codename, factionId);
    setPlayer(fresh);
    setRaidTargets(generateRaidTargets(fresh, onlineOperatives, authUser?.uid));
    setLatestRaidReport(null);
    setActiveDuel(null);
    setTournament(null);
    setTowerLastResult(null);
    setActiveTab('missions');
    setGameState('PLAYING');
    if (authUser && authUser.emailVerified) {
      void syncOperativeToCloud(authUser.uid, fresh);
    }
  };

  const handleContinue = (source: 'cloud' | 'local') => {
    const baseSave = source === 'cloud' && cloudSave ? cloudSave : savedPlayer;
    if (!baseSave) return;
    soundFX.playClick();
    const { next, offlineGold } = applyOfflineGains(baseSave);
    setPlayer(next);
    setRaidTargets(generateRaidTargets(next, onlineOperatives, authUser?.uid));
    setActiveDuel(null);
    setGameState('PLAYING');
    if (offlineGold > 0) {
      showToast(`أرباح الغياب: +${offlineGold.toLocaleString('en-US')} ذهب بانتظارك في المقر!`, 'positive');
    }
  };

  const handleToggleMute = () => {
    const muted = soundFX.toggleMute();
    setIsMuted(muted);
  };

  const handleHeal = () => {
    if (!player) return;
    const cost = Math.max(25, Math.round((player.maxHp - player.hp) * 1.4));
    if (player.gold < cost || player.hp >= player.maxHp) {
      soundFX.playError();
      return;
    }
    soundFX.playUpgrade();
    setPlayer({
      ...player,
      gold: player.gold - cost,
      hp: player.maxHp,
    });
    showToast('تم استعادة الصحة بالكامل', 'positive');
  };

  const handleStartMission = (mission: MissionDef) => {
    if (!player || player.activeMission) return;
    const faction = FACTIONS[player.factionId];
    const energyCost = Math.max(1, mission.energyCost - faction.bonuses.energyCostDiscount);
    const unlocked = player.level >= mission.minLevel || player.prestigeRank > 0;
    if (player.energy < energyCost || !unlocked || player.hp < 15) {
      soundFX.playError();
      return;
    }

    const durationMult =
      Math.max(0.4, 1 - (player.hqLevels.power_core - 1) * 0.02) * (player.vipActive ? 0.85 : 1);
    const actualDuration = Math.max(5, Math.round(mission.durationSec * durationMult));
    const startNow = Date.now();

    soundFX.playClick();
    setPlayer({
      ...player,
      energy: player.energy - energyCost,
      tutorialStep: (player.tutorialStep ?? 3) === 0 ? 1 : player.tutorialStep,
      activeMission: {
        missionId: mission.id,
        startedAt: startNow,
        endsAt: startNow + actualDuration * 1000,
        durationSec: actualDuration,
      },
    });
  };

  const handleInstantFinishMission = () => {
    if (!player || !player.activeMission || player.crystals < 3) {
      soundFX.playError();
      return;
    }
    const def = MISSIONS.find((m) => m.id === player.activeMission?.missionId);
    if (!def) return;

    const withCrystalSpent = { ...player, crystals: player.crystals - 3 };
    const resolved = resolveMission(withCrystalSpent, def);
    setPlayer(resolved);
  };

  const handleCancelMission = () => {
    if (!player || !player.activeMission) return;
    soundFX.playClick();
    setPlayer({
      ...player,
      activeMission: null,
      logs: appendLog(player.logs, 'mission', 'تم إلغاء المهمة الجارية والانسحاب بأمان.', 'warning'),
    });
  };

  const handleRefillEnergy = () => {
    if (!player || player.crystals < 6 || player.energy >= player.maxEnergy) {
      soundFX.playError();
      return;
    }
    soundFX.playUpgrade();
    setPlayer({
      ...player,
      crystals: player.crystals - 6,
      energy: player.maxEnergy,
    });
    showToast('تم شحن الطاقة بالكامل', 'positive');
  };

  const handleNightHunt = (zone: NightHuntZoneDef) => {
    if (!player) return;
    const unlocked = player.level >= zone.minLevel || player.prestigeRank > 0;
    if (!unlocked || player.energy < zone.energyCost || player.hp < 15) {
      soundFX.playError();
      return;
    }

    const bloodMoonMult = player.activeEventId === 'blood_moon' ? 2 : 1;
    const weekendSurgeMult = getWeekendSurgeStatus().isActive ? 1.35 : 1;
    const prestigeMult = 1 + player.prestigeRank * 0.25;
    const rawGold =
      zone.goldRange[0] + Math.floor(Math.random() * (zone.goldRange[1] - zone.goldRange[0] + 1));
    const foundTreasure = Math.random() < zone.treasureChance;
    const goldEarned = Math.round(rawGold * prestigeMult * bloodMoonMult * weekendSurgeMult * (foundTreasure ? 1.45 : 1));
    const stonesFound = foundTreasure ? 1 : 0;
    const contraFound = foundTreasure ? 2 : 0;
    const essenceFound = foundTreasure ? 4 : 1;
    const dmg =
      zone.riskDamage[0] + Math.floor(Math.random() * (zone.riskDamage[1] - zone.riskDamage[0] + 1));
    const mitigatedDmg = Math.max(1, Math.round(dmg - player.attributes.defense * 0.2));
    const xpEarned = Math.round(zone.xpReward * (1 + player.prestigeRank * 0.25) * bloodMoonMult * weekendSurgeMult);

    let nextState: PlayerSaveState = {
      ...player,
      energy: player.energy - zone.energyCost,
      hp: Math.max(5, player.hp - mitigatedDmg),
      gold: player.gold + goldEarned,
      forgeStones: player.forgeStones + stonesFound,
      contraband: player.contraband + contraFound,
      craftingEssence: (player.craftingEssence || 0) + essenceFound,
      seasonXp: player.seasonXp + 20,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + goldEarned,
      },
    };
    const { next: leveled } = applyXpAndLevelUp(nextState, xpEarned);
    nextState = leveled;
    nextState.logs = appendLog(
      nextState.logs,
      'mission',
      `صيد ليلي في ${zone.name}: +${goldEarned} ذهب${foundTreasure ? ' + صندوق كنز (صقل ومهربات)!' : '.'}`,
      'positive'
    );

    soundFX.playCoin();
    setPlayer(nextState);
    showToast(
      foundTreasure
        ? `صيد موفق وكنز مخفي! +${goldEarned} ذهب +${essenceFound} جوهر`
        : `صيد ناجح: +${goldEarned} ذهب · +${xpEarned} XP`,
      'positive'
    );
  };

  const handleRotateLiveEvent = () => {
    if (!player) return;
    soundFX.playClick();
    const nextEv = buildNextLiveEventFields(player, Date.now());
    const meta = LIVE_EVENTS_META[nextEv.activeEventId || 'blood_moon'];
    setPlayer({
      ...player,
      ...nextEv,
      logs: appendLog(player.logs, 'system', `تم تفعيل الحدث المباشر: ${meta.title}`, 'positive'),
    });
    showToast(`الحدث النشط الآن: ${meta.title}`, 'positive');
  };

  const handleStrikeInvasion = () => {
    if (!player || player.activeEventId !== 'city_invasion' || player.energy < 2 || player.hp < 15) {
      soundFX.playError();
      return;
    }

    const attrs = getEffectiveAttributes(player);
    const dmg = Math.max(180, Math.round(attrs.attack * 6.5 + attrs.mastery * 3.5));
    const nextHp = Math.max(0, player.invasionWaveHp - dmg);
    const defeatedWave = nextHp <= 0;
    const goldGain = defeatedWave ? 1800 + player.level * 120 : 240 + player.level * 25;
    const essenceGain = defeatedWave ? 14 : 3;
    const crystalGain = defeatedWave ? 1 : 0;

    let nextState: PlayerSaveState = {
      ...player,
      energy: player.energy - 2,
      hp: Math.max(5, player.hp - 12),
      gold: player.gold + goldGain,
      craftingEssence: (player.craftingEssence || 0) + essenceGain,
      crystals: player.crystals + crystalGain,
      seasonXp: player.seasonXp + (defeatedWave ? 120 : 35),
      invasionWaveHp: defeatedWave ? player.invasionWaveMaxHp : nextHp,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + goldGain,
      },
    };
    const { next: leveled } = applyXpAndLevelUp(nextState, defeatedWave ? 220 : 55);
    nextState = leveled;
    nextState.logs = appendLog(
      nextState.logs,
      'raid',
      defeatedWave
        ? `دحرت موجة غزوة التمرد! +${goldGain} ذهب، +${essenceGain} جوهر و+${crystalGain} بلورات.`
        : `ألحقت ${dmg} ضرراً بقوات الغزو (+${goldGain} ذهب، +${essenceGain} جوهر).`,
      'positive'
    );

    if (defeatedWave) soundFX.playVictory();
    else soundFX.playStrike();

    setPlayer(nextState);
    showToast(
      defeatedWave
        ? `نصر حاسم ضد الغزو! +${goldGain} ذهب و+${crystalGain} بلورات`
        : `هجوم ناجح (${dmg} ضرر): +${goldGain} ذهب و+${essenceGain} جوهر`,
      'positive'
    );
  };

  const handleExecuteRaid = (target: RaidTarget, stance: RaidStance) => {
    if (!player || player.energy < 2 || player.hp < 20 || Date.now() < player.raidCooldownUntil) {
      soundFX.playError();
      return;
    }

    const rawReport = simulateVaultRaid(player, target, stance);
    const decreeGoldMult =
      seasonDecree.bonusType === 'raid_gold' && seasonDecree.bonusPct > 0 ? 1 + seasonDecree.bonusPct / 100 : 1;
    const weekendSurgeMult = getWeekendSurgeStatus().isActive ? 1.35 : 1;
    const isNemesis = Boolean(target.uid && player.nemeses?.[target.uid]);
    const nemesisMult = isNemesis ? 1.25 : 1;
    const report: RaidReport = rawReport.victory
      ? {
          ...rawReport,
          goldStolen: Math.round(rawReport.goldStolen * decreeGoldMult * weekendSurgeMult * nemesisMult),
          xpGained: Math.round(rawReport.xpGained * weekendSurgeMult),
        }
      : rawReport;
    setLatestRaidReport(report);

    let nextState: PlayerSaveState = {
      ...player,
      energy: player.energy - 2,
      hp: Math.max(1, player.hp - report.damageTaken),
      gold: player.gold + report.goldStolen,
      contraband: player.contraband + report.contrabandStolen,
      forgeStones: player.forgeStones + report.forgeStonesFound,
      crystals: player.crystals + report.crystalsFound,
      arenaRating: player.arenaRating + (isNemesis && report.victory ? 15 : 0),
      raidCooldownUntil: Date.now() + 7000,
      seasonXp: player.seasonXp + (report.victory ? 60 : 20),
      mysteryBoxWins: (player.mysteryBoxWins || 0) + (report.victory ? 1 : 0),
      tutorialStep: (player.tutorialStep ?? 3) === 2 ? 3 : player.tutorialStep,
      dailyProgress: {
        ...player.dailyProgress,
        raids: player.dailyProgress.raids + (report.victory ? 1 : 0),
      },
      stats: {
        ...player.stats,
        raidsWon: player.stats.raidsWon + (report.victory ? 1 : 0),
        raidsLost: player.stats.raidsLost + (report.victory ? 0 : 1),
        totalGoldEarned: player.stats.totalGoldEarned + report.goldStolen,
      },
    };

    if (report.victory && report.dominanceGained > 0) {
      nextState.dominance = {
        ...nextState.dominance,
        [player.factionId]: nextState.dominance[player.factionId] + report.dominanceGained,
      };
    }

    const { next: leveledState, leveledUp } = applyXpAndLevelUp(nextState, report.xpGained);
    nextState = leveledState;

    const logMsg = report.victory
      ? `نجحت في مداهمة ${target.codename}: غنمت ${report.goldStolen} ذهب و${report.contrabandStolen} مهربات.`
      : `تصدت دفاعات ${target.codename} لهجومك وتكبدت ${report.damageTaken} ضرر.`;
    nextState.logs = appendLog(nextState.logs, 'raid', logMsg, report.victory ? 'positive' : 'warning');

    if (report.victory) {
      if (leveledUp) soundFX.playLevelUp();
      else soundFX.playVictory();
      let bountyMsg = '';
      if (target.isRealPlayer && target.uid && authUser && authUser.emailVerified) {
        const matchingBounties = bounties.filter(
          (b) => b.status === 'open' && b.targetUid === target.uid && b.posterUid !== authUser.uid
        );
        for (const b of matchingBounties) {
          nextState = {
            ...nextState,
            gold: nextState.gold + b.rewardGold,
            crystals: nextState.crystals + b.rewardCrystals,
            logs: appendLog(
              nextState.logs,
              'raid',
              `نفّذت عقد مطاردة ${b.targetName} وربحت +${b.rewardGold} ذهب${b.rewardCrystals > 0 ? ` و+${b.rewardCrystals} بلورات` : ''}!`,
              'positive'
            ),
          };
          bountyMsg = ` + جائزة المطاردة (+${b.rewardGold} ذهب)!`;
          void claimBounty(b.id, authUser.uid, player.codename);
          void sendPvpAlert({
            targetUid: b.posterUid,
            attackerUid: authUser.uid,
            attackerName: player.codename,
            attackerFaction: player.factionId,
            attackerPower: getPlayerPowerScore(getEffectiveAttributes(player)),
            alertType: 'bounty_claimed',
            summary: `أتم الصياد ${player.codename} عقد المطاردة على ${b.targetName} وحصل على المكافأة!`,
            goldAmount: b.rewardGold,
            crystalAmount: b.rewardCrystals,
          });
        }

        const myPower = getPlayerPowerScore(getEffectiveAttributes(player));
        void sendPvpAlert({
          targetUid: target.uid,
          attackerUid: authUser.uid,
          attackerName: player.codename,
          attackerFaction: player.factionId,
          attackerPower: myPower,
          alertType: 'raid_incoming',
          summary: `داهم ${player.codename} خزنتك وسلب ${report.goldStolen} ذهب! يمكنك تنفيذ انتقام مضاعف الآن.`,
          goldAmount: report.goldStolen,
        });
      }
      showToast(`مداهمة ناجحة! +${report.goldStolen} ذهب${bountyMsg}`, 'positive');
      if (player.clanId && authUser && authUser.emailVerified) {
        const warHour = getWarHourStatus();
        const warGain = warHour.isActive ? 30 : 15;
        void addClanWarPoints(player.clanId, warGain);
        const nowMs = Date.now();
        for (const w of clanWars) {
          if (
            w.status === 'active' &&
            nowMs < w.endsAt &&
            (w.challengerClanId === player.clanId || w.defenderClanId === player.clanId)
          ) {
            void addClanWarScore(w, player.clanId, warGain);
          }
        }
      }
    } else {
      soundFX.playDefeat();
      showToast('فشلت المداهمة — طوّر عتادك أو قدراتك', 'warning');
    }

    if (leveledUp) {
      setRaidTargets(generateRaidTargets(nextState, onlineOperatives, authUser?.uid));
    }

    setPlayer(nextState);
  };

  const handleStartDuel = (opponent: ArenaOpponentDef) => {
    if (!player || player.energy < 2) {
      soundFX.playError();
      return;
    }
    soundFX.playWarHorn();
    setPlayer({
      ...player,
      energy: player.energy - 2,
    });
    setActiveDuel(initArenaDuel(player, opponent));
  };

  const handleDuelAction = (action: 'strike' | 'guard' | 'ultimate' | 'potion') => {
    if (!player || !activeDuel || activeDuel.finished) return;
    const prevTurn = activeDuel.turn;
    const nextDuel = stepArenaDuel(player, activeDuel, action);
    setActiveDuel(nextDuel);

    if (!nextDuel.finished) {
      if (action === 'guard') {
        soundFX.playGuard();
      } else if (action === 'ultimate') {
        soundFX.playUltimate();
      } else if (action === 'potion') {
        soundFX.playHealPotion();
      } else {
        const turnLog = nextDuel.logs.find((l) => l.startsWith(`جولة ${prevTurn}:`)) || nextDuel.logs[0] || '';
        if (turnLog.includes('حاسمة')) soundFX.playCritStrike();
        else soundFX.playStrike();
      }
    }

    if (nextDuel.finished) {
      const opp = ARENA_OPPONENTS.find((o) => o.id === nextDuel.opponentId) || {
        id: nextDuel.opponentId,
        name: nextDuel.opponentName,
        rewardGold: 650 + player.level * 120,
        rewardForgeStones: 4,
        rewardCrystals: 0,
        rewardRating: 45,
        rewardXp: 260,
      };
      if (nextDuel.victory) {
        const prestigeMult = 1 + player.prestigeRank * 0.25;
        const goldWin = Math.round(opp.rewardGold * prestigeMult);
        let nextState: PlayerSaveState = {
          ...player,
          gold: player.gold + goldWin,
          forgeStones: player.forgeStones + opp.rewardForgeStones,
          crystals: player.crystals + opp.rewardCrystals,
          arenaRating: player.arenaRating + opp.rewardRating,
          seasonXp: player.seasonXp + 90,
          mysteryBoxWins: (player.mysteryBoxWins || 0) + 1,
          stats: {
            ...player.stats,
            duelsWon: (player.stats.duelsWon || 0) + 1,
            totalGoldEarned: player.stats.totalGoldEarned + goldWin,
          },
        };
        const { next: leveled, leveledUp } = applyXpAndLevelUp(nextState, opp.rewardXp);
        nextState = leveled;
        if (leveledUp) soundFX.playLevelUp();
        else soundFX.playVictory();
        nextState.logs = appendLog(
          nextState.logs,
          'raid',
          `انتصرت في الحلبة ضد ${opp.name}: +${goldWin} ذهب و+${opp.rewardRating} تصنيف.`,
          'positive'
        );
        setPlayer(nextState);
        showToast(
          opp.rewardCrystals > 0
            ? `انتصار في الحلبة! +${goldWin} ذهب و+${opp.rewardCrystals} بلورات`
            : `انتصار في الحلبة! +${goldWin} ذهب و+${opp.rewardRating} تصنيف`,
          'positive'
        );
      } else {
        soundFX.playDefeat();
        showToast('خسرت النزال — طوّر عتادك أو مرافقك وحاول مجدداً', 'warning');
      }
    }
  };

  const handleStartTournament = () => {
    if (!player || player.energy < 3) {
      soundFX.playError();
      return;
    }
    const power = getPlayerPowerScore(getEffectiveAttributes(player));
    const opp = buildTournamentOpponent(power, 1);
    soundFX.playStrike();
    setPlayer({
      ...player,
      energy: player.energy - 3,
    });
    setTournament({
      active: true,
      round: 1,
      ...opp,
      finished: false,
      champion: false,
      logs: ['بدأت بطولة الكولوسيوم الإقصائية (16 مقاتلاً)!'],
    });
  };

  const handleFightTournamentRound = () => {
    if (!player || !tournament || tournament.finished) return;
    const power = getPlayerPowerScore(getEffectiveAttributes(player));
    const winProb = Math.min(0.9, Math.max(0.25, 0.52 + (power - tournament.opponentPower) / Math.max(200, power * 1.4)));
    const won = Math.random() < winProb;

    if (!won) {
      soundFX.playDefeat();
      const consolationGold = 180 * tournament.round;
      setTournament({
        ...tournament,
        active: false,
        finished: true,
        champion: false,
        logs: [
          `خسرت في الجولة ${tournament.round} أمام ${tournament.opponentName} (+${consolationGold} ذهب).`,
          ...tournament.logs,
        ],
      });
      setPlayer({
        ...player,
        gold: player.gold + consolationGold,
      });
      showToast(`خرجت من البطولة في الجولة ${tournament.round}`, 'warning');
      return;
    }

    if (tournament.round >= 4) {
      soundFX.playVictory();
      const champGold = Math.round(3200 * (1 + player.prestigeRank * 0.25));
      const bonusRunePool: RuneId[] = ['poison', 'lifesteal', 'armor_pierce', 'crit_surge'];
      const rewardRune = bonusRunePool[Math.floor(Math.random() * bonusRunePool.length)];

      setTournament({
        ...tournament,
        active: false,
        finished: true,
        champion: true,
        logs: [
          `تُوّجت بطلاً للكولوسيوم بعد الفوز في النهائي! (+${champGold} ذهب +3 بلورات + ${RUNES_CATALOG[rewardRune].name})`,
          ...tournament.logs,
        ],
      });

      const { next: leveled } = applyXpAndLevelUp(
        {
          ...player,
          gold: player.gold + champGold,
          crystals: player.crystals + 3,
          craftingEssence: (player.craftingEssence || 0) + 15,
          tournamentWins: (player.tournamentWins || 0) + 1,
          arenaRating: player.arenaRating + 90,
          seasonXp: player.seasonXp + 220,
          mysteryBoxWins: (player.mysteryBoxWins || 0) + 1,
          ownedRunes: {
            ...player.ownedRunes,
            [rewardRune]: (player.ownedRunes?.[rewardRune] || 0) + 1,
          },
          stats: {
            ...player.stats,
            duelsWon: (player.stats.duelsWon || 0) + 1,
            totalGoldEarned: player.stats.totalGoldEarned + champGold,
          },
          logs: appendLog(
            player.logs,
            'raid',
            `تُوّجت بطلاً لبطولة الكولوسيوم الكبرى وغنمت ${champGold} ذهب وحجر ${RUNES_CATALOG[rewardRune].name}!`,
            'positive'
          ),
        },
        450
      );
      setPlayer(leveled);
      showToast('بطل الكولوسيوم! ربحت جائزة النهائي وحجراً رونياً نادراً!', 'positive');
      return;
    }

    const nextRound = tournament.round + 1;
    const nextOpp = buildTournamentOpponent(power, nextRound);
    soundFX.playVictory();
    setTournament({
      ...tournament,
      round: nextRound,
      ...nextOpp,
      logs: [`انتصرت على ${tournament.opponentName} وتأهلت إلى الجولة ${nextRound}!`, ...tournament.logs],
    });
  };

  const handleFightCompanionDuel = (enemyCompanionId: CompanionId) => {
    if (!player || !player.activeCompanion || player.energy < 1) {
      soundFX.playError();
      return;
    }
    const myLvl = Math.max(1, player.ownedCompanions?.[player.activeCompanion] || 1);
    const enemyLevel = Math.max(1, myLvl + Math.floor(Math.random() * 3) - 1);
    const result = simulateCompanionDuel(player, enemyCompanionId, enemyLevel);

    if (result.victory) soundFX.playVictory();
    else soundFX.playDefeat();

    setCompanionDuelLog({
      victory: result.victory,
      title: result.victory
        ? `انتصر ${result.playerCompanionName} على ${result.enemyCompanionName}!`
        : `تفوّق ${result.enemyCompanionName} في هذه الجولة`,
      logs: result.logs,
      rewardText: `+${result.rewardGold} ذهب · +${result.rewardEssence} جوهر صياغة`,
    });

    setPlayer({
      ...player,
      energy: player.energy - 1,
      gold: player.gold + result.rewardGold,
      craftingEssence: (player.craftingEssence || 0) + result.rewardEssence,
      seasonXp: player.seasonXp + (result.victory ? 45 : 15),
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + result.rewardGold,
      },
    });
  };

  const handleClimbTowerFloor = () => {
    if (!player || player.energy < 2 || player.hp < 20) {
      soundFX.playError();
      return;
    }
    const floor = player.towerFloor || 1;
    const result = simulateTowerFloorBattle(player, floor);

    setTowerLastResult({
      floor,
      victory: result.victory,
      enemyName: result.enemyName,
      rounds: result.roundsSummary,
      lootText: result.victory
        ? `+${result.rewardGold} ذهب · +${result.rewardEssence} جوهر · +${result.rewardStones} صقل`
        : 'حاول تقوية عتادك أو ترصيع حجر روني',
    });

    if (result.victory) soundFX.playVictory();
    else soundFX.playDefeat();

    const nextFloor = result.victory ? floor + 1 : floor;
    const nextBest = Math.max(player.towerBestFloor || 1, nextFloor);
    const bpDrop = result.victory && (floor % 5 === 0 || Math.random() < 0.14) ? 1 : 0;

    let nextState: PlayerSaveState = {
      ...player,
      energy: player.energy - 2,
      hp: Math.max(1, player.hp - result.damageTaken),
      gold: player.gold + result.rewardGold,
      craftingEssence: (player.craftingEssence || 0) + result.rewardEssence,
      forgeStones: player.forgeStones + result.rewardStones,
      crystals: player.crystals + result.rewardCrystals,
      blueprints: (player.blueprints || 0) + bpDrop,
      towerFloor: nextFloor,
      towerBestFloor: nextBest,
      seasonXp: player.seasonXp + (result.victory ? 65 : 20),
      mysteryBoxWins: (player.mysteryBoxWins || 0) + (result.victory ? 1 : 0),
      stats: {
        ...player.stats,
        towerClears: (player.stats.towerClears || 0) + (result.victory ? 1 : 0),
        totalGoldEarned: player.stats.totalGoldEarned + result.rewardGold,
      },
    };
    const { next: leveled } = applyXpAndLevelUp(nextState, result.rewardXp);
    nextState = leveled;
    nextState.logs = appendLog(
      nextState.logs,
      'raid',
      result.victory
        ? `اجتزت الطابق ${floor} من برج الظلال! (+${result.rewardGold} ذهب و+${result.rewardEssence} جوهر${bpDrop > 0 ? ' + مخطط صياغة نادر!' : ''})`
        : `تعثّرت في الطابق ${floor} أمام ${result.enemyName}.`,
      result.victory ? 'positive' : 'warning'
    );
    setPlayer(nextState);
    showToast(
      result.victory
        ? bpDrop > 0
          ? `تم فتح الطابق ${nextFloor} وغنمت مخطط صياغة نادر!`
          : `تم فتح الطابق ${nextFloor}!`
        : `توقفت عند الطابق ${floor}`,
      result.victory ? 'positive' : 'warning'
    );
  };

  const handleAttackTerritorySector = async (sectorId: string) => {
    if (!player || player.energy < 2 || player.hp < 15) {
      soundFX.playError();
      return;
    }

    const attrs = getEffectiveAttributes(player);
    const warHour = getWarHourStatus();
    const isCitadel = sectorId === 'sector_citadel';
    const basePts = Math.max(25, Math.min(200, Math.round(25 + attrs.attack * 0.6 + attrs.influence * 0.5)));
    const pts = Math.min(
      400,
      Math.round(basePts * (warHour.isActive ? 2 : 1) * (isCitadel ? 1.2 : 1))
    );
    const goldGain = Math.round((220 + player.level * 30) * (warHour.isActive ? 1.5 : 1));
    const essenceGain = warHour.isActive ? 5 : 3;
    const bonusStones = warHour.isActive && isCitadel ? 1 : 0;

    const prevSectorScores = player.territoryWarScores?.[sectorId] || {
      shadow_hunters: 250,
      tech_wardens: 250,
      blood_mages: 250,
    };
    const updatedLocalSector = {
      ...prevSectorScores,
      [player.factionId]: (prevSectorScores[player.factionId] || 250) + pts,
    };

    const { next: leveled, leveledUp } = applyXpAndLevelUp(
      {
        ...player,
        energy: player.energy - 2,
        hp: Math.max(5, player.hp - 10),
        gold: player.gold + goldGain,
        craftingEssence: (player.craftingEssence || 0) + essenceGain,
        forgeStones: player.forgeStones + bonusStones,
        seasonXp: player.seasonXp + (warHour.isActive ? 80 : 50),
        territoryWarScores: {
          ...player.territoryWarScores,
          [sectorId]: updatedLocalSector,
        },
        dominance: {
          ...player.dominance,
          [player.factionId]: player.dominance[player.factionId] + (warHour.isActive ? 4 : 2),
        },
        stats: {
          ...player.stats,
          totalGoldEarned: player.stats.totalGoldEarned + goldGain,
        },
      },
      warHour.isActive ? 110 : 75
    );
    setPlayer(leveled);

    if (leveledUp) soundFX.playLevelUp();
    else if (warHour.isActive) soundFX.playWarHorn();
    else soundFX.playStrike();

    if (authUser && authUser.emailVerified) {
      const targetSector = liveSectors.find((s) => s.sectorId === sectorId);
      const sectorDef = TERRITORY_DISTRICTS.find((d) => d.id === sectorId);
      const sectorDoc: TerritorySectorState = targetSector || {
        sectorId,
        name: sectorDef?.name || sectorId,
        controllingFaction: player.factionId,
        shadowHuntersScore: 250,
        techWardensScore: 250,
        bloodMagesScore: 250,
        updatedAt: Date.now(),
      };
      await contributeTerritoryScore(sectorDoc, player.factionId, pts);
      if (player.clanId) {
        const warGain = warHour.isActive ? 40 : 20;
        await addClanWarPoints(player.clanId, warGain);
        const nowMs = Date.now();
        for (const w of clanWars) {
          if (
            w.status === 'active' &&
            nowMs < w.endsAt &&
            (w.challengerClanId === player.clanId || w.defenderClanId === player.clanId)
          ) {
            void addClanWarScore(w, player.clanId, warGain);
          }
        }
      }
    }

    showToast(
      `أضفت +${pts} نقطة نفوذ${warHour.isActive ? ' (ساعة الحرب x2!)' : ''} (+${goldGain} ذهب${
        bonusStones > 0 ? ' +1 حجر صقل' : ''
      })`,
      'positive'
    );
  };

  const handleStrikeWorldBoss = () => {
    if (!player || player.energy < 2 || player.hp < 20) {
      soundFX.playError();
      return;
    }

    const boss = WORLD_BOSSES[player.worldBossIndex % WORLD_BOSSES.length];
    const outcome = simulateWorldBossStrike(player, boss, player.worldBossCurrentHp);

    let nextGold = player.gold + outcome.goldChip;
    let nextContra = player.contraband;
    let nextStones = player.forgeStones;
    let nextCrystals = player.crystals;
    let nextXp = outcome.xpChip;
    let nextBossIndex = player.worldBossIndex;
    let nextBossHp = outcome.newBossHp;
    let bossesDefeated = player.stats.bossesDefeated;
    let nextEssence = player.craftingEssence || 0;
    let bpEarned = 0;

    if (outcome.defeated) {
      const prestigeMult = 1 + player.prestigeRank * 0.25;
      const bossGold = Math.round(boss.rewardGold * prestigeMult);
      nextGold += bossGold;
      nextContra += boss.rewardContraband;
      nextStones += boss.rewardForgeStones;
      nextCrystals += boss.rewardCrystals;
      nextEssence += 15;
      bpEarned = 1;
      nextXp += boss.rewardXp;
      bossesDefeated += 1;
      nextBossIndex = (player.worldBossIndex + 1) % WORLD_BOSSES.length;
      nextBossHp = WORLD_BOSSES[nextBossIndex].maxHp;
      showToast(
        `هزمت ${boss.name}! +${bossGold.toLocaleString('en-US')} ذهب، +${boss.rewardForgeStones} صقل ومخطط سلاح نادر!`,
        'positive'
      );
    } else {
      showToast(
        `${outcome.isCrit ? 'ضربة حاسمة! ' : ''}ألحقت ${outcome.damageDealt} ضرراً بالزعيم (+${outcome.goldChip} ذهب)`,
        'positive'
      );
    }

    let nextState: PlayerSaveState = {
      ...player,
      energy: player.energy - 2,
      hp: Math.max(1, player.hp - outcome.damageTaken),
      gold: nextGold,
      contraband: nextContra,
      forgeStones: nextStones,
      crystals: nextCrystals,
      craftingEssence: nextEssence,
      blueprints: (player.blueprints || 0) + bpEarned,
      worldBossIndex: nextBossIndex,
      worldBossCurrentHp: nextBossHp,
      seasonXp: player.seasonXp + (outcome.defeated ? 200 : 45),
      dailyProgress: {
        ...player.dailyProgress,
        bossHits: player.dailyProgress.bossHits + 1,
      },
      stats: {
        ...player.stats,
        bossesDefeated,
        totalGoldEarned: player.stats.totalGoldEarned + (nextGold - player.gold),
      },
    };

    const { next: leveled, leveledUp } = applyXpAndLevelUp(nextState, nextXp);
    nextState = leveled;
    if (leveledUp) soundFX.playLevelUp();
    else if (outcome.defeated) soundFX.playVictory();
    else if (outcome.isCrit) soundFX.playCritStrike();
    else soundFX.playBossHit();

    nextState.logs = appendLog(
      nextState.logs,
      'raid',
      outcome.defeated
        ? `تم القضاء على زعيم القطاع "${boss.name}" وغنيمة ${boss.rewardForgeStones} صقل، ${boss.rewardCrystals} بلورات ومخطط سلاح نادر!`
        : `هاجمت "${boss.name}" بضرر ${outcome.damageDealt} نقطة.`,
      'positive'
    );
    setPlayer(nextState);
  };

  const handleRecruitClanUnit = (unitId: ClanUnitId) => {
    if (!player) return;
    const def = CLAN_UNITS[unitId];
    if (player.gold < def.costGold || player.contraband < def.costContraband) {
      soundFX.playError();
      return;
    }
    soundFX.playUpgrade();
    setPlayer({
      ...player,
      gold: player.gold - def.costGold,
      contraband: player.contraband - def.costContraband,
      clanUnits: {
        ...player.clanUnits,
        [unitId]: (player.clanUnits?.[unitId] || 0) + 1,
      },
    });
    showToast(`تم تجنيد ${def.name} في عشيرتك`, 'positive');
  };

  const handleRenameClan = (name: string) => {
    if (!player || !name.trim()) return;
    soundFX.playClick();
    setPlayer({
      ...player,
      clanName: name.trim(),
    });
    showToast('تم تحديث اسم العشيرة', 'positive');
  };

  const handleCreateOnlineClan = async (name: string) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    const cleanName = name.trim();
    if (cleanName.length < 2) return;
    const clanId = await createOnlineClan(authUser.uid, player, cleanName);
    if (clanId) {
      soundFX.playVictory();
      setPlayer({
        ...player,
        clanId,
        clanName: cleanName.slice(0, 32),
      });
      showToast(`تم تأسيس عشيرة "${cleanName}" أونلاين!`, 'positive');
    } else {
      soundFX.playError();
      showToast('تعذر إنشاء العشيرة الآن', 'warning');
    }
  };

  const handleJoinOnlineClan = async (clan: OnlineClanDoc) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    const ok = await joinOnlineClan(authUser.uid, player, clan);
    if (ok) {
      soundFX.playVictory();
      setPlayer({
        ...player,
        clanId: clan.id,
        clanName: clan.name,
      });
      showToast(`انضممت إلى عشيرة ${clan.name}`, 'positive');
    } else {
      soundFX.playError();
    }
  };

  const handleLeaveOnlineClan = async (clan: OnlineClanDoc) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    const ok = await leaveOnlineClan(authUser.uid, clan);
    if (ok) {
      soundFX.playClick();
      setPlayer({
        ...player,
        clanId: null,
        clanName: 'حلف الظل المستقل',
      });
      showToast(`غادرت عشيرة ${clan.name}`, 'positive');
    }
  };

  const handleDonateOnlineClan = async (clan: OnlineClanDoc, goldAmount: number, contrabandAmount: number) => {
    if (!player || !authUser || player.gold < goldAmount || player.contraband < contrabandAmount) {
      soundFX.playError();
      return;
    }
    const ok = await donateToOnlineClan(clan, goldAmount, contrabandAmount);
    if (ok) {
      soundFX.playCoin();
      setPlayer({
        ...player,
        gold: player.gold - goldAmount,
        contraband: player.contraband - contrabandAmount,
      });
      showToast(`تبرعت بـ ${goldAmount} ذهب لخزنة عشيرتك`, 'positive');
    }
  };

  const handleUpgradeOnlineClan = async (clan: OnlineClanDoc) => {
    const cost = clan.clanLevel * 1000;
    if (clan.treasuryGold < cost) {
      soundFX.playError();
      return;
    }
    const ok = await upgradeOnlineClan(clan, cost);
    if (ok) {
      soundFX.playVictory();
      showToast(`ارتفع مستوى عشيرة ${clan.name} إلى ${clan.clanLevel + 1}!`, 'positive');
    }
  };

  const handleSendClanMessage = async (clanId: string, text: string) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    const ok = await sendClanChatMessage(clanId, authUser.uid, player.codename, text);
    if (!ok) soundFX.playError();
  };

  const handleTrainAttribute = (key: keyof PlayerAttributes) => {
    if (!player) return;
    const cost = getAttributeUpgradeCost(player.attributes[key]);
    if (player.gold < cost) {
      soundFX.playError();
      return;
    }
    soundFX.playUpgrade();
    setPlayer({
      ...player,
      gold: player.gold - cost,
      attributes: {
        ...player.attributes,
        [key]: player.attributes[key] + 1,
      },
    });
  };

  const handleUnlockPerk = (perkId: string) => {
    if (!player || player.unlockedPerks.includes(perkId)) return;
    const faction = FACTIONS[player.factionId];
    const perk = faction.perks.find((p) => p.id === perkId);
    const levelMet = player.level >= (perk?.unlockLevel || 999) || player.prestigeRank > 0;
    if (!perk || !levelMet || player.gold < perk.costGold || player.crystals < perk.costCrystals) {
      soundFX.playError();
      return;
    }
    soundFX.playVictory();
    setPlayer({
      ...player,
      gold: player.gold - perk.costGold,
      crystals: player.crystals - perk.costCrystals,
      unlockedPerks: [...player.unlockedPerks, perk.id],
      logs: appendLog(player.logs, 'system', `تم تفعيل قدرة الفصيل: ${perk.name}`, 'positive'),
    });
    showToast(`تم تفعيل ${perk.name}`, 'positive');
  };

  const handleSelectSubSpec = (subSpecId: SubSpecId) => {
    if (!player) return;
    const canChooseSpec = player.level >= 3 || player.prestigeRank > 0;
    const spec = SUB_SPECS.find((s) => s.id === subSpecId && s.factionId === player.factionId);
    if (!canChooseSpec || !spec) {
      soundFX.playError();
      return;
    }
    soundFX.playVictory();
    setPlayer({
      ...player,
      subSpecId,
      logs: appendLog(player.logs, 'system', `اعتمدت التخصص الفرعي: ${spec.name}`, 'positive'),
    });
    showToast(`تم تفعيل التخصص الفرعي: ${spec.name}`, 'positive');
  };

  const handleToggleCombatSkill = (skillId: CombatSkillId) => {
    if (!player) return;
    const current = player.equippedCombatSkills || [];
    const exists = current.includes(skillId);
    const skillDef = COMBAT_SKILLS.find((s) => s.id === skillId);
    if (!skillDef) return;

    if (exists) {
      soundFX.playClick();
      setPlayer({
        ...player,
        equippedCombatSkills: current.filter((id) => id !== skillId),
      });
      showToast(`تمت إزالة مهارة "${skillDef.name}"`, 'positive');
    } else {
      if (current.length >= 3) {
        soundFX.playError();
        showToast('الحد الأقصى 3 مهارات قتالية مجهزة في آنٍ واحد', 'warning');
        return;
      }
      soundFX.playUpgrade();
      setPlayer({
        ...player,
        equippedCombatSkills: [...current, skillId],
      });
      showToast(`تم تجهيز مهارة "${skillDef.name}"`, 'positive');
    }
  };

  const handleUpgradeResearch = (researchId: ResearchId) => {
    if (!player) return;
    const def = RESEARCH_TRACKS[researchId];
    const currentLvl = player.researchLevels?.[researchId] || 0;
    if (currentLvl >= def.maxLevel) return;
    const cost = getResearchUpgradeCost(researchId, currentLvl);
    if (player.gold < cost.gold || player.contraband < cost.contraband) {
      soundFX.playError();
      return;
    }
    soundFX.playUpgrade();
    const nextLvl = currentLvl + 1;
    const extraMaxHp = researchId === 'eternal_endurance' ? 30 : 0;

    setPlayer({
      ...player,
      gold: player.gold - cost.gold,
      contraband: player.contraband - cost.contraband,
      maxHp: player.maxHp + extraMaxHp,
      hp: player.hp + extraMaxHp,
      researchLevels: {
        ...player.researchLevels,
        [researchId]: nextLvl,
      },
      logs: appendLog(player.logs, 'system', `تطوير بحث "${def.name}" إلى المستوى ${nextLvl}.`, 'positive'),
    });
    showToast(`${def.name} · المستوى ${nextLvl}`, 'positive');
  };

  const handleAscendPrestige = () => {
    if (!player) return;
    const reqLevel = getPrestigeLevelRequirement(player.prestigeRank);
    if (player.level < reqLevel) {
      soundFX.playError();
      return;
    }

    const faction = FACTIONS[player.factionId];
    const nextRank = player.prestigeRank + 1;
    const enduranceHp = (player.researchLevels?.eternal_endurance || 0) * 30;
    const freshMaxHp = 130 + enduranceHp;

    soundFX.playVictory();
    const ascended: PlayerSaveState = {
      ...player,
      level: 1,
      xp: 0,
      prestigeRank: nextRank,
      hp: freshMaxHp,
      maxHp: freshMaxHp,
      energy: player.maxEnergy,
      gold: 1000 + nextRank * 500,
      crystals: player.crystals + 5,
      attributes: { ...faction.startingStats },
      activeMission: null,
      logs: appendLog(
        player.logs,
        'system',
        `تهانينا! ارتقيت إلى رتبة الصعود ${nextRank} وحصلت على +5 بلورات ومضاعف أرباح +25%!`,
        'positive'
      ),
    };
    setPlayer(ascended);
    setRaidTargets(generateRaidTargets(ascended, onlineOperatives, authUser?.uid));
    showToast(`تم الصعود إلى الرتبة ${nextRank}! (+5 بلورات)`, 'positive');
  };

  const handleCollectVault = () => {
    if (!player || (player.pendingVaultGold === 0 && player.pendingVaultContraband === 0)) return;
    soundFX.playCoin();
    const collectedGold = player.pendingVaultGold;
    const collectedContra = player.pendingVaultContraband;
    setPlayer({
      ...player,
      gold: player.gold + collectedGold,
      contraband: player.contraband + collectedContra,
      pendingVaultGold: 0,
      pendingVaultContraband: 0,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + collectedGold,
      },
    });
    showToast(`تم تحصيل +${collectedGold.toLocaleString('en-US')} ذهب من المقر`, 'positive');
  };

  const handleUpgradeModule = (moduleId: HqModuleId) => {
    if (!player) return;
    const mod = HQ_MODULES[moduleId];
    const currentLvl = player.hqLevels[moduleId];
    if (currentLvl >= mod.maxLevel) return;
    const cost = getHqUpgradeCost(moduleId, currentLvl);
    if (player.gold < cost.gold || player.contraband < cost.contraband) {
      soundFX.playError();
      return;
    }

    const nextLvl = currentLvl + 1;
    let nextMaxEnergy = player.maxEnergy;
    if (moduleId === 'power_core' && nextLvl % 2 === 1) {
      nextMaxEnergy += 1;
    }

    soundFX.playUpgrade();
    setPlayer({
      ...player,
      gold: player.gold - cost.gold,
      contraband: player.contraband - cost.contraband,
      maxEnergy: nextMaxEnergy,
      hqLevels: {
        ...player.hqLevels,
        [moduleId]: nextLvl,
      },
      logs: appendLog(player.logs, 'hq', `تمت ترقية ${mod.name} إلى المستوى ${nextLvl}.`, 'positive'),
    });
    showToast(`تمت ترقية ${mod.name} (م${nextLvl})`, 'positive');
  };

  const handleDepositVault = (amount: number) => {
    if (!player || amount <= 0 || player.gold < amount) return;
    soundFX.playClick();
    setPlayer({
      ...player,
      gold: player.gold - amount,
      vaultProtectedGold: player.vaultProtectedGold + amount,
    });
  };

  const handleWithdrawVault = (amount: number) => {
    if (!player || amount <= 0 || player.vaultProtectedGold < amount) return;
    soundFX.playClick();
    setPlayer({
      ...player,
      gold: player.gold + amount,
      vaultProtectedGold: player.vaultProtectedGold - amount,
    });
  };

  const handleRefreshMarket = () => {
    if (!player) return;
    soundFX.playClick();
    setPlayer({
      ...player,
      market: rollMarketPrices(player.market),
      lastMarketUpdate: Date.now(),
    });
  };

  const handleBuyCommodity = (commodityId: string, qty: number) => {
    if (!player || qty <= 0) return;
    const faction = FACTIONS[player.factionId];
    const subSpec = getActiveSubSpec(player);
    const hasBlackAlchemy = player.unlockedPerks.includes('bm_black_alchemy');
    const researchTradeBonus = (player.researchLevels?.alchemy_archive || 0) * 0.01;
    const buyDiscount = Math.max(
      0.68,
      (hasBlackAlchemy ? 0.92 : 1 - faction.bonuses.marketMarginBonus * 0.5) -
        researchTradeBonus -
        (subSpec?.bonuses.marketMarginBonus || 0) * 0.5
    );
    const item = player.market[commodityId];
    if (!item) return;

    const isShocked = player.activeEventId === 'market_shock' && player.eventShockCommodityId === commodityId;
    const effectivePrice = isShocked
      ? Math.max(25, Math.round(item.currentPrice * (player.eventShockMultiplier || 1)))
      : item.currentPrice;

    const unitPrice = Math.max(10, Math.round(effectivePrice * buyDiscount));
    const totalCost = unitPrice * qty;
    if (player.gold < totalCost) {
      soundFX.playError();
      return;
    }

    const newOwned = item.owned + qty;
    const newAvg = Math.round((item.avgBuyPrice * item.owned + totalCost) / newOwned);

    soundFX.playCoin();
    setPlayer({
      ...player,
      gold: player.gold - totalCost,
      dailyProgress: {
        ...player.dailyProgress,
        trades: player.dailyProgress.trades + 1,
      },
      market: {
        ...player.market,
        [commodityId]: {
          ...item,
          owned: newOwned,
          avgBuyPrice: newAvg,
        },
      },
    });
  };

  const handleSellCommodity = (commodityId: string, qty: number) => {
    if (!player || qty <= 0) return;
    const faction = FACTIONS[player.factionId];
    const subSpec = getActiveSubSpec(player);
    const hasBlackAlchemy = player.unlockedPerks.includes('bm_black_alchemy');
    const researchTradeBonus = (player.researchLevels?.alchemy_archive || 0) * 0.01;
    const sellBonus =
      (hasBlackAlchemy ? 1.08 : 1 + faction.bonuses.marketMarginBonus) +
      researchTradeBonus +
      (subSpec?.bonuses.marketMarginBonus || 0);
    const item = player.market[commodityId];
    if (!item || item.owned < qty) {
      soundFX.playError();
      return;
    }

    const isShocked = player.activeEventId === 'market_shock' && player.eventShockCommodityId === commodityId;
    const effectivePrice = isShocked
      ? Math.max(25, Math.round(item.currentPrice * (player.eventShockMultiplier || 1)))
      : item.currentPrice;

    const unitPrice = Math.max(10, Math.round(effectivePrice * sellBonus));
    const revenue = unitPrice * qty;

    soundFX.playCoin();
    setPlayer({
      ...player,
      gold: player.gold + revenue,
      dailyProgress: {
        ...player.dailyProgress,
        trades: player.dailyProgress.trades + 1,
      },
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + revenue,
      },
      market: {
        ...player.market,
        [commodityId]: {
          ...item,
          owned: item.owned - qty,
          avgBuyPrice: item.owned - qty === 0 ? 0 : item.avgBuyPrice,
        },
      },
    });
    showToast(`تم البيع مقابل +${revenue} ذهب`, 'positive');
  };

  const handleBuyEquipment = (item: EquipmentItem) => {
    if (!player || player.ownedEquipment.includes(item.id)) return;
    if (player.gold < item.priceGold || player.crystals < item.priceCrystals) {
      soundFX.playError();
      return;
    }
    soundFX.playUpgrade();
    setPlayer({
      ...player,
      gold: player.gold - item.priceGold,
      crystals: player.crystals - item.priceCrystals,
      ownedEquipment: [...player.ownedEquipment, item.id],
      equipped: {
        ...player.equipped,
        [item.slot]: item.id,
      },
      tutorialStep: (player.tutorialStep ?? 3) === 1 ? 2 : player.tutorialStep,
      logs: appendLog(player.logs, 'economy', `اشتريت وجهزت "${item.name}".`, 'positive'),
    });
    showToast(`تم تجهيز ${item.name}`, 'positive');
  };

  const handleEquipItem = (item: EquipmentItem) => {
    if (!player || !player.ownedEquipment.includes(item.id)) return;
    soundFX.playClick();
    setPlayer({
      ...player,
      equipped: {
        ...player.equipped,
        [item.slot]: item.id,
      },
    });
  };

  const handleEnhanceEquipment = (item: EquipmentItem) => {
    if (!player || !player.ownedEquipment.includes(item.id)) return;
    const currentEnhance = player.equipmentEnhance[item.id] || 0;
    if (currentEnhance >= 15) return;
    const cost = getEquipmentEnhanceCost(currentEnhance);
    if (player.gold < cost.gold || player.forgeStones < cost.stones) {
      soundFX.playError();
      return;
    }

    const succeeded = Math.random() * 100 <= cost.successRate;
    if (succeeded) {
      soundFX.playVictory();
      const nextLvl = currentEnhance + 1;
      setPlayer({
        ...player,
        gold: player.gold - cost.gold,
        forgeStones: player.forgeStones - cost.stones,
        tutorialStep: (player.tutorialStep ?? 3) === 1 ? 2 : player.tutorialStep,
        equipmentEnhance: {
          ...player.equipmentEnhance,
          [item.id]: nextLvl,
        },
        logs: appendLog(player.logs, 'economy', `تم صقل "${item.name}" بنجاح إلى +${nextLvl}!`, 'positive'),
      });
      showToast(`نجاح الصقل! ${item.name} أصبح +${nextLvl}`, 'positive');
    } else {
      soundFX.playDefeat();
      setPlayer({
        ...player,
        gold: player.gold - cost.gold,
        forgeStones: player.forgeStones - cost.stones,
        logs: appendLog(
          player.logs,
          'economy',
          `تعثّر صقل "${item.name}" عند +${currentEnhance + 1} وبقي على مستواه الحالي.`,
          'warning'
        ),
      });
      showToast('لم ينجح الصقل هذه المرة — حافظت القطعة على مستواها', 'warning');
    }
  };

  const handleCraftCustomWeapon = (mode: 'blueprint' | 'fusion') => {
    if (!player) return;
    if (mode === 'blueprint') {
      if ((player.blueprints || 0) < 1 || (player.craftingEssence || 0) < 20 || player.gold < 1200) {
        soundFX.playError();
        return;
      }
    } else {
      if ((player.craftingEssence || 0) < 30 || player.forgeStones < 5 || player.gold < 1800) {
        soundFX.playError();
        return;
      }
    }

    const prefixes = ['نصل الشفق', 'كاتانا الأوبسيديان', 'حربة الصقيع', 'مطرقة الرعد', 'خنجر السراب'];
    const suffixes = ['المصهور', 'الملكي', 'المسحور', 'الدامي', 'السرمدي'];
    const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    const baseAtk = Math.round((mode === 'blueprint' ? 32 : 28) + player.level * 2.2 + Math.random() * 14);
    const secStat = Math.round(12 + player.level * 0.9 + Math.random() * 10);
    const secKeys: Array<keyof PlayerAttributes> = ['agility', 'mastery', 'defense', 'influence'];
    const secKey = secKeys[Math.floor(Math.random() * secKeys.length)];

    const newWeapon: EquipmentItem = {
      id: `crafted_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      slot: 'weapon',
      tier: mode === 'blueprint' ? 5 : 4,
      rarityLabel: mode === 'blueprint' ? 'سيادي' : 'أسطوري',
      image: FORGED_WEAPON_IMAGE,
      priceGold: 0,
      priceCrystals: 0,
      bonuses: {
        attack: baseAtk,
        [secKey]: secStat,
      },
      description:
        mode === 'blueprint'
          ? 'سلاح نادر صيغ من مخطط أسطوري في المسبك السري، قابل للصقل حتى +15.'
          : 'سلاح مدمج كيميائياً من جوهر الصياغة وأحجار الصقل النقية.',
    };

    soundFX.playVictory();
    setPlayer({
      ...player,
      gold: player.gold - (mode === 'blueprint' ? 1200 : 1800),
      blueprints: mode === 'blueprint' ? Math.max(0, (player.blueprints || 0) - 1) : player.blueprints || 0,
      craftingEssence: Math.max(0, (player.craftingEssence || 0) - (mode === 'blueprint' ? 20 : 30)),
      forgeStones: mode === 'fusion' ? Math.max(0, player.forgeStones - 5) : player.forgeStones,
      craftedItems: [newWeapon, ...(player.craftedItems || [])],
      ownedEquipment: [...player.ownedEquipment, newWeapon.id],
      equipped: {
        ...player.equipped,
        weapon: newWeapon.id,
      },
      tutorialStep: (player.tutorialStep ?? 3) === 1 ? 2 : player.tutorialStep,
      logs: appendLog(player.logs, 'economy', `صغت وجهّزت السلاح المخصص "${newWeapon.name}" (+${baseAtk} هجوم)!`, 'positive'),
    });
    showToast(`تمت صياغة وتجهيز ${newWeapon.name}!`, 'positive');
  };

  const handleDismantleMaterial = (material: 'contraband' | 'forge_stones') => {
    if (!player) return;
    if (material === 'contraband') {
      if (player.contraband < 2) {
        soundFX.playError();
        return;
      }
      soundFX.playUpgrade();
      setPlayer({
        ...player,
        contraband: player.contraband - 2,
        craftingEssence: (player.craftingEssence || 0) + 8,
      });
      showToast('تم تفكيك 2 مهربات إلى +8 جوهر صياغة', 'positive');
    } else {
      if (player.forgeStones < 2) {
        soundFX.playError();
        return;
      }
      soundFX.playUpgrade();
      setPlayer({
        ...player,
        forgeStones: player.forgeStones - 2,
        craftingEssence: (player.craftingEssence || 0) + 12,
      });
      showToast('تم تفكيك 2 أحجار صقل إلى +12 جوهر صياغة', 'positive');
    }
  };

  const handleCraftRune = (runeId: RuneId) => {
    if (!player) return;
    const rune = RUNES_CATALOG[runeId];
    if ((player.craftingEssence || 0) < rune.essenceCost || player.gold < rune.goldCost) {
      soundFX.playError();
      return;
    }
    soundFX.playVictory();
    setPlayer({
      ...player,
      craftingEssence: (player.craftingEssence || 0) - rune.essenceCost,
      gold: player.gold - rune.goldCost,
      ownedRunes: {
        ...player.ownedRunes,
        [runeId]: (player.ownedRunes?.[runeId] || 0) + 1,
      },
      logs: appendLog(player.logs, 'economy', `صغت حجراً جديداً: ${rune.name}.`, 'positive'),
    });
    showToast(`تمت صياغة ${rune.name}`, 'positive');
  };

  const handleSocketRune = (slot: EquipmentSlot, runeId: RuneId | null) => {
    if (!player) return;
    const prevRune = player.socketedRunes?.[slot] || null;

    if (runeId === null) {
      if (!prevRune) return;
      soundFX.playClick();
      setPlayer({
        ...player,
        ownedRunes: {
          ...player.ownedRunes,
          [prevRune]: (player.ownedRunes?.[prevRune] || 0) + 1,
        },
        socketedRunes: {
          ...player.socketedRunes,
          [slot]: null,
        },
      });
      showToast(`تم فك ${RUNES_CATALOG[prevRune].name} وإعادته لمخزونك`, 'positive');
      return;
    }

    if ((player.ownedRunes?.[runeId] || 0) < 1) {
      soundFX.playError();
      return;
    }

    const updatedOwned = { ...player.ownedRunes };
    updatedOwned[runeId] = (updatedOwned[runeId] || 0) - 1;
    if (prevRune) {
      updatedOwned[prevRune] = (updatedOwned[prevRune] || 0) + 1;
    }

    soundFX.playUpgrade();
    setPlayer({
      ...player,
      ownedRunes: updatedOwned,
      socketedRunes: {
        ...player.socketedRunes,
        [slot]: runeId,
      },
    });
    showToast(`تم ترصيع ${RUNES_CATALOG[runeId].name} بنجاح!`, 'positive');
  };

  const handleCreateAuctionListing = async (
    itemType: 'contraband' | 'forge_stones' | 'rune',
    itemId: string,
    quantity: number,
    priceGold: number
  ) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    const qty = Math.max(1, Math.round(quantity));
    const price = Math.max(50, Math.round(priceGold));

    let itemName = '';
    if (itemType === 'contraband') {
      if (player.contraband < qty) {
        soundFX.playError();
        return;
      }
      itemName = 'بضائع مهربة';
    } else if (itemType === 'forge_stones') {
      if (player.forgeStones < qty) {
        soundFX.playError();
        return;
      }
      itemName = 'أحجار صقل';
    } else {
      const rId = itemId as RuneId;
      if ((player.ownedRunes?.[rId] || 0) < 1) {
        soundFX.playError();
        return;
      }
      itemName = RUNES_CATALOG[rId]?.name || 'حجر روني';
    }

    const ok = await createAuctionListing({
      sellerUid: authUser.uid,
      sellerName: player.codename,
      itemType,
      itemId,
      itemName,
      quantity: itemType === 'rune' ? 1 : qty,
      priceGold: price,
    });

    if (!ok) {
      soundFX.playError();
      showToast('تعذر نشر العرض في المزاد', 'warning');
      return;
    }

    soundFX.playCoin();
    if (itemType === 'contraband') {
      setPlayer({ ...player, contraband: player.contraband - qty });
    } else if (itemType === 'forge_stones') {
      setPlayer({ ...player, forgeStones: player.forgeStones - qty });
    } else {
      const rId = itemId as RuneId;
      setPlayer({
        ...player,
        ownedRunes: {
          ...player.ownedRunes,
          [rId]: Math.max(0, (player.ownedRunes?.[rId] || 0) - 1),
        },
      });
    }
    showToast(`تم طرح ${itemName} في المزاد الحي!`, 'positive');
  };

  const handleBuyAuctionListing = async (listing: AuctionListingDoc) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    const totalCost = player.vipActive ? listing.priceGold : Math.round(listing.priceGold * 1.08);
    if (listing.sellerUid === authUser.uid || player.gold < totalCost) {
      soundFX.playError();
      return;
    }

    const ok = await buyAuctionListing(listing.id, authUser.uid);
    if (!ok) {
      soundFX.playError();
      showToast('ربما تم شراء هذا العرض قبل قليل', 'warning');
      return;
    }

    soundFX.playVictory();
    let nextState: PlayerSaveState = {
      ...player,
      gold: player.gold - totalCost,
    };

    if (listing.itemType === 'contraband') {
      nextState = { ...nextState, contraband: nextState.contraband + listing.quantity };
    } else if (listing.itemType === 'forge_stones') {
      nextState = { ...nextState, forgeStones: nextState.forgeStones + listing.quantity };
    } else if (listing.itemType === 'rune') {
      const rId = listing.itemId as RuneId;
      nextState = {
        ...nextState,
        ownedRunes: {
          ...nextState.ownedRunes,
          [rId]: (nextState.ownedRunes?.[rId] || 0) + 1,
        },
      };
    }

    setPlayer(nextState);
    if (listing.sellerUid) {
      void sendPvpAlert({
        targetUid: listing.sellerUid,
        attackerUid: authUser.uid,
        attackerName: player.codename,
        attackerFaction: player.factionId,
        attackerPower: getPlayerPowerScore(getEffectiveAttributes(player)),
        alertType: 'auction_sold',
        summary: `اشترى ${player.codename} عرضك "${listing.itemName} ×${listing.quantity}" مقابل ${listing.priceGold} ذهب!`,
        goldAmount: listing.priceGold,
      });
    }
    showToast(`تم شراء ${listing.itemName} ×${listing.quantity} من المزاد!`, 'positive');
  };

  const handleCancelAuctionListing = async (listing: AuctionListingDoc) => {
    if (!player || !authUser || listing.sellerUid !== authUser.uid) return;
    const ok = await cancelAuctionListing(listing.id);
    if (!ok) {
      soundFX.playError();
      return;
    }

    soundFX.playClick();
    if (listing.itemType === 'contraband') {
      setPlayer({ ...player, contraband: player.contraband + listing.quantity });
    } else if (listing.itemType === 'forge_stones') {
      setPlayer({ ...player, forgeStones: player.forgeStones + listing.quantity });
    } else if (listing.itemType === 'rune') {
      const rId = listing.itemId as RuneId;
      setPlayer({
        ...player,
        ownedRunes: {
          ...player.ownedRunes,
          [rId]: (player.ownedRunes?.[rId] || 0) + 1,
        },
      });
    }
    showToast(`تم إلغاء العرض واسترداد ${listing.itemName}`, 'positive');
  };

  const handleUnlockOrUpgradeCompanion = (companionId: CompanionId) => {
    if (!player) return;
    const def = COMPANIONS[companionId];
    const currentLvl = player.ownedCompanions?.[companionId] || 0;

    if (currentLvl === 0) {
      if (player.gold < def.unlockGold || player.crystals < def.unlockCrystals) {
        soundFX.playError();
        return;
      }
      soundFX.playVictory();
      setPlayer({
        ...player,
        gold: player.gold - def.unlockGold,
        crystals: player.crystals - def.unlockCrystals,
        ownedCompanions: { ...player.ownedCompanions, [companionId]: 1 },
        activeCompanion: companionId,
        logs: appendLog(player.logs, 'economy', `استدعيت المرافق "${def.name}" للقتال بجانبك!`, 'positive'),
      });
      showToast(`تم استدعاء ${def.name} وتعيينه نشطاً`, 'positive');
      return;
    }

    if (currentLvl >= 30) return;
    const cost = getCompanionUpgradeCost(currentLvl);
    if (player.gold < cost.gold || player.contraband < cost.contraband) {
      soundFX.playError();
      return;
    }
    soundFX.playUpgrade();
    setPlayer({
      ...player,
      gold: player.gold - cost.gold,
      contraband: player.contraband - cost.contraband,
      ownedCompanions: { ...player.ownedCompanions, [companionId]: currentLvl + 1 },
    });
    showToast(`تم تدريب ${def.name} إلى المستوى ${currentLvl + 1}`, 'positive');
  };

  const handleActivateCompanion = (companionId: CompanionId) => {
    if (!player || (player.ownedCompanions?.[companionId] || 0) <= 0) return;
    soundFX.playClick();
    setPlayer({
      ...player,
      activeCompanion: companionId,
    });
    showToast(`تم تفعيل ${COMPANIONS[companionId].name}`, 'positive');
  };

  const handleBuyShare = (districtId: string) => {
    if (!player) return;
    const def = DISTRICT_SHARES.find((d) => d.id === districtId);
    if (!def) return;
    const currentOwned = player.districtShares[districtId] || 0;
    if (currentOwned >= def.maxShares || player.gold < def.sharePrice) {
      soundFX.playError();
      return;
    }

    soundFX.playCoin();
    setPlayer({
      ...player,
      gold: player.gold - def.sharePrice,
      districtShares: {
        ...player.districtShares,
        [districtId]: currentOwned + 1,
      },
      logs: appendLog(player.logs, 'economy', `استحوذت على حصة جديدة في ${def.name}.`, 'positive'),
    });
    showToast(`تم شراء حصة في ${def.name}`, 'positive');
  };

  const handleClaimDailyStreak = () => {
    if (!player || player.dailyStreakClaimed) return;
    const goldGain = 300 + player.loginStreak * 150;
    const stoneGain = 2 + Math.min(5, player.loginStreak);
    const crystalGain = player.loginStreak % 7 === 0 ? 2 : 0;

    soundFX.playVictory();
    setPlayer({
      ...player,
      dailyStreakClaimed: true,
      gold: player.gold + goldGain,
      forgeStones: player.forgeStones + stoneGain,
      crystals: player.crystals + crystalGain,
      seasonXp: player.seasonXp + 80,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + goldGain,
      },
    });
    showToast(
      crystalGain > 0
        ? `مكافأة اليوم ${player.loginStreak}: +${goldGain} ذهب، +${stoneGain} صقل و+${crystalGain} بلورات!`
        : `مكافأة اليوم ${player.loginStreak}: +${goldGain} ذهب و+${stoneGain} صقل`,
      'positive'
    );
  };

  const handleClaimDailyQuest = (questId: string) => {
    if (!player || player.claimedDailyQuests.includes(questId)) return;
    const quest = DAILY_QUESTS.find((q) => q.id === questId);
    if (!quest || (player.dailyProgress[quest.metric] || 0) < quest.target) return;

    soundFX.playVictory();
    setPlayer({
      ...player,
      claimedDailyQuests: [...player.claimedDailyQuests, questId],
      gold: player.gold + quest.rewardGold,
      forgeStones: player.forgeStones + quest.rewardForgeStones,
      crystals: player.crystals + quest.rewardCrystals,
      seasonXp: player.seasonXp + quest.rewardSeasonXp,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + quest.rewardGold,
      },
    });
    showToast(
      quest.rewardCrystals > 0
        ? `أتممت "${quest.title}": +${quest.rewardGold} ذهب و+${quest.rewardCrystals} بلورة`
        : `أتممت "${quest.title}": +${quest.rewardGold} ذهب و+${quest.rewardForgeStones} حجر صقل`,
      'positive'
    );
  };

  const handleClaimSeasonTier = (tier: number) => {
    if (!player || player.claimedSeasonTiers.includes(tier)) return;
    const unlockedTier = Math.min(MAX_SEASON_TIERS, Math.floor(player.seasonXp / SEASON_TIER_XP));
    if (unlockedTier < tier) return;

    const freeGold = tier * 350;
    const freeStones = tier % 3 === 0 ? 4 : 2;
    const freeCrystals = tier % 10 === 0 ? 1 : 0;

    const goldReward = player.vipActive ? freeGold * 2 : freeGold;
    const stoneReward = player.vipActive ? freeStones * 2 : freeStones;
    const crystalReward = player.vipActive ? (tier % 5 === 0 ? 5 : 2) : freeCrystals;
    const essenceReward = player.vipActive ? 5 : 0;

    soundFX.playVictory();
    setPlayer({
      ...player,
      claimedSeasonTiers: [...player.claimedSeasonTiers, tier],
      gold: player.gold + goldReward,
      crystals: player.crystals + crystalReward,
      forgeStones: player.forgeStones + stoneReward,
      craftingEssence: (player.craftingEssence || 0) + essenceReward,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + goldReward,
      },
    });
    showToast(
      crystalReward > 0
        ? `استلمت جائزة المرحلة ${tier}: +${goldReward} ذهب و+${crystalReward} بلورات`
        : `استلمت جائزة المرحلة ${tier}: +${goldReward} ذهب و+${stoneReward} صقل`,
      'positive'
    );
  };

  const handleClaimAchievement = (achievementId: string) => {
    if (!player) return;
    const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!def) return;
    const claimedCount = player.claimedAchievements[achievementId] || 0;
    if (claimedCount >= def.tiers.length) return;
    const currentStat = def.metric === 'prestigeRank' ? player.prestigeRank : player.stats[def.metric];
    if (currentStat < def.tiers[claimedCount]) return;

    const crystalReward = def.crystalRewards[claimedCount];
    soundFX.playVictory();
    setPlayer({
      ...player,
      crystals: player.crystals + crystalReward,
      claimedAchievements: {
        ...player.claimedAchievements,
        [achievementId]: claimedCount + 1,
      },
    });
    showToast(`وسام "${def.title}": +${crystalReward} بلورة ظل`, 'positive');
  };

  const handleImportSave = (encoded: string) => {
    try {
      const jsonStr = decodeURIComponent(escape(atob(encoded)));
      const parsed = JSON.parse(jsonStr) as Partial<PlayerSaveState>;
      const migrated = migrateSavedPlayer(parsed);
      if (!migrated) {
        soundFX.playError();
        showToast('رمز الحفظ غير صالح', 'warning');
        return;
      }
      soundFX.playVictory();
      setPlayer(migrated);
      setRaidTargets(generateRaidTargets(migrated, onlineOperatives, authUser?.uid));
      showToast('تم استعادة الحملة بنجاح!', 'positive');
    } catch {
      soundFX.playError();
      showToast('تعذر قراءة رمز الحفظ — تأكد من نسخه كاملاً', 'warning');
    }
  };

  const isOwnerAdmin = Boolean(authUser?.email === 'ilove201025@yahoo.com' && authUser?.emailVerified);

  const handleToggleVipDemo = () => {
    if (!player || !isOwnerAdmin) return;
    const nextVip = !player.vipActive;
    soundFX.playUpgrade();
    setPlayer({
      ...player,
      vipActive: nextVip,
      maxEnergy: nextVip ? player.maxEnergy + 2 : Math.max(10, player.maxEnergy - 2),
      energy: nextVip ? player.energy + 2 : Math.min(player.energy, Math.max(10, player.maxEnergy - 2)),
    });
    showToast(nextVip ? 'تم تفعيل عضوية السيادة VIP (وضع المطور)' : 'تم إيقاف عضوية VIP', 'positive');
  };

  const handleClaimCrystalPack = (amount: number) => {
    if (!player || !isOwnerAdmin) return;
    soundFX.playCoin();
    setPlayer({
      ...player,
      crystals: player.crystals + amount,
    });
    showToast(`تم إضافة +${amount} بلورة ظل (وضع المطور)`, 'positive');
  };

  const handleBuySupplyCrate = () => {
    if (!player || player.crystals < 18) {
      soundFX.playError();
      return;
    }
    const bonusGold = 1800 + Math.floor(Math.random() * 800);
    const { next: leveledState } = applyXpAndLevelUp(
      {
        ...player,
        crystals: player.crystals - 18,
        gold: player.gold + bonusGold,
        contraband: player.contraband + 10,
        forgeStones: player.forgeStones + 6,
      },
      180
    );
    soundFX.playVictory();
    setPlayer(leveledState);
    showToast(`صندوق الإمدادات: +${bonusGold} ذهب، +10 مهربات، +6 صقل`, 'positive');
  };

  const handleFullRecoveryWithCrystals = () => {
    if (!player || player.crystals < 8) {
      soundFX.playError();
      return;
    }
    soundFX.playUpgrade();
    setPlayer({
      ...player,
      crystals: player.crystals - 8,
      hp: player.maxHp,
      energy: player.maxEnergy,
      raidCooldownUntil: 0,
    });
    showToast('تم شحن الصحة والطاقة بالكامل وتجاوز الانتظار', 'positive');
  };

  const handleBuyEventBundle = (bundleId: 'blood_moon_chest' | 'rune_master_pack') => {
    if (!player) return;
    if (bundleId === 'blood_moon_chest') {
      if (player.crystals < 45) {
        soundFX.playError();
        return;
      }
      soundFX.playVictory();
      setPlayer({
        ...player,
        crystals: player.crystals - 45,
        gold: player.gold + 4500,
        forgeStones: player.forgeStones + 18,
        craftingEssence: (player.craftingEssence || 0) + 35,
        ownedRunes: {
          ...player.ownedRunes,
          poison: (player.ownedRunes?.poison || 0) + 1,
        },
        logs: appendLog(player.logs, 'economy', 'اقتنيت صندوق القمر القرمزي المحدود وحجر السم القاتل.', 'positive'),
      });
      showToast('صندوق القمر القرمزي: +4,500 ذهب، +18 صقل، +35 جوهر وحجر السم!', 'positive');
    } else {
      if (player.crystals < 65) {
        soundFX.playError();
        return;
      }
      const runePool: RuneId[] = ['poison', 'lifesteal', 'armor_pierce', 'crit_surge'];
      const r1 = runePool[Math.floor(Math.random() * runePool.length)];
      const r2 = runePool[Math.floor(Math.random() * runePool.length)];
      soundFX.playVictory();
      setPlayer({
        ...player,
        crystals: player.crystals - 65,
        craftingEssence: (player.craftingEssence || 0) + 55,
        ownedRunes: {
          ...player.ownedRunes,
          [r1]: (player.ownedRunes?.[r1] || 0) + 1,
          [r2]: (player.ownedRunes?.[r2] || 0) + (r1 === r2 ? 2 : 1),
        },
        logs: appendLog(
          player.logs,
          'economy',
          `فتحت حزمة سيد الأحجار الرونية (+55 جوهر، ${RUNES_CATALOG[r1].name} و${RUNES_CATALOG[r2].name}).`,
          'positive'
        ),
      });
      showToast('حزمة الأحجار الرونية: +55 جوهر وحجرين رونيين!', 'positive');
    }
  };

  const rankedOps = [...onlineOperatives].sort(
    (a, b) => b.powerScore + b.arenaRating - (a.powerScore + a.arenaRating)
  );
  const myGlobalRankIndex = authUser ? rankedOps.findIndex((op) => op.uid === authUser.uid) : -1;
  const myRankTitle =
    myGlobalRankIndex === 0
      ? 'سيد الظلال الأعلى'
      : myGlobalRankIndex === 1
      ? 'حامي العرش'
      : myGlobalRankIndex === 2
      ? 'كاسر الأسوار'
      : undefined;
  const unreadAlertsCount = pvpAlerts.filter((a) => !a.resolved).length;

  const handleRevengeAlert = async (alert: PvpAlertDoc, stance: RaidStance) => {
    if (!player || player.energy < 2 || player.hp < 20) {
      soundFX.playError();
      return;
    }

    const approxStat = Math.max(12, Math.round(alert.attackerPower / 7));
    const revengeTarget: RaidTarget = {
      id: `revenge-${alert.id}`,
      uid: alert.attackerUid,
      isRealPlayer: true,
      codename: `${alert.attackerName} (انتقام)`,
      factionId: alert.attackerFaction,
      level: Math.max(1, player.level),
      powerRating: alert.attackerPower,
      vaultGold: Math.max(550, Math.round(alert.goldAmount * 1.45)),
      contrabandStash: Math.max(3, Math.round(player.level * 1.3)),
      defenseScore: approxStat * 2,
      difficulty: 'خطير',
      attributes: {
        attack: approxStat,
        defense: approxStat,
        agility: approxStat,
        mastery: approxStat,
        influence: approxStat,
      },
      hqTrapLevel: Math.max(2, Math.min(20, player.level)),
    };

    soundFX.playStrike();
    const report = simulateVaultRaid(player, revengeTarget, stance);
    const decreeGoldMult =
      seasonDecree.bonusType === 'raid_gold' && seasonDecree.bonusPct > 0 ? 1 + seasonDecree.bonusPct / 100 : 1;
    const weekendSurgeMult = getWeekendSurgeStatus().isActive ? 1.35 : 1;
    const isNemesis = Boolean(alert.attackerUid && player.nemeses?.[alert.attackerUid]);
    const nemesisMult = isNemesis ? 1.25 : 1;
    const bonusGold = report.victory ? Math.round(report.goldStolen * 1.35 * decreeGoldMult * weekendSurgeMult * nemesisMult) : 0;
    const finalReport: RaidReport = {
      ...report,
      goldStolen: bonusGold,
      xpGained: report.victory ? Math.round(report.xpGained * weekendSurgeMult) : report.xpGained,
    };
    setLatestRaidReport(finalReport);

    let nextState: PlayerSaveState = {
      ...player,
      energy: player.energy - 2,
      hp: Math.max(1, player.hp - finalReport.damageTaken),
      gold: player.gold + finalReport.goldStolen,
      contraband: player.contraband + finalReport.contrabandStolen,
      forgeStones: player.forgeStones + finalReport.forgeStonesFound + (finalReport.victory ? 2 : 0),
      crystals: player.crystals + finalReport.crystalsFound,
      arenaRating: player.arenaRating + (isNemesis && finalReport.victory ? 15 : 0),
      seasonXp: player.seasonXp + (finalReport.victory ? 95 : 25),
      mysteryBoxWins: (player.mysteryBoxWins || 0) + (finalReport.victory ? 1 : 0),
      dailyProgress: {
        ...player.dailyProgress,
        raids: player.dailyProgress.raids + (finalReport.victory ? 1 : 0),
      },
      stats: {
        ...player.stats,
        raidsWon: player.stats.raidsWon + (finalReport.victory ? 1 : 0),
        raidsLost: player.stats.raidsLost + (finalReport.victory ? 0 : 1),
        totalGoldEarned: player.stats.totalGoldEarned + finalReport.goldStolen,
      },
    };

    if (finalReport.victory && authUser && authUser.emailVerified) {
      const matchingBounties = bounties.filter(
        (b) => b.status === 'open' && b.targetUid === alert.attackerUid && b.posterUid !== authUser.uid
      );
      for (const b of matchingBounties) {
        nextState = {
          ...nextState,
          gold: nextState.gold + b.rewardGold,
          crystals: nextState.crystals + b.rewardCrystals,
        };
        void claimBounty(b.id, authUser.uid, player.codename);
        void sendPvpAlert({
          targetUid: b.posterUid,
          attackerUid: authUser.uid,
          attackerName: player.codename,
          attackerFaction: player.factionId,
          attackerPower: getPlayerPowerScore(getEffectiveAttributes(player)),
          alertType: 'bounty_claimed',
          summary: `أتم ${player.codename} عقد المطاردة على ${b.targetName} أثناء هجوم الانتقام!`,
          goldAmount: b.rewardGold,
          crystalAmount: b.rewardCrystals,
        });
      }
      if (player.clanId) {
        const warHour = getWarHourStatus();
        const warGain = warHour.isActive ? 30 : 15;
        void addClanWarPoints(player.clanId, warGain);
        const nowMs = Date.now();
        for (const w of clanWars) {
          if (
            w.status === 'active' &&
            nowMs < w.endsAt &&
            (w.challengerClanId === player.clanId || w.defenderClanId === player.clanId)
          ) {
            void addClanWarScore(w, player.clanId, warGain);
          }
        }
      }
    }

    const { next: leveled, leveledUp } = applyXpAndLevelUp(nextState, finalReport.xpGained + (finalReport.victory ? 80 : 15));
    nextState = leveled;
    nextState.logs = appendLog(
      nextState.logs,
      'raid',
      finalReport.victory
        ? `انتقام مضاعف ناجح ضد ${alert.attackerName}: استعدت +${finalReport.goldStolen} ذهب و+2 أحجار صقل!`
        : `تعثر هجوم الانتقام ضد ${alert.attackerName}.`,
      finalReport.victory ? 'positive' : 'warning'
    );
    setPlayer(nextState);

    if (authUser && authUser.emailVerified) {
      await resolvePvpAlert(alert.id);
      if (finalReport.victory) {
        void sendPvpAlert({
          targetUid: alert.attackerUid,
          attackerUid: authUser.uid,
          attackerName: player.codename,
          attackerFaction: player.factionId,
          attackerPower: getPlayerPowerScore(getEffectiveAttributes(player)),
          alertType: 'raid_incoming',
          summary: `نفّذ ${player.codename} انتقاماً مضاعفاً واسترد ${finalReport.goldStolen} ذهب من خزنتك!`,
          goldAmount: finalReport.goldStolen,
        });
      }
    }

    if (finalReport.victory) {
      if (leveledUp) soundFX.playLevelUp();
      else soundFX.playVictory();
      showToast(`انتقام مضاعف! +${finalReport.goldStolen} ذهب و+2 صقل`, 'positive');
    } else {
      soundFX.playDefeat();
      showToast('فشل هجوم الانتقام — عزز قوتك وحاول مجدداً', 'warning');
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    if (!authUser || !authUser.emailVerified) return;
    const alert = pvpAlerts.find((a) => a.id === alertId);
    if (alert && !alert.resolved && alert.alertType === 'referral_bonus' && player) {
      soundFX.playVictory();
      const crystalsEarned = alert.crystalAmount || 0;
      setPlayer({
        ...player,
        gold: player.gold + alert.goldAmount,
        crystals: player.crystals + crystalsEarned,
        logs: appendLog(
          player.logs,
          'economy',
          `استلمت مكافأة إحالة صديق: +${alert.goldAmount} ذهب و+${crystalsEarned} بلورات!`,
          'positive'
        ),
      });
      showToast(`مكافأة الدعوة: +${alert.goldAmount} ذهب و+${crystalsEarned} بلورات!`, 'positive');
    }
    await resolvePvpAlert(alertId);
  };

  const handleChallengeRealPlayer = (op: PublicOperativeDoc) => {
    if (!player || player.energy < 2) {
      soundFX.playError();
      return;
    }
    const approxStat = Math.max(14, Math.round(op.powerScore / 6));
    const oppDef: ArenaOpponentDef = {
      id: `pvp-${op.uid}`,
      name: `${op.codename} (تحدي مباشر)`,
      tierLabel: `مستوى ${op.level} · تصنيف ${op.arenaRating}`,
      factionId: op.factionId,
      hp: 150 + op.level * 26,
      attack: approxStat,
      defense: Math.max(12, Math.round(op.defenseScore * 0.65)),
      rewardGold: 650 + op.level * 120,
      rewardForgeStones: 4,
      rewardCrystals: 0,
      rewardRating: 45,
      rewardXp: 260,
    };
    soundFX.playWarHorn();
    setPlayer({
      ...player,
      energy: player.energy - 2,
    });
    setActiveDuel(initArenaDuel(player, oppDef));
    showToast(`بدأت مبارزة مباشرة ضد ${op.codename}!`, 'positive');
  };

  const handleStrikeServerBoss = async () => {
    if (!player || !isOnline || !authUser || !serverBoss || player.energy < 2 || player.hp < 20) {
      soundFX.playError();
      return;
    }
    const attrs = getEffectiveAttributes(player);
    const critChance = Math.min(0.65, 0.16 + attrs.agility * 0.004);
    const isCrit = Math.random() < critChance;
    const rawDamage = Math.round((attrs.attack * 2.9 + attrs.mastery * 1.45) * (isCrit ? 1.65 : 1));
    const damage = Math.max(60, rawDamage);

    const existingMyDmg = serverBossDamages.find((d) => d.uid === authUser.uid) || null;
    const res = await strikeSharedServerBoss({
      boss: serverBoss,
      uid: authUser.uid,
      codename: player.codename,
      factionId: player.factionId,
      damage,
      existingMyDamage: existingMyDmg,
    });

    const goldChip = Math.round((180 + damage * 0.32) * (1 + player.prestigeRank * 0.25));
    const xpChip = Math.round(65 + damage * 0.06);

    let nextState: PlayerSaveState = {
      ...player,
      energy: player.energy - 2,
      hp: Math.max(5, player.hp - 12),
      gold: player.gold + goldChip,
      seasonXp: player.seasonXp + (res.defeatedCycle ? 180 : 50),
      dailyProgress: {
        ...player.dailyProgress,
        bossHits: player.dailyProgress.bossHits + 1,
      },
      stats: {
        ...player.stats,
        bossesDefeated: player.stats.bossesDefeated + (res.defeatedCycle ? 1 : 0),
        totalGoldEarned: player.stats.totalGoldEarned + goldChip,
      },
    };
    const { next: leveled, leveledUp } = applyXpAndLevelUp(nextState, xpChip);
    nextState = leveled;
    nextState.logs = appendLog(
      nextState.logs,
      'raid',
      res.defeatedCycle
        ? `سددت الضربة القاضية لزعيم السيرفر التعاوني! (+${goldChip} ذهب)`
        : `ألحقت ${damage} ضرراً بزعيم السيرفر التعاوني (+${goldChip} ذهب).`,
      'positive'
    );
    setPlayer(nextState);

    if (leveledUp) {
      soundFX.playLevelUp();
      showToast(`ترقية مستوى! وصلت للمستوى ${nextState.level}`, 'positive');
    } else if (res.defeatedCycle) {
      soundFX.playVictory();
      showToast('أسقطتم زعيم السيرفر المشترك! استلم جائزتك الآن!', 'positive');
    } else {
      if (isCrit) soundFX.playCritStrike();
      else soundFX.playBossHit();
      showToast(`${isCrit ? 'ضربة حاسمة! ' : ''}ضرر ${damage} لزعيم السيرفر (+${goldChip} ذهب)`, 'positive');
    }
  };

  const handleClaimServerBossReward = () => {
    if (!player || !serverBoss || serverBoss.lastDefeatedCycle <= 0) return;
    if ((player.lastClaimedServerBossCycle || 0) >= serverBoss.lastDefeatedCycle) {
      soundFX.playError();
      return;
    }

    const prestigeMult = 1 + player.prestigeRank * 0.25;
    const goldGain = Math.round(3500 * prestigeMult);
    soundFX.playVictory();
    setPlayer({
      ...player,
      gold: player.gold + goldGain,
      crystals: player.crystals + 2,
      forgeStones: player.forgeStones + 8,
      craftingEssence: (player.craftingEssence || 0) + 20,
      lastClaimedServerBossCycle: serverBoss.lastDefeatedCycle,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + goldGain,
      },
      logs: appendLog(
        player.logs,
        'raid',
        `استلمت مكافأة انتصار السيرفر (الدورة ${serverBoss.lastDefeatedCycle}): +${goldGain} ذهب، +2 بلورات و+8 صقل!`,
        'positive'
      ),
    });
    showToast(`مكافأة السيرفر: +${goldGain.toLocaleString('en-US')} ذهب و+2 بلورات!`, 'positive');
  };

  const handleSendGlobalChat = async (text: string) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    const ok = await sendGlobalChatMessage({
      uid: authUser.uid,
      codename: player.codename,
      factionId: player.factionId,
      titleTag: myRankTitle,
      chatColor: player.equippedChatColor || '',
      nameFrame: player.equippedFrame || '',
      text,
    });
    if (ok) {
      soundFX.playClick();
    } else {
      soundFX.playError();
    }
  };

  // --- Bounty Board Handlers ---
  const handleCreateBounty = async (
    targetUid: string,
    targetName: string,
    targetFaction: FactionId,
    rewardGold: number,
    rewardCrystals: number,
    reason: string
  ) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    const safeGold = Math.max(200, Math.round(rewardGold));
    const safeCrystals = Math.max(0, Math.round(rewardCrystals));
    if (player.gold < safeGold || player.crystals < safeCrystals || targetUid === authUser.uid) {
      soundFX.playError();
      return;
    }

    const ok = await createBounty({
      posterUid: authUser.uid,
      posterName: player.codename,
      targetUid,
      targetName,
      targetFaction,
      rewardGold: safeGold,
      rewardCrystals: safeCrystals,
      reason,
    });

    if (!ok) {
      soundFX.playError();
      showToast('تعذر نشر عقد المطاردة', 'warning');
      return;
    }

    soundFX.playCoin();
    setPlayer({
      ...player,
      gold: player.gold - safeGold,
      crystals: player.crystals - safeCrystals,
      logs: appendLog(player.logs, 'raid', `رصدت مكافأة ${safeGold} ذهب على رأس ${targetName}!`, 'positive'),
    });
    showToast(`تم نشر عقد المطاردة ضد ${targetName}!`, 'positive');
  };

  const handleCancelBounty = async (bounty: BountyDoc) => {
    if (!player || !authUser || bounty.posterUid !== authUser.uid) return;
    const ok = await cancelBounty(bounty.id);
    if (!ok) {
      soundFX.playError();
      return;
    }
    soundFX.playClick();
    setPlayer({
      ...player,
      gold: player.gold + bounty.rewardGold,
      crystals: player.crystals + bounty.rewardCrystals,
    });
    showToast(`تم إلغاء عقد المطاردة واسترداد ${bounty.rewardGold} ذهب`, 'positive');
  };

  // --- Clan Weekly Raid Boss Handlers ---
  const handleStrikeClanBoss = async () => {
    if (!player || !authUser || !authUser.emailVerified || !player.clanId || !clanRaidBoss) return;
    if (player.energy < 2 || player.hp < 20) {
      soundFX.playError();
      return;
    }

    const attrs = getEffectiveAttributes(player);
    const critChance = Math.min(0.65, 0.16 + attrs.agility * 0.004);
    const isCrit = Math.random() < critChance;
    const damage = Math.max(70, Math.round((attrs.attack * 3.1 + attrs.mastery * 1.5) * (isCrit ? 1.65 : 1)));
    const existingMyDmg = clanRaidDamages.find((d) => d.uid === authUser.uid) || null;

    const res = await strikeClanRaidBoss({
      clanId: player.clanId,
      boss: clanRaidBoss,
      uid: authUser.uid,
      codename: player.codename,
      damage,
      existingMyDamage: existingMyDmg,
    });

    const goldChip = Math.round((200 + damage * 0.28) * (1 + player.prestigeRank * 0.25));
    const { next: leveled, leveledUp } = applyXpAndLevelUp(
      {
        ...player,
        energy: player.energy - 2,
        hp: Math.max(5, player.hp - 12),
        gold: player.gold + goldChip,
        seasonXp: player.seasonXp + (res.defeatedCycle ? 140 : 40),
        stats: {
          ...player.stats,
          totalGoldEarned: player.stats.totalGoldEarned + goldChip,
        },
        logs: appendLog(
          player.logs,
          'raid',
          res.defeatedCycle
            ? `أسقطتم عملاق العشيرة التعاوني! (+${goldChip} ذهب)`
            : `ألحقت ${damage} ضرراً بعملاق العشيرة (+${goldChip} ذهب).`,
          'positive'
        ),
      },
      Math.round(55 + damage * 0.05)
    );
    setPlayer(leveled);

    if (leveledUp) {
      soundFX.playLevelUp();
      showToast(`ترقية مستوى! وصلت للمستوى ${leveled.level}`, 'positive');
    } else if (res.defeatedCycle) {
      soundFX.playVictory();
      showToast('سقط عملاق العشيرة! استلم غنيمتك الجماعية الآن!', 'positive');
    } else {
      if (isCrit) soundFX.playCritStrike();
      else soundFX.playBossHit();
      showToast(`${isCrit ? 'ضربة حاسمة! ' : ''}ضرر ${damage} لعملاق العشيرة (+${goldChip} ذهب)`, 'positive');
    }
  };

  const handleClaimClanBossReward = () => {
    if (!player || !clanRaidBoss || clanRaidBoss.lastDefeatedCycle <= 0) return;
    if ((player.lastClaimedClanBossCycle || 0) >= clanRaidBoss.lastDefeatedCycle) {
      soundFX.playError();
      return;
    }

    soundFX.playVictory();
    setPlayer({
      ...player,
      gold: player.gold + 2200,
      crystals: player.crystals + 2,
      forgeStones: player.forgeStones + 5,
      blueprints: (player.blueprints || 0) + 1,
      lastClaimedClanBossCycle: clanRaidBoss.lastDefeatedCycle,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + 2200,
      },
      logs: appendLog(
        player.logs,
        'raid',
        `استلمت غنيمة عملاق العشيرة (الدورة ${clanRaidBoss.lastDefeatedCycle}): +2,200 ذهب، +2 بلورات ومخطط سلاح!`,
        'positive'
      ),
    });
    showToast('غنيمة العشيرة: +2,200 ذهب، +2 بلورات ومخطط نادر!', 'positive');
  };

  // --- Formal 24-Hour Clan vs Clan War Handlers ---
  const handleDeclareClanWar = async (defenderClan: OnlineClanDoc) => {
    if (!player || !authUser || !authUser.emailVerified || !player.clanId) {
      soundFX.playError();
      return;
    }
    const myClan = onlineClans.find((c) => c.id === player.clanId);
    if (!myClan || defenderClan.id === myClan.id) {
      soundFX.playError();
      return;
    }
    const nowMs = Date.now();
    const hasOverlap = clanWars.some(
      (w) =>
        w.status === 'active' &&
        nowMs < w.endsAt &&
        ((w.challengerClanId === myClan.id && w.defenderClanId === defenderClan.id) ||
          (w.challengerClanId === defenderClan.id && w.defenderClanId === myClan.id))
    );
    if (hasOverlap) {
      soundFX.playError();
      showToast('توجد بالفعل حرب نشطة بين العشيرتين!', 'warning');
      return;
    }

    const ok = await declareClanWar(myClan, defenderClan);
    if (!ok) {
      soundFX.playError();
      showToast('تعذر إعلان حرب العشيرة — تحقق من الاتصال', 'warning');
      return;
    }

    soundFX.playWarHorn();
    setPlayer({
      ...player,
      logs: appendLog(player.logs, 'raid', `أعلنت عشيرتك حرباً رسمية 24 ساعة ضد ${defenderClan.name}!`, 'positive'),
    });
    showToast(`دقّت طبول الحرب! بدأت المواجهة ضد ${defenderClan.name} (24 ساعة)`, 'positive');
  };

  const handleStrikeClanWar = async (war: ClanWarDoc) => {
    if (!player || !authUser || !authUser.emailVerified || !player.clanId) return;
    if (war.challengerClanId !== player.clanId && war.defenderClanId !== player.clanId) return;
    if (war.status !== 'active' || Date.now() >= war.endsAt || player.energy < 2 || player.hp < 15) {
      soundFX.playError();
      return;
    }

    const attrs = getEffectiveAttributes(player);
    const warHour = getWarHourStatus();
    const basePts = Math.max(25, Math.min(200, Math.round(30 + attrs.attack * 0.7 + attrs.influence * 0.4)));
    const pts = Math.min(400, basePts * (warHour.isActive ? 2 : 1));
    const goldGain = Math.round((260 + player.level * 35) * (warHour.isActive ? 1.4 : 1));

    const ok = await addClanWarScore(war, player.clanId, pts);
    if (!ok) {
      soundFX.playError();
      return;
    }
    void addClanWarPoints(player.clanId, pts);

    const { next: leveled, leveledUp } = applyXpAndLevelUp(
      {
        ...player,
        energy: player.energy - 2,
        hp: Math.max(5, player.hp - 12),
        gold: player.gold + goldGain,
        seasonXp: player.seasonXp + 75,
        stats: {
          ...player.stats,
          totalGoldEarned: player.stats.totalGoldEarned + goldGain,
        },
        logs: appendLog(
          player.logs,
          'raid',
          `سددت ضربة حرب عشائر (+${pts} نقطة حرب · +${goldGain} ذهب).`,
          'positive'
        ),
      },
      95
    );
    setPlayer(leveled);
    if (leveledUp) soundFX.playLevelUp();
    else soundFX.playWarHorn();
    showToast(`ضربة حرب عشيرة: +${pts} نقطة حرب و+${goldGain} ذهب!`, 'positive');
  };

  const handleClaimClanWarReward = async (war: ClanWarDoc) => {
    if (!player || !player.clanId) return;
    if (war.challengerClanId !== player.clanId && war.defenderClanId !== player.clanId) return;
    const claimed = player.claimedClanWarIds || [];
    if (claimed.includes(war.id)) return;
    if (war.status === 'active' && Date.now() < war.endsAt) {
      soundFX.playError();
      return;
    }

    if (war.status === 'active' && Date.now() >= war.endsAt) {
      await finalizeClanWar(war);
    }

    const isWinner =
      (war.challengerClanId === player.clanId && war.challengerScore > war.defenderScore) ||
      (war.defenderClanId === player.clanId && war.defenderScore > war.challengerScore);

    const goldReward = isWinner ? 2500 : 900;
    const crystalReward = isWinner ? 3 : 1;
    const stoneReward = isWinner ? 6 : 2;
    const seasonXpGain = isWinner ? 150 : 75;

    soundFX.playVictory();
    setPlayer({
      ...player,
      gold: player.gold + goldReward,
      crystals: player.crystals + crystalReward,
      forgeStones: player.forgeStones + stoneReward,
      seasonXp: player.seasonXp + seasonXpGain,
      claimedClanWarIds: [...claimed, war.id],
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + goldReward,
      },
      logs: appendLog(
        player.logs,
        'raid',
        `${isWinner ? 'غنائم نصر حرب العشيرة' : 'تعويض حرب العشيرة'}: +${goldReward} ذهب، +${crystalReward} بلورات و+${stoneReward} صقل!`,
        'positive'
      ),
    });
    showToast(
      `${isWinner ? 'انتصار العشيرة! ' : 'انتهت الحرب: '}+${goldReward} ذهب و+${crystalReward} بلورات!`,
      'positive'
    );
  };

  // --- Cosmetics Handlers ---
  const handleBuyCosmetic = (cosmeticId: CosmeticId) => {
    if (!player) return;
    const item = COSMETICS_CATALOG.find((c) => c.id === cosmeticId);
    if (!item || (player.ownedCosmetics || []).includes(cosmeticId)) return;
    if (player.crystals < item.priceCrystals) {
      soundFX.playError();
      return;
    }
    soundFX.playVictory();
    setPlayer({
      ...player,
      crystals: player.crystals - item.priceCrystals,
      ownedCosmetics: [...(player.ownedCosmetics || []), cosmeticId],
      equippedFrame: item.category === 'frame' ? cosmeticId : player.equippedFrame,
      equippedChatColor: item.category === 'chat_color' ? cosmeticId : player.equippedChatColor,
      logs: appendLog(player.logs, 'economy', `اقتنيت وفعّلت المظهر "${item.name}".`, 'positive'),
    });
    showToast(`تم تفعيل ${item.name}!`, 'positive');
  };

  const handleEquipCosmetic = (category: 'frame' | 'chat_color', cosmeticId: CosmeticId | null) => {
    if (!player) return;
    if (cosmeticId && !(player.ownedCosmetics || []).includes(cosmeticId)) return;
    soundFX.playClick();
    setPlayer({
      ...player,
      equippedFrame: category === 'frame' ? cosmeticId : player.equippedFrame,
      equippedChatColor: category === 'chat_color' ? cosmeticId : player.equippedChatColor,
    });
    showToast(cosmeticId ? 'تم تحديث مظهرك بنجاح' : 'تمت إزالة التخصيص', 'positive');
  };

  // --- Live Timed Auction Handlers ---
  const handleBidTimedAuction = async (bidAmount: number) => {
    if (!player || !authUser || !authUser.emailVerified || !timedAuction) return;
    if (
      Date.now() >= timedAuction.endsAt ||
      timedAuction.highestBidderUid === authUser.uid ||
      player.gold < bidAmount ||
      bidAmount <= timedAuction.currentBid
    ) {
      soundFX.playError();
      return;
    }
    const ok = await placeTimedAuctionBid({
      auction: timedAuction,
      bidAmount,
      bidderUid: authUser.uid,
      bidderName: player.codename,
    });
    if (ok) {
      soundFX.playCoin();
      showToast(`سُجّلت مزايدتك (${bidAmount.toLocaleString('en-US')} ذهب) — يُخصم الذهب عند الفوز والاستلام`, 'positive');
    } else {
      soundFX.playError();
      showToast('سبقك لاعب آخر بسعر أعلى!', 'warning');
    }
  };

  const handleClaimTimedAuction = async () => {
    if (!player || !authUser || !authUser.emailVerified || !timedAuction) return;
    if (
      Date.now() < timedAuction.endsAt ||
      timedAuction.highestBidderUid !== authUser.uid ||
      timedAuction.claimedByWinner
    ) {
      soundFX.playError();
      return;
    }
    if (player.gold < timedAuction.currentBid) {
      soundFX.playError();
      showToast(`تحتاج إلى ${timedAuction.currentBid.toLocaleString('en-US')} ذهب لاستلام جائزتك من المزاد`, 'warning');
      return;
    }
    const ok = await claimTimedAuctionPrize(timedAuction.id);
    if (!ok) {
      soundFX.playError();
      return;
    }

    let nextState: PlayerSaveState = {
      ...player,
      gold: player.gold - timedAuction.currentBid,
    };

    if (timedAuction.itemType === 'blueprint_pack') {
      nextState = { ...nextState, blueprints: (nextState.blueprints || 0) + timedAuction.quantity };
    } else if (timedAuction.itemType === 'essence_crate') {
      nextState = { ...nextState, craftingEssence: (nextState.craftingEssence || 0) + timedAuction.quantity };
    } else if (timedAuction.itemType === 'crystal_pouch') {
      nextState = { ...nextState, crystals: nextState.crystals + timedAuction.quantity };
    } else if (timedAuction.itemType === 'rune') {
      const rId = timedAuction.itemId as RuneId;
      nextState = {
        ...nextState,
        ownedRunes: {
          ...nextState.ownedRunes,
          [rId]: (nextState.ownedRunes?.[rId] || 0) + timedAuction.quantity,
        },
      };
    }

    soundFX.playVictory();
    nextState.logs = appendLog(
      nextState.logs,
      'economy',
      `فزت بالمزاد السريع وحصلت على "${timedAuction.itemName}" مقابل ${timedAuction.currentBid} ذهب!`,
      'positive'
    );
    setPlayer(nextState);
    showToast(`مبروك! استلمت ${timedAuction.itemName}!`, 'positive');
    void rotateTimedAuction(timedAuction.cycle);
  };

  const handleRotateTimedAuction = async () => {
    if (!timedAuction || !authUser || !authUser.emailVerified) return;
    const ok = await rotateTimedAuction(timedAuction.cycle);
    if (ok) {
      soundFX.playClick();
      showToast('تم افتتاح جولة مزاد سريع جديدة!', 'positive');
    }
  };

  // --- 14-Day Season Cycle & Referral Handlers ---
  const handleClaimSeasonEnd = () => {
    if (!player) return;
    const seasonInfo = getCurrentSeasonInfo(Date.now());
    if ((player.lastClaimedSeasonNumber || 0) >= seasonInfo.seasonNumber || player.seasonXp < 500) {
      soundFX.playError();
      return;
    }

    soundFX.playVictory();
    setPlayer({
      ...player,
      gold: player.gold + 1500,
      crystals: player.crystals + 3,
      seasonMedals: (player.seasonMedals || 0) + 1,
      lastClaimedSeasonNumber: seasonInfo.seasonNumber,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + 1500,
      },
      logs: appendLog(
        player.logs,
        'system',
        `حصدت ميدالية شرف الموسم #${seasonInfo.seasonNumber} (+3 بلورات + 1,500 ذهب)!`,
        'positive'
      ),
    });

    if (authUser && authUser.emailVerified) {
      const topOp = rankedOps[0];
      const topClan = onlineClans[0];
      void recordSeasonChampion({
        seasonNumber: seasonInfo.seasonNumber,
        championUid: topOp?.uid || authUser.uid,
        championName: topOp?.codename || player.codename,
        championFaction: topOp?.factionId || player.factionId,
        championPower: topOp?.powerScore || getPlayerPowerScore(getEffectiveAttributes(player)),
        topClanName: topClan?.name || player.clanName,
        recordedAt: Date.now(),
      });
    }
    showToast(`حصلت على ميدالية الموسم #${seasonInfo.seasonNumber} (+3 بلورات)!`, 'positive');
  };

  const handleRedeemReferral = useCallback(
    async (rawCode: string) => {
      if (!player || !authUser || !authUser.emailVerified || player.referralClaimed) return;
      const code = rawCode.trim().toUpperCase();
      if (code.length < 4) return;

      const myCode = authUser.uid.slice(0, 8).toUpperCase();
      if (code === myCode) {
        soundFX.playError();
        showToast('لا يمكنك تفعيل كود الدعوة الخاص بك!', 'warning');
        return;
      }

      const referrer = onlineOperatives.find(
        (op) => (op.referralCode || op.uid.slice(0, 8).toUpperCase()) === code && op.uid !== authUser.uid
      );
      if (!referrer) {
        soundFX.playError();
        showToast('كود الدعوة غير موجود أو لم يدخل صاحبه المتصدرين بعد', 'warning');
        return;
      }

      const already = await checkMyReferralClaimed(authUser.uid);
      if (already) {
        setPlayer((prev) => (prev ? { ...prev, referralClaimed: true } : prev));
        showToast('تم تفعيل دعوة مسبقاً على هذا الحساب', 'warning');
        return;
      }

      const ok = await redeemReferralCode({
        claimantUid: authUser.uid,
        referrerUid: referrer.uid,
        referrerCode: code,
      });
      if (!ok) {
        soundFX.playError();
        showToast('تعذر تفعيل كود الدعوة حالياً', 'warning');
        return;
      }

      soundFX.playVictory();
      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              referralClaimed: true,
              crystals: prev.crystals + 15,
              gold: prev.gold + 2500,
              forgeStones: prev.forgeStones + 5,
              logs: appendLog(
                prev.logs,
                'system',
                `فعّلت دعوة القائد ${referrer.codename} وربحت +15 بلورة و+2,500 ذهب!`,
                'positive'
              ),
            }
          : prev
      );

      void sendPvpAlert({
        targetUid: referrer.uid,
        attackerUid: authUser.uid,
        attackerName: player.codename,
        attackerFaction: player.factionId,
        attackerPower: getPlayerPowerScore(getEffectiveAttributes(player)),
        alertType: 'referral_bonus',
        summary: `انضم العميل ${player.codename} عبر رابط دعوتك! اضغط استلام لتحصل على +10 بلورات و1,500 ذهب.`,
        goldAmount: 1500,
        crystalAmount: 10,
      });
      showToast(`مبروك! حصلت على +15 بلورة و+2,500 ذهب من دعوة ${referrer.codename}!`, 'positive');
    },
    [player, authUser, onlineOperatives, showToast]
  );

  // Auto-apply ?ref= URL referral code once player & online operatives load
  useEffect(() => {
    if (
      pendingRefCode &&
      gameState === 'PLAYING' &&
      authUser &&
      authUser.emailVerified &&
      player &&
      !player.referralClaimed &&
      onlineOperatives.length > 0
    ) {
      const codeToUse = pendingRefCode;
      setPendingRefCode('');
      void handleRedeemReferral(codeToUse);
    }
  }, [pendingRefCode, gameState, authUser, player, onlineOperatives.length, handleRedeemReferral]);

  const handleOpenMysteryBox = () => {
    if (!player) return;
    const nowTs = Date.now();
    const cooldownMs = 4 * 3600 * 1000;
    const readyByTime = nowTs - (player.lastMysteryBoxAt || 0) >= cooldownMs;
    const readyByWins = (player.mysteryBoxWins || 0) >= 5;

    if (!readyByTime && !readyByWins) {
      soundFX.playError();
      return;
    }

    const roll = Math.random();
    let rewardGold = 0;
    let rewardCrystals = 0;
    let rewardStones = 0;
    let rewardEssence = 0;
    let rewardRune: RuneId | null = null;
    let toastMsg = '';

    if (roll < 0.25) {
      rewardGold = 1800 + player.level * 140;
      rewardCrystals = 2;
      toastMsg = `صندوق الغموض: +${rewardGold.toLocaleString('en-US')} ذهب و+2 بلورات!`;
    } else if (roll < 0.55) {
      rewardStones = 6;
      rewardEssence = 18;
      rewardGold = 1100;
      toastMsg = `صندوق الغموض: +${rewardGold} ذهب، +6 أحجار صقل و+18 جوهر!`;
    } else if (roll < 0.8) {
      const runePool: RuneId[] = ['poison', 'lifesteal', 'armor_pierce', 'crit_surge'];
      rewardRune = runePool[Math.floor(Math.random() * runePool.length)];
      rewardGold = 900;
      toastMsg = `صندوق الغموض: حجر ${RUNES_CATALOG[rewardRune].name} + ${rewardGold} ذهب!`;
    } else {
      rewardGold = 3200 + player.level * 220;
      rewardCrystals = 1;
      toastMsg = `كنز نادر من صندوق الغموض: +${rewardGold.toLocaleString('en-US')} ذهب و+1 بلورة!`;
    }

    soundFX.playVictory();
    setPlayer({
      ...player,
      gold: player.gold + rewardGold,
      crystals: player.crystals + rewardCrystals,
      forgeStones: player.forgeStones + rewardStones,
      craftingEssence: (player.craftingEssence || 0) + rewardEssence,
      ownedRunes: rewardRune
        ? { ...player.ownedRunes, [rewardRune]: (player.ownedRunes?.[rewardRune] || 0) + 1 }
        : player.ownedRunes,
      lastMysteryBoxAt: readyByTime ? nowTs : player.lastMysteryBoxAt,
      mysteryBoxWins: readyByTime ? player.mysteryBoxWins || 0 : Math.max(0, (player.mysteryBoxWins || 0) - 5),
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + rewardGold,
      },
      logs: appendLog(player.logs, 'economy', toastMsg, 'positive'),
    });
    showToast(toastMsg, 'positive');
  };

  const handleSpinFortuneWheel = (useCrystals = false) => {
    if (!player) return;
    const today = getTodayDateKey();
    const spinsToday = player.lastWheelDate === today ? player.wheelSpinsToday || 0 : 0;

    if (!useCrystals && spinsToday >= 1) {
      soundFX.playError();
      return;
    }
    if (useCrystals && player.crystals < 4) {
      soundFX.playError();
      showToast('تحتاج إلى 4 بلورات للّفّة الإضافية', 'warning');
      return;
    }

    const slot = Math.floor(Math.random() * 6);
    let goldAdd = 0;
    let crystalsAdd = 0;
    let stonesAdd = 0;
    let essenceAdd = 0;
    let energyAdd = 0;
    let runeAdd: RuneId | null = null;
    let prizeLabel = '';

    if (slot === 0) {
      crystalsAdd = 3;
      prizeLabel = '+3 بلورات ظل';
    } else if (slot === 1) {
      goldAdd = 2500 + player.level * 120;
      prizeLabel = `+${goldAdd.toLocaleString('en-US')} ذهب`;
    } else if (slot === 2) {
      stonesAdd = 6;
      prizeLabel = '+6 أحجار صقل';
    } else if (slot === 3) {
      essenceAdd = 15;
      prizeLabel = '+15 جوهر صياغة';
    } else if (slot === 4) {
      const pool: RuneId[] = ['poison', 'lifesteal', 'armor_pierce', 'crit_surge'];
      runeAdd = pool[Math.floor(Math.random() * pool.length)];
      prizeLabel = `حجر ${RUNES_CATALOG[runeAdd].name}`;
    } else {
      goldAdd = 1200;
      energyAdd = 4;
      prizeLabel = '+1,200 ذهب و+4 طاقة';
    }

    soundFX.playVictory();
    setPlayer({
      ...player,
      crystals: player.crystals - (useCrystals ? 4 : 0) + crystalsAdd,
      gold: player.gold + goldAdd,
      forgeStones: player.forgeStones + stonesAdd,
      craftingEssence: (player.craftingEssence || 0) + essenceAdd,
      energy: Math.min(player.maxEnergy + 4, player.energy + energyAdd),
      ownedRunes: runeAdd
        ? { ...player.ownedRunes, [runeAdd]: (player.ownedRunes?.[runeAdd] || 0) + 1 }
        : player.ownedRunes,
      lastWheelDate: today,
      wheelSpinsToday: spinsToday + 1,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + goldAdd,
      },
      logs: appendLog(player.logs, 'economy', `عجلة الحظ الليلية: ربحت ${prizeLabel}!`, 'positive'),
    });
    showToast(`عجلة الحظ: ربحت ${prizeLabel}!`, 'positive');
  };

  // ===============================================================
  // New Feature Handlers (Story Cases, Live Duels, Co-op Heists, Friends, Tournament Bets)
  // ===============================================================
  const handleStartStoryCase = (storyCase: StoryCaseDef) => {
    if (!player || player.activeStoryCase) {
      soundFX.playError();
      return;
    }
    const unlocked = player.level >= storyCase.minLevel || player.prestigeRank > 0;
    const cooldownEnd = player.storyCaseCooldowns?.[storyCase.id] || 0;
    if (!unlocked || Date.now() < cooldownEnd || player.energy < storyCase.energyCost || player.hp < 20) {
      soundFX.playError();
      showToast('تحقق من الطاقة والصحة والمهلة قبل فتح الملف', 'warning');
      return;
    }
    soundFX.playClick();
    setPlayer({
      ...player,
      energy: player.energy - storyCase.energyCost,
      activeStoryCase: {
        caseId: storyCase.id,
        currentNodeId: storyCase.nodes[0].id,
        stepIndex: 0,
        accumulatedGold: 0,
        accumulatedEssence: 0,
        outcomeLog: [],
        finished: false,
        success: false,
      },
    });
  };

  const handleAdvanceStoryChoice = (choice: StoryCaseChoice) => {
    if (!player || !player.activeStoryCase || player.activeStoryCase.finished) return;
    const caseDef = STORY_CASES.find((c) => c.id === player.activeStoryCase?.caseId);
    if (!caseDef) return;

    const effAttrs = getEffectiveAttributes(player);
    const statVal = effAttrs[choice.stat] || 10;
    const passChance = Math.min(95, Math.max(25, Math.round(55 + (statVal - choice.difficulty) * 2.2)));
    const passed = Math.random() * 100 < passChance;

    const nextGold = player.activeStoryCase.accumulatedGold + (passed ? choice.bonusGold : Math.round(choice.bonusGold * 0.2));
    const nextEssence = player.activeStoryCase.accumulatedEssence + (passed ? choice.bonusEssence : 0);
    const nextHp = passed ? player.hp : Math.max(5, player.hp - choice.failDamage);
    const nextLog = [
      ...player.activeStoryCase.outcomeLog,
      passed ? `نجاح (${passChance}%): ${choice.successText}` : `إخفاق (${passChance}%): ${choice.failText}`,
    ];

    const isEnd = choice.nextNodeId === null;
    if (!isEnd && choice.nextNodeId) {
      if (passed) soundFX.playClick();
      else soundFX.playError();
      setPlayer({
        ...player,
        hp: nextHp,
        activeStoryCase: {
          ...player.activeStoryCase,
          currentNodeId: choice.nextNodeId,
          stepIndex: player.activeStoryCase.stepIndex + 1,
          accumulatedGold: nextGold,
          accumulatedEssence: nextEssence,
          outcomeLog: nextLog,
        },
      });
      return;
    }

    const weekendMult = getWeekendSurgeStatus().isActive ? 1.35 : 1;
    const totalGold = Math.round((caseDef.baseGold + nextGold) * weekendMult);
    const totalXp = Math.round(caseDef.baseXp * weekendMult);

    let nextState: PlayerSaveState = {
      ...player,
      hp: nextHp,
      gold: player.gold + totalGold,
      forgeStones: player.forgeStones + caseDef.baseStones,
      craftingEssence: (player.craftingEssence || 0) + nextEssence,
      seasonXp: player.seasonXp + 55,
      storyCaseCooldowns: {
        ...(player.storyCaseCooldowns || {}),
        [caseDef.id]: Date.now() + 90_000,
      },
      activeStoryCase: {
        ...player.activeStoryCase,
        stepIndex: player.activeStoryCase.stepIndex + 1,
        accumulatedGold: nextGold,
        accumulatedEssence: nextEssence,
        outcomeLog: nextLog,
        finished: true,
        success: true,
      },
      stats: {
        ...player.stats,
        missionsCompleted: player.stats.missionsCompleted + 1,
        totalGoldEarned: player.stats.totalGoldEarned + totalGold,
      },
    };
    const { next: leveled } = applyXpAndLevelUp(nextState, totalXp);
    nextState = leveled;
    nextState.logs = appendLog(
      nextState.logs,
      'mission',
      `أغلقت قضية "${caseDef.title}": +${totalGold} ذهب، +${caseDef.baseStones} صقل${nextEssence > 0 ? `، +${nextEssence} جوهر` : ''}.`,
      'positive'
    );
    soundFX.playVictory();
    setPlayer(nextState);
    showToast(`أُغلقت القضية! +${totalGold} ذهب و+${totalXp} XP`, 'positive');
  };

  const handleResetStoryCase = () => {
    if (!player) return;
    soundFX.playClick();
    setPlayer({
      ...player,
      activeStoryCase: null,
    });
  };

  const handleToggleFriend = (uid: string, codename: string) => {
    if (!player || !uid || uid === authUser?.uid) return;
    soundFX.playClick();
    const list = player.friendUids || [];
    const exists = list.includes(uid);
    const nextList = exists ? list.filter((id) => id !== uid) : [...list, uid];
    setPlayer({
      ...player,
      friendUids: nextList,
    });
    showToast(exists ? `أُزيل ${codename} من قائمة الأصدقاء` : `تمت إضافة ${codename} كصديق!`, 'positive');
  };

  const handleCreateLiveDuel = async (stakeGold: number, targetOp?: PublicOperativeDoc | null) => {
    if (!player || !authUser || !authUser.emailVerified) {
      soundFX.playError();
      showToast('يجب تسجيل الدخول عبر Google لإنشاء مبارزة حية', 'warning');
      return;
    }
    const safeStake = Math.max(0, Math.min(500000, Math.round(stakeGold)));
    if (player.gold < safeStake) {
      soundFX.playError();
      showToast('رصيد الذهب لا يكفي لتغطية الرهان', 'warning');
      return;
    }
    const powerScore = getPlayerPowerScore(getEffectiveAttributes(player));
    const createdId = await createLiveDuel({
      challengerUid: authUser.uid,
      challengerName: player.codename,
      challengerFaction: player.factionId,
      challengerPower: powerScore,
      challengerMaxHp: player.maxHp,
      stakeGold: safeStake,
      targetOpponent: targetOp || null,
    });
    if (!createdId) {
      soundFX.playError();
      showToast('تعذر إنشاء غرفة المبارزة الحية', 'warning');
      return;
    }
    soundFX.playWarHorn();
    setPlayer((prev) =>
      prev
        ? {
            ...prev,
            gold: Math.max(0, prev.gold - safeStake),
            logs: appendLog(
              prev.logs,
              'raid',
              targetOp
                ? `أرسلت تحدي مبارزة حية إلى ${targetOp.codename} برهان ${safeStake} ذهب.`
                : `فتحت غرفة مبارزة حية برهان ${safeStake} ذهب.`,
              'positive'
            ),
          }
        : prev
    );
    showToast(
      targetOp ? `تم إرسال التحدي المباشر إلى ${targetOp.codename}!` : 'تم فتح غرفة المبارزة الحية بنجاح!',
      'positive'
    );
  };

  const handleJoinLiveDuel = async (duel: LivePvpDuelDoc) => {
    if (!player || !authUser || !authUser.emailVerified) {
      soundFX.playError();
      return;
    }
    if (player.gold < duel.stakeGold) {
      soundFX.playError();
      showToast(`تحتاج إلى ${duel.stakeGold.toLocaleString('en-US')} ذهب لدخول هذه المبارزة`, 'warning');
      return;
    }
    const powerScore = getPlayerPowerScore(getEffectiveAttributes(player));
    const ok = await joinLiveDuel({
      duel,
      opponentUid: authUser.uid,
      opponentName: player.codename,
      opponentFaction: player.factionId,
      opponentPower: powerScore,
      opponentMaxHp: player.maxHp,
    });
    if (!ok) {
      soundFX.playError();
      showToast('تعذر الانضمام إلى المبارزة — ربما بدأت أو اكتملت', 'warning');
      return;
    }
    soundFX.playWarHorn();
    setPlayer((prev) => (prev ? { ...prev, gold: Math.max(0, prev.gold - duel.stakeGold) } : prev));
    showToast(`دخلت المبارزة الحية ضد ${duel.challengerName}!`, 'positive');
  };

  const handleCancelLiveDuel = async (duelId: string) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    const targetDuel = liveDuels.find((d) => d.id === duelId);
    const ok = await cancelLiveDuel(duelId);
    if (!ok) {
      soundFX.playError();
      return;
    }
    soundFX.playClick();
    if (targetDuel && targetDuel.challengerUid === authUser.uid && targetDuel.stakeGold > 0) {
      setPlayer((prev) => (prev ? { ...prev, gold: prev.gold + targetDuel.stakeGold } : prev));
    }
    showToast('تم إلغاء الغرفة واسترداد الرهان', 'positive');
  };

  const handleSubmitLiveDuelMove = async (duel: LivePvpDuelDoc, action: Exclude<LiveDuelAction, ''>) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    const ok = await submitLiveDuelMove({
      duel,
      myUid: authUser.uid,
      action,
    });
    if (ok) {
      soundFX.playStrike();
    } else {
      soundFX.playError();
    }
  };

  const handleClaimLiveDuelReward = (duel: LivePvpDuelDoc) => {
    if (!player || !authUser || duel.status !== 'finished' || duel.winnerUid !== authUser.uid) {
      soundFX.playError();
      return;
    }
    const claimed = player.claimedLiveDuelIds || [];
    if (claimed.includes(duel.id)) return;
    const rewardGold = duel.stakeGold * 2 + 450;
    soundFX.playVictory();
    setPlayer({
      ...player,
      gold: player.gold + rewardGold,
      arenaRating: player.arenaRating + 55,
      seasonXp: player.seasonXp + 75,
      claimedLiveDuelIds: [...claimed, duel.id],
      stats: {
        ...player.stats,
        duelsWon: player.stats.duelsWon + 1,
        totalGoldEarned: player.stats.totalGoldEarned + rewardGold,
      },
      logs: appendLog(
        player.logs,
        'raid',
        `فزت في المبارزة الحية! استلمت +${rewardGold.toLocaleString('en-US')} ذهب و+55 تصنيف حلبة.`,
        'positive'
      ),
    });
    showToast(`انتصار حي! +${rewardGold.toLocaleString('en-US')} ذهب و+55 تصنيف`, 'positive');
  };

  const handleCreateCoopHeist = async (template: CoopHeistTemplateDef) => {
    if (!player || !authUser || !authUser.emailVerified) {
      soundFX.playError();
      showToast('يجب تسجيل الدخول عبر Google لتأسيس غرفة سطو جماعي', 'warning');
      return;
    }
    const powerScore = getPlayerPowerScore(getEffectiveAttributes(player));
    const heistId = await createCoopHeist({
      hostUid: authUser.uid,
      hostName: player.codename,
      hostFaction: player.factionId,
      hostPower: powerScore,
      template,
    });
    if (!heistId) {
      soundFX.playError();
      showToast('تعذر إنشاء غرفة السطو الجماعي', 'warning');
      return;
    }
    soundFX.playWarHorn();
    showToast(`تم تأسيس غرفة "${template.title}" — بانتظار انضمام فريقك!`, 'positive');
  };

  const handleJoinCoopHeist = async (heist: CoopHeistDoc) => {
    if (!player || !authUser || !authUser.emailVerified) {
      soundFX.playError();
      return;
    }
    const powerScore = getPlayerPowerScore(getEffectiveAttributes(player));
    const ok = await joinCoopHeist({
      heist,
      uid: authUser.uid,
      codename: player.codename,
      factionId: player.factionId,
      powerScore,
    });
    if (!ok) {
      soundFX.playError();
      showToast('تعذر الانضمام — الغرفة ممتلئة أو بدأت بالفعل', 'warning');
      return;
    }
    soundFX.playClick();
    showToast(`انضممت إلى فرقة سطو "${heist.title}"!`, 'positive');
  };

  const handleLaunchCoopHeist = async (heist: CoopHeistDoc) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    const ok = await launchCoopHeist(heist, authUser.uid);
    if (!ok) {
      soundFX.playError();
      showToast('يلزم عميلان على الأقل لبدء الاقتحام الجماعي', 'warning');
      return;
    }
    soundFX.playWarHorn();
    showToast(`انطلقت عملية الاقتحام ضد ${heist.bossName}!`, 'positive');
  };

  const handleStrikeCoopHeist = async (heist: CoopHeistDoc) => {
    if (!player || !authUser || !authUser.emailVerified) return;
    if (player.energy < 2 || player.hp < 15 || heist.status !== 'active') {
      soundFX.playError();
      showToast('تحتاج إلى 2 طاقة و15 صحة على الأقل للضرب في السطو', 'warning');
      return;
    }
    const attrs = getEffectiveAttributes(player);
    const dmg = Math.max(120, Math.round(attrs.attack * 3.8 + attrs.mastery * 1.9));
    const res = await strikeCoopHeist({
      heist,
      uid: authUser.uid,
      codename: player.codename,
      damage: dmg,
    });
    const chipGold = 180 + Math.round(dmg * 0.15);
    let nextState: PlayerSaveState = {
      ...player,
      energy: player.energy - 2,
      hp: Math.max(5, player.hp - 10),
      gold: player.gold + chipGold,
      seasonXp: player.seasonXp + 25,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + chipGold,
      },
    };
    const { next: leveled } = applyXpAndLevelUp(nextState, 45);
    nextState = leveled;
    setPlayer(nextState);
    if (res.completed) {
      soundFX.playVictory();
      showToast(`أسقطت الفرقة حارس الخزنة! استلم غنيمتك الآن`, 'positive');
    } else {
      soundFX.playStrike();
      showToast(`سددت ${dmg.toLocaleString('en-US')} ضرر للخزنة (+${chipGold} ذهب)`, 'positive');
    }
  };

  const handleClaimCoopHeistReward = (heist: CoopHeistDoc) => {
    if (!player || !authUser || heist.status !== 'completed' || !heist.memberUids.includes(authUser.uid)) {
      soundFX.playError();
      return;
    }
    const claimed = player.claimedHeistIds || [];
    if (claimed.includes(heist.id)) return;
    const tpl = COOP_HEIST_TEMPLATES.find((t) => t.id === heist.templateId) || COOP_HEIST_TEMPLATES[0];
    let nextState: PlayerSaveState = {
      ...player,
      gold: player.gold + tpl.rewardGold,
      craftingEssence: (player.craftingEssence || 0) + tpl.rewardEssence,
      forgeStones: player.forgeStones + tpl.rewardStones,
      crystals: player.crystals + tpl.rewardCrystals,
      seasonXp: player.seasonXp + 110,
      claimedHeistIds: [...claimed, heist.id],
      stats: {
        ...player.stats,
        bossesDefeated: player.stats.bossesDefeated + 1,
        totalGoldEarned: player.stats.totalGoldEarned + tpl.rewardGold,
      },
    };
    const { next: leveled } = applyXpAndLevelUp(nextState, 160);
    nextState = leveled;
    nextState.logs = appendLog(
      nextState.logs,
      'raid',
      `غنيمة السطو الجماعي (${heist.title}): +${tpl.rewardGold} ذهب، +${tpl.rewardEssence} جوهر، +${tpl.rewardStones} صقل، +${tpl.rewardCrystals} بلورات!`,
      'positive'
    );
    soundFX.playVictory();
    setPlayer(nextState);
    showToast(`استلمت غنيمة السطو: +${tpl.rewardGold.toLocaleString('en-US')} ذهب!`, 'positive');
  };

  const handlePlaceTournamentBet = (
    championId: FactionId,
    championName: string,
    multiplier: number,
    stakeGold: number
  ) => {
    if (!player || player.activeTournamentBet) {
      soundFX.playError();
      return;
    }
    const safeStake = Math.max(100, Math.round(stakeGold));
    if (player.gold < safeStake) {
      soundFX.playError();
      showToast('ذهبك لا يكفي لتأكيد التوقع', 'warning');
      return;
    }
    const cycle = getTournamentBetCycle();
    soundFX.playClick();
    setPlayer({
      ...player,
      gold: player.gold - safeStake,
      activeTournamentBet: {
        cycleNumber: cycle.cycleNumber,
        championId,
        championName,
        stakeGold: safeStake,
        multiplier,
        placedAt: Date.now(),
      },
      logs: appendLog(
        player.logs,
        'economy',
        `توقعت فوز "${championName}" في الدورة #${cycle.cycleNumber} بمبلغ ${safeStake} ذهب (${multiplier}x).`,
        'positive'
      ),
    });
    showToast(`تم تسجيل توقعك على ${championName}!`, 'positive');
  };

  const handleSettleTournamentBet = () => {
    if (!player || !player.activeTournamentBet) return;
    const bet = player.activeTournamentBet;
    const currentCycle = getTournamentBetCycle().cycleNumber;
    if (bet.cycleNumber >= currentCycle) {
      soundFX.playError();
      showToast('لم تنتهِ جولة البطولة الحالية بعد', 'warning');
      return;
    }
    const winner = resolveTournamentBetResult(bet.cycleNumber);
    const won = winner.winnerFaction === bet.championId;
    const payout = won ? Math.round(bet.stakeGold * bet.multiplier) : 75;
    if (won) soundFX.playVictory();
    else soundFX.playDefeat();
    setPlayer({
      ...player,
      gold: player.gold + payout,
      seasonXp: player.seasonXp + (won ? 40 : 10),
      activeTournamentBet: null,
      stats: {
        ...player.stats,
        totalGoldEarned: player.stats.totalGoldEarned + payout,
      },
      logs: appendLog(
        player.logs,
        'economy',
        won
          ? `نجح توقع البطولة (#${bet.cycleNumber})! ربح ${winner.winnerName} وحصلت على +${payout.toLocaleString('en-US')} ذهب!`
          : `فاز ${winner.winnerName} في دورة #${bet.cycleNumber} — حصلت على تعويض ترضية +75 ذهب.`,
        won ? 'positive' : 'warning'
      ),
    });
    showToast(
      won ? `توقع رابح! +${payout.toLocaleString('en-US')} ذهب` : `حظ أوفر — تعويض +75 ذهب`,
      won ? 'positive' : 'warning'
    );
  };

  const isOnline = Boolean(authUser && authUser.emailVerified);

  if (gameState === 'TITLE_MENU' || !player) {
    return (
      <TitleScreen
        existingSave={savedPlayer}
        cloudSave={cloudSave}
        authUser={authUser}
        authLoading={authLoading}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        onContinue={handleContinue}
        onStartNew={handleStartNew}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] text-zinc-100 flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={(t) => {
          soundFX.playClick();
          setActiveTab(t);
        }}
        onOpenStore={() => {
          soundFX.playClick();
          setStoreOpen(true);
        }}
      />

      <OperativeHud
        player={player}
        isOnline={isOnline}
        isMuted={isMuted}
        rankTitle={myRankTitle}
        unreadAlertsCount={unreadAlertsCount}
        onJumpToAlerts={() => {
          soundFX.playClick();
          setActiveTab('raids');
        }}
        onToggleMute={handleToggleMute}
        onHeal={handleHeal}
        onReturnToTitle={() => {
          soundFX.playClick();
          setGameState('TITLE_MENU');
        }}
      />

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-5 start-5 z-40 px-4 py-3 rounded-lg border bg-[#14161F] shadow-xl text-xs font-medium transition-opacity duration-200 border-amber-500/40 text-zinc-100">
          <span className={toast.tone === 'positive' ? 'text-amber-400 me-2' : 'text-rose-400 me-2'}>
            {toast.tone === 'positive' ? 'تم التنفيذ:' : 'تنبيه:'}
          </span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* 3-Step Interactive New-Player Tutorial Banner */}
      {(player.tutorialStep ?? 3) < 3 && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
          <div className="p-4 bg-[#14161F] border border-amber-500/45 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-amber-400 font-num">
                دليل العميل السريع · الخطوة {(player.tutorialStep ?? 0) + 1} من 3
              </div>
              <div className="text-sm font-bold text-white">
                {(player.tutorialStep ?? 0) === 0
                  ? '1) ابدأ أول مهمة ليلية لك لربح الذهب ونقاط الخبرة'
                  : (player.tutorialStep ?? 0) === 1
                  ? '2) انتقل للسوق واشترِ أو اصقل أو اصنع سلاحاً لتعزيز قوتك'
                  : '3) نفّذ أول مداهمة ضد خزائن الفصائل المنافسة'}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  const step = player.tutorialStep ?? 0;
                  setActiveTab(step === 0 ? 'missions' : step === 1 ? 'economy' : 'raids');
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                انتقل للتنفيذ الآن
              </button>
              <button
                type="button"
                onClick={() => setPlayer({ ...player, tutorialStep: 3 })}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg cursor-pointer"
              >
                تخطي
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'missions' && (
          <MissionsView
            player={player}
            now={now}
            isOnline={isOnline}
            myUid={authUser?.uid}
            seasonDecree={seasonDecree}
            onStartMission={handleStartMission}
            onInstantFinishMission={handleInstantFinishMission}
            onCancelMission={handleCancelMission}
            onRefillEnergy={handleRefillEnergy}
            onNightHunt={handleNightHunt}
            onClaimDailyStreak={handleClaimDailyStreak}
            onClaimDailyQuest={handleClaimDailyQuest}
            onClaimSeasonTier={handleClaimSeasonTier}
            onClaimSeasonEnd={handleClaimSeasonEnd}
            onRedeemReferral={(code) => void handleRedeemReferral(code)}
            onClaimAchievement={handleClaimAchievement}
            onStrikeInvasion={handleStrikeInvasion}
            onRotateLiveEvent={handleRotateLiveEvent}
            onOpenMysteryBox={handleOpenMysteryBox}
            onSpinFortuneWheel={handleSpinFortuneWheel}
            onStartStoryCase={handleStartStoryCase}
            onAdvanceStoryChoice={handleAdvanceStoryChoice}
            onResetStoryCase={handleResetStoryCase}
            onOpenStore={() => setStoreOpen(true)}
          />
        )}

        {activeTab === 'raids' && (
          <RaidsView
            player={player}
            targets={raidTargets}
            latestReport={latestRaidReport}
            activeDuel={activeDuel}
            tournament={tournament}
            companionDuelLog={companionDuelLog}
            towerLastResult={towerLastResult}
            now={now}
            isOnline={isOnline}
            myUid={authUser?.uid}
            onlineOperatives={onlineOperatives}
            onlineClans={onlineClans}
            myClanMembers={myClanMembers}
            myClanMessages={myClanMessages}
            liveSectors={liveSectors}
            pvpAlerts={pvpAlerts}
            serverBoss={serverBoss}
            serverBossDamages={serverBossDamages}
            globalChatMessages={globalChatMessages}
            bounties={bounties}
            clanRaidBoss={clanRaidBoss}
            clanRaidDamages={clanRaidDamages}
            clanWars={clanWars}
            seasonHallEntries={seasonHallEntries}
            seasonDecree={seasonDecree}
            liveDuels={liveDuels}
            coopHeists={coopHeists}
            onRefreshTargets={() => {
              soundFX.playClick();
              setRaidTargets(generateRaidTargets(player, onlineOperatives, authUser?.uid));
            }}
            onExecuteRaid={handleExecuteRaid}
            onStrikeWorldBoss={handleStrikeWorldBoss}
            onStrikeServerBoss={handleStrikeServerBoss}
            onClaimServerBossReward={handleClaimServerBossReward}
            onRevengeAlert={handleRevengeAlert}
            onDismissAlert={handleDismissAlert}
            onChallengeRealPlayer={handleChallengeRealPlayer}
            onSendGlobalChat={handleSendGlobalChat}
            onCreateBounty={handleCreateBounty}
            onCancelBounty={handleCancelBounty}
            onStrikeClanBoss={handleStrikeClanBoss}
            onClaimClanBossReward={handleClaimClanBossReward}
            onDeclareClanWar={handleDeclareClanWar}
            onStrikeClanWar={handleStrikeClanWar}
            onClaimClanWarReward={handleClaimClanWarReward}
            onStartDuel={handleStartDuel}
            onDuelAction={handleDuelAction}
            onCloseDuel={() => setActiveDuel(null)}
            onStartTournament={handleStartTournament}
            onFightTournamentRound={handleFightTournamentRound}
            onFightCompanionDuel={handleFightCompanionDuel}
            onClimbTowerFloor={handleClimbTowerFloor}
            onAttackTerritorySector={handleAttackTerritorySector}
            onRecruitClanUnit={handleRecruitClanUnit}
            onRenameClan={handleRenameClan}
            onCreateOnlineClan={handleCreateOnlineClan}
            onJoinOnlineClan={handleJoinOnlineClan}
            onLeaveOnlineClan={handleLeaveOnlineClan}
            onDonateOnlineClan={handleDonateOnlineClan}
            onUpgradeOnlineClan={handleUpgradeOnlineClan}
            onSendClanMessage={handleSendClanMessage}
            onCreateLiveDuel={handleCreateLiveDuel}
            onJoinLiveDuel={handleJoinLiveDuel}
            onCancelLiveDuel={handleCancelLiveDuel}
            onSubmitLiveDuelMove={handleSubmitLiveDuelMove}
            onClaimLiveDuelReward={handleClaimLiveDuelReward}
            onCreateCoopHeist={handleCreateCoopHeist}
            onJoinCoopHeist={handleJoinCoopHeist}
            onLaunchCoopHeist={handleLaunchCoopHeist}
            onStrikeCoopHeist={handleStrikeCoopHeist}
            onClaimCoopHeistReward={handleClaimCoopHeistReward}
            onToggleFriend={handleToggleFriend}
            onPlaceTournamentBet={handlePlaceTournamentBet}
            onSettleTournamentBet={handleSettleTournamentBet}
            onQuickRecover={handleFullRecoveryWithCrystals}
            onOpenStore={() => setStoreOpen(true)}
          />
        )}

        {activeTab === 'skills' && (
          <SkillsView
            player={player}
            onTrainAttribute={handleTrainAttribute}
            onUnlockPerk={handleUnlockPerk}
            onSelectSubSpec={handleSelectSubSpec}
            onToggleCombatSkill={handleToggleCombatSkill}
            onUpgradeResearch={handleUpgradeResearch}
            onAscendPrestige={handleAscendPrestige}
            onOpenStore={() => setStoreOpen(true)}
          />
        )}

        {activeTab === 'hq' && (
          <HqView
            player={player}
            now={now}
            onCollectVault={handleCollectVault}
            onUpgradeModule={handleUpgradeModule}
            onDepositVault={handleDepositVault}
            onWithdrawVault={handleWithdrawVault}
            onImportSave={handleImportSave}
          />
        )}

        {activeTab === 'economy' && (
          <EconomyView
            player={player}
            now={now}
            isOnline={isOnline}
            myUid={authUser?.uid}
            auctionListings={auctionListings}
            timedAuction={timedAuction}
            onRefreshMarket={handleRefreshMarket}
            onBuyCommodity={handleBuyCommodity}
            onSellCommodity={handleSellCommodity}
            onBuyEquipment={handleBuyEquipment}
            onEquipItem={handleEquipItem}
            onEnhanceEquipment={handleEnhanceEquipment}
            onCraftCustomWeapon={handleCraftCustomWeapon}
            onDismantleMaterial={handleDismantleMaterial}
            onCraftRune={handleCraftRune}
            onSocketRune={handleSocketRune}
            onCreateAuctionListing={handleCreateAuctionListing}
            onBuyAuctionListing={handleBuyAuctionListing}
            onCancelAuctionListing={handleCancelAuctionListing}
            onBidTimedAuction={handleBidTimedAuction}
            onClaimTimedAuction={handleClaimTimedAuction}
            onRotateTimedAuction={handleRotateTimedAuction}
            onUnlockOrUpgradeCompanion={handleUnlockOrUpgradeCompanion}
            onActivateCompanion={handleActivateCompanion}
            onBuyShare={handleBuyShare}
            onOpenStore={() => setStoreOpen(true)}
          />
        )}
      </main>

      <SovereigntyModal
        isOpen={storeOpen}
        player={player}
        isOwnerAdmin={isOwnerAdmin}
        onClose={() => setStoreOpen(false)}
        onToggleVipDemo={handleToggleVipDemo}
        onClaimCrystalPack={handleClaimCrystalPack}
        onBuySupplyCrate={handleBuySupplyCrate}
        onFullRecoveryWithCrystals={handleFullRecoveryWithCrystals}
        onBuyEventBundle={handleBuyEventBundle}
        onBuyCosmetic={handleBuyCosmetic}
        onEquipCosmetic={handleEquipCosmetic}
      />
    </div>
  );
}
