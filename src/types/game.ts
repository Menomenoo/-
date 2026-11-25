export type FactionId = 'shadow_hunters' | 'tech_wardens' | 'blood_mages';

export type SubSpecId =
  | 'sh_assassin'
  | 'sh_heist'
  | 'tw_fortress'
  | 'tw_overclock'
  | 'bm_vampiric'
  | 'bm_broker';

export type RuneId = 'poison' | 'lifesteal' | 'armor_pierce' | 'crit_surge';

export type LiveEventId = 'blood_moon' | 'market_shock' | 'city_invasion';

export type GameState = 'TITLE_MENU' | 'PLAYING';

export type ActiveTab = 'missions' | 'raids' | 'skills' | 'hq' | 'economy';

export type RaidStance = 'blitz' | 'balanced' | 'stealth';

export type HqModuleId = 'vault_gate' | 'power_core' | 'trap_grid' | 'refinery';

export type EquipmentSlot = 'weapon' | 'armor' | 'relic';

export type ResearchId =
  | 'refinery_protocol'
  | 'lethal_precision'
  | 'alchemy_archive'
  | 'eternal_endurance'
  | 'intel_network';

export type CompanionId = 'shadow_raven' | 'tech_drone' | 'blood_hound';

export type ClanUnitId = 'night_scouts' | 'iron_sentinels' | 'crimson_adepts';

export type CombatSkillId =
  | 'bleed_edge'
  | 'mirror_ward'
  | 'shadow_stun'
  | 'crimson_siphon'
  | 'overcharge_blast'
  | 'tactical_evade';

export type CosmeticId =
  | 'frame_ember'
  | 'frame_royal_gold'
  | 'frame_obsidian_crown'
  | 'chat_amber'
  | 'chat_crimson'
  | 'chat_emerald';

export interface CombatSkillDef {
  id: CombatSkillId;
  name: string;
  tagline: string;
  description: string;
  image: string;
  attackBonusPct?: number;
  defenseBonusPct?: number;
  dodgeBonus?: number;
  critBonus?: number;
  lifestealPct?: number;
  reflectPct?: number;
}

export interface CosmeticDef {
  id: CosmeticId;
  category: 'frame' | 'chat_color';
  name: string;
  description: string;
  priceCrystals: number;
  cssClass: string;
}

export interface PlayerAttributes {
  attack: number;
  defense: number;
  agility: number;
  mastery: number;
  influence: number;
}

export interface SubSpecDef {
  id: SubSpecId;
  factionId: FactionId;
  name: string;
  tagline: string;
  description: string;
  image: string;
  bonuses: {
    attackPct?: number;
    defensePct?: number;
    critBonus?: number;
    dodgeBonus?: number;
    lifestealPct?: number;
    raidLootPct?: number;
    hqYieldPct?: number;
    marketMarginBonus?: number;
  };
}

export interface RuneDef {
  id: RuneId;
  name: string;
  colorClass: string;
  description: string;
  image: string;
  essenceCost: number;
  goldCost: number;
  bonuses: Partial<PlayerAttributes>;
  combatEffectLabel: string;
}

export interface EquipmentSetDef {
  id: string;
  name: string;
  image: string;
  itemIds: string[];
  twoPieceLabel: string;
  threePieceLabel: string;
  twoPieceMult: Partial<PlayerAttributes>;
  threePiecePowerPct: number;
}

export interface TerritoryDistrictDef {
  id: string;
  name: string;
  bonusLabel: string;
  description: string;
  image: string;
}

export interface TerritorySectorState {
  sectorId: string;
  name: string;
  controllingFaction: FactionId;
  shadowHuntersScore: number;
  techWardensScore: number;
  bloodMagesScore: number;
  updatedAt: number;
}

export interface TournamentState {
  active: boolean;
  round: number; // 1=R16, 2=QF, 3=SF, 4=Final
  opponentName: string;
  opponentFaction: FactionId;
  opponentPower: number;
  finished: boolean;
  champion: boolean;
  logs: string[];
}

export interface FactionDef {
  id: FactionId;
  name: string;
  englishName: string;
  motto: string;
  description: string;
  portrait: string;
  accentHex: string;
  bonusSummary: string;
  startingStats: PlayerAttributes;
  bonuses: {
    raidLootMult: number;
    critBonus: number;
    defenseMult: number;
    energyCostDiscount: number;
    missionGoldMult: number;
    marketMarginBonus: number;
  };
  perks: FactionPerk[];
}

