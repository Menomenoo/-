import {
  CLAN_UNITS,
  COMBAT_SKILLS,
  COMPANIONS,
  EQUIPMENT_CATALOG,
  EQUIPMENT_SETS,
  FACTIONS,
  RUNES_CATALOG,
  SUB_SPECS,
  getTowerFloorEnemy,
} from '../data/gameData';
import {
  ActiveDuelState,
  ArenaOpponentDef,
  ClanUnitId,
  CompanionId,
  EquipmentItem,
  FactionId,
  PlayerAttributes,
  PlayerSaveState,
  PublicOperativeDoc,
  RaidReport,
  RaidRoundLog,
  RaidStance,
  RaidTarget,
  RuneId,
  WorldBossDef,
} from '../types/game';

const RIVAL_NAMES: Record<FactionId, string[]> = {
  shadow_hunters: ['ذئب الغسق', 'نصل الضباب', 'صقر الأزقة', 'طيف الخنجر', 'غراب الكاتدرائية', 'ساري الظلام'],
  tech_wardens: ['درع المصفوفة', 'مهندس القوس', 'حارس النفق', 'نبض التيتانيوم', 'كاسر التردد', 'عين البرج'],
  blood_mages: ['كونت الياقوت', 'ساحر القمر الأحمر', 'ناسك الخيمياء', 'وريث الدم', 'أمين المخطوطة', 'شعلة الكأس'],
};

export function getEnhancedItemBonuses(item: EquipmentItem, enhanceLevel: number): PlayerAttributes {
  const mult = 1 + enhanceLevel * 0.15;
  return {
    attack: Math.round((item.bonuses.attack ?? 0) * mult),
    defense: Math.round((item.bonuses.defense ?? 0) * mult),
    agility: Math.round((item.bonuses.agility ?? 0) * mult),
    mastery: Math.round((item.bonuses.mastery ?? 0) * mult),
    influence: Math.round((item.bonuses.influence ?? 0) * mult),
  };
}

export function getActiveEquipmentSets(player: PlayerSaveState): Array<{
  setId: string;
  name: string;
  equippedCount: number;
  twoPieceActive: boolean;
  threePieceActive: boolean;
}> {
  const equippedIds = Object.values(player.equipped).filter(Boolean) as string[];
  return Object.values(EQUIPMENT_SETS)
    .map((setDef) => {
      const count = equippedIds.filter((id) => setDef.itemIds.includes(id)).length;
      return {
        setId: setDef.id,
        name: setDef.name,
        equippedCount: count,
        twoPieceActive: count >= 2,
        threePieceActive: count >= 3,
      };
    })
    .filter((s) => s.equippedCount > 0);
}

export function getActiveSubSpec(player: PlayerSaveState) {
  if (!player.subSpecId) return null;
  return SUB_SPECS.find((s) => s.id === player.subSpecId && s.factionId === player.factionId) || null;
}

export function getEquippedSkillBonuses(player: PlayerSaveState) {
  const ids = player.equippedCombatSkills || [];
  let attackBonusPct = 0;
  let defenseBonusPct = 0;
  let dodgeBonus = 0;
  let critBonus = 0;
  let lifestealPct = 0;
  let reflectPct = 0;

  for (const id of ids.slice(0, 3)) {
    const def = COMBAT_SKILLS.find((s) => s.id === id);
    if (!def) continue;
    attackBonusPct += def.attackBonusPct ?? 0;
    defenseBonusPct += def.defenseBonusPct ?? 0;
    dodgeBonus += def.dodgeBonus ?? 0;
    critBonus += def.critBonus ?? 0;
    lifestealPct += def.lifestealPct ?? 0;
    reflectPct += def.reflectPct ?? 0;
  }

  return { attackBonusPct, defenseBonusPct, dodgeBonus, critBonus, lifestealPct, reflectPct };
}

export function findAnyEquipmentItem(player: PlayerSaveState, itemId: string): EquipmentItem | undefined {
  return (
    EQUIPMENT_CATALOG.find((e) => e.id === itemId) ||
    (player.craftedItems || []).find((e) => e.id === itemId)
  );
}

