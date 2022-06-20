import { ListState } from "../data/listSlice";
import _ from "lodash";
import { ArmyState } from "../data/armySlice";
import UnitService from "./UnitService";
import UpgradeService from "./UpgradeService";

const unitPointThresholds = {
  "gf": 200,
  "gff": 30,
  "aof": 165,
  "aofr": 165,
  "aofs": 25,
};
const heroPointThresholds = {
  "gf": 500,
  "gff": 150,
  "aof": 500,
  "aofr": 500,
  "aofs": 150,
};
const duplicateUnitThresholds = {
  "gf": 1000,
  "gff": 150,
  "aof": 1000,
  "aofr": 1000,
  "aofs": 150,
};

export default class ValidationService {

  public static getErrors(army: ArmyState, list: ListState): string[] {

    if (!army || !list)
      return [];

    const errors = [];

    if (list.pointsLimit > 0 && list.points > list.pointsLimit)
      errors.push(`Points limit exceeded: ${list.points}/${list.pointsLimit}`)

    const system = army.gameSystem;
    const points = list.pointsLimit || list.points;

    const units = list.units;
    const unitCount = units.filter(u => !u.joinToUnit).length;
    const heroes = units.filter(u => u.specialRules.some(rule => rule.name === "Hero"))
    const heroCount = heroes.length;
    const joinedHeroes = heroes.filter(u => (u.joinToUnit && units.some(t => t.selectionId === u.joinToUnit)))
    const joinedIds = joinedHeroes.map(u => u.joinToUnit);

    const duplicateUnitLimit = 1 + Math.floor((points / duplicateUnitThresholds[system]));
    const nonCombinedUnitsGrouped = _.groupBy(units.filter(u => !(u.combined && (!u.joinToUnit))), u => u.id);
    const unitsOverDuplicateLimit = Object
      .keys(nonCombinedUnitsGrouped)
      .map(key => ({
        unitName: units.find(u => u.id === key).name,
        count: nonCombinedUnitsGrouped[key].length
      }))
      .filter((grp) => grp.count > duplicateUnitLimit);

    //#region All Game Systems

    if (heroCount > Math.floor(points / heroPointThresholds[system]))
      errors.push(`Max 1 hero per full ${heroPointThresholds[system]}pts.`);

    if (unitCount > Math.floor(points / unitPointThresholds[system])) {
      const combinedMsg = system === "gf" || system === "aof" || system === "aofr"
        ? ` (combined units count as just 1 unit)`
        : "";
      errors.push(`Max 1 unit per full ${unitPointThresholds[system]}pts${combinedMsg}.`);
    }

    if (unitsOverDuplicateLimit.length > 0)
      errors.push(`Cannot have more than ${duplicateUnitLimit} copies of a particular unit (${unitsOverDuplicateLimit.map(x => x.unitName).join(", ")}).`); // combined units still count as one

    //#endregion

    if (army.gameSystem === "gf" || army.gameSystem === "aof" || army.gameSystem === "aofr") {

      if (units.some(u => u.combined && u.size === 1))
        errors.push(`Cannot combine units of unit size [1].`);

      if (units.some(u => u.size === 1 && joinedIds.includes(u.selectionId)))
        errors.push(`Heroes cannot join units that only contain a single model.`);

      if (new Set(joinedIds).size < joinedIds.length)
        errors.push(`A unit can only have a maximum of one Hero attached.`);
    }

    if (army.loadedArmyBooks.length > 2) {
      errors.push("Players may bring units from up to two factions in the same list.")
    }

    const unitsByArmy = _.groupBy(units, x => x.armyId);
    const pointsByArmy = Object.keys(unitsByArmy)
      .map((key) => unitsByArmy[key]
        .reduce((pts, unit) => pts + UpgradeService.calculateUnitTotal(unit), 0));

    if (list.points > 0 && army.loadedArmyBooks.length > 1 && !pointsByArmy.some(x => (x / points * 100) >= 60)) {
      errors.push("Mixed armies must consist of at least 60% worth of units from their primary faction.");
    }

    return errors;
  }
}