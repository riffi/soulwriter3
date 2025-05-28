export interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string; style?: React.CSSProperties };
  type?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  sourceHandle?: string;
  targetHandle?: string;
}
