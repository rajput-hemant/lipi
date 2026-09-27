import "./alert-block.css";

import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import {
  AlertCircleIcon,
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const alertTypes = [
  {
    title: "Warning",
    value: "warning",
    icon: Alert02Icon,
  },
  {
    title: "Error",
    value: "error",
    icon: AlertCircleIcon,
  },
  {
    title: "Info",
    value: "info",
    icon: InformationCircleIcon,
  },
  {
    title: "Success",
    value: "success",
    icon: CheckmarkCircle02Icon,
  },
] as const;

export type AlertType = (typeof alertTypes)[number]["value"];

export const createCalloutBlock = createReactBlockSpec(
  {
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
  },
  {
    render: (props) => {
      const alertType =
        alertTypes.find((entry) => entry.value === props.block.props.type) ??
        alertTypes[0];
      const Icon = alertType.icon;

      return (
        <div className="alert" data-alert-type={props.block.props.type}>
          <div className="alert-icon-wrapper">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="alert-icon"
                data-alert-icon-type={props.block.props.type}
              >
                <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Callout type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {alertTypes.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() =>
                      props.editor.updateBlock(props.block, {
                        type: "alert",
                        props: { type: type.value },
                      })
                    }
                  >
                    <HugeiconsIcon
                      icon={type.icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                    {type.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="inline-content" ref={props.contentRef} />
        </div>
      );
    },
  },
);
