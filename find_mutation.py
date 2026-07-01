import os, glob

path = glob.glob(os.path.join('C:\\', 'Users', 'Sandeep Roy', 'Downloads', 'BYOPinIBPSIT', 'frontend', 'dist', 'assets', 'index-*.js'))[0]
f = open(path, 'r', encoding='utf-8')
c = f.read()
f.close()

print('File size:', len(c))

# Find React Query's MutationObserver.execute method - it has a 'var' P
# that could be accessed before const declaration if the order is wrong
# Look specifically in our app code area (around offset 356k+)
import re

# Look for the Practice component area
idx = c.find('/api/ibps/practice')
start = max(0, idx - 2000)

# Search for 'const P' within 10000 chars before the Practice code
area = c[max(0, start-5000):start+1000]
print(f'Searching area around Practice start ({start})')

for match in re.finditer(r'(const|let|var)\s+P(\W)', area):
    pos = match.start()
    print(f'Found P declaration at relative {pos}:')
    idx_abs = max(0, start-5000) + pos
    print(c[idx_abs:idx_abs+200])
    print()

# Also search for P used in destructuring like {data:E, isFetching:P}
for match in re.finditer(r'[,{]\s*[a-zA-Z]*:P\b', c[max(0,start-5000):min(start+10000, len(c))]):
    pos = max(0,start-5000) + match.start()
    print(f'Found destructured P at {pos}:')
    print(c[max(0,pos-30):pos+80])
    print()
