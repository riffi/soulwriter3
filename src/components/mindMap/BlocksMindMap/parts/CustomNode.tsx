import { Handle, Position } from 'reactflow';

const handlePositions = [Position.Top, Position.Right, Position.Bottom, Position.Left];

const handleStyle = {
    backgroundColor: '#cbcbcb',
    width: '10',
    height: '10',
}

export const CustomNode = ({ data }) => (
    <div style={data.style}>
      {handlePositions.map(pos => (
          <Handle
              key={`source-${pos}`}
              type="source"
              position={pos}
              id={pos.toLowerCase()}
              style={handleStyle}
          />
      ))}
      <div>{data.label}</div>
      {handlePositions.map(pos => (
          <Handle
              key={`target-${pos}`}
              type="target"
              position={pos}
              id={pos.toLowerCase()}
              style={handleStyle}
          />
      ))}
    </div>
);
