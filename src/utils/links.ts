export function withBase(href: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = href.startsWith('/') ? href : `/${href}`;
  return `${base}${path}` || '/';
}
