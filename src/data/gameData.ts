import {
  AchievementDef,
  ArenaOpponentDef,
  ClanUnitDef,
  ClanUnitId,
  CombatSkillDef,
  CompanionDef,
  CompanionId,
  CoopHeistTemplateDef,
  CosmeticDef,
  DailyQuestDef,
  DistrictShareDef,
  EquipmentItem,
  EquipmentSetDef,
  FactionDef,
  FactionId,
  HqModuleDef,
  HqModuleId,
  LiveEventId,
  MarketCommodity,
  MarketStateItem,
  MissionDef,
  NightHuntZoneDef,
  PlayerSaveState,
  ResearchDef,
  ResearchId,
  RuneDef,
  RuneId,
  SeasonHallEntryDoc,
  StoryCaseDef,
  SubSpecDef,
  TerritoryDistrictDef,
  WorldBossDef,
} from '../types/game';

export const HERO_CITY_IMAGE = '/src/assets/images/hero_nocturnal_city_1795531797324.jpg';
export const HQ_CITADEL_IMAGE = '/src/assets/images/hq_fortress_citadel_1795531800256.jpg';
export const MISSION_DISTRICTS_IMAGE = '/src/assets/images/mission_noir_districts_1795534508009.jpg';
export const MARKET_VAULT_IMAGE = '/src/assets/images/market_contraband_vault_1795534476843.jpg';
export const BOSS_LEVIATHAN_IMAGE = '/src/assets/images/boss_shadow_leviathan_1795534477104.jpg';
export const ARENA_COLOSSEUM_IMAGE = '/src/assets/images/arena_shadow_colosseum_1795535493095.jpg';
export const TOWER_SPIRE_IMAGE = '/src/assets/images/tower_shadow_spire_1795556132432.jpg';
export const TERRITORY_MAP_IMAGE = '/src/assets/images/territory_city_map_1795556134632.jpg';
export const RUNES_FORGE_IMAGE = '/src/assets/images/runes_forge_altar_1795556134155.jpg';
export const CLAN_RAID_BOSS_IMAGE = '/src/assets/images/clan_raid_colossus_1795562522869.jpg';
export const FORGED_WEAPON_IMAGE = '/src/assets/images/weapon_forged_mythic_1795562523452.jpg';

export const SKILL_BLEED_IMAGE = '/src/assets/images/skill_bleed_edge_1795606273159.jpg';
export const SKILL_MIRROR_IMAGE = '/src/assets/images/skill_mirror_ward_1795606275684.jpg';
export const SKILL_STUN_IMAGE = '/src/assets/images/skill_shadow_stun_1795606273929.jpg';
export const SKILL_SIPHON_IMAGE = '/src/assets/images/skill_crimson_siphon_1795606275061.jpg';
export const SKILL_OVERCHARGE_IMAGE = '/src/assets/images/skill_overcharge_blast_1795606275220.jpg';
export const SKILL_EVADE_IMAGE = '/src/assets/images/skill_tactical_evade_1795606275907.jpg';

export const HQ_VAULT_GATE_IMAGE = '/src/assets/images/hq_vault_gate_1795606276186.jpg';
export const HQ_POWER_CORE_IMAGE = '/src/assets/images/hq_power_core_1795606276698.jpg';
export const HQ_TRAP_GRID_IMAGE = '/src/assets/images/hq_trap_grid_1795606277582.jpg';
export const HQ_REFINERY_IMAGE = '/src/assets/images/hq_refinery_1795606441078.jpg';

export const RES_REFINERY_IMAGE = '/src/assets/images/res_refinery_protocol_1795606277535.jpg';
export const RES_LETHAL_IMAGE = '/src/assets/images/res_lethal_precision_1795606278487.jpg';
export const RES_ALCHEMY_IMAGE = '/src/assets/images/res_alchemy_archive_1795606279333.jpg';
export const RES_ENDURANCE_IMAGE = '/src/assets/images/res_eternal_endurance_1795606388012.jpg';
export const RES_INTEL_IMAGE = '/src/assets/images/res_intel_network_1795606280501.jpg';

export const RUNE_POISON_IMAGE = '/src/assets/images/rune_poison_1795606387623.jpg';
export const RUNE_LIFESTEAL_IMAGE = '/src/assets/images/rune_lifesteal_1795606440970.jpg';
export const RUNE_PIERCE_IMAGE = '/src/assets/images/rune_armor_pierce_1795606441812.jpg';
export const RUNE_CRIT_IMAGE = '/src/assets/images/rune_crit_surge_1795606442356.jpg';

export const COMM_BLOOD_INGOTS_IMAGE = '/src/assets/images/comm_blood_ingots_1795606442728.jpg';
export const COMM_CIPHER_CHIPS_IMAGE = '/src/assets/images/comm_cipher_chips_1795606442946.jpg';
export const COMM_SHADOW_ELIXIR_IMAGE = '/src/assets/images/comm_shadow_elixir_1795606284379.jpg';
export const COMM_FORBIDDEN_SCROLLS_IMAGE = '/src/assets/images/comm_forbidden_scrolls_1795606387245.jpg';

export const ATTRIBUTE_IMAGES = {
  attack: RES_LETHAL_IMAGE,
  defense: SKILL_MIRROR_IMAGE,
  agility: SKILL_EVADE_IMAGE,
  mastery: RES_INTEL_IMAGE,
  influence: RES_ALCHEMY_IMAGE,
} as const;

export const FACTIONS: Record<FactionId, FactionDef> = {
  shadow_hunters: {
    id: 'shadow_hunters',
    name: 'صائدو الظلال',
    englishName: 'Shadow Hunters',
    motto: 'نضرب قبل أن يرتد الطرف، ونختفي في الضباب',
    description:
      'أخوية قتلة ومخترقي خزائن يحكمون أزقة المدينة المظلمة. يعتمدون على السرعة الفائقة والضربات الحاسمة وسلب القوافل الليلية.',
    portrait: '/src/assets/images/faction_shadow_hunters_1795531798104.jpg',
    accentHex: '#D97706',
    bonusSummary: '+15% غنائم المداهمات · +8% فرصة الضربة الحاسمة',
    startingStats: {
      attack: 14,
      defense: 9,
      agility: 16,
      mastery: 10,
      influence: 11,
    },
    bonuses: {
      raidLootMult: 1.15,
      critBonus: 0.08,
      defenseMult: 1.0,
      energyCostDiscount: 0,
      missionGoldMult: 1.05,
      marketMarginBonus: 0.02,
    },
    perks: [
      {
        id: 'sh_phantom_step',
        name: 'خطوة الشبح',
        description: 'يزيد فرصة تفادي الهجمات المرتدة بنسبة 10% أثناء مداهمة المخازن.',
        image: SKILL_EVADE_IMAGE,
        unlockLevel: 2,
        costGold: 650,
        costCrystals: 0,
        effectLabel: '+10% تفادي في المداهمات',
      },
      {
        id: 'sh_vault_ripper',
        name: 'كاسر الأقفال',
        description: 'يضاعف البضائع المهربة المسروقة من مخازن الخصوم بنسبة +30%.',
        image: HQ_VAULT_GATE_IMAGE,
        unlockLevel: 5,
        costGold: 2200,
        costCrystals: 12,
        effectLabel: '+30% بضائع مهربة',
      },
      {
        id: 'sh_eclipse_blade',
        name: 'نصل الكسوف',
        description: 'يمنح ضربة حاسمة مضمونة في الجولة الأولى من كل مداهمة.',
        image: SKILL_BLEED_IMAGE,
        unlockLevel: 10,
        costGold: 6500,
        costCrystals: 35,
        effectLabel: 'ضربة افتتاحية حاسمة',
      },
    ],
  },
  tech_wardens: {
    id: 'tech_wardens',
    name: 'حراس التكنولوجيا',
    englishName: 'Tech Wardens',
    motto: 'النظام هو الدرع، والبيانات هي السلاح الأبدي',
    description:
      'تحالف من المهندسين القتاليين وحماة البنية التحتية السرية. يمتلكون أعلى قدرة على تحصين المقرات وتوليد الطاقة المستمرة.',
    portrait: '/src/assets/images/faction_tech_wardens_1795531798305.jpg',
    accentHex: '#38BDF8',
    bonusSummary: '+18% صلابة الدفاع · -1 تكلفة طاقة للمهام',
    startingStats: {
      attack: 11,
      defense: 16,
      agility: 10,
      mastery: 13,
      influence: 10,
    },
    bonuses: {
      raidLootMult: 1.0,
      critBonus: 0.02,
      defenseMult: 1.18,
      energyCostDiscount: 1,
      missionGoldMult: 1.05,
      marketMarginBonus: 0.03,
    },
    perks: [
      {
        id: 'tw_reactive_plating',
        name: 'دروع تفاعلية',
        description: 'يعكس 15% من ضرر الخصم في المداهمات كضرر تقني مباشر.',
        image: SKILL_MIRROR_IMAGE,
        unlockLevel: 2,
        costGold: 650,
        costCrystals: 0,
        effectLabel: 'عكس 15% من الضرر',
      },
      {
        id: 'tw_grid_overclock',
        name: 'كسر سرعة المفاعل',
        description: 'يزيد إنتاج المقر السري من الذهب بنسبة +25% في كل دورة.',
        image: HQ_POWER_CORE_IMAGE,
        unlockLevel: 5,
        costGold: 2200,
        costCrystals: 12,
        effectLabel: '+25% عائد المقر',
      },
      {
        id: 'tw_orbital_lock',
        name: 'قفل المدار الليلي',
        description: 'يرفع نسبة الذهب المحمي في الخزنة إلى 90% ويمنح +18 دفاعاً.',
        image: HQ_VAULT_GATE_IMAGE,
        unlockLevel: 10,
        costGold: 6500,
        costCrystals: 35,
        effectLabel: 'حماية خزنة 90% + 18 دفاع',
      },
    ],
  },
  blood_mages: {
    id: 'blood_mages',
    name: 'سحرة الدم',
    englishName: 'Blood Mages',
    motto: 'من القوة القرمزية نُعيد صياغة موازين الليل',
    description:
      'نخبة أرستقراطية غامضة تمزج الكيمياء المحرمة بالتحكم في الأسواق السوداء. يستنزفون طاقة الخصوم ويضاعفون الأرباح التجارية.',
    portrait: '/src/assets/images/faction_blood_mages_1795531799554.jpg',
    accentHex: '#EF4444',
    bonusSummary: '+15% عوائد المهام · +8% هامش ربح السوق السوداء',
    startingStats: {
      attack: 12,
      defense: 10,
      agility: 11,
      mastery: 16,
      influence: 14,
    },
    bonuses: {
      raidLootMult: 1.05,
      critBonus: 0.04,
      defenseMult: 1.0,
      energyCostDiscount: 0,
      missionGoldMult: 1.15,
      marketMarginBonus: 0.08,
    },
    perks: [
      {
        id: 'bm_crimson_siphon',
        name: 'امتصاص قرمزي',
        description: 'يستعيد 20% من الضرر الملحق بالخصم كصحة أثناء المداهمة.',
        image: SKILL_SIPHON_IMAGE,
        unlockLevel: 2,
        costGold: 650,
        costCrystals: 0,
        effectLabel: 'سرقة حياة 20%',
      },
      {
        id: 'bm_black_alchemy',
        name: 'خيمياء السوق السوداء',
        description: 'يخفض تكلفة شراء البضائع في البورصة بنسبة 8% ويزيد سعر البيع 8%.',
        image: RES_ALCHEMY_IMAGE,
        unlockLevel: 5,
        costGold: 2200,
        costCrystals: 12,
        effectLabel: '+16% كفاءة تجارية',
      },
      {
        id: 'bm_ruby_pact',
        name: 'ميثاق الياقوت',
        description: 'يزيد فرصة العثور على أحجار الصقل وجوهر الصياغة في المهام بنسبة +12%.',
        image: RUNE_LIFESTEAL_IMAGE,
        unlockLevel: 10,
        costGold: 6500,
        costCrystals: 35,
        effectLabel: '+12% فرصة موارد نادرة',
      },
    ],
  },
};

