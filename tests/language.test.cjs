const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const script = readFileSync('public/preferences.js', 'utf8');
const layout = readFileSync('src/layouts/Layout.astro', 'utf8');

function element(attributes = {}, textContent = '') {
    return {
        attributes: { ...attributes }, textContent, handlers: {},
        getAttribute(name) { return this.attributes[name] ?? null; },
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(name, handler) { this.handlers[name] = handler; },
        click() { this.handlers.click(); },
    };
}

function loadPage(saved = {}, blocked = false) {
    const stored = { ...saved };
    const root = { dataset: saved.theme === 'light' ? { theme: 'light' } : {} };
    const language = element();
    const theme = element();
    const label = element();
    const text = element({ 'data-fa': 'کِم کیوسی' }, 'ChemQC');
    const image = element({ alt: 'Image', 'data-fa-alt': 'تصویر', 'data-lightbox-title': 'Title', 'data-fa-data-lightbox-title': 'عنوان', 'data-lightbox-description': 'Description', 'data-fa-data-lightbox-description': 'توضیح' });
    const link = element({ href: 'mailto:test@example.com?subject=Hello', 'data-fa-href': 'mailto:test@example.com?subject=%D8%B3%D9%84%D8%A7%D9%85', 'aria-label': 'Contact', 'data-fa-aria-label': 'تماس' });
    const metadata = element({ content: 'Description', 'data-fa-content': 'توضیحات' });
    const elements = [text, image, link, metadata];
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
        window: { ScrollTrigger: { refresh() { refreshes++; } } },
        Event: class Event { constructor(type) { this.type = type; } },
    });
    vm.runInContext(script, context);
    return { stored, root, language, theme, label, text, image, link, metadata, changes: () => changes, refreshes: () => refreshes };
}

test('defaults to English and restores original text and attributes through repeated switches', () => {
    const page = loadPage();
    assert.equal(page.root.lang, 'en');
    assert.equal(page.root.dir, 'ltr');
    assert.equal(page.language.textContent, 'فارسی');
    assert.equal(page.language.attributes.lang, 'fa');
    assert.equal(page.language.disabled, false);
    for (let i = 0; i < 2; i++) {
        page.language.click();
        assert.equal(page.root.lang, 'fa');
        assert.equal(page.root.dir, 'rtl');
        assert.equal(page.language.textContent, 'English');
        assert.equal(page.language.attributes.lang, 'en');
        assert.equal(page.text.textContent, 'کِم کیوسی');
        assert.equal(page.image.attributes.alt, 'تصویر');
        assert.equal(page.image.attributes['data-lightbox-title'], 'عنوان');
        assert.equal(page.image.attributes['data-lightbox-description'], 'توضیح');
        assert.equal(page.link.attributes['aria-label'], 'تماس');
        assert.equal(page.link.attributes.href, 'mailto:test@example.com?subject=%D8%B3%D9%84%D8%A7%D9%85');
        assert.equal(page.metadata.attributes.content, 'توضیحات');
        page.language.click();
        assert.equal(page.text.textContent, 'ChemQC');
        assert.equal(page.image.attributes.alt, 'Image');
        assert.equal(page.image.attributes['data-lightbox-title'], 'Title');
        assert.equal(page.image.attributes['data-lightbox-description'], 'Description');
        assert.equal(page.link.attributes.href, 'mailto:test@example.com?subject=Hello');
        assert.equal(page.link.attributes['aria-label'], 'Contact');
        assert.equal(page.metadata.attributes.content, 'Description');
    }
    assert.equal(page.stored.language, 'en');
    assert.equal(page.changes(), 5);
    assert.equal(page.refreshes(), 5);
});

test('restores saved Persian, and invalid or blocked storage defaults to English', () => {
    const page = loadPage({ language: 'fa' });
    assert.equal(page.text.textContent, 'کِم کیوسی');
    page.language.click();
    assert.equal(page.text.textContent, 'ChemQC');
    assert.equal(loadPage({ language: 'invalid' }).root.lang, 'en');
    const blocked = loadPage({}, true);
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
    page.language.click();
    assert.equal(page.label.textContent, 'پوسته تیره');
    page.theme.click();
    assert.equal(page.label.textContent, 'پوسته روشن');
    assert.deepEqual(page.stored, { theme: 'dark', language: 'fa' });
    assert.equal(loadPage(page.stored).label.textContent, 'پوسته روشن');
});

test('preferences execute before CDN scripts and metadata is translatable', () => {
    assert.ok(layout.indexOf('src="./preferences.js"') < layout.indexOf('src="https://cdnjs.cloudflare.com/ajax/libs/gsap'));
    assert.match(layout, /<title data-fa=/);
    assert.match(layout, /<meta name="description"[^>]*data-fa-content=/);
    assert.match(layout, /<meta property="og:title"[^>]*data-fa-content=/);
    assert.match(layout, /<meta property="og:description"[^>]*data-fa-content=/);
});

test('all showcase images provide Persian lightbox text and the brand spelling is exact', () => {
    const showcase = readFileSync('src/components/Showcase.astro', 'utf8');
    const images = showcase.match(/<img\b[^>]*class="showcase-image[\s\S]*?\/>/g) || [];
    assert.equal(images.length, 6);
    for (const image of images) {
        assert.match(image, /data-fa-alt="[^"]+"/);
        assert.match(image, /data-fa-data-lightbox-title="[^"]+"/);
        assert.match(image, /data-fa-data-lightbox-description="[^"]+"/);
    }
    assert.match(showcase, /کِم کیوسی/);
    assert.match(layout, /کِم کیوسی/);
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
