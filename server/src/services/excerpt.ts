export const EXCERPT_LENGTH = 100;

export const excerpt = (text: string, length = EXCERPT_LENGTH) => {
    const chars = Array.from(text);

    return chars.length > length ? `${chars.slice(0, length).join('')}…` : text;
};