export interface FactionPerk {
  id: string;
  name: string;
  description: string;
  image: string;
  unlockLevel: number;
  costGold: number;
  costCrystals: number;
  effectLabel: string;
}

export interface MissionDef {
  id: string;
  title: string;
  district: string;
  description: string;
  image: string;
  durationSec: number;
  energyCost: number;
  minLevel: number;
  rewardGold: [number, number];
  rewardXp: number;
  contrabandChance: number;
  contrabandAmount: [number, number];
  forgeStoneChance: number;
  crystalChance: number;
  riskDamage: [number, number];
}

export interface NightHuntZoneDef {
  id: string;
  name: string;
  description: string;
  image: string;
  energyCost: number;
  minLevel: number;
  goldRange: [number, number];
  xpReward: number;
  treasureChance: number;
  riskDamage: [number, number];
}

export interface ActiveMission {
  missionId: string;
  startedAt: number;
  endsAt: number;
  durationSec: number;
}

export interface RaidTarget {
  id: string;
  uid?: string;
  isRealPlayer?: boolean;
  codename: string;
  factionId: FactionId;
  level: number;
  powerRating: number;
  vaultGold: number;
  contrabandStash: number;
  defenseScore: number;
  difficulty: 'سهل' | 'متكافئ' | 'خطير' | 'أسطوري';
  attributes: PlayerAttributes;
  hqTrapLevel: number;
}

export interface WorldBossDef {
  id: string;
  name: string;
  title: string;
  district: string;
  description: string;
  image: string;
  recommendedPower: number;
  maxHp: number;
  attackPower: number;
  rewardGold: number;
  rewardContraband: number;
  rewardForgeStones: number;
  rewardCrystals: number;
  rewardXp: number;
}

export interface ArenaOpponentDef {
  id: string;
  name: string;
  factionId: FactionId;
  tierLabel: string;
  hp: number;
  attack: number;
  defense: number;
  rewardGold: number;
  rewardRating: number;
  rewardForgeStones: number;
  rewardCrystals: number;
  rewardXp: number;
}

export interface ActiveDuelState {
  opponentId: string;
  opponentName: string;
  opponentFaction: FactionId;
  opponentMaxHp: number;
  opponentHp: number;
  opponentAttack: number;
  opponentDefense: number;
  enemyIntent: 'heavy' | 'normal' | 'guard';
  playerHp: number;
  playerMaxHp: number;
  playerFury: number;
  potionsLeft: number;
  turn: number;
  logs: string[];
  finished: boolean;
  victory: boolean | null;
}

export interface CompanionDef {
  id: CompanionId;
  name: string;
  role: string;
  description: string;
  image: string;
  unlockGold: number;
  unlockCrystals: number;
  statPerLevel: Partial<PlayerAttributes>;
  duelEffect: string;
}

export interface ClanUnitDef {
  id: ClanUnitId;
  name: string;
  description: string;
  image: string;
  costGold: number;
  costContraband: number;
  powerEach: number;
}

export interface RaidRoundLog {
  round: number;
  actor: 'player' | 'enemy';
  actionText: string;
  damage: number;
  isCrit: boolean;
  isDodged: boolean;
  playerHpAfter: number;
  enemyHpAfter: number;
}

export interface RaidReport {
  id: string;
  targetName: string;
  targetFaction: FactionId;
  stance: RaidStance;
  victory: boolean;
  goldStolen: number;
  contrabandStolen: number;
  xpGained: number;
  dominanceGained: number;
  damageTaken: number;
  crystalsFound: number;
  forgeStonesFound: number;
  rounds: RaidRoundLog[];
  timestamp: number;
}

export interface HqModuleDef {
  id: HqModuleId;
  name: string;
  description: string;
  image: string;
  maxLevel: number;
  baseGoldCost: number;
  baseContrabandCost: number;
  effectPerLevel: string;
}

export interface ResearchDef {
  id: ResearchId;
  name: string;
  description: string;
  image: string;
  maxLevel: number;
  baseGoldCost: number;
  baseContrabandCost: number;
  effectPerLevel: string;
}

