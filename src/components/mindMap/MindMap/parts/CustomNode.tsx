import { Handle, Position } from 'reactflow';
import {Group, Stack, Text} from "@mantine/core";
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
          style={data.onClick ?{
              cursor: 'pointer',
          }:{}}
          onClick={() =>{
            if (data.onClick) {
                data.onClick();
            }
          }}
      >
          <IconViewer
              icon={data.icon}
              size={10}
              color={"white"}
              backgroundColor={"transparent"}
          />
          <Stack gap={0}>
              <Text style={{
                  fontSize: "10px",
                  lineHeight: "1"
                }}
              >{data.label}</Text>
              <Text
                  color={"#dadada"}
                  style={{
                      fontSize: "6px",
                  }}
              >{data.description}</Text>
          </Stack>
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
