"""Build the installable extension, excluding source-only reports and test fixtures."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
RUNTIME = ['manifest.json', 'background.js', 'content.js', 'popup.html', 'popup.css', 'popup.js']


def build():
    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    names = RUNTIME + sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / 'lib').glob('*.js')) + ['data/seed.json']
    required = [manifest['background']['service_worker'], manifest['action']['default_popup']]
    for script in manifest['content_scripts']:
        required.extend(script.get('js', []) + script.get('css', []))
    for resource in manifest['web_accessible_resources']:
        required.extend(resource['resources'])
    assert set(required) <= set(names), 'Manifest references an unpackaged runtime file'
    contents = {name: (ROOT / name).read_bytes() for name in names}
    contents['README.md'] = (ROOT / 'docs/usage.md').read_bytes()
    DIST.mkdir(exist_ok=True)
    archive = DIST / 'myenglishlab-solver.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in sorted(contents.items()):
            # Stable timestamps and permissions make identical sources reproducible.
            info = zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            z.writestr(info, data)
    with zipfile.ZipFile(archive) as z:
        assert set(z.namelist()) == set(contents)
        assert z.testzip() is None
        for name, data in contents.items():
            assert z.read(name) == data, name
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (DIST / 'SHA256SUMS.txt').write_text(f'{digest}  {archive.name}\n', encoding='ascii')
    print(f"Release {manifest['version']}: {archive.name}, {len(contents)} files, {archive.stat().st_size} bytes")
    print(f'SHA-256: {digest}')
    return archive


if __name__ == '__main__':
    build()
