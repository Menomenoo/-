import React, { useState } from 'react';
import {
  COMPANIONS,
  DISTRICT_SHARES,
  EQUIPMENT_CATALOG,
  EQUIPMENT_SETS,
  FACTIONS,
  FORGED_WEAPON_IMAGE,
  MARKET_COMMODITIES,
  MARKET_VAULT_IMAGE,
  RUNES_CATALOG,
  RUNES_FORGE_IMAGE,
  getCompanionUpgradeCost,
  getEquipmentEnhanceCost,
} from '../data/gameData';
import {
  AuctionListingDoc,
  CompanionId,
  EquipmentItem,
  EquipmentSlot,
  PlayerSaveState,
  RuneId,
  TimedAuctionDoc,
} from '../types/game';
import { getActiveEquipmentSets, getActiveSubSpec, getEnhancedItemBonuses } from '../utils/combatEngine';
import { ResilientImage } from './ResilientImage';
import {
  ArrowUp,
  Building2,
  Check,
  Clock,
  Flame,
  Gavel,
  Hammer,
  RefreshCw,
  Shield,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface EconomyViewProps {
  player: PlayerSaveState;
  now: number;
  isOnline: boolean;
  myUid?: string;
  auctionListings: AuctionListingDoc[];
  timedAuction: TimedAuctionDoc | null;
  onRefreshMarket: () => void;
  onBuyCommodity: (commodityId: string, qty: number) => void;
  onSellCommodity: (commodityId: string, qty: number) => void;
  onBuyEquipment: (item: EquipmentItem) => void;
  onEquipItem: (item: EquipmentItem) => void;
  onEnhanceEquipment: (item: EquipmentItem) => void;
  onCraftCustomWeapon: (mode: 'blueprint' | 'fusion') => void;
  onDismantleMaterial: (material: 'contraband' | 'forge_stones') => void;
  onCraftRune: (runeId: RuneId) => void;
  onSocketRune: (slot: EquipmentSlot, runeId: RuneId | null) => void;
  onCreateAuctionListing: (
    itemType: 'contraband' | 'forge_stones' | 'rune',
    itemId: string,
    quantity: number,
    priceGold: number
  ) => void;
  onBuyAuctionListing: (listing: AuctionListingDoc) => void;
  onCancelAuctionListing: (listing: AuctionListingDoc) => void;
  onBidTimedAuction: (bidAmount: number) => void;
  onClaimTimedAuction: () => void;
  onRotateTimedAuction: () => void;
  onUnlockOrUpgradeCompanion: (companionId: CompanionId) => void;
  onActivateCompanion: (companionId: CompanionId) => void;
  onBuyShare: (districtId: string) => void;
  onOpenStore: () => void;
}

type EconomySubTab = 'arsenal' | 'runes' | 'companions' | 'market' | 'auction' | 'shares';

const SLOT_LABELS: Record<EquipmentItem['slot'], string> = {
  weapon: 'سلاح',
  armor: 'درع',
  relic: 'أثر سري',
};

const RARITY_COLORS: Record<EquipmentItem['rarityLabel'], string> = {
  عادي: 'text-zinc-300',
  نادر: 'text-sky-400',
  ملحمي: 'text-amber-400',
  أسطوري: 'text-orange-400',
  سيادي: 'text-rose-400',
};

export const EconomyView: React.FC<EconomyViewProps> = ({
  player,
  now,
  isOnline,
  myUid,
  auctionListings,
  timedAuction,
  onRefreshMarket,
  onBuyCommodity,
  onSellCommodity,
  onBuyEquipment,
  onEquipItem,
  onEnhanceEquipment,
  onCraftCustomWeapon,
  onDismantleMaterial,
  onCraftRune,
  onSocketRune,
  onCreateAuctionListing,
  onBuyAuctionListing,
  onCancelAuctionListing,
  onBidTimedAuction,
  onClaimTimedAuction,
  onRotateTimedAuction,
  onUnlockOrUpgradeCompanion,
  onActivateCompanion,
  onBuyShare,
  onOpenStore,
}) => {
  const [subTab, setSubTab] = useState<EconomySubTab>('arsenal');
  const [slotFilter, setSlotFilter] = useState<'all' | EquipmentItem['slot']>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'gold' | 'crystals'>('all');
  const [selectedSocketSlot, setSelectedSocketSlot] = useState<EquipmentSlot>('weapon');
  const [auctionType, setAuctionType] = useState<'contraband' | 'forge_stones' | 'rune'>('contraband');
  const [auctionRuneId, setAuctionRuneId] = useState<RuneId>('poison');
  const [auctionQty, setAuctionQty] = useState(5);
  const [auctionPrice, setAuctionPrice] = useState(550);

  const faction = FACTIONS[player.factionId];
  const subSpec = getActiveSubSpec(player);
  const hasBlackAlchemy = player.unlockedPerks.includes('bm_black_alchemy');
  const researchTradeBonus = (player.researchLevels?.alchemy_archive || 0) * 0.01;
  const subSpecMargin = subSpec?.bonuses.marketMarginBonus || 0;
  const buyDiscount = Math.max(
    0.68,
    (hasBlackAlchemy ? 0.92 : 1 - faction.bonuses.marketMarginBonus * 0.5) - researchTradeBonus - subSpecMargin * 0.5
  );
  const sellBonus = (hasBlackAlchemy ? 1.08 : 1 + faction.bonuses.marketMarginBonus) + researchTradeBonus + subSpecMargin;

  const marketCountdown = Math.max(0, 30 - Math.floor((now - player.lastMarketUpdate) / 1000));
  const combinedEquipment = [...(player.craftedItems || []), ...EQUIPMENT_CATALOG];
  const filteredEquipment = combinedEquipment.filter((item) => {
    const slotMatch = slotFilter === 'all' || item.slot === slotFilter;
    const currencyMatch =
      currencyFilter === 'all' ||
      (currencyFilter === 'gold' && item.priceCrystals === 0) ||
      (currencyFilter === 'crystals' && item.priceCrystals > 0);
    return slotMatch && currencyMatch;
  });
  const activeSets = getActiveEquipmentSets(player);

  return (
    <div className="space-y-8">
      {/* Header + Segmented Sub-Tab Switch */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">الترسانة، الأحجار الرونية والمزاد</h2>
          <p className="text-sm text-zinc-400">
            اجمع أطقم العتاد واصقلها، اصنع الأحجار الرونية ورصّع سلاحك، وتاجر مع اللاعبين في المزاد الحي.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#14161F] border border-white/10 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setSubTab('arsenal')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'arsenal' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>الترسانة والأطقم</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('runes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'runes' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Hammer className="w-3.5 h-3.5 shrink-0" />
            <span>الصياغة والرونية</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('companions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'companions' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>المرافقون</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('market')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'market' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>البورصة</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('auction')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'auction' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Gavel className="w-3.5 h-3.5 shrink-0" />
            <span>مزاد اللاعبين</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('shares')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === 'shares' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>الاستثمارات</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Arsenal, Equipment Sets & Forging */}
      {subTab === 'arsenal' && (
        <div className="space-y-6">
          {/* Equipment Sets Tracker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(EQUIPMENT_SETS).map((setDef) => {
              const status = activeSets.find((s) => s.setId === setDef.id);
              const count = status?.equippedCount || 0;
              return (
                <div
                  key={setDef.id}
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    status?.twoPieceActive
                      ? 'bg-[#171B28] border-amber-500/50'
                      : 'bg-[#12141C] border-white/10'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-[#0C0E14] shrink-0">
                    <ResilientImage
                      src={setDef.image}
                      alt={setDef.name}
                      className="w-full h-full object-cover"
                      fallbackTitle={setDef.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{setDef.name}</span>
                      <span className="font-num text-amber-400 font-semibold shrink-0">{count} / 3 قطع</span>
                    </div>
                    <div className={`text-[11px] ${status?.twoPieceActive ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}`}>
                      • {setDef.twoPieceLabel}
                    </div>
                    <div className={`text-[11px] ${status?.threePieceActive ? 'text-amber-300 font-semibold' : 'text-zinc-500'}`}>
                      • {setDef.threePieceLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weapon Crafting & Fusion Lab */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch bg-[#12141C] border border-amber-500/35 rounded-xl overflow-hidden">
            <div className="lg:col-span-3 min-h-[160px] relative bg-[#0C0E14]">
              <ResilientImage
                src={FORGED_WEAPON_IMAGE}
                alt="مصنع صياغة الأسلحة الأسطورية"
                className="w-full h-full object-cover"
                fallbackTitle="مسبك الأسلحة"
              />
            </div>
            <div className="lg:col-span-9 p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-amber-400 inline-flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    <span>مسبك الأسلحة النادرة والدمج</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">صياغة أسلحة مخصصة بصفات قوية</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    اصنع سلاحاً خاصاً باستخدام المخططات النادرة (تُغنم من الزعماء والبرج) أو ادمج جوهر الصياغة وأحجار الصقل، ثم اصقله حتى +15!
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-num bg-[#0E1016] border border-white/10 px-3 py-2 rounded-lg">
                  <span className="text-amber-300 font-semibold">مخططات: {player.blueprints || 0}</span>
                  <span className="text-sky-300 font-semibold">جوهر: {player.craftingEssence || 0}</span>
                  <span className="text-zinc-200 font-semibold">صقل: {player.forgeStones}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={(player.blueprints || 0) < 1 || (player.craftingEssence || 0) < 20 || player.gold < 1200}
                  onClick={() => onCraftCustomWeapon('blueprint')}
                  className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                >
                  صياغة بمخطط نادر (1 مخطط + 20 جوهر + 1,200 ذهب)
                </button>
                <button
                  type="button"
                  disabled={(player.craftingEssence || 0) < 30 || player.forgeStones < 5 || player.gold < 1800}
                  onClick={() => onCraftCustomWeapon('fusion')}
                  className="py-2.5 px-4 bg-sky-700 hover:bg-sky-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                >
                  دمج صياغة كيميائي (30 جوهر + 5 صقل + 1,800 ذهب)
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-[#14161F] border border-white/10 rounded-lg">
                {(['all', 'weapon', 'armor', 'relic'] as const).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSlotFilter(slot)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      slotFilter === slot ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {slot === 'all' ? 'كل العتاد' : slot === 'weapon' ? 'الأسلحة' : slot === 'armor' ? 'الدروع' : 'الآثار'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 bg-[#14161F] border border-white/10 rounded-lg">
                {([
                  { id: 'all', label: 'كل الأسعار' },
                  { id: 'gold', label: 'بالذهب فقط' },
                  { id: 'crystals', label: 'بالبلورات القوية' },
                ] as const).map((cf) => (
                  <button
                    key={cf.id}
                    type="button"
                    onClick={() => setCurrencyFilter(cf.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      currencyFilter === cf.id ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cf.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs font-num text-zinc-300">
              معروض: <strong className="text-white">{filteredEquipment.length}</strong> قطعة · أحجار الصقل:{' '}
              <strong className="text-sky-300">{player.forgeStones}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEquipment.map((item) => {
              const isOwned = player.ownedEquipment.includes(item.id);
              const isEquipped = player.equipped[item.slot] === item.id;
              const enhanceLevel = player.equipmentEnhance[item.id] || 0;
              const isMaxEnhanced = enhanceLevel >= 15;
              const enhanceCost = getEquipmentEnhanceCost(enhanceLevel);
              const canAffordBuy = player.gold >= item.priceGold && player.crystals >= item.priceCrystals;
              const canAffordEnhance =
                !isMaxEnhanced && player.gold >= enhanceCost.gold && player.forgeStones >= enhanceCost.stones;
              const setDef = item.setId ? EQUIPMENT_SETS[item.setId] : null;
              const socketedRune = isEquipped && player.socketedRunes?.[item.slot] ? RUNES_CATALOG[player.socketedRunes[item.slot]!] : null;

              const scaledBonuses = getEnhancedItemBonuses(item, enhanceLevel);
              const bonusParts: string[] = [];
              if (scaledBonuses.attack) bonusParts.push(`+${scaledBonuses.attack} هجوم`);
              if (scaledBonuses.defense) bonusParts.push(`+${scaledBonuses.defense} دفاع`);
              if (scaledBonuses.agility) bonusParts.push(`+${scaledBonuses.agility} رشاقة`);
              if (scaledBonuses.mastery) bonusParts.push(`+${scaledBonuses.mastery} براعة`);
              if (scaledBonuses.influence) bonusParts.push(`+${scaledBonuses.influence} نفوذ`);

              return (
                <div
                  key={item.id}
                  className={`rounded-xl overflow-hidden border flex flex-col justify-between ${
                    isEquipped
                      ? 'bg-[#171B28] border-amber-500'
                      : 'bg-[#14161F] border-white/10'
                  }`}
                >
                  <div className="relative aspect-square w-full bg-[#0C0E14] overflow-hidden border-b border-white/10">
                    <ResilientImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      fallbackTitle={item.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14161F] via-transparent to-transparent" />
                    <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-xs">
                      <span className={`font-semibold ${RARITY_COLORS[item.rarityLabel]}`}>
                        {SLOT_LABELS[item.slot]} · {item.rarityLabel}
                      </span>
                      {enhanceLevel > 0 && (
                        <span className="font-num font-bold text-sky-300">+{enhanceLevel}</span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-lg font-bold text-white">
                          {item.name} {enhanceLevel > 0 ? `+${enhanceLevel}` : ''}
                        </h3>
                        {isEquipped && <span className="text-xs text-amber-400 font-semibold shrink-0">مجهز</span>}
                      </div>
                      {setDef && (
                        <div className="text-[11px] text-amber-300/80">{setDef.name}</div>
                      )}
                      {socketedRune && (
                        <div className={`text-[11px] font-semibold ${socketedRune.colorClass}`}>
                          مرصّع بـ: {socketedRune.name}
                        </div>
                      )}
                      <p className="text-xs font-medium text-emerald-400 font-num">{bonusParts.join(' · ')}</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                    </div>

                    {isOwned ? (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          disabled={isEquipped}
                          onClick={() => onEquipItem(item)}
                          className="w-full py-2 bg-[#1F2433] hover:bg-[#2A3044] disabled:bg-amber-600/20 disabled:text-amber-300 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          {isEquipped ? 'مفعل في الترسانة' : 'تجهيز القطعة'}
                        </button>

                        {!isMaxEnhanced ? (
                          <button
                            type="button"
                            disabled={!canAffordEnhance}
                            onClick={() => onEnhanceEquipment(item)}
                            className="w-full py-2 bg-sky-700 hover:bg-sky-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 font-num cursor-pointer"
                          >
                            <Hammer className="w-3.5 h-3.5" />
                            <span>
                              صقل +{enhanceLevel + 1} ({enhanceCost.gold} ذهب + {enhanceCost.stones} حجر · نجاح{' '}
                              {enhanceCost.successRate}%)
                            </span>
                          </button>
                        ) : (
                          <div className="text-center text-xs text-emerald-400 font-semibold py-1">
                            وصلت لأقصى صقل (+15)
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={player.gold < item.priceGold}
                        onClick={
                          player.crystals < item.priceCrystals ? onOpenStore : () => onBuyEquipment(item)
                        }
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors font-num cursor-pointer"
                      >
                        {player.crystals < item.priceCrystals
                          ? `شراء (${item.priceGold.toLocaleString('en-US')} ذهب + ${item.priceCrystals} بلورات · اشحن)`
                          : `شراء (${item.priceGold.toLocaleString('en-US')} ذهب${
                              item.priceCrystals > 0 ? ` + ${item.priceCrystals} بلورات` : ''
                            })`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Crafting, Dismantling & Runes Socketing */}
      {subTab === 'runes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-[#12141C] border border-white/10 rounded-xl overflow-hidden">
            <div className="lg:col-span-4 min-h-[200px] relative">
              <ResilientImage
                src={RUNES_FORGE_IMAGE}
                alt="مذبح الصياغة والأحجار الرونية"
                className="w-full h-full object-cover"
                fallbackTitle="مذبح الأحجار الرونية"
              />
            </div>
            <div className="lg:col-span-8 p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-amber-400 inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>التفكيك والصياغة والترصيع الروني</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  مذبح الصياغة الأسطورية · جوهر الصياغة المتاح: <span className="font-num text-sky-300">{player.craftingEssence || 0}</span>
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  فكّك الفائض من البضائع المهربة وأحجار الصقل لاستخلاص جوهر الصياغة، ثم اصنع أحجاراً رونية ورصّعها في سلاحك ودرعك وأثرك السري.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={player.contraband < 2}
                  onClick={() => onDismantleMaterial('contraband')}
                  className="px-4 py-2 bg-[#1A1E2B] hover:bg-[#24293B] disabled:opacity-40 border border-white/10 text-xs font-semibold text-zinc-200 rounded-lg font-num cursor-pointer"
                >
                  تفكيك 2 مهربات ← +8 جوهر صياغة
                </button>
                <button
                  type="button"
                  disabled={player.forgeStones < 2}
                  onClick={() => onDismantleMaterial('forge_stones')}
                  className="px-4 py-2 bg-[#1A1E2B] hover:bg-[#24293B] disabled:opacity-40 border border-white/10 text-xs font-semibold text-zinc-200 rounded-lg font-num cursor-pointer"
                >
                  تفكيك 2 أحجار صقل ← +12 جوهر صياغة
                </button>
              </div>
            </div>
          </div>

          {/* Active Equipment Sockets */}
          <div className="p-5 bg-[#14161F] border border-white/10 rounded-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-white">منافذ الترصيع الروني لعتادك</h3>
              <span className="text-xs text-zinc-400">اختر منفذاً لترصيع حجر أو إزالته</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['weapon', 'armor', 'relic'] as EquipmentSlot[]).map((slot) => {
                const isSelected = selectedSocketSlot === slot;
                const runeId = player.socketedRunes?.[slot] || null;
                const rune = runeId ? RUNES_CATALOG[runeId] : null;
                return (
                  <div
                    key={slot}
                    onClick={() => setSelectedSocketSlot(slot)}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors space-y-2 ${
                      isSelected ? 'bg-[#191D2A] border-amber-500' : 'bg-[#0E1016] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">منفذ {SLOT_LABELS[slot]}</span>
                      {isSelected && <span className="text-amber-400 font-semibold">محدد</span>}
                    </div>
                    {rune ? (
                      <div className="space-y-2">
                        <div className={`text-sm font-semibold ${rune.colorClass}`}>{rune.name}</div>
                        <div className="text-[11px] text-zinc-300">{rune.combatEffectLabel}</div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSocketRune(slot, null);
                          }}
                          className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                        >
                          إزالة الحجر (يعود للمخزون)
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500">منفذ فارغ — اختر حجراً من الأسفل للترصيع</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 Craftable & Socketable Runes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(Object.keys(RUNES_CATALOG) as RuneId[]).map((rId) => {
              const rune = RUNES_CATALOG[rId];
              const ownedCount = player.ownedRunes?.[rId] || 0;
              const canCraft = (player.craftingEssence || 0) >= rune.essenceCost && player.gold >= rune.goldCost;

              return (
                <div
                  key={rId}
                  className="p-5 bg-[#14161F] border border-white/10 rounded-xl flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-[#0C0E14] shrink-0">
                      <ResilientImage
                        src={rune.image}
                        alt={rune.name}
                        className="w-full h-full object-cover"
                        fallbackTitle={rune.name}
                      />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className={`font-semibold ${rune.colorClass}`}>{rune.combatEffectLabel}</span>
                        <span className="font-num text-zinc-300 shrink-0">في مخزونك: {ownedCount}</span>
                      </div>
                      <h4 className="font-display text-lg font-bold text-white">{rune.name}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{rune.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      disabled={!canCraft}
                      onClick={() => onCraftRune(rId)}
                      className="flex-1 py-2 px-3 bg-sky-700 hover:bg-sky-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                    >
                      صياغة ({rune.essenceCost} جوهر + {rune.goldCost} ذهب)
                    </button>
                    <button
                      type="button"
                      disabled={ownedCount < 1}
                      onClick={() => onSocketRune(selectedSocketSlot, rId)}
                      className="py-2 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      ترصيع في {SLOT_LABELS[selectedSocketSlot]}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Companions */}
      {subTab === 'companions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(Object.keys(COMPANIONS) as CompanionId[]).map((cId) => {
            const comp = COMPANIONS[cId];
            const lvl = player.ownedCompanions?.[cId] || 0;
            const isOwned = lvl > 0;
            const isActive = player.activeCompanion === cId;
            const isMax = lvl >= 30;
            const upCost = getCompanionUpgradeCost(lvl);

            const canUnlock = player.gold >= comp.unlockGold && player.crystals >= comp.unlockCrystals;
            const canUpgrade = !isMax && player.gold >= upCost.gold && player.contraband >= upCost.contraband;

            return (
              <div
                key={cId}
                className={`rounded-xl overflow-hidden border flex flex-col justify-between ${
                  isActive ? 'bg-[#171B28] border-amber-500' : 'bg-[#14161F] border-white/10'
                }`}
              >
                <div className="relative aspect-square w-full bg-[#0C0E14] border-b border-white/10">
                  <ResilientImage
                    src={comp.image}
                    alt={comp.name}
                    className="w-full h-full object-cover"
                    fallbackTitle={comp.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14161F] via-transparent to-transparent" />
                  <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-medium">{comp.role}</span>
                    {isOwned && <span className="font-num font-bold text-white">المستوى {lvl} / 30</span>}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-bold text-white">{comp.name}</h3>
                      {isActive && (
                        <span className="text-xs text-emerald-400 font-semibold inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>مرافق نشط</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-sky-300 font-medium">{comp.duelEffect}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{comp.description}</p>
                  </div>

                  {!isOwned ? (
                    <button
                      type="button"
                      disabled={player.gold < comp.unlockGold}
                      onClick={
                        player.crystals < comp.unlockCrystals
                          ? onOpenStore
                          : () => onUnlockOrUpgradeCompanion(cId)
                      }
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                    >
                      {player.crystals < comp.unlockCrystals
                        ? `استدعاء (${comp.unlockGold} ذهب + ${comp.unlockCrystals} بلورات · اشحن)`
                        : `استدعاء (${comp.unlockGold} ذهب + ${comp.unlockCrystals} بلورات)`}
                    </button>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        disabled={isActive}
                        onClick={() => onActivateCompanion(cId)}
                        className="w-full py-2 bg-[#1F2433] hover:bg-[#2A3044] disabled:bg-amber-600/20 disabled:text-amber-300 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        {isActive ? 'يرافقك حالياً' : 'تعيين كمرافق نشط'}
                      </button>

                      {!isMax && (
                        <button
                          type="button"
                          disabled={!canUpgrade}
                          onClick={() => onUnlockOrUpgradeCompanion(cId)}
                          className="w-full py-2 bg-sky-700 hover:bg-sky-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 font-num cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>
                            تدريب م{lvl + 1} ({upCost.gold} ذهب + {upCost.contraband} مهربات)
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-Tab 4: Black Market Exchange */}
      {subTab === 'market' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch bg-[#12141C] border border-white/10 rounded-xl overflow-hidden">
            <div className="lg:col-span-4 min-h-[160px] relative">
              <ResilientImage
                src={MARKET_VAULT_IMAGE}
                alt="صندوق بضائع السوق السوداء"
                className="w-full h-full object-cover"
                fallbackTitle="السوق السوداء"
              />
            </div>
            <div className="lg:col-span-8 p-5 flex flex-col justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-white mb-1">بورصة البضائع المحظورة</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  اشترِ عند انخفاض الأسعار وبِع في أوقات الذروة. ميزة فصيلك وأبحاث الخيمياء تمنحك خصم شراء{' '}
                  <span className="text-amber-400 font-semibold font-num">{Math.round((1 - buyDiscount) * 100)}%</span>{' '}
                  وعلاوة بيع{' '}
                  <span className="text-emerald-400 font-semibold font-num">+{Math.round((sellBonus - 1) * 100)}%</span>.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <span className="text-xs font-num text-zinc-400">تحديث الأسعار خلال {marketCountdown}ث</span>
                <button
                  type="button"
                  onClick={onRefreshMarket}
                  className="px-3.5 py-1.5 bg-[#1B1E2B] hover:bg-[#25293B] border border-white/10 text-xs font-medium text-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تحديث فوري</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {MARKET_COMMODITIES.map((comm) => {
              const state = player.market[comm.id];
              const isShocked = player.activeEventId === 'market_shock' && player.eventShockCommodityId === comm.id;
              const effectivePrice = isShocked
                ? Math.max(25, Math.round(state.currentPrice * (player.eventShockMultiplier || 1)))
                : state.currentPrice;
              const buyPrice = Math.max(10, Math.round(effectivePrice * buyDiscount));
              const sellPrice = Math.max(10, Math.round(effectivePrice * sellBonus));
              const diff = effectivePrice - state.previousPrice;
              const diffPct = state.previousPrice > 0 ? Math.round((diff / state.previousPrice) * 100) : 0;
              const isUp = diff >= 0;

              return (
                <div
                  key={comm.id}
                  className={`p-5 bg-[#14161F] border rounded-xl flex flex-col justify-between gap-4 ${
                    isShocked ? 'border-amber-500/60' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3.5">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-[#0C0E14] shrink-0">
                        <ResilientImage
                          src={comm.image}
                          alt={comm.name}
                          className="w-full h-full object-cover"
                          fallbackTitle={comm.name}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg font-bold text-white">{comm.name}</h3>
                          {isShocked && (
                            <span className="text-[11px] font-semibold text-amber-400">حدث سوق نشط</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{comm.description}</p>
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <div className="font-num text-xl font-bold text-amber-400">{effectivePrice} ذهب</div>
                      <div
                        className={`font-num text-xs inline-flex items-center gap-1 ${
                          isUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{isUp ? `+${diffPct}%` : `${diffPct}%`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-white/10 text-xs font-num">
                    <div>
                      <div className="text-zinc-500">المملوك</div>
                      <div className="text-zinc-100 font-semibold">
                        {state.owned} {comm.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-500">سعر الشراء</div>
                      <div className="text-zinc-200">{buyPrice}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">سعر البيع</div>
                      <div className="text-emerald-300">{sellPrice}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={player.gold < buyPrice}
                        onClick={() => onBuyCommodity(comm.id, 1)}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        شراء 1
                      </button>
                      <button
                        type="button"
                        disabled={player.gold < buyPrice * 5}
                        onClick={() => onBuyCommodity(comm.id, 5)}
                        className="px-3.5 py-2 bg-[#1D2130] hover:bg-[#262B3E] disabled:opacity-40 text-zinc-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        شراء 5
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={state.owned < 1}
                        onClick={() => onSellCommodity(comm.id, 1)}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        بيع 1
                      </button>
                      <button
                        type="button"
                        disabled={state.owned < 1}
                        onClick={() => onSellCommodity(comm.id, state.owned)}
                        className="px-3.5 py-2 bg-[#1D2130] hover:bg-[#262B3E] disabled:opacity-40 text-emerald-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        بيع الكل
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Live Timed Countdown Auction + Online Player Auction House */}
      {subTab === 'auction' && (
        <div className="space-y-6">
          {isOnline && timedAuction && (
            (() => {
              const secLeft = Math.max(0, Math.ceil((timedAuction.endsAt - now) / 1000));
              const mins = Math.floor(secLeft / 60);
              const secs = secLeft % 60;
              const ended = secLeft <= 0;
              const isLeader = timedAuction.highestBidderUid === myUid;
              const canClaim = ended && isLeader && !timedAuction.claimedByWinner;
              const canRotate = ended && (!timedAuction.highestBidderUid || timedAuction.claimedByWinner || now - timedAuction.endsAt > 15000);
              const nextBid250 = timedAuction.currentBid + 250;
              const nextBid750 = timedAuction.currentBid + 750;

              return (
                <div className="p-5 bg-[#12141C] border border-amber-500/45 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-400">
                      <Clock className="w-4 h-4" />
                      <span>المزاد السريع بالعد التنازلي · الجولة #{timedAuction.cycle}</span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span className="font-num text-rose-300">
                        {ended ? 'انتهى الوقت!' : `يتبقى ${mins}:${String(secs).padStart(2, '0')}`}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-white">{timedAuction.itemName}</h3>
                    <div className="text-xs font-num text-zinc-300">
                      أعلى مزايدة حالية:{' '}
                      <strong className="text-amber-400">{timedAuction.currentBid.toLocaleString('en-US')} ذهب</strong>
                      {timedAuction.highestBidderName
                        ? ` · المتصدر: ${timedAuction.highestBidderName}${isLeader ? ' (أنت)' : ''}`
                        : ' · لا توجد مزايدات بعد'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {!ended ? (
                      <>
                        <button
                          type="button"
                          disabled={isLeader || player.gold < nextBid250}
                          onClick={() => onBidTimedAuction(nextBid250)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                        >
                          مزايدة {nextBid250.toLocaleString('en-US')} ذهب
                        </button>
                        <button
                          type="button"
                          disabled={isLeader || player.gold < nextBid750}
                          onClick={() => onBidTimedAuction(nextBid750)}
                          className="px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                        >
                          قنص +{750} ({nextBid750.toLocaleString('en-US')})
                        </button>
                      </>
                    ) : canClaim ? (
                      <button
                        type="button"
                        onClick={onClaimTimedAuction}
                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        استلام جائزة المزاد الآن!
                      </button>
                    ) : canRotate ? (
                      <button
                        type="button"
                        onClick={onRotateTimedAuction}
                        className="px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        فتح مزاد سريع جديد
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-400">بانتظار استلام الفائز للجائزة...</span>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-[#14161F] border border-white/10 rounded-xl space-y-4 h-fit">
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-amber-400" />
              <h3 className="font-display text-lg font-bold text-white">طرح بضاعة في المزاد العالمي</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              اعرض فائض المهربات أو أحجار الصقل أو الأحجار الرونية للبيع مقابل الذهب أمام جميع اللاعبين المتصلين.
            </p>

            {!isOnline ? (
              <div className="p-4 bg-[#0E1016] border border-amber-500/30 rounded-lg text-xs text-amber-300">
                سجّل الدخول بحساب Google من القائمة الرئيسية لتفعيل المزاد الحي بين اللاعبين.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuctionType('contraband');
                      setAuctionQty(5);
                      setAuctionPrice(550);
                    }}
                    className={`py-2 rounded-lg border font-semibold cursor-pointer ${
                      auctionType === 'contraband' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#0E1016] border-white/10 text-zinc-300'
                    }`}
                  >
                    مهربات ({player.contraband})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuctionType('forge_stones');
                      setAuctionQty(3);
                      setAuctionPrice(900);
                    }}
                    className={`py-2 rounded-lg border font-semibold cursor-pointer ${
                      auctionType === 'forge_stones' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#0E1016] border-white/10 text-zinc-300'
                    }`}
                  >
                    صقل ({player.forgeStones})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuctionType('rune');
                      setAuctionQty(1);
                      setAuctionPrice(1400);
                    }}
                    className={`py-2 rounded-lg border font-semibold cursor-pointer ${
                      auctionType === 'rune' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#0E1016] border-white/10 text-zinc-300'
                    }`}
                  >
                    حجر روني
                  </button>
                </div>

                {auctionType === 'rune' && (
                  <select
                    value={auctionRuneId}
                    onChange={(e) => setAuctionRuneId(e.target.value as RuneId)}
                    className="w-full px-3 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-white"
                  >
                    {(Object.keys(RUNES_CATALOG) as RuneId[]).map((rId) => (
                      <option key={rId} value={rId}>
                        {RUNES_CATALOG[rId].name} (لديك: {player.ownedRunes?.[rId] || 0})
                      </option>
                    ))}
                  </select>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">الكمية</label>
                    <input
                      type="number"
                      min={1}
                      max={auctionType === 'rune' ? 1 : 200}
                      value={auctionQty}
                      disabled={auctionType === 'rune'}
                      onChange={(e) => setAuctionQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-white font-num"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">السعر المطلوب (ذهب)</label>
                    <input
                      type="number"
                      min={50}
                      max={10000000}
                      value={auctionPrice}
                      onChange={(e) => setAuctionPrice(Math.max(50, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-white font-num"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onCreateAuctionListing(
                      auctionType,
                      auctionType === 'rune' ? auctionRuneId : auctionType,
                      auctionType === 'rune' ? 1 : auctionQty,
                      auctionPrice
                    )
                  }
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  عرض في المزاد الآن
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 p-5 bg-[#14161F] border border-white/10 rounded-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-sky-400" />
                <h3 className="font-display text-lg font-bold text-white">العروض الحية في مزاد اللاعبين</h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={player.vipActive ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                  {player.vipActive ? 'رسوم مزاد VIP: 0%' : 'رسوم الوساطة: +8% (مجاناً لـ VIP)'}
                </span>
                {!player.vipActive && (
                  <button
                    type="button"
                    onClick={onOpenStore}
                    className="px-2.5 py-1 bg-amber-600/20 border border-amber-500/40 text-amber-300 rounded cursor-pointer"
                  >
                    إلغاء الرسوم
                  </button>
                )}
              </div>
            </div>

            {!isOnline ? (
              <p className="text-xs text-zinc-500 py-8 text-center">
                قم بتسجيل الدخول بحساب Google لاستعراض وشراء عروض اللاعبين المباشرة.
              </p>
            ) : auctionListings.length === 0 ? (
              <p className="text-xs text-zinc-500 py-8 text-center">
                لا توجد عروض مفتوحة حالياً — كن أول من يطرح بضاعة في المزاد!
              </p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pe-1">
                {auctionListings.map((listing) => {
                  const isMine = listing.sellerUid === myUid;
                  const totalCost = player.vipActive
                    ? listing.priceGold
                    : Math.round(listing.priceGold * 1.08);
                  return (
                    <div
                      key={listing.id}
                      className="p-4 bg-[#0E1016] border border-white/10 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-white">
                          {listing.itemName} <span className="font-num text-sky-300">×{listing.quantity}</span>
                        </div>
                        <div className="text-xs text-zinc-400">
                          البائع: <span className="text-zinc-200">{listing.sellerName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="font-num text-sm font-bold text-amber-400">
                          {totalCost.toLocaleString('en-US')} ذهب
                        </div>
                        {isMine ? (
                          <button
                            type="button"
                            onClick={() => onCancelAuctionListing(listing)}
                            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-rose-300 text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            إلغاء العرض
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={player.gold < totalCost}
                            onClick={() => onBuyAuctionListing(listing)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            شراء فوري
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 6: District Shares */}
      {subTab === 'shares' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {DISTRICT_SHARES.map((share) => {
            const owned = player.districtShares[share.id] || 0;
            const isMax = owned >= share.maxShares;
            const canAfford = player.gold >= share.sharePrice;

            return (
              <div
                key={share.id}
                className="bg-[#14161F] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-28 w-full bg-[#0C0E14] overflow-hidden border-b border-white/10">
                    <ResilientImage
                      src={share.image}
                      alt={share.name}
                      className="w-full h-full object-cover"
                      fallbackTitle={share.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14161F] via-[#14161F]/35 to-transparent" />
                    <div className="absolute bottom-2 inset-x-4 flex items-center justify-between text-xs font-num">
                      <span className="text-emerald-400 font-semibold">+{share.dividendPerCycle} ذهب / دورة</span>
                      <span className="text-zinc-200 font-semibold">
                        حصصك: {owned} / {share.maxShares}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 pb-3 space-y-2">
                    <h3 className="font-display text-lg font-bold text-white">{share.name}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{share.description}</p>
                    <div className="text-xs font-num text-zinc-300 pt-2">
                      الدخل الحالي من هذا الحي:{' '}
                      <strong className="text-amber-400">{owned * share.dividendPerCycle} ذهب / 15ث</strong>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    type="button"
                    disabled={isMax || !canAfford}
                    onClick={() => onBuyShare(share.id)}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg transition-colors font-num cursor-pointer"
                  >
                    {isMax ? 'اكتملت الحصص' : `استحواذ على حصة (${share.sharePrice} ذهب)`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
