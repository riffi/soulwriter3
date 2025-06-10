// BookEditModal.tsx
import { Button, Group, Modal, Select, TextInput, Text, Space } from "@mantine/core"; // Added Text and Space
import { useForm } from "@mantine/form";
import { IBookConfiguration } from "@/entities/ConstructorEntities";
import {IBook} from "@/entities/BookEntities";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { genres, forms } from "@/data/bookProperties"; // Import genres and forms
import { useEffect } from "react"; // Import useEffect

interface BookEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: IBook) => void;
  initialData?: IBook;
  configurations: IBookConfiguration[];
}

export const BookEditModal = ({
                                isOpen,
                                onClose,
                                onSave,
                                initialData,
                                configurations,
                              }: BookEditModalProps) => {
  const {isMobile} = useMedia();

  const form = useForm({
    initialValues: {
      uuid: "",
      title: "",
      author: "",
      form: "", // Changed from kind
      genre: "", // Added genre
      subGenre: "", // Added subGenre
      configurationUuid: "",
      configurationTitle: ""
    },
    validate: {
      title: (value) => (value ? null : "Название обязательно"),
      form: (value) => (value ? null : "Форма обязательна"),
      genre: (value) => (value ? null : "Основной жанр обязателен"),
    },
  });

  // Handle initialData population
  useEffect(() => {
    if (initialData) {
      const { genre, form: initialForm, ...restData } = initialData;
      let mainGenre = '';
      let subGenre = '';
      if (genre && genre.includes('/')) {
        const parts = genre.split('/');
        mainGenre = parts[0];
        subGenre = parts[1];
      } else if (genre) {
        mainGenre = genre;
      }
      form.setValues({
        ...restData,
        form: initialForm || "",
        genre: mainGenre,
        subGenre: subGenre,
        configurationUuid: initialData.configurationUuid || "",
        author: initialData.author || "",
        title: initialData.title || "", // ensure title is also handled
        // uuid needs to be handled if it's part of the form and can be undefined in initialData
        uuid: initialData.uuid || "",
        configurationTitle: initialData.configurationTitle || "",
      });
    } else {
      // Reset to blank if no initialData, explicitly set new fields
      form.reset();
      form.setFieldValue('genre', '');
      form.setFieldValue('subGenre', '');
      form.setFieldValue('form', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]); // form.setValues is not stable, if form is recreated, this might be an issue.
  // Consider using form.setValues directly in the initialValues setup if possible or ensure form instance is stable.

  const handleSubmit = (values: typeof form.values) => {
    let finalGenre = values.genre;
    if (values.subGenre) {
      finalGenre = `${values.genre}/${values.subGenre}`;
    }
    const bookDataToSave = {
      ...values,
      genre: finalGenre,
      configurationTitle: configurations.find(
          (config) => config.uuid === values.configurationUuid
      )?.title || "",
    };
    // delete bookDataToSave.subGenre; // subGenre is not part of IBook, so it's fine if it's not deleted from the argument to onSave if IBook is used correctly

    const { subGenre, ...bookDataForSave } = bookDataToSave;


    onSave(bookDataForSave as IBook);
    onClose();
  };

  // Helper function for character count text
  const formatCharCount = (charCount: { min: number; max: number } | undefined): string => {
    if (!charCount) return "";
    // Ensure charCount.min and charCount.max are numbers before calling toLocaleString
    const minStr = typeof charCount.min === 'number' ? charCount.min.toLocaleString() : 'N/A';
    const maxStr = typeof charCount.max === 'number' ? charCount.max.toLocaleString() : 'N/A';
    return `Рекомендуемый объем: ${minStr} - ${maxStr} знаков`;
  };

  const formOptions = Object.keys(forms).map(key => ({ value: key, label: key })); // Corrected: forms is now flat
  const genreOptions = Object.keys(genres).map(key => ({ value: key, label: key }));

  let subGenreOptions: { value: string; label: string; }[] = [];
  const mainGenreData = form.values.genre ? genres[form.values.genre] : null;
  if (mainGenreData && mainGenreData.subcategories) {
    subGenreOptions = Object.keys(mainGenreData.subcategories).map(key => ({ value: key, label: key }));
  }

  const configurationOptions = configurations.map((config) => ({
    value: config.uuid,
    label: config.title,
  }));

  return (
      <Modal
          title={initialData?.uuid ? "Редактирование книги" : "Добавление новой книги"}
          opened={isOpen}
          onClose={onClose}
          size="md"
          fullScreen={isMobile}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
              withAsterisk
              label="Название книги"
              placeholder="Введите название"
              {...form.getInputProps("title")}
          />
          <TextInput
              label="Автор"
              placeholder="Введите автора"
              mt="md"
              {...form.getInputProps("author")}
          />
          <Select
              withAsterisk
              label="Форма произведения"
              placeholder="Выберите форму"
              mt="md"
              data={formOptions}
              {...form.getInputProps("form")}
          />
          {form.values.form && forms[form.values.form] && (
              <>
                <Space h="xs" />
                <Text size="sm" c="dimmed">{forms[form.values.form].description}</Text>
                <Text size="sm" c="dimmed">{formatCharCount(forms[form.values.form].char_count)}</Text>
              </>
          )}
          <Select
              withAsterisk
              label="Основной жанр"
              placeholder="Выберите основной жанр"
              mt="md"
              data={genreOptions}
              {...form.getInputProps("genre")}
              onChange={(value) => {
                form.setFieldValue('genre', value || "");
                form.setFieldValue('subGenre', '');
              }}
          />
          <Select
              label="Поджанр"
              placeholder="Выберите поджанр"
              mt="md"
              data={subGenreOptions}
              disabled={!form.values.genre || !genres[form.values.genre]?.subcategories || Object.keys(genres[form.values.genre].subcategories!).length === 0}
              {...form.getInputProps("subGenre")}
          />
          {(() => {
            const mainGenreName = form.values.genre;
            const subGenreName = form.values.subGenre;
            let detailsToShow: { description: string; char_count: { min: number; max: number } } | undefined;

            if (mainGenreName && genres[mainGenreName]) {
              if (subGenreName && genres[mainGenreName].subcategories && genres[mainGenreName].subcategories[subGenreName]) {
                detailsToShow = genres[mainGenreName].subcategories[subGenreName];
              } else {
                detailsToShow = genres[mainGenreName];
              }
            }

            if (detailsToShow) {
              return (
                  <>
                    <Space h="xs" />
                    <Text size="sm" c="dimmed" mt="xs">Описание жанра: {detailsToShow.description}</Text>
                    <Text size="sm" c="dimmed">{formatCharCount(detailsToShow.char_count)}</Text>
                  </>
              );
            }
            return null;
          })()}
          <Select
              label="Конфигурация"
              placeholder="Выберите конфигурацию"
              mt="md"
              data={configurationOptions}
              {...form.getInputProps("configurationUuid")}
          />
          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </Group>
        </form>
      </Modal>
  );
};
