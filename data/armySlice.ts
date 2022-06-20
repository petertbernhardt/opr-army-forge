import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useCallback } from 'react';
import { gameSystemToSlug } from '../services/Helpers';
import UpgradeService from '../services/UpgradeService';
import WebappApiService from '../services/WebappApiService';
import { IUnit, IUpgradePackage } from './interfaces';

export interface IGameRule {
  name: string;
  description: string;
  options: string[];
}

export interface ArmyState {
  loaded: boolean;
  loadingArmyData: boolean;
  gameSystem: string;
  armyFile: string;
  //data: IArmyData;
  rules: IGameRule[];
  armyBooks: IArmyData[];
  loadedArmyBooks: IArmyData[];
  selectedFactions: string[];
}

export interface IArmyData {
  uid: string;
  name: string;
  enabledGameSystems: number[];
  factionName: string;
  factionRelation: string;
  versionString: string;
  dataToolVersion: string;
  units: IUnit[];
  upgradePackages: IUpgradePackage[];
  specialRules: IGameRule[];
  spells: { id: string; name: string; effect: string; threshold: number; }[];
  isLive: boolean;
  official: boolean;
  coverImagePath: string;
  username?: string;
}

const initialState: ArmyState = {
  loaded: false,
  loadingArmyData: false,
  armyFile: null,
  gameSystem: null,
  //data: null,
  rules: [],
  armyBooks: [],
  loadedArmyBooks: [],
  selectedFactions: []
}

export const getArmyBooks = createAsyncThunk("army/getArmyBooks", async (gameSystem: string) => {
  // AF to Web Companion game type mapping
  const slug = gameSystemToSlug(gameSystem);
  const apiArmyBooks = await WebappApiService.getArmyBooks(slug);
  console.log("Loaded army books", apiArmyBooks);
  return apiArmyBooks.filter(book => book.official && book.isLive);
});

export const getArmyBookData = createAsyncThunk("army/getArmyBookData", async (payload: { armyUid: string, gameSystem: string, reset: boolean }) => {
  const armyBookData: IArmyData = await WebappApiService.getArmyBookData(
    payload.armyUid,
    payload.gameSystem
  );
  console.log("Loaded army data", armyBookData);
  //payload.callback(armyBookData);
  return { armyBookData, reset: payload.reset };
});

export const getGameRules = createAsyncThunk("army/getGameRules", async (gameSystem: string) => {
  // AF to Web Companion game type mapping
  const slug = gameSystemToSlug(gameSystem);
  const rules = await WebappApiService.getGameRules(slug);
  return rules.map((rule) => ({
    name: rule.name,
    description: rule.description,
  }));;
});

export const armySlice = createSlice({
  name: 'army',
  initialState: initialState,
  reducers: {
    resetLoadedBooks(state) {
      state.loadedArmyBooks = [];
      state.selectedFactions = [];
    },
    setGameSystem: (state, action: PayloadAction<string>) => {
      const gameSystem = action.payload;
      UpgradeService.gameSystem = gameSystem;
      return {
        ...state,
        gameSystem: action.payload,
        armyBooks: []
      };
    },
    setArmyFile: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        armyFile: action.payload
      };
    },
    unloadFaction(state, action: PayloadAction<string>) {
      const factionIndex = state.selectedFactions.findIndex(f => f === action.payload);
      state.selectedFactions.splice(factionIndex, 1);
      state.loadedArmyBooks = state.loadedArmyBooks.filter(book => book.factionName !== action.payload);
    },
    unloadArmyBook(state, action: PayloadAction<string>) {
      const uid = action.payload;
      const index = state.loadedArmyBooks.findIndex(book => book.uid === uid);
      state.loadedArmyBooks.splice(index, 1);
    }
  },
  extraReducers(builder) {
    builder.addCase(getArmyBooks.fulfilled, (state, action) => {
      return { ...state, armyBooks: action.payload };
    });
    builder.addCase(getGameRules.fulfilled, (state, action) => {
      return { ...state, rules: action.payload };
    });
    builder.addCase(getArmyBookData.pending, (state, action) => {
      return { ...state, loadingArmyData: true };
    });
    builder.addCase(getArmyBookData.fulfilled, (state, action: PayloadAction<{ armyBookData, reset }>) => {
      const { armyBookData, reset } = action.payload;

      state.loadingArmyData = false;
      state.loaded = true;

      if (armyBookData.factionName && !state.selectedFactions.some(x => x === armyBookData.factionName)) {
        state.selectedFactions.push(armyBookData.factionName)
      }

      if (reset) {
        state.loadedArmyBooks = [armyBookData];
        return;
      }

      const existingIndex = state.loadedArmyBooks.findIndex(book => book.uid === armyBookData.uid);
      const alreadyExists = existingIndex >= 0;
      if (alreadyExists) {
        state.loadedArmyBooks.splice(existingIndex, 1, armyBookData);
      } else {
        state.loadedArmyBooks.push(armyBookData);
      }
    });
  },
})

// Action creators are generated for each case reducer function
export const { resetLoadedBooks, setGameSystem, setArmyFile, unloadFaction, unloadArmyBook } = armySlice.actions;

export default armySlice.reducer;
