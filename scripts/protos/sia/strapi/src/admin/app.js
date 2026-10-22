/* Админка по-русски: язык интерфейса — русский по умолчанию, английский оставлен на выбор в профиле. */
const config = {
  locales: ['ru'],
  translations: {
    ru: {
      'app.components.LeftMenu.navbrand.title': 'SIA · панель сайта',
      'app.components.LeftMenu.navbrand.workplace': 'Архитектурное бюро',
      'Auth.form.welcome.title': 'Панель сайта SIA',
      'Auth.form.welcome.subtitle': 'Войдите в свой аккаунт',
    },
  },
  tutorials: false,
  notifications: { releases: false },
};

/* Язык панели — русский, пока человек сам не выберет другой в профиле. */
const bootstrap = () => {
  try {
    if (!localStorage.getItem('strapi-admin-language')) {
      localStorage.setItem('strapi-admin-language', 'ru');
      location.reload();
    }
  } catch (e) {
    /* без хранилища — английский */
  }
};

export default { config, bootstrap };
