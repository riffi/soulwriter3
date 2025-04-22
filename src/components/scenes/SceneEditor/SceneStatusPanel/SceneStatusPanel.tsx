import {Box, Text} from "@mantine/core";
import {IScene} from "@/entities/BookEntities";

export const SceneStatusPanel = (props: { scene: IScene }) => {
  return (
      <>
        <Box
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            backgroundColor: "rgb(101 159 209)",
            boxShadow: "0px -2px 5px rgba(0, 0, 0, 0.2)",
            color: "white",
            padding: "8px 16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            gap: "10px"
          }}
        >
          <Text size="sm">Символов с пробелами: {props.scene?.totalSymbolCountWithSpaces}</Text>
          <Text size="sm">Символов без пробелов: {props.scene?.totalSymbolCountWoSpaces}</Text>
        </Box>
      </>
  )
}
