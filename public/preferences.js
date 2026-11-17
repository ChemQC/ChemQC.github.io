(() => {
    const root = document.documentElement
    const languageToggle = document.getElementById('language-toggle')
    const themeToggle = document.getElementById('theme-toggle')
    const themeLabel = document.getElementById('theme-label')
    const translations = []

    document.querySelectorAll('[data-fa]').forEach(element => {
        translations.push({ element, attribute: null, en: element.textContent, fa: element.getAttribute('data-fa') })
    })
    ;['alt', 'aria-label', 'data-lightbox-title', 'data-lightbox-description', 'content', 'href'].forEach(attribute => {
        document.querySelectorAll(`[data-fa-${attribute}]`).forEach(element => {
            translations.push({ element, attribute, en: element.getAttribute(attribute), fa: element.getAttribute(`data-fa-${attribute}`) })
        })
    })

    let language = 'en'
    try {
        if (localStorage.getItem('language') === 'fa') language = 'fa'
    } catch (error) {}

    function updateThemeLabel() {
        const light = root.dataset.theme === 'light'
        themeLabel.textContent = language === 'fa'
            ? (light ? 'پوسته تیره' : 'پوسته روشن')
            : (light ? 'Dark theme' : 'Light theme')
    }

    function applyLanguage() {
        translations.forEach(({ element, attribute, en, fa }) => {
            const value = language === 'fa' ? fa : en
            if (attribute) element.setAttribute(attribute, value)
            else element.textContent = value
        })
        root.lang = language
        root.dir = language === 'fa' ? 'rtl' : 'ltr'
        languageToggle.textContent = language === 'fa' ? 'English' : 'فارسی'
        languageToggle.setAttribute('lang', language === 'fa' ? 'en' : 'fa')
        updateThemeLabel()
        document.dispatchEvent(new Event('languagechange'))
        if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') window.ScrollTrigger.refresh()
    }

    languageToggle.addEventListener('click', () => {
        language = language === 'fa' ? 'en' : 'fa'
        try { localStorage.setItem('language', language) } catch (error) {}
        applyLanguage()
    })
    languageToggle.disabled = false

    themeToggle.addEventListener('click', () => {
        const light = root.dataset.theme !== 'light'
        root.dataset.theme = light ? 'light' : 'dark'
        updateThemeLabel()
        try { localStorage.setItem('theme', light ? 'light' : 'dark') } catch (error) {}
    })

    applyLanguage()
})()
