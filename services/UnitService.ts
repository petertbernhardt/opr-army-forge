import { nanoid } from "@reduxjs/toolkit";
import {
  IUnit,
  ISelectedUnit,
  IUpgradeGains,
  IUpgradeGainsItem,
  IUpgradeGainsRule,
  IUpgradeGainsWeapon,
  IUpgradePackage,
  IUpgrade,
  IUpgradeOption,
} from "../data/interfaces";
import { ListState } from "../data/listSlice";
import _ from "lodash";
import EquipmentService from "./EquipmentService";

export default class UnitService {
  public static getSelected(list: ListState): ISelectedUnit {
    return list.selectedUnitId === null || list.selectedUnitId === undefined
      ? null
      : list.units.filter((u) => u.selectionId === list.selectedUnitId)[0];
  }

  public static getAllEquipment(unit: ISelectedUnit) {
    const items = unit.loadout.filter((e) => e.type === "ArmyBookItem");
    const itemContent = items.flatMap((i: IUpgradeGainsItem) => i.content);
    return unit.loadout.concat(itemContent);
  }

  public static getAllUpgrades(unit: ISelectedUnit, excludeModels: boolean): IUpgradeGains[] {
    return unit.selectedUpgrades
      .map((x) => x.option)
      .filter((u) => (excludeModels ? !u.isModel : true))
      .reduce((value, option) => value.concat(option.gains), []);
  }

  public static getUpgradeRules(unit: ISelectedUnit): IUpgradeGainsRule[] {
    return this
      .getAllUpgrades(unit, true)
      .filter(x => x.type === "ArmyBookRule") as IUpgradeGainsRule[];
  }

  public static getUpgradeItems(unit: ISelectedUnit): IUpgradeGainsItem[] {
    return this
      .getAllUpgrades(unit, true)
      .filter(x => x.type === "ArmyBookItem") as IUpgradeGainsItem[];
  }

  public static getAllUpgradedRules(unit: ISelectedUnit): IUpgradeGainsRule[] {
    const upgrades = this.getAllUpgrades(unit, true);

    const rules = upgrades.filter((u) => u.type === "ArmyBookRule") || [];
    const rulesFromitems =
      upgrades
        .filter((u) => u.type === "ArmyBookItem")
        .reduce(
          (value, u: IUpgradeGainsItem) =>
            value.concat(u.content.filter((c) => c.type === "ArmyBookRule" || c.type === "ArmyBookDefense")),
          []
        ) || [];

    return rules.concat(rulesFromitems) as IUpgradeGainsRule[];
  }

  public static getAllUpgradeWeapons(unit: ISelectedUnit): IUpgradeGainsWeapon[] {
    const isWeapon = (u) => u.type === "ArmyBookWeapon";
    const itemWeapons = this.getAllUpgradeItems(unit).reduce(
      (value, i) => value.concat(i.content.filter(isWeapon)),
      []
    );

    const all = this.getAllUpgrades(unit, false).filter(isWeapon).concat(itemWeapons) as IUpgradeGainsWeapon[];

    return all;
  }

  public static getAllUpgradeItems(unit: ISelectedUnit): IUpgradeGainsItem[] {
    return this.getAllUpgrades(unit, false).filter((u) => u.type === "ArmyBookItem") as IUpgradeGainsItem[];
  }

  public static getSize(unit: ISelectedUnit): number {
    const extraModelCount = unit.selectedUpgrades.map((x) => x.option).filter((u) => u.isModel).length;
    return unit.size + extraModelCount;
  }

  public static createUnitFromDefinition(unit: IUnit): ISelectedUnit {
    return {
      ...unit,
      selectionId: nanoid(5),
      selectedUpgrades: [],
      combined: false,
      joinToUnit: null,
      equipment: unit.equipment.map((eqp) => ({
        ...eqp,
        count: eqp.count || unit.size, // Add count to unit size if not already present
      })),
      loadout: [],
      xp: 0,
      traits: [],
      notes: null
    };
  }

  public static getAttachedUnits(list: ListState, unit: ISelectedUnit): ISelectedUnit[] {
    return list.units.filter((u) => u.joinToUnit === unit.selectionId);
  }
  public static getChildren(list: ListState, unit: ISelectedUnit): ISelectedUnit[] {
    return list.units.filter((u) => u.selectionId === unit.joinToUnit);
  }
  public static getFamily(list: ListState, unit: ISelectedUnit): ISelectedUnit[] {
    let parents = UnitService.getAttachedUnits(list, unit);
    let grandparents = parents.flatMap((u) => {
      return UnitService.getAttachedUnits(list, u);
    });
    let children = UnitService.getChildren(list, unit);
    let grandchildren = children.flatMap((u) => {
      return UnitService.getChildren(list, u);
    });
    return _.uniq([...grandparents, ...parents, unit, ...children, ...grandchildren]);
  }

  public static mergeCombinedUnit(unit: ISelectedUnit, attached: ISelectedUnit): ISelectedUnit {
    console.log("Merging ", unit);
    console.log("with", attached);
    return {
      ...unit,
      size: unit.size + attached.size,
      loadout: unit.loadout.concat(attached.loadout),
      selectedUpgrades: unit.selectedUpgrades.concat(attached.selectedUpgrades),
    };
  }

  private static readonly countRegex = /^(\d+)x\s/;

  public static getDisabledUpgradeSections(u: IUnit, upgradePackages: IUpgradePackage[]) {
    const packagesForUnit = u.upgrades
      // Map all upgrade packages
      .map((uid) => upgradePackages.find((pkg) => pkg.uid === uid))
      .filter((pkg) => !!pkg);
    const sections = packagesForUnit
      // Flatten down to array of all upgrade sections
      .reduce<IUpgrade[]>((sections, next) => sections.concat(next.sections), []);

    const allGains: IUpgradeGains[] = sections
      .reduce<IUpgradeOption[]>((opts, next) => opts.concat(next.options), [])
      .reduce<IUpgradeGains[]>((gains, next) => gains.concat(next.gains), [])
      .reduce<IUpgradeGains[]>((gains, next) => {
        // Add root item/weapon/etc
        gains.push(next);

        // For items, also add the content
        if (next.type !== "ArmyBookItem") return gains;

        return gains.concat((next as IUpgradeGainsItem).content);
      }, []);

    const disabledSections: string[] = [];

    // For each section, check that the unit has access to the things it wants to replace
    // Only need sections that are replacing (or looking for) something
    for (let section of sections.filter((s) => s.replaceWhat)) {
      for (let what of section.replaceWhat) {
        const target = what.replace(this.countRegex, "");

        // Does equipment contain this thing?
        const equipmentMatch = u.equipment.some((e) =>
          EquipmentService.compareEquipment({ ...e, label: (e.label ?? e.name).replace(this.countRegex, "") }, target)
        );
        // If equipment, then we won't be disabling this section...
        if (equipmentMatch) continue;

        // Do any upgrade sections contain this thing?
        const upgradeGains = allGains.find((g) => EquipmentService.compareEquipment(g, target));
        // If upgrade gains found, don't disable this
        if (upgradeGains) continue;

        // If neither was found, then disable this section
        disabledSections.push(section.uid);
      }
    }

    return disabledSections;
  }
}