export function getEffectiveAttributes(player: PlayerSaveState): PlayerAttributes {
  const result: PlayerAttributes = { ...player.attributes };

  // 1. Equipped items (catalog + crafted) + Forge enhancement
  for (const itemId of Object.values(player.equipped)) {
    if (!itemId) continue;
    const item = findAnyEquipmentItem(player, itemId);
    if (!item) continue;
    const enhanceLevel = player.equipmentEnhance[itemId] || 0;
    const scaled = getEnhancedItemBonuses(item, enhanceLevel);
    result.attack += scaled.attack;
    result.defense += scaled.defense;
    result.agility += scaled.agility;
    result.mastery += scaled.mastery;
    result.influence += scaled.influence;
  }

  // 2. Socketed Runes
  if (player.socketedRunes) {
    for (const runeId of Object.values(player.socketedRunes)) {
      if (!runeId) continue;
      const rune = RUNES_CATALOG[runeId];
      if (!rune) continue;
      result.attack += rune.bonuses.attack ?? 0;
      result.defense += rune.bonuses.defense ?? 0;
      result.agility += rune.bonuses.agility ?? 0;
      result.mastery += rune.bonuses.mastery ?? 0;
      result.influence += rune.bonuses.influence ?? 0;
    }
  }

  // 3. Equipment Set 2-piece & 3-piece bonuses
  const activeSets = getActiveEquipmentSets(player);
  let setPowerMult = 1;
  for (const active of activeSets) {
    const def = EQUIPMENT_SETS[active.setId];
    if (!def) continue;
    if (active.twoPieceActive) {
      result.attack += def.twoPieceMult.attack ?? 0;
      result.defense += def.twoPieceMult.defense ?? 0;
      result.agility += def.twoPieceMult.agility ?? 0;
      result.mastery += def.twoPieceMult.mastery ?? 0;
      result.influence += def.twoPieceMult.influence ?? 0;
    }
    if (active.threePieceActive) {
      setPowerMult += def.threePiecePowerPct / 100;
    }
  }

  // 4. Active Companion bonus
  if (player.activeCompanion) {
    const compLvl = player.ownedCompanions?.[player.activeCompanion] || 0;
    const compDef = COMPANIONS[player.activeCompanion];
    if (compDef && compLvl > 0) {
      result.attack += (compDef.statPerLevel.attack ?? 0) * compLvl;
      result.defense += (compDef.statPerLevel.defense ?? 0) * compLvl;
      result.agility += (compDef.statPerLevel.agility ?? 0) * compLvl;
      result.mastery += (compDef.statPerLevel.mastery ?? 0) * compLvl;
      result.influence += (compDef.statPerLevel.influence ?? 0) * compLvl;
    }
  }

  // 5. HQ Trap Grid defense bonus
  result.defense += (player.hqLevels.trap_grid - 1) * 5;

  // 6. Faction & Sub-Spec Multipliers
  const faction = FACTIONS[player.factionId];
  const subSpec = getActiveSubSpec(player);

  result.defense = Math.round(result.defense * faction.bonuses.defenseMult);
  if (subSpec?.bonuses.attackPct) {
    result.attack = Math.round(result.attack * (1 + subSpec.bonuses.attackPct / 100));
  }
  if (subSpec?.bonuses.defensePct) {
    result.defense = Math.round(result.defense * (1 + subSpec.bonuses.defensePct / 100));
  }

  if (player.unlockedPerks.includes('tw_orbital_lock')) {
    result.defense += 18;
  }

  const precisionLvl = player.researchLevels?.lethal_precision || 0;
  if (precisionLvl > 0) {
    result.attack = Math.round(result.attack * (1 + precisionLvl * 0.03));
  }

  if (setPowerMult > 1) {
    result.attack = Math.round(result.attack * setPowerMult);
    result.defense = Math.round(result.defense * setPowerMult);
  }

  if (player.prestigeRank > 0) {
    const prestigeMult = 1 + player.prestigeRank * 0.12;
    result.attack = Math.round(result.attack * prestigeMult);
    result.defense = Math.round(result.defense * prestigeMult);
    result.agility = Math.round(result.agility * prestigeMult);
    result.mastery = Math.round(result.mastery * prestigeMult);
  }

  if (player.vipActive) {
    result.attack = Math.round(result.attack * 1.1);
    result.defense = Math.round(result.defense * 1.1);
    result.mastery = Math.round(result.mastery * 1.1);
  }

  const skillBonuses = getEquippedSkillBonuses(player);
  if (skillBonuses.attackBonusPct > 0) {
    result.attack = Math.round(result.attack * (1 + skillBonuses.attackBonusPct / 100));
  }
  if (skillBonuses.defenseBonusPct > 0) {
    result.defense = Math.round(result.defense * (1 + skillBonuses.defenseBonusPct / 100));
  }

  return result;
}

