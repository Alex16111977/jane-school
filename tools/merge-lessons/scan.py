# -*- coding: utf-8 -*-
# Tolerant HTML scanner: builds an element tree with absolute source offsets, so parts of a page can be cut out verbatim.
import re
from html.parser import HTMLParser

VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


class Node:
    __slots__ = ('tag', 'attrs', 'start', 'open_end', 'close_start', 'end', 'children', 'parent')

    def __init__(self, tag, attrs, start, open_end, parent):
        self.tag = tag
        self.attrs = attrs
        self.start = start
        self.open_end = open_end
        self.close_start = open_end
        self.end = open_end
        self.children = []
        self.parent = parent

    def cls(self):
        return (self.attrs.get('class') or '').split()

    def has_class(self, c):
        return c in self.cls()

    def inner(self, src):
        return src[self.open_end:self.close_start]

    def outer(self, src):
        return src[self.start:self.end]

    def walk(self):
        yield self
        for c in self.children:
            yield from c.walk()


class _P(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.line_starts = [0]
        for m in re.finditer('\n', src):
            self.line_starts.append(m.end())
        self.root = Node('#root', {}, 0, 0, None)
        self.root.close_start = self.root.end = len(src)
        self.stack = [self.root]

    def off(self):
        ln, col = self.getpos()
        return self.line_starts[ln - 1] + col

    def handle_starttag(self, tag, attrs):
        raw = self.get_starttag_text()
        s = self.off()
        n = Node(tag, {k: (v if v is not None else '') for k, v in attrs}, s, s + len(raw), self.stack[-1])
        self.stack[-1].children.append(n)
        if tag in VOID or raw.rstrip().endswith('/>'):
            n.end = n.close_start = n.open_end
        else:
            self.stack.append(n)

    def handle_startendtag(self, tag, attrs):
        raw = self.get_starttag_text()
        s = self.off()
        n = Node(tag, {k: (v if v is not None else '') for k, v in attrs}, s, s + len(raw), self.stack[-1])
        n.end = n.close_start = n.open_end
        self.stack[-1].children.append(n)

    def handle_endtag(self, tag):
        s = self.off()
        e = self.src.find('>', s) + 1
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                n = self.stack[i]
                n.close_start = s
                n.end = e
                for j in range(len(self.stack) - 1, i, -1):      # unclosed children (e.g. <p>, <li>) end where the parent ends
                    self.stack[j].close_start = self.stack[j].end = s
                del self.stack[i:]
                return
        # stray end tag: ignore


def parse(src):
    p = _P(src)
    p.feed(src)
    p.close()
    for n in p.stack[1:]:                  # still open at EOF
        n.close_start = n.end = len(src)
    return p.root


def find_all(node, tag=None, cls=None, id=None):
    out = []
    for n in node.walk():
        if n is node:
            continue
        if tag and n.tag != tag:
            continue
        if cls and not n.has_class(cls):
            continue
        if id and n.attrs.get('id') != id:
            continue
        out.append(n)
    return out


def find_first(node, tag=None, cls=None, id=None):
    r = find_all(node, tag, cls, id)
    return r[0] if r else None


def cut(src, spans):
    """remove [start,end) spans (non-overlapping or nested allowed) from src"""
    spans = sorted(spans)
    merged = []
    for s, e in spans:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    out, pos = [], 0
    for s, e in merged:
        out.append(src[pos:s])
        pos = e
    out.append(src[pos:])
    return ''.join(out)


if __name__ == '__main__':
    import sys
    src = open(sys.argv[1], encoding='utf-8').read()
    root = parse(src)
    body = find_first(root, 'body')
    pc = find_first(body, 'div', 'page-content')
    print('body children:', [(c.tag, c.attrs.get('class')) for c in body.children][:12])
    print('page-content children:')
    for c in pc.children:
        print('   ', c.tag, c.attrs.get('class'), c.attrs.get('id'), c.end - c.start)
