import sys, glob, os, json, re
from html.parser import HTMLParser
# stdlib-only structural extractor (no third-party deps)
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.tables=[]; s.cur=None; s.row=None; s.cell=None; s.skip=0
        s.heads=[]; s.h=None; s.labels=[]; s.lab=False; s.fields=[]
    def handle_starttag(s,t,a):
        a=dict(a)
        if t in('script','style'): s.skip+=1
        if t=='table': s.cur={'id':a.get('id',''),'rows':[]}; s.tables.append(s.cur)
        elif t=='tr' and s.cur is not None: s.row=[]; s.cur['rows'].append(s.row)
        elif t in('td','th') and s.row is not None: s.cell=''
        elif t in('h1','h2','h3','h4','h5'): s.h=''
        elif t=='label': s.lab=True; s.labtxt=''
        elif t in('input','select','textarea'):
            if a.get('type')!='hidden': s.fields.append((t,a.get('type',''),a.get('id',''),a.get('placeholder','')))
    def handle_endtag(s,t):
        if t in('script','style'): s.skip-=1
        if t in('td','th') and s.cell is not None and s.row is not None: s.row.append(re.sub(r'\s+',' ',s.cell).strip()); s.cell=None
        elif t in('h1','h2','h3','h4','h5') and s.h is not None:
            x=re.sub(r'\s+',' ',s.h).strip()
            if x: s.heads.append(x)
            s.h=None
        elif t=='label' and s.lab: s.labels.append(re.sub(r'\s+',' ',s.labtxt).strip()); s.lab=False
    def handle_data(s,d):
        if s.skip: return
        if s.cell is not None: s.cell+=d
        if s.h is not None: s.h+=d
        if s.lab: s.labtxt+=d
for f in sorted(glob.glob('html/*.html')):
    name=os.path.basename(f)[:-5]
    txt=open(f,encoding='utf-8',errors='replace').read()
    if 'ACCESS RESTRICTED' in txt and 'permission to access' in txt: print(f'\n=== {name}: ACCESS RESTRICTED for this account'); continue
    if len(txt)<3000: continue
    # only main content area, skip sidebar/template
    m=re.search(r'id="kt_content"(.*?)(id="kt_footer"|</body>)',txt,re.S); body=m.group(1) if m else txt
    p=P(); p.feed(body)
    print(f'\n=== {name}  (html {len(txt)}b)')
    if p.heads: print(' headings:',p.heads[:12])
    if p.labels: print(' labels:',[l for l in p.labels if l][:25])
    for t in p.tables:
        rows=[r for r in t['rows'] if any(r)]
        if not rows: continue
        print(f" table#{t['id']} rows={len(rows)}")
        print('   H:',rows[0][:14])
        if len(rows)>1: print('   R:',rows[1][:14])
    vis=[x for x in p.fields if x[2] and not x[2].startswith('ctl00_')][:15]
    if vis: print(' fields:',vis)
