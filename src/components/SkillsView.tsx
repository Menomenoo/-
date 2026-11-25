import React, { useState } from 'react';
import {
  ATTRIBUTE_IMAGES,
  COMBAT_SKILLS,
  FACTIONS,
  RESEARCH_TRACKS,
  SUB_SPECS,
  getAttributeUpgradeCost,
  getPrestigeLevelRequirement,
  getPrestigeTitle,
  getResearchUpgradeCost,
} from '../data/gameData';
import { CombatSkillId, PlayerAttributes, PlayerSaveState, ResearchId, SubSpecId } from '../types/game';
import { getEffectiveAttributes } from '../utils/combatEngine';
import { ResilientImage } from './ResilientImage';
import { ArrowUp, Check, Compass, Crown, FlaskConical, Lock, Swords } from 'lucide-react';

interface SkillsViewProps {
  player: PlayerSaveState;
  onTrainAttribute: (key: keyof PlayerAttributes) => void;
  onUnlockPerk: (perkId: string) => void;
  onSelectSubSpec: (subSpecId: SubSpecId) => void;
  onToggleCombatSkill: (skillId: CombatSkillId) => void;
  onUpgradeResearch: (researchId: ResearchId) => void;
  onAscendPrestige: () => void;
  onOpenStore: () => void;
}

type SkillsSubTab = 'attributes' | 'research' | 'prestige';

const ATTRIBUTE_META: Array<{
  key: keyof PlayerAttributes;
  label: string;
  description: string;
  impact: string;
}> = [
  {
    key: 'attack',
    label: 'القوة الهجومية',
    description: 'تزيد الضرر المباشر في مداهمات المخازن والاشتباكات.',
    impact: '+2.2 قوة قتالية لكل نقطة',
  },
  {
    key: 'defense',
    label: 'الدفاع والتحصين',
    description: 'تقلل الضرر المتلقى أثناء الهجوم وتدعم دفاعات مقرك.',
    impact: '+1.8 قوة دفاعية لكل نقطة',
  },
  {
    key: 'agility',
    label: 'الرشاقة والظل',
    description: 'ترفع احتمالية التفادي والضربات الحاسمة وتفادي الفخاخ.',
    impact: 'فرصة حاسمة وتفادي أعلى',
  },
  {
    key: 'mastery',
    label: 'البراعة السحرية والتقنية',
    description: 'تعزز المهارات الخاصة وكفاءة استخراج الغنائم النادرة.',
    impact: '+ضرر إضافي واستخراج موارد',
  },
  {
    key: 'influence',
    label: 'النفوذ والاقتصاد',
    description: 'يرفع نسبة نهب الذهب ويحسّن هوامش الربح في السوق السوداء.',
    impact: '+1% غنائم ذهب لكل نقطة',
  },
];

