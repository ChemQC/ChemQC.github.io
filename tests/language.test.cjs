const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { buildSync } = require('esbuild');
const vm = require('node:vm');

function bundle(entry, globalName) {
    return buildSync({ entryPoints: [entry], bundle: true, write: false, format: 'iife', globalName, platform: 'browser' }).outputFiles[0].text;
}

const dictionaries = vm.runInNewContext(`${bundle('src/i18n.ts', 'dictionary')}\ndictionary`);
const { en, fa } = dictionaries;
const script = bundle('src/scripts/preferences.ts');
const keys = ['hero.brand', 'showcase.retrieval.title', 'showcase.retrieval.title', 'showcase.retrieval.description', 'faq.contactSubject', 'nav.about', 'meta.description'];

function element(attributes = {}, textContent = '') {
    return {
        attributes: { ...attributes }, textContent, handlers: {},
        getAttribute(name) { return this.attributes[name] ?? null; },
        setAttribute(name, value) { this.attributes[name] = String(value); },
        addEventListener(name, handler) { this.handlers[name] = handler; },
        click() { this.handlers.click(); },
    };
}

function loadPage(saved = {}, blocked = false, withScrollTrigger = true) {
    const stored = { ...saved };
    const root = { dataset: saved.theme === 'light' ? { theme: 'light' } : {} };
    const language = element();
    const theme = element();
    const label = element();
    const text = element({ 'data-i18n': keys[0] }, en[keys[0]]);
    const image = element({ alt: en[keys[1]], 'data-i18n-alt': keys[1], 'data-lightbox-title': en[keys[2]], 'data-i18n-data-lightbox-title': keys[2], 'data-lightbox-description': en[keys[3]], 'data-i18n-data-lightbox-description': keys[3] });
    const link = element({ href: 'mailto:test@example.com?subject=old&body=keep', 'data-i18n-subject': keys[4], 'aria-label': en[keys[5]], 'data-i18n-aria-label': keys[5] });
    const metadata = element({ content: en[keys[6]], 'data-i18n-content': keys[6] });
    const close = element({ 'data-lightbox-close': en['controls.close'], 'data-i18n-data-lightbox-close': 'controls.close' });
    const unknown = element({ 'data-i18n': 'missing.key', 'data-i18n-alt': 'missing.key', alt: 'unchanged' }, 'unchanged');
    const elements = [text, image, link, metadata, close, unknown];
    let changes = 0;
    let refreshes = 0;
    const document = {
        documentElement: root,
        getElementById: id => ({ 'language-toggle': language, 'theme-toggle': theme, 'theme-label': label })[id],
        querySelectorAll: selector => elements.filter(item => item.getAttribute(selector.slice(1, -1)) !== null),
        dispatchEvent: event => { if (event.type === 'languagechange') changes++; },
    };
    const context = vm.createContext({
        document,
        localStorage: {
            getItem(key) { if (blocked) throw Error('blocked'); return stored[key]; },
            setItem(key, value) { if (blocked) throw Error('blocked'); stored[key] = value; },
        },
        window: withScrollTrigger ? { ScrollTrigger: { refresh() { refreshes++; } } } : {},
        Event: class Event { constructor(type) { this.type = type; } },
        URL,
    });
    vm.runInContext(script, context);
    return { stored, root, language, theme, label, text, image, link, metadata, close, unknown, changes: () => changes, refreshes: () => refreshes };
}

test('dictionaries have matching nonempty keys and the exact Persian brand', () => {
    assert.deepEqual(Object.keys(fa).sort(), Object.keys(en).sort());
    for (const key of Object.keys(en)) {
        assert.equal(typeof en[key], 'string', key);
        assert.ok(en[key].trim(), key);
        assert.equal(typeof fa[key], 'string', key);
        assert.ok(fa[key].trim(), key);
    }
    assert.ok(Object.values(fa).some(value => value.includes('کِم کیوسی')));
});

test('switches repeatedly using dictionary values for text, attributes and mail subjects', () => {
    const page = loadPage();
    assert.equal(page.root.lang, 'en');
    assert.equal(page.root.dir, 'ltr');
    assert.equal(page.language.textContent, 'فارسی');
    assert.equal(page.language.attributes.lang, 'fa');
    assert.equal(page.language.disabled, false);
    for (let i = 0; i < 2; i++) {
        for (const [language, translations] of [['fa', fa], ['en', en]]) {
            page.language.click();
            assert.equal(page.root.lang, language);
            assert.equal(page.root.dir, language === 'fa' ? 'rtl' : 'ltr');
            assert.equal(page.language.textContent, language === 'fa' ? 'English' : 'فارسی');
            assert.equal(page.language.attributes.lang, language === 'fa' ? 'en' : 'fa');
            assert.equal(page.text.textContent, translations[keys[0]]);
            assert.equal(page.image.attributes.alt, translations[keys[1]]);
            assert.equal(page.image.attributes['data-lightbox-title'], translations[keys[2]]);
            assert.equal(page.image.attributes['data-lightbox-description'], translations[keys[3]]);
            assert.equal(page.link.attributes['aria-label'], translations[keys[5]]);
            const mailto = new URL(page.link.attributes.href);
            assert.equal(mailto.pathname, 'test@example.com');
            assert.equal(mailto.searchParams.get('subject'), translations[keys[4]]);
            assert.equal(mailto.searchParams.get('body'), 'keep');
            assert.ok(page.link.attributes.href.includes('%20'));
            assert.equal(page.metadata.attributes.content, translations[keys[6]]);
            assert.equal(page.close.attributes['data-lightbox-close'], translations['controls.close']);
            assert.equal(page.unknown.textContent, 'unchanged');
            assert.equal(page.unknown.attributes.alt, 'unchanged');
        }
    }
    assert.equal(page.stored.language, 'en');
    assert.equal(page.changes(), 5);
    assert.equal(page.refreshes(), 5);
});

