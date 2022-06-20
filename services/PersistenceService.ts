import { ThunkDispatch } from "@reduxjs/toolkit";
import { Dispatch } from "react";
import { ArmyState, getArmyBookData, getGameRules, IArmyData, resetLoadedBooks, setGameSystem } from "../data/armySlice";
import { ISaveData, ISavedListState, ISelectedUnit, ISpecialRule, IUnit, IUpgrade, IUpgradeGainsWeapon, IUpgradeOption } from "../data/interfaces";
import { ListState, loadSavedList } from "../data/listSlice";
import { RootState } from "../data/store";
import { groupBy, makeCopy } from "./Helpers";
import RulesService from "./RulesService";
import UnitService from "./UnitService";
import UpgradeService from "./UpgradeService";
import _ from "lodash";
import { IViewPreferences } from "../pages/view";

export default class PersistenceService {

  private static prefix = "AF_Save_";
  private static currentSaveVersion = 3;

  private static getSaveKey(creationTime: string) {
    return this.prefix + creationTime;
  }

  public static saveImport(saveName: any, json: string) {
    localStorage[this.prefix + saveName] = json;
  }

  public static createSave(army: ArmyState, name: string, existingList?: ListState): string {

    const creationTime = new Date().getTime().toString();
    const list: ListState = existingList
      ? {
        ...existingList,
        creationTime: creationTime,
        undoUnitRemove: null
      }
      : {
        creationTime: creationTime,
        name: name,
        units: [],
        points: 0,
        undoUnitRemove: null
      };

    const armyData = army.loadedArmyBooks[0];
    const saveData: ISaveData = {
      gameSystem: army.gameSystem,
      armyId: armyData.uid,
      armyIds: [armyData.uid],
      armyFaction: armyData.factionName,
      armyName: armyData.name,
      modified: new Date().toJSON(),
      saveVersion: this.currentSaveVersion,
      listPoints: 0,
      list: this.getDataForSave(list),
      favourite: false
    };

    console.log("Creating save...", saveData);

    const json = JSON.stringify(saveData);

    localStorage[this.getSaveKey(list.creationTime)] = json;

    return creationTime;
  }

  public static getDataForSave(list: ListState): ISavedListState {
    return {
      ...list,
      units: list.units.map(u => ({
        id: u.id,
        armyId: u.armyId,
        customName: u.customName,
        selectionId: u.selectionId,
        selectedUpgrades: u.selectedUpgrades.map(x => ({
          instanceId: x.instanceId,
          upgradeId: x.upgrade.uid,
          optionId: x.option.id
        })),
        combined: u.combined,
        joinToUnit: u.joinToUnit,
        xp: u.xp,
        traits: u.traits,
        notes: u.notes
      }))
    };
  }

  public static updateSave(list: ListState) {

    this.updateSaveData(list.creationTime, existingSave => {
      const armyIds = _.uniq(list.units.map(u => u.armyId));
      const points: number = UpgradeService.calculateListTotal(list.units);

      const saveData: ISaveData = {
        ...existingSave,
        armyIds: armyIds,
        modified: new Date().toJSON(),
        listPoints: points,
        list: this.getDataForSave(list),
        saveVersion: this.currentSaveVersion
      };

      console.log("Updating save...", saveData);

      return saveData;
    });
  }

  private static updateSaveData(creationTime: any, modifySaveFunc: (save: ISaveData) => ISaveData) {
    const key = this.getSaveKey(creationTime);
    const localSave = localStorage[key];
    if (!localSave)
      return;

    const saveData = modifySaveFunc(JSON.parse(localSave));

    localStorage[key] = JSON.stringify(saveData);
  }

  public static toggleFavourite(save: ISaveData, isFavourite: boolean) {
    const key = Object
      .keys(localStorage)
      .find(key => key.endsWith(save.list.creationTime));
    localStorage[key] = JSON.stringify({
      ...save,
      favourite: isFavourite
    });
  }

  public static delete(list: ListState) {
    const key = Object
      .keys(localStorage)
      .find(key => key.endsWith(list.creationTime));
    delete localStorage[key];
  }

  public static buildListFromSave(save: ISaveData, armyBooks: IArmyData[]): ListState {

    return save.saveVersion === 3
      ? this.buildListFromSave_v3(save.list, armyBooks)
      : save.saveVersion === 2
        ? this.buildListFromSave_v2(save.list, armyBooks)
        : null;
  }

  public static buildListFromSave_v2(savedList: ISavedListState, armyBooks: IArmyData[]): ListState {

    const armyData = armyBooks[0];
    const allSections = armyData
      .upgradePackages
      .reduce<IUpgrade[]>((current, pkg) => current.concat(pkg.sections), []);
    const allOptions = allSections
      .reduce<IUpgradeOption[]>((current, section) => current.concat(section.options), []);

    return {
      ...savedList,
      units: savedList.units.map(u => {
        const unitDefinition: IUnit = armyData.units.find(unit => unit.id === u.id);
        const unit: ISelectedUnit = {
          ...unitDefinition,
          ...u,
          armyId: armyData.uid,
          equipment: makeCopy(unitDefinition.equipment),
          selectedUpgrades: [],
          loadout: []
        };
        console.log("Loading unit...", unit);
        for (let upg of makeCopy(u.selectedUpgrades)) {
          const option = allOptions.find(opt => opt.id === upg.id || opt.id === upg.optionId);
          if (option) {
            const section = allSections.find(sec => sec.uid === option.parentSectionId);
            UpgradeService.apply(unit, section, option);
          } else {
            console.warn("Couldn't find option", upg);
          }
        }
        return UpgradeService.buildUpgrades(unit);
      })
    };
  }

