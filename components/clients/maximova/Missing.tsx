/**
 * Пустое место вместо выдуманного.
 *
 * Цен, адреса, формата и отзывов Дарья пока не называла. Прототип не
 * придумывает их, а показывает, где они встанут, — чтобы и владелец, и она
 * видели, чего не хватает странице.
 */
export function Missing({ what, className }: { what: string; className?: string }) {
  return (
    <p className={className} data-missing="">
      <span>Уточняется у Дарьи</span> {what}
    </p>
  );
}