test('restores saved Persian; invalid or blocked storage defaults to English', () => {
    const page = loadPage({ language: 'fa' });
    assert.equal(page.text.textContent, fa[keys[0]]);
    page.language.click();
    assert.equal(page.text.textContent, en[keys[0]]);
    assert.equal(loadPage({ language: 'invalid' }).root.lang, 'en');
    const blocked = loadPage({}, true, false);
    assert.equal(blocked.root.lang, 'en');
    blocked.language.click();
    assert.equal(blocked.root.lang, 'fa');
    blocked.theme.click();
    assert.equal(blocked.root.dataset.theme, 'light');
});

test('theme destination labels follow both independent preferences', () => {
    const page = loadPage();
    assert.equal(page.label.textContent, 'Light theme');
    page.theme.click();
    assert.equal(page.label.textContent, 'Dark theme');
    assert.deepEqual(page.stored, { theme: 'light' });
    page.language.click();
    assert.equal(page.label.textContent, 'پوسته تیره');
    assert.deepEqual(page.stored, { theme: 'light', language: 'fa' });
    page.theme.click();
    assert.equal(page.label.textContent, 'پوسته روشن');
    assert.deepEqual(page.stored, { theme: 'dark', language: 'fa' });
    assert.equal(loadPage(page.stored).label.textContent, 'پوسته روشن');
});

test('layout uses bundled preferences and deferred animation scripts with keyed metadata', () => {
    const layout = readFileSync('src/layouts/Layout.astro', 'utf8');
    assert.match(layout, /<script>\s*import ['"]\.\.\/scripts\/preferences['"];?\s*<\/script>/);
    for (const source of ['gsap.min.js', 'ScrollTrigger.min.js', './index.js']) {
        const tag = [...layout.matchAll(/<script\b[^>]*>/g)].map(match => match[0]).find(value => value.includes(source));
        assert.ok(tag, source);
        assert.match(tag, /\bdefer\b/);
    }
    assert.match(layout, /<title\b[^>]*data-i18n="meta.title"/);
    assert.match(layout, /<meta name="description"[^>]*data-i18n-content="meta.description"/);
    assert.match(layout, /<meta property="og:title"[^>]*data-i18n-content="meta.title"/);
    assert.match(layout, /<meta property="og:description"[^>]*data-i18n-content="meta.ogDescription"/);
});

test('template translation markers resolve and six showcase images carry keyed lightbox copy', () => {
    const paths = ['src/layouts/Layout.astro', 'src/components/HeaderHero.astro', 'src/components/IntroductionBenefits.astro', 'src/components/Showcase.astro', 'src/components/FaqFooter.astro'];
    for (const path of paths) {
        const source = readFileSync(path, 'utf8');
        assert.ok(!/\bdata-fa(?:[-=\s])/.test(source), `${path}: legacy translation marker`);
        for (const [, key] of source.matchAll(/\bdata-i18n(?:-[\w-]+)?="([^"]+)"/g)) {
            assert.ok(Object.hasOwn(en, key), `${path}: ${key}`);
        }
    }
    const showcase = readFileSync('src/components/Showcase.astro', 'utf8');
    const images = showcase.match(/<img\b[^>]*class="showcase-image[\s\S]*?\/>/g) || [];
    assert.equal(images.length, 6);
    for (const image of images) {
        const title = image.match(/data-i18n-alt="(showcase\.[^"]+\.title)"/)?.[1];
        assert.ok(title);
        assert.ok(image.includes(`data-i18n-data-lightbox-title="${title}"`));
        assert.ok(image.includes(`data-i18n-data-lightbox-description="${title.replace(/\.title$/, '.description')}"`));
    }
});

test('language changes resize an open FAQ even without the animation CDN', () => {
    const handlers = {};
    const classes = new Set();
    const content = { style: {}, scrollHeight: 240 };
    const faq = {
        nextElementSibling: content,
        classList: {
            contains: name => classes.has(name),
            toggle: name => classes.has(name) ? classes.delete(name) : classes.add(name),
        },
        addEventListener(name, callback) { this[name] = callback; },
    };
    const language = element();
    const theme = element();
    const label = element();
    const document = {
        documentElement: { dataset: {} },
        getElementById: id => ({ 'language-toggle': language, 'theme-toggle': theme, 'theme-label': label })[id] || {},
        querySelectorAll: selector => selector === '.faq-accordion' ? [faq] : [],
        addEventListener: (name, callback) => { handlers[name] = callback; },
        dispatchEvent: event => { if (handlers[event.type]) handlers[event.type](event); },
    };
    const context = vm.createContext({
        document,
        window: { innerWidth: 1200, addEventListener() {} },
        localStorage: { getItem() {}, setItem() {} },
        Event: class Event { constructor(type) { this.type = type; } },
        URL,
    });
    vm.runInContext(script, context);
    assert.throws(() => vm.runInContext(readFileSync('public/index.js', 'utf8'), context), /gsap is not defined/);
    faq.click.call(faq);
    assert.equal(content.style.maxHeight, '240px');
    content.scrollHeight = 360;
    language.click();
    assert.equal(content.style.maxHeight, '360px');
    faq.click.call(faq);
    assert.equal(content.style.maxHeight, '0px');
});
