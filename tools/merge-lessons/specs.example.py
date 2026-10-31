# -*- coding: utf-8 -*-
# Copy to specs.py and edit. One entry = one merged page.
#   out      file name of the merged page (may be one of the member pages: the host keeps its name and its deep links)
#   host     member whose head / navbar / background / footer / breadcrumbs the merged page uses
#   members  key = short pane name (used in the URL: page.html#key, page.html#key/tab), src = page to merge, label = switcher button (HTML)
#            rename: 'collide' (default; only ids that clash with earlier members get a key prefix) | 'all' | 'none'
#            post:   optional function(pane_html) -> pane_html to edit the member before it is merged (e.g. remove a repeated block)
#   rows     optional switcher rows [(label, [keys])] (default: one row with all members)
SPECS = {}

SPECS['pair'] = dict(
    out='englisch-phrasal-verbs.html', host='englisch-phrasal-verbs.html', title='Phrasal Verbs', crumb='Phrasal Verbs',
    doc_title='Phrasal Verbs | NeoStudy', default='list',
    members=[dict(key='list', src='englisch-phrasal-verbs.html', label='Phrasal Verbs: Karten &amp; Liste'),
             dict(key='particles', src='englisch-phrasal-particles.html', label='Nach Partikeln: in / out, on / off')])

SPECS['group'] = dict(
    out='englisch-tenses.html', host='englisch-present-simple.html', title='Tenses', crumb='Tenses &mdash; Zeitformen', doc_title='English Tenses | NeoStudy', default='ps',
    rows=[('Present', ['ps', 'pc']), ('Past', ['pas'])],
    members=[dict(key='ps', src='englisch-present-simple.html', label='Present Simple'),
             dict(key='pc', src='englisch-present-continuous.html', label='Present Continuous'),
             dict(key='pas', src='englisch-past-simple.html', label='Past Simple')])
