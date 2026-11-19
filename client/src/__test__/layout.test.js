import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

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

test('a fejléc görgetéskor az ablak tetején marad', () => {
    const topbar = rule('.topbar');

    assert.equal(topbar.position, 'sticky');
    assert.equal(topbar.top, '0');
});

test('a fejléc lenyíló menüje a tartalom fölött jelenik meg', () => {
    const topbar = rule('.topbar');

    assert.ok(Number(topbar['z-index']) > 0);
});

test('a bal oldali menü görgetéskor a helyén marad', () => {
    const sidebar = rule('.sidebar');

    assert.equal(sidebar.position, 'sticky');
    assert.equal(sidebar.top, '0');
    assert.equal(sidebar.height, '100vh');
    assert.equal(sidebar['align-self'], 'flex-start');
});

test('a túl magas bal oldali menü magában görgethető', () => {
    assert.equal(rule('.sidebar')['overflow-y'], 'auto');
});

test('a tartalom a böngésző görgetősávjával görög, nem egy belső dobozban', () => {
    for (const selector of ['.layout', '.main', '.content']) {
        const declarations = rule(selector);

        assert.equal(declarations.overflow, undefined, `${selector} overflow`);
        assert.equal(declarations['overflow-y'], undefined, `${selector} overflow-y`);
        assert.notEqual(declarations.height, '100vh', `${selector} height`);
    }
});