export function getSocketedRuneCounts(player: PlayerSaveState): Record<RuneId, number> {
  const counts: Record<RuneId, number> = {
    poison: 0,
    lifesteal: 0,
    armor_pierce: 0,
    crit_surge: 0,
  };
  if (player.socketedRunes) {
    for (const r of Object.values(player.socketedRunes)) {
      if (r && r in counts) counts[r] += 1;
    }
  }
  return counts;
}

export function getClanPowerScore(player: PlayerSaveState): number {
  let total = 0;
  for (const unitId of Object.keys(CLAN_UNITS) as ClanUnitId[]) {
    total += (player.clanUnits?.[unitId] || 0) * CLAN_UNITS[unitId].powerEach;
  }
  return total;
}

export function getPlayerPowerScore(attrs: PlayerAttributes, clanPower = 0): number {
  return Math.round(
    attrs.attack * 2.2 + attrs.defense * 1.8 + attrs.agility * 1.5 + attrs.mastery * 1.6 + clanPower * 0.4
  );
}

export function generateRaidTargets(
  player: PlayerSaveState,
  onlineOpponents: PublicOperativeDoc[] = [],
  myUid?: string
): RaidTarget[] {
  const attrs = getEffectiveAttributes(player);
  const opposingFactions = (Object.keys(FACTIONS) as FactionId[]).filter((f) => f !== player.factionId);

  const realTargets: RaidTarget[] = onlineOpponents
    .filter((op) => op.uid !== myUid && op.factionId !== player.factionId)
    .slice(0, 3)
    .map((op) => {
      const approxStat = Math.max(10, Math.round(op.powerScore / 7));
      const myPower = getPlayerPowerScore(attrs);
      const ratio = op.powerScore / Math.max(1, myPower);
      const difficulty: RaidTarget['difficulty'] =
        ratio < 0.85 ? 'سهل' : ratio <= 1.15 ? 'متكافئ' : ratio <= 1.45 ? 'خطير' : 'أسطوري';

      return {
        id: `real-${op.uid}`,
        uid: op.uid,
        isRealPlayer: true,
        codename: `${op.codename} (لاعب حقيقي)`,
        factionId: op.factionId,
        level: op.level,
        powerRating: op.powerScore,
        vaultGold: Math.max(350, Math.min(25000, Math.round(op.vaultGold * 0.35 + op.level * 180))),
        contrabandStash: Math.max(2, Math.round(op.level * 1.2)),
        defenseScore: op.defenseScore,
        difficulty,
        attributes: {
          attack: approxStat,
          defense: Math.max(10, Math.round(op.defenseScore * 0.55)),
          agility: Math.max(10, Math.round(op.defenseScore * 0.45)),
          mastery: approxStat,
          influence: approxStat,
        },
        hqTrapLevel: Math.max(1, Math.min(20, op.level)),
      };
    });

  const presets: Array<{ mult: number; difficulty: RaidTarget['difficulty']; lootMult: number }> = [
    { mult: 0.76, difficulty: 'سهل', lootMult: 0.8 },
    { mult: 0.9, difficulty: 'متكافئ', lootMult: 1.0 },
    { mult: 1.02, difficulty: 'متكافئ', lootMult: 1.2 },
    { mult: 1.16, difficulty: 'خطير', lootMult: 1.5 },
    { mult: 1.3, difficulty: 'خطير', lootMult: 1.85 },
    { mult: 1.48, difficulty: 'أسطوري', lootMult: 2.5 },
  ];

  const aiTargets: RaidTarget[] = presets.slice(0, Math.max(3, 6 - realTargets.length)).map((preset, idx) => {
    const factionId = opposingFactions[idx % opposingFactions.length];
    const names = RIVAL_NAMES[factionId];
    const codename = names[(player.level + idx * 2) % names.length];
    const scale = preset.mult;

    const enemyAttrs: PlayerAttributes = {
      attack: Math.max(8, Math.round(attrs.attack * scale * (0.92 + ((idx * 7) % 15) / 100))),
      defense: Math.max(8, Math.round(attrs.defense * scale * (0.94 + ((idx * 5) % 12) / 100))),
      agility: Math.max(8, Math.round(attrs.agility * scale)),
      mastery: Math.max(8, Math.round(attrs.mastery * scale)),
      influence: Math.max(8, Math.round(attrs.influence * scale)),
    };

    const powerRating = getPlayerPowerScore(enemyAttrs);
    const level = Math.max(
      1,
      player.level + (preset.difficulty === 'سهل' ? -1 : preset.difficulty === 'أسطوري' ? 2 : idx > 2 ? 1 : 0)
    );
    const prestigeLootBoost = 1 + player.prestigeRank * 0.25;
    const vaultGold = Math.round((260 + player.level * 150) * preset.lootMult * prestigeLootBoost);
    const contrabandStash = Math.max(1, Math.round((2 + player.level * 0.9) * preset.lootMult));

    return {
      id: `target-${factionId}-${idx}-${player.level}`,
      codename,
      factionId,
      level,
      powerRating,
      vaultGold,
      contrabandStash,
      defenseScore: enemyAttrs.defense + enemyAttrs.agility,
      difficulty: preset.difficulty,
      attributes: enemyAttrs,
      hqTrapLevel: Math.max(1, Math.min(20, level)),
    };
  });

  return [...realTargets, ...aiTargets];
}