export const SkillsView: React.FC<SkillsViewProps> = ({
  player,
  onTrainAttribute,
  onUnlockPerk,
  onSelectSubSpec,
  onToggleCombatSkill,
  onUpgradeResearch,
  onAscendPrestige,
  onOpenStore,
}) => {
  const [subTab, setSubTab] = useState<SkillsSubTab>('attributes');
  const faction = FACTIONS[player.factionId];
  const factionSubSpecs = SUB_SPECS.filter((s) => s.factionId === player.factionId);
  const subSpecUnlocked = player.level >= 3 || player.prestigeRank > 0;
  const effective = getEffectiveAttributes(player);
  const prestigeReqLevel = getPrestigeLevelRequirement(player.prestigeRank);
  const canAscend = player.level >= prestigeReqLevel;
  const equippedSkills = player.equippedCombatSkills || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">المهارات، التخصص والأبحاث الأبدية</h2>
          <p className="text-sm text-zinc-400">
            درّب قدرات عميلك، جهّز 3 مهارات قتالية نشطة، واختر تخصصك الفرعي واستثمر في الأبحاث الأبدية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#14161F] border border-white/10 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setSubTab('attributes')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'attributes' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Swords className="w-3.5 h-3.5 shrink-0" />
            <span>القدرات والمهارات</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('research')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'research' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 shrink-0" />
            <span>مختبر الأبحاث</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('prestige')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'prestige' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span>الصعود والهيبة</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Core Attributes, Active Combat Skill Loadout, Sub-Specs & Faction Perks */}
      {subTab === 'attributes' && (
        <div className="space-y-10">
          {/* Active Combat Skill Loadout (3 Slots) */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-rose-400" />
                  <h3 className="font-display text-xl font-bold text-white">
                    مجموعة المهارات القتالية النشطة (3 خانات)
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  اختر حتى 3 مهارات تكتيكية تدخل بها المداهمات والحلبة والبرج لتغيير أسلوب قتالك مجاناً في أي وقت.
                </p>
              </div>
              <span className="font-num text-xs font-bold text-amber-400">
                المجهّز حالياً: {equippedSkills.length} / 3
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMBAT_SKILLS.map((skill) => {
                const isEquipped = equippedSkills.includes(skill.id);
                const slotsFull = !isEquipped && equippedSkills.length >= 3;

                return (
                  <div
                    key={skill.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                      isEquipped ? 'bg-[#191D2A] border-rose-500/60' : 'bg-[#12141C] border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-[#0C0E14] shrink-0">
                        <ResilientImage
                          src={skill.image}
                          alt={skill.name}
                          className="w-full h-full object-cover"
                          fallbackTitle={skill.name}
                        />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-amber-400 font-semibold truncate">{skill.tagline}</span>
                          {isEquipped && (
                            <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 shrink-0">
                              <Check className="w-3.5 h-3.5" />
                              <span>مجهّزة</span>
                            </span>
                          )}
                        </div>
                        <h4 className="font-display text-base font-bold text-white">{skill.name}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">{skill.description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={slotsFull}
                      onClick={() => onToggleCombatSkill(skill.id)}
                      className={`w-full py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isEquipped
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-rose-300'
                          : 'bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white'
                      }`}
                    >
                      {isEquipped
                        ? 'إزالة من التشكيلة'
                        : slotsFull
                        ? 'الـ 3 خانات ممتلئة'
                        : 'تفعيل في التشكيلة'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Faction Sub-Specializations */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-400" />
                  <h3 className="font-display text-xl font-bold text-white">
                    التخصص الفرعي لفصيل {faction.name}
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  يُفتح عند المستوى 3 (تبديل المسار مجاني أول مرة أو مقابل 500 ذهب لاحقاً).
                </p>
              </div>
              {!subSpecUnlocked && (
                <span className="text-xs font-num text-amber-400">يتطلب المستوى 3</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {factionSubSpecs.map((spec) => {
                const isSelected = player.subSpecId === spec.id;
                const switchCost = player.subSpecId && !isSelected ? 500 : 0;
                const canSelect = subSpecUnlocked && !isSelected && player.gold >= switchCost;

                return (
                  <div
                    key={spec.id}
                    className={`p-5 rounded-xl border flex flex-col justify-between gap-4 ${
                      isSelected
                        ? 'bg-[#191D2A] border-amber-500'
                        : 'bg-[#12141C] border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-[#0C0E14] shrink-0">
                        <ResilientImage
                          src={spec.image}
                          alt={spec.name}
                          className="w-full h-full object-cover"
                          fallbackTitle={spec.name}
                        />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-amber-400 font-medium">{spec.tagline}</span>
                          {isSelected && (
                            <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 shrink-0">
                              <Check className="w-3.5 h-3.5" />
                              <span>التخصص النشط</span>
                            </span>
                          )}
                        </div>
                        <h4 className="font-display text-lg font-bold text-white">{spec.name}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">{spec.description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canSelect}
                      onClick={() => onSelectSubSpec(spec.id)}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {!subSpecUnlocked
                        ? 'يُفتح في المستوى 3'
                        : isSelected
                        ? 'مفعّل حالياً'
                        : switchCost > 0
                        ? `تحويل التخصص (${switchCost} ذهب)`
                        : 'اختيار هذا التخصص (مجاني)'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ATTRIBUTE_META.map((attr) => {
              const baseVal = player.attributes[attr.key];
              const totalVal = effective[attr.key];
              const bonusVal = totalVal - baseVal;
              const cost = getAttributeUpgradeCost(baseVal);
              const canAfford = player.gold >= cost;

              return (
                <div
                  key={attr.key}
                  className="p-5 bg-[#14161F] border border-white/10 rounded-xl flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3.5">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-[#0C0E14] shrink-0">
                        <ResilientImage
                          src={ATTRIBUTE_IMAGES[attr.key]}
                          alt={attr.label}
                          className="w-full h-full object-cover"
                          fallbackTitle={attr.label}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-bold text-white">{attr.label}</h3>
                        <p className="text-xs text-zinc-400 mt-1">{attr.description}</p>
                        <p className="text-xs text-amber-400/90 mt-2">{attr.impact}</p>
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <div className="font-num text-2xl font-bold text-white">{totalVal}</div>
                      {bonusVal > 0 && (
                        <div className="font-num text-[11px] text-emerald-400">
                          أساسي {baseVal} (+{bonusVal})
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
                    <div className="text-xs text-zinc-400 font-num">
                      تكلفة التدريب: <span className="text-amber-400 font-semibold">{cost} ذهب</span>
                    </div>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onTrainAttribute(attr.key)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>ترقية +1</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Faction Signature Perks */}
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-xl font-bold text-white">قدرات فصيل {faction.name} الحصرية</h3>
              <p className="text-xs text-zinc-400 mt-1">
                قدرات نوعية تُفتح مع تقدم مستواك لتمنحك تفوقاً استراتيجياً دائماً (تبقى معك بعد الصعود).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {faction.perks.map((perk) => {
                const isUnlocked = player.unlockedPerks.includes(perk.id);
                const levelMet = player.level >= perk.unlockLevel || player.prestigeRank > 0;
                const canAfford = player.gold >= perk.costGold && player.crystals >= perk.costCrystals;

                return (
                  <div
                    key={perk.id}
                    className={`p-5 rounded-xl border flex flex-col justify-between gap-4 ${
                      isUnlocked
                        ? 'bg-[#171A26] border-emerald-500/40'
                        : 'bg-[#12141C] border-white/10'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-[#0C0E14] shrink-0">
                          <ResilientImage
                            src={perk.image}
                            alt={perk.name}
                            className="w-full h-full object-cover"
                            fallbackTitle={perk.name}
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1 text-xs">
                            <span className="font-num text-zinc-400">المستوى: {perk.unlockLevel}</span>
                            {isUnlocked && (
                              <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 shrink-0">
                                <Check className="w-3.5 h-3.5" />
                                <span>مفعّلة</span>
                              </span>
                            )}
                          </div>
                          <h4 className="font-display text-lg font-bold text-white">{perk.name}</h4>
                          <p className="text-xs text-amber-400 font-medium">{perk.effectLabel}</p>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed">{perk.description}</p>
                    </div>

                    {!isUnlocked && (
                      <button
                        type="button"
                        disabled={!levelMet || player.gold < perk.costGold}
                        onClick={
                          player.crystals < perk.costCrystals
                            ? onOpenStore
                            : () => onUnlockPerk(perk.id)
                        }
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        {!levelMet && <Lock className="w-3.5 h-3.5" />}
                        <span className="font-num">
                          {!levelMet
                            ? `يتطلب مستوى ${perk.unlockLevel}`
                            : player.crystals < perk.costCrystals
                            ? `تفعيل (${perk.costGold} ذهب + ${perk.costCrystals} بلورات · اشحن)`
                            : `تفعيل (${perk.costGold} ذهب${
                                perk.costCrystals > 0 ? ` + ${perk.costCrystals} بلورات` : ''
                              })`}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Infinite Research Lab */}
      {subTab === 'research' && (
        <div className="space-y-5">
          <div className="p-4 bg-[#12141C] border border-white/10 rounded-xl flex items-center gap-3 text-xs text-zinc-300">
            <FlaskConical className="w-5 h-5 text-sky-400 shrink-0" />
            <span>
              أبحاث المختبر تراكمية ودائمة حتى المستوى 100 ولا تُفقد عند الصعود، لتبني إمبراطوريتك على المدى الطويل.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(Object.keys(RESEARCH_TRACKS) as ResearchId[]).map((rId) => {
              const def = RESEARCH_TRACKS[rId];
              const lvl = player.researchLevels?.[rId] || 0;
              const isMax = lvl >= def.maxLevel;
              const cost = getResearchUpgradeCost(rId, lvl);
              const canAfford = player.gold >= cost.gold && player.contraband >= cost.contraband;

              return (
                <div
                  key={rId}
                  className="bg-[#14161F] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-32 w-full bg-[#0C0E14] overflow-hidden border-b border-white/10">
                      <ResilientImage
                        src={def.image}
                        alt={def.name}
                        className="w-full h-full object-cover"
                        fallbackTitle={def.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#14161F] via-[#14161F]/35 to-transparent" />
                      <div className="absolute bottom-2.5 inset-x-4 flex items-center justify-between gap-2 text-xs">
                        <span className="text-sky-300 font-semibold">{def.effectPerLevel}</span>
                        <span className="font-num text-white font-bold shrink-0">
                          المستوى {lvl} / {def.maxLevel}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 pb-3 space-y-2">
                      <h3 className="font-display text-lg font-bold text-white">{def.name}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{def.description}</p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-white/10 flex items-center justify-between gap-4">
                    {isMax ? (
                      <span className="text-xs font-semibold text-emerald-400">مكتمل</span>
                    ) : (
                      <>
                        <div className="text-xs font-num text-zinc-400">
                          <span className="text-amber-400 font-semibold">{cost.gold.toLocaleString('en-US')} ذهب</span>
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          <span className="text-zinc-200">{cost.contraband} مهربات</span>
                        </div>
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUpgradeResearch(rId)}
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>بحث وتطوير</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Prestige & Ascension */}
      {subTab === 'prestige' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 bg-[#14161F] border border-amber-500/35 rounded-xl space-y-5">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-xs text-amber-400 font-medium">رتبة الهيبة الحالية</div>
                <h3 className="font-display text-2xl font-bold text-white">
                  {getPrestigeTitle(player.prestigeRank)}
                </h3>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              عند بلوغ المستوى المطلوب يمكنك تنفيذ <strong className="text-white">الصعود الأبدي</strong>: تبدأ دورة جديدة بمستوى 1 مع مضاعفات دائمة للذهب والخبرة والقوة، وتحتفظ بكامل أسلحتك المصقولة والأحجار الرونية، بلوراتك، منشآت مقرك، أبحاثك، وأسهم الأحياء.
            </p>

            <div className="grid grid-cols-3 gap-3 text-center p-4 bg-[#0E1016] border border-white/10 rounded-xl font-num">
              <div>
                <div className="text-xs text-zinc-400">مكافأة الذهب</div>
                <div className="text-lg font-bold text-amber-400">+{player.prestigeRank * 25}%</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">مكافأة الخبرة</div>
                <div className="text-lg font-bold text-sky-400">+{player.prestigeRank * 25}%</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">القوة القتالية</div>
                <div className="text-lg font-bold text-emerald-400">+{player.prestigeRank * 12}%</div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10">
              <div className="text-xs font-num text-zinc-400">
                المستوى المطلوب للصعود القادم: <strong className="text-white">{prestigeReqLevel}</strong> (مستواك الحالي {player.level})
              </div>
              <button
                type="button"
                disabled={!canAscend}
                onClick={onAscendPrestige}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {canAscend
                  ? `تنفيذ الصعود إلى الرتبة ${player.prestigeRank + 1} (+15 بلورة)`
                  : `تحتاج مستوى ${prestigeReqLevel} للصعود`}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 bg-[#12141C] border border-white/10 rounded-xl space-y-4">
            <h4 className="font-display text-lg font-bold text-white">ماذا تحتفظ به عند الصعود؟</h4>
            <ul className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
              <li>• جميع الأسلحة والدروع والآثار المملوكة ومستويات صقلها (+1 إلى +15) والأحجار الرونية.</li>
              <li>• جميع بلورات الظل، جوهر الصياغة، أحجار الصقل، والبضائع المهربة.</li>
              <li>• تقدم برج الظلال اللانهائي وألقاب بطولة الكولوسيوم.</li>
              <li>• مستويات المقر السري المحصّن (حتى المستوى 50) وجميع الأبحاث.</li>
              <li>• تحصل فوراً على +15 بلورة ظل و +25% مضاعف أرباح دائم.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