  public static buildListFromSave_v3(savedList: ISavedListState, armyBooks: IArmyData[]): ListState {

    const allSections = armyBooks.flatMap(book => book.upgradePackages)
      .reduce<IUpgrade[]>((current, pkg) => current.concat(pkg.sections), []);
    const units = armyBooks.flatMap(book => book.units.map(u => ({ ...u, armyId: book.uid })));
    console.log(units);
    return {
      ...savedList,
      units: savedList.units.map(u => {
        const unitDefinition: IUnit = units.find(unit => unit.id === u.id);
        const unit: ISelectedUnit = {
          ...unitDefinition,
          ...u,
          equipment: makeCopy(unitDefinition.equipment),
          selectedUpgrades: [],
          loadout: []
        };

        for (let upg of makeCopy(u.selectedUpgrades)) {
          const section = allSections.find(sec => sec.uid === upg.upgradeId);
          const option = section.options.find(opt => opt.id === upg.optionId);
          if (option) {
            UpgradeService.apply(unit, section, option);
          } else {
            console.warn("Couldn't find option", upg);
          }
        }
        return UpgradeService.buildUpgrades(unit);
      })
    };
  }

  public static async loadFromKey(dispatch: Dispatch<any>, key: string, callback: (armyData: any) => void) {
    const save = JSON.parse(localStorage[this.getSaveKey(key)]);
    this.load(dispatch, save, callback);
  }

  public static async load(dispatch: ThunkDispatch<RootState, any, any>, save: ISaveData, callback: (armyBooks: IArmyData[]) => void) {

    console.log("Loading save...", save);

    dispatch(resetLoadedBooks());
    dispatch(setGameSystem(save.gameSystem));
    const armyIds = save.armyIds || [save.armyId];

    const promises = armyIds.map(id => dispatch(getArmyBookData({
      armyUid: id, gameSystem: save.gameSystem, reset: false
    })));

    Promise.all(promises).then(results => {
      const armyBooks = results.map(res => (res.payload as any).armyBookData) as IArmyData[];
      console.log(armyBooks);
      const list: ListState = this.buildListFromSave(save, armyBooks);
      dispatch(loadSavedList(list));
      dispatch(getGameRules(save.gameSystem));
      callback(armyBooks);
    });
  }

  public static download(list: ListState) {
    const saveData = localStorage[this.getSaveKey(list.creationTime)];
    const blob = new Blob([saveData], { type: "application/json" })
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${list.name}${list.creationTime}.json`;
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click'));
  }

  public static downloadTTS(list: ListState) {
    const saveData = JSON.stringify(list);
    const blob = new Blob([saveData], { type: "application/json" })
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${list.name}${list.creationTime}.json`;
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click'));
  }

  public static checkExists(list: ISavedListState): boolean {
    return !!localStorage[this.getSaveKey(list.creationTime)];
  }

  public static getListAsText(list: ListState) {

    const lines = [
      `++ ${list.name} [${list.points}pts] ++\n`
    ];

    const constructLabel = (item: IUpgradeGainsWeapon) => {
      const count = item.count > 1 ? `${item.count}x ` : "";
      const range = item.range ? `${item.range}", ` : "";
      const attacks = item.attacks ? `A${item.attacks}` : ""
      const rules = item.specialRules?.map(RulesService.displayName).join(", ");

      if (!range && !attacks && !rules)
        return `${count}${item.name}`;

      return `${count}${item.name} (${range}${attacks}${rules?.length > 0 ? (", " + rules) : ""})`;
    };

    const getWeapons = (unit: ISelectedUnit) => {
      console.log("Loadout", unit.loadout);
      return unit.loadout
        .map(constructLabel)
        .join(", ");
    };

    const getRules = (unit: ISelectedUnit) => {
      const rules = (unit.specialRules ?? [])
        .concat(UnitService.getAllUpgradedRules(unit));

      const ruleGroups = groupBy(rules, "name");
      const keys = Object.keys(ruleGroups);
      // Sort rules alphabetically
      keys.sort((a, b) => a.localeCompare(b));

      return keys.map(key => {

        // This has been copy/pasted from RuleList.tsx - refactor!
        const group: ISpecialRule[] = ruleGroups[key];
        const rule = group[0];
        const rating = (rule.rating == null || rule.rating == "") ? null : key === "Psychic"

          // Take Highest
          ? Math.max(...group.map(rule => parseInt(rule.rating)))
          // Sum all occurrences
          : group.reduce((total, next) => next.rating ? total + parseInt(next.rating) : total, 0);

        // Rules with ratings do not show multiple instances
        const count = rating > 0 ? 0 : group.length;

        return (count > 1 ? `${count}x ` : "") + RulesService.displayName({ ...rule, rating: rule.rating ? rating.toString() : null });
      }).join(", ");
    };

    // Unit name [size] Qua 3+ Def 4+ 123pts
    // 2x Hand Weapons, Rifle
    // Fearless
    //
    // ...
    for (let unit of list.units) {
      // TODO: Campaign unit pt cost...?
      lines.push(`${unit.customName ?? unit.name} [${unit.size}] | Qua ${unit.quality}+ Def ${unit.defense}+ | ${UpgradeService.calculateUnitTotal(unit)}pts`);
      lines.push(getWeapons(unit));
      lines.push(getRules(unit) + "\n");
    }

    return lines.join("\n");
  }

  public static copyAsText(list: ListState) {

    navigator
      .clipboard
      .writeText(this.getListAsText(list))
      .then(() => console.log("Copied to clipboard..."));
  }

  public static saveViewPreferences(prefs: IViewPreferences) {
    localStorage["view_prefs"] = JSON.stringify(prefs);
  }

  public static getViewPreferences() {
    const prefs = localStorage["view_prefs"];
    if (!prefs)
      return null;
    return JSON.parse(prefs) as IViewPreferences;
  }
}
