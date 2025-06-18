// BookEditModal.tsx
import { Modal } from "@mantine/core";
import { IBook } from "@/entities/BookEntities";
import { IBookConfiguration } from "@/entities/ConstructorEntities";
import { useMedia } from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { BookSettingsForm } from "@/components/books/BookSettingsForm/BookSettingsForm";

interface BookEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: IBook) => void;
  initialData?: IBook;
  configurations: IBookConfiguration[];
  kind?: string;
}

export const BookEditModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  configurations,
  kind,
}: BookEditModalProps) => {
  const { isMobile } = useMedia();

  const handleSave = (data: IBook) => {
    onSave(data);
    onClose();
  };

  return (
    <Modal
      title={initialData?.uuid ? "Редактирование книги" : "Добавление новой книги"}
      opened={isOpen}
      onClose={onClose}
      size="md"
      fullScreen={isMobile}
    >
      <BookSettingsForm
        onSave={handleSave}
        onCancel={onClose}
        initialData={initialData}
        configurations={configurations}
        kind={kind}
      />
    </Modal>
  );
};