export const NIGHT_HUNT_ZONES: NightHuntZoneDef[] = [
  {
    id: 'hunt_slums',
    name: 'أزقة الصيادين المظلمة',
    description: 'صيد سريع لعملاء الفصائل المنفردين ومخبآت الذهب الصغيرة.',
    image: MISSION_DISTRICTS_IMAGE,
    energyCost: 1,
    minLevel: 1,
    goldRange: [95, 195],
    xpReward: 28,
    treasureChance: 0.25,
    riskDamage: [3, 8],
  },
  {
    id: 'hunt_docks',
    name: 'أرصفة الضباب والمهربين',
    description: 'مواجهات متوسطة الخطورة مع حراس الشحنات الليلية ومخازن الصقل.',
    image: MARKET_VAULT_IMAGE,
    energyCost: 2,
    minLevel: 3,
    goldRange: [260, 480],
    xpReward: 68,
    treasureChance: 0.4,
    riskDamage: [8, 16],
  },
  {
    id: 'hunt_manor',
    name: 'أطلال قصر الكسوف',
    description: 'صيد نخبة يمنح غنائم ضخمة وأحجار صقل وفرصة كنوز نادرة.',
    image: TOWER_SPIRE_IMAGE,
    energyCost: 3,
    minLevel: 7,
    goldRange: [650, 1180],
    xpReward: 150,
    treasureChance: 0.58,
    riskDamage: [15, 28],
  },
];

export const MISSIONS: MissionDef[] = [
  {
    id: 'alley_patrol',
    title: 'استطلاع الأزقة الخلفية',
    district: 'القطاع الشمالي',
    description: 'مراقبة تحركات الكشافة المعادين وجمع بيانات التمويل السرية من المخبرين.',
    image: MISSION_DISTRICTS_IMAGE,
    durationSec: 10,
    energyCost: 2,
    minLevel: 1,
    rewardGold: [150, 240],
    rewardXp: 40,
    contrabandChance: 0.4,
    contrabandAmount: [1, 3],
    forgeStoneChance: 0.35,
    crystalChance: 0,
    riskDamage: [4, 9],
  },
  {
    id: 'dock_smuggling',
    title: 'تأمين شحنة الميناء المظلم',
    district: 'الميناء التجاري',
    description: 'استلام حاويات مشفرة تحت جنح الضباب قبل تدخل دوريات الفصائل المنافسة.',
    image: MARKET_VAULT_IMAGE,
    durationSec: 20,
    energyCost: 3,
    minLevel: 1,
    rewardGold: [320, 480],
    rewardXp: 75,
    contrabandChance: 0.65,
    contrabandAmount: [2, 5],
    forgeStoneChance: 0.5,
    crystalChance: 0,
    riskDamage: [8, 16],
  },
  {
    id: 'vault_intercept',
    title: 'اعتراض قافلة المصرف السري',
    district: 'الحي المالي',
    description: 'نصب كمين لسيارة نقل سبائك الدم والرقائق المالية بين ناطحات السحاب.',
    image: HERO_CITY_IMAGE,
    durationSec: 35,
    energyCost: 4,
    minLevel: 3,
    rewardGold: [620, 920],
    rewardXp: 140,
    contrabandChance: 0.78,
    contrabandAmount: [4, 8],
    forgeStoneChance: 0.65,
    crystalChance: 0,
    riskDamage: [14, 24],
  },
  {
    id: 'subway_breach',
    title: 'اختراق أنفاق المترو المهجورة',
    district: 'شبكة الأنفاق',
    description: 'تفكيك نقاط تفتيش العدو تحت الأرض والاستيلاء على محطات الترحيل.',
    image: TERRITORY_MAP_IMAGE,
    durationSec: 50,
    energyCost: 5,
    minLevel: 6,
    rewardGold: [1100, 1600],
    rewardXp: 240,
    contrabandChance: 0.88,
    contrabandAmount: [6, 12],
    forgeStoneChance: 0.8,
    crystalChance: 0,
    riskDamage: [20, 32],
  },
  {
    id: 'cathedral_heist',
    title: 'سرقة أرشيف الكاتدرائية القوطية',
    district: 'المدينة القديمة',
    description: 'تسلل عالي الخطورة لانتزاع مخطوطات محرمة من خزائن الفصيل المنافس.',
    image: HQ_CITADEL_IMAGE,
    durationSec: 75,
    energyCost: 6,
    minLevel: 10,
    rewardGold: [2100, 3100],
    rewardXp: 420,
    contrabandChance: 0.95,
    contrabandAmount: [9, 16],
    forgeStoneChance: 0.95,
    crystalChance: 0,
    riskDamage: [26, 40],
  },
  {
    id: 'eclipse_citadel',
    title: 'عملية برج الكسوف السيادية',
    district: 'البرج المركزي',
    description: 'أخطر عمليات الليل لاختراق خزائن مجلس الظل الأعلى وجلب أحجار الصقل النادرة.',
    image: TOWER_SPIRE_IMAGE,
    durationSec: 110,
    energyCost: 7,
    minLevel: 16,
    rewardGold: [4200, 6200],
    rewardXp: 820,
    contrabandChance: 1.0,
    contrabandAmount: [14, 24],
    forgeStoneChance: 1.0,
    crystalChance: 0.04,
    riskDamage: [32, 50],
  },
];

export const ARENA_OPPONENTS: ArenaOpponentDef[] = [
  {
    id: 'arena_novice',
    name: 'مبارز الأزقة — كايل',
    factionId: 'shadow_hunters',
    tierLabel: 'التحدي البرونزي',
    hp: 160,
    attack: 18,
    defense: 12,
    rewardGold: 420,
    rewardRating: 25,
    rewardForgeStones: 2,
    rewardCrystals: 0,
    rewardXp: 110,
  },
  {
    id: 'arena_warden',
    name: 'قائد الدروع — ڤيكتور',
    factionId: 'tech_wardens',
    tierLabel: 'التحدي الفضي',
    hp: 340,
    attack: 34,
    defense: 28,
    rewardGold: 980,
    rewardRating: 45,
    rewardForgeStones: 4,
    rewardCrystals: 0,
    rewardXp: 260,
  },
  {
    id: 'arena_magus',
    name: 'ساحر الدم — سيباستيان',
    factionId: 'blood_mages',
    tierLabel: 'التحدي الذهبي',
    hp: 680,
    attack: 62,
    defense: 46,
    rewardGold: 2250,
    rewardRating: 75,
    rewardForgeStones: 7,
    rewardCrystals: 1,
    rewardXp: 580,
  },
  {
    id: 'arena_champion',
    name: 'بطل الكولوسيوم — دراكو',
    factionId: 'shadow_hunters',
    tierLabel: 'تحدي السيادة',
    hp: 1350,
    attack: 110,
    defense: 82,
    rewardGold: 5400,
    rewardRating: 130,
    rewardForgeStones: 14,
    rewardCrystals: 2,
    rewardXp: 1350,
  },
];

export const COMPANIONS: Record<CompanionId, CompanionDef> = {
  shadow_raven: {
    id: 'shadow_raven',
    name: 'غراب الكاتدرائية المدرع',
    role: 'مرافق هجوم وسرعة',
    description: 'يهاجم الخصم في كل جولة بالحلبة ويزيد الرشاقة والضربات الحاسمة.',
    image: '/src/assets/images/companion_shadow_raven_1795535492189.jpg',
    unlockGold: 1500,
    unlockCrystals: 10,
    statPerLevel: { attack: 4, agility: 4 },
    duelEffect: 'ضربة مخالب تلقائية كل جولة في الحلبة',
  },
  tech_drone: {
    id: 'tech_drone',
    name: 'درون المراقبة الشبحية',
    role: 'مرافق دفاع وتقنية',
    description: 'يرفع الصلابة الدفاعية ويطلق أشعة تعطيل في الحلبة ويقلل ضرر الخصم.',
    image: '/src/assets/images/companion_tech_drone_1795535493155.jpg',
    unlockGold: 2400,
    unlockCrystals: 16,
    statPerLevel: { defense: 5, mastery: 3 },
    duelEffect: 'درع طاقة + ضرر ليزر تلقائي كل جولة',
  },
  blood_hound: {
    id: 'blood_hound',
    name: 'ذئب الدم القرمزي',
    role: 'مرافق استنزاف ونفوذ',
    description: 'يمزق دفاع الخصوم في الحلبة ويمتص جزءاً من صحتهم ليعالجك تلقائياً.',
    image: '/src/assets/images/companion_blood_hound_1795535494053.jpg',
    unlockGold: 3600,
    unlockCrystals: 24,
    statPerLevel: { attack: 5, influence: 4 },
    duelEffect: 'عضة قرمزية + استعادة صحة تلقائية كل جولة',
  },
};

export const CLAN_UNITS: Record<ClanUnitId, ClanUnitDef> = {
  night_scouts: {
    id: 'night_scouts',
    name: 'كشافة الأزقة',
    description: 'مقاتلون سريعون يراقبون حدود مقرك ويرفعون قوة عشيرتك في التصنيف.',
    image: '/src/assets/images/faction_shadow_hunters_1795531798104.jpg',
    costGold: 350,
    costContraband: 2,
    powerEach: 18,
  },
  iron_sentinels: {
    id: 'iron_sentinels',
    name: 'حراس البوابات المدرعون',
    description: 'وحدة ثقيلة تحمي خزائن العشيرة وتضاعف هيبتها في حروب المدينة.',
    image: '/src/assets/images/faction_tech_wardens_1795531798305.jpg',
    costGold: 950,
    costContraband: 5,
    powerEach: 52,
  },
  crimson_adepts: {
    id: 'crimson_adepts',
    name: 'سحرة النخبة القرمزيون',
    description: 'أقوى وحدات العشيرة السرية لتعزيز الهيمنة في سلم الترتيب العام.',
    image: '/src/assets/images/faction_blood_mages_1795531799554.jpg',
    costGold: 2400,
    costContraband: 12,
    powerEach: 140,
  },
};

export const HALL_OF_SHADOWS_RIVALS: Array<{
  codename: string;
  factionId: FactionId;
  powerScore: number;
  rating: number;
  prestige: number;
}> = [
  { codename: 'إمبراطور الغسق', factionId: 'blood_mages', powerScore: 4200, rating: 2450, prestige: 6 },
  { codename: 'نصل الأوبسيديان', factionId: 'shadow_hunters', powerScore: 3100, rating: 1920, prestige: 4 },
  { codename: 'مهندس القوس', factionId: 'tech_wardens', powerScore: 2350, rating: 1510, prestige: 3 },
  { codename: 'كونتيسة الياقوت', factionId: 'blood_mages', powerScore: 1650, rating: 1120, prestige: 2 },
  { codename: 'صقر الكاتدرائية', factionId: 'shadow_hunters', powerScore: 1120, rating: 840, prestige: 1 },
  { codename: 'درع المدار', factionId: 'tech_wardens', powerScore: 760, rating: 540, prestige: 1 },
  { codename: 'ذئب الميناء', factionId: 'shadow_hunters', powerScore: 480, rating: 310, prestige: 0 },
  { codename: 'كيميائي النفق', factionId: 'blood_mages', powerScore: 290, rating: 160, prestige: 0 },
  { codename: 'مراقب القطاع 4', factionId: 'tech_wardens', powerScore: 175, rating: 75, prestige: 0 },
];

