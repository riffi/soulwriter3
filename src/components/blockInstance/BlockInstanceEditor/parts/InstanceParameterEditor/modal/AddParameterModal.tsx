import {Button, Group, Modal, Stack} from "@mantine/core";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

export const AddParameterModal = ({ opened, onClose, parameters, onSave }) => {
    const {isMobile} = useMedia();

    return (
    <Modal
        opened={opened}
        onClose={onClose}
        title="Добавить свойство"
        centered
        fullScreen={isMobile}
    >
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
    )
}
