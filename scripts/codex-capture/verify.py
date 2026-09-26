"""Read-only evidence checks; never invokes the capture exporter."""
import hashlib
import json
from pathlib import Path
import time

ROOT = Path(__file__).resolve().parents[2]
baseline = json.loads(Path(__file__).with_name('preservation.json').read_text())
for name, expected in baseline.items():
    data = (ROOT / name).read_bytes()
    if name == 'CAPTURE-TEST.md':
        data = data[:expected['size']]
    assert hashlib.sha256(data).hexdigest() == expected['sha256'], name
print('PASS: all original logs and Claude files unchanged; original verification prefix unchanged')

for sid in ('01a0dc51-d573-7130-b2da-bf48e54a94ed', '01a0dc52-2c2f-7580-aef9-281925e4a398'):
    source = next((Path.home() / '.codex/sessions').rglob(f'*{sid}.jsonl'))
    rows = [json.loads(line) for line in source.read_text(encoding='utf-8').splitlines()]
    log = next((ROOT / '.agent-logs').glob(f'*{sid}.md')).read_text(encoding='utf-8')
    expected = []
    model = None
    for row in rows:
        p = row['payload']
        if row['type'] == 'turn_context':
            model = p['model']
        if row['type'] != 'response_item' or p.get('type') != 'message':
            continue
        if p.get('role') == 'user' and 'user.text' in p.get('internal_chat_message_metadata_passthrough', {}).get('content_item_kinds', []):
            kind = 'PROMPT'
        elif p.get('role') == 'assistant' and p.get('phase') in ('final', 'final_answer'):
            kind = 'RESPONSE'
        else:
            continue
        text = ''.join(c['text'] for c in p['content'] if c['type'] in ('input_text', 'output_text'))
        expected.append(f'[LOG_ENTRY type={kind} num=1 session={sid[:8]}]\ntimestamp: {row["timestamp"]}\nmodel: {model}\n\n{text}\n\n')
    assert len(expected) == 2
    assert log[log.index('[LOG_ENTRY'): ] == '\n'.join(expected)
    print('PASS: exact prompt/final response, timestamps and model:', sid)

heartbeat = float(Path(__file__).with_name('runtime').joinpath('heartbeat').read_text())
assert time.time() - heartbeat < 10, 'Watcher heartbeat stale'
errors = Path(__file__).with_name('runtime').joinpath('errors.log')
assert not errors.exists() or errors.stat().st_size == 0, 'Watcher errors need inspection'
print('PASS: watcher healthy')
