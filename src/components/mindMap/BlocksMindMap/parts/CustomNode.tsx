import { Handle, Position } from 'reactflow';
import {Group} from "@mantine/core";
import {IconViewer} from "@/components/shared/IconViewer/IconViewer";
import {useNavigate} from "react-router-dom";

const handlePositions = [Position.Top, Position.Right, Position.Bottom, Position.Left];

const handleStyle = {
    backgroundColor: '#cbcbcb',
    width: '10',
    height: '10',
}

export const CustomNode = ({ data }) => {
    return (
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
      <Group
          gap={0}
          position="center"
      >
          <IconViewer
              icon={data.icon}
              size={10}
              color={"white"}
              backgroundColor={"transparent"}
          />
          <div>{data.label}</div>
      </Group>
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
)};
