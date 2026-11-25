import React, { useState } from 'react';
import {
  ACHIEVEMENTS,
  DAILY_QUESTS,
  FACTIONS,
  LIVE_EVENTS_META,
  MARKET_COMMODITIES,
  MAX_SEASON_TIERS,
  MISSIONS,
  MISSION_DISTRICTS_IMAGE,
  NIGHT_HUNT_ZONES,
  SEASON_TIER_XP,
  STORY_CASES,
  SeasonDecreeInfo,
  getCurrentSeasonInfo,
  getWarHourStatus,
  getWeekendSurgeStatus,
} from '../data/gameData';
import {
  EventLogEntry,
  MissionDef,
  NightHuntZoneDef,
  PlayerSaveState,
  StoryCaseChoice,
  StoryCaseDef,
} from '../types/game';
import { getEffectiveAttributes } from '../utils/combatEngine';
import { ResilientImage } from './ResilientImage';
import {
  Award,
  Calendar,
  Check,
  Clock,
  Compass,
  Copy,
  Crosshair,
  FastForward,
  Flame,
  Gift,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Swords,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';

interface MissionsViewProps {
  player: PlayerSaveState;
  now: number;
  isOnline: boolean;
  myUid?: string;
  seasonDecree?: SeasonDecreeInfo;
  onStartMission: (mission: MissionDef) => void;
  onInstantFinishMission: () => void;
  onCancelMission: () => void;
  onRefillEnergy: () => void;
  onNightHunt: (zone: NightHuntZoneDef) => void;
  onClaimDailyStreak: () => void;
  onClaimDailyQuest: (questId: string) => void;
  onClaimSeasonTier: (tier: number) => void;
  onClaimSeasonEnd: () => void;
  onRedeemReferral: (code: string) => void;
  onClaimAchievement: (achievementId: string) => void;
  onStrikeInvasion: () => void;
  onRotateLiveEvent: () => void;
  onOpenMysteryBox: () => void;
  onSpinFortuneWheel: (useCrystals?: boolean) => void;
  onStartStoryCase: (storyCase: StoryCaseDef) => void;
  onAdvanceStoryChoice: (choice: StoryCaseChoice) => void;
  onResetStoryCase: () => void;
  onOpenStore: () => void;
}

type MissionsSubTab = 'contracts' | 'night_hunt' | 'story_cases' | 'daily_season' | 'achievements';

export const MissionsView: React.FC<MissionsViewProps> = ({
  player,
  now,
  isOnline,
  myUid,
  seasonDecree,
  onStartMission,
  onInstantFinishMission,
  onCancelMission,
  onRefillEnergy,
  onNightHunt,
  onClaimDailyStreak,
  onClaimDailyQuest,
  onClaimSeasonTier,
  onClaimSeasonEnd,
  onRedeemReferral,
  onClaimAchievement,
  onStrikeInvasion,
  onRotateLiveEvent,
  onOpenMysteryBox,
  onSpinFortuneWheel,
  onStartStoryCase,
  onAdvanceStoryChoice,
  onResetStoryCase,
  onOpenStore,
}) => {
  const [subTab, setSubTab] = useState<MissionsSubTab>('contracts');
  const [referralInput, setReferralInput] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);
  const faction = FACTIONS[player.factionId];
  const powerCoreLevel = player.hqLevels.power_core;
  const durationMultiplier = Math.max(0.4, 1 - (powerCoreLevel - 1) * 0.02) * (player.vipActive ? 0.85 : 1);

  const activeMissionDef = player.activeMission
    ? MISSIONS.find((m) => m.id === player.activeMission?.missionId) || null
    : null;

  const remainingMs = player.activeMission ? Math.max(0, player.activeMission.endsAt - now) : 0;
  const totalMs = player.activeMission ? player.activeMission.durationSec * 1000 : 1;
  const progressPct = player.activeMission
    ? Math.min(100, Math.round(((totalMs - remainingMs) / totalMs) * 100))
    : 0;
  const remainingSec = Math.ceil(remainingMs / 1000);

  const missionLogs: EventLogEntry[] = player.logs
    .filter((l) => l.category === 'mission' || l.category === 'system')
    .slice(0, 7);

  const currentSeasonTier = Math.min(MAX_SEASON_TIERS, Math.floor(player.seasonXp / SEASON_TIER_XP));
  const liveEvent = LIVE_EVENTS_META[player.activeEventId || 'blood_moon'];
  const shockCommodity = MARKET_COMMODITIES.find((c) => c.id === player.eventShockCommodityId);
  const eventElapsedSec = Math.floor((now - (player.eventStartedAt || now)) / 1000);
  const eventCountdownSec = Math.max(0, 180 - (eventElapsedSec % 180));
  const invasionPct = Math.max(0, Math.min(100, Math.round(((player.invasionWaveHp || 0) / (player.invasionWaveMaxHp || 5000)) * 100)));
  const warHour = getWarHourStatus(now);
  const warHourMins = Math.floor(warHour.msRemaining / 60000);
  const warHourSecs = Math.floor((warHour.msRemaining % 60000) / 1000);
  const warHourTimeLabel = `${String(warHourMins).padStart(2, '0')}:${String(warHourSecs).padStart(2, '0')}`;
  const weekendSurge = getWeekendSurgeStatus(now);
  const weekendHrs = Math.floor(weekendSurge.msRemaining / 3600000);
  const weekendMins = Math.floor((weekendSurge.msRemaining % 3600000) / 60000);

  return (
    <div className="space-y-6">
      {/* Synchronized Global Grand War Hour Status */}
      <div
        className={`px-4 py-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          warHour.isActive
            ? 'bg-amber-950/35 border-amber-500/50 text-amber-200'
            : 'bg-[#12141C] border-white/10 text-zinc-300'
        }`}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Swords className={`w-4 h-4 shrink-0 ${warHour.isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
          <span>
            {warHour.isActive
              ? 'ساعة الحرب الكبرى نشطة الآن! x2 نقاط الأقاليم والعشائر +50% ذهب وجوهر في حروب الأقاليم'
              : 'ساعة الحرب الكبرى القادمة: ضاعف نفوذ فصيلك وعشيرتك x2 في خريطة الأقاليم'}
          </span>
        </div>
        <div className="font-num font-bold text-amber-300">
          {warHour.isActive ? `ينتهي خلال ${warHourTimeLabel}` : `يبدأ خلال ${warHourTimeLabel}`}
        </div>
      </div>

      {/* Weekend Grand Surge Banner (Fri & Sat +35% Gold & XP) */}
      <div
        className={`px-4 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          weekendSurge.isActive
            ? 'bg-emerald-950/30 border-emerald-500/45 text-emerald-200'
            : 'bg-[#11131B] border-white/10 text-zinc-300'
        }`}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className={`w-4 h-4 shrink-0 ${weekendSurge.isActive ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span>
            {weekendSurge.isActive
              ? `عطلة القوة الكبرى نشطة الآن! +${weekendSurge.bonusPct}% ذهب وخبرة XP في جميع المهام والمداهمات`
              : `عطلة القوة الكبرى (الجمعة والسبت): +${weekendSurge.bonusPct}% ذهب وخبرة في جميع المهام والمداهمات`}
          </span>
        </div>
        <div className="font-num font-bold text-emerald-300">
          {weekendSurge.isActive
            ? `متبقي ${weekendHrs}س ${weekendMins}د`
            : `تبدأ خلال ${weekendHrs}س ${weekendMins}د`}
        </div>
      </div>

      {/* Live Rotating Event Command Strip */}
      <div className={`p-4 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${liveEvent.accentClass}`}>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <Flame className="w-4 h-4 shrink-0" />
            <span>الحدث الحي النشط: {liveEvent.title}</span>
            <span aria-hidden="true" className="opacity-50">·</span>
            <span className="font-num opacity-90">تدوير الحدث خلال {eventCountdownSec}ث</span>
          </div>
          <p className="text-xs text-zinc-200">
            {liveEvent.effectLabel}
            {player.activeEventId === 'market_shock' && shockCommodity
              ? ` (${shockCommodity.name}: ${player.eventShockMultiplier > 1 ? `صعود ${Math.round(player.eventShockMultiplier * 100)}%` : `هبوط ${Math.round(player.eventShockMultiplier * 100)}%`})`
              : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {player.activeEventId === 'city_invasion' && (
            <div className="flex items-center gap-3">
              <div className="w-32 space-y-1">
                <div className="flex justify-between text-[11px] font-num text-zinc-200">
                  <span>قوة الغزاة</span>
                  <span>{invasionPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 transition-all" style={{ width: `${invasionPct}%` }} />
                </div>
              </div>
              <button
                type="button"
                disabled={player.energy < 2 || player.hp < 15}
                onClick={onStrikeInvasion}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>صد الغزاة (2 طاقة)</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onRotateLiveEvent}
            className="px-3 py-1.5 bg-[#0B0C10]/60 hover:bg-[#0B0C10]/90 border border-white/15 text-xs text-zinc-200 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تغيير الحدث</span>
          </button>
        </div>
      </div>

      {/* Header + Segmented Sub-tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">المهام والصيد الليلي</h2>
          <p className="text-sm text-zinc-400">
            نفّذ العقود الزمنية أو انطلق في صيد ليلي فوري، وأنجز العقود اليومية ومسار الموسم.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#14161F] border border-white/10 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setSubTab('contracts')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'contracts' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>العقود الزمنية</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('night_hunt')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'night_hunt' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 shrink-0" />
            <span>الصيد الليلي</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('story_cases')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'story_cases' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>قضايا التحقيق</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('daily_season')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'daily_season' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>اليومية والموسم</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('achievements')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'achievements' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>الأوسمة</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Timed Contracts */}
      {subTab === 'contracts' && (
        <div className="space-y-6">
          <div className="relative rounded-xl overflow-hidden border border-white/10 min-h-[155px] flex items-end">
            <ResilientImage
              src={MISSION_DISTRICTS_IMAGE}
              alt="قطاعات المدينة الليلية للمهام"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
              fallbackTitle="قطاعات المدينة"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/65 to-transparent" />
            <div className="relative w-full p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-amber-400 font-medium mb-1">
                  شبكة عمليات القطاعات · تسريع المفاعل {Math.round((1 - durationMultiplier) * 100)}%
                </div>
                <div className="text-sm text-zinc-200">
                  تمنحك المهام الذهب، الخبرة، البضائع المهربة، وأحجار الصقل لتطوير أسلحتك.
                </div>
              </div>
              {player.energy < player.maxEnergy && (
                <button
                  type="button"
                  onClick={player.crystals >= 6 ? onRefillEnergy : onOpenStore}
                  className="px-4 py-2 bg-[#181B26]/90 hover:bg-[#222636] border border-sky-500/35 text-xs font-medium text-sky-300 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{player.crystals >= 6 ? 'شحن الطاقة (6 بلورات)' : 'شحن الطاقة (6 بلورات · متجر)'}</span>
                </button>
              )}
            </div>
          </div>

          {player.activeMission && activeMissionDef && (
            <div className="p-6 bg-[#14161F] border border-amber-500/40 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-amber-400 font-medium mb-1">
                    عملية جارية · {activeMissionDef.district}
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">{activeMissionDef.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-num text-lg font-semibold text-amber-300 inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{remainingSec} ثانية</span>
                  </div>
                  <button
                    type="button"
                    onClick={player.crystals >= 3 ? onInstantFinishMission : onOpenStore}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>{player.crystals >= 3 ? 'إنهاء فوري (3 بلورات)' : 'إنهاء فوري (اشحن بلورات)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onCancelMission}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>إلغاء</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-400 font-num">
                  <span>التقدم: {progressPct}%</span>
                  <span>
                    العائد المتوقع: {activeMissionDef.rewardGold[0]}–{activeMissionDef.rewardGold[1]} ذهب
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {MISSIONS.map((mission) => {
                const actualEnergyCost = Math.max(1, mission.energyCost - faction.bonuses.energyCostDiscount);
                const actualDuration = Math.max(5, Math.round(mission.durationSec * durationMultiplier));
                const isLocked = player.level < mission.minLevel && player.prestigeRank === 0;
                const isBusy = Boolean(player.activeMission);
                const notEnoughEnergy = player.energy < actualEnergyCost;
                const lowHealth = player.hp < 15;

                return (
                  <div
                    key={mission.id}
                    className={`p-5 rounded-xl border transition-colors ${
                      isLocked
                        ? 'bg-[#101218] border-white/5 opacity-60'
                        : 'bg-[#14161F] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 flex-1">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-white/10 bg-[#0C0E14] shrink-0">
                          <ResilientImage
                            src={mission.image}
                            alt={mission.title}
                            className="w-full h-full object-cover"
                            fallbackTitle={mission.district}
                          />
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                            <span className="text-amber-400 font-medium">{mission.district}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-num">المدة: {actualDuration}ث</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-num">الطاقة: {actualEnergyCost}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-num">يتطلب مستوى {mission.minLevel}</span>
                          </div>

                          <h3 className="font-display text-lg font-bold text-white">{mission.title}</h3>
                          <p className="text-sm text-zinc-400 leading-relaxed">{mission.description}</p>

                          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-num">
                            <span className="text-amber-400">
                              الذهب: {mission.rewardGold[0]}–{mission.rewardGold[1]}
                            </span>
                            <span className="text-zinc-300">الخبرة: +{mission.rewardXp} XP</span>
                            <span className="text-sky-300">
                              أحجار صقل: {Math.round(mission.forgeStoneChance * 100)}%
                            </span>
                            <span className="text-emerald-300">
                              مهربات: {Math.round(mission.contrabandChance * 100)}%
                            </span>
                            {mission.crystalChance > 0 && (
                              <span className="text-rose-400">
                                بلورات نادرة: {Math.round(mission.crystalChance * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 sm:self-center">
                        <button
                          type="button"
                          disabled={isLocked || isBusy || notEnoughEnergy || lowHealth}
                          onClick={() => onStartMission(mission)}
                          className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>
                            {isLocked
                              ? `مغلق (مستوى ${mission.minLevel})`
                              : lowHealth
                              ? 'الصحة منخفضة'
                              : notEnoughEnergy
                              ? 'طاقة غير كافية'
                              : isBusy
                              ? 'مهمة قيد التنفيذ'
                              : 'ابدأ المهمة'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="bg-[#12141C] border border-white/10 rounded-xl p-5 h-fit space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="font-display text-lg font-bold text-white">سجل العمليات الميدانية</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  إجمالي المهام المكتملة: <span className="font-num text-zinc-200">{player.stats.missionsCompleted}</span>
                </p>
              </div>

              <div className="space-y-3">
                {missionLogs.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">لا توجد عمليات مسجلة بعد.</p>
                ) : (
                  missionLogs.map((log) => (
                    <div key={log.id} className="pb-3 border-b border-white/5 last:border-b-0 last:pb-0">
                      <div className="text-[11px] font-num text-zinc-500 mb-1">
                        {new Date(log.timestamp).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${
                          log.tone === 'positive'
                            ? 'text-emerald-300'
                            : log.tone === 'warning'
                            ? 'text-amber-300'
                            : 'text-zinc-300'
                        }`}
                      >
                        {log.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Instant Night Hunt (Manhunt style) */}
      {subTab === 'night_hunt' && (
        <div className="space-y-6">
          <div className="p-5 bg-[#12141C] border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white">الصيد الليلي السريع (مطاردة المدينة)</h3>
              <p className="text-xs text-zinc-400 mt-1">
                انطلق في مطاردة فورية دون انتظار مؤقت؛ قد تصطاد هدفاً ثميناً أو تعثر على صندوق كنز مخفي!
              </p>
            </div>
            {player.energy < player.maxEnergy && (
              <button
                type="button"
                onClick={player.crystals >= 6 ? onRefillEnergy : onOpenStore}
                className="px-4 py-2 bg-[#181B26] hover:bg-[#222636] border border-sky-500/35 text-xs font-medium text-sky-300 rounded-lg inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{player.crystals >= 6 ? 'شحن الطاقة (6 بلورات)' : 'شحن الطاقة (6 بلورات · متجر)'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {NIGHT_HUNT_ZONES.map((zone) => {
              const locked = player.level < zone.minLevel && player.prestigeRank === 0;
              const canHunt = !locked && player.energy >= zone.energyCost && player.hp >= 15;

              return (
                <div
                  key={zone.id}
                  className="bg-[#14161F] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-28 w-full bg-[#0C0E14] overflow-hidden border-b border-white/10">
                      <ResilientImage
                        src={zone.image}
                        alt={zone.name}
                        className="w-full h-full object-cover"
                        fallbackTitle={zone.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#14161F] via-[#14161F]/35 to-transparent" />
                      <div className="absolute bottom-2 inset-x-4 flex items-center justify-between text-xs font-num">
                        <span className="text-amber-400 font-semibold">طاقة: {zone.energyCost}</span>
                        <span className="text-zinc-200 font-semibold">مستوى {zone.minLevel}+</span>
                      </div>
                    </div>

                    <div className="p-5 pb-3 space-y-2">
                      <h4 className="font-display text-lg font-bold text-white">{zone.name}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{zone.description}</p>
                      <div className="pt-2 border-t border-white/10 text-xs font-num space-y-1">
                        <div className="text-amber-400">
                          الذهب: {zone.goldRange[0]}–{zone.goldRange[1]}
                        </div>
                        <div className="text-zinc-300">الخبرة: +{zone.xpReward} XP</div>
                        <div className="text-sky-300">فرصة كنز وصقل: {Math.round(zone.treasureChance * 100)}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      disabled={!canHunt}
                      onClick={() => onNightHunt(zone)}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Crosshair className="w-4 h-4 shrink-0" />
                      <span>
                        {locked
                          ? `يتطلب مستوى ${zone.minLevel}`
                          : player.hp < 15
                          ? 'عالج صحتك أولاً'
                          : player.energy < zone.energyCost
                          ? 'طاقة غير كافية'
                          : 'انطلاق للصيد الفوري'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 2B: Interactive Branching Story Cases */}
      {subTab === 'story_cases' && (() => {
        const effAttrs = getEffectiveAttributes(player);
        const activeState = player.activeStoryCase || null;
        const activeDef = activeState ? STORY_CASES.find((c) => c.id === activeState.caseId) || null : null;
        const activeNode =
          activeState && activeDef
            ? activeDef.nodes.find((n) => n.id === activeState.currentNodeId) || null
            : null;
        const statLabels: Record<string, string> = {
          attack: 'الهجوم',
          defense: 'الدفاع',
          agility: 'الرشاقة',
          mastery: 'البراعة',
          influence: 'النفوذ',
        };

        return (
          <div className="space-y-6">
            <div className="p-5 bg-[#12141C] border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-amber-400 font-semibold inline-flex items-center gap-1.5 mb-1">
                  <Compass className="w-4 h-4" />
                  <span>ملفات التحقيق والاختيارات المتفرعة</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white">قضايا الظلال التفاعلية (3 مشاهد حاسمة)</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  كل اختيار يختبر إحدى سمات عميلك بنسبة نجاح ظاهرة؛ النجاح يضاعف الغنائم والجوهر، والإخفاق يكشف كميناً!
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-num shrink-0">
                <span className="px-2.5 py-1 bg-[#0E1016] border border-white/10 rounded text-rose-300">هجوم {effAttrs.attack}</span>
                <span className="px-2.5 py-1 bg-[#0E1016] border border-white/10 rounded text-sky-300">دفاع {effAttrs.defense}</span>
                <span className="px-2.5 py-1 bg-[#0E1016] border border-white/10 rounded text-emerald-300">رشاقة {effAttrs.agility}</span>
                <span className="px-2.5 py-1 bg-[#0E1016] border border-white/10 rounded text-amber-300">براعة {effAttrs.mastery}</span>
                <span className="px-2.5 py-1 bg-[#0E1016] border border-white/10 rounded text-violet-300">نفوذ {effAttrs.influence}</span>
              </div>
            </div>

            {activeState && activeDef ? (
              <div className="p-6 bg-[#14161F] border border-amber-500/45 rounded-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="text-xs text-amber-400 font-semibold">
                      {activeDef.district} · المرحلة {Math.min(3, activeState.stepIndex + (activeState.finished ? 0 : 1))} / 3
                    </div>
                    <h4 className="font-display text-xl font-bold text-white">{activeDef.title}</h4>
                  </div>
                  <div className="text-xs font-num text-emerald-300 font-semibold">
                    الغنائم المتراكمة: +{activeState.accumulatedGold} ذهب · +{activeState.accumulatedEssence} جوهر
                  </div>
                </div>

                {activeState.outcomeLog.length > 0 && (
                  <div className="p-3.5 bg-[#0B0C10] border border-white/10 rounded-lg space-y-1.5 text-xs">
                    {activeState.outcomeLog.map((line, idx) => (
                      <div key={idx} className="text-zinc-200">
                        • {line}
                      </div>
                    ))}
                  </div>
                )}

                {activeState.finished ? (
                  <div className="p-5 bg-emerald-950/25 border border-emerald-500/35 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-display text-lg font-bold text-emerald-300">
                        أُغلق ملف القضية بنجاح!
                      </div>
                      <p className="text-xs text-zinc-300 font-num">
                        تمت إضافة المكافآت الكاملة (+{activeState.accumulatedGold} ذهب، +{activeState.accumulatedEssence} جوهر، +{activeDef.baseStones} صقل و+{activeDef.baseXp} XP) إلى رصيدك.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onResetStoryCase}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      العودة لقائمة القضايا
                    </button>
                  </div>
                ) : activeNode ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#0E1016] border border-white/10 rounded-xl space-y-2">
                      <div className="text-sm font-bold text-amber-300">{activeNode.title}</div>
                      <p className="text-sm text-zinc-200 leading-relaxed">{activeNode.narrative}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeNode.choices.map((ch) => {
                        const myStat = effAttrs[ch.stat] || 10;
                        const passChance = Math.min(95, Math.max(25, Math.round(55 + (myStat - ch.difficulty) * 2.2)));
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => onAdvanceStoryChoice(ch)}
                            className="p-4 bg-[#181B26] hover:bg-[#1E2333] border border-white/10 hover:border-amber-500/50 rounded-xl text-start space-y-2 transition-colors cursor-pointer"
                          >
                            <div className="text-sm font-bold text-white">{ch.label}</div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-num">
                              <span className="text-sky-300">
                                السمة: {statLabels[ch.stat]} ({myStat} ضد {ch.difficulty})
                              </span>
                              <span
                                className={
                                  passChance >= 70
                                    ? 'text-emerald-400 font-bold'
                                    : passChance >= 45
                                    ? 'text-amber-300 font-bold'
                                    : 'text-rose-400 font-bold'
                                }
                              >
                                فرصة النجاح: {passChance}%
                              </span>
                            </div>
                            <div className="text-[11px] font-num text-zinc-400">
                              عند النجاح: +{ch.bonusGold} ذهب · +{ch.bonusEssence} جوهر · مخاطرة كمين -{ch.failDamage} HP
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {STORY_CASES.map((sc) => {
                  const locked = player.level < sc.minLevel && player.prestigeRank === 0;
                  const cdUntil = player.storyCaseCooldowns?.[sc.id] || 0;
                  const cdLeftSec = Math.max(0, Math.ceil((cdUntil - now) / 1000));
                  const canStart = !locked && cdLeftSec === 0 && player.energy >= sc.energyCost && player.hp >= 20;

                  return (
                    <div
                      key={sc.id}
                      className="bg-[#14161F] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-28 bg-[#0C0E14] border-b border-white/10 overflow-hidden">
                          <ResilientImage
                            src={sc.image}
                            alt={sc.title}
                            className="w-full h-full object-cover"
                            fallbackTitle={sc.title}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#14161F] via-[#14161F]/40 to-transparent" />
                          <div className="absolute bottom-2 inset-x-4 flex items-center justify-between text-xs font-num">
                            <span className="text-amber-400 font-semibold">{sc.district}</span>
                            <span className="text-zinc-200 font-semibold">مستوى {sc.minLevel}+ · طاقة {sc.energyCost}</span>
                          </div>
                        </div>

                        <div className="p-5 pb-3 space-y-2">
                          <h4 className="font-display text-lg font-bold text-white">{sc.title}</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">{sc.summary}</p>
                          <div className="pt-2 border-t border-white/10 text-xs font-num space-y-1">
                            <div className="text-amber-400">جائزة أساسية: +{sc.baseGold} ذهب (ومكافآت مشاهد)</div>
                            <div className="text-sky-300">+{sc.baseStones} صقل · +{sc.baseXp} XP</div>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pb-5">
                        <button
                          type="button"
                          disabled={!canStart}
                          onClick={() => onStartStoryCase(sc)}
                          className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer font-num"
                        >
                          <Compass className="w-4 h-4 shrink-0" />
                          <span>
                            {locked
                              ? `يتطلب مستوى ${sc.minLevel}`
                              : cdLeftSec > 0
                              ? `إعادة فتح خلال ${cdLeftSec}ث`
                              : player.hp < 20
                              ? 'عالج صحتك أولاً'
                              : player.energy < sc.energyCost
                              ? `يتطلب ${sc.energyCost} طاقة`
                              : `فتح القضية (${sc.energyCost} طاقة)`}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Sub-Tab 3: Daily Streak, 14-Day Season Cycle, Referrals, Daily Quests, and 30-Tier Season Track */}
      {subTab === 'daily_season' && (
        <div className="space-y-8">
          {/* 14-Day Season Cycle Countdown & Friend Referral Row */}
          {(() => {
            const seasonInfo = getCurrentSeasonInfo(now);
            const totalDays = Math.floor(seasonInfo.msRemaining / (24 * 3600 * 1000));
            const totalHours = Math.floor((seasonInfo.msRemaining % (24 * 3600 * 1000)) / (3600 * 1000));
            const totalMins = Math.floor((seasonInfo.msRemaining % (3600 * 1000)) / 60000);
            const seasonMedalClaimed = (player.lastClaimedSeasonNumber || 0) >= seasonInfo.seasonNumber;
            const canClaimSeasonMedal = !seasonMedalClaimed && player.seasonXp >= 500;
            const myRefCode = myUid ? myUid.slice(0, 8).toUpperCase() : '';
            const inviteUrl = myRefCode ? `${window.location.origin}/?ref=${myRefCode}` : '';

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="p-5 bg-[#14161F] border border-amber-500/35 rounded-xl flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-num">
                      <span className="text-amber-400 font-semibold">
                        الموسم التنافسي #{seasonInfo.seasonNumber} (دورة 14 يوماً)
                      </span>
                      <span className="text-zinc-300">
                        ينتهي خلال {totalDays}ي {totalHours}س {totalMins}د
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-white">ميدالية شرف الموسم وتوثيق القاعة</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      اجمع 500 نقطة موسم خلال هذه الدورة لاستلام ميدالية الشرف الموسمية (+3 بلورات + 1,500 ذهب) وتسجيل اسمك في قاعة أساطير المواسم.
                      ميدالياتك الحالية: <strong className="text-amber-300 font-num">{player.seasonMedals || 0}</strong>
                    </p>
                    {seasonDecree && (
                      <div className="p-2.5 bg-[#0E1016] border border-white/10 rounded-lg text-[11px] space-y-0.5">
                        <div className="font-semibold text-amber-300">{seasonDecree.title}</div>
                        <div className="text-zinc-300">{seasonDecree.effectLabel}</div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!canClaimSeasonMedal}
                    onClick={onClaimSeasonEnd}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                  >
                    {seasonMedalClaimed
                      ? `تم استلام ميدالية الموسم #${seasonInfo.seasonNumber}`
                      : player.seasonXp < 500
                      ? `اجمع 500 نقطة موسم للفتح (${player.seasonXp}/500)`
                      : `استلام ميدالية الموسم #${seasonInfo.seasonNumber} (+3 بلورات)`}
                  </button>
                </div>

                <div className="p-5 bg-[#14161F] border border-sky-500/35 rounded-xl flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sky-400 font-semibold inline-flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4" />
                        <span>نظام دعوة الأصدقاء</span>
                      </span>
                      {myRefCode && (
                        <span className="font-num text-amber-300 font-bold">كودك: {myRefCode}</span>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-bold text-white">ادعُ رفاقك واربح بلورات</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      شارك رابطك مع صديق: يحصل صديقك على +15 بلورة و2,500 ذهب فور تفعيل الكود، ويصلك +10 بلورات و1,500 ذهب في تنبيهاتك!
                    </p>
                  </div>

                  {!isOnline ? (
                    <div className="text-xs text-amber-300 bg-[#0E1016] border border-white/10 rounded-lg p-3">
                      سجّل الدخول بحساب Google لتفعيل كود الدعوة وربح مكافآت الإحالة.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={inviteUrl}
                          className="flex-1 px-3 py-1.5 bg-[#0B0C10] border border-white/10 rounded-lg text-[11px] font-num text-zinc-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(inviteUrl);
                            setCopiedRef(true);
                            setTimeout(() => setCopiedRef(false), 2000);
                          }}
                          className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedRef ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                        </button>
                      </div>

                      {player.referralClaimed ? (
                        <div className="text-xs text-emerald-400 font-semibold">
                          ✓ تم تفعيل دعوة صديق على حسابك بنجاح
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={16}
                            value={referralInput}
                            onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                            placeholder="أدخل كود دعوة صديق (8 حروف)..."
                            className="flex-1 px-3 py-1.5 bg-[#0B0C10] border border-white/10 rounded-lg text-xs font-num text-white"
                          />
                          <button
                            type="button"
                            disabled={referralInput.trim().length < 4}
                            onClick={() => {
                              onRedeemReferral(referralInput.trim());
                              setReferralInput('');
                            }}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
                          >
                            تفعيل (+15 بلورة)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="p-6 bg-[#14161F] border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                <Calendar className="w-4 h-4" />
                <span>سلسلة الحضور اليومي · اليوم {player.loginStreak}</span>
              </div>
              <h3 className="font-display text-xl font-bold text-white">مكافأة الولاء الليلي</h3>
              <p className="text-xs text-zinc-400">
                كل يوم دخول متتالي يرفع قيمة الذهب وأحجار الصقل وبلورات الظل الممنوحة لك.
              </p>
            </div>
            <button
              type="button"
              disabled={player.dailyStreakClaimed}
              onClick={onClaimDailyStreak}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-400 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {player.dailyStreakClaimed
                ? 'تم استلام مكافأة اليوم'
                : `استلام (+${300 + player.loginStreak * 150} ذهب + ${2 + Math.min(5, player.loginStreak)} أحجار)`}
            </button>
          </div>

          {/* Mystery Box & Daily Fortune Wheel */}
          {(() => {
            const boxCooldownMs = Math.max(0, 4 * 3600 * 1000 - (now - (player.lastMysteryBoxAt || 0)));
            const boxWins = player.mysteryBoxWins || 0;
            const canOpenBox = boxCooldownMs === 0 || boxWins >= 5;
            const minsLeft = Math.ceil(boxCooldownMs / 60000);
            const hrsLeft = Math.floor(minsLeft / 60);
            const remMins = minsLeft % 60;
            const freeSpinReady = player.lastWheelDate !== player.dailyDateKey;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 bg-[#14161F] border border-amber-500/30 rounded-xl flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-semibold inline-flex items-center gap-1.5">
                        <Gift className="w-4 h-4" />
                        <span>صندوق الغموض الليلي</span>
                      </span>
                      <span className="font-num text-zinc-400">انتصارات الفتح السريع: {Math.min(5, boxWins)} / 5</span>
                    </div>
                    <h4 className="font-display text-lg font-bold text-white">صندوق الإمداد الغامض (كل 4 ساعات)</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      يفتح مجاناً كل 4 ساعات أو فور تحصيل 5 انتصارات في المعارك والمهام. يمنح ذهباً، صقلاً، جوهراً، وفرصة نادرة لحجر روني أو بلورات ظل!
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canOpenBox}
                    onClick={onOpenMysteryBox}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                  >
                    {canOpenBox
                      ? 'افتح صندوق الغموض الآن مجاناً'
                      : `متاح خلال ${hrsLeft}س ${remMins}د (أو أكمل 5 انتصارات)`}
                  </button>
                </div>

                <div className="p-5 bg-[#14161F] border border-sky-500/30 rounded-xl flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sky-400 font-semibold inline-flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>عجلة الحظ اليومية</span>
                      </span>
                      <span className="font-num text-zinc-400">لفات اليوم: {player.wheelSpinsToday || 0}</span>
                    </div>
                    <h4 className="font-display text-lg font-bold text-white">عجلة القدر الليلية</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      جوائز العجلة: ذهب وفير (حتى 2,400) · أحجار صقل · جوهر صياغة · شحن طاقة كامل · حجر روني نادر · الجائزة الكبرى (+5 بلورات ظل).
                    </p>
                  </div>
                  {freeSpinReady ? (
                    <button
                      type="button"
                      onClick={() => onSpinFortuneWheel(false)}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      تدوير العجلة الآن (لفة اليوم المجانية)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={player.crystals >= 4 ? () => onSpinFortuneWheel(true) : onOpenStore}
                      className="w-full py-2.5 bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                    >
                      {player.crystals >= 4 ? 'لفة إضافية الآن (4 بلورات)' : 'لفة إضافية (تتطلب 4 بلورات · المتجر)'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold text-white">العقود اليومية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DAILY_QUESTS.map((q) => {
                const currentVal = player.dailyProgress[q.metric] || 0;
                const completed = currentVal >= q.target;
                const claimed = player.claimedDailyQuests.includes(q.id);
                const pct = Math.min(100, Math.round((currentVal / q.target) * 100));

                return (
                  <div
                    key={q.id}
                    className="p-5 bg-[#14161F] border border-white/10 rounded-xl flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-num">
                        <span className="text-amber-400">+{q.rewardSeasonXp} نقطة موسم</span>
                        <span className="text-zinc-300">
                          {Math.min(currentVal, q.target)} / {q.target}
                        </span>
                      </div>
                      <h4 className="font-display text-lg font-bold text-white">{q.title}</h4>
                      <p className="text-xs text-zinc-400">{q.description}</p>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                      <span className="text-xs font-num text-zinc-300">
                        {q.rewardGold} ذهب · {q.rewardForgeStones} صقل
                        {q.rewardCrystals > 0 ? ` · ${q.rewardCrystals} بلورة` : ''}
                      </span>
                      <button
                        type="button"
                        disabled={!completed || claimed}
                        onClick={() => onClaimDailyQuest(q.id)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {claimed ? 'مكتمل' : completed ? 'استلام الجائزة' : 'قيد التقدم'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#14161F] border border-amber-500/30 rounded-xl">
              <div>
                <h3 className="font-display text-xl font-bold text-white">موسم ليالي الخسوف (مسار مجاني + مسار ذهبي VIP)</h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-num">
                  المرحلة الحالية: {currentSeasonTier} / {MAX_SEASON_TIERS} · نقاط الموسم: {player.seasonXp}
                </p>
              </div>
              {player.vipActive ? (
                <div className="text-xs text-emerald-400 font-semibold">
                  المسار الذهبي VIP مفعّل · جوائز مضاعفة + بلورات وجوهر!
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenStore}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  افتح المسار الذهبي VIP (بلورات وجوائز x2)
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {Array.from({ length: MAX_SEASON_TIERS }, (_, idx) => idx + 1).map((tier) => {
                const unlocked = currentSeasonTier >= tier;
                const claimed = player.claimedSeasonTiers.includes(tier);
                const freeGold = tier * 350;
                const freeStones = tier % 3 === 0 ? 4 : 2;
                const freeCrystal = tier % 10 === 0 ? 1 : 0;
                const vipCrystals = tier % 5 === 0 ? 5 : 2;

                return (
                  <div
                    key={tier}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                      claimed
                        ? 'bg-[#11131A] border-emerald-500/30'
                        : unlocked
                        ? 'bg-[#191D2B] border-amber-500/50'
                        : 'bg-[#101218] border-white/5 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-num font-bold text-zinc-300">المرحلة {tier}</div>
                      <div className="text-[11px] font-num text-amber-400">
                        مجاني: +{freeGold} ذهب · +{freeStones} صقل{freeCrystal > 0 ? ` · +1 بلورة` : ''}
                      </div>
                      <div
                        className={`text-[11px] font-num ${
                          player.vipActive ? 'text-rose-300 font-semibold' : 'text-zinc-500'
                        }`}
                      >
                        VIP ذهبي: +{vipCrystals} بلورات · x2 ذهب
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!unlocked || claimed}
                      onClick={() => onClaimSeasonTier(tier)}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-[11px] font-semibold rounded-md cursor-pointer"
                    >
                      {claimed ? 'مستلم' : unlocked ? 'استلام' : `${tier * SEASON_TIER_XP} XP`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Multi-Tier Achievements */}
      {subTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ACHIEVEMENTS.map((ach) => {
            const claimedCount = player.claimedAchievements[ach.id] || 0;
            const currentStat =
              ach.metric === 'prestigeRank' ? player.prestigeRank : player.stats[ach.metric];
            const isMaxed = claimedCount >= ach.tiers.length;
            const target = isMaxed ? ach.tiers[ach.tiers.length - 1] : ach.tiers[claimedCount];
            const reward = isMaxed ? 0 : ach.crystalRewards[claimedCount];
            const canClaim = !isMaxed && currentStat >= target;
            const pct = Math.min(100, Math.round((currentStat / target) * 100));

            return (
              <div
                key={ach.id}
                className="p-5 bg-[#14161F] border border-white/10 rounded-xl flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-num">
                    <span className="text-amber-400 inline-flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>
                        الرتبة {claimedCount} / {ach.tiers.length}
                      </span>
                    </span>
                    <span className="text-zinc-300">
                      {currentStat.toLocaleString('en-US')} / {target.toLocaleString('en-US')}
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-bold text-white">{ach.title}</h4>
                  <p className="text-xs text-zinc-400">{ach.description}</p>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  {isMaxed ? (
                    <span className="text-xs text-emerald-400 font-semibold inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>مكتمل بالكامل</span>
                    </span>
                  ) : (
                    <>
                      <span className="text-xs font-num text-rose-400 font-semibold">
                        الجائزة: +{reward} بلورة ظل
                      </span>
                      <button
                        type="button"
                        disabled={!canClaim}
                        onClick={() => onClaimAchievement(ach.id)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        {canClaim ? 'استلام الوسام' : 'مستمر'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