export const WORLD_BOSSES: WorldBossDef[] = [
  {
    id: 'boss_iron_gatekeeper',
    name: 'حارس البوابة الحديدي',
    title: 'وصي خزائن الميناء',
    district: 'الميناء التجاري',
    description: 'قائد مدرع يحرس مستودعات الذهب المهرب. يتطلب هجمات متتالية لكسر درعه.',
    image: BOSS_LEVIATHAN_IMAGE,
    recommendedPower: 140,
    maxHp: 1200,
    attackPower: 22,
    rewardGold: 2200,
    rewardContraband: 14,
    rewardForgeStones: 8,
    rewardCrystals: 1,
    rewardXp: 450,
  },
  {
    id: 'boss_crimson_warden',
    name: 'سيد النفق القرمزي',
    title: 'أمير أنفاق المترو',
    district: 'شبكة الأنفاق',
    description: 'ساحر حربي يتحكم في خطوط الإمداد السفلية ويستخدم هجمات استنزاف قوية.',
    image: BOSS_LEVIATHAN_IMAGE,
    recommendedPower: 320,
    maxHp: 4500,
    attackPower: 42,
    rewardGold: 6500,
    rewardContraband: 28,
    rewardForgeStones: 16,
    rewardCrystals: 2,
    rewardXp: 1100,
  },
  {
    id: 'boss_matrix_archon',
    name: 'أركون المصفوفة الأعلى',
    title: 'حامي برج البيانات',
    district: 'الحي المالي',
    description: 'قائد نخبة حراس التكنولوجيا المجهز بدرع كهرومغناطيسي عالي الصلابة.',
    image: BOSS_LEVIATHAN_IMAGE,
    recommendedPower: 680,
    maxHp: 14000,
    attackPower: 76,
    rewardGold: 16500,
    rewardContraband: 55,
    rewardForgeStones: 30,
    rewardCrystals: 3,
    rewardXp: 2600,
  },
  {
    id: 'boss_shadow_leviathan',
    name: 'ليفاياثان الظل الأبدي',
    title: 'الحاكم الأعلى للكاتدرائية',
    district: 'المدينة القديمة',
    description: 'أقوى زعماء الظلال في المدينة. هزيمته تمنح غنائم أسطورية وتتكرر مع كل دورة صعود.',
    image: BOSS_LEVIATHAN_IMAGE,
    recommendedPower: 1400,
    maxHp: 45000,
    attackPower: 135,
    rewardGold: 42000,
    rewardContraband: 110,
    rewardForgeStones: 60,
    rewardCrystals: 5,
    rewardXp: 6500,
  },
];

export const HQ_MODULES: Record<HqModuleId, HqModuleDef> = {
  vault_gate: {
    id: 'vault_gate',
    name: 'بوابة الخزنة المدرعة',
    description: 'تحمي نسبة متزايدة من ذهبك ضد مداهمات الفصائل الأخرى وترفع سقف التخزين.',
    image: HQ_VAULT_GATE_IMAGE,
    maxLevel: 50,
    baseGoldCost: 300,
    baseContrabandCost: 2,
    effectPerLevel: '+2% حماية · +2,500 سعة خزنة',
  },
  power_core: {
    id: 'power_core',
    name: 'مفاعل الطاقة الليلي',
    description: 'يسرّع استعادة الطاقة القتالية ويقلص زمن تنفيذ المهام الليلية.',
    image: HQ_POWER_CORE_IMAGE,
    maxLevel: 50,
    baseGoldCost: 350,
    baseContrabandCost: 3,
    effectPerLevel: '-2% زمن المهام · +1 طاقة قصوى كل مستويين',
  },
  trap_grid: {
    id: 'trap_grid',
    name: 'شبكة المراقبة والفخاخ',
    description: 'تحيط مقرك بأجهزة استشعار وفخاخ تُلحق ضرراً بالمهاجمين وترفع الدفاع.',
    image: HQ_TRAP_GRID_IMAGE,
    maxLevel: 50,
    baseGoldCost: 320,
    baseContrabandCost: 3,
    effectPerLevel: '+5 دفاع فعّال لكل مستوى',
  },
  refinery: {
    id: 'refinery',
    name: 'مختبر التكرير السري',
    description: 'يولد دخلاً سلبياً من الذهب والبضائع المهربة كل 15 ثانية لصالح خزنتك.',
    image: HQ_REFINERY_IMAGE,
    maxLevel: 50,
    baseGoldCost: 400,
    baseContrabandCost: 4,
    effectPerLevel: '+55 ذهب / دورة · إنتاج مهربات',
  },
};

export const RESEARCH_TRACKS: Record<ResearchId, ResearchDef> = {
  refinery_protocol: {
    id: 'refinery_protocol',
    name: 'بروتوكول التكرير اللانهائي',
    description: 'يرفع إنتاج مختبر التكرير وأرباح حصص الأحياء بشكل تراكمي دائم.',
    image: RES_REFINERY_IMAGE,
    maxLevel: 100,
    baseGoldCost: 500,
    baseContrabandCost: 3,
    effectPerLevel: '+6% عائد سلبي للمقر والأسهم',
  },
  lethal_precision: {
    id: 'lethal_precision',
    name: 'خوارزمية الضربة القاضية',
    description: 'تعزز قوة الهجوم الفعلي ومضاعف الضربات الحاسمة في المداهمات والزعماء.',
    image: RES_LETHAL_IMAGE,
    maxLevel: 100,
    baseGoldCost: 600,
    baseContrabandCost: 4,
    effectPerLevel: '+3% قوة هجوم ونسبة حاسمة',
  },
  alchemy_archive: {
    id: 'alchemy_archive',
    name: 'أرشيف خيمياء السوق',
    description: 'يحسن هوامش التداول في البورصة السوداء ويزيد غنائم البضائع المهربة.',
    image: RES_ALCHEMY_IMAGE,
    maxLevel: 100,
    baseGoldCost: 550,
    baseContrabandCost: 4,
    effectPerLevel: '+2% أرباح التجارة وغنائم البضائع',
  },
  eternal_endurance: {
    id: 'eternal_endurance',
    name: 'تدريب التحمل الأبدي',
    description: 'يرفع الحد الأقصى لصحة العميل لمواجهة زعماء القطاعات العتاة.',
    image: RES_ENDURANCE_IMAGE,
    maxLevel: 100,
    baseGoldCost: 450,
    baseContrabandCost: 2,
    effectPerLevel: '+30 صحة قصوى دائمة',
  },
  intel_network: {
    id: 'intel_network',
    name: 'شبكة الاستخبارات السرية',
    description: 'يسرّع اكتساب نقاط الخبرة XP في المهام والمداهمات لبلوغ رتب الصعود.',
    image: RES_INTEL_IMAGE,
    maxLevel: 100,
    baseGoldCost: 520,
    baseContrabandCost: 3,
    effectPerLevel: '+4% خبرة مكتسبة دائمة',
  },
};

export const MARKET_COMMODITIES: MarketCommodity[] = [
  {
    id: 'blood_ingots',
    name: 'سبائك الدم النقية',
    unit: 'سبيكة',
    image: COMM_BLOOD_INGOTS_IMAGE,
    basePrice: 130,
    minPrice: 65,
    maxPrice: 240,
    volatility: 0.25,
    description: 'معدن طقوسي نادر يشتد الطلب عليه قبل الحروب الليلية.',
  },
  {
    id: 'cipher_chips',
    name: 'رقائق التشفير العسكرية',
    unit: 'شريحة',
    image: COMM_CIPHER_CHIPS_IMAGE,
    basePrice: 195,
    minPrice: 95,
    maxPrice: 360,
    volatility: 0.28,
    description: 'مكونات إلكترونية مطلوبة لكسر أنظمة حماية الخزائن.',
  },
  {
    id: 'shadow_elixir',
    name: 'ترياق الظل المركّز',
    unit: 'قارورة',
    image: COMM_SHADOW_ELIXIR_IMAGE,
    basePrice: 95,
    minPrice: 48,
    maxPrice: 175,
    volatility: 0.22,
    description: 'جرعة ليلية تعزز سرعة التسلل وتخفض إجهاد العمليات.',
  },
  {
    id: 'forbidden_scrolls',
    name: 'مخطوطات محرمة',
    unit: 'مخطوطة',
    image: COMM_FORBIDDEN_SCROLLS_IMAGE,
    basePrice: 280,
    minPrice: 140,
    maxPrice: 520,
    volatility: 0.32,
    description: 'وثائق أثرية قديمة يتنافس عليها قادة الفصائل في المزادات.',
  },
];

export const EQUIPMENT_SETS: Record<string, EquipmentSetDef> = {
  set_stalker: {
    id: 'set_stalker',
    name: 'طقم المتسلل الليلي',
    image: '/src/assets/images/armor_kevlar_cloak_1795534474525.jpg',
    itemIds: ['w_obsidian_dagger', 'a_kevlar_cloak', 'r_blood_chalice'],
    twoPieceLabel: 'قطعتان: +12 رشاقة · +8 هجوم',
    threePieceLabel: '3 قطع: +18% قوة الضربات وتفادي أعلى',
    twoPieceMult: { agility: 12, attack: 8 },
    threePiecePowerPct: 18,
  },
  set_warden: {
    id: 'set_warden',
    name: 'طقم الحارس التكتيكي',
    image: '/src/assets/images/armor_warden_exosuit_1795534474715.jpg',
    itemIds: ['w_arc_carbine', 'w_eclipse_katana', 'a_warden_exosuit', 'r_blood_chalice'],
    twoPieceLabel: 'قطعتان: +18 دفاع · +10 براعة',
    threePieceLabel: '3 قطع: +22% صلابة وضرر ضد الزعماء',
    twoPieceMult: { defense: 18, mastery: 10 },
    threePiecePowerPct: 22,
  },
  set_sovereign: {
    id: 'set_sovereign',
    name: 'طقم السيادة الأبدية',
    image: '/src/assets/images/armor_sovereign_plate_1795534475501.jpg',
    itemIds: ['w_crimson_scythe', 'a_sovereign_plate', 'r_crown_of_dusk'],
    twoPieceLabel: 'قطعتان: +30 هجوم · +30 دفاع',
    threePieceLabel: '3 قطع: السيادة المطلقة (+35% قوة قتالية شاملة)',
    twoPieceMult: { attack: 30, defense: 30 },
    threePiecePowerPct: 35,
  },
};

