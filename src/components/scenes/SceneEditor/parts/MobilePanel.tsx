import { Box } from "@mantine/core";

export const MobilePanel = ({
                              children,
                              keyboardHeight
                            }: {
  children: React.ReactNode;
  keyboardHeight: number;
}) => (
    <Box style={{
      position: 'absolute',
      bottom: keyboardHeight > 0 ? -1000 : 0,
      height: '100px',
      left: 0,
      right: 0,
      zIndex: 200,
      transition: 'bottom 0.3s ease',
      padding: '8px',
      backgroundColor: 'white',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
    }}>
      {children}
    </Box>
);
