import {Box, Text} from "@mantine/core";
import {IScene} from "@/entities/BookEntities";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

const mobileStyle={
  position: "fixed",
  bottom: "0px",
  height: "30px",
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
  backgroundColor: "rgb(236,236,236)",
  height: "30px",
  color: "black",
  padding: "8px 32px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "10px",
  zIndex: "99"
}

export const SceneStatusPanel = (props: { scene: IScene }) => {
  const { isMobile } = useMedia();
  return (
      <>
        <Box
          style={isMobile ? mobileStyle : desktopStyle}
        >
          <Text size="sm">Символов: {props.scene?.totalSymbolCountWoSpaces} / {props.scene?.totalSymbolCountWithSpaces}</Text>
        </Box>
      </>
  )
}