export function simulateVaultRaid(player: PlayerSaveState, target: RaidTarget, stance: RaidStance): RaidReport {
  const pAttrs = getEffectiveAttributes(player);
  const eAttrs = target.attributes;
  const faction = FACTIONS[player.factionId];
  const subSpec = getActiveSubSpec(player);
  const runes = getSocketedRuneCounts(player);

  const stanceAttackMod = stance === 'blitz' ? 1.24 : stance === 'stealth' ? 0.94 : 1.05;
  const stanceDefenseMod = stance === 'blitz' ? 0.82 : stance === 'stealth' ? 1.22 : 1.05;
  const stanceCritMod = stance === 'blitz' ? 0.08 : stance === 'stealth' ? 0.12 : 0.04;
  const stanceDodgeMod = stance === 'stealth' ? 0.14 : stance === 'blitz' ? -0.04 : 0.03;

  let playerHp = player.hp;
  let enemyHp = Math.round(95 + target.level * 28 + eAttrs.defense * 2.0);

  const rounds: RaidRoundLog[] = [];
  const maxRounds = 7;
  let totalDamageTaken = 0;

  const trapDamage = Math.max(2, Math.round(target.hqTrapLevel * 2.4 - pAttrs.agility * 0.15));
  if (stance !== 'stealth') {
    playerHp = Math.max(1, playerHp - trapDamage);
    totalDamageTaken += trapDamage;
    rounds.push({
      round: 0,
      actor: 'enemy',
      actionText: `فخاخ مقر ${target.codename} تنشط عند اختراق البوابة`,
      damage: trapDamage,
      isCrit: false,
      isDodged: false,
      playerHpAfter: playerHp,
      enemyHpAfter: enemyHp,
    });
  }

  const skillBonuses = getEquippedSkillBonuses(player);
  const researchCritBonus = (player.researchLevels?.lethal_precision || 0) * 0.005;
  const runeCritBonus = runes.crit_surge * 0.08;
  const armorPierceFactor = Math.max(0.25, 0.55 - runes.armor_pierce * 0.12);
  const lifestealPct =
    (player.unlockedPerks.includes('bm_crimson_siphon') ? 0.2 : 0) +
    (subSpec?.bonuses.lifestealPct ? subSpec.bonuses.lifestealPct / 100 : 0) +
    skillBonuses.lifestealPct / 100 +
    runes.lifesteal * 0.12;

  for (let r = 1; r <= maxRounds; r++) {
    if (playerHp <= 0 || enemyHp <= 0) break;

    const basePDmg = Math.max(
      8,
      pAttrs.attack * stanceAttackMod * 1.48 + pAttrs.mastery * 0.45 - eAttrs.defense * armorPierceFactor
    );
    const critChance =
      Math.min(
        0.78,
        0.1 +
          faction.bonuses.critBonus +
          (subSpec?.bonuses.critBonus || 0) +
          skillBonuses.critBonus +
          stanceCritMod +
          researchCritBonus +
          runeCritBonus +
          (pAttrs.agility - eAttrs.agility) * 0.008
      ) + (r === 1 && player.unlockedPerks.includes('sh_eclipse_blade') ? 1 : 0);

    const isCrit = Math.random() < critChance;
    const enemyDodge = Math.random() < Math.min(0.22, Math.max(0.03, (eAttrs.agility - pAttrs.agility) * 0.007));

    let pDamage = 0;
    if (!enemyDodge) {
      const variance = 0.88 + Math.random() * 0.24;
      const poisonBonus = runes.poison * Math.round(12 + pAttrs.mastery * 0.25);
      pDamage = Math.max(6, Math.round(basePDmg * variance * (isCrit ? 1.65 : 1) + poisonBonus));
      enemyHp = Math.max(0, enemyHp - pDamage);

      if (lifestealPct > 0) {
        const heal = Math.max(2, Math.round(pDamage * lifestealPct));
        playerHp = Math.min(player.maxHp, playerHp + heal);
      }
    }

    rounds.push({
      round: r,
      actor: 'player',
      actionText: enemyDodge
        ? `${target.codename} يتفادى هجومك في الظلام`
        : isCrit
        ? `ضربة حاسمة دقيقة تخترق دفاع ${target.codename}`
        : `هجوم مباشر على حراسة مخزن ${target.codename}`,
      damage: pDamage,
      isCrit,
      isDodged: enemyDodge,
      playerHpAfter: playerHp,
      enemyHpAfter: enemyHp,
    });

    if (enemyHp <= 0) break;

    const baseEDmg = Math.max(6, eAttrs.attack * 1.3 + eAttrs.mastery * 0.35 - pAttrs.defense * stanceDefenseMod * 0.6);
    const playerDodgeChance =
      Math.min(
        0.55,
        Math.max(
          0.04,
          (pAttrs.agility - eAttrs.agility) * 0.009 +
            stanceDodgeMod +
            (subSpec?.bonuses.dodgeBonus || 0) +
            skillBonuses.dodgeBonus
        )
      ) + (player.unlockedPerks.includes('sh_phantom_step') ? 0.1 : 0);

    const playerDodged = Math.random() < playerDodgeChance;
    const enemyCrit = Math.random() < 0.1;

    let eDamage = 0;
    if (!playerDodged) {
      const variance = 0.85 + Math.random() * 0.28;
      eDamage = Math.max(4, Math.round(baseEDmg * variance * (enemyCrit ? 1.45 : 1)));
      playerHp = Math.max(0, playerHp - eDamage);
      totalDamageTaken += eDamage;

      const reflectRatio = (player.unlockedPerks.includes('tw_reactive_plating') ? 0.15 : 0) + skillBonuses.reflectPct / 100;
      if (reflectRatio > 0 && eDamage > 0) {
        const reflected = Math.max(2, Math.round(eDamage * reflectRatio));
        enemyHp = Math.max(0, enemyHp - reflected);
      }
    }

    rounds.push({
      round: r,
      actor: 'enemy',
      actionText: playerDodged
        ? `تفاديت الهجوم المضاد ببراعة`
        : enemyCrit
        ? `${target.codename} يطلق ردة فعل حرجة`
        : `${target.codename} يرد بهجوم دفاعي`,
      damage: eDamage,
      isCrit: enemyCrit,
      isDodged: playerDodged,
      playerHpAfter: playerHp,
      enemyHpAfter: enemyHp,
    });
  }

  const victory = enemyHp <= 0 || (playerHp > 0 && playerHp / player.maxHp >= enemyHp / (95 + target.level * 28));

  let goldStolen = 0;
  let contrabandStolen = 0;
  let xpGained = 30;
  let dominanceGained = 0;
  let crystalsFound = 0;
  let forgeStonesFound = 0;

  if (victory) {
    const bloodMoonMult = player.activeEventId === 'blood_moon' ? 2 : 1;
    const subSpecLoot = 1 + (subSpec?.bonuses.raidLootPct || 0) / 100;
    const lootMult =
      faction.bonuses.raidLootMult * subSpecLoot * (player.vipActive ? 1.2 : 1) * (1 + pAttrs.influence * 0.01) * bloodMoonMult;
    goldStolen = Math.round(target.vaultGold * lootMult * (0.9 + Math.random() * 0.25));
    const contrabandBonus =
      (player.unlockedPerks.includes('sh_vault_ripper') ? 1.3 : 1) *
      (1 + (player.researchLevels?.alchemy_archive || 0) * 0.02);
    contrabandStolen = Math.max(1, Math.round(target.contrabandStash * contrabandBonus));
    const xpMult = (1 + (player.researchLevels?.intel_network || 0) * 0.04 + player.prestigeRank * 0.25) * bloodMoonMult;
    xpGained = Math.round((60 + target.level * 24) * xpMult);
    dominanceGained = target.difficulty === 'أسطوري' ? 3 : target.difficulty === 'خطير' ? 2 : 1;
    if (target.difficulty === 'أسطوري' && Math.random() < 0.08) {
      crystalsFound = 1;
    }
    if (Math.random() < (target.difficulty === 'أسطوري' ? 0.85 : 0.45)) {
      forgeStonesFound = target.difficulty === 'أسطوري' ? 3 : 1;
    }
  }

  return {
    id: `raid-${Date.now()}`,
    targetName: target.codename,
    targetFaction: target.factionId,
    stance,
    victory,
    goldStolen,
    contrabandStolen,
    xpGained,
    dominanceGained,
    damageTaken: totalDamageTaken,
    crystalsFound,
    forgeStonesFound,
    rounds,
    timestamp: Date.now(),
  };
}

