import urllib.request, json

BASE = 'https://byopinibpsit.onrender.com'

def req(path, data=None, method='GET'):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(BASE+path, data=body, method=method,
                                 headers={'Content-Type':'application/json'} if data else {})
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {'_error': f'{e.code}', '_body': e.read().decode()[:500]}
    except Exception as e:
        return {'_error': str(e)}

print('1. Health:', req('/api/').get('status'))
print('2. Seed:', req('/api/ibps/seed', method='POST').get('seeded'))
print('3. Dashboard after seed:', req('/api/ibps/analytics/dashboard').get('_error', 'OK'))

q = req('/api/ibps/questions?page=1&limit=1')
qid = q['items'][0]['id'] if q.get('items') else None
print(f'4. Question: {qid}')

if qid:
    print('5. Practice submit:', req('/api/ibps/practice/submit', {
        'question_id': qid, 'selected_option': 'A', 'confidence': 3,
        'time_taken_sec': 10, 'practice_mode': 'all'
    }, method='POST').get('_error', 'OK'))
    
    print('6. Dashboard after practice:', req('/api/ibps/analytics/dashboard').get('_error', 'OK'))
