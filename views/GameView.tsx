import { AppBar, Box, Button, Stack, Tab, Tabs, Tooltip } from "@mui/material";
import React, { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../data/store";
import TabPanel from "../views/TabPanel";
import { Socket } from "socket.io-client";
import { MainList } from "./MainList";
import { modifyUnit } from "../data/gameplaySlice";

export interface GameViewProps {
  socket: Socket;
}

export default function GameView({ socket }: GameViewProps) {
  const dispatch = useAppDispatch();
  const gameplay = useSelector((state: RootState) => state.gameplay);
  const myList = gameplay.lists.find((x) => x.user === socket.id);
  const enemyList = gameplay.lists.find((x) => x.user !== socket.id);
  const [tab, setTab] = useState(0);

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
        <MainList
          onSelected={(unit) => {
            sendModifyUnit(unit.selectionId, { activated: true });
          }}
          onUnitRemoved={() => {}}
          units={myList?.units.filter((x) => !x.activated) ?? []}
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
      <MainList
          onSelected={() => {}}
          onUnitRemoved={() => {}}
          units={enemyList?.units ?? []}
        />
      </TabPanel>
    </>
  );
}
