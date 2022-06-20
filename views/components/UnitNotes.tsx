import { Button, TextField } from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setUnitNotes } from "../../data/listSlice";
import { debounce } from "throttle-debounce";

export default function UnitNotes({ selectedUnit }) {
  const dispatch = useDispatch();
  const [unitNotes, setUnitNotesState] = useState(null);

  useEffect(() => {
    console.log("Setting notes");
    setUnitNotesState(selectedUnit?.notes ?? "");
  }, [selectedUnit]);

  const debounceSetNotes = useCallback(
    debounce(750, (notes) => dispatch(setUnitNotes({ unitId: selectedUnit.selectionId, notes }))),
    [selectedUnit]
  );

  const handleNotesChanged = (evt) => {
    console.log(evt.target.value);
    const notes = evt.target.value;
    setUnitNotesState(notes);
    debounceSetNotes(notes);
  };

  return (
    <TextField
      multiline={true}
      label="Notes"
      fullWidth
      value={unitNotes}
      onChange={handleNotesChanged}
    />
  );
}
