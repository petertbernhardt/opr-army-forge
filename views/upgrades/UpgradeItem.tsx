import styles from "./UpgradeItem.module.css";
import {
  ISelectedUnit,
  IUpgrade,
  IUpgradeGains,
  IUpgradeOption,
  IUpgradeGainsWeapon,
  IUpgradeGainsItem,
  IUpgradeGainsRule,
} from "../../data/interfaces";
import UpgradeService from "../../services/UpgradeService";
import UpgradeRadio from "./controls/UpgradeRadio";
import UpgradeCheckbox from "./controls/UpgradeCheckbox";
import UpgradeUpDown from "./controls/UpgradeUpDown";
import { groupBy } from "../../services/Helpers";
import pluralise from "pluralize";
import RuleList from "../components/RuleList";
import { Fragment } from "react";

interface UpgradeItemProps {
  selectedUnit: ISelectedUnit;
  upgrade: IUpgrade;
  option: IUpgradeOption;
  previewMode: boolean;
  controlType: string;
  label?: string;
}

export default function UpgradeItem({
  selectedUnit,
  upgrade,
  option,
  previewMode,
  label,
  controlType,
}: UpgradeItemProps) {
  // Somehow display the count?
  const gainsGroups = option ? groupBy(option.gains, "name") : null;
  const isValid = option ? UpgradeService.isValid(selectedUnit, upgrade, option) : true;

  const control = (() => {
    switch (controlType) {
      case "check":
        return <UpgradeCheckbox selectedUnit={selectedUnit} upgrade={upgrade} option={option} />;
      case "radio":
        return (
          <UpgradeRadio
            selectedUnit={selectedUnit}
            upgrade={upgrade}
            option={option}
            isValid={isValid}
          />
        );
      case "updown":
        return <UpgradeUpDown selectedUnit={selectedUnit} upgrade={upgrade} option={option} />;
    }
  })();

  return (
    <div className="is-flex is-align-items-center mb-1">
      <div className="is-flex-grow-1 pr-2">
        {gainsGroups ? (
          Object.keys(gainsGroups).map((key, i) => {
            const group: IUpgradeGains[] = gainsGroups[key];
            const e = group[0];
            const count = group.reduce((c, next) => c + (next.count || 1), 0);

            return <UpgradeItemDisplay key={key} eqp={e} count={count} isValid={isValid} />;
          })
        ) : (
          <span style={{ color: "rgba(0,0,0,0.8)" }}>{label}</span>
        )}
      </div>
      <div style={{ color: isValid ? null : "rgba(0,0,0,.5)" }}>
        {option?.cost ? `${option.cost}pts` : "Free"}&nbsp;
      </div>
      {!previewMode && control}
    </div>
  );
}

function UpgradeItemDisplay({ eqp, count, isValid }) {
  const name = count > 1 ? pluralise.plural(eqp.name || eqp.label) : eqp.name || eqp.label;
  const invalidColour = "rgba(0,0,0,.5)";
  const colour = isValid ? "#000000" : invalidColour;
  const subtextColour = isValid ? "#656565" : invalidColour;

  switch (eqp.type) {
    case "ArmyBookDefense":
    case "ArmyBookRule":
      return <UpgradeItemRule rule={eqp as IUpgradeGainsRule} colour={colour} />;

    case "ArmyBookWeapon":
      return (
        <UpgradeItemWeapon
          weapon={eqp as IUpgradeGainsWeapon}
          name={name}
          count={count}
          colour={colour}
          subtextColour={subtextColour}
        />
      );

    case "ArmyBookItem":
      return (
        <UpgradeItemItem
          item={eqp as IUpgradeGainsItem}
          name={name}
          count={count}
          colour={colour}
          subtextColour={subtextColour}
          isValid={isValid}
        />
      );
    default: {
      console.log("Cannot display upgrade: ", eqp);
    }
  }
}

interface UpgradeItemDisplayPropsBase {
  name?: string;
  count?: number;
  colour: string;
  subtextColour?: string;
  isValid?: boolean;
}

interface UpgradeItemRuleProps extends UpgradeItemDisplayPropsBase {
  rule: IUpgradeGainsRule;
}

function UpgradeItemRule(props: UpgradeItemRuleProps) {
  return (
    <span style={{ color: props.colour }}>
      <RuleList specialRules={[props.rule]} />
    </span>
  );
}

interface UpgradeItemWeaponProps extends UpgradeItemDisplayPropsBase {
  weapon: IUpgradeGainsWeapon;
}

function UpgradeItemWeapon(props: UpgradeItemWeaponProps) {
  const weapon = props.weapon;
  const range = weapon && weapon.range ? `${weapon.range}"` : null;
  const attacks = weapon && weapon.attacks ? `A${weapon.attacks}` : null;
  const weaponRules = weapon.specialRules;

  return (
    <>
      {props.count > 1 && <span>{props.count}x </span>}
      <span className={styles.upgradeName} style={{ color: props.colour }}>
        {props.name}{" "}
      </span>
      <span className={styles.upgradeRules} style={{ color: props.subtextColour }}>
        ({[range, attacks].filter((r) => r).join(", ") + (weaponRules?.length > 0 ? ", " : "")}
        <RuleList specialRules={weaponRules} />)
      </span>
    </>
  );
}

interface UpgradeItemItemProps extends UpgradeItemDisplayPropsBase {
  item: IUpgradeGainsItem;
}

function UpgradeItemItem(props: UpgradeItemItemProps) {
  const { item, count, name, colour, subtextColour, isValid } = props;
  return (
    <>
      {count > 1 && <span>{count}x </span>}
      <span className={styles.upgradeName} style={{ color: colour }}>
        {name}{" "}
      </span>
      <span className={styles.upgradeRules} style={{ color: subtextColour }}>
        (
        {item.content.map((c, i) => (
          <Fragment key={i}>
            <span>{i === 0 ? "" : ", "}</span>
            <UpgradeItemDisplay eqp={c} count={count} isValid={isValid} />
          </Fragment>
        ))}
        )
      </span>
    </>
  );
}
