import {
  ISelectedUnit,
  IUpgrade,
  IUpgradeDependency,
  IUpgradeGains,
  IUpgradeGainsItem,
  IUpgradeOption,
  IUpgradePackage,
} from "../data/interfaces";
import EquipmentService from "./EquipmentService";
import "../extensions";
import RulesService from "./RulesService";
import { nanoid } from "nanoid";
import _ from "lodash";
import UnitService from "./UnitService";
import { makeCopy } from "./Helpers";

export default class UpgradeService {
  private static readonly countRegex = /^(\d+)x\s/;

  // TODO: Hacky singleton thing?
  public static gameSystem: string;

  static calculateListTotal(list: ISelectedUnit[]) {
    // TODO: Campaign unit XP
    return list.reduce((value, current) => value + UpgradeService.calculateUnitTotal(current), 0);
  }

  public static buildUpgrades(unit: ISelectedUnit) {
    if (!unit) return null;

    unit.loadout = JSON.parse(JSON.stringify(unit.equipment));

    //console.log("Build upgrades for:", makeCopy(unit));

    for (let upgrade of makeCopy(unit.selectedUpgrades)) {
      this.applyUpgrade(unit, upgrade.upgrade, upgrade.option);
      //console.log("after upgrade, ", makeCopy(unit));
    }

    return unit;
  }

  private static applyUpgrade(unit: ISelectedUnit, upgrade: IUpgrade, option: IUpgradeOption) {
    const affectsCount =
      typeof upgrade.affects === "number"
        ? upgrade.affects
        : upgrade.affects === "all"
        ? unit.size || 1 // All in unit
        : 1;

    const isAffectsAll = upgrade.affects === "all";

    const gainEquipment = option.gains.filter(
      (item) => item.type === "ArmyBookItem" || item.type === "ArmyBookWeapon"
    );

    if (upgrade.type === "upgradeRule") {
      // TODO: Refactor this - shouldn't be using display name func to compare probably!
      const existingRuleIndex = unit.specialRules.findIndex(
        (r) => RulesService.displayName(r) === (upgrade.replaceWhat[0] as string)
      );

      // Remove existing rule
      if (existingRuleIndex > -1) unit.specialRules.splice(existingRuleIndex, 1);

      return;
    } else if (upgrade.type === "upgrade") {
      unit.loadout = unit.loadout.concat(
        gainEquipment.map((g) => ({
          ...g,
          count: isAffectsAll ? g.count * unit.size : g.count,
        }))
      );
    } else if (upgrade.type === "replace") {
      let removeCount = affectsCount;
      const allEquipment = UnitService.getAllEquipment(unit);

      if (isAffectsAll) {
        for (let what of upgrade.replaceWhat as string[]) {
          const toReplace = allEquipment.find((e) => EquipmentService.compareEquipment(e, what));
          if (toReplace.count < removeCount) removeCount = toReplace.count;
        }
      }

      for (let what of upgrade.replaceWhat as string[]) {
        const target = what.replace(this.countRegex, "");
        const toReplace = allEquipment.find((e) => EquipmentService.compareEquipment(e, target));
        const countMatch = this.countRegex.exec(what);
        toReplace.count -= removeCount * (countMatch ? parseInt(countMatch[1]) : 1);
      }

      unit.loadout = unit.loadout.concat(
        gainEquipment.map((g) => ({
          ...g,
          // "Replace all" is replacing each item with "g.count" copies,
          // whereas "replace 2x something" is replacing 2 with "g.count"
          count: isAffectsAll ? g.count * removeCount : g.count,
        }))
      );
    }

    // Remove upgrade/attachments that rely on something that is being removed
    const toRemove = unit.loadout.filter((e) => e.count <= 0);
    for (let item of toRemove) {
      for (let dep of (item.dependencies ?? []).filter(
        (dep) => dep.type === "upgrade" || dep.type === "attachment"
      )) {
        this.removeById(unit, dep.upgradeInstanceId);
      }
    }

    // Remove entires with no count left
    unit.loadout = unit.loadout.filter((e) => e.count > 0);
    for (let item of unit.loadout.filter((i) => i.type === "ArmyBookItem") as IUpgradeGainsItem[]) {
      item.content = item.content.filter(
        (c) =>
          c.count === undefined || // Keep items that don't have a count property at all
          c.count > 0 // Items that have a count
      );
    }
  }

