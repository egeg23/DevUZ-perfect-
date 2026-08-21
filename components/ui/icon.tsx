/** Иконки услуг. Инлайн-SVG вместо шрифта или спрайта: пять штук не стоят
 *  ни лишнего запроса, ни зависимости. */
const paths: Record<string, string> = {
  globe:
    "M12 3a9 9 0 100 18 9 9 0 000-18zm0 0c2.5 2.4 3.8 5.4 3.8 9s-1.3 6.6-3.8 9m0-18c-2.5 2.4-3.8 5.4-3.8 9s1.3 6.6 3.8 9M3.5 9h17M3.5 15h17",
  phone:
    "M8 2.5h8a2 2 0 012 2v15a2 2 0 01-2 2H8a2 2 0 01-2-2v-15a2 2 0 012-2zm2.5 16.5h3",
  brain:
    "M9.5 3.5A3 3 0 006.6 7 3 3 0 005 9.8a3 3 0 001.4 2.6A3 3 0 007.2 17a3 3 0 002.3 3.5V3.5zm5 0A3 3 0 0117.4 7 3 3 0 0119 9.8a3 3 0 01-1.4 2.6 3 3 0 01-.8 4.6 3 3 0 01-2.3 3.5V3.5z",
  cart: "M3 4h2.2l2 11.2a2 2 0 002 1.6h7.7a2 2 0 002-1.6L20.5 8H6.3M9.5 20.5h.01M17 20.5h.01",
  plug: "M9 3v6M15 3v6M6.5 9h11v3a5.5 5.5 0 01-5.5 5.5A5.5 5.5 0 016.5 12V9zM12 17.5V21",
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const d = paths[name] ?? paths.globe;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