export interface MarketCommodity {
  id: string;
  name: string;
  unit: string;
  image: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number;
  description: string;
}

export interface MarketStateItem {
  id: string;
  currentPrice: number;
  previousPrice: number;
  owned: number;
  avgBuyPrice: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  tier: 1 | 2 | 3 | 4 | 5;
  rarityLabel: 'عادي' | 'نادر' | 'ملحمي' | 'أسطوري' | 'سيادي';
  setId?: string;
  image: string;
  priceGold: number;
  priceCrystals: number;
  bonuses: Partial<PlayerAttributes>;
  description: string;
}

export interface DistrictShareDef {
  id: string;
  name: string;
  description: string;
  image: string;
  sharePrice: number;
  dividendPerCycle: number;
  maxShares: number;
}

export interface DailyQuestDef {
  id: string;
  title: string;
  description: string;
  metric: 'missions' | 'raids' | 'trades' | 'upgrades' | 'bossHits';
  target: number;
  rewardGold: number;
  rewardForgeStones: number;
  rewardCrystals: number;
  rewardSeasonXp: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  metric: 'missionsCompleted' | 'raidsWon' | 'bossesDefeated' | 'totalGoldEarned' | 'prestigeRank';
  tiers: number[];
  crystalRewards: number[];
}

export interface EventLogEntry {
  id: string;
  timestamp: number;
  category: 'mission' | 'raid' | 'economy' | 'hq' | 'system';
  message: string;
  tone: 'positive' | 'warning' | 'neutral';
}

export interface FactionDominance {
  shadow_hunters: number;
  tech_wardens: number;
  blood_mages: number;
}

// Online Firestore DTOs
export interface PublicOperativeDoc {
  uid: string;
  codename: string;
  factionId: FactionId;
  subSpecId?: string;
  level: number;
  prestigeRank: number;
  powerScore: number;
  arenaRating: number;
  defenseScore: number;
  vaultGold: number;
  clanId?: string;
  clanName?: string;
  referralCode?: string;
  nameFrame?: string;
  seasonMedals?: number;
  equippedWeaponId?: string;
  equippedArmorId?: string;
  equippedRelicId?: string;
  activeCompanionId?: string;
  attackStat?: number;
  defenseStat?: number;
  agilityStat?: number;
  masteryStat?: number;
  influenceStat?: number;
  updatedAt: number;
}

export type LiveDuelAction = '' | 'strike' | 'guard' | 'counter' | 'ultimate';

export interface LivePvpDuelDoc {
  id: string;
  challengerUid: string;
  challengerName: string;
  challengerFaction: FactionId;
  challengerPower: number;
  challengerHp: number;
  challengerMaxHp: number;
  challengerAction: LiveDuelAction;
  opponentUid: string;
  opponentName: string;
  opponentFaction: FactionId;
  opponentPower: number;
  opponentHp: number;
  opponentMaxHp: number;
  opponentAction: LiveDuelAction;
  turn: number;
  stakeGold: number;
  status: 'open' | 'active' | 'finished';
  winnerUid: string;
  lastSummary: string;
  createdAt: number;
  updatedAt: number;
}

export interface CoopHeistDoc {
  id: string;
  hostUid: string;
  hostName: string;
  templateId: string;
  title: string;
  difficulty: string;
  bossName: string;
  maxPlayers: number;
  bossMaxHp: number;
  bossCurrentHp: number;
  phase: number;
  status: 'recruiting' | 'active' | 'completed';
  memberUids: string[];
  memberSummaries: string[];
  lastActionText: string;
  createdAt: number;
  updatedAt: number;
}

export interface CoopHeistMemberInfo {
  uid: string;
  codename: string;
  factionId: FactionId;
  power: number;
  damage: number;
}

export interface CoopHeistTemplateDef {
  id: string;
  title: string;
  difficulty: string;
  bossName: string;
  bossMaxHp: number;
  rewardGold: number;
  rewardEssence: number;
  rewardStones: number;
  rewardCrystals: number;
  image: string;
  description: string;
}

export interface StoryCaseChoice {
  id: string;
  label: string;
  stat: keyof PlayerAttributes;
  difficulty: number;
  successText: string;
  failText: string;
  bonusGold: number;
  bonusEssence: number;
  failDamage: number;
  nextNodeId: string | null;
}

