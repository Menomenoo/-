import React, { useState } from 'react';
import { COSMETICS_CATALOG, FACTIONS, getPrestigeTitle, getXpForNextLevel } from '../data/gameData';
import { PlayerSaveState } from '../types/game';
import { getActiveSubSpec, getClanPowerScore, getEffectiveAttributes, getPlayerPowerScore } from '../utils/combatEngine';
import { OperativeCard } from './OperativeCard';
import { Award, Bell, Cloud, Crown, HeartPulse, Home, IdCard, Volume2, VolumeX } from 'lucide-react';

interface OperativeHudProps {
  player: PlayerSaveState;
  isOnline: boolean;
  isMuted: boolean;
  rankTitle?: string;
  unreadAlertsCount?: number;
  onJumpToAlerts?: () => void;
  onToggleMute: () => void;
  onHeal: () => void;
  onReturnToTitle: () => void;
}

export const OperativeHud: React.FC<OperativeHudProps> = ({
  player,
  isOnline,
  isMuted,
  rankTitle,
  unreadAlertsCount = 0,
  onJumpToAlerts,
  onToggleMute,
  onHeal,
  onReturnToTitle,
}) => {
  const [showCardModal, setShowCardModal] = useState(false);
  const faction = FACTIONS[player.factionId];
  const subSpec = getActiveSubSpec(player);
  const xpNeeded = getXpForNextLevel(player.level);
  const xpPercent = Math.min(100, Math.round((player.xp / xpNeeded) * 100));
  const hpPercent = Math.min(100, Math.round((player.hp / player.maxHp) * 100));
  const energyPercent = Math.min(100, Math.round((player.energy / player.maxEnergy) * 100));
  const effectiveAttrs = getEffectiveAttributes(player);
  const powerScore = getPlayerPowerScore(effectiveAttrs, getClanPowerScore(player));
  const frameDef = player.equippedFrame ? COSMETICS_CATALOG.find((c) => c.id === player.equippedFrame) : null;

  const hpStatusText = hpPercent >= 70 ? 'مستقر' : hpPercent >= 35 ? 'متوسط' : 'حرج';
  const healCost = Math.max(25, Math.round((player.maxHp - player.hp) * 1.4));

  return (
    <section className="bg-[#12141C] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Operative Identity & Prestige */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`text-sm font-semibold ${frameDef ? frameDef.cssClass : 'text-white'}`}>
            {player.codename}
          </div>
          {(player.seasonMedals || 0) > 0 && (
            <>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-xs font-num font-bold text-amber-300 inline-flex items-center gap-1" title="ميداليات المواسم">
                <Award className="w-3.5 h-3.5" />
                <span>{player.seasonMedals}</span>
              </span>
            </>
          )}
          {rankTitle && (
            <>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-xs font-bold text-amber-300 inline-flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>{rankTitle}</span>
              </span>
            </>
          )}
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <div className="text-xs font-medium text-amber-400">
            {faction.name}
            {subSpec ? ` (${subSpec.name})` : ''}
          </div>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <div className="text-xs text-zinc-300 font-num">
            المستوى {player.level} ({player.xp}/{xpNeeded} XP)
          </div>
          {player.prestigeRank > 0 && (
            <>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <div className="text-xs font-semibold text-amber-300">{getPrestigeTitle(player.prestigeRank)}</div>
            </>
          )}
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <div className="text-xs text-zinc-400 font-num">
            القوة: <span className="text-zinc-100 font-semibold">{powerScore.toLocaleString('en-US')}</span>
          </div>
          {player.vipActive && (
            <>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-xs font-semibold text-emerald-400">VIP مفعل</span>
            </>
          )}
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span className={`text-xs inline-flex items-center gap-1 ${isOnline ? 'text-sky-400' : 'text-zinc-500'}`}>
            <Cloud className="w-3.5 h-3.5" />
            <span>{isOnline ? 'متصل سحابياً' : 'حفظ محلي'}</span>
          </span>
          {unreadAlertsCount > 0 && onJumpToAlerts && (
            <>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <button
                type="button"
                onClick={onJumpToAlerts}
                className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-md inline-flex items-center gap-1 cursor-pointer font-num"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>تنبيهات ({unreadAlertsCount})</span>
              </button>
            </>
          )}
        </div>

        {/* Core Resources & Bars */}
        <div className="flex flex-wrap items-center gap-4">
          {/* HP */}
          <div className="flex items-center gap-2 min-w-[155px]">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-400">الصحة · {hpStatusText}</span>
                <span className="font-num text-zinc-200">
                  {player.hp}/{player.maxHp}
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    hpPercent >= 70 ? 'bg-emerald-500' : hpPercent >= 35 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
            {player.hp < player.maxHp && (
              <button
                type="button"
                onClick={onHeal}
                disabled={player.gold < healCost}
                title={`علاج كامل مقابل ${healCost} ذهب`}
                className="px-2.5 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-emerald-300 rounded-md transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span className="font-num">{healCost}</span>
              </button>
            )}
          </div>

          {/* Energy */}
          <div className="min-w-[110px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400">الطاقة</span>
              <span className="font-num text-sky-300">
                {player.energy}/{player.maxEnergy}
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-200"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>

          {/* Currencies */}
          <div className="flex flex-wrap items-center gap-4 text-xs border-s border-white/10 ps-4">
            <div>
              <div className="text-zinc-500">الذهب</div>
              <div className="font-num text-sm font-semibold text-amber-400">
                {player.gold.toLocaleString('en-US')}
              </div>
            </div>
            <div>
              <div className="text-zinc-500">مهربات</div>
              <div className="font-num text-sm font-semibold text-zinc-200">
                {player.contraband.toLocaleString('en-US')}
              </div>
            </div>
            <div>
              <div className="text-zinc-500">صقل / جوهر</div>
              <div className="font-num text-sm font-semibold text-sky-300">
                {player.forgeStones.toLocaleString('en-US')} / {(player.craftingEssence || 0).toLocaleString('en-US')}
              </div>
            </div>
            <div>
              <div className="text-zinc-500">بلورات</div>
              <div className="font-num text-sm font-semibold text-rose-400">
                {player.crystals.toLocaleString('en-US')}
              </div>
            </div>
          </div>

          {/* Utility Controls */}
          <div className="flex items-center gap-1.5 border-s border-white/10 ps-3">
            <button
              type="button"
              onClick={() => setShowCardModal(true)}
              aria-label="بطاقة العميل"
              title="بطاقة العميل"
              className="px-2.5 py-2 text-amber-300 hover:text-white bg-[#181B26] hover:bg-[#202433] border border-amber-500/25 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <IdCard className="w-4 h-4" />
              <span className="hidden sm:inline">بطاقتي</span>
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              className="p-2 text-zinc-400 hover:text-white bg-[#181B26] hover:bg-[#202433] rounded-lg transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onReturnToTitle}
              aria-label="العودة للقائمة الرئيسية"
              title="القائمة الرئيسية"
              className="p-2 text-zinc-400 hover:text-white bg-[#181B26] hover:bg-[#202433] rounded-lg transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showCardModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCardModal(false)}
        >
          <div className="max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
            <OperativeCard player={player} rankTitle={rankTitle} onClose={() => setShowCardModal(false)} />
          </div>
        </div>
      )}

      {/* Subtle XP progress hairline */}
      <div className="h-0.5 w-full bg-zinc-900">
        <div
          className="h-full bg-amber-500/80 transition-all duration-300"
          style={{ width: `${xpPercent}%` }}
        />
      </div>
    </section>
  );
};
