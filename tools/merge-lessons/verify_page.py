# -*- coding: utf-8 -*-
"""Static checks for a (merged) page: duplicate ids, dangling anchors/files, JS syntax (node --check), inline handlers, id lookups, tab wiring."""
import re, os, sys, subprocess, tempfile, collections
from scan import parse, find_all, find_first

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))


def check(path, base=REPO, quiet=False):
    src = open(path, encoding='utf-8').read()
    root = parse(src)
    errs, warns = [], []
    ids = collections.Counter()
    for n in root.walk():
        i = n.attrs.get('id') if n.attrs else None
        if i:
            ids[i] += 1
    for i, c in ids.items():
        if c > 1:
            errs.append('duplicate id: %s x%d' % (i, c))
    idset = set(ids)
    # anchors / files
    for n in root.walk():
        if not n.attrs:
            continue
        for attr in ('href', 'src'):
            v = n.attrs.get(attr)
            if not v or re.match(r'^(https?:|mailto:|data:|javascript:|tel:|//)', v):
                continue
            if v.startswith('#'):
                t = v[1:]
                if t and t not in idset and not re.match(r'^[a-z0-9-]+(/|$)', t):
                    warns.append('anchor to missing id: %s' % v)
                continue
            f = v.split('#')[0].split('?')[0]
            if f and not os.path.exists(os.path.join(base, f)):
                errs.append('missing file: %s (%s)' % (v, n.tag))
    # scripts
    scripts = [(n.attrs, n.inner(src)) for n in find_all(root, 'script')]
    inline = [t for a, t in scripts if not a.get('src')]
    alljs = '\n'.join(inline)
    for k, t in enumerate(inline):
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as fh:
            fh.write(t)
            tmp = fh.name
        r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
        os.unlink(tmp)
        if r.returncode != 0:
            errs.append('JS syntax error in inline script #%d: %s' % (k, r.stderr.strip().split('\n')[-1][:160]))
    # handlers
    exported = set(re.findall(r'PN\.(\w+)\s*=', alljs))
    keys = set(re.findall(r'window\.PANE_(\w+)\s*=', alljs))
    defined = set(re.findall(r'function\s+([A-Za-z_$][\w$]*)', alljs)) | set(re.findall(r'(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=', alljs)) | {'openLessonAudio', 'closeLessonAudio', 'LessonSwitch'}
    for n in root.walk():
        for a, v in (n.attrs or {}).items():
            if a.startswith('on') and v:
                for m in re.finditer(r'(?<![\w$.])((?:PANE_\w+\.)?[A-Za-z_$][\w$]*)\s*\(', v):
                    nm = m.group(1)
                    if nm.startswith('PANE_'):
                        kk, fn = nm.split('.', 1)
                        if kk[5:] not in keys or fn not in exported:
                            errs.append('handler not exported: %s (in %s=%s)' % (nm, a, v[:60]))
                    elif nm not in defined and nm not in ('if', 'return', 'function', 'alert', 'confirm', 'prompt', 'event', 'this', 'parseInt', 'setTimeout'):
                        warns.append('handler calls undefined %s (in %s)' % (nm, v[:60]))
    # id lookups
    for m in re.finditer(r"getElementById\(\s*(['\"])([^'\"]+)\1\s*\)", alljs):
        if m.group(2) not in idset:
            warns.append('getElementById literal not in page: %s' % m.group(2))
    dyn = set(re.sub(r'\s+', ' ', m.group(1))[:70] for m in re.finditer(r"getElementById\(\s*([^'\")][^)]*|['\"][^'\"]*['\"]\s*\+[^)]*)\)", alljs))
    if dyn and not quiet:
        warns.append('dynamic getElementById (review): ' + ' | '.join(sorted(dyn))[:300])
    for m in re.finditer(r"ROOT\.querySelector(?:All)?\(\s*(['\"`])((?:(?!\1).)*)\1", alljs):
        sel = m.group(2)
        for tok in re.findall(r'#([A-Za-z_][\w-]*)', sel):
            if tok not in idset:
                warns.append('selector id not in page: #%s (%s)' % (tok, sel[:50]))
    # tabs wiring per pane / whole page
    for sec in find_all(root, 'section', 'lesson-pane') or [find_first(root, 'body')]:
        inner = sec
        btns = [b.attrs.get('data-tab') for b in find_all(inner, 'button') if b.has_class('tab') and b.attrs.get('data-tab') is not None]
        tcs = {t.attrs.get('id') for t in find_all(inner, 'div') if t.has_class('tab-content') and t.attrs.get('id')}
        for b in btns:
            if b not in tcs and ('tab-' + b) not in tcs:
                errs.append('tab button without content: data-tab=%s (%s)' % (b, sec.attrs.get('id', 'page')))
        for t in tcs:
            if t not in btns and t.replace('tab-', '', 1) not in btns:
                warns.append('tab content without button: %s (%s)' % (t, sec.attrs.get('id', 'page')))
    if not quiet:
        print('%s: %d errors, %d warnings; ids=%d inline scripts=%d' % (os.path.basename(path), len(errs), len(warns), len(idset), len(inline)))
        for e in errs:
            print('  ERROR  ', e)
        for w in warns[:40]:
            print('  warn   ', w)
    return errs, warns


if __name__ == '__main__':
    bad = 0
    for p in sys.argv[1:]:
        e, w = check(p)
        bad += len(e)
    sys.exit(1 if bad else 0)
