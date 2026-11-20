import { EXCERPT_LENGTH, excerpt } from '../excerpt';

it('returns a short text unchanged', () => {
    expect(excerpt('Rövid szöveg')).toEqual('Rövid szöveg');
});

it('returns a text of exactly the limit unchanged', () => {
    const text = 'a'.repeat(EXCERPT_LENGTH);

    expect(excerpt(text)).toEqual(text);
});

it('cuts a longer text to the first 100 characters and marks the cut', () => {
    const text = `${'b'.repeat(EXCERPT_LENGTH)}VÉGE`;

    expect(excerpt(text)).toEqual(`${'b'.repeat(EXCERPT_LENGTH)}…`);
});

it('counts characters, not UTF-16 code units', () => {
    const text = '😀'.repeat(EXCERPT_LENGTH + 1);

    expect(Array.from(excerpt(text))).toHaveLength(EXCERPT_LENGTH + 1);
    expect(excerpt(text).startsWith('😀'.repeat(EXCERPT_LENGTH))).toBe(true);
});
