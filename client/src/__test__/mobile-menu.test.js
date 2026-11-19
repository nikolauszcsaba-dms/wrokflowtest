import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const layoutJsx = readFileSync(new URL('../components/Layout.jsx', import.meta.url), 'utf8');

const block = (source, header) => {
    const start = source.indexOf(header);
    assert.notEqual(start, -1, `${header} hiányzik`);

    const open = source.indexOf('{', start);
    let depth = 0;
    for (let i = open; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        if (source[i] === '}') depth -= 1;
        if (depth === 0) return source.slice(open + 1, i);
    }
    assert.fail(`${header} nincs lezárva`);
};

const mobileCss = block(css, '@media (max-width: 768px)');

const rule = (source, selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = source.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`));
    assert.ok(match, `${selector} szabály hiányzik`);

    return Object.fromEntries(
        match[1]
            .split(';')
            .map((declaration) => {
                const index = declaration.indexOf(':');
                return [declaration.slice(0, index).trim(), declaration.slice(index + 1).trim()];
            })
            .filter(([property, value]) => property && value)
    );
};

const toggleButton = () => {
    const match = layoutJsx.match(/<button[^>]*className="menu-toggle"[\s\S]*?<\/button>/);
    assert.ok(match, 'a menü ikon gombja hiányzik');
    return match[0];
};

test('széles képernyőn a menü ikon nem látszik, a menü a bal oldalon marad', () => {
    assert.equal(rule(css, '.menu-toggle').display, 'none');
    assert.equal(rule(css, '.sidebar').position, 'sticky');
    assert.equal(rule(css, '.sidebar-backdrop').display, 'none');
});

test('mobilon a menü ikon megjelenik a fejlécben', () => {
    assert.equal(rule(mobileCss, '.menu-toggle').display, 'inline-flex');

    const header = layoutJsx.match(/<header className="topbar">([\s\S]*?)<\/header>/);
    assert.ok(header, 'a fejléc hiányzik');
    assert.match(header[1], /className="menu-toggle"/);
    assert.ok(header[1].indexOf('menu-toggle') < header[1].indexOf('<UserMenu'));
});

test('mobilon a menü alapból balra, a képernyőn kívül, rejtve van', () => {
    const sidebar = rule(mobileCss, '.sidebar');

    assert.equal(sidebar.position, 'fixed');
    assert.equal(sidebar.left, '0');
    assert.equal(sidebar.transform, 'translateX(-100%)');
    assert.equal(sidebar.visibility, 'hidden');
    assert.match(sidebar.transition, /transform/);
});

test('mobilon nyitott állapotban a menü balról becsúszik a tartalom fölé', () => {
    const open = rule(mobileCss, '.sidebar.sidebar-open');

    assert.equal(open.transform, 'translateX(0)');
    assert.equal(open.visibility, 'visible');
    assert.ok(Number(rule(mobileCss, '.sidebar')['z-index']) > Number(rule(css, '.topbar')['z-index']));
    assert.ok(Number(rule(mobileCss, '.sidebar-backdrop')['z-index']) > Number(rule(css, '.topbar')['z-index']));
});

test('az ikonra kattintás nyitja és zárja a menüt', () => {
    const button = toggleButton();

    assert.match(button, /onClick=\{\(\) => setMenuOpen\(\(value\) => !value\)\}/);
    assert.match(button, /aria-expanded=\{menuOpen\}/);
    assert.match(button, /aria-controls="sidebar"/);
    assert.match(button, /aria-label="Menü"/);
    assert.match(layoutJsx, /<aside id="sidebar" className=\{menuOpen \? 'sidebar sidebar-open' : 'sidebar'\}>/);
});

test('menüpontra kattintva a menü eltűnik', () => {
    const links = layoutJsx.match(/<NavLink[^>]*>/g);

    assert.ok(links?.length, 'nincs menüpont');
    for (const link of links) {
        assert.match(link, /onClick=\{closeMenu\}/, link);
    }
    assert.match(layoutJsx, /const closeMenu = \(\) => setMenuOpen\(false\);/);
});

test('a menün kívülre kattintva vagy Escape-re is bezáródik', () => {
    assert.match(layoutJsx, /<div className="sidebar-backdrop"[^>]*onClick=\{closeMenu\}/);
    assert.match(layoutJsx, /event\.key === 'Escape'[\s\S]*?setMenuOpen\(false\)/);
});
