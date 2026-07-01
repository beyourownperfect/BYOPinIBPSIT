"""Production smoke test — run against Render URL."""
import urllib.request, json, sys

BASE = 'https://byopinibpsit.onrender.com'

def req(method, path, data=None):
    url = BASE + path
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, method=method, headers={'Content-Type': 'application/json'} if data else {})
    try:
        resp = urllib.request.urlopen(r)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {'_error': f'{e.code}: {e.reason}', '_body': e.read().decode()[:300]}
    except Exception as e:
        return {'_error': str(e)}

pass_count = 0
fail_count = 0

def check(name, condition, detail=''):
    global pass_count, fail_count
    if condition:
        print(f'  PASS: {name}')
        pass_count += 1
    else:
        print(f'  FAIL: {name} — {detail}')
        fail_count += 1

print('=== Production Smoke Test ===')
print()

# 1. Backend API
print('1. Backend API')
h = req('GET', '/api/')
check('Health check', h.get('status') == 'ok', h)

# 2. Seed database
print('2. Database')
s = req('POST', '/api/ibps/seed')
check('Seed data', s.get('seeded', 0) > 0, s)

# 3. CRUD — Questions
print('3. CRUD Operations')
q = req('GET', '/api/ibps/questions?page=1&limit=5')
check('List questions', len(q.get('items', [])) > 0, q)
qid = q.get('items', [{}])[0].get('id', '')
check('Question has id', bool(qid))

q1 = req('GET', f'/api/ibps/questions/{qid}')
check('Get single question', q1.get('id') == qid, q1)

sub = req('POST', '/api/ibps/practice/submit', {
    'question_id': qid, 'selected_option': 'A', 'confidence': 3,
    'time_taken_sec': 10, 'practice_mode': 'all'
})
check('Practice submit', 'correct' in sub, sub)

# 4. Practice flow
print('4. Practice Flow')
pn = req('GET', f'/api/ibps/practice/next?section=english&mode=all&exclude_ids=')
check('Next question', 'id' in pn, pn)

# 5. Mock flow
print('5. Mock Flow')
mk = req('POST', '/api/ibps/mocks', {'phase': 'prelims', 'title': 'Smoke Test'})
check('Create mock', 'id' in mk, mk)
mid = mk.get('id', '')

ms = req('POST', f'/api/ibps/mocks/{mid}/start')
check('Start mock', 'mock_attempt_id' in ms, ms)

mr = req('GET', '/api/ibps/mocks/results')
check('Mock results list', 'items' in mr, mr)

# 6. Dashboard analytics
print('6. Dashboard Analytics')
d = req('GET', '/api/ibps/analytics/dashboard')
check('Dashboard overview', 'overview' in d, d)
check('Dashboard sections', 'sections' in d, d)
check('Phase readiness', 'phase_readiness' in d, d)

# 7. Settings
print('7. Settings')
st = req('GET', '/api/ibps/settings')
check('Settings has exam_date', 'exam_date' in st, st)

# 8. Coverage
print('8. Coverage')
cv = req('GET', '/api/ibps/coverage')
check('Coverage has sections', 'coverage' in cv, cv)

# 9. Frontend serves
print('9. Frontend')
try:
    r = urllib.request.urlopen(f'{BASE}/')
    html = r.read().decode()[:200]
    check('Frontend serves HTML', 'BYOP' in html or 'DOCTYPE' in html, '')
except Exception as e:
    check('Frontend serves HTML', False, str(e))

# 10. Clear
print('10. Cleanup')
cl = req('POST', '/api/ibps/clear')
check('Clear data', cl.get('cleared') == True, cl)

print()
print(f'Results: {pass_count} passed, {fail_count} failed')
if fail_count > 0:
    sys.exit(1)
