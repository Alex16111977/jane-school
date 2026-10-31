# -*- coding: utf-8 -*-
"""
Merge several lesson pages of the NeoStudy site into ONE page with a lesson switcher.
Every source page becomes a <section class="lesson-pane" id="pane-KEY">; its ids, inline handlers, scripts and CSS are namespaced
so that several lessons can live in one document:
  * ids                 -> KEY-id   ("tab-x" -> "tab-KEY-x", so 'tab-' + dataset.tab keeps working)
  * <style> rules       -> scoped with  #pane-KEY
  * inline <script>     -> wrapped in an IIFE; document.querySelector(All) -> ROOT.querySelector(All) (ROOT = the pane);
                           functions used by inline onclick="" are exported as PANE_KEY.fn and called that way
  * lesson audio        -> cues file loaded on demand by LessonSwitch.openAudio(slug)
The host page (first member unless told otherwise) supplies head / navbar / background / footer.
"""
import re, os, html as htmlmod, json
from scan import parse, find_all, find_first, cut

# where the SOURCE pages are read from: the working tree by default; set MERGE_SRC to a folder with pristine copies
# (e.g. `git show HEAD:page.html` dumped per page) when a host page is overwritten by its own merge and the merge is re-run
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SITE = os.environ.get('MERGE_SRC', REPO)
JS_KEYWORDS = set('if for while switch return typeof function new delete void catch with else do in of instanceof alert confirm prompt parseInt parseFloat setTimeout setInterval Math Number String Array Object JSON Date isNaN event this'.split())
SHARED_SCRIPTS = ('nav-dropdown.js', 'hash-nav.js', 'lesson-audio-player.js')


def read(path):
    return open(os.path.join(SITE, path), encoding='utf-8').read()


# ------------------------------------------------------------------ extraction
def extract(path):
    src = read(path)
    root = parse(src)
    htmln = find_first(root, 'html')
    head = find_first(root, 'head')
    body = find_first(root, 'body')
    d = dict(path=path, src=src)
    t = find_first(head, 'title')
    d['title'] = htmlmod.unescape(t.inner(src)).strip() if t else path
    d['head_inner'] = head.inner(src)
    d['html_attrs'] = htmln.attrs if htmln else {}
    d['body_attrs'] = body.attrs
    d['styles'] = [n.inner(src) for n in find_all(head, 'style')]
    d['links'] = [n.attrs.get('href', '') for n in find_all(head, 'link') if n.attrs.get('rel') == 'stylesheet']
    pc = find_first(body, 'div', 'page-content')
    assert pc is not None, path + ': no .page-content'
    d['pc'] = pc
    d['pc_attrs'] = ' '.join('%s="%s"' % (k, htmlmod.escape(v, quote=True)) for k, v in pc.attrs.items())
    spans, scripts_inline, scripts_src = [], [], []
    d['breadcrumbs'] = d['backlink'] = d['series'] = None
    for c in pc.children:
        if c.tag == 'nav' and c.has_class('breadcrumbs'):
            d['breadcrumbs'] = c.outer(src); spans.append((c.start, c.end))
        elif c.tag == 'a' and d['backlink'] is None and (c.has_class('back-link') or '&#8592;' in c.outer(src) or '←' in c.outer(src) or 'Zur' in c.outer(src)):
            d['backlink'] = c.outer(src); spans.append((c.start, c.end))
        elif c.tag == 'div' and c.has_class('series'):
            spans.append((c.start, c.end))
    for n in find_all(body, 'script'):
        a = n.attrs
        inside = pc.start <= n.start < pc.end
        if a.get('src'):
            scripts_src.append(a['src'])
        else:
            scripts_inline.append(n.inner(src))
        if inside:
            spans.append((n.start, n.end))
    # styles inside body
    for n in find_all(body, 'style'):
        d['styles'].append(n.inner(src))
        if pc.start <= n.start < pc.end:
            spans.append((n.start, n.end))
    # pane html: page-content inner minus cut spans (shifted)
    inner_start = pc.open_end
    inner = src[pc.open_end:pc.close_start]
    shifted = [(max(s, inner_start) - inner_start, min(e, pc.close_start) - inner_start) for s, e in spans]
    d['pane_html'] = cut(inner, shifted).strip()
    d['scripts_inline'] = scripts_inline
    d['scripts_src'] = scripts_src
    dock = find_first(body, 'div', 'lsa-dock')
    d['dock'] = dock.outer(src) if dock else None
    d['has_audio'] = bool(re.search(r'openLessonAudio\s*\(', d['pane_html']))
    m = re.search(r'audio/lesson-([a-z0-9\-]+)-cues\.js', ' '.join(scripts_src))
    d['audio_slug'] = m.group(1) if m else None
    d['bg'] = None
    for c in body.children:
        if c.tag == 'div' and 'position:fixed' in (c.attrs.get('style') or '').replace(' ', ''):
            d['bg'] = c.outer(src)
            break
    nav = [c for c in body.children if c.tag == 'nav' and c.has_class('navbar')]
    d['navbar'] = nav[0].outer(src) if nav else None
    foot = [c for c in body.children if c.tag == 'footer']
    d['footer'] = foot[0].outer(src) if foot else None
    h1 = find_first(pc, 'h1')
    d['h1'] = re.sub(r'\s+', ' ', htmlmod.unescape(re.sub(r'<[^>]+>', '', h1.inner(src)))).strip() if h1 else d['title']
    return d


