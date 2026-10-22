module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  /* Панель за nginx по адресу devuz.studio/sia-cms: свой адрес и доверие к X-Forwarded-*. */
  url: env('PUBLIC_URL', ''),
  proxy: { koa: env.bool('IS_PROXIED', false) },
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
