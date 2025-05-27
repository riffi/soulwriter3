// src/components/CustomNode.tsx
import { Handle, Position } from 'reactflow';

export const CustomNode = ({ data }) => {
  return (
      <div style={data.style}>
        <Handle type="source" position={Position.Top} id="top" />
        <Handle type="source" position={Position.Right} id="right" />
        <Handle type="source" position={Position.Bottom} id="bottom" />
        <Handle type="source" position={Position.Left} id="left" />
        <div>{data.label}</div>
        <Handle type="target" position={Position.Top} id="top" />
        <Handle type="target" position={Position.Right} id="right" />
        <Handle type="target" position={Position.Bottom} id="bottom" />
        <Handle type="target" position={Position.Left} id="left" />
      </div>
  );
};
