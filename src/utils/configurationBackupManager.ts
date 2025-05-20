import {BlockAbstractDb} from "@/entities/BlockAbstractDb";
import {ConfigurationRepository} from "@/repository/ConfigurationRepository";

export const exportConfiguration = async (db: BlockAbstractDb, configUuid: string) => {
  const data = await ConfigurationRepository.getExportData(db, configUuid);
  if (!data) return;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.configuration.title}_config.json`;
  a.click();
  URL.revokeObjectURL(url);
};