# ------------------------------------------------------------------ id renaming
def ren(key, i):
    if i.startswith('tab-'):
        return 'tab-%s-%s' % (key, i[4:])
    return '%s-%s' % (key, i)


def collect_ids(pane_html, scripts):
    ids = set(re.findall(r'\bid="([^"]+)"', pane_html))
    for js in scripts:
        for m in re.finditer(r'\bid=\\?["\']([A-Za-z_][\w-]*)', js):
            ids.add(m.group(1))
    ids -= {''}
    return ids


def rename_markup(pane_html, key, ids):
    idset = set(ids)

    def tag_fix(m):
        tag = m.group(0)

        def attr_fix(am):
            name, q, val = am.group(1), am.group(2), am.group(3)
            lname = name.lower()
            if lname in ('id', 'for', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'data-target', 'data-panel', 'data-pane', 'list'):
                vals = val.split()
                if all(v in idset for v in vals):
                    return '%s=%s%s%s' % (name, q, ' '.join(ren(key, v) for v in vals), q)
            elif lname == 'href' and val.startswith('#') and val[1:] in idset:
                return '%s=%s#%s%s' % (name, q, ren(key, val[1:]), q)
            elif lname == 'data-tab':
                if val in idset:                         # english convention: data-tab == id
                    return '%s=%s%s%s' % (name, q, ren(key, val), q)
                if ('tab-' + val) in idset:              # german convention: id == 'tab-' + data-tab
                    return '%s=%s%s-%s%s' % (name, q, key, val, q)
            return am.group(0)
        return re.sub(r'([A-Za-z_:][\w:.-]*)=(["\'])(.*?)\2', attr_fix, tag, flags=re.S)
    return re.sub(r'<[A-Za-z][^<>]*>', tag_fix, pane_html)


def rewrite_handlers(pane_html, key, ids, exports):
    """inline on*="..." : rename id literals; qualify exported functions with PANE_KEY."""
    idset = set(ids)

    def handler(m):
        pre, q, body = m.group(1), m.group(2), m.group(3)

        def lit(sm):
            s = sm.group(2)
            return sm.group(1) + (ren(key, s) if s in idset else s) + sm.group(3)
        body2 = re.sub(r"(['])([^'\\]*)(['])", lit, body)
        bare = re.fullmatch(r'\s*([A-Za-z_$][\w$]*)\s*;?\s*', body2)
        if bare and bare.group(1) in exports:
            return pre + q + 'PANE_%s.%s()' % (key, bare.group(1)) + q
        for name in exports:
            body2 = re.sub(r'(?<![\w$.])%s\s*\(' % re.escape(name), 'PANE_%s.%s(' % (key, name), body2)
        return pre + q + body2 + q
    return re.sub(r'(\bon[a-z]+\s*=\s*)(["\'])(.*?)\2', handler, pane_html, flags=re.S)


