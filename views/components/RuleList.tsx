import RuleItem from "./RuleItem";
import { RootState } from "../../data/store";
import { useSelector } from "react-redux";
import { IGameRule } from "../../data/armySlice";
import { Fragment, memo } from "react";
import { ISpecialRule } from "../../data/interfaces";
import RulesService from "../../services/RulesService";
import { groupBy } from "../../services/Helpers";
import { getTraitDefinitions, ITrait } from "../../data/campaign";

export default function RuleList({ specialRules }: { specialRules: (ISpecialRule | ITrait)[] }) {
  const army = useSelector((state: RootState) => state.army);
  const gameRules = army.rules;
  const armyRules = army.loadedArmyBooks.flatMap((x) => x.specialRules);
  const ruleDefinitions: IGameRule[] = gameRules.concat(armyRules);

  const rules = specialRules?.filter((r) => !!r && r.name != "-") ?? [];

  if (!rules || rules.length === 0) return null;

  const ruleGroups = groupBy(rules, "name");
  const keys = Object.keys(ruleGroups);
  // Sort rules alphabetically
  keys.sort((a, b) => a.localeCompare(b));

  return (
    <>
      {keys.map((key, index) => {
        const group: ISpecialRule[] = ruleGroups[key];
        const rule = group[0];
        const rating =
          rule.rating == null || rule.rating == ""
            ? null
            : key === "Psychic"
            ? // Take Highest
              Math.max(...group.map((rule) => parseInt(rule.rating)))
            : // Sum all occurrences
              group.reduce(
                (total, next) => (next.rating ? total + parseInt(next.rating) : total),
                0
              );

        // Rules with ratings do not show multiple instances
        const count = rating > 0 ? 0 : group.length;

        //console.log(rule)
        const ruleDefinition = ruleDefinitions.filter(
          (r) => /(.+?)(?:\(|$)/.exec(r.name)[0] === rule.name
        )[0];

        return (
          <Fragment key={index}>
            {index > 0 ? <span className="mr-1">, </span> : null}
            <RuleItem
              label={
                (count > 1 ? `${count}x ` : "") +
                RulesService.displayName({
                  ...rule,
                  rating: rule.rating ? rating.toString() : null,
                })
              }
              description={(rule as any).description || ruleDefinition?.description || ""}
            />
          </Fragment>
        );
      })}
    </>
  );
}

//export const MemoisedRuleList = memo(RuleList);
