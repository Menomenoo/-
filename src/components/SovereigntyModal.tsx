import React, { useState } from 'react';
import { COSMETICS_CATALOG } from '../data/gameData';
import { CosmeticId, PlayerSaveState } from '../types/game';
import { Check, CreditCard, Crown, Flame, Gem, Lock, Package, Palette, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';

interface SovereigntyModalProps {
  isOpen: boolean;
  player: PlayerSaveState;
  isOwnerAdmin: boolean;
  onClose: () => void;
  onToggleVipDemo: () => void;
  onClaimCrystalPack: (amount: number) => void;
  onBuySupplyCrate: () => void;
  onFullRecoveryWithCrystals: () => void;
  onBuyEventBundle: (bundleId: 'blood_moon_chest' | 'rune_master_pack') => void;
  onBuyCosmetic: (cosmeticId: CosmeticId) => void;
  onEquipCosmetic: (category: 'frame' | 'chat_color', cosmeticId: CosmeticId | null) => void;
}

const CRYSTAL_PACKS = [
  { id: 'pack_scout', crystals: 30, price: '$1.99', label: 'حزمة الكشاف', tag: '' },
  { id: 'pack_elite', crystals: 90, price: '$4.99', label: 'حزمة النخبة', tag: '' },
  { id: 'pack_popular', crystals: 210, price: '$9.99', label: 'الأكثر مبيعاً', tag: 'قيمة عالية' },
  { id: 'pack_baron', crystals: 480, price: '$19.99', label: 'خزنة البارون', tag: '+15% إضافية' },
  { id: 'pack_sovereign', crystals: 1350, price: '$49.99', label: 'خزنة السيادة الكبرى', tag: 'أفضل عرض' },
];

export const SovereigntyModal: React.FC<SovereigntyModalProps> = ({
  isOpen,
  player,
  isOwnerAdmin,
  onClose,
  onToggleVipDemo,
  onClaimCrystalPack,
  onBuySupplyCrate,
  onFullRecoveryWithCrystals,
  onBuyEventBundle,
  onBuyCosmetic,
  onEquipCosmetic,
}) => {
  const [tab, setTab] = useState<'store' | 'cosmetics' | 'monetization'>('store');
  const [pendingCheckout, setPendingCheckout] = useState<{
    title: string;
    price: string;
    details: string;
  } | null>(null);
  const [dauInput, setDauInput] = useState(2500);
  const [conversionRate, setConversionRate] = useState(4.5);

  if (!isOpen) return null;

  const payingUsers = Math.round(dauInput * (conversionRate / 100));
  const estMonthlyRevenue = Math.round(payingUsers * 18.5);
  const firstBonusAvailable = !player.firstPurchaseUsed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sovereignty-title"
    >
      <div className="bg-[#12141C] border border-white/15 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 id="sovereignty-title" className="font-display text-xl font-bold text-white">
              متجر السيادة ومظاهر النخبة
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setPendingCheckout(null);
              onClose();
            }}
            aria-label="إغلاق النافذة"
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-navigation */}
        <div className="px-6 pt-4 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setTab('store')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'store' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            المتجر وتذكرة الموسم الذهبية
          </button>
          <button
            type="button"
            onClick={() => setTab('cosmetics')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
              tab === 'cosmetics' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>مظاهر النخبة (تجميل)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('monetization')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'monetization' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            اقتصاد الشحن وحاسبة الأرباح
          </button>
        </div>

        <div className="p-6 space-y-6">
          {tab === 'store' ? (
            <>
              {/* Checkout Notice Banner when a paid item is clicked */}
              {pendingCheckout && (
                <div className="p-5 bg-[#181B26] border border-amber-500/60 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                      <CreditCard className="w-4 h-4" />
                      <span>طلب شراء: {pendingCheckout.title}</span>
                    </div>
                    <span className="font-num text-sm font-bold text-white">{pendingCheckout.price}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{pendingCheckout.details}</p>
                  <div className="p-3 bg-[#0E1016] border border-white/10 rounded-lg text-[11px] text-zinc-400 flex items-start gap-2">
                    <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>
                      الشحن محمي ولا يتم منح البلورات أو VIP مجاناً. لإتمام المدفوعات الحقيقية للجمهور، اربط بوابة الدفع (Stripe أو Google Pay / App Store) عبر الخادم لتسليم البلورات تلقائياً بعد تأكيد الدفع.
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPendingCheckout(null)}
                      className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 rounded-lg cursor-pointer"
                    >
                      إغلاق الطلب
                    </button>
                  </div>
                </div>
              )}

              {/* VIP Pass + Golden Battle Pass Card */}
              <div className="p-5 bg-[#181B26] border border-amber-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-amber-400">
                    اشتراك شهري متكرر · $4.99 / شهر · المسار الذهبي لتذكرة الموسم
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">تذكرة السيادة الليلية (Shadow VIP)</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    فتح المسار الذهبي (+85 بلورة موسمية إضافية وx2 ذهب) · 0% رسوم مزاد · +10% قوة قتالية · +20% غنائم مداهمات · -15% مدة المهام
                  </p>
                </div>
                {player.vipActive ? (
                  <div className="px-4 py-2.5 bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg inline-flex items-center gap-2 shrink-0">
                    <Check className="w-4 h-4" />
                    <span>عضوية VIP مفعّلة</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setPendingCheckout({
                        title: 'اشتراك تذكرة السيادة الليلية (VIP)',
                        price: '$4.99 / شهر',
                        details:
                          'يفتح المسار الذهبي الكامل لتذكرة الموسم (30 مرحلة)، يلغي رسوم المزاد 8%، ويزيد القوة +10% وغنائم المداهمات +20%.',
                      })
                    }
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer font-num"
                  >
                    اشتراك ($4.99 / شهر)
                  </button>
                )}
              </div>

              {/* Paid Crystal Top-Up Packs */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <h4 className="font-semibold text-zinc-200 inline-flex items-center gap-1.5">
                    <Gem className="w-4 h-4 text-rose-400" />
                    <span>شحن بلورات الظل (Crystal Top-Up)</span>
                  </h4>
                  {firstBonusAvailable ? (
                    <span className="text-emerald-400 font-semibold">
                      عرض الشحنة الأولى: مضاعفة x2 للبلورات على أي باقة!
                    </span>
                  ) : (
                    <span className="font-num text-rose-400 font-semibold">رصيدك: {player.crystals} بلورة</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {CRYSTAL_PACKS.map((pack) => (
                    <div
                      key={pack.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                        pack.id === 'pack_popular' || pack.id === 'pack_sovereign'
                          ? 'bg-[#171B28] border-amber-500/50'
                          : 'bg-[#0E1016] border-white/10'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-[11px] text-zinc-400">{pack.label}</div>
                        <div className="font-num text-lg font-bold text-rose-400 inline-flex items-center gap-1">
                          <Gem className="w-4 h-4" />
                          <span>{pack.crystals}</span>
                        </div>
                        {firstBonusAvailable && (
                          <div className="text-[11px] text-emerald-400 font-num font-semibold">
                            +{pack.crystals} هدية أول شحنة
                          </div>
                        )}
                        {pack.tag && <div className="text-[11px] text-amber-400 font-semibold">{pack.tag}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingCheckout({
                            title: `${pack.label} (${
                              firstBonusAvailable ? pack.crystals * 2 : pack.crystals
                            } بلورة)`,
                            price: pack.price,
                            details: firstBonusAvailable
                              ? `تشمل مضاعفة الشحنة الأولى: ${pack.crystals} بلورة أساسية + ${pack.crystals} بلورة إضافية مجاناً.`
                              : `إضافة ${pack.crystals} بلورة ظل إلى حسابك السحابي فوراً بعد إتمام الدفع.`,
                          })
                        }
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                      >
                        شراء ({pack.price})
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limited Live-Event Bundles (Crystal Sinks) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-semibold text-zinc-200 inline-flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span>حزم الأحداث النادرة (بالبلورات)</span>
                  </h4>
                  <span className="font-num text-rose-400 font-semibold">رصيدك: {player.crystals} بلورة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#14161F] border border-rose-500/30 rounded-xl flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                        <Flame className="w-4 h-4 text-rose-400" />
                        <span>صندوق حرب القمر القرمزي</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        يمنح +4,500 ذهب، +18 حجر صقل، +35 جوهر صياغة، وحجر السم القاتل.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={player.crystals < 45}
                      onClick={() => onBuyEventBundle('blood_moon_chest')}
                      className="w-full py-2 bg-rose-700 hover:bg-rose-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                    >
                      شراء الحزمة (45 بلورة)
                    </button>
                  </div>

                  <div className="p-4 bg-[#14161F] border border-sky-500/30 rounded-xl flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                        <Sparkles className="w-4 h-4 text-sky-400" />
                        <span>حزمة سيد الأحجار الرونية</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        يمنح +55 جوهر صياغة وحجرين رونيين عشوائيين للترصيع الفوري.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={player.crystals < 65}
                      onClick={() => onBuyEventBundle('rune_master_pack')}
                      className="w-full py-2 bg-sky-700 hover:bg-sky-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                    >
                      شراء الحزمة (65 بلورة)
                    </button>
                  </div>
                </div>
              </div>

              {/* Spend Crystals Inside Game */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-200">استبدال بلورات الظل السريع</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#14161F] border border-white/10 rounded-xl flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                        <Package className="w-4 h-4 text-amber-400" />
                        <span>صندوق الإمدادات السيادي</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        يمنح +1,800 إلى 2,600 ذهب + 10 مهربات + 6 أحجار صقل + 180 خبرة.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={player.crystals < 18}
                      onClick={onBuySupplyCrate}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                    >
                      فتح الصندوق (18 بلورة)
                    </button>
                  </div>

                  <div className="p-4 bg-[#14161F] border border-white/10 rounded-xl flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                        <Zap className="w-4 h-4 text-sky-400" />
                        <span>إعادة شحن كاملة للصحة والطاقة</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        يرفع الصحة والطاقة إلى 100% فوراً ويلغي فترة انتظار المداهمة.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={player.crystals < 8}
                      onClick={onFullRecoveryWithCrystals}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                    >
                      تنشيط فوري (8 بلورات)
                    </button>
                  </div>
                </div>
              </div>

              {/* Owner-Only Testing Panel (Hidden from normal players) */}
              {isOwnerAdmin && (
                <div className="p-4 bg-[#0E1016] border border-emerald-500/35 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>لوحة اختبار المالك فقط (غير مرئية للاعبين)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onToggleVipDemo}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 rounded-lg cursor-pointer"
                    >
                      {player.vipActive ? 'إيقاف VIP التجريبي' : 'تفعيل VIP التجريبي'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onClaimCrystalPack(50)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-rose-300 rounded-lg font-num cursor-pointer"
                    >
                      +50 بلورة للاختبار
                    </button>
                    <button
                      type="button"
                      onClick={() => onClaimCrystalPack(200)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-rose-300 rounded-lg font-num cursor-pointer"
                    >
                      +200 بلورة للاختبار
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : tab === 'cosmetics' ? (
            <div className="space-y-6">
              <div className="p-4 bg-[#14161F] border border-sky-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    مظاهر التميز والتجميل الحصرية
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    تأثيرات بصرية خالصة للهيبة في قاعة الظلال والشات العام (صفر تأثير قتالي — عدالة كاملة للجميع).
                  </p>
                </div>
                <span className="font-num text-xs font-bold text-rose-400">
                  رصيدك: {player.crystals} بلورة
                </span>
              </div>

              {/* Frames */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-amber-400">إطارات الاسم الملكية</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {COSMETICS_CATALOG.filter((c) => c.category === 'frame').map((item) => {
                    const owned = (player.ownedCosmetics || []).includes(item.id);
                    const equipped = player.equippedFrame === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          equipped ? 'bg-[#171B28] border-amber-500' : 'bg-[#0E1016] border-white/10'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="py-2 flex items-center justify-center bg-[#0B0C10] rounded-lg border border-white/5">
                            <span className={`text-xs font-bold ${item.cssClass}`}>{player.codename}</span>
                          </div>
                          <div className="text-sm font-bold text-white">{item.name}</div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{item.description}</p>
                        </div>

                        {owned ? (
                          <button
                            type="button"
                            onClick={() => onEquipCosmetic('frame', equipped ? null : item.id)}
                            className={`w-full py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                              equipped
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300'
                                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            {equipped ? 'إلغاء تجهيز الإطار' : 'تجهيز الإطار'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={player.crystals < item.priceCrystals}
                            onClick={() => onBuyCosmetic(item.id)}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                          >
                            اقتناء ({item.priceCrystals} بلورة)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Global Chat Colors */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-sky-400">ألوان الخط في راديو المدينة العام</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {COSMETICS_CATALOG.filter((c) => c.category === 'chat_color').map((item) => {
                    const owned = (player.ownedCosmetics || []).includes(item.id);
                    const equipped = player.equippedChatColor === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          equipped ? 'bg-[#171B28] border-sky-500' : 'bg-[#0E1016] border-white/10'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="p-2 bg-[#0B0C10] rounded-lg border border-white/5 text-[11px]">
                            <span className="text-zinc-400 me-1">{player.codename}:</span>
                            <span className={item.cssClass}>من يتحدى خزنتي الليلة؟</span>
                          </div>
                          <div className="text-sm font-bold text-white">{item.name}</div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{item.description}</p>
                        </div>

                        {owned ? (
                          <button
                            type="button"
                            onClick={() => onEquipCosmetic('chat_color', equipped ? null : item.id)}
                            className={`w-full py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                              equipped
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-sky-300'
                                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            {equipped ? 'إلغاء اللون' : 'تفعيل اللون'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={player.crystals < item.priceCrystals}
                            onClick={() => onBuyCosmetic(item.id)}
                            className="w-full py-2 bg-sky-700 hover:bg-sky-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold rounded-lg font-num cursor-pointer"
                          >
                            اقتناء ({item.priceCrystals} بلورة)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-4 bg-[#14161F] border border-white/10 rounded-xl space-y-2">
                <h3 className="font-display text-base font-bold text-white">
                  هيكلة الأرباح المتوازنة (تندير البلورات + VIP + مزاد اللاعبين)
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  تم تندير البلورات المجانية بحيث تأتي من الإنجازات طويلة المدى وزعماء القطاعات فقط، بينما يتركز الدخل التجاري في اشتراك المسار الذهبي VIP ($4.99)، مضاعفة أول شحنة، وحزم العتاد السيادي والأحجار الرونية.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-[#0E1016] border border-white/10 rounded-xl space-y-1">
                  <div className="text-amber-400 font-semibold">1. اشتراك VIP والمسار الذهبي</div>
                  <p className="text-zinc-400">يمنح +85 بلورة إضافية عبر 30 مرحلة، 0% رسوم مزاد، ومضاعفة الذهب.</p>
                </div>
                <div className="p-4 bg-[#0E1016] border border-white/10 rounded-xl space-y-1">
                  <div className="text-rose-400 font-semibold">2. العتاد السيادي والأحجار</div>
                  <p className="text-zinc-400">أقوى الأسلحة والقدرات وحزم الأحداث تتطلب استثماراً حقيقياً في البلورات.</p>
                </div>
                <div className="p-4 bg-[#0E1016] border border-white/10 rounded-xl space-y-1">
                  <div className="text-emerald-400 font-semibold">3. اقتصاد تسريع الوقت</div>
                  <p className="text-zinc-400">تجاوز انتظار المداهمات وشحن الطاقة في ساعات حروب الأقاليم والبطولات.</p>
                </div>
              </div>

              {/* Interactive Revenue Estimator */}
              <div className="p-5 bg-[#14161F] border border-white/10 rounded-xl space-y-4">
                <div className="text-sm font-semibold text-white">حاسبة العائد الشهري المتوقع</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5 font-num">
                      اللاعبون النشطون يومياً (DAU): <strong className="text-white">{dauInput.toLocaleString('en-US')}</strong>
                    </label>
                    <input
                      type="range"
                      min={500}
                      max={20000}
                      step={500}
                      value={dauInput}
                      onChange={(e) => setDauInput(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5 font-num">
                      نسبة المشتركين والدافعين: <strong className="text-white">{conversionRate}%</strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      step={0.5}
                      value={conversionRate}
                      onChange={(e) => setConversionRate(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-num">
                  <span className="text-zinc-400">
                    مشتركون فعليون: <strong className="text-zinc-100">{payingUsers.toLocaleString('en-US')}</strong>
                  </span>
                  <span className="text-emerald-400 text-sm font-bold">
                    العائد الشهري التقديري: ${estMonthlyRevenue.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