  static calculateUnitTotal(unit: ISelectedUnit) {
    if (!unit) return 0;
    let cost = unit.cost;

    for (const upgrade of unit.selectedUpgrades.map((su) => su.option)) {
      if (upgrade.cost) {
        cost += upgrade.cost;
      }
    }

    const levelCost =
      UpgradeService.gameSystem === "gf" || UpgradeService.gameSystem === "aof" ? 25 : 5;

    if (unit.xp) {
      cost += Math.floor(unit.xp / 5) * levelCost;
    }

    return cost;
  }

  public static isApplied(unit: ISelectedUnit, upgrade: IUpgrade, option: IUpgradeOption): boolean {
    return unit.selectedUpgrades.map((su) => su.option).contains((u) => u.id === option.id);
  }

  public static countApplied(
    unit: ISelectedUnit,
    upgrade: IUpgrade,
    option: IUpgradeOption
  ): number {
    return unit.selectedUpgrades.map((su) => su.option).filter((u) => u.id === option.id).length;
  }

  public static countAvailable(unit: ISelectedUnit, upgrade: IUpgrade) {
    const appliedInGroup = upgrade.options.reduce(
      (total, opt) => total + this.countApplied(unit, upgrade, opt),
      0
    );
    const groups = _.groupBy(UnitService.getAllEquipment(unit), (e) => e.name);
    const requiredCount = typeof upgrade.affects === "number" ? upgrade.affects : 1;

    let available = 999;

    for (let what of upgrade.replaceWhat) {
      const target = what.replace(this.countRegex, "");
      const countMatch = this.countRegex.exec(what);
      const requiredCountForTarget = requiredCount * (countMatch ? parseInt(countMatch[1]) : 1);

      const groupKey = Object.keys(groups).find((k) =>
        EquipmentService.compareEquipmentNames(k, target)
      );

      const toReplace: IUpgradeGains[] = groups[groupKey];
      if (!toReplace) return 0;

      const toReplaceCount = toReplace.reduce((count, gain) => count + gain.count, 0);
      available = Math.min(toReplaceCount, available);

      // Would not have enough to replace
      // if (requiredCountForTarget > toReplaceCount)
      //   return 0;

      // May only select up to the limit
      if (typeof upgrade.select === "number") {
        // Any model may replace 1...
        if (upgrade.affects === "any") {
          available = Math.min(available, upgrade.select * unit.size);
        } else {
          available = Math.min(available, (upgrade.select as any) - appliedInGroup);
        }
      }
      if (typeof upgrade.affects === "number") {
        available = Math.min(available, (upgrade.affects as any) - appliedInGroup);
      }
    }

    return available;
  }

  public static getControlType(
    unit: ISelectedUnit,
    upgrade: IUpgrade
  ): "check" | "radio" | "updown" {
    const combinedMultiplier = 1; //unit.combined ? 2 : 1;
    const combinedAffects = upgrade.affects; //(unit.combined && typeof (upgrade.affects) === "number") ? upgrade.affects * 2 : upgrade.affects;

    if (upgrade.type === "upgrade") {
      // "Upgrade any model with:"
      if (
        upgrade.affects === "any" &&
        (unit?.size > 1 || (upgrade.replaceWhat && upgrade.replaceWhat[0]?.length > 0))
      )
        return "updown";

      // Select > 1
      if (typeof upgrade.select === "number") {
        // "Upgrade with one:"
        if (upgrade.select * combinedMultiplier === 1) return "radio";

        return "updown";
      }

      return "check";
    }

    // "Upgrade Psychic(1):"
    if (upgrade.type === "upgradeRule") {
      return "check";
    }

    if (upgrade.type === "replace") {
      // "Replace [weapon]:"
      if (!upgrade.affects) {
        if (typeof upgrade.select === "number") return "updown";
        return "radio";
      }
      // "Replace one [weapon]:"
      // "Replace all [weapons]:"
      if (combinedAffects === 1 || upgrade.affects === "all") {
        return "radio";
      }
      // "Replace any [weapon]:"
      // "Replace 2 [weapons]:"
      if (upgrade.affects === "any" || typeof upgrade.affects === "number") {
        return "updown";
      }
    }

    console.error("No control type for: ", upgrade);

    return "updown";
  }

