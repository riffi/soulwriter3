import {Box, Text} from "@mantine/core";
import {IScene} from "@/entities/BookEntities";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

const mobileStyle={
  position: "fixed",
  bottom: "0px",
  height: "50px",
  width: "100%",
  backgroundColor: "rgb(236,236,236)",
  color: "black",
  padding: "8px 16px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "10px"
}

const desktopStyle={
  position: "fixed",
  height: "50px",
  bottom: "0px",
  width: "100%",
  left: "0",
  backgroundColor: "rgb(236,236,236)",
  color: "black",
  padding: "8px 16px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "10px",
  zIndex: "10000"
}

export const SceneStatusPanel = (props: { scene: IScene }) => {
  const { isMobile } = useMedia();
  return (
      <>
        <Box
          style={isMobile ? mobileStyle : desktopStyle}
        >
          <Text size="sm">ccп: {props.scene?.totalSymbolCountWithSpaces}</Text>
          <Text size="sm">cбп: {props.scene?.totalSymbolCountWoSpaces}</Text>
        </Box>
      </>
  )
}
