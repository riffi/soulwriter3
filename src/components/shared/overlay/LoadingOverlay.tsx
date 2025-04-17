// LoadingOverlay.tsx
import {LoadingOverlay as MantineLoadingOverlay, Stack} from '@mantine/core';
import { IconRepeat } from '@tabler/icons-react';
import { keyframes, css } from '@emotion/react';
import styled from '@emotion/styled';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const rotateAndColor = keyframes`
  0% {
    transform: rotate(0deg);
    color: #6daefd;
  }
  50% {
    color: #3c7ec7;
  }
  100% {
    transform: rotate(360deg);
    color: #6daefd;
  }
`;

const StyledIcon = styled(IconRepeat)`
  animation: ${rotateAndColor} 1.8s linear infinite;
  filter: drop-shadow(0 0 2px rgba(113, 213, 255, 0.3));
`;

export const LoadingOverlay = ({ visible, message }: LoadingOverlayProps) => (
    <MantineLoadingOverlay
        visible={visible}
        zIndex={1000}
        overlayProps={{ blur: 5 }}
        loaderProps={{
          children: (
              <Stack>
                <div style={{ textAlign: 'center' }}>
                  <StyledIcon
                      size={48}
                      css={css`
                        flex-shrink: 0;
                        path {
                          stroke: currentColor;
                        }
                      `}
                  />
                </div>
                {message && <div style={{
                  fontSize: "1rem",
                  color: "#3c7ec7",
                  whiteSpace: "nowrap"
                }}>{message}</div>}
              </Stack>
          )
        }}
    />
);
