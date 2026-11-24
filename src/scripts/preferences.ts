import { en, fa, type Language, type TranslationKey } from '../i18n';

const root = document.documentElement;
const languageToggle = document.getElementById('language-toggle') as HTMLButtonElement;
const themeToggle = document.getElementById('theme-toggle')!;
const themeLabel = document.getElementById('theme-label')!;
const dictionaries = { en, fa };
const attributes = ['alt', 'aria-label', 'content', 'data-lightbox-title', 'data-lightbox-description', 'data-lightbox-close'];

let language: Language = 'en';
try {
    if (localStorage.getItem('language') === 'fa') language = 'fa';
} catch (error) {}

function updateThemeLabel() {
    themeLabel.textContent = dictionaries[language][root.dataset.theme === 'light' ? 'controls.theme.dark' : 'controls.theme.light'];
}

function applyLanguage() {
    const dictionary = dictionaries[language];
    const valueFor = (key: string | null) => key && Object.hasOwn(dictionary, key) ? dictionary[key as TranslationKey] : undefined;
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const value = valueFor(element.getAttribute('data-i18n'));
        if (value !== undefined) element.textContent = value;
    });
    attributes.forEach(attribute => {
        document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
            const value = valueFor(element.getAttribute(`data-i18n-${attribute}`));
            if (value !== undefined) element.setAttribute(attribute, value);
        });
    });
    document.querySelectorAll('[data-i18n-subject]').forEach(element => {
        const value = valueFor(element.getAttribute('data-i18n-subject'));
        const href = element.getAttribute('href');
        if (value !== undefined && href) {
            const url = new URL(href);
            url.searchParams.set('subject', value);
            url.search = url.search.replace(/\+/g, '%20');
            element.setAttribute('href', url.toString());
        }
    });
    root.lang = language;
    root.dir = language === 'fa' ? 'rtl' : 'ltr';
    languageToggle.textContent = dictionary[language === 'fa' ? 'controls.language.en' : 'controls.language.fa'];
    languageToggle.setAttribute('lang', language === 'fa' ? 'en' : 'fa');
    updateThemeLabel();
    document.dispatchEvent(new Event('languagechange'));
    const scrollTrigger = (window as Window & { ScrollTrigger?: { refresh?: () => void } }).ScrollTrigger;
    if (typeof scrollTrigger?.refresh === 'function') scrollTrigger.refresh();
}

languageToggle.addEventListener('click', () => {
    language = language === 'fa' ? 'en' : 'fa';
    try { localStorage.setItem('language', language); } catch (error) {}
    applyLanguage();
});
languageToggle.disabled = false;

themeToggle.addEventListener('click', () => {
    const light = root.dataset.theme !== 'light';
    root.dataset.theme = light ? 'light' : 'dark';
    updateThemeLabel();
    try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (error) {}
});

applyLanguage();
