
import {
  Group,
  UnstyledButton,
  Burger,
  Title,
  Tooltip
} from '@mantine/core';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './CollapsedNavbar.module.css';

import {NavLinkGroup} from "@/components/layout/NavbarNested/NavbarNested";
import {LogoCollapsed} from "@/components/layout/NavbarNested/parts/logo/LogoCollapsed";
import {IconViewer} from "@/components/shared/IconViewer/IconViewer";

export const CollapsedNavbar = ({
                                  opened,
                                  toggleNavbar,
                                  baseItems,
                                  dynamicItems
                                }: {
  opened: boolean;
  toggleNavbar?: () => void;
  baseItems: NavLinkGroup[];
  dynamicItems: NavLinkGroup[];
}) => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setHoveredItem(null);
    }, 200);
  };

  const cancelHoverTimeout = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };

  return (
      <div className={classes.navbarCollapsed} aria-label="Основное меню">
        <div className={classes.wrapper} ref={wrapperRef}>
          <div className={classes.aside}>
            <Burger
                opened={opened}
                onClick={toggleNavbar}
                visibleFrom="sm"
                lineSize={1}
                size="lg"
            />
            <div className={classes.logo}>
              <LogoCollapsed style={{ width: 35 }} />
            </div>
            {[...baseItems, ...dynamicItems].map((item) => (
                <Tooltip
                    label={ item.label }
                    position="right"
                    withArrow
                    zIndex={50}
                    transitionProps={{ duration: 0 }}
                    key={item.label}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.link){
                        navigate(item.link || '#');
                      }
                    }}
                >
                  <div
                      className={classes.menuItemContainer}
                      onMouseEnter={() => {
                        cancelHoverTimeout();
                        setHoveredItem(item.label);
                      }}
                      onMouseLeave={handleMouseLeave}
                      style={item.link ===  (location.pathname+location.search) ? { backgroundColor: 'var(--mantine-color-blue-0)' } :{}}
                  >
                    <UnstyledButton
                        className={classes.mainLink}
                        onClick={(e) => {
                          e.preventDefault();
                          if (item.link) navigate(item.link);
                        }}
                    >
                      <item.icon size={22} stroke={1.5} />
                    </UnstyledButton>

                    {hoveredItem === item.label && item.links?.length > 0 && (
                        <div
                            className={classes.popover}
                            onMouseEnter={cancelHoverTimeout}
                            onMouseLeave={handleMouseLeave}
                        >
                          <Title order={4} className={classes.title}>
                            {item.label}
                          </Title>
                          {item.links?.map((link) => (
                              <Group
                                  justify="flex-start"
                                  gap={0}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(link.link);
                                  }}
                                  className={classes.popoverLink}
                              >
                                <IconViewer
                                    iconName={link.icon}
                                    size={20}
                                    color="var(--mantine-color-blue-7)"
                                    backgroundColor={"transparent"}

                                />
                                <div style={{marginLeft: "10px"}}  className={classes.popoverLinkText}>
                                  {link.label}
                                </div>
                              </Group>
                          ))}
                        </div>
                    )}
                  </div>
                </Tooltip>
            ))}
          </div>
        </div>
      </div>
  );
};
