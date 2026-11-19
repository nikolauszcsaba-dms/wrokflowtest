const startsWith = (buf: Buffer, bytes: number[], offset = 0) =>
    buf.length >= offset + bytes.length && bytes.every((byte, i) => buf[offset + i] === byte);

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

export const detectImageType = (buf: Buffer): string | null => {
    if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
        return 'image/png';
    }
    if (startsWith(buf, [0xff, 0xd8, 0xff])) {
        return 'image/jpeg';
    }
    if (startsWith(buf, ascii('GIF87a')) || startsWith(buf, ascii('GIF89a'))) {
        return 'image/gif';
    }
    if (startsWith(buf, ascii('RIFF')) && startsWith(buf, ascii('WEBP'), 8)) {
        return 'image/webp';
    }

    return null;
};