export function simulateWorldBossStrike(
  player: PlayerSaveState,
  boss: WorldBossDef,
  currentBossHp: number
): {
  damageDealt: number;
  damageTaken: number;
  newBossHp: number;
  defeated: boolean;
  isCrit: boolean;
  goldChip: number;
  xpChip: number;
} {
  const attrs = getEffectiveAttributes(player);
  const precisionBonus = 1 + (player.researchLevels?.lethal_precision || 0) * 0.03;
  const runes = getSocketedRuneCounts(player);
  const critChance = Math.min(
    0.7,
    0.14 + attrs.agility * 0.004 + FACTIONS[player.factionId].bonuses.critBonus + runes.crit_surge * 0.08
  );
  const isCrit = Math.random() < critChance;

  const baseDmg =
    (attrs.attack * 2.6 + attrs.mastery * 1.35 + runes.poison * 25) * precisionBonus * (0.9 + Math.random() * 0.25);
  const damageDealt = Math.max(25, Math.round(baseDmg * (isCrit ? 1.7 : 1)));
  const newBossHp = Math.max(0, currentBossHp - damageDealt);
  const defeated = newBossHp <= 0;

  const damageTaken = Math.max(
    8,
    Math.round(boss.attackPower * (1.1 - Math.min(0.65, attrs.defense / (attrs.defense + 80))))
  );
  const goldChip = Math.round((120 + damageDealt * 0.4) * (1 + player.prestigeRank * 0.25));
  const xpChip = Math.round(45 + damageDealt * 0.08);

  return {
    damageDealt,
    damageTaken,
    newBossHp,
    defeated,
    isCrit,
    goldChip,
    xpChip,
  };
}