def handler_function_names(pane_html):
    names = set()
    for m in re.finditer(r'\bon[a-z]+\s*=\s*(["\'])(.*?)\1', pane_html, flags=re.S):
        bare = re.fullmatch(r'\s*([A-Za-z_$][\w$]*)\s*;?\s*', m.group(2))      # onclick="checkEx" (typo: no call) -> treated as checkEx()
        if bare and bare.group(1) not in JS_KEYWORDS:
            names.add(bare.group(1))
        for nm in re.finditer(r'(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(', m.group(2)):
            if nm.group(1) not in JS_KEYWORDS:
                names.add(nm.group(1))
    return names


# ------------------------------------------------------------------ script rewriting
def rewrite_script(js, key, ids, exports):
    idset = set(ids)
    seps = ('-', '_')
    prefixes = set()
    for i in idset:
        for p in range(1, len(i)):
            if i[p - 1] in seps:
                prefixes.add(i[:p])
    prefixes.discard('tab-')                  # 'tab-' + data-tab stays: data-tab values carry the key already

    def r(v):
        if v in idset:
            return ren(key, v)
        if v in prefixes:
            return key + '-' + v
        return v

    def gid(m):
        return m.group(1) + m.group(2) + r(m.group(3)) + m.group(2)
    # getElementById('x') and getElementById('prefix-' + n)
    js = re.sub(r'(getElementById\(\s*)([\'"])([^\'"]+)\2', gid, js)
    js = re.sub(r'(getElementById\(\s*`)([A-Za-z_][\w-]*)(?=\$\{)', lambda m: m.group(1) + r(m.group(2)), js)

    def sel(m):
        sel_s = re.sub(r'#([A-Za-z_][\w-]*)', lambda mm: '#' + r(mm.group(1)), m.group(3))
        return m.group(1) + m.group(2) + sel_s + m.group(2)
    js = re.sub(r'((?:querySelector|querySelectorAll|closest|matches)\(\s*)([\'"`])((?:(?!\2).)*)\2', sel, js)
    # ids written into generated markup:  id="x-" + n   /  id=\"x\"
    js = re.sub(r'(\bid=\\?["\'])([A-Za-z_][\w-]*)', lambda m: m.group(1) + r(m.group(2)), js)
    js = re.sub(r'\bdocument\.(querySelectorAll|querySelector)\b', r'ROOT.\1', js)
    for n in exports:      # handlers inside generated markup: onclick="pick(..)" -> onclick="PANE_key.pick(..)"
        js = re.sub(r'''(\bon[a-z]+\s*=\s*\\?["']\s*)%s(\s*\()''' % re.escape(n), r'\1PANE_%s.%s\2' % (key, n), js)
    exp_lines = []
    for n in sorted(exports):
        if re.search(r'function\s+%s\b|\b(?:var|let|const)\s+%s\b|\b%s\s*=' % (n, n, n), js):
            exp_lines.append("  if (typeof %s === 'function') PN.%s = %s;" % (n, n, n))
    return ('(function () {\n  var ROOT = document.getElementById(\'pane-%s\');\n%s\n  var PN = window.PANE_%s = window.PANE_%s || {};\n%s\n})();'
            % (key, js, key, key, '\n'.join(exp_lines)))


# ------------------------------------------------------------------ css scoping
def _blocks(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        k = css.find(';', i)
        if j < 0:
            break
        if 0 <= k < j:                      # at-rule without block (@import ...)
            out.append((css[i:k].strip(), None))
            i = k + 1
            continue
        depth, p = 1, j + 1
        while p < n and depth:
            if css[p] == '{': depth += 1
            elif css[p] == '}': depth -= 1
            p += 1
        out.append((css[i:j].strip(), css[j + 1:p - 1]))
        i = p
    return out


def _split_selectors(sel):
    parts, depth, cur = [], 0, ''
    for ch in sel:
        if ch in '([': depth += 1
        elif ch in ')]': depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur); cur = ''
        else:
            cur += ch
    parts.append(cur)
    return [p.strip() for p in parts if p.strip()]


