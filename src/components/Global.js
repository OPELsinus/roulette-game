// src/components/Global.js
export const ValueType = {
  NUMBER: "NUMBER",
  DOUBLE_SPLIT: "DOUBLE_SPLIT",
  TRIPLE_SPLIT: "TRIPLE_SPLIT",
  QUAD_SPLIT: "QUAD_SPLIT",
  EMPTY: "EMPTY",
  NUMBERS_1_12: "NUMBERS_1_12",
  NUMBERS_2_12: "NUMBERS_2_12",
  NUMBERS_3_12: "NUMBERS_3_12",
  NUMBERS_1_18: "NUMBERS_1_18",
  NUMBERS_19_36: "NUMBERS_19_36",
  EVEN: "EVEN",
  ODD: "ODD",
  RED: "RED",
  BLACK: "BLACK",
};

export type Item = {
  type: string;
  value?: number;
  valueSplit?: number[];
};