export function simulateTowerFloorBattle(player: PlayerSaveState, floor: number): {
  victory: boolean;
  enemyName: string;
  isBoss: boolean;
  damageTaken: number;
  roundsSummary: string[];
  rewardGold: number;
  rewardEssence: number;
  rewardStones: number;
  rewardCrystals: number;
  rewardXp: number;
} {
  const enemy = getTowerFloorEnemy(floor);
  const attrs = getEffectiveAttributes(player);
  const runes = getSocketedRuneCounts(player);

  let pHp = player.hp;
  let eHp = enemy.hp;
  const logs: string[] = [];
  let totalDamageTaken = 0;
  const armorMitigation = Math.max(0.2, 0.45 - runes.armor_pierce * 0.1);

  for (let r = 1; r <= 12; r++) {
    if (pHp <= 0 || eHp <= 0) break;
    const isCrit = Math.random() < Math.min(0.65, 0.16 + attrs.agility * 0.005 + runes.crit_surge * 0.08);
    const dmg = Math.max(
      14,
      Math.round((attrs.attack * 2.1 + attrs.mastery * 0.8 - enemy.defense * armorMitigation) * (isCrit ? 1.65 : 1))
    );
    eHp = Math.max(0, eHp - dmg);
    if (runes.lifesteal > 0) {
      pHp = Math.min(player.maxHp, pHp + Math.round(dmg * runes.lifesteal * 0.12));
    }
    logs.push(`جولة ${r}: ألحقت ${dmg} ضرراً${isCrit ? ' (حاسمة)' : ''} بـ ${enemy.name}.`);
    if (eHp <= 0) break;

    const eDmg = Math.max(4, Math.round(enemy.attack * 1.15 - attrs.defense * 0.48));
    pHp = Math.max(0, pHp - eDmg);
    totalDamageTaken += eDmg;
    logs.push(`جولة ${r}: ${enemy.name} أصابك بضرر ${eDmg}.`);
  }

  const victory = eHp <= 0 && pHp > 0;
  return {
    victory,
    enemyName: enemy.name,
    isBoss: enemy.isBoss,
    damageTaken: Math.min(player.hp - 1, totalDamageTaken),
    roundsSummary: logs.slice(0, 8),
    rewardGold: victory ? Math.round(enemy.rewardGold * (1 + player.prestigeRank * 0.25)) : 0,
    rewardEssence: victory ? enemy.rewardEssence : 0,
    rewardStones: victory ? enemy.rewardStones : 0,
    rewardCrystals: victory ? enemy.rewardCrystals : 0,
    rewardXp: victory ? enemy.rewardXp : 20,
  };
}

