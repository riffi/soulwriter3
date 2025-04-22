import {Box, Text} from "@mantine/core";
import {IScene} from "@/entities/BookEntities";

export const SceneStatusPanel = (props: { scene: IScene }) => {
  return (
      <>
        <Box
          style={{
            position: "relative",
            bottom: 0,
            backgroundColor: "rgb(236,236,236)",
            color: "black",
            padding: "8px 16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            // zIndex: 1000,
            gap: "10px"
          }}
        >
          <Text size="sm">ccп: {props.scene?.totalSymbolCountWithSpaces}</Text>
          <Text size="sm">cбп: {props.scene?.totalSymbolCountWoSpaces}</Text>
        </Box>
      </>
  )
}
