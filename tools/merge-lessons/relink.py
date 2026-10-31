# -*- coding: utf-8 -*-
"""Point every link that targeted a merged-away page to the merged page (+ #pane). Dry run by default, --write to apply."""
import re, os, sys, glob
import specs

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
MAP = {}
for sp in specs.SPECS.values():
    for m in sp['members']:
        if m['src'] != sp['out']:
            MAP[m['src']] = (sp['out'], m['key'])
OLD = sorted(MAP, key=len, reverse=True)
pat = re.compile(r'(?<![\w-])(%s)(#[^"\'\s)<>]*)?' % '|'.join(re.escape(o) for o in OLD))


def fix(m):
    old, frag = m.group(1), m.group(2)
    new, key = MAP[old]
    if frag and frag.startswith('#tab-'):
        return '%s#%s/%s' % (new, key, frag[5:])
    return '%s#%s' % (new, key)


if __name__ == '__main__':
    write = '--write' in sys.argv
    total = 0
    for f in sorted(glob.glob(os.path.join(REPO, '*.html'))):
        base = os.path.basename(f)
        if base in MAP:
            continue                       # to be deleted
        s = open(f, encoding='utf-8').read()
        n = len(pat.findall(s))
        if n:
            total += n
            print('%-40s %3d links' % (base, n))
            if write:
                open(f, 'w', encoding='utf-8').write(pat.sub(fix, s))
    print('total links rewritten:' if write else 'total links to rewrite:', total, '| old pages mapped:', len(MAP))