export interface StoryCaseNode {
  id: string;
  title: string;
  narrative: string;
  choices: StoryCaseChoice[];
}

export interface StoryCaseDef {
  id: string;
  title: string;
  district: string;
  minLevel: number;
  energyCost: number;
  image: string;
  summary: string;
  baseGold: number;
  baseXp: number;
  baseStones: number;
  nodes: StoryCaseNode[];
}

export interface ActiveStoryCaseState {
  caseId: string;
  currentNodeId: string;
  stepIndex: number;
  accumulatedGold: number;
  accumulatedEssence: number;
  outcomeLog: string[];
  finished: boolean;
  success: boolean;
}

export interface NemesisEntry {
  uid: string;
  codename: string;
  factionId: FactionId;
  powerScore: number;
  raidCount: number;
  totalStolen: number;
  markedAt: number;
}

export interface TournamentBetState {
  cycleNumber: number;
  championId: FactionId;
  championName: string;
  stakeGold: number;
  multiplier: number;
  placedAt: number;
}

export interface OnlineClanDoc {
  id: string;
  name: string;
  factionId: FactionId;
  leaderUid: string;
  treasuryGold: number;
  treasuryContraband: number;
  clanLevel: number;
  powerScore: number;
  warPoints?: number;
  memberCount: number;
  createdAt: number;
}

export interface ClanMemberDoc {
  uid: string;
  codename: string;
  factionId: FactionId;
  powerScore: number;
  role: 'leader' | 'officer' | 'member';
  joinedAt: number;
}

export interface ClanMessageDoc {
  id: string;
  uid: string;
  codename: string;
  text: string;
  createdAt: number;
}

export interface ClanRaidBossDoc {
  cycle: number;
  bossName: string;
  maxHp: number;
  currentHp: number;
  lastDefeatedCycle: number;
  lastFinisherName: string;
  updatedAt: number;
}

export interface ClanRaidDamageDoc {
  uid: string;
  codename: string;
  cycle: number;
  damage: number;
  updatedAt: number;
}

export interface AuctionListingDoc {
  id: string;
  sellerUid: string;
  sellerName: string;
  itemType: 'equipment' | 'rune' | 'contraband' | 'forge_stones';
  itemId: string;
  itemName: string;
  enhanceLevel?: number;
  quantity: number;
  priceGold: number;
  status: 'open' | 'sold' | 'cancelled';
  buyerUid?: string;
  createdAt: number;
  soldAt?: number;
}

export interface TimedAuctionDoc {
  id: string;
  cycle: number;
  itemType: 'rune' | 'blueprint_pack' | 'essence_crate' | 'crystal_pouch';
  itemId: string;
  itemName: string;
  quantity: number;
  currentBid: number;
  highestBidderUid: string;
  highestBidderName: string;
  endsAt: number;
  claimedByWinner: boolean;
  createdAt: number;
}

export interface BountyDoc {
  id: string;
  posterUid: string;
  posterName: string;
  targetUid: string;
  targetName: string;
  targetFaction: FactionId;
  rewardGold: number;
  rewardCrystals: number;
  reason: string;
  status: 'open' | 'claimed' | 'cancelled';
  hunterUid?: string;
  hunterName?: string;
  createdAt: number;
  claimedAt?: number;
}

export interface SeasonHallEntryDoc {
  id: string;
  seasonNumber: number;
  championUid: string;
  championName: string;
  championFaction: FactionId;
  championPower: number;
  topClanName: string;
  recordedAt: number;
}

export interface ClanWarDoc {
  id: string;
  challengerClanId: string;
  challengerClanName: string;
  challengerFaction: FactionId;
  defenderClanId: string;
  defenderClanName: string;
  defenderFaction: FactionId;
  challengerScore: number;
  defenderScore: number;
  status: 'active' | 'finished';
  winnerClanId: string;
  endsAt: number;
  createdAt: number;
}

export interface ReferralClaimDoc {
  claimantUid: string;
  referrerUid: string;
  referrerCode: string;
  createdAt: number;
}

export interface PvpAlertDoc {
  id: string;
  targetUid: string;
  attackerUid: string;
  attackerName: string;
  attackerFaction: FactionId;
  attackerPower: number;
  alertType: 'raid_incoming' | 'auction_sold' | 'referral_bonus' | 'bounty_claimed';
  summary: string;
  goldAmount: number;
  crystalAmount?: number;
  resolved: boolean;
  createdAt: number;
}

