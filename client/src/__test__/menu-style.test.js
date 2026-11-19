import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

const rules = [...css.matchAll(/(?:^|\n)([^{}\n][^{}]*?)\s*\{([^}]*)\}/g)].map(([, selector, body]) => ({
    selector: selector.trim(),
    declarations: Object.fromEntries(
        body
            .split(';')
            .map((declaration) => declaration.split(':').map((part) => part.trim()))
            .filter(([property, value]) => property && value)
    ),
}));

const rule = (selector) => {
    const found = rules.find((candidate) => candidate.selector === selector);
    assert.ok(found, `${selector} szabály hiányzik`);
    return found.declarations;
};

const menuBlue = '#2563eb';

test('a menüpontnak alapból nincs háttere', () => {
    assert.equal(rule('.menu-item').background, 'transparent');
});

test('az aktív menüpontnak sincs háttere, de felismerhető marad', () => {
    const active = rule('.menu-item.active');

    assert.equal(active.background, undefined);
    assert.equal(active['background-color'], undefined);
    assert.equal(active.color, '#fff');
});

test('egérrel fölé víve a menüpont a kék hátteret kapja fehér felirattal', () => {
    const hover = rule('.menu-item:hover');

    assert.equal(hover.background, menuBlue);
    assert.equal(hover.color, '#fff');
});

test('a hover szabály az aktív szabály után áll, így az aktív menüpont is kék lesz hoverre', () => {
    const order = rules.map((candidate) => candidate.selector);

    assert.ok(order.indexOf('.menu-item:hover') > order.indexOf('.menu-item.active'));
});

test('a kék háttér csak a hover szabályban szerepel a menüpontoknál', () => {
    const blueMenuRules = rules
        .filter(({ selector }) => selector.includes('.menu-item'))
        .filter(({ declarations }) => [declarations.background, declarations['background-color']].includes(menuBlue))
        .map(({ selector }) => selector);

    assert.deepEqual(blueMenuRules, ['.menu-item:hover']);
});
