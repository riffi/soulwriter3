import {useCallback, useEffect, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Button,
    Container,
    Group,
    LoadingOverlay,
    Paper,
    Drawer,
    Space, ActionIcon,
    Select,
    Anchor
} from "@mantine/core";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import { configDatabase } from "@/entities/configuratorDb";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {IconSettings} from "@tabler/icons-react";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {INote, INoteGroup, IBook} from "@/entities/BookEntities"; // Corrected INotesGroup to INoteGroup
import {InlineTagEdit} from "@/components/shared/InlineEdit/InlineTagEdit";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";
import {NoteRepository} from "@/repository/Note/NoteRepository";
import moment from 'moment';
import { generateUUID } from '@/utils/UUIDUtils';


export const NoteEditPage = () => {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState<INote | null>(null);
    const [noteBody, setNoteBody] = useState("");
    const [books, setBooks] = useState<IBook[]>([]);
    const [selectedBookUuid, setSelectedBookUuid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isNewNote, setIsNewNote] = useState(false);
    const [showBookSelect, setShowBookSelect] = useState(false);
    const {isMobile} = useMedia();
    const [drawerOpened, setDrawerOpened] = useState(false);
    const { setTitleElement } = usePageTitle(); // Removed setPageTitle as it's not used directly

    useEffect(() => {
        const loadNoteAndBooks = async () => {
            setLoading(true);
            const booksData = await configDatabase.books.toArray();
            setBooks(booksData);

            if (!uuid || uuid === 'new') {
                setIsNewNote(true);
                setNote({
                    uuid: generateUUID(),
                    title: "Новая заметка",
                    body: "",
                    tags: "",
                    noteGroupUuid: undefined,
                    bookUuid: null, // Initialize bookUuid for new notes
                    createdAt: moment().toISOString(true),
                    updatedAt: moment().toISOString(true),
                    id: undefined
                });
                setNoteBody("");
                setSelectedBookUuid(null); // Initialize selectedBookUuid for new notes
                setShowBookSelect(false); // Don't show select by default for new notes
                setLoading(false);
            } else {
                setIsNewNote(false);
                const data = await NoteRepository.getByUuid(configDatabase, uuid!);
                if (data) {
                    setNote(data);
                    if (data.body !== noteBody) {
                        setNoteBody(data.body);
                    }
                    setSelectedBookUuid(data.bookUuid || null); // Set selected book from loaded note
                    setShowBookSelect(!!data.bookUuid); // Show select if note already has a book
                }
                setLoading(false);
            }
        };
        loadNoteAndBooks();
    }, [uuid]);

    // Управление заголовком через эффект
    useEffect(() => {
        if (note && isMobile) {
            const headerElement = (
                <Group justify="space-between" align="flex-end" flex={2} flexShrink={1}>
                    <div style={{
                        flexGrow: 1,
                        marginLeft: 10,
                    }}>
                        {note.title}
                    </div>
                    <ActionIcon
                        flexShrink={0}
                        variant="subtle"
                        color={"gray"}
                        onClick={() => setDrawerOpened(true)}
                    >
                        <IconSettings size={32} />
                    </ActionIcon>
                </Group>
            );
            setTitleElement(headerElement);
        } else {
            setTitleElement(null);
        }

        return () => {
            setTitleElement(null); // Очистка при размонтировании
        };
    }, [note, isMobile]); // Added setTitleElement to deps

    const persistNote = useCallback(async (updatedFields: Partial<INote>) => {
        if (!note && !isNewNote) {
            console.error("Attempted to save without note data or new note flag.");
            return;
        }
        setLoading(true);
        let noteToSave: INote;
        let finalUuid = note?.uuid;

        const bookUuidToSave = updatedFields.hasOwnProperty('bookUuid') ? updatedFields.bookUuid : selectedBookUuid;

        if (isNewNote) {
            let quickNotesGroup = await configDatabase.notesGroups
                .where('title')
                .equals("Быстрые заметки")
                .first();

            if (!quickNotesGroup) {
                const newGroupUuid = generateUUID();
                // Using INoteGroup as per BookEntities.ts, omitting createdAt, updatedAt, notesCount, isSystem
                const newGroupData: INoteGroup = {
                    uuid: newGroupUuid,
                    title: "Быстрые заметки",
                    kindCode: 'system',
                    parentUuid: "topLevel",
                    id: undefined // id will be set by dexie if it's auto-incrementing primary key
                };
                await configDatabase.notesGroups.add(newGroupData);
                quickNotesGroup = await configDatabase.notesGroups.where('uuid').equals(newGroupUuid).first();
            }

            if (!quickNotesGroup) {
                console.error("Failed to create or find 'Быстрые заметки' group after attempting creation.");
                setLoading(false);
                return;
            }

            noteToSave = {
                ...(note!),
                ...updatedFields,
                bookUuid: bookUuidToSave,
                noteGroupUuid: quickNotesGroup.uuid,
                updatedAt: moment().toISOString(true),
                // createdAt is set when the note is first initialized for 'new'
            };
            finalUuid = note!.uuid;

        } else {
            if (!note) {
                setLoading(false);
                console.error("Attempted to update a null note.");
                return;
            }
            noteToSave = {
                ...note,
                ...updatedFields,
                bookUuid: bookUuidToSave,
                updatedAt: moment().toISOString(true),
            };
            finalUuid = note.uuid;
        }

        try {
            const savedId = await NoteRepository.save(configDatabase, noteToSave);
            const savedNote = { ...noteToSave, id: noteToSave.id || savedId };
            setNote(savedNote);

            if (updatedFields.hasOwnProperty('bookUuid')) {
                setSelectedBookUuid(updatedFields.bookUuid || null);
                // Update showBookSelect based on whether we have a book
                setShowBookSelect(!!updatedFields.bookUuid);
            }

            if (isNewNote) {
                setIsNewNote(false);
                if (finalUuid) {
                    navigate(`/notes/edit/${finalUuid}`, { replace: true });
                } else {
                    console.error("UUID missing after new note save.");
                }
            }
        } catch (error) {
            console.error("Failed to save note:", error);
        } finally {
            setLoading(false);
        }
    }, [note, isNewNote, navigate, selectedBookUuid]);

    const handleContentChange = useCallback((content: string) => {
        if (noteBody === content) {
            return;
        }
        //setNoteBody(content);
        persistNote({ body: content });
    }, [persistNote, noteBody]); // Updated dependencies

    const handleBookLinkClick = () => {
        setShowBookSelect(true);
    };

    const handleBookSelectChange = async (value: string | null) => {
        await persistNote({ bookUuid: value || undefined });
        if (!value) {
            setShowBookSelect(false);
        }
    };

    if (loading && !note) return <LoadingOverlay visible />; // Show full loading only if note is not yet available

    const bookSelectSection = showBookSelect || selectedBookUuid ? (
        <Select
            label="Книга"
            placeholder="Выберите книгу"
            data={books.map(book => ({ value: book.uuid, label: book.title }))}
            value={selectedBookUuid}
            onChange={handleBookSelectChange}
            clearable
            mb="md"
        />
    ) : (
        <Group mb="md">
            <Anchor
                onClick={handleBookLinkClick}
                style={{ cursor: 'pointer' }}
            >
                Привязать к книге
            </Anchor>
        </Group>
    );

    const headerContent = (
        <>
            <Button variant="subtle" onClick={() => navigate(-1)}>
                ← Назад к списку
            </Button>

            <InlineEdit
                value={note?.title || ""}
                label="Название заметки"
                onChange={async (value) => {
                    if (!isNewNote && note && note.title === value) return;
                    await persistNote({ title: value });
                }}
            />
            <Space mb="sm"/>

            {bookSelectSection}

            <InlineTagEdit
                label="Теги"
                value={note?.tags?.split(',').filter(Boolean) || []}
                onChange={async (value) => {
                    const newTags = value.join(',').toLowerCase();
                    if (!isNewNote && note && note.tags === newTags) return;
                    await persistNote({ tags: newTags });
                }}
                mb="md"
            />
            <Space mb="md"/>
        </>
    );
    return (
        <Container size="xl" p="0">
            {loading && <LoadingOverlay visible />} {/* More subtle loading overlay when note is already displayed */}
            <Paper p={"md"}>
                {isMobile ? (
                    <>
                        <Drawer
                            opened={drawerOpened}
                            onClose={() => setDrawerOpened(false)}
                            title="Редактирование"
                            position="left"
                            size="100%"
                        >
                            {headerContent}
                        </Drawer>
                    </>
                ) : (
                    headerContent
                )}

                <RichEditor
                    key={note?.uuid || 'new-note-editor'} // Added key to help React re-mount editor for new notes
                    initialContent={noteBody}
                    mobileConstraints={
                        {top: 50, bottom: 0}
                    }
                    onContentChange={handleContentChange}
                />
            </Paper>
        </Container>
    );
};
