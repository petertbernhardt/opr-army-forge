import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  Checkbox,
  Divider,
} from "@mui/material";
import { IconButton } from "@mui/material";
import DownIcon from "@mui/icons-material/KeyboardArrowDown";
import UpIcon from "@mui/icons-material/KeyboardArrowUp";
import { ISelectedUnit } from "../../data/interfaces";
import { useDispatch } from "react-redux";
import { getTraitDefinitions, ISkillSet, ITrait } from "../../data/campaign";
import { adjustXp, toggleTrait } from "../../data/listSlice";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RuleList from "../components/RuleList";

interface CampaignUpgradesProps {
  unit: ISelectedUnit;
}

export default function CampaignUpgrades({ unit }: CampaignUpgradesProps) {
  const dispatch = useDispatch();

  const isHero = unit.specialRules.some((r) => r.name === "Hero");
  const allTraitDefinitions = getTraitDefinitions();
  const traitDefinitions = allTraitDefinitions[isHero ? "heroes" : "units"];
  const injuryDefinitions = allTraitDefinitions["injuries"];
  const talentDefinitions = allTraitDefinitions["talents"];
  const level = unit.xp ? Math.floor(unit.xp / 5) : 0;

  const isInjury = (trait: string) => !!injuryDefinitions.find((x) => x.name === trait);
  const isTalent = (trait: string) => !!injuryDefinitions.find((x) => x.name === trait);

  let traitCount = 0,
    injuryCount = 0,
    talentCount = 0;
  for (let trait of unit.traits) {
    if (isInjury(trait)) injuryCount++;
    else if (isTalent(trait)) talentCount++;
    else traitCount++;
  }

  const adjustUnitXp = (xp: number) => {
    dispatch(adjustXp({ unitId: unit.selectionId, xp }));
  };

  const toggleUnitTrait = (trait: ITrait) => {
    dispatch(toggleTrait({ unitId: unit.selectionId, trait: trait.name }));
  };

  const traitControls = (traits, requireLevels: boolean = false) => {
    return traits.map((trait) => {
      const checked = !!unit.traits?.find((t) => t === trait.name);
      return (
        <div key={trait.name} className="is-flex is-align-items-center">
          <div className="is-flex-grow-1 pr-2">
            <RuleList specialRules={[trait]} />
          </div>
          <Checkbox
            checked={checked}
            onClick={() => toggleUnitTrait(trait)}
            value={trait.name}
            disabled={requireLevels ? unit.xp < 5 : false}
          />
        </div>
      );
    });
  };

  const displayCount = (count) =>
    count > 0 && (
      <span className="ml-1" style={{ color: "#9E9E9E" }}>
        {" "}
        [{count}]
      </span>
    );

  return (
    <>
      <div className="px-4 mt-4 is-flex is-align-items-center">
        <p className="pt-0" style={{ fontWeight: 600, lineHeight: 1.7 }}>
          Campaign Traits
        </p>
      </div>
      <Card elevation={0} square>
        <div className="pt-2 pb-4 px-4">
          <div className="is-flex is-align-items-center">
            <div className="is-flex-grow-1 pr-2">
              Unit XP <span style={{ color: "rgba(0,0,0,0.6)" }}>(Level {level})</span>
            </div>
            <IconButton
              disabled={unit.xp === 0}
              color={unit.xp > 0 ? "primary" : "default"}
              onClick={() => adjustUnitXp(-1)}
            >
              <DownIcon />
            </IconButton>
            <div style={{ color: "#000000" }}>{unit.xp}XP</div>
            <IconButton disabled={unit.xp >= 30} color={"primary"} onClick={() => adjustUnitXp(1)}>
              <UpIcon />
            </IconButton>
          </div>

          <div>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                {isHero ? "Skill Sets " : "Traits "}
                {displayCount(traitCount)}
              </AccordionSummary>
              <AccordionDetails>
                {isHero
                  ? (traitDefinitions as ISkillSet[]).map((skillSet) => (
                      <Accordion key={skillSet.name}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          {skillSet.name}
                        </AccordionSummary>
                        <AccordionDetails>{traitControls(skillSet.traits, true)}</AccordionDetails>
                      </Accordion>
                    ))
                  : traitControls(traitDefinitions, true)}
              </AccordionDetails>
            </Accordion>
          </div>
          <div className="mt-4">
            {isHero && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  Injuries {displayCount(injuryCount)}
                </AccordionSummary>
                <AccordionDetails>{traitControls(injuryDefinitions)}</AccordionDetails>
              </Accordion>
            )}
            {isHero && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  Talents {displayCount(talentCount)}
                </AccordionSummary>
                <AccordionDetails>{traitControls(talentDefinitions)}</AccordionDetails>
              </Accordion>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
