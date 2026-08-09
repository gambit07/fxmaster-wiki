import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

function applyBasePath(link: string): string {
  if (!link.startsWith('/') || link.startsWith('//')) return link;

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!base || link === base || link.startsWith(`${base}/`)) return link;

  return `${base}${link}`;
}

export const onRequest = defineRouteMiddleware((context) => {
  const actions = context.locals.starlightRoute.entry.data.hero?.actions;
  if (!actions) return;

  for (const action of actions) action.link = applyBasePath(action.link);
});
