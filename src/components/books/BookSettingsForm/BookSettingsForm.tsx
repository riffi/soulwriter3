// BookSettingsForm.tsx
import {Button, Group, Box, Select, TextInput, Text, Space, Textarea} from "@mantine/core"; // Added Text and Space
import { useForm } from "@mantine/form";
import { IBookConfiguration } from "@/entities/ConstructorEntities";
import {IBook} from "@/entities/BookEntities";
import { genres, forms } from "@/data/bookProperties"; // Import genres and forms
import { useEffect } from "react"; // Import useEffect

interface BookSettingsFormProps {
  onSave: (data: IBook) => void;
  onCancel?: () => void;
  initialData?: IBook;
  configurations: IBookConfiguration[];
  kind?: string; // Added kind prop
}

export const BookSettingsForm = ({
                                   onSave,
                                   onCancel,
                                   initialData,
                                   configurations,
                                   kind, // Added kind to props destructuring
                                 }: BookSettingsFormProps) => {
  const currentKind = kind || initialData?.kind; // Determine current kind

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
      // Conditional validation
      form: (value) => (currentKind !== 'material' && !value ? "Форма обязательна" : null),
      genre: (value) => (currentKind !== 'material' && !value ? "Основной жанр обязателен" : null),
    },
  });

  // Handle initialData population
  useEffect(() => {
    if (initialData) {
      const { genre, form: initialForm, kind: initialKind, ...restData } = initialData; // kind is part of initialData
      let mainGenre = '';
      let subGenre = '';
      if (currentKind !== 'material' && genre && genre.includes('/')) {
        const parts = genre.split('/');
        mainGenre = parts[0];
        subGenre = parts[1];
      } else if (currentKind !== 'material' && genre) {
        mainGenre = genre;
      }
      form.setValues({
        ...restData,
        form: currentKind !== 'material' ? (initialForm || "") : "", // Clear if material
        genre: currentKind !== 'material' ? mainGenre : "", // Clear if material
        subGenre: currentKind !== 'material' ? subGenre : "", // Clear if material
        configurationUuid: initialData.configurationUuid || "",
        author: initialData.author || "",
        title: initialData.title || "",
        uuid: initialData.uuid || "",
        configurationTitle: initialData.configurationTitle || "",
        // kind is not part of the form values, but it's used for conditional rendering
      });
    } else {
      // Reset to blank if no initialData
      form.reset();
      form.setValues({ // Use setValues to ensure all fields, including new ones, are reset
        uuid: "",
        title: "",
        author: "",
        form: currentKind !== 'material' ? "Роман" : "", // Default form if not material
        genre: "",
        subGenre: "",
        configurationUuid: "",
        configurationTitle: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, currentKind]); // Add currentKind to dependency array
  // Consider using form.setValues directly in the initialValues setup if possible or ensure form instance is stable.

  const handleSubmit = (values: typeof form.values) => {
    let finalGenre = values.genre;
    if (values.subGenre) {
      finalGenre = `${values.genre}/${values.subGenre}`;
    }
    const bookDataToSave: Partial<IBook> & { subGenre?: string } = { // Ensure IBook compatibility
      ...values,
      genre: finalGenre,
      configurationTitle: configurations.find(
          (config) => config.uuid === values.configurationUuid
      )?.title || "",
      kind: currentKind, // Ensure kind is included when saving
    };

    if (currentKind === 'material') {
      bookDataToSave.form = ""; // Explicitly set to empty for materials
      bookDataToSave.genre = ""; // Explicitly set to empty for materials
    }


    // Remove subGenre before saving as it's not part of IBook
    const { subGenre, ...bookDataForSave } = bookDataToSave;

    onSave(bookDataForSave as IBook);
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
      <Box>
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

          {currentKind !== 'material' && (
              <>
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
              </>
          )}

          <Select
              label="Конфигурация"
              placeholder="Выберите конфигурацию"
              mt="md"
              data={configurationOptions}
              {...form.getInputProps("configurationUuid")}
          />
          <Textarea
              label="Описание"
              placeholder="Введите описание"
              mt="md"
              autosize
              minRows={2}
              {...form.getInputProps("description")}
          />
          <Group justify="flex-end" mt="xl">
            {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Отмена
                </Button>
            )}
            <Button type="submit">Сохранить</Button>
          </Group>
        </form>
      </Box>
  );
};
