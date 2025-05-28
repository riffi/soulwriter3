import {IIcon} from "@/entities/ConstructorEntities";
import {EdgeMarkerType} from "@reactflow/core/dist/esm/types/edges";
import type {CSSProperties} from "react";

export interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: {
    label: string;
    style?: React.CSSProperties,
    icon?: IIcon
  };
  type?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  markerStart?: EdgeMarkerType;
  markerEnd?: EdgeMarkerType;
  style: CSSProperties
}
