import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const layoutJsx = readFileSync(new URL('../components/Layout.jsx', import.meta.url), 'utf8');

const rule = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
    assert.ok(match, `${selector} szabály hiányzik`);

    return Object.fromEntries(
        match[1]
            .split(';')
            .map((declaration) => declaration.split(':').map((part) => part.trim()))
            .filter(([property, value]) => property && value)
    );
};

test('a menü tetején a felirat a logo helyőrzőben van, a menüpontok előtt', () => {
    const logo = layoutJsx.match(/<div className="sidebar-logo">([\s\S]*?)<\/div>/);

    assert.ok(logo, 'a sidebar-logo hiányzik');
    assert.match(logo[1], /className="sidebar-title">Workflow teszt</);
    assert.ok(layoutJsx.indexOf('sidebar-logo') < layoutJsx.indexOf('<nav>'));
});

test('a logo helyőrző háttere eltér a menü hátterétől', () => {
    const logoBackground = rule('.sidebar-logo').background;

    assert.ok(logoBackground);
    assert.notEqual(logoBackground, rule('.sidebar').background);
    assert.notEqual(logoBackground, rule('.menu-item:hover').background);
});

test('a felirat a helyőrzőben vízszintesen és függőlegesen középen van', () => {
    const logo = rule('.sidebar-logo');

    assert.equal(logo.display, 'flex');
    assert.equal(logo['align-items'], 'center');
    assert.equal(logo['justify-content'], 'center');
    assert.equal(rule('.sidebar-title')['text-align'], 'center');
});

test('a helyőrzőnek van saját magassága, hogy később logo kerülhessen bele', () => {
    assert.ok(parseInt(rule('.sidebar-logo')['min-height'], 10) >= 48);
});