export function simulateCompanionDuel(
  player: PlayerSaveState,
  enemyCompanionId: CompanionId,
  enemyLevel: number
): {
  victory: boolean;
  playerCompanionName: string;
  enemyCompanionName: string;
  logs: string[];
  rewardGold: number;
  rewardEssence: number;
} {
  const myCompId = player.activeCompanion || 'shadow_raven';
  const myComp = COMPANIONS[myCompId];
  const myLvl = Math.max(1, player.ownedCompanions[myCompId] || 1);
  const enemyComp = COMPANIONS[enemyCompanionId];

  let myHp = 100 + myLvl * 28;
  let enemyHp = 95 + enemyLevel * 26;
  const logs: string[] = [];

  for (let r = 1; r <= 6; r++) {
    if (myHp <= 0 || enemyHp <= 0) break;
    const myDmg = Math.round(18 + myLvl * 7 + Math.random() * 12);
    enemyHp = Math.max(0, enemyHp - myDmg);
    if (myCompId === 'blood_hound') {
      myHp += Math.round(myDmg * 0.2);
    }
    logs.push(`جولة ${r}: ${myComp.name} هاجم بضرر ${myDmg}.`);
    if (enemyHp <= 0) break;

    const eShield = myCompId === 'tech_drone' ? 0.82 : 1;
    const eDmg = Math.round((15 + enemyLevel * 6.5 + Math.random() * 10) * eShield);
    myHp = Math.max(0, myHp - eDmg);
    logs.push(`جولة ${r}: ${enemyComp.name} الخصم رد بضرر ${eDmg}.`);
  }

  const victory = enemyHp <= 0 || myHp >= enemyHp;
  return {
    victory,
    playerCompanionName: myComp.name,
    enemyCompanionName: enemyComp.name,
    logs,
    rewardGold: victory ? Math.round((320 + enemyLevel * 85) * (1 + player.prestigeRank * 0.2)) : 60,
    rewardEssence: victory ? 6 + Math.floor(enemyLevel / 3) : 1,
  };
}

export function initArenaDuel(player: PlayerSaveState, opponent: ArenaOpponentDef): ActiveDuelState {
  return {
    opponentId: opponent.id,
    opponentName: opponent.name,
    opponentFaction: opponent.factionId,
    opponentMaxHp: opponent.hp,
    opponentHp: opponent.hp,
    opponentAttack: opponent.attack,
    opponentDefense: opponent.defense,
    enemyIntent: 'normal',
    playerHp: player.maxHp,
    playerMaxHp: player.maxHp,
    playerFury: 25,
    potionsLeft: 2,
    turn: 1,
    logs: [`بدأت المواجهة في الحلبة ضد ${opponent.name}!`],
    finished: false,
    victory: null,
  };
}

