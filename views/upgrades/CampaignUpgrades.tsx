import { useEffect } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  Checkbox,
  Stack,
  Typography,
} from "@mui/material";
import { IconButton } from "@mui/material";
import DownIcon from "@mui/icons-material/KeyboardArrowDown";
import UpIcon from "@mui/icons-material/KeyboardArrowUp";
import { ISelectedUnit } from "../../data/interfaces";
import { useDispatch } from "react-redux";
import { getTraitDefinitions, ISkillSet, ITrait } from "../../data/campaign";
import { adjustCost, adjustXp, toggleTrait } from "../../data/listSlice";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RuleList from "../components/RuleList";

interface CampaignUpgradesProps {
  unit: ISelectedUnit;
  originalCost: number;
}

export default function CampaignUpgrades({ unit, originalCost }: CampaignUpgradesProps) {
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

  console.warn('original Cost', originalCost);

  // lower unit cost by 5 for every injury
  useEffect(() => {
    // TODO: this "works" but when all injuries are removed the original cost isn't reverted
    if (originalCost) {
      const newCost = originalCost - (5 * injuryCount);
      dispatch(adjustCost({ unitId: unit.selectionId, cost: newCost}))
    }
  }, [injuryCount])

  const adjustUnitXp = (xp: number) => {
    dispatch(adjustXp({ unitId: unit.selectionId, xp }));
  };

  const toggleUnitTrait = (trait: ITrait) => {
    console.warn('trait', trait);
    console.warn('unit cost pre', unit.cost);
    dispatch(toggleTrait({ unitId: unit.selectionId, trait: trait.name }));
    console.warn('unit cost post', unit.cost);
  };

  const traitControls = (traits, requireLevels: boolean = false) => {
    return traits.map((trait) => {
      const checked = !!unit.traits?.find((t) => t === trait.name);
      return (
        <Stack key={trait.name} direction="row" alignItems="center">
          <div style={{ flex: 1 }}>
            <RuleList specialRules={[trait]} />
          </div>
          <Checkbox
            checked={checked}
            onClick={() => toggleUnitTrait(trait)}
            value={trait.name}
            disabled={requireLevels ? unit.xp < 5 : false}
          />
        </Stack>
      );
    });
  };

  const displayCount = (count) =>
    count > 0 && (
      <Typography component="span" ml={0.5} color="text.secondary">
        {" "}
        [{count}]
      </Typography>
    );

  return (
    <>
      <Box px={2} mt={2}>
        <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.7 }}>Campaign Traits</p>
      </Box>
      <Card elevation={0} square sx={{ px: 2, pt: 1, pb: 2 }}>
        <Stack direction="row" alignItems="center">
          <Box pr={1} flex={1}>
            Unit XP{" "}
            <Typography component="span" color="text.secondary">
              (Level {level})
            </Typography>
          </Box>
          <IconButton
            disabled={unit.xp === 0}
            color={unit.xp > 0 ? "primary" : "default"}
            onClick={() => adjustUnitXp(-1)}
          >
            <DownIcon />
          </IconButton>
          <span>{unit.xp}XP</span>
          <IconButton disabled={unit.xp >= 30} color="primary" onClick={() => adjustUnitXp(1)}>
            <UpIcon />
          </IconButton>
        </Stack>

        <Box>
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
        </Box>
        {isHero && (
          <Box mt={2}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                Injuries {displayCount(injuryCount)}
              </AccordionSummary>
              <AccordionDetails>{traitControls(injuryDefinitions)}</AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                Talents {displayCount(talentCount)}
              </AccordionSummary>
              <AccordionDetails>{traitControls(talentDefinitions)}</AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Card>
    </>
  );
}