export interface ServerBossDoc {
  cycle: number;
  bossIndex: number;
  bossName: string;
  maxHp: number;
  currentHp: number;
  lastDefeatedCycle: number;
  lastFinisherName: string;
  updatedAt: number;
}

export interface ServerBossDamageDoc {
  uid: string;
  codename: string;
  factionId: FactionId;
  cycle: number;
  damage: number;
  updatedAt: number;
}

export interface GlobalChatMessageDoc {
  id: string;
  uid: string;
  codename: string;
  factionId: FactionId;
  titleTag?: string;
  chatColor?: string;
  nameFrame?: string;
  text: string;
  createdAt: number;
}

export interface PlayerSaveState {
  codename: string;
  factionId: FactionId;
  subSpecId: SubSpecId | null;
  level: number;
  xp: number;
  prestigeRank: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  gold: number;
  vaultProtectedGold: number;
  contraband: number;
  forgeStones: number;
  craftingEssence: number;
  blueprints?: number;
  crystals: number;
  arenaRating: number;
  vipActive: boolean;
  firstPurchaseUsed?: boolean;
  attributes: PlayerAttributes;
  unlockedPerks: string[];
  equippedCombatSkills?: CombatSkillId[];
  researchLevels: Record<ResearchId, number>;
  hqLevels: Record<HqModuleId, number>;
  pendingVaultGold: number;
  pendingVaultContraband: number;
  lastVaultTick: number;
  lastEnergyTick: number;
  lastOnlineAt: number;
  activeMission: ActiveMission | null;
  raidCooldownUntil: number;
  ownedEquipment: string[];
  craftedItems?: EquipmentItem[];
  equipmentEnhance: Record<string, number>;
  equipped: Record<EquipmentSlot, string | null>;
  ownedRunes: Record<RuneId, number>;
  socketedRunes: Record<EquipmentSlot, RuneId | null>;
  ownedCompanions: Record<CompanionId, number>;
  activeCompanion: CompanionId | null;
  ownedCosmetics?: CosmeticId[];
  equippedFrame?: CosmeticId | null;
  equippedChatColor?: CosmeticId | null;
  clanId: string | null;
  clanName: string;
  clanUnits: Record<ClanUnitId, number>;
  market: Record<string, MarketStateItem>;
  lastMarketUpdate: number;
  districtShares: Record<string, number>;
  dominance: FactionDominance;
  territoryWarScores: Record<string, Record<FactionId, number>>;
  worldBossIndex: number;
  worldBossCurrentHp: number;
  towerFloor: number;
  towerBestFloor: number;
  tournamentWins: number;
  activeEventId: LiveEventId;
  eventShockCommodityId: string;
  eventShockMultiplier: number;
  eventStartedAt: number;
  invasionWaveHp: number;
  invasionWaveMaxHp: number;
  dailyDateKey: string;
  loginStreak: number;
  dailyStreakClaimed: boolean;
  lastMysteryBoxAt?: number;
  mysteryBoxWins?: number;
  lastWheelDate?: string;
  wheelSpinsToday?: number;
  lastClaimedServerBossCycle?: number;
  lastClaimedClanBossCycle?: number;
  lastClaimedSeasonNumber?: number;
  claimedClanWarIds?: string[];
  seasonMedals?: number;
  referralClaimed?: boolean;
  tutorialStep?: number;
  friendUids?: string[];
  nemeses?: Record<string, NemesisEntry>;
  claimedLiveDuelIds?: string[];
  claimedHeistIds?: string[];
  activeStoryCase?: ActiveStoryCaseState | null;
  storyCaseCooldowns?: Record<string, number>;
  activeTournamentBet?: TournamentBetState | null;
  dailyProgress: {
    missions: number;
    raids: number;
    trades: number;
    upgrades: number;
    bossHits: number;
  };
  claimedDailyQuests: string[];
  seasonXp: number;
  claimedSeasonTiers: number[];
  claimedAchievements: Record<string, number>;
  stats: {
    missionsCompleted: number;
    raidsWon: number;
    raidsLost: number;
    duelsWon: number;
    bossesDefeated: number;
    towerClears: number;
    totalGoldEarned: number;
  };
  logs: EventLogEntry[];
}
