import { defaultProps } from "@blocknote/core";

export const alertBlockConfig = {
  type: "alert",
  propSchema: {
    textAlignment: defaultProps.textAlignment,
    textColor: defaultProps.textColor,
    type: {
      default: "warning",
      values: ["warning", "error", "info", "success"],
    },
  },
  content: "inline",
} as const;
