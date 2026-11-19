import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const profileJsx = readFileSync(new URL('../pages/Profile.jsx', import.meta.url), 'utf8');

const NARROW_QUERY = '@media (max-width: 960px)';

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const mediaBlock = (query) => {
    const match = css.match(new RegExp(`(?:^|\\n)${escape(query)}\\s*\\{([\\s\\S]*?)\\n\\}`));
    assert.ok(match, `${query} blokk hiányzik`);

    return match[1];
};

const rule = (selector, source = css) => {
    const match = source.match(new RegExp(`(?:^|\\n)\\s*${escape(selector)}\\s*\\{([^}]*)\\}`));
    assert.ok(match, `${selector} szabály hiányzik`);

    return Object.fromEntries(
        match[1]
            .split(';')
            .map((declaration) => declaration.split(':').map((part) => part.trim()))
            .filter(([property, value]) => property && value)
    );
};

const areas = (declarations) =>
    declarations['grid-template-areas']
        .match(/"[^"]*"/g)
        .map((row) => row.slice(1, -1).trim().split(/\s+/));

test('széles képernyőn balra egymás alatt az Adatok és a Jelszó, mellettük a Profilkép', () => {
    const profile = rule('.profile');

    assert.equal(profile.display, 'grid');
    assert.deepEqual(areas(profile), [
        ['data', 'avatar'],
        ['password', 'avatar'],
    ]);
});

test('a dobozok a nekik szánt helyre kerülnek', () => {
    assert.equal(rule('.profile-data')['grid-area'], 'data');
    assert.equal(rule('.profile-password')['grid-area'], 'password');
    assert.equal(rule('.profile-avatar')['grid-area'], 'avatar');
});

test('keskeny képernyőn egymás alá kerülnek, a Profilkép legalul', () => {
    const profile = rule('.profile', mediaBlock(NARROW_QUERY));

    assert.equal(profile['grid-template-columns'], 'minmax(0, 1fr)');
    assert.deepEqual(areas(profile), [['data'], ['password'], ['avatar']]);
});

test('a dobozok a profil oldalon a megfelelő osztályt kapják', () => {
    assert.match(profileJsx, /<section className="[^"]*\bprofile-data\b[^"]*">\s*<h2>Adatok<\/h2>/);
    assert.match(profileJsx, /<form className="[^"]*\bprofile-password\b[^"]*"[^>]*>\s*<h2>Jelszó módosítása<\/h2>/);
    assert.match(profileJsx, /<form className="[^"]*\bprofile-avatar\b[^"]*"[^>]*>\s*<h2>Profilkép<\/h2>/);
});

test('a billentyűzetes sorrend is Adatok, Jelszó, Profilkép', () => {
    const page = profileJsx.slice(profileJsx.indexOf('const Profile = '));
    const order = ['profile-data', '<PasswordForm />', '<AvatarForm />'].map((marker) => page.indexOf(marker));

    assert.ok(order.every((index) => index >= 0), 'hiányzik egy doboz a profil oldalról');
    assert.deepEqual([...order].sort((a, b) => a - b), order);
});
