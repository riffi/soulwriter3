import { useDisclosure } from "@mantine/hooks";
import {Modal, Button, Text, Group} from "@mantine/core";
import React, { useState } from "react";

// Создаем контекст для модального окна
const DialogContext = React.createContext<{
  showDialog: (title: string, body: string) => Promise<boolean>;
}>({
  showDialog: () => Promise.resolve(false),
});

// Провайдер для контекста
export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({
                                                                          children,
                                                                        }) => {
  const [isOpen, { open, close }] = useDisclosure(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [resolvePromise, setResolvePromise] = useState<
      ((value: boolean) => void) | null
  >(null);

  const showDialog = (title: string, body: string): Promise<boolean> => {
    setTitle(title);
    setBody(body);
    open();

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleClose = (result: boolean) => {
    close();
    if (resolvePromise) {
      resolvePromise(result);
      setResolvePromise(null);
    }
  };

  return (
      <DialogContext.Provider value={{ showDialog }}>
        {children}
        <Modal
            opened={isOpen}
            onClose={() => handleClose(false)}
            title={title}
            centered
        >
          <Text mb="sm">{body}</Text>
          <Group>
            <Button onClick={() => handleClose(true)} color="red" mr="sm">
              Подтвердить
            </Button>
            <Button onClick={() => handleClose(false)} variant={"outline"}>
              Отмена
            </Button>
          </Group>
        </Modal>
      </DialogContext.Provider>
  );
};

// Хук для использования диалога
export const useDialog = () => {
  return React.useContext(DialogContext);
};
