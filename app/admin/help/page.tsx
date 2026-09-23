import { HelpView } from "@/components/admin/help-view";
import { isHelpLocale, type HelpLocale } from "@/content/admin-help";
import { requireStaff } from "@/lib/admin/guard";
import { isRole, type Role } from "@/lib/admin/roles";

export const dynamic = "force-dynamic";

/**
 * Инструкции к панели.
 *
 * Видят все, но каждый — только про свои разделы и своими словами: у пункта
 * может быть отдельный текст для менеджера, руководителя и владельца.
 * Описание раздела, куда человека всё равно не пустят, вызывает вопросы, а
 * не снимает их. Порядок тот же, что в меню, чтобы читать можно было сверху
 * вниз, сверяясь с экраном.
 *
 * У каждого раздела и пункта свой якорь: на него ведут кнопка «Как
 * пользоваться разделом» в шапке и «?» у блоков внутри разделов.
 *
 * Владелец может открыть инструкцию глазами руководителя или менеджера
 * (`?as=`): проверить, что команда читает, без чужого входа.
 *
 * Язык переключается ссылкой, а не куком: ссылкой на узбекскую версию
 * удобно поделиться с новым сотрудником.
 */
export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; as?: string }>;
}) {
  const staff = await requireStaff();
  const { lang, as } = await searchParams;
  const locale: HelpLocale = isHelpLocale(lang) ? lang : "ru";

  // Смотреть глазами другой роли может только владелец: у него и так видно всё.
  const role: Role = staff.role === "admin" && as && isRole(as) ? as : staff.role;

  return <HelpView staff={staff} locale={locale} role={role} />;
}
