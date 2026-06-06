# -*- coding: utf-8 -*-
import zipfile
import xml.etree.ElementTree as ET
import json
import sys
from pathlib import Path

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'testcase/Testcase.xlsx')
out = Path(sys.argv[2] if len(sys.argv) > 2 else 'testcase/testcase_source.json')

z = zipfile.ZipFile(path)
ss = []
if 'xl/sharedStrings.xml' in z.namelist():
    root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    for si in root.findall('.//m:si', ns):
        texts = [t.text or '' for t in si.findall('.//m:t', ns)]
        ss.append(''.join(texts))

root = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
rows = []
for row in root.findall('.//m:sheetData/m:row', ns):
    cells = []
    for c in row.findall('m:c', ns):
        t = c.get('t')
        v = c.find('m:v', ns)
        val = v.text if v is not None else ''
        if t == 's' and val.isdigit():
            val = ss[int(val)]
        cells.append(val)
    if any(str(x).strip() for x in cells):
        rows.append(cells)

out.parent.mkdir(parents=True, exist_ok=True)
with open(out, 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)
print(f'Wrote {len(rows)} rows to {out}')
