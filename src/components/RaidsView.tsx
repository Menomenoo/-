import React, { useEffect, useRef, useState } from 'react';
import {
  ARENA_COLOSSEUM_IMAGE,
  ARENA_OPPONENTS,
  CLAN_RAID_BOSS_IMAGE,
  CLAN_UNITS,
  COMPANIONS,
  COOP_HEIST_TEMPLATES,
  COSMETICS_CATALOG,
  FACTIONS,
  HALL_OF_SHADOWS_RIVALS,
  TERRITORY_DISTRICTS,
  TERRITORY_MAP_IMAGE,
  TOURNAMENT_CHAMPION_POOL,
  TOWER_SPIRE_IMAGE,
  WORLD_BOSSES,
  SeasonDecreeInfo,
  getTournamentBetCycle,
  getTowerFloorEnemy,
  getWarHourStatus,
} from '../data/gameData';
import {
  ActiveDuelState,
  ArenaOpponentDef,
  BountyDoc,
  ClanMemberDoc,
  ClanMessageDoc,
  ClanRaidBossDoc,
  ClanRaidDamageDoc,
  ClanUnitId,
  ClanWarDoc,
  CompanionId,
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
  RaidReport,
  RaidStance,
  RaidTarget,
  SeasonHallEntryDoc,
  ServerBossDamageDoc,
  ServerBossDoc,
  TerritorySectorState,
  TournamentState,
} from '../types/game';
import { getClanPowerScore, getEffectiveAttributes, getPlayerPowerScore } from '../utils/combatEngine';
import { OperativeCard } from './OperativeCard';
import { ResilientImage } from './ResilientImage';
import {
  Award,
  Bell,
  Building2,
  Clock,
  Coins,
  Crosshair,
  Crown,
  Eye,
  Flame,
  Globe,
  Map as MapIcon,
  MessageSquare,
  Radio,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Skull,
  Sparkles,
  Swords,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

interface RaidsViewProps {
  player: PlayerSaveState;
  targets: RaidTarget[];
  latestReport: RaidReport | null;
  activeDuel: ActiveDuelState | null;
  tournament: TournamentState | null;
  companionDuelLog: { victory: boolean; title: string; logs: string[]; rewardText: string } | null;
  towerLastResult: {
    floor: number;
    victory: boolean;
    enemyName: string;
    rounds: string[];
    lootText: string;
  } | null;
  now: number;
  isOnline: boolean;
  myUid?: string;
  onlineOperatives: PublicOperativeDoc[];
  onlineClans: OnlineClanDoc[];
  myClanMembers: ClanMemberDoc[];
  myClanMessages: ClanMessageDoc[];
  liveSectors: TerritorySectorState[];
  pvpAlerts: PvpAlertDoc[];
  serverBoss: ServerBossDoc | null;
  serverBossDamages: ServerBossDamageDoc[];
  globalChatMessages: GlobalChatMessageDoc[];
  bounties: BountyDoc[];
  clanRaidBoss: ClanRaidBossDoc | null;
  clanRaidDamages: ClanRaidDamageDoc[];
  clanWars: ClanWarDoc[];
  seasonHallEntries: SeasonHallEntryDoc[];
  seasonDecree: SeasonDecreeInfo;
  liveDuels: LivePvpDuelDoc[];
  coopHeists: CoopHeistDoc[];
  onRefreshTargets: () => void;
  onExecuteRaid: (target: RaidTarget, stance: RaidStance) => void;
  onStrikeWorldBoss: () => void;
  onStrikeServerBoss: () => void;
  onClaimServerBossReward: () => void;
  onRevengeAlert: (alert: PvpAlertDoc, stance: RaidStance) => void;
  onDismissAlert: (alertId: string) => void;
  onChallengeRealPlayer: (op: PublicOperativeDoc) => void;
  onSendGlobalChat: (text: string) => void;
  onCreateBounty: (
    targetUid: string,
    targetName: string,
    targetFaction: FactionId,
    rewardGold: number,
    rewardCrystals: number,
    reason: string
  ) => void;
  onCancelBounty: (bounty: BountyDoc) => void;
  onStrikeClanBoss: () => void;
  onClaimClanBossReward: () => void;
  onDeclareClanWar: (defenderClan: OnlineClanDoc) => void;
  onStrikeClanWar: (war: ClanWarDoc) => void;
  onClaimClanWarReward: (war: ClanWarDoc) => void;
  onStartDuel: (opponent: ArenaOpponentDef) => void;
  onDuelAction: (action: 'strike' | 'guard' | 'ultimate' | 'potion') => void;
  onCloseDuel: () => void;
  onStartTournament: () => void;
  onFightTournamentRound: () => void;
  onFightCompanionDuel: (enemyCompanionId: CompanionId) => void;
  onClimbTowerFloor: () => void;
  onAttackTerritorySector: (sectorId: string) => void;
  onRecruitClanUnit: (unitId: ClanUnitId) => void;
  onRenameClan: (name: string) => void;
  onCreateOnlineClan: (name: string) => void;
  onJoinOnlineClan: (clan: OnlineClanDoc) => void;
  onLeaveOnlineClan: (clan: OnlineClanDoc) => void;
  onDonateOnlineClan: (clan: OnlineClanDoc, gold: number, contraband: number) => void;
  onUpgradeOnlineClan: (clan: OnlineClanDoc) => void;
  onSendClanMessage: (clanId: string, text: string) => void;
  onCreateLiveDuel: (stakeGold: number, targetOp?: PublicOperativeDoc | null) => void;
  onJoinLiveDuel: (duel: LivePvpDuelDoc) => void;
  onCancelLiveDuel: (duelId: string) => void;
  onSubmitLiveDuelMove: (duel: LivePvpDuelDoc, action: Exclude<LiveDuelAction, ''>) => void;
  onClaimLiveDuelReward: (duel: LivePvpDuelDoc) => void;
  onCreateCoopHeist: (template: CoopHeistTemplateDef) => void;
  onJoinCoopHeist: (heist: CoopHeistDoc) => void;
  onLaunchCoopHeist: (heist: CoopHeistDoc) => void;
  onStrikeCoopHeist: (heist: CoopHeistDoc) => void;
  onClaimCoopHeistReward: (heist: CoopHeistDoc) => void;
  onToggleFriend: (uid: string, codename: string) => void;
  onPlaceTournamentBet: (championId: FactionId, championName: string, multiplier: number, stakeGold: number) => void;
  onSettleTournamentBet: () => void;
  onQuickRecover: () => void;
  onOpenStore: () => void;
}

type RaidsSubTab = 'vaults' | 'heists' | 'bounties' | 'arena' | 'tower' | 'territory' | 'bosses' | 'leaderboard';

const STANCES: Array<{ id: RaidStance; name: string; summary: string }> = [
  { id: 'blitz', name: 'هجوم خاطف', summary: '+24% ضرر · +8% حاسمة · -18% دفاع' },
  { id: 'balanced', name: 'اختراق متوازن', summary: '+5% هجوم · +5% دفاع · توازن تكتيكي' },
  { id: 'stealth', name: 'تسلل حذر', summary: 'تجنب الفخاخ · +22% دفاع · +14% تفادي' },
];

export const RaidsView: React.FC<RaidsViewProps> = ({
  player,
  targets,
  latestReport,
  activeDuel,
  tournament,
  companionDuelLog,
  towerLastResult,
  now,
  isOnline,
  myUid,
  onlineOperatives,
  onlineClans,
  myClanMembers,
  myClanMessages,
  liveSectors,
  pvpAlerts,
  serverBoss,
  serverBossDamages,
  globalChatMessages,
  bounties,
  clanRaidBoss,
  clanRaidDamages,
  clanWars,
  seasonHallEntries,
  seasonDecree,
  liveDuels,
  coopHeists,
  onRefreshTargets,
  onExecuteRaid,
  onStrikeWorldBoss,
  onStrikeServerBoss,
  onClaimServerBossReward,
  onRevengeAlert,
  onDismissAlert,
  onChallengeRealPlayer,
  onSendGlobalChat,
  onCreateBounty,
  onCancelBounty,
  onStrikeClanBoss,
  onClaimClanBossReward,
  onDeclareClanWar,
  onStrikeClanWar,
  onClaimClanWarReward,
  onStartDuel,
  onDuelAction,
  onCloseDuel,
  onStartTournament,
  onFightTournamentRound,
  onFightCompanionDuel,
  onClimbTowerFloor,
  onAttackTerritorySector,
  onRecruitClanUnit,
  onRenameClan,
  onCreateOnlineClan,
  onJoinOnlineClan,
  onLeaveOnlineClan,
  onDonateOnlineClan,
  onUpgradeOnlineClan,
  onSendClanMessage,
  onCreateLiveDuel,
  onJoinLiveDuel,
  onCancelLiveDuel,
  onSubmitLiveDuelMove,
  onClaimLiveDuelReward,
  onCreateCoopHeist,
  onJoinCoopHeist,
  onLaunchCoopHeist,
  onStrikeCoopHeist,
  onClaimCoopHeistReward,
  onToggleFriend,
  onPlaceTournamentBet,
  onSettleTournamentBet,
  onQuickRecover,
  onOpenStore,
}) => {
  const [subTab, setSubTab] = useState<RaidsSubTab>('vaults');
  const [stance, setStance] = useState<RaidStance>('balanced');
  const [clanInput, setClanInput] = useState(player.clanName || '');
  const [newOnlineClanName, setNewOnlineClanName] = useState('');
  const [chatText, setChatText] = useState('');
  const [globalChatInput, setGlobalChatInput] = useState('');
  const [bountyTargetUid, setBountyTargetUid] = useState('');
  const [bountyGoldInput, setBountyGoldInput] = useState(800);
  const [bountyCrystalInput, setBountyCrystalInput] = useState(0);
  const [bountyReasonInput, setBountyReasonInput] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('sector_citadel');
  const [warTargetClanId, setWarTargetClanId] = useState<string>('');
  const [inspectedOp, setInspectedOp] = useState<PublicOperativeDoc | null>(null);
  const [duelStakeInput, setDuelStakeInput] = useState<number>(500);
  const [betChampionId, setBetChampionId] = useState<FactionId>('shadow_hunters');
  const [betStakeInput, setBetStakeInput] = useState<number>(500);

  const [duelFx, setDuelFx] = useState<{
    key: number;
    playerPopup?: string;
    playerTone?: 'dmg' | 'heal';
    enemyPopup?: string;
    isCrit?: boolean;
    shakePlayer?: boolean;
    shakeEnemy?: boolean;
  } | null>(null);
  const [bossHitFx, setBossHitFx] = useState<{
    key: number;
    label: string;
    scope: 'server' | 'sector' | 'clan';
  } | null>(null);
  const [raidFx, setRaidFx] = useState<{
    key: number;
    victory: boolean;
    label: string;
  } | null>(null);

  const prevDuelRef = useRef<{ opponentId: string; turn: number; playerHp: number; opponentHp: number } | null>(null);
  const prevReportRef = useRef<RaidReport | null>(null);
  const prevWorldHpRef = useRef<number>(player.worldBossCurrentHp);
  const prevServerHpRef = useRef<number | null>(serverBoss ? serverBoss.currentHp : null);
  const prevClanBossHpRef = useRef<number | null>(clanRaidBoss ? clanRaidBoss.currentHp : null);

  useEffect(() => {
    if (!activeDuel) {
      prevDuelRef.current = null;
      return;
    }
    const prev = prevDuelRef.current;
    if (prev && prev.opponentId === activeDuel.opponentId && activeDuel.turn > prev.turn) {
      const eDelta = Math.max(0, prev.opponentHp - activeDuel.opponentHp);
      const pDelta = prev.playerHp - activeDuel.playerHp;
      const turnLog = activeDuel.logs.find((l) => l.startsWith(`جولة ${prev.turn}:`)) || activeDuel.logs[0] || '';
      const isCrit = turnLog.includes('حاسمة') || turnLog.includes('القصوى');
      const fx = {
        key: Date.now(),
        enemyPopup: eDelta > 0 ? `-${eDelta}${isCrit ? '!' : ''}` : undefined,
        playerPopup: pDelta > 0 ? `-${pDelta}` : pDelta < 0 ? `+${Math.abs(pDelta)}` : undefined,
        playerTone: (pDelta < 0 ? 'heal' : 'dmg') as 'dmg' | 'heal',
        isCrit,
        shakeEnemy: eDelta > 0,
        shakePlayer: pDelta > 0,
      };
      setDuelFx(fx);
      const t = setTimeout(() => setDuelFx(null), 650);
      prevDuelRef.current = {
        opponentId: activeDuel.opponentId,
        turn: activeDuel.turn,
        playerHp: activeDuel.playerHp,
        opponentHp: activeDuel.opponentHp,
      };
      return () => clearTimeout(t);
    }
    prevDuelRef.current = {
      opponentId: activeDuel.opponentId,
      turn: activeDuel.turn,
      playerHp: activeDuel.playerHp,
      opponentHp: activeDuel.opponentHp,
    };
  }, [activeDuel]);

  useEffect(() => {
    if (latestReport && latestReport !== prevReportRef.current) {
      prevReportRef.current = latestReport;
      setRaidFx({
        key: Date.now(),
        victory: latestReport.victory,
        label: latestReport.victory ? `+${latestReport.goldStolen} ذهب` : `-${latestReport.damageTaken} HP`,
      });
      const t = setTimeout(() => setRaidFx(null), 680);
      return () => clearTimeout(t);
    }
  }, [latestReport]);

  useEffect(() => {
    const prevHp = prevWorldHpRef.current;
    prevWorldHpRef.current = player.worldBossCurrentHp;
    if (prevHp > player.worldBossCurrentHp) {
      const delta = prevHp - player.worldBossCurrentHp;
      setBossHitFx({ key: Date.now(), label: `-${delta}`, scope: 'sector' });
      const t = setTimeout(() => setBossHitFx(null), 680);
      return () => clearTimeout(t);
    }
  }, [player.worldBossCurrentHp]);

  useEffect(() => {
    const curr = serverBoss ? serverBoss.currentHp : null;
    const prev = prevServerHpRef.current;
    prevServerHpRef.current = curr;
    if (prev !== null && curr !== null && prev > curr) {
      const delta = prev - curr;
      setBossHitFx({ key: Date.now(), label: `-${delta}`, scope: 'server' });
      const t = setTimeout(() => setBossHitFx(null), 680);
      return () => clearTimeout(t);
    }
  }, [serverBoss]);

  useEffect(() => {
    const curr = clanRaidBoss ? clanRaidBoss.currentHp : null;
    const prev = prevClanBossHpRef.current;
    prevClanBossHpRef.current = curr;
    if (prev !== null && curr !== null && prev > curr) {
      const delta = prev - curr;
      setBossHitFx({ key: Date.now(), label: `-${delta}`, scope: 'clan' });
      const t = setTimeout(() => setBossHitFx(null), 680);
      return () => clearTimeout(t);
    }
  }, [clanRaidBoss]);

  const cooldownSec = Math.max(0, Math.ceil((player.raidCooldownUntil - now) / 1000));
  const totalDominance =
    player.dominance.shadow_hunters + player.dominance.tech_wardens + player.dominance.blood_mages;
  const warHour = getWarHourStatus(now);
  const formatWarClock = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return hrs > 0
      ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const boss = WORLD_BOSSES[player.worldBossIndex % WORLD_BOSSES.length];
  const bossHpPct = Math.max(0, Math.min(100, Math.round((player.worldBossCurrentHp / boss.maxHp) * 100)));

  const clanPower = getClanPowerScore(player);
  const playerPower = getPlayerPowerScore(getEffectiveAttributes(player), clanPower);
  const towerEnemy = getTowerFloorEnemy(player.towerFloor || 1);

  const myOnlineClan = player.clanId ? onlineClans.find((c) => c.id === player.clanId) || null : null;
  const unresolvedAlerts = pvpAlerts.filter((a) => !a.resolved);

  const TOP_TITLES = ['سيد الظلال الأعلى', 'حامي العرش', 'كاسر الأسوار'];

  const leaderboardEntries = (() => {
    const realRows = onlineOperatives.map((op) => ({
      uid: op.uid,
      codename: `${op.codename}${op.clanName ? ` (${op.clanName})` : ''}`,
      factionId: op.factionId,
      powerScore: op.powerScore,
      rating: op.arenaRating,
      prestige: op.prestigeRank,
      nameFrame: op.nameFrame || '',
      seasonMedals: op.seasonMedals || 0,
      isPlayer: op.uid === myUid,
      isReal: true,
      rawOp: op as PublicOperativeDoc | null,
    }));

    const aiRows = HALL_OF_SHADOWS_RIVALS.map((r) => ({
      ...r,
      uid: `ai-${r.codename}`,
      nameFrame: '',
      seasonMedals: 0,
      isPlayer: false,
      isReal: false,
      rawOp: null as PublicOperativeDoc | null,
    }));
    const hasMeInCloud = realRows.some((r) => r.isPlayer);
    const merged = hasMeInCloud
      ? [...realRows, ...aiRows]
      : [
          ...realRows,
          ...aiRows,
          {
            uid: myUid || 'me',
            codename: `${player.codename} (${player.clanName})`,
            factionId: player.factionId,
            powerScore: playerPower,
            rating: player.arenaRating,
            prestige: player.prestigeRank,
            nameFrame: player.equippedFrame || '',
            seasonMedals: player.seasonMedals || 0,
            isPlayer: true,
            isReal: isOnline,
            rawOp: null as PublicOperativeDoc | null,
          },
        ];

    return merged.sort((a, b) => b.powerScore + b.rating - (a.powerScore + a.rating)).slice(0, 20);
  })();

  const sectorList: TerritorySectorState[] =
    isOnline && liveSectors.length > 0
      ? liveSectors
      : TERRITORY_DISTRICTS.map((d) => {
          const scores = player.territoryWarScores?.[d.id] || {
            shadow_hunters: 250,
            tech_wardens: 250,
            blood_mages: 250,
          };
          let controllingFaction: FactionId = 'shadow_hunters';
          if (scores.tech_wardens >= scores.shadow_hunters && scores.tech_wardens >= scores.blood_mages) {
            controllingFaction = 'tech_wardens';
          } else if (scores.blood_mages >= scores.shadow_hunters && scores.blood_mages >= scores.tech_wardens) {
            controllingFaction = 'blood_mages';
          }
          return {
            sectorId: d.id,
            name: d.name,
            controllingFaction,
            shadowHuntersScore: scores.shadow_hunters,
            techWardensScore: scores.tech_wardens,
            bloodMagesScore: scores.blood_mages,
            updatedAt: now,
          };
        });

  const controlledCount = sectorList.filter((s) => s.controllingFaction === player.factionId).length;

  return (
    <div className="space-y-8">
      {/* Header + Segmented Sub-Tab */}
      <div className="space-y-5 border-b border-white/10 pb-6">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white mb-1">المعارك، البرج وحروب الأقاليم</h2>
            <p className="text-sm text-zinc-400">
              داهم مخازن الخصوم، اصعد برج الظلال اللانهائي، حارب للسيطرة على أقاليم المدينة، ونافس في العشائر الحية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#14161F] border border-white/10 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setSubTab('vaults')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                subTab === 'vaults' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <Swords className="w-3.5 h-3.5 shrink-0" />
              <span>المداهمات</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('heists')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                subTab === 'heists' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>سطو جماعي{coopHeists.filter((h) => h.status !== 'completed').length > 0 ? ` (${coopHeists.filter((h) => h.status !== 'completed').length})` : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('bounties')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                subTab === 'bounties' ? 'bg-rose-700 text-white' : 'text-rose-300/90 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 shrink-0" />
              <span>لوحة المطلوبين{bounties.length > 0 ? ` (${bounties.length})` : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('arena')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                subTab === 'arena' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>الحلبة والبطولة</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('tower')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                subTab === 'tower' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>برج الظلال</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('territory')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                subTab === 'territory' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 shrink-0" />
              <span>حروب الأقاليم</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('bosses')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                subTab === 'bosses' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <Skull className="w-3.5 h-3.5 shrink-0" />
              <span>الزعماء</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('leaderboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                subTab === 'leaderboard' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span>العشائر والترتيب</span>
            </button>
          </div>
        </div>

        {/* Dominance Breakdown */}
        <div className="p-4 bg-[#12141C] border border-white/10 rounded-xl space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-medium text-zinc-300">ميزان السيطرة الليلية على أحياء المدينة</span>
            <div className="flex flex-wrap items-center gap-4 font-num">
              {(Object.keys(FACTIONS) as FactionId[]).map((fId) => {
                const pct = Math.round((player.dominance[fId] / totalDominance) * 100);
                return (
                  <span key={fId} className="text-zinc-300">
                    {FACTIONS[fId].name}: <strong className="text-white">{pct}%</strong>
                  </span>
                );
              })}
            </div>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden flex bg-zinc-900">
            <div
              className="bg-amber-600 transition-all duration-300"
              style={{ width: `${(player.dominance.shadow_hunters / totalDominance) * 100}%` }}
            />
            <div
              className="bg-sky-500 transition-all duration-300"
              style={{ width: `${(player.dominance.tech_wardens / totalDominance) * 100}%` }}
            />
            <div
              className="bg-rose-600 transition-all duration-300"
              style={{ width: `${(player.dominance.blood_mages / totalDominance) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sub-Tab 1: Vault Raids */}
      {subTab === 'vaults' && (
        <div className="space-y-6">
          {/* Incoming Raid / Auction Alerts with Revenge */}
          {unresolvedAlerts.length > 0 && (
            <div className="p-5 bg-rose-950/20 border border-rose-500/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
                  <Bell className="w-4 h-4" />
                  <span>تنبيهات المعارك والمزاد الحية ({unresolvedAlerts.length})</span>
                </div>
                <span className="text-xs text-zinc-400">رد الاعتبار يمنحك غنيمة +50% إضافية</span>
              </div>
              <div className="space-y-2.5">
                {unresolvedAlerts.slice(0, 5).map((alert) => {
                  const isNemesis = Boolean(alert.attackerUid && player.nemeses?.[alert.attackerUid]);
                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 bg-[#0E1016] border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isNemesis ? 'border-rose-500/55' : 'border-white/10'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white flex flex-wrap items-center gap-2">
                          <span>{alert.summary}</span>
                          {isNemesis && (
                            <span className="text-rose-400 font-bold text-[11px]">· خصم لدود (+25% غنيمة)</span>
                          )}
                        </div>
                        <div className="text-zinc-400 font-num">
                          {alert.attackerName} · قوة {alert.attackerPower} · قيمة الحدث {alert.goldAmount.toLocaleString('en-US')} ذهب
                        </div>
                      </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {alert.alertType === 'raid_incoming' ? (
                        <>
                          <button
                            type="button"
                            disabled={cooldownSec > 0 || player.energy < 2 || player.hp < 20}
                            onClick={() => onRevengeAlert(alert, stance)}
                            className="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-lg cursor-pointer"
                          >
                            انتقام مضاعف (2 طاقة)
                          </button>
                          {isOnline && (
                            <button
                              type="button"
                              disabled={player.gold < 500}
                              onClick={() =>
                                onCreateBounty(
                                  alert.attackerUid,
                                  alert.attackerName,
                                  alert.attackerFaction,
                                  500,
                                  0,
                                  'اعتداء على خزنتي'
                                )
                              }
                              className="px-3 py-2 bg-amber-700 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-lg cursor-pointer font-num"
                            >
                              رصد مكافأة (500 ذهب)
                            </button>
                          )}
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onDismissAlert(alert.id)}
                        className={`px-3 py-2 rounded-lg cursor-pointer font-semibold ${
                          alert.alertType === 'referral_bonus'
                            ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        {alert.alertType === 'referral_bonus' ? 'استلام المكافأة' : 'تجاهل'}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-200">أسلوب المداهمة</h3>
              <div className="flex flex-wrap items-center gap-3">
                {cooldownSec > 0 && (
                  <span className="text-xs font-num text-amber-400">
                    فترة إعادة التموضع: {cooldownSec} ثانية
                  </span>
                )}
                {(cooldownSec > 0 || player.energy < 2 || player.hp < 20) && (
                  <button
                    type="button"
                    onClick={player.crystals >= 8 ? onQuickRecover : onOpenStore}
                    className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer font-num"
                  >
                    {player.crystals >= 8 ? 'تجاوز الانتظار + شحن كامل (8 بلورات)' : 'تجاوز الانتظار وشحن فوري (متجر)'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onRefreshTargets}
                  className="px-3.5 py-1.5 bg-[#181B26] hover:bg-[#222636] border border-white/10 text-xs font-medium text-zinc-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تحديث الأهداف</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {STANCES.map((s) => {
                const active = stance === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStance(s.id)}
                    className={`p-4 rounded-xl border text-start transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#1A1D29] border-amber-500 text-white'
                        : 'bg-[#12141C] border-white/10 text-zinc-300 hover:border-white/25'
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">{s.name}</div>
                    <div className="text-xs text-zinc-400">{s.summary}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {targets.map((target) => {
                const targetFaction = FACTIONS[target.factionId];
                const isNemesis = Boolean(target.uid && player.nemeses?.[target.uid]);
                const disabled = cooldownSec > 0 || player.energy < 2 || player.hp < 20;

                return (
                  <div
                    key={target.id}
                    className={`p-5 bg-[#14161F] border rounded-xl flex flex-col justify-between gap-4 ${
                      isNemesis
                        ? 'border-rose-500/60'
                        : target.isRealPlayer
                        ? 'border-sky-500/40'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
                        <ResilientImage
                          src={targetFaction.portrait}
                          alt={target.codename}
                          className="w-full h-full object-cover"
                          fallbackTitle={target.codename}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-0.5">
                          <span>{targetFaction.name}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              target.difficulty === 'أسطوري'
                                ? 'text-rose-400 font-semibold'
                                : target.difficulty === 'خطير'
                                ? 'text-amber-400 font-medium'
                                : 'text-emerald-400'
                            }
                          >
                            {target.difficulty}
                          </span>
                          {isNemesis && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-rose-400 font-bold">خصم لدود (+25% غنيمة)</span>
                            </>
                          )}
                        </div>
                        <h4 className="font-display text-base font-bold text-white truncate">{target.codename}</h4>
                        <div className="text-xs text-zinc-400 font-num mt-1">
                          المستوى {target.level} · القوة {target.powerRating}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-xs font-num">
                      <div>
                        <div className="text-zinc-500">ذهب متاح</div>
                        <div className="text-amber-400 font-semibold">{target.vaultGold}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500">مهربات</div>
                        <div className="text-zinc-200 font-semibold">{target.contrabandStash}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500">الدفاع</div>
                        <div className="text-zinc-200 font-semibold">{target.defenseScore}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onExecuteRaid(target, stance)}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>
                        {player.hp < 20
                          ? 'صحتك حرجة للمداهمة'
                          : player.energy < 2
                          ? 'يتطلب 2 طاقة'
                          : cooldownSec > 0
                          ? `انتظر ${cooldownSec}ث`
                          : 'بدء المداهمة (2 طاقة)'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            <aside
              className={`relative overflow-hidden bg-[#12141C] border border-white/10 rounded-xl p-5 h-fit space-y-4 ${
                raidFx ? 'animate-sf-shake' : ''
              }`}
            >
              {raidFx && (
                <>
                  <div className="pointer-events-none absolute inset-0 animate-sf-slash bg-gradient-to-l from-transparent via-amber-400/25 to-transparent" />
                  <div
                    key={raidFx.key}
                    className={`pointer-events-none absolute top-3 end-4 z-20 font-display text-sm font-bold animate-sf-float-up ${
                      raidFx.victory ? 'text-emerald-300' : 'text-rose-400'
                    }`}
                  >
                    {raidFx.label}
                  </div>
                </>
              )}

              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">تقرير الاشتباك</h3>
                  <p className="text-xs text-zinc-400 font-num mt-0.5">
                    انتصارات: {player.stats.raidsWon} · هزائم: {player.stats.raidsLost}
                  </p>
                </div>
                <ShieldAlert className="w-5 h-5 text-zinc-500" />
              </div>

              {!latestReport ? (
                <div className="py-8 text-center text-xs text-zinc-500 leading-relaxed">
                  اختر هدفاً من القائمة وابدأ المداهمة لعرض تفاصيل الجولات القتالية والغنائم.
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`p-3.5 rounded-lg border ${
                      latestReport.victory
                        ? 'bg-emerald-950/30 border-emerald-500/30'
                        : 'bg-red-950/30 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm font-bold mb-1">
                      <span className={latestReport.victory ? 'text-emerald-300' : 'text-red-300'}>
                        {latestReport.victory ? 'نجاح الاختراق' : 'فشل المداهمة'}
                      </span>
                      <span className="text-xs font-normal text-zinc-300">{latestReport.targetName}</span>
                    </div>
                    {latestReport.victory ? (
                      <div className="text-xs font-num text-zinc-200 space-y-0.5">
                        <div>
                          +{latestReport.goldStolen} ذهب · +{latestReport.contrabandStolen} مهربات
                          {latestReport.forgeStonesFound > 0 ? ` · +${latestReport.forgeStonesFound} صقل` : ''}
                        </div>
                        <div>
                          +{latestReport.xpGained} XP · +{latestReport.dominanceGained}% نفوذ فصيل
                          {latestReport.crystalsFound > 0 ? ` · +${latestReport.crystalsFound} بلورات` : ''}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-num text-zinc-300">
                        خسرت {latestReport.damageTaken} صحة مقابل +{latestReport.xpGained} XP خبرة قتالية.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
                    {latestReport.rounds.map((r, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-[#0E1016] border border-white/5 rounded-lg text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-zinc-400 font-num">
                          <span>{r.round === 0 ? 'فخ البوابة' : `الجولة ${r.round}`}</span>
                          <span className={r.actor === 'player' ? 'text-amber-400' : 'text-rose-400'}>
                            {r.isDodged ? 'تفادي' : r.isCrit ? `ضربة حاسمة (-${r.damage})` : `ضرر -${r.damage}`}
                          </span>
                        </div>
                        <p className="text-zinc-200">{r.actionText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Quick Gateway to Dedicated Bounty Board */}
          <div className="p-4 bg-[#12141C] border border-rose-500/35 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Crosshair className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-white">لوحة المطلوبين وعقود التصفية ({bounties.length} عقود مفتوحة)</div>
                <div className="text-zinc-400 mt-0.5">
                  ارصد مكافأة ذهب أو بلورات على أي منافس أو اصْطَد المطلوبين لربح جوائز فورية مضاعفة.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubTab('bounties')}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              فتح لوحة المطلوبين
            </button>
          </div>
        </div>
      )}

      {/* Sub-Tab 1C: Co-op Multi-Player Heist Rooms (2-4 Operatives) */}
      {subTab === 'heists' && (
        <div className="space-y-6">
          <div className="p-5 bg-[#12141C] border border-amber-500/35 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-amber-400 font-semibold inline-flex items-center gap-1.5 mb-1">
                <Users className="w-4 h-4" />
                <span>غرف السطو التعاوني الحي (2–4 لاعبين)</span>
              </div>
              <h3 className="font-display text-xl font-bold text-white">اقتحام الخزائن الكبرى كفريق</h3>
              <p className="text-xs text-zinc-400 mt-1">
                أنشئ غرفة سطو أو انضم لفريق (مطلوب لاعبان على الأقل لبدء الاقتحام). بعد إسقاط الحارس في 3 مراحل، يستلم كل عضو كامل الغنيمة!
              </p>
            </div>
            <div className="text-xs font-num text-emerald-300 font-semibold shrink-0">
              {isOnline ? `الغرف المتاحة: ${coopHeists.length}` : 'يتطلب اتصال سحابي'}
            </div>
          </div>

          {!isOnline ? (
            <div className="p-6 bg-[#14161F] border border-white/10 rounded-xl text-center space-y-2">
              <div className="text-sm font-bold text-white">غرف السطو الجماعية الحية تتطلب تسجيل الدخول</div>
              <p className="text-xs text-zinc-400">
                سجّل الدخول بحساب Google لتشكيل فرق سطو حقيقية مع بقية العملاء وتقاسم الغنائم والبلورات.
              </p>
            </div>
          ) : (
            <>
              {/* 3 Heist Templates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {COOP_HEIST_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-[#14161F] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-24 bg-[#0C0E14] border-b border-white/10 overflow-hidden">
                        <ResilientImage
                          src={tpl.image}
                          alt={tpl.title}
                          className="w-full h-full object-cover"
                          fallbackTitle={tpl.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#14161F] via-[#14161F]/40 to-transparent" />
                        <div className="absolute bottom-2 inset-x-4 flex items-center justify-between text-xs font-num">
                          <span className="text-amber-400 font-semibold">{tpl.difficulty}</span>
                          <span className="text-zinc-200">{tpl.bossMaxHp.toLocaleString('en-US')} HP</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <h4 className="font-display text-base font-bold text-white">{tpl.title}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">{tpl.description}</p>
                        <div className="text-xs font-num text-amber-300 pt-1">
                          لكل عضو: +{tpl.rewardGold.toLocaleString('en-US')} ذهب · +{tpl.rewardEssence} جوهر · +{tpl.rewardStones} صقل · +{tpl.rewardCrystals} بلورات
                        </div>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <button
                        type="button"
                        onClick={() => onCreateCoopHeist(tpl)}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                      >
                        فتح غرفة سطو جديدة
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active & Recruiting Heist Rooms */}
              <div className="space-y-4">
                <h4 className="font-display text-lg font-bold text-white">غرف السطو الجارية والمفتوحة</h4>
                {coopHeists.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6 bg-[#12141C] border border-white/10 rounded-xl">
                    لا توجد غرف سطو حالياً — أنشئ أول غرفة وادعُ رفاقك عبر راديو المدينة!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {coopHeists.map((heist) => {
                      const isMember = Boolean(myUid && heist.memberUids.includes(myUid));
                      const isHost = Boolean(myUid && heist.hostUid === myUid);
                      const isClaimed = Boolean(player.claimedHeistIds?.includes(heist.id));
                      const hpPct = Math.max(0, Math.min(100, Math.round((heist.bossCurrentHp / Math.max(1, heist.bossMaxHp)) * 100)));
                      const tpl = COOP_HEIST_TEMPLATES.find((t) => t.id === heist.templateId) || COOP_HEIST_TEMPLATES[0];

                      return (
                        <div
                          key={heist.id}
                          className={`p-5 bg-[#14161F] border rounded-xl space-y-4 ${
                            isMember ? 'border-amber-500/45' : 'border-white/10'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="text-xs text-amber-400 font-semibold font-num">
                                {heist.difficulty} · القائد: {heist.hostName}
                              </div>
                              <h5 className="font-display text-lg font-bold text-white">{heist.title}</h5>
                              <div className="text-xs text-zinc-400 mt-0.5">
                                الحارس: <strong className="text-rose-300">{heist.bossName}</strong> · المرحلة {heist.phase}/3
                              </div>
                            </div>
                            <span
                              className={`text-xs font-semibold font-num ${
                                heist.status === 'completed'
                                  ? 'text-emerald-400'
                                  : heist.status === 'active'
                                  ? 'text-rose-400'
                                  : 'text-sky-300'
                              }`}
                            >
                              {heist.status === 'completed'
                                ? 'مكتمل ✓'
                                : heist.status === 'active'
                                ? 'اشتباك نشط'
                                : `تجند (${heist.memberUids.length}/4)`}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-num text-zinc-300">
                              <span>صحة الحارس</span>
                              <span>
                                {heist.bossCurrentHp.toLocaleString('en-US')} / {heist.bossMaxHp.toLocaleString('en-US')} ({hpPct}%)
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-600 transition-all duration-300" style={{ width: `${hpPct}%` }} />
                            </div>
                          </div>

                          <div className="p-2.5 bg-[#0B0C10] border border-white/5 rounded-lg text-xs text-zinc-300">
                            {heist.lastActionText}
                          </div>

                          {/* Squad Roster */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {heist.memberSummaries.map((raw, idx) => {
                              const parts = raw.split('|');
                              const mName = parts[1] || 'عميل';
                              const mFaction = (parts[2] || 'shadow_hunters') as FactionId;
                              const mDmg = Number(parts[4] || 0);
                              return (
                                <div
                                  key={`${parts[0]}-${idx}`}
                                  className="px-2.5 py-1.5 bg-[#0E1016] border border-white/5 rounded flex items-center justify-between gap-2"
                                >
                                  <span className="text-zinc-200 truncate">
                                    {mName} <span className="text-zinc-500">({FACTIONS[mFaction]?.name.split(' ')[0]})</span>
                                  </span>
                                  <span className="font-num text-amber-300 font-semibold shrink-0">{mDmg} ضرر</span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                            <span className="text-[11px] font-num text-zinc-400">
                              الغنائم: +{tpl.rewardGold} ذهب · +{tpl.rewardCrystals} بلورات
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {heist.status === 'recruiting' && !isMember && heist.memberUids.length < 4 && (
                                <button
                                  type="button"
                                  onClick={() => onJoinCoopHeist(heist)}
                                  className="px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                                >
                                  انضمام للفرقة
                                </button>
                              )}
                              {heist.status === 'recruiting' && isHost && (
                                <button
                                  type="button"
                                  disabled={heist.memberUids.length < 2}
                                  onClick={() => onLaunchCoopHeist(heist)}
                                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                                >
                                  {heist.memberUids.length < 2 ? 'بانتظار عضو ثانٍ (2–4)' : 'بدء اقتحام الخزنة'}
                                </button>
                              )}
                              {heist.status === 'active' && isMember && (
                                <button
                                  type="button"
                                  disabled={player.energy < 2 || player.hp < 15}
                                  onClick={() => onStrikeCoopHeist(heist)}
                                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                                >
                                  توجيه ضربة فرقة (2 طاقة)
                                </button>
                              )}
                              {heist.status === 'completed' && isMember && !isClaimed && (
                                <button
                                  type="button"
                                  onClick={() => onClaimCoopHeistReward(heist)}
                                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                                >
                                  استلام غنائم السطو!
                                </button>
                              )}
                              {heist.status === 'completed' && isMember && isClaimed && (
                                <span className="text-xs text-emerald-400 font-semibold">تم استلام الغنيمة ✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sub-Tab 1B: Dedicated Bounty Board (Always Visible) */}
      {subTab === 'bounties' && (
        <div className="space-y-6">
          <div className="p-5 bg-[#12141C] border border-rose-500/40 rounded-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Crosshair className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="font-display text-xl font-bold text-white">لوحة الجوائز والمطلوبين</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    ارصد جائزة مالية أو بلورات على رأس أي خصم، أو نفّذ مطاردة على المطلوبين لقبض المكافأة فور الفوز.
                  </p>
                </div>
              </div>
              <div className="text-xs font-num text-amber-300 font-semibold">
                العقود المفتوحة حالياً: {bounties.length}
              </div>
            </div>

            {!isOnline ? (
              <div className="p-6 bg-[#0E1016] border border-white/10 rounded-xl text-center space-y-2">
                <div className="text-sm font-bold text-white">لوحة المطلوبين الحية تتطلب تفعيل السيرفر السحابي</div>
                <p className="text-xs text-zinc-400 max-w-xl mx-auto leading-relaxed">
                  سجّل الدخول بحساب Google من الشاشة الرئيسية ليظهر اسمك وتتمكن من رصد عقود التصفية على اللاعبين الحقيقيين ومطاردتهم في الوقت الفعلي.
                </p>
              </div>
            ) : (
              <>
                {onlineOperatives.filter((op) => op.uid !== myUid).length > 0 ? (
                  <div className="p-4 bg-[#0E1016] border border-white/10 rounded-xl space-y-3">
                    <div className="text-xs font-semibold text-rose-300">رصد عقد مطاردة جديد</div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                      <select
                        value={bountyTargetUid}
                        onChange={(e) => setBountyTargetUid(e.target.value)}
                        className="px-3 py-2 bg-[#14161F] border border-white/10 rounded-lg text-white"
                      >
                        <option value="">اختر عميلاً مستهدفاً...</option>
                        {onlineOperatives
                          .filter((op) => op.uid !== myUid)
                          .map((op) => (
                            <option key={op.uid} value={op.uid}>
                              {op.codename} ({FACTIONS[op.factionId].name} · قوة {op.powerScore})
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        min={200}
                        max={1000000}
                        step={100}
                        value={bountyGoldInput}
                        onChange={(e) => setBountyGoldInput(Math.max(200, Number(e.target.value)))}
                        placeholder="المكافأة بالذهب"
                        className="px-3 py-2 bg-[#14161F] border border-white/10 rounded-lg text-white font-num"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={bountyCrystalInput}
                        onChange={(e) => setBountyCrystalInput(Math.max(0, Math.min(100, Number(e.target.value))))}
                        placeholder="بلورات إضافية (اختياري)"
                        className="px-3 py-2 bg-[#14161F] border border-white/10 rounded-lg text-sky-300 font-num"
                      />
                      <input
                        type="text"
                        maxLength={80}
                        value={bountyReasonInput}
                        onChange={(e) => setBountyReasonInput(e.target.value)}
                        placeholder="سبب المطاردة (اختياري)..."
                        className="px-3 py-2 bg-[#14161F] border border-white/10 rounded-lg text-white"
                      />
                      <button
                        type="button"
                        disabled={
                          !bountyTargetUid ||
                          player.gold < bountyGoldInput ||
                          player.crystals < bountyCrystalInput
                        }
                        onClick={() => {
                          const target = onlineOperatives.find((o) => o.uid === bountyTargetUid);
                          if (!target) return;
                          onCreateBounty(
                            target.uid,
                            target.codename,
                            target.factionId,
                            bountyGoldInput,
                            bountyCrystalInput,
                            bountyReasonInput
                          );
                          setBountyReasonInput('');
                          setBountyCrystalInput(0);
                        }}
                        className="px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                      >
                        نشر عقد المطاردة
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">
                    لا يوجد عملاء متصلون آخرون حالياً لاختيارهم في قائمة العقود.
                  </p>
                )}

                {bounties.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">
                    لا توجد عقود مطاردة مفتوحة حالياً — كن أول من يرصد مكافأة على خصم!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bounties.map((b) => {
                      const isMine = b.posterUid === myUid;
                      const isMeTarget = b.targetUid === myUid;
                      const matchedOp = onlineOperatives.find((o) => o.uid === b.targetUid);
                      const approxStat = matchedOp ? Math.max(12, Math.round(matchedOp.powerScore / 7)) : 18;
                      const huntTarget: RaidTarget = {
                        id: `bounty-${b.id}`,
                        uid: b.targetUid,
                        isRealPlayer: true,
                        codename: `${b.targetName} (مطلوب)`,
                        factionId: b.targetFaction,
                        level: matchedOp?.level || player.level,
                        powerRating: matchedOp?.powerScore || approxStat * 7,
                        vaultGold: matchedOp ? Math.max(400, Math.round(matchedOp.vaultGold * 0.25)) : 500,
                        contrabandStash: 3,
                        defenseScore: matchedOp?.defenseScore || approxStat * 2,
                        difficulty: 'خطير',
                        attributes: {
                          attack: approxStat,
                          defense: approxStat,
                          agility: approxStat,
                          mastery: approxStat,
                          influence: approxStat,
                        },
                        hqTrapLevel: matchedOp ? Math.min(20, matchedOp.level) : 4,
                      };

                      return (
                        <div
                          key={b.id}
                          className="p-4 bg-[#0E1016] border border-white/10 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-white">
                              المطلوب: {b.targetName}{' '}
                              <span className="text-zinc-400 font-normal">({FACTIONS[b.targetFaction].name})</span>
                            </div>
                            <div className="text-zinc-400">
                              الراصد: {b.posterName} · السبب: {b.reason || 'تصفية حساب'}
                            </div>
                            <div className="font-num text-amber-400 font-semibold">
                              المكافأة: {b.rewardGold.toLocaleString('en-US')} ذهب
                              {b.rewardCrystals > 0 ? ` + ${b.rewardCrystals} بلورات` : ''}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isMine ? (
                              <button
                                type="button"
                                onClick={() => onCancelBounty(b)}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-rose-300 font-semibold rounded-md whitespace-nowrap cursor-pointer"
                              >
                                سحب وإلغاء
                              </button>
                            ) : isMeTarget ? (
                              <span className="text-rose-400 font-semibold">رأسك مطلوب حالياً!</span>
                            ) : (
                              <button
                                type="button"
                                disabled={cooldownSec > 0 || player.energy < 2 || player.hp < 20}
                                onClick={() => onExecuteRaid(huntTarget, stance)}
                                className="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-md whitespace-nowrap cursor-pointer"
                              >
                                {cooldownSec > 0 ? `انتظر ${cooldownSec}ث` : 'مطاردة (2 طاقة)'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Interactive Arena + Knockout Tournament + Companion Battles */}
      {subTab === 'arena' && (
        <div className="space-y-8">
          <div className="relative rounded-xl overflow-hidden border border-white/10 min-h-[160px] flex items-end">
            <ResilientImage
              src={ARENA_COLOSSEUM_IMAGE}
              alt="حلبة الكولوسيوم الليلية"
              className="absolute inset-0 w-full h-full object-cover opacity-55"
              fallbackTitle="حلبة القتال التكتيكي"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/60 to-transparent" />
            <div className="relative w-full p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-amber-400 font-medium mb-1">
                  تصنيفك: {player.arenaRating} نقطة · ألقاب البطولة: {player.tournamentWins || 0}
                </div>
                <h3 className="font-display text-xl font-bold text-white">حلبة الظلال وبطولة الكولوسيوم</h3>
              </div>
              {player.activeCompanion && (
                <div className="text-xs text-emerald-300">
                  المرافق النشط ({COMPANIONS[player.activeCompanion].name}) يقاتل بجانبك في كل جولة!
                </div>
              )}
            </div>
          </div>

          {activeDuel ? (
            <div className="p-6 bg-[#14161F] border border-amber-500/40 rounded-xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className={`relative overflow-hidden p-4 bg-[#0E1016] border border-white/10 rounded-xl space-y-3 ${
                    duelFx?.shakePlayer ? 'animate-sf-shake animate-sf-hit-flash' : ''
                  }`}
                >
                  {duelFx?.playerPopup && (
                    <div
                      key={`p-${duelFx.key}`}
                      className={`pointer-events-none absolute top-2 end-3 z-20 font-display text-lg font-bold animate-sf-float-up ${
                        duelFx.playerTone === 'heal' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {duelFx.playerPopup}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-white">{player.codename}</span>
                    <span className="text-xs font-num text-emerald-400">
                      {activeDuel.playerHp} / {activeDuel.playerMaxHp} HP
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${Math.round((activeDuel.playerHp / activeDuel.playerMaxHp) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-num">
                    <span className="text-amber-400 inline-flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>غضب الفصيل: {activeDuel.playerFury}/100</span>
                    </span>
                    <span className="text-zinc-400">ترياق متبقي: {activeDuel.potionsLeft}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-200"
                      style={{ width: `${activeDuel.playerFury}%` }}
                    />
                  </div>
                </div>

                <div
                  className={`relative overflow-hidden p-4 bg-[#0E1016] border border-white/10 rounded-xl space-y-3 ${
                    duelFx?.shakeEnemy ? 'animate-sf-shake animate-sf-hit-flash' : ''
                  }`}
                >
                  {duelFx?.shakeEnemy && (
                    <div
                      key={`s-${duelFx.key}`}
                      className="pointer-events-none absolute inset-0 animate-sf-slash bg-gradient-to-l from-transparent via-amber-300/35 to-transparent"
                    />
                  )}
                  {duelFx?.enemyPopup && (
                    <div
                      key={`e-${duelFx.key}`}
                      className={`pointer-events-none absolute top-2 end-3 z-20 font-display font-bold animate-sf-float-up ${
                        duelFx.isCrit ? 'text-2xl text-amber-300' : 'text-lg text-rose-400'
                      }`}
                    >
                      {duelFx.enemyPopup}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-white">{activeDuel.opponentName}</span>
                    <span className="text-xs font-num text-rose-400">
                      {activeDuel.opponentHp} / {activeDuel.opponentMaxHp} HP
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 transition-all duration-200"
                      style={{ width: `${Math.round((activeDuel.opponentHp / activeDuel.opponentMaxHp) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-zinc-300">
                    نية الخصم في الجولة القادمة:{' '}
                    <strong className="text-amber-300">
                      {activeDuel.enemyIntent === 'heavy'
                        ? 'يستعد لضربة قوية (+45% ضرر)'
                        : activeDuel.enemyIntent === 'guard'
                        ? 'يتحصن في وضعية دفاع'
                        : 'هجوم قياسي متوازن'}
                    </strong>
                  </div>
                </div>
              </div>

              {activeDuel.finished ? (
                <div className="p-5 bg-[#0E1016] border border-white/10 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4
                      className={`font-display text-xl font-bold ${
                        activeDuel.victory ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {activeDuel.victory ? 'انتصار حاسم في الحلبة!' : 'سقطت في الحلبة'}
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      {activeDuel.victory
                        ? 'تمت إضافة الذهب وأحجار الصقل ونقاط التصنيف إلى حسابك.'
                        : 'عزز أسلحتك ومهاراتك أو استخدم الصد والترياق في النزال القادم.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onCloseDuel}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    العودة لقائمة المتحدين
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => onDuelAction('strike')}
                    className="py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    ضربة نصل (+25 غضب)
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuelAction('guard')}
                    className="py-3 px-4 bg-[#1E2333] hover:bg-[#282F44] border border-white/10 text-sky-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    صد ورد (+10% صحة)
                  </button>
                  <button
                    type="button"
                    disabled={activeDuel.playerFury < 50}
                    onClick={() => onDuelAction('ultimate')}
                    className="py-3 px-4 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    قدرة الفصيل (50 غضب)
                  </button>
                  <button
                    type="button"
                    disabled={activeDuel.potionsLeft <= 0}
                    onClick={() => onDuelAction('potion')}
                    className="py-3 px-4 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    جرعة شفاء ({activeDuel.potionsLeft})
                  </button>
                </div>
              )}

              <div className="p-4 bg-[#0B0C10] border border-white/5 rounded-xl space-y-1.5 max-h-44 overflow-y-auto">
                {activeDuel.logs.map((entry, idx) => (
                  <div key={idx} className="text-xs text-zinc-300">
                    • {entry}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {ARENA_OPPONENTS.map((opp) => {
                  const f = FACTIONS[opp.factionId];
                  return (
                    <div
                      key={opp.id}
                      className="p-5 bg-[#14161F] border border-white/10 rounded-xl flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <ResilientImage
                            src={f.portrait}
                            alt={opp.name}
                            className="w-full h-full object-cover"
                            fallbackTitle={opp.name}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-amber-400 font-medium">
                            {opp.tierLabel} · {f.name}
                          </div>
                          <h4 className="font-display text-lg font-bold text-white">{opp.name}</h4>
                          <div className="text-xs font-num text-zinc-400">
                            الصحة {opp.hp} · الهجوم {opp.attack} · الدفاع {opp.defense}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs font-num text-zinc-300">
                          +{opp.rewardGold} ذهب · +{opp.rewardRating} تصنيف · +{opp.rewardForgeStones} صقل · +
                          {opp.rewardCrystals} بلورات
                        </div>
                        <button
                          type="button"
                          disabled={player.energy < 2}
                          onClick={() => onStartDuel(opp)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                        >
                          {player.energy < 2 ? 'يتطلب 2 طاقة' : 'دخول النزال (2 طاقة)'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Knockout Tournament + Companion Battles Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* 16-Player Knockout Tournament */}
                <div className="p-5 bg-[#14161F] border border-amber-500/30 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <h3 className="font-display text-lg font-bold text-white">بطولة الكولوسيوم الإقصائية</h3>
                    </div>
                    <span className="text-xs font-num text-amber-400">ألقابك: {player.tournamentWins || 0}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    بطولة خروج المغلوب من 4 جولات (دور الـ 16 ← ربع النهائي ← نصف النهائي ← النهائي). الفوز باللقب يمنح ذهباً ضخماً، 10 بلورات، وحجر روني!
                  </p>

                  {!tournament || tournament.finished ? (
                    <div className="space-y-3">
                      {tournament?.finished && (
                        <div
                          className={`p-3 rounded-lg text-xs ${
                            tournament.champion ? 'bg-emerald-950/30 text-emerald-300' : 'bg-rose-950/30 text-rose-300'
                          }`}
                        >
                          {tournament.champion
                            ? 'توجت بطلاً للكولوسيوم وحصلت على الجائزة الكبرى!'
                            : 'خرجت من البطولة — يمكنك التسجيل في جولة جديدة.'}
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={player.energy < 2}
                        onClick={onStartTournament}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        دخول بطولة جديدة (2 طاقة)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-[#0E1016] border border-white/10 rounded-lg space-y-1 text-xs">
                        <div className="flex justify-between text-amber-400 font-semibold">
                          <span>
                            {tournament.round === 1
                              ? 'دور الـ 16'
                              : tournament.round === 2
                              ? 'ربع النهائي'
                              : tournament.round === 3
                              ? 'نصف النهائي'
                              : 'النهائي الكبير'}
                          </span>
                          <span className="font-num">قوة الخصم: {tournament.opponentPower}</span>
                        </div>
                        <div className="text-sm font-bold text-white">{tournament.opponentName}</div>
                        <div className="text-zinc-400">{FACTIONS[tournament.opponentFaction].name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={onFightTournamentRound}
                        className="w-full py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        خوض الجولة الحالية
                      </button>
                      {tournament.logs.length > 0 && (
                        <div className="text-xs text-zinc-300 space-y-1">
                          {tournament.logs.slice(0, 3).map((l, idx) => (
                            <div key={idx}>• {l}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Companion Head-to-Head Arena */}
                <div className="p-5 bg-[#14161F] border border-white/10 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Swords className="w-5 h-5 text-sky-400" />
                      <h3 className="font-display text-lg font-bold text-white">ساحة نزال المرافقين</h3>
                    </div>
                    <span className="text-xs text-sky-300">
                      {player.activeCompanion ? COMPANIONS[player.activeCompanion].name : 'لا يوجد مرافق نشط'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    أطلق مرافقك الليلي في مواجهة مباشرة أمام مرافقي الخصوم لربح الذهب وجوهر الصياغة.
                  </p>

                  {!player.activeCompanion ? (
                    <div className="p-4 bg-[#0E1016] border border-white/10 rounded-lg text-xs text-amber-300">
                      استدعِ مرافقاً من تبويب الاقتصاد ← المرافقون أولاً لتتمكن من دخول نزال المرافقين.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {(['shadow_raven', 'tech_drone', 'blood_hound'] as CompanionId[]).map((cId) => (
                          <button
                            key={cId}
                            type="button"
                            disabled={player.energy < 1}
                            onClick={() => onFightCompanionDuel(cId)}
                            className="p-2.5 bg-[#0E1016] hover:bg-[#191D2A] border border-white/10 rounded-lg text-center space-y-1 cursor-pointer disabled:opacity-40"
                          >
                            <div className="text-xs font-semibold text-white">{COMPANIONS[cId].name.split(' ')[0]}</div>
                            <div className="text-[11px] text-amber-400">تحدي (1 طاقة)</div>
                          </button>
                        ))}
                      </div>

                      {companionDuelLog && (
                        <div
                          className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                            companionDuelLog.victory
                              ? 'bg-emerald-950/25 border-emerald-500/30'
                              : 'bg-rose-950/25 border-rose-500/30'
                          }`}
                        >
                          <div className="font-bold text-white">{companionDuelLog.title}</div>
                          <div className="text-amber-300 font-num">{companionDuelLog.rewardText}</div>
                          {companionDuelLog.logs.slice(0, 3).map((line, i) => (
                            <div key={i} className="text-zinc-300">
                              • {line}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Real-Time 1v1 PvP Duels + Colosseum Tournament Gold Predictions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                {/* Real-Time 1v1 PvP Duels */}
                <div className="lg:col-span-7 p-5 bg-[#14161F] border border-sky-500/35 rounded-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-sky-400" />
                      <h3 className="font-display text-lg font-bold text-white">مبارزات 1 ضد 1 الحية (الوقت الفعلي)</h3>
                    </div>
                    <span className="text-xs text-zinc-400">نوبة متزامنة ضد لاعبين حقيقيين</span>
                  </div>

                  {!isOnline ? (
                    <div className="p-4 bg-[#0E1016] border border-white/10 rounded-lg text-xs text-zinc-400">
                      سجّل الدخول بحساب Google لإنشاء غرف مبارزة حية أو قبول تحديات اللاعبين الآخرين.
                    </div>
                  ) : (() => {
                    const myActiveDuel = liveDuels.find(
                      (d) =>
                        (d.challengerUid === myUid || d.opponentUid === myUid) &&
                        (d.status === 'active' ||
                          d.status === 'open' ||
                          (d.status === 'finished' &&
                            d.winnerUid === myUid &&
                            !(player.claimedLiveDuelIds || []).includes(d.id)))
                    );

                    const openDuels = liveDuels.filter(
                      (d) =>
                        d.status === 'open' &&
                        d.challengerUid !== myUid &&
                        (!d.opponentUid || d.opponentUid === myUid)
                    );

                    return (
                      <div className="space-y-4">
                        {myActiveDuel ? (
                          <div className="p-4 bg-[#0E1016] border border-amber-500/40 rounded-xl space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-amber-300 font-num">
                                {myActiveDuel.status === 'open'
                                  ? 'بانتظار انضمام منافس...'
                                  : myActiveDuel.status === 'finished'
                                  ? 'انتهت المبارزة الحية!'
                                  : `الجولة ${myActiveDuel.turn} · رهان ${myActiveDuel.stakeGold.toLocaleString('en-US')} ذهب`}
                              </span>
                              {myActiveDuel.status === 'open' && myActiveDuel.challengerUid === myUid && (
                                <button
                                  type="button"
                                  onClick={() => onCancelLiveDuel(myActiveDuel.id)}
                                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-rose-300 rounded-md cursor-pointer"
                                >
                                  إلغاء واسترداد الذهب
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="p-3 bg-[#14161F] border border-white/10 rounded-lg space-y-1.5">
                                <div className="font-bold text-white truncate">{myActiveDuel.challengerName}</div>
                                <div className="text-[11px] font-num text-emerald-400">
                                  {myActiveDuel.challengerHp} / {myActiveDuel.challengerMaxHp} HP · قوة {myActiveDuel.challengerPower}
                                </div>
                                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 transition-all"
                                    style={{
                                      width: `${Math.round((myActiveDuel.challengerHp / Math.max(1, myActiveDuel.challengerMaxHp)) * 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="p-3 bg-[#14161F] border border-white/10 rounded-lg space-y-1.5">
                                <div className="font-bold text-white truncate">
                                  {myActiveDuel.opponentName || 'في انتظار الخصم'}
                                </div>
                                <div className="text-[11px] font-num text-rose-400">
                                  {myActiveDuel.opponentHp} / {myActiveDuel.opponentMaxHp} HP · قوة {myActiveDuel.opponentPower}
                                </div>
                                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-rose-600 transition-all"
                                    style={{
                                      width: `${Math.round((myActiveDuel.opponentHp / Math.max(1, myActiveDuel.opponentMaxHp)) * 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="p-2.5 bg-[#090B10] border border-white/5 rounded text-xs text-zinc-300">
                              {myActiveDuel.lastSummary}
                            </div>

                            {myActiveDuel.status === 'active' && (() => {
                              const amChallenger = myUid === myActiveDuel.challengerUid;
                              const myMoved = amChallenger
                                ? Boolean(myActiveDuel.challengerAction)
                                : Boolean(myActiveDuel.opponentAction);
                              return myMoved ? (
                                <div className="text-xs text-amber-300 font-semibold text-center py-2">
                                  ✓ تم تسجيل حركتك — بانتظار قرار الخصم في هذه الجولة...
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => onSubmitLiveDuelMove(myActiveDuel, 'strike')}
                                    className="py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg cursor-pointer"
                                  >
                                    ضربة خاطفة
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onSubmitLiveDuelMove(myActiveDuel, 'guard')}
                                    className="py-2 bg-sky-700 hover:bg-sky-600 text-white font-semibold rounded-lg cursor-pointer"
                                  >
                                    دفاع +6% HP
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onSubmitLiveDuelMove(myActiveDuel, 'counter')}
                                    className="py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg cursor-pointer"
                                  >
                                    هجوم مضاد
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onSubmitLiveDuelMove(myActiveDuel, 'ultimate')}
                                    className="py-2 bg-rose-700 hover:bg-rose-600 text-white font-semibold rounded-lg cursor-pointer"
                                  >
                                    ضربة قاضية
                                  </button>
                                </div>
                              );
                            })()}

                            {myActiveDuel.status === 'finished' && myActiveDuel.winnerUid === myUid && (
                              <button
                                type="button"
                                onClick={() => onClaimLiveDuelReward(myActiveDuel)}
                                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer font-num"
                              >
                                استلام جائزة الفوز (+{(myActiveDuel.stakeGold * 2 + 450).toLocaleString('en-US')} ذهب + 55 تصنيف)
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-3.5 bg-[#0E1016] border border-white/10 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-zinc-300 font-semibold">قيمة الرهان:</span>
                              {[0, 500, 1500, 5000].map((amt) => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => setDuelStakeInput(amt)}
                                  className={`px-2.5 py-1 rounded font-num cursor-pointer ${
                                    duelStakeInput === amt
                                      ? 'bg-amber-600 text-white font-bold'
                                      : 'bg-[#14161F] text-zinc-300 border border-white/10'
                                  }`}
                                >
                                  {amt === 0 ? 'ودية' : amt.toLocaleString('en-US')}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              disabled={player.gold < duelStakeInput}
                              onClick={() => onCreateLiveDuel(duelStakeInput, null)}
                              className="px-4 py-2 bg-sky-700 hover:bg-sky-600 disabled:bg-zinc-800 text-white font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                            >
                              إنشاء غرفة مبارزة حية
                            </button>
                          </div>
                        )}

                        {openDuels.length > 0 && (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {openDuels.map((d) => (
                              <div
                                key={d.id}
                                className="p-3 bg-[#0E1016] border border-white/10 rounded-lg flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate">
                                    {d.challengerName}{' '}
                                    {d.opponentUid === myUid && <span className="text-rose-400">(تحدي موجه لك!)</span>}
                                  </div>
                                  <div className="text-zinc-400 font-num">
                                    {FACTIONS[d.challengerFaction].name} · قوة {d.challengerPower} · رهان{' '}
                                    {d.stakeGold.toLocaleString('en-US')} ذهب
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  disabled={player.gold < d.stakeGold}
                                  onClick={() => onJoinLiveDuel(d)}
                                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-white font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  قبول النزال
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Colosseum Tournament Gold Predictions (Free-to-play 5-Min Cycles) */}
                {(() => {
                  const betCycle = getTournamentBetCycle(now);
                  const minsLeft = Math.floor(betCycle.msRemaining / 60000);
                  const secsLeft = Math.floor((betCycle.msRemaining % 60000) / 1000);
                  const activeBet = player.activeTournamentBet || null;
                  const canSettle = Boolean(activeBet && activeBet.cycleNumber < betCycle.cycleNumber);
                  const selectedChamp =
                    TOURNAMENT_CHAMPION_POOL.find((c) => c.factionId === betChampionId) || TOURNAMENT_CHAMPION_POOL[0];

                  return (
                    <div className="lg:col-span-5 p-5 bg-[#14161F] border border-amber-500/35 rounded-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <h3 className="font-display text-base font-bold text-white">توقعات الكولوسيوم بالذهب</h3>
                        </div>
                        <span className="text-xs font-num text-amber-300 font-bold">
                          الجولة #{betCycle.cycleNumber} · {String(minsLeft).padStart(2, '0')}:{String(secsLeft).padStart(2, '0')}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-400">
                        الفائز في الجولة السابقة (#{betCycle.lastCycleNumber}):{' '}
                        <strong className="text-amber-300">{betCycle.lastWinner.winnerName}</strong>
                      </div>

                      {activeBet ? (
                        <div className="p-4 bg-[#0E1016] border border-amber-500/35 rounded-xl space-y-3 text-xs">
                          <div className="font-bold text-white">توقعك المسجل للجولة #{activeBet.cycleNumber}</div>
                          <div className="text-amber-300 font-semibold">{activeBet.championName}</div>
                          <div className="font-num text-zinc-300">
                            المبلغ: {activeBet.stakeGold.toLocaleString('en-US')} ذهب · المضاعف: {activeBet.multiplier}x
                          </div>
                          {canSettle ? (
                            <button
                              type="button"
                              onClick={onSettleTournamentBet}
                              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg cursor-pointer"
                            >
                              إظهار النتيجة واستلام الأرباح
                            </button>
                          ) : (
                            <div className="text-[11px] text-sky-300">
                              سيُعلن الفائز عند انتهاء عداد الجولة خلال {minsLeft}د {secsLeft}ث.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 text-xs">
                          <div className="space-y-1.5">
                            {TOURNAMENT_CHAMPION_POOL.map((champ) => (
                              <button
                                key={champ.factionId}
                                type="button"
                                onClick={() => setBetChampionId(champ.factionId)}
                                className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between cursor-pointer ${
                                  betChampionId === champ.factionId
                                    ? 'bg-[#1D2130] border-amber-500 text-white font-bold'
                                    : 'bg-[#0E1016] border-white/10 text-zinc-300'
                                }`}
                              >
                                <span>{champ.name}</span>
                                <span className="font-num text-amber-400">{champ.multiplier}x</span>
                              </button>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {[300, 800, 2000].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setBetStakeInput(amt)}
                                className={`px-3 py-1.5 rounded font-num cursor-pointer ${
                                  betStakeInput === amt
                                    ? 'bg-amber-600 text-white font-bold'
                                    : 'bg-[#0E1016] text-zinc-300 border border-white/10'
                                }`}
                              >
                                {amt.toLocaleString('en-US')} ذهب
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            disabled={player.gold < betStakeInput}
                            onClick={() =>
                              onPlaceTournamentBet(
                                selectedChamp.factionId,
                                selectedChamp.name,
                                selectedChamp.multiplier,
                                betStakeInput
                              )
                            }
                            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-white font-semibold rounded-lg cursor-pointer font-num"
                          >
                            تأكيد التوقع ({betStakeInput.toLocaleString('en-US')} ذهب)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Endless Shadow Tower (100+ Floors) */}
      {subTab === 'tower' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-white/10 min-h-[280px]">
            <ResilientImage
              src={TOWER_SPIRE_IMAGE}
              alt="برج الظلال اللانهائي"
              className="w-full h-full object-cover"
              fallbackTitle="برج الظلال اللانهائي"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/35 to-transparent" />
            <div className="absolute bottom-5 inset-x-5 space-y-1">
              <div className="text-xs text-rose-400 font-num font-semibold">
                أعلى طابق بلغته: {player.towerBestFloor || 1} · انتصارات البرج: {player.stats.towerClears || 0}
              </div>
              <h3 className="font-display text-2xl font-bold text-white">برج الظلال اللانهائي</h3>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#14161F] border border-white/10 rounded-xl p-6 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-amber-400 font-num font-semibold">
                    الطابق الحالي: {player.towerFloor || 1} {towerEnemy.isBoss ? '· زعيم حارس كل 10 طوابق' : ''}
                  </div>
                  <h4 className="font-display text-xl font-bold text-white mt-0.5">{towerEnemy.name}</h4>
                </div>
                <div className="text-xs font-num text-zinc-300">
                  الصحة {towerEnemy.hp.toLocaleString('en-US')} · الهجوم {towerEnemy.attack} · الدفاع {towerEnemy.defense}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-num">
                <div className="p-3 bg-[#0E1016] border border-white/5 rounded-lg">
                  <div className="text-zinc-500">جائزة الذهب</div>
                  <div className="text-amber-400 font-bold mt-0.5">+{towerEnemy.rewardGold.toLocaleString('en-US')}</div>
                </div>
                <div className="p-3 bg-[#0E1016] border border-white/5 rounded-lg">
                  <div className="text-zinc-500">جوهر الصياغة</div>
                  <div className="text-sky-300 font-bold mt-0.5">+{towerEnemy.rewardEssence}</div>
                </div>
                <div className="p-3 bg-[#0E1016] border border-white/5 rounded-lg">
                  <div className="text-zinc-500">أحجار صقل</div>
                  <div className="text-zinc-200 font-bold mt-0.5">+{towerEnemy.rewardStones}</div>
                </div>
                <div className="p-3 bg-[#0E1016] border border-white/5 rounded-lg">
                  <div className="text-zinc-500">بلورات الظل</div>
                  <div className="text-rose-400 font-bold mt-0.5">+{towerEnemy.rewardCrystals}</div>
                </div>
              </div>

              {towerLastResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    towerLastResult.victory
                      ? 'bg-emerald-950/25 border-emerald-500/35'
                      : 'bg-rose-950/25 border-rose-500/35'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className={towerLastResult.victory ? 'text-emerald-300' : 'text-rose-300'}>
                      {towerLastResult.victory ? `تم اجتياز الطابق ${towerLastResult.floor}!` : `توقفت عند الطابق ${towerLastResult.floor}`}
                    </span>
                    <span className="font-num text-amber-300">{towerLastResult.lootText}</span>
                  </div>
                  <div className="space-y-0.5 text-zinc-300 max-h-28 overflow-y-auto">
                    {towerLastResult.rounds.map((r, i) => (
                      <div key={i}>• {r}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={player.energy < 2 || player.hp < 20}
              onClick={onClimbTowerFloor}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>
                {player.hp < 20
                  ? 'عالج صحتك قبل التسلق'
                  : player.energy < 2
                  ? 'يتطلب 2 طاقة'
                  : `اقتحام الطابق ${player.towerFloor || 1} (2 طاقة)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Territory Wars (Synchronized War Hour + Interactive Tactical SVG Map + 6 Districts) */}
      {subTab === 'territory' && (() => {
        const nodeCoords: Record<string, { x: number; y: number; short: string }> = {
          sector_citadel: { x: 280, y: 125, short: 'البرج المركزي' },
          sector_financial: { x: 110, y: 65, short: 'الحي المالي' },
          sector_docks: { x: 455, y: 70, short: 'الميناء التجاري' },
          sector_subway: { x: 115, y: 190, short: 'شبكة الأنفاق' },
          sector_cathedral: { x: 280, y: 225, short: 'المدينة القديمة' },
          sector_industrial: { x: 450, y: 190, short: 'المنطقة الصناعية' },
        };
        const factionHex: Record<FactionId, string> = {
          shadow_hunters: '#f59e0b',
          tech_wardens: '#0ea5e9',
          blood_mages: '#e11d48',
        };
        const selectedDist = TERRITORY_DISTRICTS.find((d) => d.id === selectedSectorId) || TERRITORY_DISTRICTS[0];
        const selectedSector = sectorList.find((s) => s.sectorId === selectedDist.id) || {
          sectorId: selectedDist.id,
          name: selectedDist.name,
          controllingFaction: 'shadow_hunters' as FactionId,
          shadowHuntersScore: 250,
          techWardensScore: 250,
          bloodMagesScore: 250,
          updatedAt: now,
        };
        const selTotal = Math.max(
          1,
          selectedSector.shadowHuntersScore + selectedSector.techWardensScore + selectedSector.bloodMagesScore
        );

        return (
          <div className="space-y-6">
            {/* Synchronized Grand War Hour Strip */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                warHour.isActive
                  ? 'bg-amber-950/30 border-amber-500/50'
                  : 'bg-[#12141C] border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className={`w-5 h-5 shrink-0 ${warHour.isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                <div className="text-xs">
                  <div className="font-bold text-white">
                    {warHour.isActive
                      ? 'ساعة الحرب الكبرى نشطة الآن! (نفوذ x2 · نقاط عشائر x2 · +50% ذهب وجوهر)'
                      : 'ساعة الحرب الكبرى المتزامنة (الاستنفار الشامل)'}
                  </div>
                  <div className="text-zinc-400 mt-0.5">
                    {warHour.isActive
                      ? 'سيطرة مضاعفة في جميع الأحياء، والبرج المركزي يمنح حجر صقل إضافياً!'
                      : 'تُفعّل ساعة الحرب تلقائياً لمدة 10 دقائق كل نصف ساعة على مستوى كل السيرفر.'}
                  </div>
                </div>
              </div>
              <div className="text-xs font-num font-bold text-amber-300 shrink-0">
                {warHour.isActive ? 'تنتهي خلال: ' : 'تبدأ خلال: '}
                {formatWarClock(warHour.msRemaining)}
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-white/10 min-h-[160px] flex items-end">
              <ResilientImage
                src={TERRITORY_MAP_IMAGE}
                alt="خريطة حروب الأقاليم الستة في المدينة"
                className="absolute inset-0 w-full h-full object-cover opacity-55"
                fallbackTitle="خريطة أقاليم المدينة"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/65 to-transparent" />
              <div className="relative w-full p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="text-xs text-amber-400 font-medium inline-flex items-center gap-1.5 mb-1">
                    <MapIcon className="w-4 h-4" />
                    <span>{isOnline ? 'خريطة حروب الأقاليم الحية عبر السيرفر' : 'خريطة صراع الأقاليم الستة'}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white">الخريطة التكتيكية وحروب الأقاليم</h3>
                </div>
                <div className="text-xs font-num text-emerald-300 font-semibold">
                  يسيطر فصيلك ({FACTIONS[player.factionId].name}) على {controlledCount} من أصل 6 أقاليم (+{controlledCount * 5}% عوائد)
                </div>
              </div>
            </div>

            {/* Interactive SVG Tactical City Map + Selected Sector Command Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-7 p-4 bg-[#0E1016] border border-white/10 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-white">انقر على أي حي في الخريطة لاستعراض السيطرة والهجوم</span>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> الظلال
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> التقنية
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> الدم
                    </span>
                  </div>
                </div>

                <svg viewBox="0 0 560 255" className="w-full h-auto bg-[#090B10] rounded-lg border border-white/5">
                  <defs>
                    <pattern id="sfGrid" width="28" height="28" patternUnits="userSpaceOnUse">
                      <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="560" height="255" fill="url(#sfGrid)" />

                  {/* Tactical supply links */}
                  {[
                    ['sector_financial', 'sector_citadel'],
                    ['sector_docks', 'sector_citadel'],
                    ['sector_subway', 'sector_citadel'],
                    ['sector_cathedral', 'sector_citadel'],
                    ['sector_industrial', 'sector_citadel'],
                    ['sector_financial', 'sector_subway'],
                    ['sector_docks', 'sector_industrial'],
                    ['sector_subway', 'sector_cathedral'],
                    ['sector_industrial', 'sector_cathedral'],
                  ].map(([a, b], idx) => {
                    const ca = nodeCoords[a];
                    const cb = nodeCoords[b];
                    const activeEdge = a === selectedSectorId || b === selectedSectorId;
                    return (
                      <line
                        key={idx}
                        x1={ca.x}
                        y1={ca.y}
                        x2={cb.x}
                        y2={cb.y}
                        stroke={activeEdge ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.12)'}
                        strokeWidth={activeEdge ? 2.2 : 1.2}
                        strokeDasharray={activeEdge ? 'none' : '4 4'}
                      />
                    );
                  })}

                  {/* Clickable Sector Nodes */}
                  {TERRITORY_DISTRICTS.map((dist) => {
                    const sector = sectorList.find((s) => s.sectorId === dist.id);
                    const ctrl = sector?.controllingFaction || 'shadow_hunters';
                    const color = factionHex[ctrl];
                    const coord = nodeCoords[dist.id];
                    const isSelected = dist.id === selectedSectorId;
                    const isCenter = dist.id === 'sector_citadel';

                    return (
                      <g
                        key={dist.id}
                        onClick={() => setSelectedSectorId(dist.id)}
                        className="cursor-pointer"
                      >
                        {isSelected && (
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r={isCenter ? 28 : 22}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeOpacity="0.85"
                          />
                        )}
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r={isCenter ? 22 : 16}
                          fill={color}
                          fillOpacity="0.22"
                          stroke={color}
                          strokeWidth="2.5"
                        />
                        <circle cx={coord.x} cy={coord.y} r={isCenter ? 8 : 5.5} fill={color} />
                        <text
                          x={coord.x}
                          y={coord.y + (isCenter ? 40 : 32)}
                          textAnchor="middle"
                          fill="#f4f4f5"
                          fontSize="11"
                          fontWeight="700"
                        >
                          {coord.short}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Selected Sector Command Card */}
              <div className="lg:col-span-5 p-5 bg-[#14161F] border border-amber-500/35 rounded-xl flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-semibold">{selectedDist.bonusLabel}</span>
                    <span className="text-zinc-300">
                      المسيطر الحالي: <strong className="text-white">{FACTIONS[selectedSector.controllingFaction].name}</strong>
                    </span>
                  </div>
                  <h4 className="font-display text-xl font-bold text-white">{selectedDist.name}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{selectedDist.description}</p>

                  <div className="space-y-2 pt-2">
                    <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-zinc-900">
                      <div
                        className="bg-amber-600"
                        style={{ width: `${(selectedSector.shadowHuntersScore / selTotal) * 100}%` }}
                      />
                      <div
                        className="bg-sky-500"
                        style={{ width: `${(selectedSector.techWardensScore / selTotal) * 100}%` }}
                      />
                      <div
                        className="bg-rose-600"
                        style={{ width: `${(selectedSector.bloodMagesScore / selTotal) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-num text-center">
                      <div className="p-2 bg-[#0E1016] rounded border border-white/5 text-amber-300">
                        الظلال: {selectedSector.shadowHuntersScore}
                      </div>
                      <div className="p-2 bg-[#0E1016] rounded border border-white/5 text-sky-300">
                        التقنية: {selectedSector.techWardensScore}
                      </div>
                      <div className="p-2 bg-[#0E1016] rounded border border-white/5 text-rose-300">
                        الدم: {selectedSector.bloodMagesScore}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={player.energy < 2 || player.hp < 15}
                  onClick={() => onAttackTerritorySector(selectedDist.id)}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                >
                  {warHour.isActive
                    ? `شن حملة مضاعفة على ${selectedDist.name.split('(')[0]} (2 طاقة)`
                    : `شن حملة سيطرة لفصيلك (2 طاقة)`}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TERRITORY_DISTRICTS.map((dist) => {
                const sector = sectorList.find((s) => s.sectorId === dist.id) || {
                  sectorId: dist.id,
                  name: dist.name,
                  controllingFaction: 'shadow_hunters' as FactionId,
                  shadowHuntersScore: 250,
                  techWardensScore: 250,
                  bloodMagesScore: 250,
                  updatedAt: now,
                };
                const total = Math.max(
                  1,
                  sector.shadowHuntersScore + sector.techWardensScore + sector.bloodMagesScore
                );
                const controller = FACTIONS[sector.controllingFaction];
                const isMine = sector.controllingFaction === player.factionId;

                return (
                  <div
                    key={dist.id}
                    onClick={() => setSelectedSectorId(dist.id)}
                    className={`rounded-xl overflow-hidden border flex flex-col justify-between cursor-pointer transition-colors ${
                      dist.id === selectedSectorId
                        ? 'bg-[#1A1F2E] border-amber-400/70'
                        : isMine
                        ? 'bg-[#171B28] border-amber-500/40'
                        : 'bg-[#14161F] border-white/10'
                    }`}
                  >
                    <div>
                      <div className="relative h-24 w-full bg-[#0C0E14] overflow-hidden border-b border-white/10">
                        <ResilientImage
                          src={dist.image}
                          alt={dist.name}
                          className="w-full h-full object-cover"
                          fallbackTitle={dist.name}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#14161F] via-[#14161F]/40 to-transparent" />
                        <div className="absolute bottom-2 inset-x-4 flex items-center justify-between text-xs">
                          <span className="text-amber-400 font-semibold">{dist.bonusLabel}</span>
                          <span className="text-zinc-200 font-medium">المسيطر: {controller.name}</span>
                        </div>
                      </div>

                      <div className="p-5 pb-3 space-y-2">
                        <h4 className="font-display text-lg font-bold text-white">{dist.name}</h4>
                        <p className="text-xs text-zinc-400">{dist.description}</p>

                        <div className="space-y-1.5 pt-2">
                          <div className="h-2 w-full rounded-full overflow-hidden flex bg-zinc-900">
                            <div
                              className="bg-amber-600"
                              style={{ width: `${(sector.shadowHuntersScore / total) * 100}%` }}
                            />
                            <div
                              className="bg-sky-500"
                              style={{ width: `${(sector.techWardensScore / total) * 100}%` }}
                            />
                            <div
                              className="bg-rose-600"
                              style={{ width: `${(sector.bloodMagesScore / total) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-num text-zinc-400">
                            <span>ظلال {sector.shadowHuntersScore}</span>
                            <span>تقنية {sector.techWardensScore}</span>
                            <span>دم {sector.bloodMagesScore}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <button
                        type="button"
                        disabled={player.energy < 2 || player.hp < 15}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAttackTerritorySector(dist.id);
                        }}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                      >
                        حملة سيطرة لفصيلك (2 طاقة)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Sub-Tab 5: Co-op Server Boss + Persistent Sector Bosses */}
      {subTab === 'bosses' && (
        <div className="space-y-8">
          {/* Co-op Server-Wide Boss */}
          {isOnline && serverBoss && (
            <div
              className={`relative overflow-hidden p-6 bg-[#12141C] border border-amber-500/40 rounded-xl space-y-5 ${
                bossHitFx?.scope === 'server' ? 'animate-sf-shake' : ''
              }`}
            >
              {bossHitFx?.scope === 'server' && (
                <>
                  <div className="pointer-events-none absolute inset-0 animate-sf-slash bg-gradient-to-l from-transparent via-amber-400/30 to-transparent" />
                  <div
                    key={bossHitFx.key}
                    className="pointer-events-none absolute top-4 end-6 z-20 font-display text-2xl font-bold text-amber-300 animate-sf-float-up"
                  >
                    {bossHitFx.label}
                  </div>
                </>
              )}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="text-xs font-semibold text-amber-400 inline-flex items-center gap-1.5 mb-1">
                    <Globe className="w-4 h-4" />
                    <span>زعيم السيرفر التعاوني · الجولة #{serverBoss.cycle}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white">{serverBoss.bossName}</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    يضربه كل لاعبي السيرفر معاً! عند القضاء عليه، يحصل كل مشارك على غنيمة كبرى وتظهر الجولة التالية.
                    {serverBoss.lastFinisherName ? ` آخر قاضٍ: ${serverBoss.lastFinisherName}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {serverBoss.lastDefeatedCycle > (player.lastClaimedServerBossCycle || 0) && (
                    <button
                      type="button"
                      onClick={onClaimServerBossReward}
                      className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                    >
                      استلام غنيمة إسقاط الزعيم (+2,500 ذهب + 2 بلورة)
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={player.energy < 2 || player.hp < 20}
                    onClick={onStrikeServerBoss}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <Swords className="w-4 h-4" />
                    <span>ضرب زعيم السيرفر (2 طاقة)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-num">
                  <span className="text-amber-300 font-semibold">الصحة المشتركة لزعيم السيرفر</span>
                  <span className="text-zinc-200 font-semibold">
                    {serverBoss.currentHp.toLocaleString('en-US')} / {serverBoss.maxHp.toLocaleString('en-US')} (
                    {Math.max(0, Math.min(100, Math.round((serverBoss.currentHp / serverBoss.maxHp) * 100)))}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{
                      width: `${Math.max(0, Math.min(100, Math.round((serverBoss.currentHp / serverBoss.maxHp) * 100)))}%`,
                    }}
                  />
                </div>
              </div>

              {serverBossDamages.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-zinc-300">أعلى المساهمين في ضرر الزعيم</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {serverBossDamages.slice(0, 6).map((row, idx) => (
                      <div
                        key={row.uid}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                          row.uid === myUid ? 'bg-amber-600/15 border-amber-500/40' : 'bg-[#0E1016] border-white/10'
                        }`}
                      >
                        <span className="text-white font-semibold truncate">
                          #{idx + 1} {row.codename}
                        </span>
                        <span className="font-num text-amber-300 font-bold shrink-0">
                          {row.damage.toLocaleString('en-US')} ضرر
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Individual Sector World Boss */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch ${bossHitFx?.scope === 'sector' ? 'animate-sf-shake' : ''}`}>
            <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-white/10 min-h-[280px]">
              <ResilientImage
                src={boss.image}
                alt={boss.name}
                className="w-full h-full object-cover"
                fallbackTitle={boss.name}
              />
              {bossHitFx?.scope === 'sector' && (
                <>
                  <div className="pointer-events-none absolute inset-0 animate-sf-slash bg-gradient-to-l from-transparent via-rose-400/35 to-transparent" />
                  <div
                    key={bossHitFx.key}
                    className="pointer-events-none absolute top-4 end-5 z-20 font-display text-2xl font-bold text-rose-300 animate-sf-float-up"
                  >
                    {bossHitFx.label}
                  </div>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-transparent" />
              <div className="absolute bottom-4 inset-x-5">
                <div className="text-xs text-rose-400 font-medium mb-0.5">
                  {boss.district} · زعيم القطاع {player.worldBossIndex + 1}
                </div>
                <h3 className="font-display text-2xl font-bold text-white">{boss.name}</h3>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#14161F] border border-white/10 rounded-xl p-6 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-amber-400 font-medium">{boss.title}</div>
                    <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{boss.description}</p>
                  </div>
                  <div className="text-xs font-num text-zinc-400">
                    القوة الموصى بها: <strong className="text-zinc-100">{boss.recommendedPower}</strong>
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-[#0E1016] border border-white/5 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-num">
                    <span className="text-rose-400 font-semibold inline-flex items-center gap-1.5">
                      <Skull className="w-4 h-4" />
                      <span>نقاط صحة الزعيم</span>
                    </span>
                    <span className="text-zinc-200 font-semibold">
                      {player.worldBossCurrentHp.toLocaleString('en-US')} / {boss.maxHp.toLocaleString('en-US')} (
                      {bossHpPct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 transition-all duration-300"
                      style={{ width: `${bossHpPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-num">
                  <div className="p-3 bg-[#0E1016] border border-white/5 rounded-lg">
                    <div className="text-zinc-500">جائزة الهزيمة</div>
                    <div className="text-amber-400 font-bold mt-0.5">{boss.rewardGold.toLocaleString('en-US')} ذهب</div>
                  </div>
                  <div className="p-3 bg-[#0E1016] border border-white/5 rounded-lg">
                    <div className="text-zinc-500">أحجار الصقل</div>
                    <div className="text-sky-300 font-bold mt-0.5">+{boss.rewardForgeStones}</div>
                  </div>
                  <div className="p-3 bg-[#0E1016] border border-white/5 rounded-lg">
                    <div className="text-zinc-500">بلورات الظل</div>
                    <div className="text-rose-400 font-bold mt-0.5">+{boss.rewardCrystals}</div>
                  </div>
                  <div className="p-3 bg-[#0E1016] border border-white/5 rounded-lg">
                    <div className="text-zinc-500">خبرة الزعيم</div>
                    <div className="text-zinc-200 font-bold mt-0.5">+{boss.rewardXp} XP</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-zinc-400 font-num">
                  الزعماء المهزومون: <strong className="text-white">{player.stats.bossesDefeated}</strong> · كل ضربة تمنح ذهباً وخبرة فورية
                </div>
                <button
                  type="button"
                  disabled={player.energy < 2 || player.hp < 20}
                  onClick={onStrikeWorldBoss}
                  className="w-full sm:w-auto px-6 py-3 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  <span>
                    {player.hp < 20
                      ? 'عالج صحتك أولاً'
                      : player.energy < 2
                      ? 'يتطلب 2 طاقة'
                      : 'شن هجوم على الزعيم (2 طاقة)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 6: Online Clans + Live Chat + Real Hall of Shadows Leaderboard */}
      {subTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Online Clan Syndicate & Live Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 p-5 bg-[#14161F] border border-white/10 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h3 className="font-display text-lg font-bold text-white">العشيرة السرية والحرس</h3>
                </div>
                <span className="text-xs font-num text-amber-400 font-semibold">قوة حرسك: +{clanPower}</span>
              </div>

              {isOnline ? (
                myOnlineClan ? (
                  <div className="p-4 bg-[#0E1016] border border-amber-500/35 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-amber-400 font-semibold">عشيرة أونلاين · مستوى {myOnlineClan.clanLevel}</div>
                        <div className="text-base font-bold text-white">{myOnlineClan.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onLeaveOnlineClan(myOnlineClan)}
                        className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-rose-300 rounded-md cursor-pointer"
                      >
                        مغادرة
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-num pt-2 border-t border-white/10">
                      <div>
                        <div className="text-zinc-500">الأعضاء</div>
                        <div className="text-white font-semibold">{myOnlineClan.memberCount}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500">خزنة الذهب</div>
                        <div className="text-amber-400 font-semibold">{myOnlineClan.treasuryGold}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500">قوة العشيرة</div>
                        <div className="text-emerald-400 font-semibold">{myOnlineClan.powerScore}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        disabled={player.gold < 300}
                        onClick={() => onDonateOnlineClan(myOnlineClan, 300, 1)}
                        className="flex-1 py-2 px-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-white font-semibold rounded-lg cursor-pointer"
                      >
                        تبرع (300 ذهب + 1 مهربات)
                      </button>
                      <button
                        type="button"
                        disabled={myOnlineClan.treasuryGold < myOnlineClan.clanLevel * 1000}
                        onClick={() => onUpgradeOnlineClan(myOnlineClan)}
                        className="py-2 px-3 bg-sky-700 hover:bg-sky-600 disabled:bg-zinc-800 text-white font-semibold rounded-lg cursor-pointer font-num"
                      >
                        ترقية ({myOnlineClan.clanLevel * 1000})
                      </button>
                    </div>
                    <div className="pt-2 border-t border-white/10 space-y-1 max-h-28 overflow-y-auto">
                      {myClanMembers.map((m) => (
                        <div key={m.uid} className="flex justify-between text-[11px] text-zinc-300">
                          <span>
                            {m.codename} ({m.role === 'leader' ? 'قائد' : 'عضو'})
                          </span>
                          <span className="font-num text-amber-300">قوة {m.powerScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#0E1016] border border-white/10 rounded-xl space-y-3 text-xs">
                    <div className="font-semibold text-white">تأسيس عشيرة أونلاين أو الانضمام</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={28}
                        value={newOnlineClanName}
                        onChange={(e) => setNewOnlineClanName(e.target.value)}
                        placeholder="اسم العشيرة الجديدة..."
                        className="flex-1 px-3 py-2 bg-[#14161F] border border-white/10 rounded-lg text-white"
                      />
                      <button
                        type="button"
                        disabled={newOnlineClanName.trim().length < 2}
                        onClick={() => {
                          onCreateOnlineClan(newOnlineClanName);
                          setNewOnlineClanName('');
                        }}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-white font-semibold rounded-lg cursor-pointer"
                      >
                        إنشاء
                      </button>
                    </div>
                    {onlineClans.length > 0 && (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pt-2 border-t border-white/10">
                        {onlineClans.map((c) => (
                          <div key={c.id} className="flex items-center justify-between py-1">
                            <div>
                              <span className="text-white font-semibold">{c.name}</span>
                              <span className="text-zinc-500 ms-2 font-num">({c.memberCount} أعضاء)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onJoinOnlineClan(c)}
                              className="px-2.5 py-1 bg-sky-700 hover:bg-sky-600 text-white rounded-md cursor-pointer"
                            >
                              انضمام
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={24}
                    value={clanInput}
                    onChange={(e) => setClanInput(e.target.value)}
                    placeholder="اسم عشيرتك السرية"
                    className="flex-1 px-3 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => onRenameClan(clanInput)}
                    className="px-4 py-2 bg-[#1D2232] hover:bg-[#282E42] text-xs font-semibold text-zinc-100 rounded-lg cursor-pointer"
                  >
                    حفظ الاسم
                  </button>
                </div>
              )}

              {/* Clan Troops */}
              <div className="space-y-2.5 pt-2">
                {(Object.keys(CLAN_UNITS) as ClanUnitId[]).map((uId) => {
                  const u = CLAN_UNITS[uId];
                  const count = player.clanUnits?.[uId] || 0;
                  const canAfford = player.gold >= u.costGold && player.contraband >= u.costContraband;

                  return (
                    <div
                      key={uId}
                      className="p-3 bg-[#0E1016] border border-white/5 rounded-lg flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-md overflow-hidden border border-white/10 bg-[#0B0C10] shrink-0">
                          <ResilientImage
                            src={u.image}
                            alt={u.name}
                            className="w-full h-full object-cover"
                            fallbackTitle={u.name}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white">
                            {u.name} <span className="font-num text-amber-400">({count})</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 font-num">
                            +{u.powerEach} قوة · {u.costGold} ذهب + {u.costContraband} مهربات
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onRecruitClanUnit(uId)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                      >
                        تجنيد
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Clan Chat + Hall of Shadows Leaderboard */}
            <div className="lg:col-span-7 space-y-6">
              {isOnline && myOnlineClan && (
                <div className="p-5 bg-[#14161F] border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                    <h3 className="font-display text-base font-bold text-white">
                      محادثة عشيرة {myOnlineClan.name} المباشرة
                    </h3>
                  </div>

                  <div className="h-44 overflow-y-auto space-y-2 p-3 bg-[#0B0C10] border border-white/5 rounded-lg">
                    {myClanMessages.length === 0 ? (
                      <div className="text-xs text-zinc-500 text-center py-8">
                        لا توجد رسائل بعد — ابدأ المحادثة مع أعضاء عشيرتك!
                      </div>
                    ) : (
                      myClanMessages.map((msg) => (
                        <div key={msg.id} className="text-xs space-y-0.5">
                          <span className="font-semibold text-amber-400">{msg.codename}: </span>
                          <span className="text-zinc-200">{msg.text}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!chatText.trim()) return;
                      onSendClanMessage(myOnlineClan.id, chatText);
                      setChatText('');
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      maxLength={300}
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="اكتب رسالة لأعضاء عشيرتك..."
                      className="flex-1 px-3 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Weekly Co-op Clan Raid Boss */}
              {isOnline && myOnlineClan && clanRaidBoss && (
                <div
                  className={`relative overflow-hidden p-5 bg-[#14161F] border border-amber-500/40 rounded-xl space-y-4 ${
                    bossHitFx?.scope === 'clan' ? 'animate-sf-shake' : ''
                  }`}
                >
                  {bossHitFx?.scope === 'clan' && (
                    <>
                      <div className="pointer-events-none absolute inset-0 animate-sf-slash bg-gradient-to-l from-transparent via-amber-400/30 to-transparent" />
                      <div
                        key={bossHitFx.key}
                        className="pointer-events-none absolute top-3 end-5 z-20 font-display text-xl font-bold text-amber-300 animate-sf-float-up"
                      >
                        {bossHitFx.label}
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4 h-36 rounded-lg overflow-hidden border border-white/10 relative">
                      <ResilientImage
                        src={CLAN_RAID_BOSS_IMAGE}
                        alt={clanRaidBoss.bossName}
                        className="w-full h-full object-cover"
                        fallbackTitle={clanRaidBoss.bossName}
                      />
                    </div>
                    <div className="md:col-span-8 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-amber-400 font-semibold">
                          غزوة عشيرة {myOnlineClan.name} · الجولة #{clanRaidBoss.cycle}
                        </span>
                        {clanRaidBoss.lastFinisherName && (
                          <span className="text-zinc-400">آخر قاضٍ: {clanRaidBoss.lastFinisherName}</span>
                        )}
                      </div>
                      <h3 className="font-display text-lg font-bold text-white">{clanRaidBoss.bossName}</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-num text-zinc-300">
                          <span>صحة عملاق العشيرة</span>
                          <span>
                            {clanRaidBoss.currentHp.toLocaleString('en-US')} /{' '}
                            {clanRaidBoss.maxHp.toLocaleString('en-US')}
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-600 transition-all duration-300"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, Math.round((clanRaidBoss.currentHp / clanRaidBoss.maxHp) * 100))
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          disabled={player.energy < 2 || player.hp < 20}
                          onClick={onStrikeClanBoss}
                          className="px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          ضرب عملاق العشيرة (2 طاقة)
                        </button>
                        {clanRaidBoss.lastDefeatedCycle > (player.lastClaimedClanBossCycle || 0) && (
                          <button
                            type="button"
                            onClick={onClaimClanBossReward}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            استلام غنيمة العشيرة (+2,200 ذهب + 2 بلورات)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {clanRaidDamages.length > 0 && (
                    <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2 text-[11px]">
                      {clanRaidDamages.slice(0, 5).map((row, i) => (
                        <span
                          key={row.uid}
                          className="px-2.5 py-1 bg-[#0E1016] border border-white/10 rounded font-num text-zinc-300"
                        >
                          #{i + 1} {row.codename}: <strong className="text-amber-300">{row.damage}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Global City Chat Channel */}
              {isOnline && (
                <div className="p-5 bg-[#14161F] border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-400" />
                      <h3 className="font-display text-base font-bold text-white">
                        راديو المدينة العام (شات كل اللاعبين)
                      </h3>
                    </div>
                    <span className="text-[11px] text-zinc-400">تحدّى الخصوم وتبادل العروض</span>
                  </div>

                  <div className="h-44 overflow-y-auto space-y-2 p-3 bg-[#0B0C10] border border-white/5 rounded-lg">
                    {globalChatMessages.length === 0 ? (
                      <div className="text-xs text-zinc-500 text-center py-8">
                        لا توجد رسائل في القناة العامة بعد — كن أول من يوجه تحدياً للمدينة!
                      </div>
                    ) : (
                      globalChatMessages.map((msg) => {
                        const frameCosmetic = msg.nameFrame
                          ? COSMETICS_CATALOG.find((c) => c.id === msg.nameFrame)
                          : null;
                        const colorCosmetic = msg.chatColor
                          ? COSMETICS_CATALOG.find((c) => c.id === msg.chatColor)
                          : null;
                        return (
                          <div key={msg.id} className="text-xs space-y-0.5">
                            {msg.titleTag && (
                              <span className="text-amber-300 font-bold me-1">[{msg.titleTag}]</span>
                            )}
                            <span
                              className={`font-semibold me-1 ${
                                frameCosmetic ? frameCosmetic.cssClass : 'text-sky-300'
                              }`}
                            >
                              {msg.codename}:
                            </span>{' '}
                            <span className={colorCosmetic ? colorCosmetic.cssClass : 'text-zinc-200'}>
                              {msg.text}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!globalChatInput.trim()) return;
                      onSendGlobalChat(globalChatInput);
                      setGlobalChatInput('');
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      maxLength={300}
                      value={globalChatInput}
                      onChange={(e) => setGlobalChatInput(e.target.value)}
                      placeholder="أرسل رسالة لكل اللاعبين في المدينة..."
                      className="flex-1 px-3 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Friends Roster Panel */}
              <div className="p-5 bg-[#14161F] border border-sky-500/35 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-sky-400" />
                    <h3 className="font-display text-base font-bold text-white">قائمة الأصدقاء ورفاق السلاح</h3>
                  </div>
                  <span className="text-xs font-num text-sky-300">{(player.friendUids || []).length} أصدقاء</span>
                </div>

                {(player.friendUids || []).length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    أضف أي عميل من جدول الترتيب أدناه لتتمكن من تفقد بطاقته ودعوته لمبارزات 1 ضد 1 أو مرافقته في السطو.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {(player.friendUids || []).map((fUid) => {
                      const friendOp = onlineOperatives.find((o) => o.uid === fUid);
                      if (!friendOp) {
                        return (
                          <div
                            key={fUid}
                            className="p-3 bg-[#0E1016] border border-white/10 rounded-lg flex items-center justify-between"
                          >
                            <span className="text-zinc-400 font-num">عميل ({fUid.slice(0, 6)})</span>
                            <button
                              type="button"
                              onClick={() => onToggleFriend(fUid, 'صديق')}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer"
                            >
                              إزالة
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={fUid}
                          className="p-3 bg-[#0E1016] border border-sky-500/30 rounded-lg flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{friendOp.codename}</div>
                            <div className="text-[11px] font-num text-zinc-400">
                              {FACTIONS[friendOp.factionId].name} · قوة {friendOp.powerScore.toLocaleString('en-US')}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setInspectedOp(friendOp)}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-sky-300 rounded cursor-pointer"
                            >
                              بطاقة
                            </button>
                            {isOnline && (
                              <button
                                type="button"
                                onClick={() => {
                                  onCreateLiveDuel(500, friendOp);
                                  setSubTab('arena');
                                }}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded cursor-pointer"
                              >
                                مبارزة
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onToggleFriend(friendOp.uid, friendOp.codename)}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-rose-300 rounded cursor-pointer"
                            >
                              إزالة
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hall of Shadows Leaderboard with Top-3 Titles & Direct PvP Duel */}
              <div className="p-5 bg-[#14161F] border border-white/10 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="font-display text-lg font-bold text-white">قاعة الظلال · الترتيب العام للمدينة</h3>
                  </div>
                  <span className="text-xs font-num text-zinc-400">
                    انتصارات الحلبة: {player.stats.duelsWon || 0}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-400">
                        <th className="py-2.5 px-2 text-start">المركز</th>
                        <th className="py-2.5 px-2 text-start">العميل / اللقب</th>
                        <th className="py-2.5 px-2 text-start">الفصيل</th>
                        <th className="py-2.5 px-2 text-end">القوة</th>
                        <th className="py-2.5 px-2 text-end">الحلبة</th>
                        <th className="py-2.5 px-2 text-end">مواجهة / مطاردة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {leaderboardEntries.map((row, idx) => {
                        const title = idx < 3 ? TOP_TITLES[idx] : '';
                        const frameDef = row.nameFrame
                          ? COSMETICS_CATALOG.find((c) => c.id === row.nameFrame)
                          : null;
                        const isFriend = Boolean(row.rawOp && (player.friendUids || []).includes(row.rawOp.uid));
                        const isNemesis = Boolean(row.rawOp && player.nemeses?.[row.rawOp.uid]);

                        return (
                          <tr
                            key={`${row.uid}-${idx}`}
                            className={row.isPlayer ? 'bg-amber-600/15 text-white font-semibold' : 'text-zinc-300'}
                          >
                            <td className="py-2.5 px-2 font-num">#{idx + 1}</td>
                            <td className="py-2.5 px-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {title && (
                                  <span className="text-amber-300 font-bold">[{title}]</span>
                                )}
                                <span className={frameDef ? frameDef.cssClass : ''}>{row.codename}</span>
                                {row.seasonMedals > 0 && (
                                  <span className="text-amber-300 font-num inline-flex items-center gap-0.5" title="ميداليات المواسم">
                                    <Award className="w-3 h-3" />
                                    {row.seasonMedals}
                                  </span>
                                )}
                                {row.isPlayer && <span className="text-amber-400">(أنت)</span>}
                                {row.isReal && !row.isPlayer && <span className="text-sky-400">(متصل)</span>}
                                {isFriend && <span className="text-emerald-400 font-semibold">(صديق)</span>}
                                {isNemesis && <span className="text-rose-400 font-bold">(خصم لدود)</span>}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-zinc-400">{FACTIONS[row.factionId].name}</td>
                            <td className="py-2.5 px-2 text-end font-num">{row.powerScore.toLocaleString('en-US')}</td>
                            <td className="py-2.5 px-2 text-end font-num text-amber-400">{row.rating}</td>
                            <td className="py-2.5 px-2 text-end">
                              {row.rawOp && !row.isPlayer ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    title="عرض بطاقة العميل"
                                    onClick={() => setInspectedOp(row.rawOp)}
                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-sky-300 rounded-md inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>بطاقة</span>
                                  </button>
                                  <button
                                    type="button"
                                    title={isFriend ? 'إزالة من الأصدقاء' : 'إضافة صديق'}
                                    onClick={() => onToggleFriend(row.rawOp!.uid, row.rawOp!.codename)}
                                    className={`px-2 py-1 rounded-md inline-flex items-center cursor-pointer ${
                                      isFriend
                                        ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                                    }`}
                                  >
                                    {isFriend ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={player.energy < 2}
                                    onClick={() => {
                                      onChallengeRealPlayer(row.rawOp!);
                                      setSubTab('arena');
                                    }}
                                    className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 text-white rounded-md cursor-pointer"
                                  >
                                    تحدي
                                  </button>
                                  <button
                                    type="button"
                                    disabled={player.gold < 500}
                                    onClick={() =>
                                      onCreateBounty(
                                        row.rawOp!.uid,
                                        row.rawOp!.codename,
                                        row.rawOp!.factionId,
                                        500,
                                        0,
                                        'منافسة قاعة الظلال'
                                      )
                                    }
                                    className="px-2 py-1 bg-amber-700 hover:bg-amber-600 disabled:bg-zinc-800 text-white rounded-md cursor-pointer font-num"
                                  >
                                    مكافأة
                                  </button>
                                </div>
                              ) : (
                                <span className="text-zinc-600 font-num">صعود {row.prestige}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Formal 24-Hour Clan vs. Clan Wars */}
              {isOnline && (
                <div className="p-5 bg-[#14161F] border border-rose-500/35 rounded-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Swords className="w-4 h-4 text-rose-400" />
                      <h3 className="font-display text-base font-bold text-white">حروب العشائر الرسمية (24 ساعة)</h3>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      الفائزون: +2,500 ذهب · +3 بلورات · +6 صقل
                    </span>
                  </div>

                  {myOnlineClan && onlineClans.filter((c) => c.id !== myOnlineClan.id).length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2 text-xs">
                      <select
                        value={warTargetClanId}
                        onChange={(e) => setWarTargetClanId(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-white"
                      >
                        <option value="">اختر عشيرة منافسة لإعلان حرب 24 ساعة...</option>
                        {onlineClans
                          .filter((c) => c.id !== myOnlineClan.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({FACTIONS[c.factionId].name} · قوة {c.powerScore})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        disabled={!warTargetClanId}
                        onClick={() => {
                          const target = onlineClans.find((c) => c.id === warTargetClanId);
                          if (!target) return;
                          onDeclareClanWar(target);
                          setWarTargetClanId('');
                        }}
                        className="px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        إعلان حرب عشيرة
                      </button>
                    </div>
                  )}

                  {clanWars.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-4">
                      لا توجد حروب عشائر معلنة حالياً — بادر بإعلان أول مواجهة رسمية!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {clanWars.slice(0, 6).map((war) => {
                        const isParticipant =
                          Boolean(player.clanId) &&
                          (war.challengerClanId === player.clanId || war.defenderClanId === player.clanId);
                        const warExpired = now >= war.endsAt;
                        const isFinished = war.status === 'finished' || warExpired;
                        const claimed = (player.claimedClanWarIds || []).includes(war.id);
                        const totalWarPts = Math.max(1, war.challengerScore + war.defenderScore);
                        const remainingMs = Math.max(0, war.endsAt - now);

                        return (
                          <div
                            key={war.id}
                            className={`p-3.5 rounded-lg border space-y-2.5 text-xs ${
                              isParticipant ? 'bg-[#0E1016] border-rose-500/40' : 'bg-[#0E1016] border-white/10'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-bold text-white">
                                {war.challengerClanName}{' '}
                                <span className="text-rose-400 mx-1">ضد</span> {war.defenderClanName}
                              </div>
                              <div className="font-num text-amber-300 font-semibold">
                                {isFinished ? 'انتهت الحرب' : `متبقي ${formatWarClock(remainingMs)}`}
                              </div>
                            </div>

                            <div className="h-2 w-full rounded-full overflow-hidden flex bg-zinc-900">
                              <div
                                className="bg-amber-500"
                                style={{ width: `${(war.challengerScore / totalWarPts) * 100}%` }}
                              />
                              <div
                                className="bg-rose-600"
                                style={{ width: `${(war.defenderScore / totalWarPts) * 100}%` }}
                              />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 font-num text-zinc-300">
                              <span>
                                {war.challengerClanName}: <strong className="text-amber-300">{war.challengerScore}</strong>
                              </span>
                              <span>
                                {war.defenderClanName}: <strong className="text-rose-300">{war.defenderScore}</strong>
                              </span>
                            </div>

                            {isParticipant && (
                              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                                {!isFinished ? (
                                  <button
                                    type="button"
                                    disabled={player.energy < 2 || player.hp < 15}
                                    onClick={() => onStrikeClanWar(war)}
                                    className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-md whitespace-nowrap cursor-pointer"
                                  >
                                    {warHour.isActive ? 'ضربة حرب x2 (2 طاقة)' : 'ضربة حرب عشيرة (2 طاقة)'}
                                  </button>
                                ) : claimed ? (
                                  <span className="text-emerald-400 font-semibold">تم استلام غنائم الحرب</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onClaimClanWarReward(war)}
                                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-md whitespace-nowrap cursor-pointer"
                                  >
                                    استلام غنائم الحرب
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Weekly Clan Wars Leaderboard */}
              {onlineClans.length > 0 && (
                <div className="p-5 bg-[#14161F] border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <h3 className="font-display text-base font-bold text-white">ترتيب حرب العشائر الأسبوعية</h3>
                    </div>
                    <span className="text-[11px] text-zinc-400">تزيد نقاط الحرب بالمداهمات وحرب الأقاليم</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-zinc-400">
                          <th className="py-2 px-2 text-start">#</th>
                          <th className="py-2 px-2 text-start">العشيرة</th>
                          <th className="py-2 px-2 text-start">الفصيل</th>
                          <th className="py-2 px-2 text-end">الأعضاء</th>
                          <th className="py-2 px-2 text-end">نقاط الحرب</th>
                          <th className="py-2 px-2 text-end">القوة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[...onlineClans]
                          .sort((a, b) => (b.warPoints || 0) * 10 + b.powerScore - ((a.warPoints || 0) * 10 + a.powerScore))
                          .slice(0, 10)
                          .map((c, idx) => (
                            <tr key={c.id} className={c.id === player.clanId ? 'bg-amber-600/15 text-white' : 'text-zinc-300'}>
                              <td className="py-2 px-2 font-num">#{idx + 1}</td>
                              <td className="py-2 px-2 font-semibold">{c.name} (مستوى {c.clanLevel})</td>
                              <td className="py-2 px-2 text-zinc-400">{FACTIONS[c.factionId].name}</td>
                              <td className="py-2 px-2 text-end font-num">{c.memberCount}</td>
                              <td className="py-2 px-2 text-end font-num text-rose-300 font-bold">{c.warPoints || 0}</td>
                              <td className="py-2 px-2 text-end font-num text-amber-300">{c.powerScore.toLocaleString('en-US')}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Seasonal Hall of Fame + Reigning Season Faction Decree */}
              <div className="p-5 bg-[#14161F] border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="font-display text-base font-bold text-white">مرسوم الموسم وقاعة الأساطير</h3>
                  </div>
                  <span className="text-[11px] font-num text-amber-300 font-semibold">
                    {seasonDecree.hasHistory ? `الموسم #${seasonDecree.seasonNumber}` : 'افتتاح الموسم الأول'}
                  </span>
                </div>

                <div className="p-3.5 bg-[#0E1016] border border-amber-500/25 rounded-lg space-y-1 text-xs">
                  <div className="font-bold text-amber-300">{seasonDecree.title}</div>
                  <div className="text-zinc-200">{seasonDecree.effectLabel}</div>
                  <div className="text-zinc-400">
                    الفصيل الحاكم: {FACTIONS[seasonDecree.reigningFaction].name} · البطل: {seasonDecree.championName}
                  </div>
                </div>

                {seasonHallEntries.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {seasonHallEntries.map((entry) => (
                      <div key={entry.id} className="p-3 bg-[#0E1016] border border-white/10 rounded-lg space-y-1">
                        <div className="flex items-center justify-between font-num text-amber-400 font-semibold">
                          <span>الموسم #{entry.seasonNumber}</span>
                          <span>قوة {entry.championPower.toLocaleString('en-US')}</span>
                        </div>
                        <div className="text-sm font-bold text-white">{entry.championName}</div>
                        <div className="text-zinc-400">
                          {FACTIONS[entry.championFaction].name} · {entry.topClanName}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspected Player Operative Card Modal */}
      {inspectedOp && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectedOp(null)}
        >
          <div className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <OperativeCard
              publicOp={inspectedOp}
              isFriend={Boolean((player.friendUids || []).includes(inspectedOp.uid))}
              isNemesis={Boolean(player.nemeses?.[inspectedOp.uid])}
              onClose={() => setInspectedOp(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
