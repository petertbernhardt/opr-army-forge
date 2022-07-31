import { AppBar, Box, Button, Divider, Paper, Stack, Tab, Tabs, Tooltip } from "@mui/material";
import React, { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../data/store";
import TabPanel from "../views/TabPanel";
import { Socket } from "socket.io-client";
import { MainList } from "./MainList";
import { IGameplayUnit, modifyUnit } from "../data/gameplaySlice";
import Router, { useRouter } from "next/router";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import UnitEquipmentTable from "./UnitEquipmentTable";
import UnitListItem from "./components/UnitListItem";
import UnitService from "../services/UnitService";
import _ from "lodash";
import UpgradeService from "../services/UpgradeService";
import EquipmentService from "../services/EquipmentService";
import RuleList from "./components/RuleList";

export interface GameViewProps {
  socket: Socket;
}

export default function GameView({ socket }: GameViewProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const gameplay = useSelector((state: RootState) => state.gameplay);
  const myList = gameplay.lists.find((x) => x.user === socket.id);
  const enemyList = gameplay.lists.find((x) => x.user !== socket.id);
  const [tab, setTab] = useState(0);
  const [selection, setSelection] = useState<IGameplayUnit>();

  const onUnitSelected = (unit: IGameplayUnit) => {
    setSelection(unit as IGameplayUnit);
    //sendModifyUnit(unit.selectionId, { activated: true });
  };

  const sendModifyUnit = (unitId: string, modification: any) => {
    const action = modifyUnit({
      user: socket.id,
      unitId,
      modification,
    });
    socket.emit("modify-unit", action);
  };

  return (
    <>
      <AppBar elevation={0} style={{ position: "sticky", top: 0, zIndex: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          centered
          variant="fullWidth"
          textColor="inherit"
          indicatorColor="primary"
        >
          <Tab label="Unactivated" />
          <Tab label="Activated" />
          <Tab label="Enemy Units" />
        </Tabs>
      </AppBar>
      <TabPanel value={tab} index={0}>
        <UnitList
          socket={socket}
          units={myList?.units.filter((x) => !x.activated)}
          onUnitClicked={onUnitSelected}
        />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <MainList
          onSelected={() => {}}
          onUnitRemoved={() => {}}
          units={myList?.units.filter((x) => x.activated) ?? []}
        />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <MainList onSelected={() => {}} onUnitRemoved={() => {}} units={enemyList?.units ?? []} />
      </TabPanel>

      <BottomSheet
        open={Boolean(selection)}
        onDismiss={() => setSelection(undefined)}
        initialFocusRef={false}
        expandOnContentDrag={true}
        onScrollCapture={(e) => e.preventDefault()}
        defaultSnap={({ snapPoints, lastSnap }) => lastSnap ?? Math.max(...snapPoints)}
        snapPoints={({ minHeight, maxHeight }) => [minHeight, maxHeight * 0.85]}
        header={<p>{selection?.customName ?? selection?.name}</p>}
      >
        {selection && (
          <>
            <UnitEquipmentTable loadout={selection?.loadout} />
          </>
        )}
      </BottomSheet>
    </>
  );
}

interface UnitListProps {
  socket: Socket;
  units: IGameplayUnit[];
  onUnitClicked: (unit: IGameplayUnit) => void;
}

function UnitList({ socket, units, onUnitClicked }: UnitListProps) {
  if (!units) return null;
  const displayUnits = UnitService.getDisplayUnits(units);
  return (
    <>
      {_.flatten(Object.values(displayUnits)).map((unit) => (
        <ListItem
          key={unit.selectionId}
          socket={socket}
          unit={unit}
          onUnitClicked={onUnitClicked}
        />
      ))}
    </>
  );
}

interface ListItemProps {
  socket: Socket;
  unit: IGameplayUnit;
  onUnitClicked: (unit: IGameplayUnit) => void;
}

function ListItem({ socket, unit, onUnitClicked }: ListItemProps) {
  const unitSize = UnitService.getSize(unit);
  const weaponGroups = _.groupBy(unit.loadout, (x) => x.name + x.attacks);

  const sendModifyUnit = (modification: any) => {
    const action = modifyUnit({
      user: socket.id,
      unitId: unit.selectionId,
      modification,
    });
    socket.emit("modify-unit", action);
  };

  return (
    <Paper
      className="py-2 mb-4"
      elevation={0}
      style={{ cursor: "pointer" }}
      square
      onClick={() => onUnitClicked(unit)}
    >
      <div className="is-flex is-flex-grow-1 is-align-items-center mb-2 px-2">
        <div className="is-flex-grow-1">
          <p className="mb-1">
            <span>{unit.customName || unit.name} {unit.pinned ? "(pinned)" : ""}</span>
            <span style={{ color: "#656565" }}>[{unitSize}]</span>
          </p>
          <div
            style={{
              fontSize: "14px",
              color: "rgba(0,0,0,0.6)",
            }}
          >
            <div className="is-flex">
              <p>Qua {unit.quality}+</p>
              <p className="ml-2">Def {unit.defense}+</p>
            </div>
            <RuleList
              specialRules={unit.specialRules.concat(UnitService.getAllUpgradedRules(unit as any))}
            />
          </div>
        </div>
        <p>{UpgradeService.calculateUnitTotal(unit)}pts</p>
        {/* {props.rightControl} */}
      </div>
      <UnitEquipmentTable loadout={unit.loadout} square />
      <Stack sx={{ mt: 2 }} direction="row" spacing={2}>
        <Button size="small" onClick={() => sendModifyUnit({ activated: true })}>Activate</Button>
        <Button size="small" onClick={() => sendModifyUnit({ pinned: true })}>Pinned</Button>
      </Stack>
    </Paper>
  );
}
