"""Read supplied SFNT metadata without installing tools or modifying fonts."""
import hashlib
import json
import struct
from pathlib import Path


def inspect(path):
    data = path.read_bytes()
    u16 = lambda offset: struct.unpack_from('>H', data, offset)[0]
    u32 = lambda offset: struct.unpack_from('>I', data, offset)[0]
    tables = {}
    for index in range(u16(4)):
        offset = 12 + index * 16
        tables[data[offset:offset + 4].decode('ascii')] = u32(offset + 8)
    names = {}
    start = tables['name']
    for index in range(u16(start + 2)):
        offset = start + 6 + index * 12
        platform, _, language, name, length, position = struct.unpack_from('>6H', data, offset)
        if name in (1, 2, 6, 13) and (platform == 0 or platform == 3 and language in (0, 1033)):
            raw = data[start + u16(start + 4) + position:][:length]
            names[str(name)] = raw.decode('utf-16-be' if platform in (0, 3) else 'latin1')
    axes = []
    if 'fvar' in tables:
        start = tables['fvar']
        for index in range(u16(start + 8)):
            offset = start + u16(start + 4) + index * u16(start + 10)
            axes.append({'tag': data[offset:offset + 4].decode('ascii'),
                         'range': [struct.unpack_from('>i', data, offset + n)[0] / 65536 for n in (4, 8, 12)]})
    features = set()
    for tag in ('GSUB', 'GPOS'):
        if tag not in tables:
            continue
        start = tables[tag] + u16(tables[tag] + 6)
        for index in range(u16(start)):
            offset = start + 2 + index * 6
            features.add(data[offset:offset + 4].decode('ascii'))
    glyphs = {}
    start = tables['cmap']
    for index in range(u16(start + 2)):
        offset = start + 4 + index * 8
        platform, encoding = struct.unpack_from('>HH', data, offset)
        if platform != 0 and not (platform == 3 and encoding in (1, 10)):
            continue
        sub = start + u32(offset + 4)
        if u16(sub) == 4:
            count = u16(sub + 6) // 2
            for segment in range(count):
                end = u16(sub + 14 + segment * 2)
                begin = u16(sub + 16 + count * 2 + segment * 2)
                delta = u16(sub + 16 + count * 4 + segment * 2)
                pos = sub + 16 + count * 6 + segment * 2
                shift = u16(pos)
                for point in range(begin, end + 1):
                    glyph = u16(pos + shift + (point - begin) * 2) if shift else point
                    glyph = (glyph + delta) % 65536 if glyph or not shift else 0
                    if glyph:
                        glyphs[point] = glyph
        elif u16(sub) == 12:
            for group in range(u32(sub + 12)):
                begin, end, glyph = struct.unpack_from('>III', data, sub + 16 + group * 12)
                glyphs.update((point, glyph + point - begin) for point in range(begin, end + 1))
    metrics = u16(tables['hhea'] + 34)
    advances = {str(digit): u16(tables['hmtx'] + min(glyphs[48 + digit], metrics - 1) * 4) for digit in range(10)}
    sample = '0123456789:.,+-−×÷=%±⌫/ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    return {'path': str(path), 'sha256': hashlib.sha256(data).hexdigest(), 'names': names,
            'weight': u16(tables['OS/2'] + 4), 'italic': bool(u16(tables['OS/2'] + 62) & 1) or struct.unpack_from('>i', data, tables['post'] + 4)[0] != 0,
            'axes': axes, 'features': sorted(features), 'digitAdvances': advances,
            'missingSampleGlyphs': ''.join(char for char in sample if ord(char) not in glyphs)}


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    records = [inspect(path) for path in sorted((root / 'assets/fonts').rglob('*'))
               if path.suffix in ('.otf', '.ttf') and '/WEB/' not in str(path)]
    for record in records:
        record['path'] = str(Path(record['path']).relative_to(root))
    output = root / 'assets/fonts/inventory.json'
    output.write_text(json.dumps(records, indent=2) + '\n')
    for record in records:
        print(record['path'], record['weight'], 'italic' if record['italic'] else 'upright',
              record['axes'], 'tnum' in record['features'], 'missing:', record['missingSampleGlyphs'])
