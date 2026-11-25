import React from 'react';
import {
  COMPANIONS,
  COSMETICS_CATALOG,
  EQUIPMENT_CATALOG,
  FACTIONS,
  getPrestigeTitle,
} from '../data/gameData';
import { CompanionId, PlayerSaveState, PublicOperativeDoc } from '../types/game';
import { getClanPowerScore, getEffectiveAttributes, getPlayerPowerScore } from '../utils/combatEngine';
import { ResilientImage } from './ResilientImage';
import { Award, Shield, Sparkles, Swords, X } from 'lucide-react';

interface OperativeCardProps {
  player?: PlayerSaveState;
  publicOp?: PublicOperativeDoc;
  rankTitle?: string;
  isFriend?: boolean;
  isNemesis?: boolean;
  onClose?: () => void;
}

export const OperativeCard: React.FC<OperativeCardProps> = ({
  player,
  publicOp,
  rankTitle,
  isFriend,
  isNemesis,
  onClose,
}) => {
  const factionId = player ? player.factionId : publicOp?.factionId || 'shadow_hunters';
  const faction = FACTIONS[factionId];
  const codename = player ? player.codename : publicOp?.codename || 'عميل الظل';
  const level = player ? player.level : publicOp?.level || 1;
  const prestigeRank = player ? player.prestigeRank : publicOp?.prestigeRank || 0;
  const seasonMedals = player ? player.seasonMedals || 0 : publicOp?.seasonMedals || 0;
  const nameFrame = player ? player.equippedFrame : publicOp?.nameFrame;
  const frameDef = nameFrame ? COSMETICS_CATALOG.find((c) => c.id === nameFrame) : null;

  const effAttrs = player
    ? getEffectiveAttributes(player)
    : {
        attack: publicOp?.attackStat ?? Math.round((publicOp?.powerScore || 120) * 0.16),
        defense: publicOp?.defenseStat ?? Math.round((publicOp?.powerScore || 120) * 0.15),
        agility: publicOp?.agilityStat ?? Math.round((publicOp?.powerScore || 120) * 0.14),
        mastery: publicOp?.masteryStat ?? Math.round((publicOp?.powerScore || 120) * 0.13),
        influence: publicOp?.influenceStat ?? Math.round((publicOp?.powerScore || 120) * 0.12),
      };

  const powerScore = player
    ? getPlayerPowerScore(effAttrs, getClanPowerScore(player))
    : publicOp?.powerScore || 0;

  const arenaRating = player ? player.arenaRating : publicOp?.arenaRating || 0;
  const clanName = player ? player.clanName : publicOp?.clanName || '';

  const findItem = (id?: string | null) => {
    if (!id) return null;
    return (
      EQUIPMENT_CATALOG.find((item) => item.id === id) ||
      player?.craftedItems?.find((item) => item.id === id) ||
      null
    );
  };

  const weapon = findItem(player ? player.equipped.weapon : publicOp?.equippedWeaponId);
  const armor = findItem(player ? player.equipped.armor : publicOp?.equippedArmorId);
  const relic = findItem(player ? player.equipped.relic : publicOp?.equippedRelicId);

  const companionId = (player ? player.activeCompanion : publicOp?.activeCompanionId) as
    | CompanionId
    | undefined
    | null;
  const companion = companionId && COMPANIONS[companionId] ? COMPANIONS[companionId] : null;

  const borderGlow =
    frameDef?.id === 'frame_royal_gold'
      ? 'border-amber-400/70 shadow-amber-500/10'
      : frameDef?.id === 'frame_obsidian_crown'
      ? 'border-sky-400/70 shadow-sky-500/10'
      : frameDef?.id === 'frame_ember'
      ? 'border-rose-500/70 shadow-rose-500/10'
      : 'border-white/15';

  return (
    <div className={`bg-[#11131C] border ${borderGlow} rounded-2xl overflow-hidden shadow-2xl`}>
      {/* Header Banner */}
      <div className="relative h-32 bg-[#0A0B10] border-b border-white/10 overflow-hidden">
        <ResilientImage
          src={faction.portrait}
          alt={faction.name}
          className="w-full h-full object-cover opacity-55"
          fallbackTitle={faction.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#11131C] via-[#11131C]/50 to-transparent" />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق بطاقة العميل"
            className="absolute top-3 end-3 p-1.5 bg-[#0B0C10]/80 hover:bg-[#1C2030] border border-white/15 rounded-lg text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="absolute bottom-3 inset-x-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] mb-1">
              <span className="text-amber-400 font-semibold">{faction.name}</span>
              {rankTitle && (
                <>
                  <span aria-hidden="true" className="text-zinc-500">·</span>
                  <span className="text-amber-300 font-bold">{rankTitle}</span>
                </>
              )}
              {isFriend && (
                <>
                  <span aria-hidden="true" className="text-zinc-500">·</span>
                  <span className="text-sky-300 font-semibold">صديق</span>
                </>
              )}
              {isNemesis && (
                <>
                  <span aria-hidden="true" className="text-zinc-500">·</span>
                  <span className="text-rose-400 font-bold">خصم لدود</span>
                </>
              )}
            </div>
            <h3 className={`font-display text-xl font-bold truncate ${frameDef ? frameDef.cssClass : 'text-white'}`}>
              {codename}
            </h3>
          </div>

          <div className="text-end shrink-0">
            <div className="text-[11px] text-zinc-400">القوة القتالية</div>
            <div className="font-num text-lg font-bold text-amber-400">
              {powerScore.toLocaleString('en-US')}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Identity Meta Strip */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 font-num border-b border-white/10 pb-3">
          <span>المستوى {level}</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span className="text-amber-300">{getPrestigeTitle(prestigeRank)}</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>تصنيف الحلبة: {arenaRating}</span>
          {seasonMedals > 0 && (
            <>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Award className="w-3.5 h-3.5" />
                <span>{seasonMedals} ميداليات</span>
              </span>
            </>
          )}
          {clanName && (
            <>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-sky-300">{clanName}</span>
            </>
          )}
        </div>

        {/* 5 Core Attributes */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { label: 'الهجوم', val: effAttrs.attack, color: 'text-rose-400' },
            { label: 'الدفاع', val: effAttrs.defense, color: 'text-sky-400' },
            { label: 'الرشاقة', val: effAttrs.agility, color: 'text-emerald-400' },
            { label: 'البراعة', val: effAttrs.mastery, color: 'text-amber-400' },
            { label: 'النفوذ', val: effAttrs.influence, color: 'text-violet-400' },
          ].map((stat) => (
            <div key={stat.label} className="p-2.5 bg-[#0C0E14] border border-white/5 rounded-lg">
              <div className="text-[11px] text-zinc-400 mb-0.5">{stat.label}</div>
              <div className={`font-num font-bold ${stat.color}`}>{stat.val}</div>
            </div>
          ))}
        </div>

        {/* Equipped Loadout (Weapon / Armor / Relic / Companion) */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-300 inline-flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>العتاد التكتيكي والمرافق النشط</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {[
              { label: 'السلاح', item: weapon, icon: Swords },
              { label: 'الدرع', item: armor, icon: Shield },
              { label: 'الأثر', item: relic, icon: Sparkles },
            ].map((slot) => {
              const enh = slot.item && player ? player.equipmentEnhance[slot.item.id] || 0 : 0;
              return (
                <div
                  key={slot.label}
                  className="p-2.5 bg-[#0C0E14] border border-white/10 rounded-lg flex items-center gap-2.5 min-w-0"
                >
                  {slot.item ? (
                    <div className="w-9 h-9 rounded-md overflow-hidden border border-white/10 shrink-0">
                      <ResilientImage
                        src={slot.item.image}
                        alt={slot.item.name}
                        className="w-full h-full object-cover"
                        fallbackTitle={slot.label}
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 shrink-0">
                      <slot.icon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[10px] text-zinc-500">{slot.label}</div>
                    <div className="text-[11px] font-semibold text-zinc-200 truncate">
                      {slot.item ? `${slot.item.name}${enh > 0 ? ` +${enh}` : ''}` : 'غير مجهز'}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="p-2.5 bg-[#0C0E14] border border-white/10 rounded-lg flex items-center gap-2.5 min-w-0">
              {companion ? (
                <div className="w-9 h-9 rounded-md overflow-hidden border border-amber-500/30 shrink-0">
                  <ResilientImage
                    src={companion.image}
                    alt={companion.name}
                    className="w-full h-full object-cover"
                    fallbackTitle={companion.name}
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-md bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-500">المرافق</div>
                <div className="text-[11px] font-semibold text-amber-300 truncate">
                  {companion ? companion.name : 'بدون مرافق'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
