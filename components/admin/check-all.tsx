"use client";

/**
 * «Отметить все» для галочек, которые стоят не в самой форме, а в
 * карточках списка и привязаны к ней атрибутом `form`. Второе нажатие
 * снимает все отметки. Без скрипта кнопки нет смысла показывать — но и
 * вреда нет: галочки ставятся руками по одной.
 */
export function CheckAll({ form, label, className }: { form: string; label: string; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const boxes = [...document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][form="${form}"]`)];
        const all = boxes.length > 0 && boxes.every((box) => box.checked);
        for (const box of boxes) box.checked = !all;
      }}
    >
      {label}
    </button>
  );
}
