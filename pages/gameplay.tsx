import { Box, Button, Stack, Tooltip } from "@mui/material";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import { resetLoadedBooks, setGameSystem } from "../data/armySlice";
import { addList, IList, setLobby } from "../data/gameplaySlice";
import { RootState, useAppDispatch } from "../data/store";
import PersistenceService from "../services/PersistenceService";
import { MenuBar } from "../views/components/MenuBar";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import GameView from "../views/GameView";

const socket = io("http://10.0.1.20:3001");

function Gameplay() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const gameplay = useSelector((state: RootState) => state.gameplay);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Reset all loaded books
    dispatch(resetLoadedBooks());

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("user-joined", (user: any) => {
      console.log(user);
      dispatch(addList(user.list));
    });

    socket.on("modify-unit", (action) => dispatch(action));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("pong");
    };
  }, []);

  return (
    <>
      <MenuBar
        title="Gameplay Tracking"
        onBackClick={() => {}}
        right={
          <Stack>
            {!isConnected && (
              <Tooltip title={"Cannot connect to gameplay server"}>
                <WifiOffIcon />
              </Tooltip>
            )}
            {gameplay.lobbyId && <p>Lobby: {gameplay.lobbyId}</p>}
          </Stack>
        }
      />
      {gameplay.lobbyId ? <GameView socket={socket} /> : <StartGame />}
      {gameplay.lists.map((list) => (
        <Fragment key={list.user}></Fragment>
      ))}
    </>
  );
}

export default dynamic(() => Promise.resolve(Gameplay), { ssr: false });

function StartGame() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const loadList = async () => {
    // Redirect to game selection screen if no army selected
    const listId = router.query["listId"] as string;
    const save = PersistenceService.getSaveData(listId);
    dispatch(setGameSystem(save.gameSystem));
    const armyIds = save.armyIds || [save.armyId];
    const armyBooks = await PersistenceService.loadBooks(dispatch, armyIds, save.gameSystem);
    const list: IList = {
      ...(PersistenceService.buildListFromSave(save, armyBooks) as any), // Cast since unit types don't match...
      user: socket.id,
    };
    dispatch(addList(list));
    //dispatch(getGameRules(save.gameSystem));
    return list;
  };

  const createLobby = async () => {
    const list = await loadList();
    socket.emit("create-lobby", list, (res) => {
      dispatch(setLobby(res.lobbyId));
    });
  };

  const joinLobby = async () => {
    const lobbyId = prompt("Enter Lobby ID");
    if (lobbyId) {
      const list = await loadList();

      socket.emit("join-lobby", lobbyId, list, (lobby) => {
        dispatch(setLobby(lobbyId));
        for (var user of lobby.users) {
          dispatch(addList(user.list));
        }
      });
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack sx={{ maxWidth: "480px" }}>
        <Button variant="contained" onClick={createLobby} sx={{ mb: 2 }}>
          Create Lobby
        </Button>
        <Button variant="outlined" onClick={joinLobby}>
          Join Lobby
        </Button>
      </Stack>
    </Box>
  );
}
