const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function element() {
    const classes = new Set();
    const handlers = {};
    return {
        style: {},
        classList: {
            add: (...names) => names.forEach(name => classes.add(name)),
            remove: (...names) => names.forEach(name => classes.delete(name)),
            contains: name => classes.has(name),
            toggle: name => classes.has(name) ? classes.delete(name) : classes.add(name),
        },
        contains(target) { return target === this; },
        addEventListener(name, handler) { handlers[name] = handler; },
        click() { handlers.click.call(this); },
    };
}

function loadPage() {
    const windowHandlers = {};
    const documentHandlers = {};
    const button = element();
    const drawer = element();
    const theme = element();
    const language = element();
    const faq = element();
    const closedFaq = element();
    const content = { style: {}, scrollHeight: 310 };
    const closedContent = { style: {}, scrollHeight: 250 };
    faq.nextElementSibling = content;
    closedFaq.nextElementSibling = closedContent;
    button.classList.add('bi-list');
    const ids = { 'collapse-btn': button, 'collapsed-header-items': drawer, 'theme-toggle': theme, 'language-toggle': language };
    const document = {
        getElementById: id => ids[id],
        querySelectorAll: selector => selector === '.faq-accordion' ? [faq, closedFaq] : [],
        addEventListener: (name, handler) => { documentHandlers[name] = handler; },
    };
    const window = {
        innerWidth: 1023,
        addEventListener: (name, handler) => { windowHandlers[name] = handler; },
        removeEventListener: (name, handler) => {
            if (windowHandlers[name] === handler) delete windowHandlers[name];
        },
    };
    const gsap = { registerPlugin() {}, to() {}, utils: { toArray: () => [] } };
    const context = vm.createContext({ document, window, gsap, ScrollTrigger: {} });
    vm.runInContext(readFileSync('public/index.js', 'utf8'), context);
    return { window, windowHandlers, documentHandlers, button, drawer, theme, language, faq, content, closedContent, toggleHeader: () => vm.runInContext('toggleHeader()', context) };
}

test('open FAQ height follows language changes and viewport resize', () => {
    const page = loadPage();
    page.faq.click();
    assert.equal(page.content.style.maxHeight, '310px');
    page.content.scrollHeight = 440;
    page.documentHandlers.languagechange();
    assert.equal(page.content.style.maxHeight, '440px');
    page.content.scrollHeight = 210;
    page.windowHandlers.resize();
    assert.equal(page.content.style.maxHeight, '210px');
    assert.equal(page.closedContent.style.maxHeight, undefined);
    page.faq.click();
    assert.equal(page.content.style.maxHeight, '0px');
    page.documentHandlers.languagechange();
    assert.equal(page.content.style.maxHeight, '0px');
});

test('drawer normalizes at 1024px and opens cleanly when returning to mobile', () => {
    const page = loadPage();
    page.toggleHeader();
    assert.equal(page.drawer.style.width, '60vw');
    assert.equal(page.drawer.classList.contains('opacity-100'), true);
    assert.equal(page.button.classList.contains('bi-x'), true);
    page.windowHandlers.click({ target: page.language });
    page.windowHandlers.click({ target: page.theme });
    assert.equal(page.drawer.style.width, '60vw');
    page.window.innerWidth = 1024;
    page.windowHandlers.resize();
    assert.equal(page.drawer.style.width, '');
    assert.equal(page.drawer.classList.contains('opacity-100'), false);
    assert.equal(page.button.classList.contains('bi-x'), false);
    assert.equal(page.button.classList.contains('max-lg:tw-fixed'), false);
    assert.equal(page.button.classList.contains('bi-list'), true);
    assert.equal(page.windowHandlers.click, undefined);
    page.window.innerWidth = 1023;
    page.windowHandlers.resize();
    page.toggleHeader();
    assert.equal(page.drawer.style.width, '60vw');
    page.windowHandlers.click({ target: {} });
    assert.equal(page.drawer.style.width, '0vw');
    assert.equal(page.windowHandlers.click, undefined);
});