def scope_css(css, scope, keyframes_suffix, id_re_map):
    out = []
    for prelude, body in _blocks(css):
        if body is None:
            out.append(prelude + ';')
            continue
        if prelude.startswith('@media') or prelude.startswith('@supports') or prelude.startswith('@container'):
            out.append('%s { %s }' % (prelude, scope_css(body, scope, keyframes_suffix, id_re_map)))
        elif prelude.startswith('@keyframes') or prelude.startswith('@-webkit-keyframes'):
            name = prelude.split()[-1]
            out.append('%s { %s }' % (prelude.replace(name, name + keyframes_suffix), body))
        elif prelude.startswith('@'):
            out.append('%s { %s }' % (prelude, body))
        else:
            sels = []
            for s in _split_selectors(prelude):
                s = id_re_map(s)
                m = re.match(r'^(html|body|:root)(?=$|[\s.:#\[>+~])', s)
                if m:
                    s = scope + s[len(m.group(1)):]
                elif s.startswith('*') or s.startswith('::'):
                    s = scope + ' ' + s
                else:
                    s = scope + ' ' + s
                sels.append(s)
            out.append('%s { %s }' % (', '.join(sels), body.strip()))
    return '\n'.join(out)


def keyframe_names(css):
    return set(re.findall(r'@(?:-webkit-)?keyframes\s+([\w-]+)', css))


# ------------------------------------------------------------------ build
def build_member(spec, host_path, taken_ids):
    d = extract(spec['src'])
    key = spec['key']
    if spec.get('post'):
        d['pane_html'] = spec['post'](d['pane_html'])
    mode = spec.get('rename', 'collide')            # 'collide' (default) | 'all' | 'none'
    d['key'] = key
    d['label'] = spec.get('label', d['h1'])
    scripts = d['scripts_inline']
    ids_all = collect_ids(d['pane_html'], scripts)
    ids = ids_all & taken_ids if mode == 'collide' else (ids_all if mode == 'all' else set())
    taken_ids |= {ren(key, i) if i in ids else i for i in ids_all}
    prefix = bool(ids)
    pane = d['pane_html']
    css_all = '\n'.join(d['styles'])
    kfs = keyframe_names(css_all)
    if prefix:
        pane = rename_markup(pane, key, ids)
    hnames = handler_function_names(d['pane_html'])
    js_text = '\n'.join(scripts)
    exports = {n for n in hnames if re.search(r'function\s+%s\b|\b(?:var|let|const)\s+%s\b|\b%s\s*=' % (re.escape(n), re.escape(n), re.escape(n)), js_text)
               and n not in ('openLessonAudio', 'closeLessonAudio')}
    gen = set(re.findall(r'''on[a-z]+\s*=\s*\\?["']\s*([A-Za-z_$][\w$]*)\s*\(''', js_text))      # handlers written by the script itself (innerHTML templates)
    gen = {n for n in gen if n not in JS_KEYWORDS and re.search(r'function\s+%s\b|\b(?:var|let|const)\s+%s\b|\b%s\s*=' % (re.escape(n), re.escape(n), re.escape(n)), js_text)}
    exports |= gen
    pane = rewrite_handlers(pane, key, ids, exports)
    if d['has_audio'] and d['audio_slug']:
        pane = re.sub(r'openLessonAudio\s*\(\s*\)', "LessonSwitch.openAudio('%s')" % d['audio_slug'], pane)
    scope = '#pane-' + key

    def idsel(s):
        return re.sub(r'#([A-Za-z_][\w-]*)', lambda mm: '#' + (ren(key, mm.group(1)) if mm.group(1) in ids else mm.group(1)), s)
    css = scope_css(css_all, scope, '-' + key, idsel)
    for kf in kfs:
        css = re.sub(r'(animation(?:-name)?\s*:[^;}]*?)\b%s\b' % re.escape(kf), r'\1%s-%s' % (kf, key), css)
    new_scripts = []
    if scripts:
        new_scripts.append(rewrite_script('\n'.join(scripts), key, ids, exports))
    d.update(pane=pane, css=css, js=new_scripts, ids=ids, exports=exports)
    return d


