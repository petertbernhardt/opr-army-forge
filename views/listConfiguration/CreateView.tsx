import { Button, Checkbox, FormControlLabel, FormGroup } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getArmyBookData } from "../../data/armySlice";
import { createList } from "../../data/listSlice";
import { RootState } from "../../data/store";
import PersistenceService from "../../services/PersistenceService";

interface CreateViewProps {
  armyName: string;
  pointsLimit: number;
}

export function CreateView(props: CreateViewProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const armyState = useSelector((state: RootState) => state.army);

  const [autoSave, setAutoSave] = useState(true);
  const [isCampaignList, setCampaignList] = useState(false);

  const factionName = router.query["faction"] as string;
  const armyId = router.query["armyId"] as string;

  useEffect(() => {
    if (armyState.armyBooks?.length < 1) return;

    if (armyId && armyState.loadedArmyBooks.length === 0) {
      dispatch(
        getArmyBookData({
          armyUid: armyId,
          gameSystem: armyState.gameSystem,
          reset: false,
        })
      );
    }
  }, [armyState.armyBooks]);

  const create = async () => {
    const name = props.armyName || "My List";

    const creationTime = autoSave ? PersistenceService.createSave(armyState, name) : null;

    dispatch(
      createList({
        name,
        units: [],
        points: 0,
        pointsLimit: props.pointsLimit || 0,
        creationTime: creationTime,
        campaignMode: isCampaignList,
      })
    );

    router.push({ pathname: "/list", query: { listId: creationTime } });
  };

  return (
    <>
      <FormGroup className="mt-4 is-flex-direction-row is-align-items-center">
        <FormControlLabel
          control={<Checkbox checked={autoSave} onClick={() => setAutoSave((prev) => !prev)} />}
          label="Auto-save changes"
        />
      </FormGroup>
      <FormGroup className="mb-2 is-flex-direction-row is-align-items-center">
        <FormControlLabel
          control={
            <Checkbox checked={isCampaignList} onClick={() => setCampaignList((prev) => !prev)} />
          }
          label="Campaign Mode"
        />
      </FormGroup>
      <Button
        className="mx-auto px-6"
        variant="contained"
        onClick={() => create()}
        disabled={armyState.loadingArmyData}
      >
        Create List
      </Button>
    </>
  );
}
