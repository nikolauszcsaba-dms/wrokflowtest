import { detectImageType } from '../image-type';

it('detects PNG', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    expect(detectImageType(buf)).toEqual('image/png');
});

it('detects JPEG', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toEqual('image/jpeg');
});

it('detects GIF', () => {
    expect(detectImageType(Buffer.from('GIF89a...'))).toEqual('image/gif');
    expect(detectImageType(Buffer.from('GIF87a...'))).toEqual('image/gif');
});

it('detects WebP', () => {
    expect(detectImageType(Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ', 'latin1'))).toEqual('image/webp');
});

it('returns null for other content', () => {
    expect(detectImageType(Buffer.from('<svg></svg>'))).toBeNull();
    expect(detectImageType(Buffer.from('RIFF\x00\x00\x00\x00WAVE', 'latin1'))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
});
