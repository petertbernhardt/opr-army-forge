import { AppBar, Button, Divider, Paper, Stack, Tab, Tabs } from "@mui/material";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../data/store";
import TabPanel from "../views/TabPanel";
import { Socket } from "socket.io-client";
import { IGameplayUnit, modifyUnit } from "../data/gameplaySlice";
import { useRouter } from "next/router";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import UnitEquipmentTable from "./UnitEquipmentTable";
import UnitService from "../services/UnitService";
import _ from "lodash";
import UpgradeService from "../services/UpgradeService";
import RuleList from "./components/RuleList";

export interface GameViewProps {
  socket: Socket;
}

export default function GameView({ socket }: GameViewProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const gameplay = useSelector((state: RootState) => state.gameplay);
  const myList = gameplay.lists.find((x) => x.user === socket.id);
  const enemyLists = gameplay.lists.filter((x) => x.user !== socket.id);
  const [tab, setTab] = useState(0);
  const [selection, setSelection] = useState<IGameplayUnit>();

  const onUnitSelected = (unit: IGameplayUnit) => {
    //setSelection(unit as IGameplayUnit);
    //sendModifyUnit(unit.selectionId, { activated: true });
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
          <Tab label="My Units" />
          {enemyLists.map((list, i) => (
            <Tab key={list.user} label={`Enemy ${i + 1} Units`} />
          ))}
        </Tabs>
      </AppBar>
      <TabPanel value={tab} index={0}>
        <UnitList socket={socket} units={myList?.units} onUnitClicked={onUnitSelected} />
      </TabPanel>
      {enemyLists.map((list, i) => (
        <TabPanel key={list.user} value={tab} index={i + 1}>
          <UnitList socket={socket} units={list.units} onUnitClicked={onUnitSelected} readonly />
        </TabPanel>
      ))}

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
  readonly?: boolean;
}

function UnitList({ socket, units, onUnitClicked, readonly }: UnitListProps) {
  if (!units) return null;
  const displayUnits = _.flatten(Object.values(UnitService.getDisplayUnits(units)));
  const [deadUnits, aliveUnits] = _.partition(displayUnits, (unit) => unit.dead);
  const listItems = (units) =>
    units.map((unit) => (
      <ListItem
        key={unit.selectionId}
        socket={socket}
        unit={unit}
        onUnitClicked={onUnitClicked}
        readonly={readonly}
      />
    ));
  return (
    <>
      {listItems(aliveUnits)}
      {deadUnits.length > 0 && (
        <>
          <p className="menu-label my-2 px-4 pt-3">Dead Units</p>
          <Divider />
        </>
      )}

      {listItems(deadUnits)}
    </>
  );
}

interface ListItemProps {
  socket: Socket;
  unit: IGameplayUnit;
  onUnitClicked: (unit: IGameplayUnit) => void;
  readonly?: boolean;
}

function ListItem({ socket, unit, onUnitClicked, readonly }: ListItemProps) {
  const unitSize = UnitService.getSize(unit);

  const sendModifyUnit = (modification: any) => {
    const action = modifyUnit({
      user: socket.id,
      unitId: unit.selectionId,
      modification,
    });
    socket.emit("modify-unit", action);
  };

  return (
    <div className="mb-4">
      <Paper
        className="py-2"
        elevation={0}
        style={{ cursor: "pointer", opacity: unit.dead || unit.activated ? "0.5" : "1" }}
        square
        onClick={() => onUnitClicked(unit)}
      >
        <div className="is-flex is-flex-grow-1 is-align-items-center mb-2 px-2 has-text-centered">
          <div className="is-flex-grow-1">
            <p className="" style={{ textDecoration: unit.dead ? "line-through" : "" }}>
              <span>{unit.customName || unit.name} </span>
              <span style={{ color: "#656565" }}>
                [{unitSize}]{" "}
                <span style={{ fontSize: "80%" }}>
                  {UpgradeService.calculateUnitTotal(unit)}pts
                </span>
              </span>
              <span>{unit.pinned ? " (Pinned)" : ""}</span>
            </p>
            <div
              style={{
                fontSize: "14px",
                color: "rgba(0,0,0,0.6)",
              }}
            >
              <div className="is-flex" style={{ justifyContent: "center" }}>
                <p>Qua {unit.quality}+</p>
                <p className="ml-2">Def {unit.defense}+</p>
              </div>
              <RuleList
                specialRules={unit.specialRules.concat(
                  UnitService.getAllUpgradedRules(unit as any)
                )}
              />
            </div>
          </div>
          {/* {props.rightControl} */}
        </div>
        {!unit.dead && <UnitEquipmentTable loadout={unit.loadout} square />}
        {!readonly && (
          <Stack sx={{ mt: 2, px: 2, justifyContent: "center" }} direction="row" spacing={2}>
            {unit.dead ? (
              <Button size="small" onClick={() => sendModifyUnit({ dead: false })}>
                Restore
              </Button>
            ) : (
              <>
                {unit.activated ? (
                  <Button size="small" onClick={() => sendModifyUnit({ activated: false })}>
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    size="small"
                    onClick={() => sendModifyUnit({ activated: true, pinned: false })}
                  >
                    Activate
                  </Button>
                )}
                <Button size="small" onClick={() => sendModifyUnit({ pinned: true })}>
                  Pinned
                </Button>
                <Button size="small" onClick={() => sendModifyUnit({ dead: true })}>
                  Killed
                </Button>
              </>
            )}
          </Stack>
        )}
      </Paper>
      <Divider />
    </div>
  );
}