export const EQUIPMENT_CATALOG: EquipmentItem[] = [
  // --- Gold-Only Weapons (Progressive F2P Arsenal) ---
  {
    id: 'w_obsidian_dagger',
    name: 'خنجر الأوبسيديان المسنن',
    slot: 'weapon',
    tier: 1,
    rarityLabel: 'عادي',
    setId: 'set_stalker',
    image: '/src/assets/images/weapon_obsidian_dagger_1795534473812.jpg',
    priceGold: 450,
    priceCrystals: 0,
    bonuses: { attack: 6, agility: 3 },
    description: 'نصل خفيف مصقول لتمزيق الدروع الخفيفة في الأزقة.',
  },
  {
    id: 'w_street_revolver',
    name: 'مسدس الأزقة الكاتم',
    slot: 'weapon',
    tier: 1,
    rarityLabel: 'عادي',
    image: '/src/assets/images/weapon_street_revolver_1795560994235.jpg',
    priceGold: 900,
    priceCrystals: 0,
    bonuses: { attack: 10, agility: 5 },
    description: 'مسدس تكتيكي صامت بسبطانة فولاذية لضربات دقيقة وسريعة.',
  },
  {
    id: 'w_arc_carbine',
    name: 'قاذفة القوس الكهرومغناطيسي',
    slot: 'weapon',
    tier: 2,
    rarityLabel: 'نادر',
    setId: 'set_warden',
    image: '/src/assets/images/weapon_arc_carbine_1795534472654.jpg',
    priceGold: 1500,
    priceCrystals: 0,
    bonuses: { attack: 14, mastery: 6 },
    description: 'سلاح تكتيكي صامت يخترق البوابات المصفحة بدقة عالية.',
  },
  {
    id: 'w_silver_halberd',
    name: 'رمح الفضة القوطي',
    slot: 'weapon',
    tier: 2,
    rarityLabel: 'نادر',
    image: '/src/assets/images/weapon_silver_halberd_1795560994210.jpg',
    priceGold: 2600,
    priceCrystals: 0,
    bonuses: { attack: 20, defense: 8, mastery: 4 },
    description: 'فأس قوطي فضي طويل النطاق يصد الهجمات ويهشم الدروع بالذهب فقط.',
  },
  {
    id: 'w_shadow_twinblades',
    name: 'نصلا الشبح المزدوجان',
    slot: 'weapon',
    tier: 3,
    rarityLabel: 'ملحمي',
    image: '/src/assets/images/weapon_shadow_twinblades_1795560994537.jpg',
    priceGold: 4200,
    priceCrystals: 0,
    bonuses: { attack: 27, agility: 14 },
    description: 'خنجران منحنيان من الأوبسيديان المدخن لهجمات مزدوجة خاطفة بالذهب.',
  },
  {
    id: 'w_plasma_glaive',
    name: 'حربة البلازما التكتيكية',
    slot: 'weapon',
    tier: 3,
    rarityLabel: 'ملحمي',
    image: '/src/assets/images/weapon_plasma_glaive_1795560994746.jpg',
    priceGold: 6800,
    priceCrystals: 0,
    bonuses: { attack: 34, mastery: 12, defense: 8 },
    description: 'حربة تيتانيوم بحافة بلازما متوهجة متاحة للشراء بالذهب الخالص.',
  },
  {
    id: 'w_blood_greatsword',
    name: 'السيف القرمزي العظيم',
    slot: 'weapon',
    tier: 4,
    rarityLabel: 'أسطوري',
    image: '/src/assets/images/weapon_blood_greatsword_1795560995101.jpg',
    priceGold: 10500,
    priceCrystals: 0,
    bonuses: { attack: 42, influence: 14, mastery: 10 },
    description: 'سيف ثقيل مرصع بالياقوت يرهب الخصوم ويضاعف هيبتك بالذهب فقط.',
  },
  {
    id: 'w_nightmare_railgun',
    name: 'مدفع الكابوس الثقيل',
    slot: 'weapon',
    tier: 4,
    rarityLabel: 'أسطوري',
    image: '/src/assets/images/weapon_nightmare_railgun_1795560995450.jpg',
    priceGold: 16000,
    priceCrystals: 0,
    bonuses: { attack: 52, mastery: 18, agility: 10 },
    description: 'أقوى سلاح ناري كهرومغناطيسي قابل للشراء بالذهب دون بلورات.',
  },

  // --- Crystal-Tier Elite & Sovereign Weapons ---
  {
    id: 'w_eclipse_katana',
    name: 'كاتانا الكسوف الدمشقية',
    slot: 'weapon',
    tier: 3,
    rarityLabel: 'ملحمي',
    setId: 'set_warden',
    image: '/src/assets/images/weapon_eclipse_katana_1795534475630.jpg',
    priceGold: 4200,
    priceCrystals: 16,
    bonuses: { attack: 28, agility: 14, mastery: 10 },
    description: 'نصل دمشقي مسحور بحواف كهرمانية يقطع أعتى الدروع في صمت.',
  },
  {
    id: 'w_astral_crossbow',
    name: 'قوس النجوم الصامت',
    slot: 'weapon',
    tier: 4,
    rarityLabel: 'أسطوري',
    image: '/src/assets/images/weapon_astral_crossbow_1795560995798.jpg',
    priceGold: 6500,
    priceCrystals: 25,
    bonuses: { attack: 44, agility: 20, mastery: 16 },
    description: 'قوس نشاب آلي مصفح برون التصويب النجمي لا يخطئ أهدافه أبداً.',
  },
  {
    id: 'w_void_warhammer',
    name: 'مطرقة الفراغ المحطمة',
    slot: 'weapon',
    tier: 4,
    rarityLabel: 'أسطوري',
    image: '/src/assets/images/weapon_void_warhammer_1795560996870.jpg',
    priceGold: 9800,
    priceCrystals: 38,
    bonuses: { attack: 58, defense: 20, mastery: 18 },
    description: 'مطرقة سندان أوبسيديان محفورة بالذهب تحطم حصون العدو بضربة واحدة.',
  },
  {
    id: 'w_crimson_scythe',
    name: 'منجل الخسوف القرمزي',
    slot: 'weapon',
    tier: 5,
    rarityLabel: 'سيادي',
    setId: 'set_sovereign',
    image: '/src/assets/images/weapon_crimson_scythe_1795534473427.jpg',
    priceGold: 15500,
    priceCrystals: 55,
    bonuses: { attack: 68, agility: 22, mastery: 24 },
    description: 'قطعة أثرية من طراز السيادة تضاعف فتك الضربات الحاسمة.',
  },
  {
    id: 'w_chronos_blade',
    name: 'سيف كرونوس الأبدي',
    slot: 'weapon',
    tier: 5,
    rarityLabel: 'سيادي',
    image: '/src/assets/images/weapon_chronos_blade_1795560996921.jpg',
    priceGold: 22000,
    priceCrystals: 85,
    bonuses: { attack: 90, agility: 28, mastery: 30, influence: 22 },
    description: 'نصل ملكي دمشقي بقلب بلوري قرمزي يمنح تفوقاً ساحقاً في الحلبة.',
  },
  {
    id: 'w_apocalypse_scepter',
    name: 'صولجان نهاية العالم السيادي',
    slot: 'weapon',
    tier: 5,
    rarityLabel: 'سيادي',
    image: '/src/assets/images/weapon_apocalypse_scepter_1795561028208.jpg',
    priceGold: 30000,
    priceCrystals: 120,
    bonuses: { attack: 118, defense: 35, mastery: 40, influence: 35 },
    description: 'أقوى سلاح مطلق في مدينة الظلال — يمنح صاحبه هيمنة تامة على السيرفر.',
  },

  // --- Armors & Relics ---
  {
    id: 'a_kevlar_cloak',
    name: 'معطف الكيفلار الليلي',
    slot: 'armor',
    tier: 1,
    rarityLabel: 'عادي',
    setId: 'set_stalker',
    image: '/src/assets/images/armor_kevlar_cloak_1795534474525.jpg',
    priceGold: 420,
    priceCrystals: 0,
    bonuses: { defense: 6, agility: 3 },
    description: 'سترة مبطنة بألياف كربونية تمنح حماية مرنة ومناورة سريعة.',
  },
  {
    id: 'a_warden_exosuit',
    name: 'بدلة الحارس المدرعة',
    slot: 'armor',
    tier: 3,
    rarityLabel: 'ملحمي',
    setId: 'set_warden',
    image: '/src/assets/images/armor_warden_exosuit_1795534474715.jpg',
    priceGold: 3600,
    priceCrystals: 14,
    bonuses: { defense: 24, attack: 6 },
    description: 'هيكل خارجي من التيتانيوم المصقول ومفاصل نحاسية لصد المداهمات.',
  },
  {
    id: 'a_sovereign_plate',
    name: 'درع السيادة الأبدي',
    slot: 'armor',
    tier: 5,
    rarityLabel: 'سيادي',
    setId: 'set_sovereign',
    image: '/src/assets/images/armor_sovereign_plate_1795534475501.jpg',
    priceGold: 14500,
    priceCrystals: 50,
    bonuses: { defense: 48, mastery: 14, attack: 10 },
    description: 'تحفة دفاعية ملكية من الفولاذ المسود والرداء القرمزي.',
  },
  {
    id: 'r_blood_chalice',
    name: 'إسطرلاب وكأس الياقوت',
    slot: 'relic',
    tier: 2,
    rarityLabel: 'نادر',
    setId: 'set_stalker',
    image: '/src/assets/images/relic_blood_astrolabe_1795534475306.jpg',
    priceGold: 1850,
    priceCrystals: 0,
    bonuses: { mastery: 12, influence: 10, attack: 5 },
    description: 'أداة فلكية وكأس قرمزي تضخم التدفق السحري وتزيد الغنائم النقدية.',
  },
  {
    id: 'r_crown_of_dusk',
    name: 'تاج وختم الغسق المحرّم',
    slot: 'relic',
    tier: 5,
    rarityLabel: 'سيادي',
    setId: 'set_sovereign',
    image: '/src/assets/images/relic_crown_of_dusk_1795534475629.jpg',
    priceGold: 18000,
    priceCrystals: 65,
    bonuses: { attack: 18, defense: 18, agility: 18, mastery: 24, influence: 24 },
    description: 'أندر آثار المدينة السفلية، يمنح توازناً سيادياً في كل المهارات.',
  },
];

export const DISTRICT_SHARES: DistrictShareDef[] = [
  {
    id: 'dark_port',
    name: 'حصص الميناء المظلم',
    description: 'رسوم مرور السفن المهربة ليلاً. عائد مستقر ومنخفض المخاطرة.',
    image: MARKET_VAULT_IMAGE,
    sharePrice: 450,
    dividendPerCycle: 26,
    maxShares: 50,
  },
  {
    id: 'financial_tower',
    name: 'سندات الحي المالي',
    description: 'ضرائب الصناديق السرية في ناطحات السحاب. عائد قوي للمستثمرين.',
    image: HERO_CITY_IMAGE,
    sharePrice: 1200,
    dividendPerCycle: 75,
    maxShares: 50,
  },
  {
    id: 'underground_rail',
    name: 'شبكة الأنفاق السفلية',
    description: 'عوائد النقل السري بين قطاعات المدينة الثلاثة.',
    image: TERRITORY_MAP_IMAGE,
    sharePrice: 2800,
    dividendPerCycle: 185,
    maxShares: 50,
  },
];

