# -*- coding: utf-8 -*-
import re, os, glob, sys
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))

def refs(path):
    s = open(path, encoding='utf-8', errors='replace').read()
    s = re.sub(r'<!--.*?-->', ' ', s, flags=re.S)
    out = set()
    for m in re.finditer(r'''(?:href|src)\s*=\s*["']([^"']+)["']''', s):
        out.add(m.group(1))
    for m in re.finditer(r'''["']((?:[\w.-]+/)*[\w.-]+\.html(?:#[^"'\s]*)?)["']''', s):
        out.add(m.group(1))
    return out, s

def pane_keys(path):
    s = open(path, encoding='utf-8', errors='replace').read()
    return set(re.findall(r'data-pane="([^"]+)"', s)) or None

def check(base, files):
    bad = []
    keys_cache = {}
    for f in files:
        rs, _ = refs(f)
        for r in rs:
            if re.match(r'^(https?:|mailto:|data:|javascript:|tel:|//|#|\$|\{)', r) or '${' in r or '+' in r:
                continue
            page, _, frag = r.partition('#')
            page = page.split('?')[0]
            if not page:
                continue
            tgt = os.path.join(base, page)
            if not os.path.exists(tgt):
                bad.append((os.path.basename(f), r, 'missing file'))
                continue
            if frag and page.endswith('.html'):
                if tgt not in keys_cache:
                    keys_cache[tgt] = pane_keys(tgt)
                ks = keys_cache[tgt]
                if ks is not None and '/' in frag:
                    if frag.split('/')[0] not in ks:
                        bad.append((os.path.basename(f), r, 'unknown pane'))
                elif ks is not None and frag and not frag.startswith('tab-') and frag not in ks:
                    # could still be an element id on the page; only report if it is not an id either
                    t = open(tgt, encoding='utf-8', errors='replace').read()
                    if ('id="%s"' % frag) not in t:
                        bad.append((os.path.basename(f), r, 'unknown pane/id'))
    return bad

if __name__ == '__main__':
    bad = check(REPO, sorted(glob.glob(os.path.join(REPO, '*.html'))))
    bad = [b for b in bad if b[1].split('#')[0].endswith('.html') or '#' in b[1]]      # ignore JS string prefixes such as 'audio/xy__'
    print('broken html links / pane anchors:', len(bad))
    for a, b, c in bad[:60]:
        print('  %-34s %-60s %s' % (a, b[:60], c))
