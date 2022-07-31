import { Box, Button, Stack, Tooltip } from "@mui/material";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import io, { Socket } from "socket.io-client";
import { getGameRules, resetLoadedBooks, setGameSystem } from "../data/armySlice";
import { addList, IList, setLobby } from "../data/gameplaySlice";
import { RootState, useAppDispatch } from "../data/store";
import PersistenceService from "../services/PersistenceService";
import { MenuBar } from "../views/components/MenuBar";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import GameView from "../views/GameView";

function Gameplay() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const gameplay = useSelector((state: RootState) => state.gameplay);
  const [socket, setSocket] = useState<Socket>();
  const [isConnected, setIsConnected] = useState(socket?.connected);

  useEffect(() => {
    const socket =
      window.location.href.indexOf("localhost") > -1 ||
      window.location.href.indexOf("10.0.1.20") > -1
        ? io("http://10.0.1.20:3001")
        : io("https://opr-gameplay-tracker.herokuapp.com/");
    setSocket(socket);
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
        onBackClick={() => history.back()}
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
      {gameplay.lobbyId ? <GameView socket={socket} /> : <StartGame socket={socket} />}
      {gameplay.lists.map((list) => (
        <Fragment key={list.user}></Fragment>
      ))}
    </>
  );
}

export default dynamic(() => Promise.resolve(Gameplay), { ssr: false });

function StartGame({ socket }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const loadList = async () => {
    // Redirect to game selection screen if no army selected
    const listId = router.query["listId"] as string;
    const save = PersistenceService.getSaveData(listId);
    dispatch(setGameSystem(save.gameSystem));
    dispatch(getGameRules(save.gameSystem));
    const armyIds = save.armyIds || [save.armyId];
    const armyBooks = await PersistenceService.loadBooks(dispatch, armyIds, save.gameSystem);
    const list: IList = {
      ...(PersistenceService.buildListFromSave(save, armyBooks) as any), // Cast since unit types don't match...
      user: socket.id,
    };
    dispatch(addList(list));
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
        // Replay lobby history to get up to speed
        for (let action of lobby.actions) {
          dispatch(action);
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