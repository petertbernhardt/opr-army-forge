import { Card, CardContent, IconButton, Modal } from "@mui/material";
import { Fragment, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../data/store";
import { setOpenReleaseNotes } from "../../data/appSlice";

export const APP_VERSION = "0.6.4";

export default function ReleaseNotes() {
  const open = useSelector((state: RootState) => state.app.openReleaseNotes);
  const dispatch = useDispatch();
  const setOpen = (x) => dispatch(setOpenReleaseNotes(x));

  useEffect(() => {
    const lastVersion = localStorage["lastVersion"];
    const latestVersion = releaseNotes[0].version;

    localStorage["lastVersion"] = latestVersion;

    // Don't show the popup if the user hasn't visited the app before
    // But - show the popup anyway if the latest version was the version release notes were added...
    if (!lastVersion) return;

    if (isVersionGreaterThan(latestVersion, lastVersion)) {
      setOpen(true);
    }
  }, []);

  return (
    <Modal open={open} onClose={() => setOpen(false)} style={{ overflowY: "auto" }}>
      <div className="m-4" style={{ outline: "none" }}>
        <Card className="mx-auto" style={{ maxWidth: "480px" }}>
          <CardContent>
            <div className="is-flex" style={{ alignItems: "center" }}>
              <h2 className="mb-2" style={{ flex: 1, fontWeight: "600", fontSize: "20px" }}>
                Release Notes
              </h2>
              <IconButton onClick={() => setOpen(false)}>
                <CloseIcon />
              </IconButton>
            </div>
            {releaseNotes.map((release) => (
              <Fragment key={release.version}>
                <h3 className="mb-2" style={{ fontWeight: "600" }}>
                  v{release.version} - {release.date}
                </h3>
                <ul className="mb-4">
                  {release.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </Fragment>
            ))}
          </CardContent>
        </Card>
      </div>
    </Modal>
  );
}

interface IRelease {
  version: string;
  date: string;
  notes: string[];
}

const releaseNotes: IRelease[] = [
  {
    version: "0.8.1",
    date: "19/06/22",
    notes: [
      "Added AoF:R",
    ],
  },
  {
    version: "0.8.0",
    date: "11/06/22",
    notes: [
      "Enhancements:",
      "- Show joined to unit in card view",
      "- Added competitive list validation optional message with link to rules",
      "Bug fixes:",
      "- Fixed custom list names in edit list screen",
      "- Fixed units notes duplicating between units",
      "- Fixed campaign traits not showing up in special rules card",
      "- Fixed equipment rules not showing in card view when unit has no other special rules"
    ],
  },
  {
    version: "0.7.1",
    date: "04/05/22",
    notes: [
      "Campaign fixes!",
      "- AoF/AoFS",
      "- Fixed XP cost for GFF/AoFS",
      "- Fixed injury/talents requiring 5XP before enabling",
    ],
  },
  {
    version: "0.7.0",
    date: "04/05/22",
    notes: [
      "Campaign lists!",
      "- Track unit's XP/level",
      "- Track unit's Traits, Injuries and Talents",
      "- Unit's traits displayed in card view",
      "- Added campaign traits rule text/descriptions",
      "Add custom notes to unit",
      "Added quality / defense to upgrade window",
    ],
  },
  {
    version: "0.6.5",
    date: "01/05/22",
    notes: [
      "Webapp integration fix for auto-selecting first detachment on list creation.",
      "Fixed card view point calculation when hero is joined to combined unit.",
      "Imported lists now have an updated creationTime to avoid clashing with existing saved lists.",
    ],
  },
  {
    version: "0.6.4",
    date: "29/04/22",
    notes: ["Open a list screen mobile UX."],
  },
  {
    version: "0.6.3",
    date: "28/04/22",
    notes: ["Unit card combination fixed"],
  },
  {
    version: "0.6.2",
    date: "28/04/22",
    notes: ["Added main menu option to delete list.", "Re-enabled PWA"],
  },
  {
    version: "0.6.1",
    date: "28/04/22",
    notes: ["Fixed rule text display on hover on desktop."],
  },
  {
    version: "0.6.0",
    date: "28/04/22",
    notes: ["Added tabular list view as alternative to cards."],
  },
  {
    version: "0.5.0",
    date: "28/04/22",
    notes: [
      "Unit Cards - now merge combined units.",
      "Unit Cards - Unit equipment moved to rules to avoid rule duplication.",
      "'Open a List' screen UX.",
      "Competitive army list validation rules added for mixed armies",
      "Fixed mobile scroll behaviour when dragging rules text.",
      "Added release notes!",
    ],
  },
  {
    version: "0.1.0",
    date: "",
    notes: ["All current content!"],
  },
];

function isVersionGreaterThan(a, b) {
  const splitA = a.split(".");
  const splitB = b.split(".");

  if (parseInt(splitA[0]) > parseInt(splitB[0])) return true;
  if (parseInt(splitA[1]) > parseInt(splitB[1])) return true;
  if (parseInt(splitA[2]) > parseInt(splitB[2])) return true;
  return false;
}
