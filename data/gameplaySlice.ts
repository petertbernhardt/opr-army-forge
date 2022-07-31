import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ISelectedUnit } from './interfaces';

export interface GameplayState {
  lobbyId: string;
  lists: IList[];
}

export interface IList {
  user: string;
  units: IGameplayUnit[];
  points: number;
}

export interface IGameplayUnit extends ISelectedUnit {
  activated: boolean;
  pinned: boolean;
  dead: boolean;
}

const initialState: GameplayState = {
  lobbyId: "",
  lists: []
};

export const gameplaySlice = createSlice({
  name: 'gameplay',
  initialState,
  reducers: {
    setLobby(state, action: PayloadAction<string>) {
      state.lobbyId = action.payload;
    },
    addList(state, action: PayloadAction<IList>) {
      state.lists.push(action.payload)
    },
    modifyUnit(state, action: PayloadAction<{ user: string, unitId: string, modification: any }>) {
      const { user, unitId, modification } = action.payload;
      const list = state.lists.find(x => x.user === user);
      const unitIndex = list.units.findIndex(x => x.selectionId === unitId);
      list.units.splice(unitIndex, 1, { ...list.units[unitIndex], ...modification });
    }
  },
})

// Action creators are generated for each case reducer function
export const { setLobby, addList, modifyUnit } = gameplaySlice.actions;

export default gameplaySlice.reducer;