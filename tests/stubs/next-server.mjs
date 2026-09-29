// Серверные модули Next в тесте рендера не вызываются — только импортируются.
export const cookies = async () => ({ get: () => undefined, set() {}, delete() {} });
export const headers = async () => new Headers();
export const revalidatePath = () => {};
export const revalidateTag = () => {};
export const after = () => {};
export const connection = async () => {};
export class NextResponse extends Response {}
