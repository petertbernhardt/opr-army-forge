import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, IconButton, TextField } from "@mui/material";
import EditIcon from "@mui/icons-material/Create";
import UpgradeService from "../../services/UpgradeService";
import { addUnit, renameUnit } from "../../data/listSlice";
import { RootState } from "../../data/store";
import UnitService from "../../services/UnitService";
import { debounce } from "throttle-debounce";

export default function UpgradePanelHeader() {
  const list = useSelector((state: RootState) => state.list);
  const dispatch = useDispatch();
  const [editMode, setEditMode] = useState(false);
  const [customName, setCustomName] = useState("");

  const selectedUnit = list.unitPreview ?? UnitService.getSelected(list);
  const previewMode = !!list.unitPreview;

  useEffect(() => {
    setCustomName(selectedUnit?.customName ?? selectedUnit?.name ?? "");
  }, [selectedUnit?.selectionId]);

  const debounceSave = useCallback(
    debounce(1000, (name) => dispatch(renameUnit({ unitId: selectedUnit.selectionId, name }))),
    [list]
  );

  if (!selectedUnit) return null;

  const toggleEditMode = () => {
    const toggleTo = !editMode;
    setEditMode(toggleTo);
    if (toggleTo) {
      // Focus
    }
  };

  return (
    <>
      <div className="is-flex is-align-items-center">
        {editMode ? (
          <TextField
            autoFocus
            variant="standard"
            className=""
            value={customName}
            onChange={(e) => {
              setCustomName(e.target.value);
              debounceSave(e.target.value);
            }}
          />
        ) : (
          <div className="is-flex" style={{ maxWidth: "calc(100% - 7rem)" }}>
            <h3 className="is-size-4 has-text-left unitName">
              {selectedUnit.customName || selectedUnit.name}{" "}
              {`[${UnitService.getSize(selectedUnit)}]`}
            </h3>
          </div>
        )}
        {!previewMode && (
          <IconButton color="primary" className="ml-2" onClick={() => toggleEditMode()}>
            <EditIcon />
          </IconButton>
        )}
        <p className="ml-4 is-flex-grow-1" style={{ textAlign: "right" }}>
          {UpgradeService.calculateUnitTotal(selectedUnit)}pts
        </p>
      </div>
      {previewMode && (
        <Button
          variant="contained"
          className="mt-2"
          style={{ width: "100%" }}
          onClick={() => dispatch(addUnit(list.unitPreview))}
        >
          Add to My List
        </Button>
      )}
    </>
  );
}
