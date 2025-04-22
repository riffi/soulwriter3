// components/WarningsPanel/WarningIteration.tsx
import {  Text } from "@mantine/core";
import { NavigationButtons } from "./NavigationButtons";

export const WarningIteration = ({ warningGroups, currentIndex, onSelectWarning}) => {



  if (warningGroups.length === 0) {
    return <Text size="sm" c="dimmed">Нет замечаний</Text>;
  }

  const currentGroup = warningGroups[currentIndex] || { items: []};

  return (
      <div>
        <NavigationButtons
            currentIndex={currentIndex}
            total={warningGroups.length}
            onNavigate={(direction) => {
              const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
              onSelectWarning?.(warningGroups[newIndex]?.items[0]);
            }}
        />

        <div style={{ marginTop: 16 }}>
          <GroupedWarning items={currentGroup.items} />
        </div>
      </div>
  );
};

const GroupedWarning = ({ items }) => (
    <div>
      {items.map((w, i) => (
          <div key={w.id}>
            <Text size="sm">{w?.text}</Text>
            {i === 0 && <Text size="xs" c="dimmed">Повторы группы {w.groupIndex}</Text>}
          </div>
      ))}
    </div>
);


