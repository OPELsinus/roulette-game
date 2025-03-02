import React from "react";
import Chip from "./Chip";

const ChipComponent = ({
  currentItemChips,
  tdKey,
  chipKey,
  cell,
  cellClass,
  rowSpan,
  colSpan,
  onCellClick,
  leftMin,
  leftMax,
  topMin,
  topMax,
}: {
  currentItemChips: any;
  tdKey: string;
  chipKey: string;
  cell: any;
  cellClass: string;
  rowSpan: number;
  colSpan: number;
  onCellClick: (item: any) => void;
  leftMin?: number;
  leftMax?: number;
  topMin?: number;
  topMax?: number;
}) => {
  return (
    <td
      key={tdKey}
      className={cellClass}
      rowSpan={rowSpan}
      colSpan={colSpan}
      onClick={() => onCellClick(cell)}
    >
      {currentItemChips &&
        currentItemChips.map((chip: any, index: number) => (
          <Chip key={`${chipKey}_${index}`} value={chip.value} />
        ))}
    </td>
  );
};

export default ChipComponent;