export const DAILY_QUESTS: DailyQuestDef[] = [
  {
    id: 'dq_missions_4',
    title: 'دورية منتصف الليل',
    description: 'أكمل 4 مهام زمنية في أحياء المدينة.',
    metric: 'missions',
    target: 4,
    rewardGold: 700,
    rewardForgeStones: 3,
    rewardCrystals: 0,
    rewardSeasonXp: 120,
  },
  {
    id: 'dq_raids_3',
    title: 'كاسر الخزائن',
    description: 'انتصر في 3 مداهمات ضد الفصائل المنافسة.',
    metric: 'raids',
    target: 3,
    rewardGold: 950,
    rewardForgeStones: 4,
    rewardCrystals: 0,
    rewardSeasonXp: 160,
  },
  {
    id: 'dq_trades_2',
    title: 'سمسار السوق السوداء',
    description: 'نفّذ عمليتي شراء أو بيع في البورصة السوداء.',
    metric: 'trades',
    target: 2,
    rewardGold: 550,
    rewardForgeStones: 2,
    rewardCrystals: 0,
    rewardSeasonXp: 100,
  },
  {
    id: 'dq_boss_2',
    title: 'تحدي الزعماء',
    description: 'هاجم أحد زعماء القطاعات مرتين اليوم.',
    metric: 'bossHits',
    target: 2,
    rewardGold: 1100,
    rewardForgeStones: 5,
    rewardCrystals: 1,
    rewardSeasonXp: 180,
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ach_missions',
    title: 'عميل الظل المخضرم',
    description: 'إجمالي المهام الليلية المكتملة عبر مسيرتك.',
    metric: 'missionsCompleted',
    tiers: [10, 50, 200, 500, 1500],
    crystalRewards: [2, 4, 8, 15, 30],
  },
  {
    id: 'ach_raids',
    title: 'قاهر الفصائل',
    description: 'إجمالي المداهمات الناجحة ضد خزائن الخصوم.',
    metric: 'raidsWon',
    tiers: [5, 25, 100, 300, 1000],
    crystalRewards: [2, 5, 10, 20, 40],
  },
  {
    id: 'ach_bosses',
    title: 'صائد الزعماء',
    description: 'عدد زعماء القطاعات الذين تم إسقاطهم.',
    metric: 'bossesDefeated',
    tiers: [1, 4, 12, 30, 75],
    crystalRewards: [3, 6, 12, 24, 50],
  },
  {
    id: 'ach_gold',
    title: 'بارون الاقتصاد السري',
    description: 'إجمالي الذهب المتراكم عبر مسيرتك في المدينة.',
    metric: 'totalGoldEarned',
    tiers: [10000, 50000, 250000, 1000000, 5000000],
    crystalRewards: [2, 5, 10, 20, 40],
  },
  {
    id: 'ach_prestige',
    title: 'سيادة الأبدية',
    description: 'الوصول إلى رتب الصعود (الهيبة) المتقدمة.',
    metric: 'prestigeRank',
    tiers: [1, 3, 5, 10, 20],
    crystalRewards: [5, 12, 25, 50, 100],
  },
];

export const SUB_SPECS: SubSpecDef[] = [
  {
    id: 'sh_assassin',
    factionId: 'shadow_hunters',
    name: 'ظل الاغتيال',
    tagline: 'تخصص الفتك الصامت والضربات الحرجة',
    description: 'يركز على تصفية الخصوم بسرعة عبر نسبة حاسمة عالية وتفادي الهجمات المرتدة.',
    image: SKILL_EVADE_IMAGE,
    bonuses: { attackPct: 12, critBonus: 0.14, dodgeBonus: 0.08 },
  },
  {
    id: 'sh_heist',
    factionId: 'shadow_hunters',
    name: 'سارق الخزائن',
    tagline: 'تخصص نهب المخازن والموارد النادرة',
    description: 'يرفع غنائم الذهب والبضائع المهربة من المداهمات الليلية والحلبة.',
    image: MARKET_VAULT_IMAGE,
    bonuses: { raidLootPct: 25, dodgeBonus: 0.05 },
  },
  {
    id: 'tw_fortress',
    factionId: 'tech_wardens',
    name: 'درع الحصن الحديدي',
    tagline: 'تخصص الصمود الدفاعي وعكس الضرر',
    description: 'يحول العميل إلى قلعة متحركة بزيادة ضخمة في الدفاع ومقاومة فخاخ الخصوم.',
    image: SKILL_MIRROR_IMAGE,
    bonuses: { defensePct: 22, attackPct: 6 },
  },
  {
    id: 'tw_overclock',
    factionId: 'tech_wardens',
    name: 'مهندس المفاعل',
    tagline: 'تخصص الاقتصاد والمقر والتطوير',
    description: 'يرفع إنتاج المقر السري والأسهم بنسبة 30% ويعزز البراعة التقنية.',
    image: HQ_POWER_CORE_IMAGE,
    bonuses: { hqYieldPct: 30, defensePct: 8 },
  },
  {
    id: 'bm_vampiric',
    factionId: 'blood_mages',
    name: 'مصاص الدماء القرمزي',
    tagline: 'تخصص امتصاص الحياة والقتال المستمر',
    description: 'يستعيد نسبة كبيرة من الضرر الملحق كصحة في المداهمات والبرج اللانهائي.',
    image: SKILL_SIPHON_IMAGE,
    bonuses: { lifestealPct: 22, attackPct: 10 },
  },
  {
    id: 'bm_broker',
    factionId: 'blood_mages',
    name: 'سمسار الطقوس',
    tagline: 'تخصص التجارة والمزاد الأسود',
    description: 'يمنح أفضل هوامش بيع وشراء في البورصة السوداء ويعزز النفوذ.',
    image: RES_ALCHEMY_IMAGE,
    bonuses: { marketMarginBonus: 0.12, hqYieldPct: 15 },
  },
];

export const RUNES_CATALOG: Record<RuneId, RuneDef> = {
  poison: {
    id: 'poison',
    name: 'حجر السم القاتل',
    colorClass: 'text-emerald-400',
    description: 'يسمم شفرة السلاح أو الدرع لرفع الهجوم وإلحاق ضرر إضافي مستمر في القتال.',
    image: RUNE_POISON_IMAGE,
    essenceCost: 15,
    goldCost: 600,
    bonuses: { attack: 14, mastery: 6 },
    combatEffectLabel: '+14 هجوم +6 براعة + سم قتالي',
  },
  lifesteal: {
    id: 'lifesteal',
    name: 'حجر الامتصاص القرمزي',
    colorClass: 'text-rose-400',
    description: 'حجر طقوسي يمتص 12% من ضرر كل ضربة ويعيده كصحة للعميل.',
    image: RUNE_LIFESTEAL_IMAGE,
    essenceCost: 18,
    goldCost: 750,
    bonuses: { attack: 10, influence: 8 },
    combatEffectLabel: '+10 هجوم · امتصاص 12% صحة',
  },
  armor_pierce: {
    id: 'armor_pierce',
    name: 'حجر اختراق الدروع',
    colorClass: 'text-sky-400',
    description: 'يخترق دفاعات الخصوم في البرج اللانهائي والمداهمات بنسبة كبيرة.',
    image: RUNE_PIERCE_IMAGE,
    essenceCost: 16,
    goldCost: 700,
    bonuses: { attack: 12, defense: 10 },
    combatEffectLabel: '+12 هجوم +10 دفاع + خرق دروع',
  },
  crit_surge: {
    id: 'crit_surge',
    name: 'حجر الضربة الحاسمة',
    colorClass: 'text-amber-400',
    description: 'يشحن القطعة بطاقة خاطفة ترفع الرشاقة وفرصة الضربة القاضية.',
    image: RUNE_CRIT_IMAGE,
    essenceCost: 20,
    goldCost: 850,
    bonuses: { agility: 15, mastery: 10 },
    combatEffectLabel: '+15 رشاقة +10 براعة · +8% حاسمة',
  },
};

export const TERRITORY_DISTRICTS: TerritoryDistrictDef[] = [
  {
    id: 'sector_financial',
    name: 'الحي المالي (Sector Alpha)',
    bonusLabel: '+12% ذهب المهام',
    description: 'قلب الأبراج المصرفية والمقرات العليا للتمويل الليلي.',
    image: HERO_CITY_IMAGE,
  },
  {
    id: 'sector_docks',
    name: 'الميناء التجاري (Dark Docks)',
    bonusLabel: '+15% مهربات',
    description: 'بوابة الشحنات البحرية غير الشرعية والبورصة السوداء.',
    image: MARKET_VAULT_IMAGE,
  },
  {
    id: 'sector_subway',
    name: 'شبكة الأنفاق (Gamma Rail)',
    bonusLabel: '+10% خبرة XP',
    description: 'الممرات السفلية الرابطة بين مخازن الفصائل الثلاثة.',
    image: TERRITORY_MAP_IMAGE,
  },
  {
    id: 'sector_cathedral',
    name: 'المدينة القديمة (Shadow Reach)',
    bonusLabel: '+10% دفاع الفصيل',
    description: 'الحي القوطي العتيق ومعقل المخطوطات المحرمة.',
    image: HQ_CITADEL_IMAGE,
  },
  {
    id: 'sector_industrial',
    name: 'المنطقة الصناعية (The Forge)',
    bonusLabel: '+12% أحجار وجوهر صقل',
    description: 'مصاهر الفولاذ المسود ومختبرات تعدين الأحجار الرونية.',
    image: HQ_REFINERY_IMAGE,
  },
  {
    id: 'sector_citadel',
    name: 'البرج المركزي (The Void)',
    bonusLabel: '+10% قوة الحلبة',
    description: 'أعلى نقطة مراقبة في المدينة الليلية ومقر مجلس الظلال.',
    image: TOWER_SPIRE_IMAGE,
  },
];

export const LIVE_EVENTS_META: Record<
  LiveEventId,
  { id: LiveEventId; title: string; subtitle: string; effectLabel: string; accentClass: string }
> = {
  blood_moon: {
    id: 'blood_moon',
    title: 'ليلة القمر القرمزي',
    subtitle: 'القمر الدامي يسطع في سماء المدينة الليلية',
    effectLabel: 'مضاعفة x2 لذهب وخبرة الصيد الليلي والمهام والمداهمات!',
    accentClass: 'text-rose-400 border-rose-500/40 bg-rose-950/25',
  },
  market_shock: {
    id: 'market_shock',
    title: 'أخبار البورصة المفاجئة',
    subtitle: 'تقلبات حادة ومضاربات طارئة في السوق السوداء',
    effectLabel: 'ارتفاع أو انهيار مفاجئ في أسعار إحدى السلع الاستراتيجية!',
    accentClass: 'text-amber-400 border-amber-500/40 bg-amber-950/25',
  },
  city_invasion: {
    id: 'city_invasion',
    title: 'غزوة التمرد الليلية',
    subtitle: 'قوات مرتزقة خارجية تحاصر بوابات المدينة',
    effectLabel: 'ساهم في صد الغزاة لربح صناديق جوهر الصقل والبلورات!',
    accentClass: 'text-sky-400 border-sky-500/40 bg-sky-950/25',
  },
};

export const SEASON_TIER_XP = 250;
export const MAX_SEASON_TIERS = 30;

export function getPrestigeTitle(rank: number): string {
  if (rank <= 0) return 'عميل مبتدئ';
  if (rank === 1) return 'شبح فضي (صعود 1)';
  if (rank === 2) return 'قائد ظل (صعود 2)';
  if (rank <= 4) return `أمير الليل (صعود ${rank})`;
  if (rank <= 9) return `سيد الخسوف (صعود ${rank})`;
  return `أسطورة السيادة (صعود ${rank})`;
}

export function getPrestigeLevelRequirement(prestigeRank: number): number {
  return 15 + prestigeRank * 5;
}

export function getAttributeUpgradeCost(currentValue: number): number {
  return Math.round(70 * Math.pow(1.13, Math.max(0, currentValue - 10)));
}

export function getHqUpgradeCost(moduleId: HqModuleId, currentLevel: number): { gold: number; contraband: number } {
  const def = HQ_MODULES[moduleId];
  return {
    gold: Math.round(def.baseGoldCost * Math.pow(1.28, currentLevel - 1)),
    contraband: Math.round(def.baseContrabandCost * Math.pow(1.22, currentLevel - 1)),
  };
}

