import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

const rules = [...css.matchAll(/(?:^|\n)([^{}\n][^{}]*?)\s*\{([^}]*)\}/g)].map(([, selector, body]) => ({
    selectors: selector.split(',').map((part) => part.trim()),
    declarations: Object.fromEntries(
        body
            .split(';')
            .map((declaration) => declaration.split(':').map((part) => part.trim()))
            .filter(([property, value]) => property && value)
    ),
}));

const rule = (selector) => {
    const found = rules.filter((candidate) => candidate.selectors.includes(selector));
    assert.ok(found.length, `${selector} szabály hiányzik`);
    return Object.assign({}, ...found.map(({ declarations }) => declarations));
};

const menuBlue = '#2563eb';

test('a menüpontnak alapból nincs háttere', () => {
    assert.equal(rule('.menu-item').background, 'transparent');
    assert.equal(rule('.menu-item').color, '#e4e7eb');
});

test('egérrel fölé víve a menüpont a kék hátteret kapja fehér felirattal', () => {
    const hover = rule('.menu-item:hover');

    assert.equal(hover.background, menuBlue);
    assert.equal(hover.color, '#fff');
});

test('az aktív menüpont ugyanazt a hátteret és feliratszínt kapja, mint a hover', () => {
    const active = rule('.menu-item.active');
    const hover = rule('.menu-item:hover');

    assert.equal(active.background, menuBlue);
    assert.equal(active.background, hover.background);
    assert.equal(active.color, hover.color);
});

test('az aktív menüpont felirata vastagabb marad', () => {
    assert.equal(rule('.menu-item.active')['font-weight'], '600');
});

test('a kék háttér csak az aktív és a hover állapotban szerepel a menüpontoknál', () => {
    const blueMenuSelectors = rules
        .filter(({ declarations }) => [declarations.background, declarations['background-color']].includes(menuBlue))
        .flatMap(({ selectors }) => selectors)
        .filter((selector) => selector.includes('.menu-item'))
        .sort();

    assert.deepEqual(blueMenuSelectors, ['.menu-item.active', '.menu-item:hover']);
});