export function stepArenaDuel(
  player: PlayerSaveState,
  duel: ActiveDuelState,
  action: 'strike' | 'guard' | 'ultimate' | 'potion'
): ActiveDuelState {
  if (duel.finished) return duel;

  const attrs = getEffectiveAttributes(player);
  const runes = getSocketedRuneCounts(player);
  const logs = [...duel.logs];
  let pHp = duel.playerHp;
  let eHp = duel.opponentHp;
  let fury = duel.playerFury;
  let potions = duel.potionsLeft;
  let guardActive = false;

  const enemyGuarding = duel.enemyIntent === 'guard';
  const defMitigation = enemyGuarding ? 0.55 : 1.0;
  const armorPierceFactor = Math.max(0.15, 0.45 - runes.armor_pierce * 0.1);

  if (action === 'strike') {
    const isCrit = Math.random() < Math.min(0.65, 0.14 + attrs.agility * 0.005 + runes.crit_surge * 0.08);
    const dmg = Math.max(
      12,
      Math.round(
        (attrs.attack * 1.9 + attrs.mastery * 0.5 + runes.poison * 18 - duel.opponentDefense * armorPierceFactor) *
          defMitigation *
          (isCrit ? 1.6 : 1)
      )
    );
    eHp = Math.max(0, eHp - dmg);
    if (runes.lifesteal > 0) {
      pHp = Math.min(duel.playerMaxHp, pHp + Math.round(dmg * runes.lifesteal * 0.12));
    }
    fury = Math.min(100, fury + 25);
    logs.unshift(`جولة ${duel.turn}: وجهت ضربة نصل ${isCrit ? 'حاسمة ' : ''}بضرر ${dmg} نقطة (+25 غضب).`);
  } else if (action === 'guard') {
    guardActive = true;
    const heal = Math.round(duel.playerMaxHp * 0.1);
    const counter = Math.max(6, Math.round(attrs.defense * 0.6));
    pHp = Math.min(duel.playerMaxHp, pHp + heal);
    eHp = Math.max(0, eHp - counter);
    fury = Math.min(100, fury + 15);
    logs.unshift(`جولة ${duel.turn}: اتخذت وضعية الصد، استعدت ${heal} صحة ورددّت بضرر ${counter}.`);
  } else if (action === 'ultimate' && fury >= 50) {
    fury -= 50;
    const ultDmg = Math.max(
      28,
      Math.round((attrs.attack * 3.1 + attrs.mastery * 1.4 - duel.opponentDefense * 0.25) * defMitigation)
    );
    eHp = Math.max(0, eHp - ultDmg);
    if (player.factionId === 'blood_mages') {
      const siphon = Math.round(ultDmg * 0.3);
      pHp = Math.min(duel.playerMaxHp, pHp + siphon);
      logs.unshift(`جولة ${duel.turn}: أطلقت طقس الدم الأقصى بضرر ${ultDmg} وامتصصت ${siphon} صحة!`);
    } else {
      logs.unshift(`جولة ${duel.turn}: أطلقت قدرة الفصيل القاضية بضرر ${ultDmg} نقطة!`);
    }
  } else if (action === 'potion' && potions > 0) {
    potions -= 1;
    const heal = Math.round(duel.playerMaxHp * 0.35);
    pHp = Math.min(duel.playerMaxHp, pHp + heal);
    logs.unshift(`جولة ${duel.turn}: شربت ترياق الظل واستعدت ${heal} نقطة صحة.`);
  }

  if (eHp > 0 && player.activeCompanion) {
    const compLvl = player.ownedCompanions?.[player.activeCompanion] || 0;
    const compDef = COMPANIONS[player.activeCompanion];
    if (compLvl > 0 && compDef) {
      const compDmg = Math.round(10 + compLvl * 6 + attrs.mastery * 0.25);
      eHp = Math.max(0, eHp - compDmg);
      if (player.activeCompanion === 'blood_hound') {
        const compHeal = Math.max(3, Math.round(compDmg * 0.35));
        pHp = Math.min(duel.playerMaxHp, pHp + compHeal);
        logs.unshift(`مرافقك (${compDef.name}) هاجم بضرر ${compDmg} وعالجك +${compHeal} صحة.`);
      } else {
        logs.unshift(`مرافقك (${compDef.name}) ساندك بهجوم مباشر بضرر ${compDmg}.`);
      }
    }
  }

  if (eHp <= 0) {
    return {
      ...duel,
      playerHp: pHp,
      opponentHp: 0,
      playerFury: fury,
      potionsLeft: potions,
      logs: logs.slice(0, 12),
      finished: true,
      victory: true,
    };
  }

  const intentMult = duel.enemyIntent === 'heavy' ? 1.45 : duel.enemyIntent === 'guard' ? 0.65 : 1.0;
  const guardMitigation = guardActive ? 0.4 : 1.0;
  const compShield = player.activeCompanion === 'tech_drone' ? 0.85 : 1.0;
  const rawEDmg = duel.opponentAttack * intentMult - attrs.defense * 0.42;
  const eDmg = Math.max(5, Math.round(Math.max(8, rawEDmg) * guardMitigation * compShield));
  pHp = Math.max(0, pHp - eDmg);

  logs.unshift(
    `${duel.opponentName} ${
      duel.enemyIntent === 'heavy' ? 'نفّذ هجوماً عنيفاً' : duel.enemyIntent === 'guard' ? 'تحصّن وهاجم بحذر' : 'هاجمك'
    } بضرر ${eDmg} نقطة.`
  );

  const nextIntents: ActiveDuelState['enemyIntent'][] = ['normal', 'heavy', 'guard'];
  const nextIntent = nextIntents[Math.floor(Math.random() * nextIntents.length)];

  if (pHp <= 0) {
    return {
      ...duel,
      playerHp: 0,
      opponentHp: eHp,
      playerFury: fury,
      potionsLeft: potions,
      logs: logs.slice(0, 12),
      finished: true,
      victory: false,
    };
  }

  return {
    ...duel,
    playerHp: pHp,
    opponentHp: eHp,
    playerFury: fury,
    potionsLeft: potions,
    enemyIntent: nextIntent,
    turn: duel.turn + 1,
    logs: logs.slice(0, 12),
  };
}
