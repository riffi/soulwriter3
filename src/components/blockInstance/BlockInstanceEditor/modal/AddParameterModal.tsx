import {Button, Group, Modal, Stack} from "@mantine/core";

export const AddParameterModal = ({ opened, onClose, parameters, onSave }) => (
    <Modal opened={opened} onClose={onClose} title="Добавить параметр" centered>
        <Stack gap="sm">
            {parameters?.map((param) => (
                <Button
                    key={param.uuid}
                    variant="outline"
                    onClick={() => onSave(param.uuid)}
                    fullWidth
                >
                    {param.title}
                </Button>
            ))}
            <Group justify="flex-end">
                <Button variant="outline" onClick={onClose}>Закрыть</Button>
            </Group>
        </Stack>
    </Modal>
);
