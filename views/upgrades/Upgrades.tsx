import { Paper } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../data/store';
import styles from "../../styles/Upgrades.module.css";
import UpgradeGroup from './UpgradeGroup';
import UnitEquipmentTable from '../UnitEquipmentTable';
import RuleList from '../components/RuleList';
import { IUpgradePackage } from '../../data/interfaces';

export function Upgrades() {

    const list = useSelector((state: RootState) => state.list);
    const army = useSelector((state: RootState) => state.army.data);

    const selectedUnit = list.selectedUnitId === null || list.selectedUnitId === undefined
        ? null
        : list.units.filter(u => u.selectionId === list.selectedUnitId)[0];

    const getUpgradeSet = (id) => army.upgradePackages.filter((s) => s.uid === id)[0];
    if (!selectedUnit)
        return null;

    const equipmentSpecialRules = selectedUnit
        .selectedEquipment
        .filter(e => !e.attacks && e.specialRules?.length) // No weapons, and only equipment with special rules
        .reduce((value, e) => value.concat(e.specialRules), []); // Flatten array of special rules arrays

    const specialRules = (selectedUnit.specialRules || []).concat(equipmentSpecialRules).filter(r => r.name !== "-");

    return (
        <div className={styles["upgrade-panel"] + " py-4"}>
            <h3 className="px-4 is-size-4 is-hidden-mobile mb-4">{selectedUnit.name} Upgrades</h3>
            <UnitEquipmentTable unit={selectedUnit} />
            {specialRules?.length > 0 && <Paper square elevation={0}>
                <div className="p-4 mb-4">
                    <h4 style={{ fontWeight: 600 }}>Special Rules</h4>
                    <RuleList specialRules={specialRules} />
                </div>
            </Paper>}
            {(selectedUnit.upgrades || [])
                .map((setId) => getUpgradeSet(setId))
                .filter((s) => !!s) // remove empty sets?
                .map((pkg: IUpgradePackage) => (
                    <div key={pkg.uid}>
                        {/* <p className="px-2">{set.id}</p> */}
                        {pkg.sections.map((u, i) => (
                            <div className={"mt-4"} key={i}>
                                <p className="px-4 pt-0" style={{ fontWeight: "bold", fontStyle: "italic", }}>{u.label}:</p>
                                <UpgradeGroup upgrade={u} />
                            </div>
                        ))}
                    </div>
                ))}
        </div>
    );
}