export function getResearchUpgradeCost(
  researchId: ResearchId,
  currentLevel: number
): { gold: number; contraband: number } {
  const def = RESEARCH_TRACKS[researchId];
  return {
    gold: Math.round(def.baseGoldCost * Math.pow(1.2, currentLevel)),
    contraband: Math.round(def.baseContrabandCost * Math.pow(1.16, currentLevel)),
  };
}

export function getEquipmentEnhanceCost(currentEnhance: number): {
  gold: number;
  stones: number;
  successRate: number;
} {
  const next = currentEnhance + 1;
  return {
    gold: Math.round(400 * Math.pow(1.42, currentEnhance)),
    stones: Math.max(1, Math.round(1 + currentEnhance * 1.4)),
    successRate: Math.max(35, 100 - Math.max(0, next - 3) * 5),
  };
}

export function getCompanionUpgradeCost(currentLevel: number): { gold: number; contraband: number } {
  return {
    gold: Math.round(650 * Math.pow(1.32, Math.max(0, currentLevel - 1))),
    contraband: Math.max(2, Math.round(2 + currentLevel * 1.3)),
  };
}

export function getTowerFloorEnemy(floor: number): {
  name: string;
  isBoss: boolean;
  hp: number;
  attack: number;
  defense: number;
  rewardGold: number;
  rewardEssence: number;
  rewardStones: number;
  rewardCrystals: number;
  rewardXp: number;
} {
  const isBoss = floor % 10 === 0;
  const scale = Math.pow(1.065, floor - 1);
  return {
    name: isBoss ? `وصي الطابق ${floor} — كاسر العروش` : `حارس برج الظل · طابق ${floor}`,
    isBoss,
    hp: Math.round((130 + floor * 22) * scale * (isBoss ? 1.85 : 1)),
    attack: Math.round((16 + floor * 2.5) * scale * (isBoss ? 1.35 : 1)),
    defense: Math.round((11 + floor * 1.9) * scale * (isBoss ? 1.3 : 1)),
    rewardGold: Math.round((240 + floor * 75) * (isBoss ? 2.8 : 1)),
    rewardEssence: isBoss ? 12 + Math.floor(floor / 5) : 3 + Math.floor(floor / 10),
    rewardStones: isBoss ? 5 : floor % 3 === 0 ? 2 : 1,
    rewardCrystals: isBoss ? 1 : 0,
    rewardXp: Math.round((75 + floor * 22) * (isBoss ? 2.5 : 1)),
  };
}

export function getXpForNextLevel(level: number): number {
  return Math.round(115 * Math.pow(1.32, level - 1));
}

export function getTodayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function createInitialMarket(): Record<string, MarketStateItem> {
  const market: Record<string, MarketStateItem> = {};
  for (const c of MARKET_COMMODITIES) {
    market[c.id] = {
      id: c.id,
      currentPrice: c.basePrice,
      previousPrice: c.basePrice,
      owned: 0,
      avgBuyPrice: 0,
    };
  }
  return market;
}

export function createInitialTerritoryScores(): Record<string, Record<FactionId, number>> {
  const map: Record<string, Record<FactionId, number>> = {};
  TERRITORY_DISTRICTS.forEach((d, idx) => {
    map[d.id] = {
      shadow_hunters: idx % 3 === 0 ? 320 : 210,
      tech_wardens: idx % 3 === 1 ? 320 : 210,
      blood_mages: idx % 3 === 2 ? 320 : 210,
    };
  });
  return map;
}

export function createNewPlayerState(codename: string, factionId: FactionId): PlayerSaveState {
  const faction = FACTIONS[factionId];
  const now = Date.now();
  return {
    codename: codename.trim() || 'شبح الليل',
    factionId,
    subSpecId: null,
    level: 1,
    xp: 0,
    prestigeRank: 0,
    hp: 130,
    maxHp: 130,
    energy: 14,
    maxEnergy: 14,
    gold: 800,
    vaultProtectedGold: 0,
    contraband: 6,
    forgeStones: 4,
    craftingEssence: 20,
    blueprints: 1,
    crystals: 5,
    arenaRating: 100,
    vipActive: false,
    firstPurchaseUsed: false,
    attributes: { ...faction.startingStats },
    unlockedPerks: [],
    equippedCombatSkills: ['bleed_edge', 'crimson_siphon', 'tactical_evade'],
    researchLevels: {
      refinery_protocol: 0,
      lethal_precision: 0,
      alchemy_archive: 0,
      eternal_endurance: 0,
      intel_network: 0,
    },
    hqLevels: {
      vault_gate: 1,
      power_core: 1,
      trap_grid: 1,
      refinery: 1,
    },
    pendingVaultGold: 60,
    pendingVaultContraband: 1,
    lastVaultTick: now,
    lastEnergyTick: now,
    lastOnlineAt: now,
    activeMission: null,
    raidCooldownUntil: 0,
    ownedEquipment: [],
    craftedItems: [],
    equipmentEnhance: {},
    equipped: {
      weapon: null,
      armor: null,
      relic: null,
    },
    ownedRunes: {
      poison: 1,
      lifesteal: 0,
      armor_pierce: 0,
      crit_surge: 0,
    },
    socketedRunes: {
      weapon: null,
      armor: null,
      relic: null,
    },
    ownedCompanions: {
      shadow_raven: 0,
      tech_drone: 0,
      blood_hound: 0,
    },
    activeCompanion: null,
    ownedCosmetics: [],
    equippedFrame: null,
    equippedChatColor: null,
    clanId: null,
    clanName: `عشيرة ${codename.trim() || 'الظل'}`,
    clanUnits: {
      night_scouts: 0,
      iron_sentinels: 0,
      crimson_adepts: 0,
    },
    market: createInitialMarket(),
    lastMarketUpdate: now,
    districtShares: {
      dark_port: 0,
      financial_tower: 0,
      underground_rail: 0,
    },
    dominance: {
      shadow_hunters: 34,
      tech_wardens: 33,
      blood_mages: 33,
    },
    territoryWarScores: createInitialTerritoryScores(),
    worldBossIndex: 0,
    worldBossCurrentHp: WORLD_BOSSES[0].maxHp,
    towerFloor: 1,
    towerBestFloor: 1,
    tournamentWins: 0,
    activeEventId: 'blood_moon',
    eventShockCommodityId: 'blood_ingots',
    eventShockMultiplier: 1.85,
    eventStartedAt: now,
    invasionWaveHp: 5000,
    invasionWaveMaxHp: 5000,
    dailyDateKey: getTodayDateKey(),
    loginStreak: 1,
    dailyStreakClaimed: false,
    lastMysteryBoxAt: 0,
    mysteryBoxWins: 0,
    lastWheelDate: '',
    wheelSpinsToday: 0,
    lastClaimedServerBossCycle: 0,
    lastClaimedClanBossCycle: 0,
    lastClaimedSeasonNumber: 0,
    claimedClanWarIds: [],
    seasonMedals: 0,
    referralClaimed: false,
    tutorialStep: 0,
    friendUids: [],
    nemeses: {},
    claimedLiveDuelIds: [],
    claimedHeistIds: [],
    activeStoryCase: null,
    storyCaseCooldowns: {},
    activeTournamentBet: null,
    dailyProgress: {
      missions: 0,
      raids: 0,
      trades: 0,
      upgrades: 0,
      bossHits: 0,
    },
    claimedDailyQuests: [],
    seasonXp: 0,
    claimedSeasonTiers: [],
    claimedAchievements: {},
    stats: {
      missionsCompleted: 0,
      raidsWon: 0,
      raidsLost: 0,
      duelsWon: 0,
      bossesDefeated: 0,
      towerClears: 0,
      totalGoldEarned: 800,
    },
    logs: [
      {
        id: 'init-1',
        timestamp: now,
        category: 'system',
        message: `انضممت إلى فصيل ${faction.name}. برج الظلال اللانهائي وحروب الأقاليم والمزاد الحي جاهزة.`,
        tone: 'positive',
      },
    ],
  };
}

export const COMBAT_SKILLS: CombatSkillDef[] = [
  {
    id: 'bleed_edge',
    name: 'نصل النزيف القاتل',
    tagline: '+14% هجوم · +6% ضربة حاسمة',
    description: 'يركّز هجماتك على نقاط الضعف لرفع الضرر المباشر وإحداث نزيف متراكم.',
    image: SKILL_BLEED_IMAGE,
    attackBonusPct: 14,
    critBonus: 0.06,
  },
  {
    id: 'mirror_ward',
    name: 'الدرع العاكس',
    tagline: '+18% دفاع · عكس 15% ضرر',
    description: 'يكوّن حاجزاً طاقياً يعكس جزءاً من هجمات الخصوم أثناء المداهمات والحلبة.',
    image: SKILL_MIRROR_IMAGE,
    defenseBonusPct: 18,
    reflectPct: 15,
  },
  {
    id: 'shadow_stun',
    name: 'قنبلة تعطيل الظلال',
    tagline: '+10% هجوم · +12% دفاع',
    description: 'تشوّش قدرات الخصم في بداية الاشتباك وتمنحك تفوقاً متوازناً.',
    image: SKILL_STUN_IMAGE,
    attackBonusPct: 10,
    defenseBonusPct: 12,
  },
  {
    id: 'crimson_siphon',
    name: 'امتصاص الدم القرمزي',
    tagline: 'امتصاص 14% صحة من الضرر',
    description: 'يعيد نسبة من الضرر الملحق بالخصوم كصحة فورية في القتال.',
    image: SKILL_SIPHON_IMAGE,
    lifestealPct: 14,
  },
  {
    id: 'overcharge_blast',
    name: 'انفجار الشحنة الفائق',
    tagline: '+18% هجوم · +10% حاسمة',
    description: 'مهارة هجومية عالية المخاطر لإنهاء المواجهات بسرعة قصوى.',
    image: SKILL_OVERCHARGE_IMAGE,
    attackBonusPct: 18,
    critBonus: 0.1,
  },
  {
    id: 'tactical_evade',
    name: 'مناورة الشبح التكتيكية',
    tagline: '+14% تفادي · +8% دفاع',
    description: 'ترفع احتمالية الإفلات من الضربات القاضية وفخاخ الخزائن.',
    image: SKILL_EVADE_IMAGE,
    dodgeBonus: 0.14,
    defenseBonusPct: 8,
  },
];

export const COSMETICS_CATALOG: CosmeticDef[] = [
  {
    id: 'frame_ember',
    category: 'frame',
    name: 'إطار الجمر القرمزي',
    description: 'إطار متوهج بلون الجمر يحيط باسمك في الشريط العلوي وقاعة الظلال والشات.',
    priceCrystals: 18,
    cssClass: 'border border-rose-500/70 bg-rose-950/40 text-rose-200 px-2 py-0.5 rounded',
  },
  {
    id: 'frame_royal_gold',
    category: 'frame',
    name: 'الإطار الملكي الذهبي',
    description: 'إطار ذهبي فاخر يميز كبار قادة الفصائل في قوائم التصنيف.',
    priceCrystals: 30,
    cssClass: 'border border-amber-400/80 bg-amber-950/40 text-amber-200 px-2 py-0.5 rounded',
  },
  {
    id: 'frame_obsidian_crown',
    category: 'frame',
    name: 'إطار تاج الأوبسيديان',
    description: 'أفخم إطار نخبوي في المدينة السفلية بظلال سماوية معدنية.',
    priceCrystals: 45,
    cssClass: 'border border-sky-400/80 bg-sky-950/40 text-sky-200 px-2 py-0.5 rounded',
  },
  {
    id: 'chat_amber',
    category: 'chat_color',
    name: 'لون نداء العنبر الذهبي',
    description: 'تظهر رسائلك في راديو المدينة العام بلون عنبري واضح ومميز.',
    priceCrystals: 12,
    cssClass: 'text-amber-300',
  },
  {
    id: 'chat_crimson',
    category: 'chat_color',
    name: 'لون نداء القمر القرمزي',
    description: 'يميز رسائلك في الشات العام بصبغة قرمزية حادة.',
    priceCrystals: 15,
    cssClass: 'text-rose-300',
  },
  {
    id: 'chat_emerald',
    category: 'chat_color',
    name: 'لون نداء الزمرد السيادي',
    description: 'لون زمردي نادر لرسائلك في راديو المدينة العام.',
    priceCrystals: 15,
    cssClass: 'text-emerald-300',
  },
];

