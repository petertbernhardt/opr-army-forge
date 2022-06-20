import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../data/store";
import style from "../styles/Cards.module.css";
import { Paper, Card, TableContainer, Table, TableRow, TableCell, TableHead } from "@mui/material";
import RulesService from "../services/RulesService";
import { IGameRule } from "../data/armySlice";
import { groupBy, makeCopy } from "../services/Helpers";
import UnitService from "../services/UnitService";
import UpgradeService from "../services/UpgradeService";
import _ from "lodash";
import { ISelectedUnit } from "../data/interfaces";
import RuleList from "./components/RuleList";
import { IViewPreferences } from "../pages/view";

interface ViewTableProps {
  prefs: IViewPreferences;
}

export default function ViewTable({ prefs }: ViewTableProps) {
  const list = useSelector((state: RootState) => state.list);
  const army = useSelector((state: RootState) => state.army);
  const [maxCellWidth, setMaxCellWidth] = useState(0);

  const gameRules = army.rules;
  const armyRules = army.loadedArmyBooks.flatMap((x) => x.specialRules);
  const ruleDefinitions: IGameRule[] = gameRules.concat(armyRules);

  const units = (list?.units ?? []).map((u) => makeCopy(u));
  for (let unit of units) {
    delete unit.selectionId;
  }

  useEffect(() => {
    var maxCellWidth = Array.from(document.querySelectorAll(".weapon-name-cell")).reduce(
      (width, elem) => Math.max(width, elem.getBoundingClientRect().width),
      0
    );
    setMaxCellWidth(maxCellWidth);
  });

  // useEffect(() => {
  //   setTimeout(() => {
  //     maxCellWidth = Array.from(document.querySelectorAll(".weapon-name-cell")).reduce(
  //       (width, elem) => Math.max(width, elem.getBoundingClientRect().width),
  //       0
  //     );
  //     console.log("maxCellWidth", maxCellWidth);
  //   }, 100);
  // }, [maxCellWidth]);

  const usedRules = [];

  const unitAsKey = (unit: ISelectedUnit) => {
    return {
      id: unit.id,
      upgrades: unit.selectedUpgrades.map((x) => ({
        sectionId: x.upgrade.uid,
        optionId: x.option.id,
      })),
    };
  };

  const unitGroups = _.groupBy(units, (u) => JSON.stringify(unitAsKey(u)));

  const getUnitRow = (unit: ISelectedUnit, unitCount: number) => {
    const rules = getRules(unit);
    usedRules.push(...rules.keys);
    usedRules.push(...rules.weaponRules.map((r) => r.name));
    return (
      <UnitRow
        rules={rules}
        unit={unit}
        count={unitCount}
        prefs={prefs}
        ruleDefinitions={ruleDefinitions}
        maxCellWidth={maxCellWidth}
      />
    );
  };

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ fontWeight: "600" }}>Unit</TableCell>
              <TableCell style={{ fontWeight: "600" }}>Stats</TableCell>
              <TableCell style={{ fontWeight: "600" }}>Loadout</TableCell>
              <TableCell style={{ fontWeight: "600" }}>Rules</TableCell>
            </TableRow>
          </TableHead>
          {prefs.combineSameUnits
            ? Object.values(unitGroups).map((grp: ISelectedUnit[], i) => {
                const unit = grp[0];
                const count = grp.length;
                return getUnitRow(unit, count);
              })
            : units.map((unit, i) => {
                return getUnitRow(unit, 1);
              })}
        </Table>
      </TableContainer>
      {prefs.showPsychic &&
        army.loadedArmyBooks.map((book) => (
          <div key={book.uid} className={style.card}>
            <Card elevation={1}>
              <div className="mb-4">
                <div className="card-body">
                  <h3 className="is-size-4 my-2" style={{ fontWeight: 500, textAlign: "center" }}>
                    Psychic/Spells
                  </h3>
                  <hr className="my-0" />

                  <Paper square elevation={0}>
                    <div className="px-2 my-2">
                      {book.spells.map((spell) => (
                        <p key={spell.id}>
                          <span style={{ fontWeight: 600 }}>
                            {spell.name} ({spell.threshold}+):{" "}
                          </span>
                          <span>{spell.effect}</span>
                        </p>
                      ))}
                    </div>
                  </Paper>
                </div>
              </div>
            </Card>
          </div>
        ))}
      {!prefs.showFullRules && (
        <div className={`mx-4 ${style.card}`}>
          <Card elevation={1}>
            <div className="mb-4">
              <div className="card-body">
                <h3 className="is-size-4 my-2" style={{ fontWeight: 500, textAlign: "center" }}>
                  Special Rules
                </h3>
                <hr className="my-0" />

                <Paper square elevation={0}>
                  <div className={`px-2 my-2 ${style.grid} has-text-left`}>
                    {_.uniq(usedRules)
                      .sort()
                      .map((r, i) => (
                        <p key={i} style={{ breakInside: "avoid" }}>
                          <span style={{ fontWeight: 600 }}>{r} - </span>
                          <span>{ruleDefinitions.find((t) => t.name === r)?.description}</span>
                        </p>
                      ))}
                  </div>
                </Paper>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

interface UnitRowProps {
  unit: ISelectedUnit;
  rules: any;
  count: number;
  prefs: IViewPreferences;
  ruleDefinitions: any;
  maxCellWidth: number;
}

function UnitRow({ unit, rules, count, prefs, ruleDefinitions, maxCellWidth }: UnitRowProps) {
  const ruleKeys = rules.keys;
  const ruleGroups = rules.groups;
  // usedRules.push(...ruleKeys);
  // usedRules.push(...weaponRules.map((r) => r.name));

  // Sort rules alphabetically
  ruleKeys.sort((a, b) => a.localeCompare(b));

  const stats = (
    <TableCell>
      <table>
        <tr>
          <td style={{ paddingRight: "8px" }}>Quality </td>
          <td style={{ fontWeight: "600" }}> {unit.quality}+</td>
        </tr>
        <tr>
          <td style={{ paddingRight: "8px" }}>Defense</td>
          <td style={{ fontWeight: "600" }}> {unit.defense}+</td>
        </tr>
      </table>
    </TableCell>
  );

  const cellStyle = {
    padding: "2px 4px",
  };

  const loadout = (
    <TableCell>
      <table>
        {unit.loadout.map((weapon, i) => (
          <tr key={i}>
            <td
              className="weapon-name-cell"
              style={{
                ...cellStyle,
                paddingRight: "12px",
                fontWeight: "600",
                width: maxCellWidth ? maxCellWidth + "px" : null,
              }}
            >
              {weapon.count}x {weapon.name}
            </td>
            <td style={cellStyle}>{(weapon as any).range ? (weapon as any).range + '"' : "-"}</td>
            <td style={cellStyle}>A{weapon.attacks}</td>
            <td style={cellStyle}>
              {weapon.specialRules?.map((r) => RulesService.displayName(r)).join(", ")}
            </td>
          </tr>
        ))}
      </table>
      {/* <UnitEquipmentTable unit={unit} square={true} header={false} /> */}
    </TableCell>
  );

  const rulesSection = ruleKeys?.length > 0 && (
    <TableCell>
      {ruleKeys.map((key, index) => {
        const group = ruleGroups[key];

        if (!prefs.showFullRules)
          return (
            <span key={index}>
              {index === 0 ? "" : ", "}
              <RuleList specialRules={group} />
            </span>
          );

        const rule = group[0];
        const rating = group.reduce(
          (total, next) => (next.rating ? total + parseInt(next.rating) : total),
          0
        );

        const ruleDefinition = ruleDefinitions.filter(
          (r) => /(.+?)(?:\(|$)/.exec(r.name)[0] === rule.name
        )[0];

        return (
          <p key={index}>
            <span style={{ fontWeight: 600 }}>
              {RulesService.displayName({ ...rule, rating }, count)} -
            </span>
            <span> {ruleDefinition?.description || ""}</span>
          </p>
        );
      })}
    </TableCell>
  );

  return (
    <TableRow>
      <TableCell style={{ fontWeight: "600", fontSize: "16px" }}>
        {count > 1 ? `${count}x ` : ""}
        {unit.customName || unit.name}
        <span className="" style={{ color: "#666666" }}>
          {" "}
          [{unit.size}]
        </span>
        {prefs.showPointCosts && (
          <span className="ml-1" style={{ fontSize: "14px", color: "#666666" }}>
            - {UpgradeService.calculateUnitTotal(unit)}pts
          </span>
        )}
      </TableCell>
      {stats}
      {loadout}
      {rulesSection}
    </TableRow>
  );
}

function getRules(unit: ISelectedUnit) {
  const unitRules = (unit.specialRules || []).filter((r) => r.name != "-");

  const rulesFromUpgrades = UnitService.getAllUpgradedRules(unit);
  const weaponRules = UnitService.getAllEquipment(unit)
    .filter((e) => e.attacks > 0)
    .flatMap((e) => e.specialRules);

  const rules = unitRules.concat(rulesFromUpgrades).filter((r) => !!r && r.name != "-");
  const ruleGroups = groupBy(rules, "name");
  const ruleKeys = Object.keys(ruleGroups);
  return { keys: ruleKeys, groups: ruleGroups, weaponRules };
}
