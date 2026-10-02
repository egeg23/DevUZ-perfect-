/**
 * Почему прототип заранее не собрался — кодом (prospects.proto_note). Текст
 * на языке панели подбирает карточка касания (content/admin-panel/prospect.ts,
 * protoNoteDict). Отдельным файлом, чтобы карточке не тянуть за собой сборку.
 */
export const AUTO_NOTES = ["niche", "collect", "services", "name", "missing", "draft", "model", "failed"] as const;
export type AutoNote = (typeof AUTO_NOTES)[number];

export function isAutoNote(value: string): value is AutoNote {
  return (AUTO_NOTES as readonly string[]).includes(value);
}