def head_without_styles(head_inner):
    h = re.sub(r'<style\b.*?</style>', '', head_inner, flags=re.S | re.I)
    h = re.sub(r'<title>.*?</title>', '<title>@@TITLE@@</title>', h, flags=re.S | re.I)
    return h


def build(spec):
    taken = set(spec.get('reserved_ids', ['lsa-dock', 'lsa-panel', 'lsa-now', 'lsa-play', 'lsa-prev', 'lsa-next', 'lsa-bar-info', 'lsa-bar-text', 'lsa-bar-progress']))
    members = [build_member(m, spec['host'], taken) for m in spec['members']]
    host = next(m for m in members if m['path'] == spec['host'])
    host_d = host
    title = spec['title']
    # head
    head = head_without_styles(host_d['head_inner'])
    links = []
    for m in members:
        for l in m['links']:
            if l not in links and l not in head:
                links.append(l)
    extra_links = ''.join('\n    <link rel="stylesheet" href="%s">' % l for l in links)
    any_audio = any(m['has_audio'] for m in members)
    if any_audio and 'lesson-audio.css' not in head and 'css/lesson-audio.css' not in ' '.join(links):
        extra_links += '\n    <link rel="stylesheet" href="css/lesson-audio.css">'
    head = head.replace('@@TITLE@@', htmlmod.escape(spec.get('doc_title', title + ' | NeoStudy'), quote=False))
    sw_css = '<link rel="stylesheet" href="css/lesson-switch.css?v=2">'
    style = '\n'.join('/* ===== %s ===== */\n%s' % (m['key'], m['css']) for m in members if m['css'].strip())
    head_html = head.rstrip() + extra_links + '\n    ' + sw_css + '\n    <style>\n' + style + '\n    </style>\n'
    # breadcrumbs: last crumb -> group title
    bc = host_d['breadcrumbs'] or ''
    bc = re.sub(r'(<span class="current">).*?(</span>)', lambda m: m.group(1) + spec.get('crumb', htmlmod.escape(title, quote=False)) + m.group(2), bc, flags=re.S)      # crumb is HTML
    # switcher
    rows = spec.get('rows') or [(None, [m['key'] for m in members])]
    by_key = {m['key']: m for m in members}
    sw = ['<div class="lsw" role="tablist" aria-label="Lektionen">']
    for label, keys in rows:
        sw.append('  <div class="lsw-row">' + ('<span class="lsw-label">%s</span>' % htmlmod.escape(label, quote=False) if label else ''))
        for k in keys:
            sw.append('    <button type="button" class="lsw-btn" role="tab" data-pane="%s">%s</button>' % (k, by_key[k]['label']))
        sw.append('  </div>')
    sw.append('</div>')
    panes = []
    for m in members:
        panes.append('<section class="lesson-pane" id="pane-%s" data-pane="%s" data-title="%s" hidden>\n%s\n</section>'
                     % (m['key'], m['key'], htmlmod.escape(htmlmod.unescape(re.sub(r'<[^>]+>', '', m['label'])), quote=True), m['pane']))
    dock = next((m['dock'] for m in members if m['dock']), None)
    body_attrs = ' '.join('%s="%s"' % (k, htmlmod.escape(v, quote=True)) for k, v in host_d['body_attrs'].items())
    scripts_src = []
    for m in members:
        for s in m['scripts_src']:
            base = os.path.basename(s.split('?')[0])
            if base in SHARED_SCRIPTS or re.match(r'lesson-.*-cues\.js', base):
                continue
            if s not in scripts_src:
                scripts_src.append(s)
    audio_slugs = {m['key']: m['audio_slug'] for m in members if m['audio_slug']}
    cfg = dict(default=spec.get('default', members[0]['key']), suffix=' | NeoStudy', audio=audio_slugs)
    out = ['<!DOCTYPE html>', '<html lang="%s">' % host_d['html_attrs'].get('lang', 'de'), '<head>', head_html, '</head>',
           '<body %s>' % body_attrs if body_attrs else '<body>']
    out.append(host_d['bg'] or '')
    out.append(host_d['navbar'] or '')
    out.append('<div %s>' % (host_d['pc_attrs'] or 'class="page-content page-with-bg"'))
    out.append(bc)
    out.append(host_d['backlink'] or '')
    out.append('\n'.join(sw))
    out.append('\n\n'.join(panes))
    out.append('</div>')
    if dock:
        out.append('\n' + dock)
    out.append(host_d['footer'] or '')
    out.append('<script>window.LESSON_SWITCH = %s;</script>' % json.dumps(cfg, ensure_ascii=False))
    for s in scripts_src:
        out.append('<script src="%s"></script>' % s)
    for m in members:
        for js in m['js']:
            out.append('<script>\n// ===== %s =====\n%s\n</script>' % (m['key'], js))
    if any_audio:
        out.append('<script src="js/lesson-audio-player.js"></script>')
    out.append('<script src="js/lesson-switch.js?v=2"></script>')
    out.append('<script src="js/nav-dropdown.js" defer></script>')
    out.append('</body>\n</html>\n')
    result = '\n'.join(x for x in out if x is not None)
    return result, members


