import { createI18n, baseResources } from '@asteby/metacore-i18n'
import en from './locales/en.json'
import es from './locales/es.json'

const resources = {
  en: {
    translation: { ...baseResources.en.translation, ...en },
  },
  es: {
    translation: { ...baseResources.es.translation, ...es },
  },
}

const i18n = createI18n({
  resources,
  fallback: 'es',
  debug: import.meta.env.DEV,
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
  },
})

export default i18n