  public static isValid(unit: ISelectedUnit, upgrade: IUpgrade, option: IUpgradeOption): boolean {
    const controlType = this.getControlType(unit, upgrade);
    //const alreadySelected = this.countApplied(unit, upgrade, option);
    const appliedInGroup = upgrade.options.reduce(
      (total, opt) => total + this.countApplied(unit, upgrade, opt),
      0
    );

    // if it's a radio, it's valid if any other upgrade in the group is already applied
    if (controlType === "radio") if (appliedInGroup > 0) return true;

    if (upgrade.type === "replace") {
      const requiredCount = typeof upgrade.affects === "number" ? upgrade.affects : 1;

      const groups = _.groupBy(UnitService.getAllEquipment(unit), (e) => e.name);

      for (let what of upgrade.replaceWhat) {
        const target = what.replace(this.countRegex, "");
        const countMatch = this.countRegex.exec(what);
        const requiredCountForTarget = requiredCount * (countMatch ? parseInt(countMatch[1]) : 1);

        const groupKey = Object.keys(groups).find((k) =>
          EquipmentService.compareEquipmentNames(k, target)
        );

        const toReplace: IUpgradeGains[] = groups[groupKey];
        if (!toReplace) return false;

        const toReplaceCount = toReplace.reduce((count, gain) => count + gain.count, 0);

        // Would not have enough to replace
        if (requiredCountForTarget > toReplaceCount) return false;

        // May only select up to the limit
        if (typeof upgrade.select === "number") {
          // Any model may replace 1...
          if (upgrade.affects === "any") {
            if (appliedInGroup >= upgrade.select * unit.size) {
              return false;
            }
          } else if (appliedInGroup >= upgrade.select) {
            return false;
          }
        } else if (unit.combined && upgrade.affects === 1 && appliedInGroup >= 2) {
          return false;
        }
      }
    }

    if (upgrade.type === "upgrade") {
      // upgrade (n? (models|weapons)?) with...
      var available = unit.size;

      // if replacing equipment, count number of those equipment available
      if (upgrade.replaceWhat) {
        for (let what of upgrade.replaceWhat) {
          available = unit.loadout
            // Take only the gains that match this dependency
            .filter((g) => EquipmentService.compareEquipment(g, what))
            // Count how many we have
            .reduce((count, next) => count + next.count, 0);
        }
      }

      // Upgrade [(any)?] with n:
      if (typeof upgrade.select === "number") {
        if (upgrade.affects === "any") {
          if (appliedInGroup >= upgrade.select * available) {
            return false;
          }
        } else if (
          appliedInGroup >= upgrade.select ||
          (upgrade.attachment && appliedInGroup >= available)
        ) {
          return false;
        }

        // Upgrade any
      } else if (upgrade.affects === "any" && appliedInGroup >= available) {
        return false;
      }
    }

    return true;
  }

