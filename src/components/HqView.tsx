import React, { useState } from 'react';
import {
  DISTRICT_SHARES,
  HQ_CITADEL_IMAGE,
  HQ_MODULES,
  getHqUpgradeCost,
} from '../data/gameData';
import { HqModuleId, PlayerSaveState } from '../types/game';
import { ResilientImage } from './ResilientImage';
import { ArrowUp, Coins, Cpu, Download, Lock, Shield, Sparkles, Upload } from 'lucide-react';

interface HqViewProps {
  player: PlayerSaveState;
  now: number;
  onCollectVault: () => void;
  onUpgradeModule: (moduleId: HqModuleId) => void;
  onDepositVault: (amount: number) => void;
  onWithdrawVault: (amount: number) => void;
  onImportSave: (rawJson: string) => void;
}

export const HqView: React.FC<HqViewProps> = ({
  player,
  now,
  onCollectVault,
  onUpgradeModule,
  onDepositVault,
  onWithdrawVault,
  onImportSave,
}) => {
  const [importText, setImportText] = useState('');
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [selectedMod, setSelectedMod] = useState<HqModuleId>('vault_gate');

  const vaultLevel = player.hqLevels.vault_gate;
  const vaultCap = 2500 * vaultLevel;
  const protectionRate = Math.min(
    90,
    30 + (vaultLevel - 1) * 2 + (player.unlockedPerks.includes('tw_orbital_lock') ? 25 : 0)
  );
  const refineryLevel = player.hqLevels.refinery;
  const researchYieldBonus = 1 + (player.researchLevels?.refinery_protocol || 0) * 0.06;
  const refineryYield = Math.round(
    (55 + (refineryLevel - 1) * 55) *
      (player.unlockedPerks.includes('tw_grid_overclock') ? 1.25 : 1) *
      researchYieldBonus *
      (1 + player.prestigeRank * 0.25)
  );

  const shareDividends = Math.round(
    DISTRICT_SHARES.reduce((sum, d) => sum + (player.districtShares[d.id] || 0) * d.dividendPerCycle, 0) *
      researchYieldBonus
  );
  const totalCycleGold = refineryYield + shareDividends;
  const secondsUntilTick = Math.max(0, 15 - (Math.floor((now - player.lastVaultTick) / 1000) % 15));

  const hasPending = player.pendingVaultGold > 0 || player.pendingVaultContraband > 0;

  const handleCopyBackup = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(player))));
      navigator.clipboard.writeText(encoded);
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="space-y-8">
      {/* HQ Visual Showcase Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 relative rounded-xl overflow-hidden border border-white/10 min-h-[260px]">
          <ResilientImage
            src={HQ_CITADEL_IMAGE}
            alt="المقر السري المحصن"
            className="w-full h-full object-cover"
            fallbackTitle="المقر السري المحصّن"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/35 to-transparent" />
          <div className="absolute bottom-5 inset-x-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs text-amber-400 font-medium mb-1">
                القاعدة المحصنة · مستوى الحماية {protectionRate}%
              </p>
              <h2 className="font-display text-2xl font-bold text-white">المقر السري المحصّن</h2>
            </div>
            <div className="text-xs font-num text-zinc-300">الدورة القادمة خلال {secondsUntilTick}ث</div>
          </div>
        </div>

        {/* Vault & Passive Income Panel */}
        <div className="lg:col-span-5 bg-[#14161F] border border-white/10 rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-white">عوائد التكرير والاستثمار</h3>
                <p className="text-xs text-zinc-400 font-num mt-0.5">
                  الإنتاج الدوري: +{totalCycleGold.toLocaleString('en-US')} ذهب كل 15 ثانية
                </p>
              </div>
              <Coins className="w-5 h-5 text-amber-400" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 bg-[#0E1016] border border-white/5 rounded-lg">
                <div className="text-xs text-zinc-400 mb-1">ذهب جاهز للتحصيل</div>
                <div className="font-num text-xl font-bold text-amber-400">
                  {player.pendingVaultGold.toLocaleString('en-US')}
                </div>
              </div>
              <div className="p-3.5 bg-[#0E1016] border border-white/5 rounded-lg">
                <div className="text-xs text-zinc-400 mb-1">مهربات مكررة</div>
                <div className="font-num text-xl font-bold text-zinc-100">
                  {player.pendingVaultContraband.toLocaleString('en-US')}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!hasPending}
              onClick={onCollectVault}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {hasPending ? 'تحصيل أرباح المقر الآن' : 'لا توجد عوائد معلقة حالياً'}
            </button>
          </div>

          {/* Safe Deposit Vault */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>الخزنة المحمية ({protectionRate}%)</span>
              </span>
              <span className="font-num text-zinc-200">
                {player.vaultProtectedGold.toLocaleString('en-US')} / {vaultCap.toLocaleString('en-US')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={player.gold < 100 || player.vaultProtectedGold >= vaultCap}
                onClick={() => onDepositVault(Math.min(1000, player.gold, vaultCap - player.vaultProtectedGold))}
                className="py-2 bg-[#1B1E2B] hover:bg-[#232738] disabled:opacity-40 text-xs font-medium text-zinc-200 rounded-lg transition-colors cursor-pointer"
              >
                إيداع 1,000 ذهب
              </button>
              <button
                type="button"
                disabled={player.vaultProtectedGold <= 0}
                onClick={() => onWithdrawVault(Math.min(1000, player.vaultProtectedGold))}
                className="py-2 bg-[#1B1E2B] hover:bg-[#232738] disabled:opacity-40 text-xs font-medium text-zinc-200 rounded-lg transition-colors cursor-pointer"
              >
                سحب 1,000 ذهب
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Living HQ Diorama Schematic (Scales Visually With Module Levels 1-50) */}
      {(() => {
        const vLvl = player.hqLevels.vault_gate;
        const pLvl = player.hqLevels.power_core;
        const tLvl = player.hqLevels.trap_grid;
        const rLvl = player.hqLevels.refinery;
        const totalCitadelLvl = vLvl + pLvl + tLvl + rLvl;
        const selDef = HQ_MODULES[selectedMod];
        const selLvl = player.hqLevels[selectedMod];
        const selCost = getHqUpgradeCost(selectedMod, selLvl);
        const canUpgradeSel = selLvl < selDef.maxLevel && player.gold >= selCost.gold && player.contraband >= selCost.contraband;

        const modMeta: Record<HqModuleId, { tierName: string; color: string }> = {
          vault_gate: {
            tierName: vLvl >= 25 ? 'بوابة أوبسيديان السيادية' : vLvl >= 10 ? 'بوابة التيتانيوم المصفّحة' : 'البوابة الفولاذية',
            color: '#f59e0b',
          },
          power_core: {
            tierName: pLvl >= 25 ? 'مفاعل النجم المظلم' : pLvl >= 10 ? 'نواة البلازما المتزامنة' : 'مولد الطاقة الليلي',
            color: '#38bdf8',
          },
          trap_grid: {
            tierName: tLvl >= 25 ? 'شبكة الليزر الحتمية' : tLvl >= 10 ? 'أبراج الصعق المدارية' : 'أجهزة الاستشعار الأولية',
            color: '#f43f5e',
          },
          refinery: {
            tierName: rLvl >= 25 ? 'مصفاة الخيمياء الملكية' : rLvl >= 10 ? 'مجمع التكرير المؤتمت' : 'وحدة التكرير السرية',
            color: '#10b981',
          },
        };

        return (
          <section className="p-5 bg-[#12141C] border border-white/10 rounded-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-white inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>مخطط المقر التفاعلي الحي</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  تتطور تحصينات مقرك بصرياً مع كل ترقية (إجمالي مستويات المنشآت: <span className="font-num text-amber-300 font-semibold">{totalCitadelLvl} / 200</span>) — انقر على أي مبنى للفحص والترقية.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-7 bg-[#090B10] border border-white/10 rounded-xl p-3">
                <svg viewBox="0 0 600 260" className="w-full h-auto">
                  <defs>
                    <pattern id="hqBlueprintGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    </pattern>
                    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={Math.min(0.65, 0.2 + pLvl * 0.015)} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="600" height="260" fill="url(#hqBlueprintGrid)" rx="10" />

                  {/* Perimeter Laser Shield Rings when Trap Grid levels up */}
                  <rect
                    x="18"
                    y="18"
                    width="564"
                    height="224"
                    rx="14"
                    fill="none"
                    stroke={tLvl >= 10 ? '#f43f5e' : 'rgba(244,63,94,0.35)'}
                    strokeWidth={tLvl >= 25 ? 2.5 : 1.3}
                    strokeDasharray={tLvl >= 15 ? 'none' : '8 6'}
                  />

                  {/* Energy Conduits connecting Power Core (center) to Vault, Traps & Refinery */}
                  <line x1="300" y1="130" x2="120" y2="130" stroke="#f59e0b" strokeOpacity="0.45" strokeWidth="2.5" />
                  <line x1="300" y1="130" x2="480" y2="85" stroke="#10b981" strokeOpacity="0.45" strokeWidth="2.5" />
                  <line x1="300" y1="130" x2="480" y2="185" stroke="#f43f5e" strokeOpacity="0.45" strokeWidth="2.5" />

                  {/* 1. Vault Gate (Left Citadel Fortress) */}
                  <g onClick={() => setSelectedMod('vault_gate')} className="cursor-pointer">
                    <rect
                      x="55"
                      y="78"
                      width="130"
                      height="104"
                      rx="10"
                      fill="#161925"
                      stroke={selectedMod === 'vault_gate' ? '#fbbf24' : '#f59e0b'}
                      strokeWidth={selectedMod === 'vault_gate' ? 3 : 1.5}
                    />
                    <rect x="75" y="98" width="90" height="64" rx="6" fill="#0D0F17" stroke="#f59e0b" strokeOpacity="0.4" />
                    <circle cx="120" cy="130" r={vLvl >= 15 ? 20 : 14} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                    {vLvl >= 8 && <circle cx="120" cy="130" r="7" fill="#f59e0b" fillOpacity="0.7" />}
                    <text x="120" y="70" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">
                      بوابة الخزنة (م{vLvl})
                    </text>
                  </g>

                  {/* 2. Power Core (Center Reactor) */}
                  <g onClick={() => setSelectedMod('power_core')} className="cursor-pointer">
                    <circle cx="300" cy="130" r="62" fill="url(#coreGlow)" />
                    <circle
                      cx="300"
                      cy="130"
                      r="42"
                      fill="#141826"
                      stroke={selectedMod === 'power_core' ? '#7dd3fc' : '#38bdf8'}
                      strokeWidth={selectedMod === 'power_core' ? 3 : 1.8}
                    />
                    <circle cx="300" cy="130" r={Math.min(30, 14 + Math.floor(pLvl / 3))} fill="#0EA5E9" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle cx="300" cy="130" r="8" fill="#bae6fd" />
                    <text x="300" y="192" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="700">
                      مفاعل الطاقة (م{pLvl})
                    </text>
                  </g>

                  {/* 3. Refinery (Top Right Lab) */}
                  <g onClick={() => setSelectedMod('refinery')} className="cursor-pointer">
                    <rect
                      x="415"
                      y="38"
                      width="135"
                      height="76"
                      rx="10"
                      fill="#131C1B"
                      stroke={selectedMod === 'refinery' ? '#34d399' : '#10b981'}
                      strokeWidth={selectedMod === 'refinery' ? 3 : 1.5}
                    />
                    <rect x="432" y="54" width="22" height="44" rx="4" fill="#10b981" fillOpacity="0.35" stroke="#10b981" />
                    <rect x="466" y="48" width="22" height="50" rx="4" fill="#10b981" fillOpacity={rLvl >= 10 ? 0.65 : 0.35} stroke="#10b981" />
                    {rLvl >= 5 && <rect x="500" y="56" width="22" height="42" rx="4" fill="#10b981" fillOpacity="0.5" stroke="#10b981" />}
                    <text x="482" y="128" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="700">
                      مختبر التكرير (م{rLvl})
                    </text>
                  </g>

                  {/* 4. Trap Grid (Bottom Right Turrets) */}
                  <g onClick={() => setSelectedMod('trap_grid')} className="cursor-pointer">
                    <rect
                      x="415"
                      y="148"
                      width="135"
                      height="76"
                      rx="10"
                      fill="#1F131A"
                      stroke={selectedMod === 'trap_grid' ? '#fb7185' : '#f43f5e'}
                      strokeWidth={selectedMod === 'trap_grid' ? 3 : 1.5}
                    />
                    <polygon points="445,204 460,172 475,204" fill="#f43f5e" fillOpacity="0.45" stroke="#fb7185" strokeWidth="1.5" />
                    <polygon points="490,204 505,172 520,204" fill="#f43f5e" fillOpacity={tLvl >= 10 ? 0.7 : 0.3} stroke="#fb7185" strokeWidth="1.5" />
                    <text x="482" y="238" textAnchor="middle" fill="#fda4af" fontSize="11" fontWeight="700">
                      شبكة الفخاخ (م{tLvl})
                    </text>
                  </g>
                </svg>
              </div>

              {/* Selected Module Quick Inspector */}
              <div className="lg:col-span-5 p-5 bg-[#14161F] border border-amber-500/30 rounded-xl flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: modMeta[selectedMod].color }}>
                      {modMeta[selectedMod].tierName}
                    </span>
                    <span className="font-num text-white font-bold">
                      المستوى {selLvl} / {selDef.maxLevel}
                    </span>
                  </div>
                  <h4 className="font-display text-xl font-bold text-white">{selDef.name}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{selDef.description}</p>
                  <div className="p-3 bg-[#0E1016] border border-white/10 rounded-lg text-xs font-num space-y-1">
                    <div className="text-amber-300 font-semibold">التأثير: {selDef.effectPerLevel}</div>
                    {selLvl < selDef.maxLevel && (
                      <div className="text-zinc-300">
                        تكلفة الترقية: {selCost.gold.toLocaleString('en-US')} ذهب · {selCost.contraband} مهربات
                      </div>
                    )}
                  </div>
                </div>

                {selLvl >= selDef.maxLevel ? (
                  <div className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>بلغت هذه المنشأة أقصى مستوى تطوير</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!canUpgradeSel}
                    onClick={() => onUpgradeModule(selectedMod)}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>ترقية {selDef.name} الآن</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* 4 Fortification Modules (Lv 1 to 50) */}
      <section className="space-y-4">
        <div>
          <h3 className="font-display text-xl font-bold text-white">منشآت التحصين والتطوير (حتى المستوى 50)</h3>
          <p className="text-xs text-zinc-400 mt-1">
            استثمر الذهب والبضائع المهربة لترقية دفاعات مقرك وتسريع قدراتك التشغيلية على المدى الطويل.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(Object.keys(HQ_MODULES) as HqModuleId[]).map((mId) => {
            const mod = HQ_MODULES[mId];
            const currentLvl = player.hqLevels[mId];
            const isMax = currentLvl >= mod.maxLevel;
            const cost = getHqUpgradeCost(mId, currentLvl);
            const canAfford = player.gold >= cost.gold && player.contraband >= cost.contraband;

            return (
              <div
                key={mId}
                className="bg-[#14161F] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-36 w-full bg-[#0C0E14] overflow-hidden border-b border-white/10">
                    <ResilientImage
                      src={mod.image}
                      alt={mod.name}
                      className="w-full h-full object-cover"
                      fallbackTitle={mod.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14161F] via-[#14161F]/35 to-transparent" />
                    <div className="absolute bottom-2.5 inset-x-4 flex items-center justify-between gap-2 text-xs">
                      <span className="text-amber-400 font-semibold">{mod.effectPerLevel}</span>
                      <span className="font-num text-white font-bold shrink-0">
                        المستوى {currentLvl} / {mod.maxLevel}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 pb-3 space-y-2">
                    <h4 className="font-display text-lg font-bold text-white">{mod.name}</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">{mod.description}</p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-white/10 flex items-center justify-between gap-4">
                  {isMax ? (
                    <span className="text-xs font-semibold text-emerald-400">وصلت للحد الأقصى</span>
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
                        onClick={() => onUpgradeModule(mId)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>ترقية</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Long-Term Save Backup / Restore */}
      <section className="p-5 bg-[#12141C] border border-white/10 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-white">النسخ الاحتياطي ونقل التقدم</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              انسخ رمز الحفظ للاحتفاظ بتقدمك لشهور وسنوات أو استعده على جهاز آخر.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyBackup}
            className="px-4 py-2 bg-[#1A1E2B] hover:bg-[#23283A] border border-white/10 text-xs font-semibold text-zinc-200 rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{copiedBackup ? 'تم نسخ رمز الحفظ' : 'نسخ رمز الحفظ'}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="ألصق رمز الحفظ هنا لاستعادته..."
            className="flex-1 px-3.5 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            disabled={!importText.trim()}
            onClick={() => {
              onImportSave(importText.trim());
              setImportText('');
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>استعادة الحفظ</span>
          </button>
        </div>
      </section>
    </div>
  );
};
