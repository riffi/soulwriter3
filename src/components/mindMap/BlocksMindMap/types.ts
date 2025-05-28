import {IIcon} from "@/entities/ConstructorEntities";

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
  label?: string
}