export const SEASON_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
const SEASON_EPOCH_MS = new Date('2026-11-01T00:00:00Z').getTime();

export function getCurrentSeasonInfo(nowMs = Date.now()) {
  const elapsed = Math.max(0, nowMs - SEASON_EPOCH_MS);
  const seasonNumber = Math.floor(elapsed / SEASON_DURATION_MS) + 1;
  const seasonStartsAt = SEASON_EPOCH_MS + (seasonNumber - 1) * SEASON_DURATION_MS;
  const seasonEndsAt = seasonStartsAt + SEASON_DURATION_MS;
  const msRemaining = Math.max(0, seasonEndsAt - nowMs);
  return { seasonNumber, seasonStartsAt, seasonEndsAt, msRemaining };
}

export function getWarHourStatus(nowMs = Date.now()): {
  isActive: boolean;
  msRemaining: number;
  cycleNumber: number;
} {
  const CYCLE_MS = 30 * 60 * 1000;
  const ACTIVE_MS = 10 * 60 * 1000;
  const cycleNumber = Math.floor(nowMs / CYCLE_MS);
  const pos = nowMs % CYCLE_MS;
  const isActive = pos < ACTIVE_MS;
  const msRemaining = isActive ? ACTIVE_MS - pos : CYCLE_MS - pos;
  return { isActive, msRemaining, cycleNumber };
}

export interface SeasonDecreeInfo {
  hasHistory: boolean;
  seasonNumber: number;
  reigningFaction: FactionId;
  championName: string;
  topClanName: string;
  title: string;
  effectLabel: string;
  bonusType: 'raid_gold' | 'hq_yield' | 'mission_xp';
  bonusPct: number;
}

export function getSeasonDecree(entries: SeasonHallEntryDoc[]): SeasonDecreeInfo {
  if (!entries || entries.length === 0) {
    return {
      hasHistory: false,
      seasonNumber: 1,
      reigningFaction: 'shadow_hunters',
      championName: 'غير متوّج بعد',
      topClanName: 'صراع مفتوح',
      title: 'مرسوم الافتتاح السيادي',
      effectLabel: 'يتفعّل حكم الفصيل (+10% مكافأة للسيرفر) فور تتويج بطل الموسم الأول',
      bonusType: 'raid_gold',
      bonusPct: 0,
    };
  }

  const latest = [...entries].sort((a, b) => b.seasonNumber - a.seasonNumber)[0];
  if (latest.championFaction === 'shadow_hunters') {
    return {
      hasHistory: true,
      seasonNumber: latest.seasonNumber,
      reigningFaction: 'shadow_hunters',
      championName: latest.championName,
      topClanName: latest.topClanName,
      title: 'حكم صائدي الظلال (مرسوم الموسم)',
      effectLabel: '+10% غنائم ذهب المداهمات لجميع لاعبي السيرفر',
      bonusType: 'raid_gold',
      bonusPct: 10,
    };
  }
  if (latest.championFaction === 'tech_wardens') {
    return {
      hasHistory: true,
      seasonNumber: latest.seasonNumber,
      reigningFaction: 'tech_wardens',
      championName: latest.championName,
      topClanName: latest.topClanName,
      title: 'حكم حراس التكنولوجيا (مرسوم الموسم)',
      effectLabel: '+10% عوائد المقر والأسهم لجميع لاعبي السيرفر',
      bonusType: 'hq_yield',
      bonusPct: 10,
    };
  }
  return {
    hasHistory: true,
    seasonNumber: latest.seasonNumber,
    reigningFaction: 'blood_mages',
    championName: latest.championName,
    topClanName: latest.topClanName,
    title: 'حكم سحرة الدم (مرسوم الموسم)',
    effectLabel: '+10% خبرة XP للمهام الليلية لجميع لاعبي السيرفر',
    bonusType: 'mission_xp',
    bonusPct: 10,
  };
}

// ===============================================================
// Interactive Branching Story Cases (3-Stage Noir Investigations)
// ===============================================================
export const STORY_CASES: StoryCaseDef[] = [
  {
    id: 'case_phantom_ledger',
    title: 'قضية الدفتر الشبح',
    district: 'الحي المالي',
    minLevel: 1,
    energyCost: 2,
    image: HERO_CITY_IMAGE,
    summary: 'اختفى دفتر حسابات سري يكشف أسماء ممولي العشائر. تعقب الأثر عبر 3 مشاهد حاسمة.',
    baseGold: 750,
    baseXp: 150,
    baseStones: 2,
    nodes: [
      {
        id: 'step_1',
        title: 'المشهد 1: بوابة المصرف الخلفية',
        narrative: 'تصل عند منتصف الليل إلى الزقاق الخلفي لمصرف الظلال. الحراس يتبادلون المناوبة خلال ثوانٍ.',
        choices: [
          {
            id: 'c1_stealth',
            label: 'تسلل صامت عبر أنابيب التهوية (اختبار رشاقة)',
            stat: 'agility',
            difficulty: 16,
            successText: 'انزلقت دون أثر وتجاوزت أجهزة الاستشعار بمهارة.',
            failText: 'أصدرت صوتاً معدنياً لفت انتباه الحرس وتلقيت طلقة تحذير.',
            bonusGold: 220,
            bonusEssence: 4,
            failDamage: 10,
            nextNodeId: 'step_2',
          },
          {
            id: 'c1_bribe',
            label: 'استدراج الحارس باسم مجلس الظل (اختبار نفوذ)',
            stat: 'influence',
            difficulty: 14,
            successText: 'ارتبك الحارس وفتح لك الممر الإداري ظناً أنك مبعوث رسمي.',
            failText: 'شك الحارس في أوراقك واندلع اشتباك سريع قبل فرارك للداخل.',
            bonusGold: 180,
            bonusEssence: 3,
            failDamage: 12,
            nextNodeId: 'step_2',
          },
        ],
      },
      {
        id: 'step_2',
        title: 'المشهد 2: غرفة التشفير السفلية',
        narrative: 'أمامك محطة التشفير الرئيسية والدفتر موضوع داخل كبسولة زجاجية محمية بشفرة متغيرة.',
        choices: [
          {
            id: 'c2_hack',
            label: 'فك شيفرة القفل الإلكتروني يدوياً (اختبار براعة)',
            stat: 'mastery',
            difficulty: 20,
            successText: 'تجاوزت جدار الحماية في 9 ثوانٍ وانتزعت الكبسولة كاملة.',
            failText: 'تفعل الإنذار الصامت وأصابك تفريغ كهربائي خفيف.',
            bonusGold: 320,
            bonusEssence: 6,
            failDamage: 14,
            nextNodeId: 'step_3',
          },
          {
            id: 'c2_smash',
            label: 'تحطيم الخزانة المصفحة بالقوة قبل الإنذار (اختبار هجوم)',
            stat: 'attack',
            difficulty: 22,
            successText: 'هشمت المفصلات الفولاذية بضربة حاسمة وغنمت سبائك إضافية!',
            failText: 'صدّت اللوحة الفولاذية ضربتك وارتدت الشظايا نحوك.',
            bonusGold: 360,
            bonusEssence: 5,
            failDamage: 16,
            nextNodeId: 'step_3',
          },
        ],
      },
      {
        id: 'step_3',
        title: 'المشهد 3: كمين المخرج الأخير',
        narrative: 'عند الخروج يقطع طريقك وسيط مقنع ومعه فرقة تطويق تطالب بتسليم الدفتر.',
        choices: [
          {
            id: 'c3_hold',
            label: 'تحمل وابل النيران والاندفاع نحو المخرج (اختبار دفاع)',
            stat: 'defense',
            difficulty: 22,
            successText: 'صددت هجومهم بثبات أسطوري وغادرت الموقع حاملاً الدفتر والغنائم.',
            failText: 'خترقت بعض الطلقات درعك لكنك أفلتّ بالدفتر في اللحظة الأخيرة.',
            bonusGold: 420,
            bonusEssence: 7,
            failDamage: 18,
            nextNodeId: null,
          },
          {
            id: 'c3_duel',
            label: 'مبارزة الوسيط مباشرة لإرباك فرقته (اختبار هجوم)',
            stat: 'attack',
            difficulty: 24,
            successText: 'أسقطت الوسيط بضربتين وتراجع رجاله مذعورين تاركين صندوقهم!',
            failText: 'تبادلتما الضربات بصعوبة وانسحبت بصناديق أقل مما خططت.',
            bonusGold: 480,
            bonusEssence: 8,
            failDamage: 18,
            nextNodeId: null,
          },
        ],
      },
    ],
  },
  {
    id: 'case_crimson_convoy',
    title: 'قضية القافلة القرمزية',
    district: 'الميناء التجاري',
    minLevel: 4,
    energyCost: 3,
    image: MARKET_VAULT_IMAGE,
    summary: 'شحنة بلورية سرية تصل رصيف الضباب. اختر تكتيك الكمين وتفادى فخاخ المهربين.',
    baseGold: 1650,
    baseXp: 340,
    baseStones: 4,
    nodes: [
      {
        id: 'step_1',
        title: 'المشهد 1: منارة الرصيف 7',
        narrative: 'السفينة الشبحية ترسو وسط الضباب، والكشافات تدور بانتظام فوق الحاويات.',
        choices: [
          {
            id: 'c1_snipe',
            label: 'تعطيل مولد الكشافات من السطح (اختبار براعة)',
            stat: 'mastery',
            difficulty: 28,
            successText: 'غرق الرصيف في الظلام وتقدمت فرقتك دون رصد.',
            failText: 'رصدت طائرة الاستطلاع وميضك وأطلقت إنذار الميناء.',
            bonusGold: 460,
            bonusEssence: 8,
            failDamage: 18,
            nextNodeId: 'step_2',
          },
          {
            id: 'c1_rush',
            label: 'اقتحام جسر الرصيف قبل تفريغ الشحنة (اختبار هجوم)',
            stat: 'attack',
            difficulty: 30,
            successText: 'اجتحت نقطة التفتيش الأولى بسرعة البرق!',
            failText: 'تلقيت نيراناً متقاطعة عند الجسر قبل التمركز.',
            bonusGold: 520,
            bonusEssence: 9,
            failDamage: 20,
            nextNodeId: 'step_2',
          },
        ],
      },
      {
        id: 'step_2',
        title: 'المشهد 2: عنبر البضائع المحصّن',
        narrative: 'الحاوية الرئيسية مغلقة وموصلة بعبوة تدمير ذاتي تمنع فتحها عنوة.',
        choices: [
          {
            id: 'c2_defuse',
            label: 'تفكيك دائرة التفجير بهدوء (اختبار رشاقة)',
            stat: 'agility',
            difficulty: 34,
            successText: 'قطعت السلك الرئيسي قبل الصفر بنصف ثانية وأنقذت كامل الشحنة!',
            failText: 'تسرعت فانفجرت شحنة الدخان الحارقة مسببة ضرراً خفيفاً.',
            bonusGold: 620,
            bonusEssence: 10,
            failDamage: 22,
            nextNodeId: 'step_3',
          },
          {
            id: 'c2_negotiate',
            label: 'إجبار قبطان الشحن على تسليم رمز الأمان (اختبار نفوذ)',
            stat: 'influence',
            difficulty: 32,
            successText: 'استسلم القبطان أمام هيبتك وسلّمك الشفرة الكاملة والسبائك.',
            failText: 'ألقى القبطان جهاز الرمز في البحر وفرّ وسط الفوضى.',
            bonusGold: 580,
            bonusEssence: 9,
            failDamage: 20,
            nextNodeId: 'step_3',
          },
        ],
      },
      {
        id: 'step_3',
        title: 'المشهد 3: المطاردة البحرية',
        narrative: 'زورق حرس الميناء يحاول اعتراض طريق انسحابك عبر القناة المظلمة.',
        choices: [
          {
            id: 'c3_ram',
            label: 'تحصين القارب واختراق الحصار (اختبار دفاع)',
            stat: 'defense',
            difficulty: 36,
            successText: 'تكسرت أمواج النيران على دروعك ونجحت القافلة بالكامل!',
            failText: 'أُصيب جانب القارب لكنك عبرت القناة بسلام مع الشحنة.',
            bonusGold: 740,
            bonusEssence: 12,
            failDamage: 24,
            nextNodeId: null,
          },
          {
            id: 'c3_outmaneuver',
            label: 'مناورة خاطفة بين السفن المهجورة (اختبار رشاقة)',
            stat: 'agility',
            difficulty: 36,
            successText: 'انحرفت بزاوية حادة فارتطم زورق الخصم بالرصيف الصخري!',
            failText: 'احتك القارب بالهيكل المعدني وتضرر قليلاً أثناء الهرب.',
            bonusGold: 760,
            bonusEssence: 12,
            failDamage: 24,
            nextNodeId: null,
          },
        ],
      },
    ],
  },
  {
    id: 'case_cathedral_eclipse',
    title: 'قضية مؤامرة البرج الأعلى',
    district: 'البرج المركزي',
    minLevel: 9,
    energyCost: 4,
    image: TOWER_SPIRE_IMAGE,
    summary: 'تحقيق خطير داخل أروقة مجلس الظل الأعلى لكشف المتآمر الحقيقي والاستيلاء على خزنته.',
    baseGold: 3400,
    baseXp: 720,
    baseStones: 7,
    nodes: [
      {
        id: 'step_1',
        title: 'المشهد 1: القاعة الصامتة',
        narrative: 'تخترق قمة البرج حيث تجتمع نخبة المستشارين. كل خطوة غير محسوبة تكشف هويتك.',
        choices: [
          {
            id: 'c1_infiltrate',
            label: 'الاندماج في قافلة الحراسة الليلية (اختبار نفوذ)',
            stat: 'influence',
            difficulty: 48,
            successText: 'تحيّاك الحراس دون أدنى شك وعبرت نحو الجناح السيادي.',
            failText: 'لاحظ القائد غياب شارة المرور وأطلق الإنذار.',
            bonusGold: 950,
            bonusEssence: 14,
            failDamage: 28,
            nextNodeId: 'step_2',
          },
          {
            id: 'c1_shadow',
            label: 'عبور السقف الزجاجي فوق القاعة (اختبار رشاقة)',
            stat: 'agility',
            difficulty: 50,
            successText: 'تجاوزت القاعة بأناقة ورصدت الخائن وهو يتسلل للخزنة.',
            failText: 'تشقق الزجاج المقوى وسقطت وسط اشتباك سريع.',
            bonusGold: 1020,
            bonusEssence: 15,
            failDamage: 30,
            nextNodeId: 'step_2',
          },
        ],
      },
      {
        id: 'step_2',
        title: 'المشهد 2: غرفة الأختام السيادية',
        narrative: 'جهاز الليزر يحيط بالصندوق الأسود الذي يحوي مفاتيح البرج.',
        choices: [
          {
            id: 'c2_mirror',
            label: 'عكس أشعة الليزر عبر البلورات (اختبار براعة)',
            stat: 'mastery',
            difficulty: 54,
            successText: 'توقف نظام الحماية بالكامل وغنمت المفاتيح السيادية.',
            failText: 'انحرف أحد الأشعة وأصاب كتفك قبل إغلاق الدائرة.',
            bonusGold: 1150,
            bonusEssence: 18,
            failDamage: 32,
            nextNodeId: 'step_3',
          },
          {
            id: 'c2_tank',
            label: 'ارتداء الدرع الثقيل وانتزاع الصندوق مباشرة (اختبار دفاع)',
            stat: 'defense',
            difficulty: 54,
            successText: 'تحمّلت وابل الطاقة دون تراجع وانتزعت الصندوق!',
            failText: 'تضرر درعك من حرارة الليزر لكنك حصلت على الصندوق.',
            bonusGold: 1180,
            bonusEssence: 18,
            failDamage: 34,
            nextNodeId: 'step_3',
          },
        ],
      },
      {
        id: 'step_3',
        title: 'المشهد 3: مواجهة الخائن السيادي',
        narrative: 'كبير المستشارين يستعد للإقلاع بمروحيته المدرعة ومعه صكوك الذهب.',
        choices: [
          {
            id: 'c3_finisher',
            label: 'توجيه ضربة قاضية لمحرك المروحية والخصم (اختبار هجوم)',
            stat: 'attack',
            difficulty: 58,
            successText: 'دمّرت محرك الهروب وأجبرت الخائن على تسليم كامل الثروة!',
            failText: 'فرّ الخائن لكنك استحوذت على حقيبة الذهب والجوهر.',
            bonusGold: 1450,
            bonusEssence: 22,
            failDamage: 36,
            nextNodeId: null,
          },
          {
            id: 'c3_expose',
            label: 'بث الأدلة المسجلة فوراً على شبكة المجلس (اختبار نفوذ)',
            stat: 'influence',
            difficulty: 56,
            successText: 'انقلبت حراسته ضده فوراً ومنحك المجلس مكافأة السيادة!',
            failText: 'انقطع البث مؤقتاً واضطررت لاقتناص الحقيبة والانسحاب.',
            bonusGold: 1380,
            bonusEssence: 20,
            failDamage: 32,
            nextNodeId: null,
          },
        ],
      },
    ],
  },
];

