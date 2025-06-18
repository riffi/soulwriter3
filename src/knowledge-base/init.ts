import {configDatabase} from '@/entities/configuratorDb';
import {KnowledgeBaseRepository} from '@/repository/KnowledgeBaseRepository';

interface ParsedPage {
  uuid: string;
  title: string;
  markdown: string;
}

function parseFrontMatter(raw: string): ParsedPage | null {
  const text = raw
      .replace(/^\uFEFF/, '')   // срезаем возможный BOM
      .replace(/\r\n/g, '\n');  // все переводы строк → LF

  const match = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/m.exec(text);
  if (!match) return null;
  const frontMatter = Object.fromEntries(
    match[1]
      .split('\n')
      .map((l) => l.split(':').map((s) => s.trim()))
      .filter((arr) => arr.length === 2)
  ) as Record<string, string>;
  const uuid = frontMatter['uuid'];
  const title = frontMatter['title'] || '';
  const markdown = match[2].trim();
  if (!uuid) return null;
  return { uuid, title, markdown };
}

export async function initKnowledgeBasePages() {
  const modules = import.meta.glob('./*.md', { as: 'raw' });
  const entries = Object.entries(modules);
  for (const [, loader] of entries) {
    const raw = await loader();
    const page = parseFrontMatter(raw);
    if (page) {
      const existing = await KnowledgeBaseRepository.getByUuid(
        configDatabase,
        page.uuid
      );
      if (!existing) {
        await KnowledgeBaseRepository.save(configDatabase, page);
      }
    }
  }
}