  public static apply(unit: ISelectedUnit, upgrade: IUpgrade, option: IUpgradeOption) {
    const upgradeInstanceId = nanoid(9);
    const optionToApply = {
      ...option,
      gains: option.gains.map((g) => ({
        ...g,
        dependencies: [],
        content:
          g.type === "ArmyBookItem"
            ? (g as IUpgradeGainsItem).content.map((c) => ({
                ...c,
                count: c.count ?? 1,
                dependencies: [],
              }))
            : undefined,
      })),
    };

    // Add this upgrade to the unit
    unit.selectedUpgrades.push({
      instanceId: upgradeInstanceId,
      upgrade: { ...upgrade, options: null },
      option: optionToApply,
    });

    // Figure out deps...
    if (upgrade.replaceWhat?.length > 0) {
      const affectsCount =
        typeof upgrade.affects === "number"
          ? upgrade.affects
          : upgrade.affects === "all"
          ? unit.size || 1 // All in unit
          : 1;

      // Find a thing to depend on for each thing we're replacing
      for (let target of upgrade.replaceWhat) {
        let remainingToReplace = affectsCount;

        const applyDependency = (equipment: IUpgradeGains[]) => {
          const item = equipment.find((g) => EquipmentService.compareEquipment(g, target));
          if (!item) return;

          if (!item.dependencies) item.dependencies = [];

          // gain is a thing we're looking for, check to see if it can be depended upon
          const alreadyTaken = item.dependencies
            .filter((dep) => dep.type === "replace")
            .reduce((count, dep) => count + dep.count, 0);
          const remainingAvailable = item.count - alreadyTaken;

          // The lesser of "the amount we have" vs "the amount we need"
          const count = Math.min(remainingAvailable, remainingToReplace);
          if (count > 0) {
            item.dependencies.push({
              upgradeInstanceId,
              count: count,
              type: upgrade.type,
            });

            remainingToReplace -= count;
          }
        };

        // Try and depend on equipment before anything else
        applyDependency(unit.equipment);

        // -1 because we've added "this" upgrade already above, and want to skip it
        const startAtIndex = unit.selectedUpgrades.length - 1;

        // Check each applied upgrade, in reverse order until we find a thing to depend upon
        for (let i = startAtIndex; i > 0; i--) {
          // Stop looking if we've replaced enough
          if (remainingToReplace <= 0) break;

          const upgrade = unit.selectedUpgrades[i - 1];

          applyDependency(this.getAllGains(upgrade.option));
        }
      }
    }

    unit = this.buildUpgrades(unit);
  }

  public static getAllGains(option: IUpgradeOption) {
    const nestedItems = _.flatMap(
      option.gains.filter((e) => e.type === "ArmyBookItem"),
      (e: IUpgradeGainsItem) => e.content
    );

    return option.gains.concat(nestedItems);
  }

  public static remove(unit: ISelectedUnit, option: IUpgradeOption) {
    console.log("Removing option...", JSON.parse(JSON.stringify(option)));

    const removeId = (() => {
      for (let i = unit.selectedUpgrades.length - 1; i >= 0; i--) {
        const upgrade = unit.selectedUpgrades[i];
        if (upgrade.option.id === option.id) return upgrade.instanceId;
      }
      return null;
    })();

    this.removeById(unit, removeId);
  }

  public static removeById(unit: ISelectedUnit, optionInstanceId: string) {
    const removeAt = unit.selectedUpgrades.findLastIndex((u) => u.instanceId === optionInstanceId);
    const toRemove = unit.selectedUpgrades[removeAt];

    console.log("Removing...", JSON.parse(JSON.stringify(toRemove)));

    for (let gain of toRemove.option.gains) {
      if (gain.type === "ArmyBookItem") {
        for (let nestedItem of (gain as IUpgradeGainsItem).content) {
          for (let dep of makeCopy(nestedItem.dependencies)) {
            this.removeById(unit, dep.upgradeInstanceId);
          }
        }
      }
      for (let dep of makeCopy(gain.dependencies)) {
        this.removeById(unit, dep.upgradeInstanceId);
      }
    }

    // Remove the upgrade
    unit.selectedUpgrades.splice(removeAt, 1);

    const removeFromDeps = (deps: IUpgradeDependency[]) => {
      const idx = deps.findIndex((d) => d.upgradeInstanceId === optionInstanceId);
      if (idx >= 0) deps.splice(idx, 1);
    };

    // Remove this item from dependencies of other items
    for (let opt of unit.equipment) removeFromDeps(opt.dependencies ?? []);

    const allGainsOfAllUpgrades = unit.selectedUpgrades.map((x) => this.getAllGains(x.option));
    for (let opt of _.flatMap(allGainsOfAllUpgrades, (x) => x) as IUpgradeGains[]) {
      removeFromDeps(opt.dependencies ?? []);
    }

    // Expensive to put this here but guarantees it'll be up to date!
    unit = this.buildUpgrades(unit);
  }
}