// ===============================================================
// Co-op Multi-Player Heist Rooms (2-4 Operatives)
// ===============================================================
export const COOP_HEIST_TEMPLATES: CoopHeistTemplateDef[] = [
  {
    id: 'heist_bank_vault',
    title: 'اقتحام خزنة المصرف المركزي',
    difficulty: 'متوسط (2–4 لاعبين)',
    bossName: 'الحارس المدرع — تايتان 04',
    bossMaxHp: 4200,
    rewardGold: 2200,
    rewardEssence: 18,
    rewardStones: 5,
    rewardCrystals: 1,
    image: MARKET_VAULT_IMAGE,
    description: 'تعاون مع فريقك لكسر الدروع الثلاثية لخزنة المصرف وتقاسم السبائك والأحجار النادرة.',
  },
  {
    id: 'heist_crimson_cathedral',
    title: 'سطو سرداب الكاتدرائية القرمزية',
    difficulty: 'خطير (2–4 لاعبين)',
    bossName: 'كاردينال الدم — مالاكور',
    bossMaxHp: 9500,
    rewardGold: 4600,
    rewardEssence: 32,
    rewardStones: 9,
    rewardCrystals: 2,
    image: HQ_CITADEL_IMAGE,
    description: 'غرفة سطو عالية الخطورة تتطلب تنسيق الضربات عبر 3 مراحل دفاعية لنهب الكنوز.',
  },
  {
    id: 'heist_eclipse_core',
    title: 'سرقة قلب الكسوف السيادي',
    difficulty: 'أسطوري (2–4 لاعبين)',
    bossName: 'أركون الخسوف الأبدي',
    bossMaxHp: 18500,
    rewardGold: 9200,
    rewardEssence: 55,
    rewardStones: 16,
    rewardCrystals: 4,
    image: CLAN_RAID_BOSS_IMAGE,
    description: 'أصعب عملية سطو جماعية في المدينة — مكافآت بلورات وجوهر صياغة لكل عضو في الفرقة!',
  },
];

// ===============================================================
// Weekend Grand Surge (Fri & Sat +35% Gold & XP)
// ===============================================================
export function getWeekendSurgeStatus(nowMs = Date.now()): {
  isActive: boolean;
  msRemaining: number;
  bonusPct: number;
} {
  const d = new Date(nowMs);
  const day = d.getDay(); // 5 = Friday, 6 = Saturday
  const isActive = day === 5 || day === 6;
  if (isActive) {
    const endOfWeekend = new Date(d);
    const daysUntilSunday = day === 5 ? 2 : 1;
    endOfWeekend.setDate(d.getDate() + daysUntilSunday);
    endOfWeekend.setHours(0, 0, 0, 0);
    return {
      isActive: true,
      msRemaining: Math.max(0, endOfWeekend.getTime() - nowMs),
      bonusPct: 35,
    };
  }
  const nextFriday = new Date(d);
  const daysToFri = (5 - day + 7) % 7 || 7;
  nextFriday.setDate(d.getDate() + daysToFri);
  nextFriday.setHours(0, 0, 0, 0);
  return {
    isActive: false,
    msRemaining: Math.max(0, nextFriday.getTime() - nowMs),
    bonusPct: 35,
  };
}

// ===============================================================
// Colosseum Tournament Gold Predictions (5-Min Deterministic Cycles)
// ===============================================================
export const TOURNAMENT_CHAMPION_POOL: Array<{
  factionId: FactionId;
  name: string;
  multiplier: number;
}> = [
  { factionId: 'shadow_hunters', name: 'نصل الأوبسيديان (صائدو الظلال)', multiplier: 2.2 },
  { factionId: 'tech_wardens', name: 'مهندس القوس (حراس التكنولوجيا)', multiplier: 2.6 },
  { factionId: 'blood_mages', name: 'ساحر الياقوت (سحرة الدم)', multiplier: 3.1 },
];

export function resolveTournamentBetResult(cycleNumber: number): {
  winnerFaction: FactionId;
  winnerName: string;
  multiplier: number;
} {
  // Deterministic PRNG per cycle so all players see identical results
  const seed = Math.abs((cycleNumber * 2654435761) >>> 0) % 100;
  const pick =
    seed < 42
      ? TOURNAMENT_CHAMPION_POOL[0]
      : seed < 77
      ? TOURNAMENT_CHAMPION_POOL[1]
      : TOURNAMENT_CHAMPION_POOL[2];
  return {
    winnerFaction: pick.factionId,
    winnerName: pick.name,
    multiplier: pick.multiplier,
  };
}

export function getTournamentBetCycle(nowMs = Date.now()): {
  cycleNumber: number;
  msRemaining: number;
  lastCycleNumber: number;
  lastWinner: { winnerFaction: FactionId; winnerName: string; multiplier: number };
} {
  const CYCLE_MS = 5 * 60 * 1000;
  const cycleNumber = Math.floor(nowMs / CYCLE_MS);
  const msRemaining = Math.max(0, (cycleNumber + 1) * CYCLE_MS - nowMs);
  const lastCycleNumber = Math.max(0, cycleNumber - 1);
  return {
    cycleNumber,
    msRemaining,
    lastCycleNumber,
    lastWinner: resolveTournamentBetResult(lastCycleNumber),
  };
}



