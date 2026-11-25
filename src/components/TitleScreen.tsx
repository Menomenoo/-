import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { FACTIONS, HERO_CITY_IMAGE } from '../data/gameData';
import { FactionId, PlayerSaveState } from '../types/game';
import { ResilientImage } from './ResilientImage';
import { Cloud, LogIn, LogOut, Play, RotateCcw, ShieldCheck } from 'lucide-react';

interface TitleScreenProps {
  existingSave: PlayerSaveState | null;
  cloudSave: PlayerSaveState | null;
  authUser: User | null;
  authLoading: boolean;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  onContinue: (source: 'cloud' | 'local') => void;
  onStartNew: (codename: string, factionId: FactionId) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  existingSave,
  cloudSave,
  authUser,
  authLoading,
  onGoogleSignIn,
  onGoogleSignOut,
  onContinue,
  onStartNew,
}) => {
  const activeSave = authUser && cloudSave ? cloudSave : existingSave;
  const [codename, setCodename] = useState(activeSave?.codename || '');
  const [selectedFaction, setSelectedFaction] = useState<FactionId>('shadow_hunters');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartNew(codename.trim() || 'شبح الليل', selectedFaction);
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-zinc-100 flex flex-col">
      {/* Hero Banner Split */}
      <section className="relative border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0">
          <ResilientImage
            src={HERO_CITY_IMAGE}
            alt="مدينة صراع الفصائل والظلال ليلاً"
            className="w-full h-full object-cover opacity-35"
            fallbackTitle="المدينة الليلية"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/75 to-[#0B0C10]/50" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-10 lg:py-14 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm text-amber-400 font-medium mb-3">
                لعبة تقمص الأدوار الليلية · أونلاين متعددة اللاعبين · برج الظلال وحروب الأقاليم
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
                صراع الفصائل والظلال
              </h1>
              <p className="text-base text-zinc-300 leading-relaxed">
                اختر ولاءك في مدينة تحكمها التحالفات الخفية. تسلّق برج الظلال اللانهائي، نافس على أقاليم المدينة الستة، رصّع أسلحتك بالأحجار الرونية، وتاجر مع اللاعبين في المزاد والعشائر الحية.
              </p>
            </div>

            {/* Online Auth Card */}
            <div className="p-4 bg-[#14161F]/95 border border-white/15 rounded-xl w-full lg:w-80 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-sky-400 font-semibold">
                  <Cloud className="w-4 h-4" />
                  <span>الحفظ السحابي واللعب أونلاين</span>
                </span>
              </div>

              {authLoading ? (
                <p className="text-xs text-zinc-400">جاري التحقق من الجلسة...</p>
              ) : authUser ? (
                <div className="space-y-3">
                  <div className="text-xs text-zinc-300 space-y-0.5">
                    <div className="font-semibold text-white truncate">
                      {authUser.displayName || 'عميل متصل'}
                    </div>
                    <div className="text-zinc-400 truncate">{authUser.email}</div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-emerald-400 font-medium">
                      متصل بالمزاد والعشائر والترتيب الحي
                    </span>
                    <button
                      type="button"
                      onClick={onGoogleSignOut}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-md inline-flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>خروج</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    سجّل بحساب Google لمزامنة تقدمك سحابياً والانضمام للعشائر الحية ومزاد اللاعبين.
                  </p>
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول بحساب Google</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {authUser && cloudSave && (
              <div className="p-5 bg-[#14161F]/90 border border-sky-500/40 rounded-lg max-w-xl flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-sky-400 mb-1">حملة سحابية جاهزة للمتابعة</p>
                  <div className="flex items-center gap-2 text-base font-semibold text-white">
                    <span>{cloudSave.codename}</span>
                    <span aria-hidden="true" className="text-zinc-500">·</span>
                    <span className="text-amber-400">{FACTIONS[cloudSave.factionId].name}</span>
                    <span aria-hidden="true" className="text-zinc-500">·</span>
                    <span className="font-num text-sm text-zinc-300">المستوى {cloudSave.level}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onContinue('cloud')}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>متابعة السحابي</span>
                </button>
              </div>
            )}

            {existingSave && (
              <div className="p-5 bg-[#14161F]/90 border border-amber-500/30 rounded-lg max-w-xl flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-400 mb-1">حملة محفوظة محلياً</p>
                  <div className="flex items-center gap-2 text-base font-semibold text-white">
                    <span>{existingSave.codename}</span>
                    <span aria-hidden="true" className="text-zinc-500">·</span>
                    <span className="text-amber-400">{FACTIONS[existingSave.factionId].name}</span>
                    <span aria-hidden="true" className="text-zinc-500">·</span>
                    <span className="font-num text-sm text-zinc-300">المستوى {existingSave.level}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onContinue('local')}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>متابعة اللعب</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Faction Selection & New Campaign Form */}
      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-white mb-1">
                {activeSave ? 'بدء حملة جديدة واختيار الفصيل' : 'أنشئ ملفك السري واختر فصيلك'}
              </h2>
              <p className="text-sm text-zinc-400">
                لكل فصيل نقاط قوة قتالية واقتصادية فريدة وتخصصان فرعيان وشجرة مهارات خاصة به.
              </p>
            </div>

            <div className="w-full md:w-80">
              <label htmlFor="codename-input" className="block text-xs font-medium text-zinc-300 mb-2">
                الاسم الحركي للعميل
              </label>
              <input
                id="codename-input"
                type="text"
                maxLength={24}
                value={codename}
                onChange={(e) => setCodename(e.target.value)}
                placeholder="مثال: صقر الظلام"
                className="w-full px-4 py-2.5 bg-[#14161F] border border-white/15 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* 3 Faction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(FACTIONS) as FactionId[]).map((fId) => {
              const faction = FACTIONS[fId];
              const isSelected = selectedFaction === fId;
              return (
                <button
                  key={fId}
                  type="button"
                  onClick={() => setSelectedFaction(fId)}
                  className={`text-start rounded-xl overflow-hidden border transition-all duration-150 flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    isSelected
                      ? 'bg-[#181B26] border-amber-500 shadow-lg shadow-amber-950/20'
                      : 'bg-[#12141C] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-[#0E1016]">
                    <ResilientImage
                      src={faction.portrait}
                      alt={faction.name}
                      className="w-full h-full object-cover"
                      fallbackTitle={faction.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12141C] via-transparent to-transparent" />
                    <div className="absolute bottom-3 inset-x-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-300">{faction.englishName}</span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                          <ShieldCheck className="w-4 h-4" />
                          <span>مختار</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-display text-xl font-bold text-white mb-1">{faction.name}</h3>
                      <p className="text-xs text-amber-400/90 font-medium mb-3">{faction.bonusSummary}</p>
                      <p className="text-sm text-zinc-400 leading-relaxed">{faction.description}</p>
                    </div>

                    <div className="pt-3 border-t border-white/10 grid grid-cols-5 gap-2 text-center">
                      <div>
                        <div className="text-[11px] text-zinc-500">هجوم</div>
                        <div className="font-num text-sm font-semibold text-zinc-200">{faction.startingStats.attack}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-zinc-500">دفاع</div>
                        <div className="font-num text-sm font-semibold text-zinc-200">{faction.startingStats.defense}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-zinc-500">رشاقة</div>
                        <div className="font-num text-sm font-semibold text-zinc-200">{faction.startingStats.agility}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-zinc-500">براعة</div>
                        <div className="font-num text-sm font-semibold text-zinc-200">{faction.startingStats.mastery}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-zinc-500">نفوذ</div>
                        <div className="font-num text-sm font-semibold text-zinc-200">{faction.startingStats.influence}</div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-zinc-400">
              {authUser
                ? 'سيتم حفظ تقدمك تلقائياً في السحابة ومشاركته في حروب الأقاليم والمزاد الحي.'
                : 'يمكنك اللعب فوراً محلياً أو تسجيل الدخول بحساب Google للعب أونلاين.'}
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {activeSave ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{activeSave ? 'بدء حملة جديدة' : 'ابدأ اللعبة الآن'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