def append_member(page_path, src, key, label, row=None, out_path=None):
    """Add ONE more lesson (page `src`) as a new pane to an already merged page: switcher button, pane, scoped CSS and script are inserted."""
    page = open(page_path, encoding='utf-8').read()
    taken = set(re.findall(r'\bid="([^"]+)"', page))
    assert ('id="pane-%s"' % key) not in page, 'pane key already exists: ' + key
    m = build_member(dict(key=key, src=src, label=label), None, taken)
    root = parse(page)
    panes = [n for n in find_all(root, 'section') if n.has_class('lesson-pane')]
    assert panes, 'not a merged page (no .lesson-pane)'
    last = panes[-1]
    btn = '<button type="button" class="lsw-btn" role="tab" data-pane="%s">%s</button>' % (key, m['label'])
    pane = ('<section class="lesson-pane" id="pane-%s" data-pane="%s" data-title="%s" hidden>\n%s\n</section>'
            % (key, key, htmlmod.escape(htmlmod.unescape(re.sub(r'<[^>]+>', '', m['label'])), quote=True), m['pane']))
    # switcher: into the row with that label (or the last row)
    rows = [n for n in find_all(root, 'div') if n.has_class('lsw-row')]
    target = rows[-1]
    if row:
        for r in rows:
            lab = find_first(r, 'span', 'lsw-label')
            if lab and htmlmod.unescape(lab.inner(page)).strip().lower() == row.lower():
                target = r
    ins = [(target.close_start, btn + '\n  '), (last.end, '\n\n' + pane)]
    head_end = page.index('</head>')
    ins.append((head_end, '    <style>\n/* ===== %s ===== */\n%s\n    </style>\n' % (key, m['css'])))
    sw = page.index('<script src="js/lesson-switch.js')
    ins.append((sw, ''.join('<script>\n// ===== %s =====\n%s\n</script>\n' % (key, js) for js in m['js'])))
    for pos, text in sorted(ins, reverse=True):
        page = page[:pos] + text + page[pos:]
    open(out_path or page_path, 'w', encoding='utf-8').write(page)
    return m


if __name__ == '__main__':
    import sys, importlib
    if sys.argv[1] == '--append':          # --append merged-page.html new-page.html key "Label" ["Row label"]
        mm = append_member(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6] if len(sys.argv) > 6 else None)
        print('appended', sys.argv[3], 'as pane', sys.argv[4], 'to', sys.argv[2])
        sys.exit(0)
    spec_name = sys.argv[1]
    outdir = sys.argv[2] if len(sys.argv) > 2 else None
    specs = importlib.import_module('specs').SPECS
    sp = specs[spec_name]
    result, members = build(sp)
    target = os.path.join(outdir or REPO, sp['out'])
    open(target, 'w', encoding='utf-8').write(result)
    print('wrote', target, len(result) // 1024, 'KB;', 'members:', ', '.join(m['key'] for m in members))
