import { Divider, Paper } from "@mui/material";
import { ISelectedUnit, IUnit } from "../../data/interfaces";
import EquipmentService from "../../services/EquipmentService";
import UnitService from "../../services/UnitService";
import RuleList from "./RuleList";
import _ from "lodash";
import UpgradeService from "../../services/UpgradeService";

interface UnitListItemProps {
  unit: ISelectedUnit;
  rightControl: JSX.Element;
  selected: boolean;
  onClick: () => void;
  countInList?: number;
}

export default function UnitListItem(props: UnitListItemProps) {
  const unit = props.unit;
  const loadout = unit.loadout || unit.equipment;

  const weaponGroups = _.groupBy(loadout, (x) => x.name);
  const unitSize = UnitService.getSize(unit);

  return (
    <>
      <Paper
        className="p-4"
        elevation={0}
        style={{
          backgroundColor: props.selected ? "#F9FDFF" : null,
          borderLeft: props.countInList > 0 ? "2px solid #0F71B4" : null,
          cursor: "pointer",
        }}
        square
        onClick={props.onClick}
      >
        <div className="is-flex is-flex-grow-1 is-align-items-center mb-2">
          <div className="is-flex-grow-1">
            <p className="mb-1">
              {props.countInList > 0 && (
                <span style={{ color: "#0F71B4" }}>{props.countInList}x </span>
              )}
              <span>{unit.customName || unit.name} </span>
              <span style={{ color: "#656565" }}>[{unitSize}]</span>
            </p>
            <div
              className="is-flex"
              style={{
                fontSize: "14px",
                color: "rgba(0,0,0,0.6)",
              }}
            >
              <p>Qua {unit.quality}+</p>
              <p className="ml-2">Def {unit.defense}+</p>
            </div>
          </div>
          <p>{UpgradeService.calculateUnitTotal(unit)}pts</p>
          {props.rightControl}
        </div>
        <div style={{ fontSize: "14px", color: "rgba(0,0,0,0.6)" }}>
          <div>
            {Object.values(weaponGroups).map((group: any[], i) => {
              const count = group.reduce((c, next) => c + next.count, 0);
              return (
                <span key={i}>
                  {i > 0 ? ", " : ""}
                  {count > 1 ? `${count}x ` : ""}
                  {EquipmentService.formatString(group[0] as any)}
                </span>
              );
            })}
          </div>
          <RuleList
            specialRules={unit.specialRules.concat(UnitService.getAllUpgradedRules(unit as any))}
          />
        </div>
      </Paper>
      <Divider />
    </>
  );
}
