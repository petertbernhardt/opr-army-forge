import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  Box,
  Stack,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../data/store";
import UpgradeGroup from "./UpgradeGroup";
import UnitEquipmentTable from "../UnitEquipmentTable";
import RuleList from "../components/RuleList";
import { ISpecialRule, IUpgradePackage } from "../../data/interfaces";
import UnitService from "../../services/UnitService";
import { joinUnit, addCombinedUnit, removeUnit, moveUnit, selectUnit } from "../../data/listSlice";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SpellsTable from "../SpellsTable";
import { CustomTooltip } from "../components/CustomTooltip";
import CampaignUpgrades from "./CampaignUpgrades";
import { IGameRule } from "../../data/armySlice";
import UnitNotes from "../components/UnitNotes";
import { Fragment, useEffect } from "react";
import { usePrevious } from "../../hooks/usePrevious";

export function Upgrades() {
  const list = useSelector((state: RootState) => state.list);
  const { gameSystem, loadedArmyBooks, rules } = useSelector((state: RootState) => state.army);
  const dispatch = useDispatch();

  const competitive = false;
  const previewMode = !!list.unitPreview;
  const selectedUnit = list.unitPreview ?? UnitService.getSelected(list);
  const army = selectedUnit && loadedArmyBooks?.find((book) => book.uid === selectedUnit.armyId);
  const armyRules = loadedArmyBooks.flatMap((x) => x.specialRules);
  const ruleDefinitions: IGameRule[] = rules.concat(armyRules);

  const getUpgradeSet = (id) => army.upgradePackages.filter((s) => s.uid === id)[0];

  const equipmentSpecialRules: ISpecialRule[] =
    selectedUnit &&
    selectedUnit.equipment
      .filter((e) => !e.attacks && e.specialRules?.length) // No weapons, and only equipment with special rules
      .reduce((value, e) => value.concat(e.specialRules), []); // Flatten array of special rules arrays

  const unitUpgradeRules: ISpecialRule[] =
    selectedUnit && UnitService.getAllUpgradedRules(selectedUnit);

  const specialRules =
    selectedUnit &&
    (selectedUnit.specialRules || [])
      .concat(equipmentSpecialRules)
      .concat(unitUpgradeRules)
      .filter((r) => r.name !== "-");

  const isSkirmish = gameSystem !== "gf" && gameSystem !== "aof" && gameSystem !== "aofr";
  const isHero = selectedUnit
    ? selectedUnit.specialRules.findIndex((sr) => sr.name === "Hero") > -1
    : false;

  const isPsychic = (() => {
    let result = false;
    for (let r of specialRules ?? []) {
      result ||= r.name === "Psychic" || r.name === "Wizard";
      const ruleDef = ruleDefinitions.find((rd) => rd.name === r.name);
      console.log(r.name, ruleDef);
      const ruleDesc = ruleDef?.description;
      result ||=
        ruleDesc && /(?:Psychic|Wizard)\(\d\)/i.test(ruleDesc) && !/(?:as if)/i.test(ruleDesc);
    }
    return result;
  })();

  const joinToUnit = (e) => {
    const joinToUnitId = e.target.value;

    // if I have any heroes joined to *me*, I need to point them to the new unit instead
    if (unitsWithAttachedHeroes.indexOf(selectedUnit.selectionId) !== -1) {
      let attachedHeroes = list.units.filter(
        (u) =>
          u.specialRules.some((rule) => rule.name === "Hero") &&
          u.joinToUnit == selectedUnit.selectionId
      );
      attachedHeroes.forEach((u) => {
        dispatch(
          joinUnit({
            unitId: u.selectionId,
            joinToUnitId: joinToUnitId,
          })
        );
      });
    }

    dispatch(
      joinUnit({
        unitId: selectedUnit.selectionId,
        joinToUnitId: joinToUnitId,
      })
    );
    if (!!joinToUnitId) {
      dispatch(
        moveUnit({
          from: list.units.findIndex((t) => t.selectionId == selectedUnit.selectionId),
          to: list.units.findIndex((t) => t.selectionId == joinToUnitId),
        })
      );
    }
  };

  const originalUpgradeSets = (selectedUnit?.upgrades || [])
    .map((setId) => getUpgradeSet(setId))
    .filter((s) => !!s); // remove empty sets?

  const upgradeSets = isHero
    ? originalUpgradeSets
    : [...originalUpgradeSets.splice(1), originalUpgradeSets[0]].filter((s) => !!s);

  const toggleCombined = () => {
    if (selectedUnit.combined) {
      if (selectedUnit.joinToUnit) {
        let me = selectedUnit.selectionId;
        dispatch(selectUnit(selectedUnit.joinToUnit));
        dispatch(removeUnit(me));
      } else {
        let childId = list.units.find(
          (u) => u.combined && u.joinToUnit === selectedUnit.selectionId
        ).selectionId;
        dispatch(removeUnit(childId));
      }
    } else {
      dispatch(addCombinedUnit(selectedUnit.selectionId));
    }
  };

  const unitsWithAttachedHeroes = list.units
    .filter((u) => u.specialRules.some((rule) => rule.name === "Hero"))
    .filter((u) => u.joinToUnit)
    .map((u) => u.joinToUnit);

  const combineUnitControl = () =>
    !previewMode &&
    (!competitive || selectedUnit.size > 1) &&
    !isHero &&
    !isSkirmish && (
      <FormGroup sx={{ flexDirection: "row", alignItems: "center" }}>
        <FormControlLabel
          control={<Checkbox checked={selectedUnit.combined} onClick={() => toggleCombined()} />}
          label="Combined Unit"
        />
        <CustomTooltip
          title={
            "When preparing your army you may merge units by deploying two copies of the same unit as a single big unit, as long as any upgrades that are applied to all models are bought for both."
          }
          arrow
          enterTouchDelay={0}
          leaveTouchDelay={5000}
        >
          <InfoOutlinedIcon color="primary" />
        </CustomTooltip>
      </FormGroup>
    );

  const joinCandidates = list.units
    .filter((u) => (!competitive || u.size > 1) && !u.joinToUnit)
    .filter(
      (u) =>
        !competitive ||
        unitsWithAttachedHeroes.indexOf(u.selectionId) === -1 ||
        u.selectionId == selectedUnit?.joinToUnit
    );

  const joinToUnitControl = () =>
    !previewMode &&
    !isSkirmish &&
    isHero && (
      <FormGroup>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label" sx={{ zIndex: "unset" }}>
            Join To Unit
          </InputLabel>
          <Select value={selectedUnit?.joinToUnit || ""} label="Join To Unit" onChange={joinToUnit}>
            <MenuItem value={null}>None</MenuItem>
            {joinCandidates
              .filter((t) => t != selectedUnit)
              .map((u, index) => (
                <MenuItem key={index} value={u.selectionId}>
                  {u.customName || u.name} [{u.size * (u.combined ? 2 : 1)}]
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </FormGroup>
    );

  return (
    <>
      {selectedUnit && (
        <Paper square elevation={0} sx={{ p: 2 }}>
          <Stack spacing={2}>
            {combineUnitControl()}
            {joinToUnitControl()}
            <Box>
              Qua {selectedUnit.quality}+ Def {selectedUnit.defense}+{/* Rules */}
            </Box>
            {specialRules?.length > 0 && (
              <Box>
                <RuleList specialRules={specialRules} />
              </Box>
            )}
            {/* Equipment */}
            <UnitEquipmentTable loadout={selectedUnit.loadout} square={true} />
            {isPsychic && <SpellsTable unit={selectedUnit} />}
            <UnitNotes selectedUnit={selectedUnit} />
          </Stack>
        </Paper>
      )}

      {list.campaignMode && selectedUnit && !previewMode && (
        <CampaignUpgrades unit={selectedUnit} originalCost={selectedUnit.cost} />
      )}

      {upgradeSets.map((pkg: IUpgradePackage) => (
        <Fragment key={pkg.uid}>
          {pkg.sections
            .filter((section) => selectedUnit.disabledUpgradeSections.indexOf(section.uid) === -1)
            .map((u, i) => (
              <UpgradeGroup key={u.uid} unit={selectedUnit} upgrade={u} previewMode={previewMode} />
            ))}
        </Fragment>
      ))}
    </>
  );
}
