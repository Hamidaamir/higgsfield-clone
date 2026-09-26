"""Automatically export Codex user messages and final-channel responses only."""
import hashlib
import json
import os
from pathlib import Path
import time
import traceback
import msvcrt

ROOT = Path(__file__).resolve().parents[2]
CONFIG = json.loads(Path(__file__).with_name('config.json').read_text())
STATE = ROOT / 'scripts/codex-capture/runtime'
STATE.mkdir(exist_ok=True)


def extract(path):
    rows = []
    for line in path.read_bytes().splitlines(keepends=True):
        if not line.endswith(b'\n'):
            break
        rows.append(json.loads(line))
    if not rows or rows[0]['type'] != 'session_meta':
        return
    meta = rows[0]['payload']
    if os.path.normcase(os.path.abspath(meta.get('cwd', ''))) != os.path.normcase(str(ROOT)):
        return
    if meta['timestamp'] < CONFIG['since']:
        return
    sid = meta.get('id', meta.get('session_id'))
    model = 'unknown'
    entries = []
    number = 0
    legacy_prompts = any(r['type'] == 'event_msg' and r.get('payload', {}).get('type') == 'user_message' for r in rows)
    for row in rows:
        p = row.get('payload', {})
        if row['type'] == 'turn_context':
            model = p.get('model', model)
        if row['type'] == 'event_msg' and p.get('type') == 'user_message':
            number += 1
            entries.append(('PROMPT', number, row['timestamp'], model, p['message']))
        elif not legacy_prompts and row['type'] == 'response_item' and p.get('role') == 'user' and 'user.text' in p.get('internal_chat_message_metadata_passthrough', {}).get('content_item_kinds', []):
            number += 1
            content = ''.join(c['text'] for c in p.get('content', []) if c.get('type') == 'input_text')
            entries.append(('PROMPT', number, row['timestamp'], model, content))
        elif row['type'] == 'response_item' and p.get('type') == 'message' and p.get('role') == 'assistant' and p.get('phase') in ('final', 'final_answer'):
            content = ''.join(c['text'] for c in p.get('content', []) if c.get('type') == 'output_text')
            entries.append(('RESPONSE', number, row['timestamp'], model, content))
    if not entries:
        return
    stamp = meta['timestamp'][:19].replace(':', '-').replace('T', '_')
    dest = ROOT / '.agent-logs' / f'{stamp}_{sid}.md'
    blocks = [f'\n[LOG_ENTRY type={kind} num={n} session={sid[:8]}]\ntimestamp: {ts}\nmodel: {m}\n\n{text}\n\n' for kind,n,ts,m,text in entries]
    intro = f'\n# Session Log - {stamp[:10]}\n\nSession: `{sid[:8]}` | Project: `{ROOT.name}` | Author: `{CONFIG["author"]}`\n\n---\n'
    body = intro + ''.join(blocks)
    prompts = [e for e in entries if e[0] == 'PROMPT']
    header = dict(session_id=sid, date=stamp[:10], author=CONFIG['author'], model=model, tool='codex', project=ROOT.name, total_exchanges=len(prompts), first_prompt_time=prompts[0][2], last_prompt_time=prompts[-1][2])
    rendered = ('---\n' + ''.join(f'{k}: {v}\n' for k,v in header.items()) + '---\n' + body).encode('utf-8')
    if dest.exists():
        old = dest.read_bytes()
        if b'\ntool: codex\n' not in old.split(b'---\n',2)[1]:
            raise RuntimeError('Refusing to touch non-Codex log')
        old_body = old.split(b'---\n',2)[2]
        if not body.encode('utf-8').startswith(old_body):
            raise RuntimeError('Refusing to change existing entry bytes: ' + str(dest))
        if old == rendered:
            return
        # Only our metadata is refreshed; existing entry bytes must remain identical.
        dest.write_bytes(rendered)
    else:
        with dest.open('xb') as out:
            out.write(rendered)


def main():
    lock = (STATE / 'watcher.lock').open('a+b')
    lock.seek(0)
    if not lock.read(1):
        lock.write(b'0'); lock.flush()
    lock.seek(0)
    try:
        msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
    except OSError:
        return
    (STATE / 'pid').write_text(str(os.getpid()))
    seen = {}
    while True:
        for path in (Path.home() / '.codex/sessions').rglob('*.jsonl'):
            try:
                stat = path.stat()
                signature = (stat.st_size, stat.st_mtime_ns)
                if seen.get(path) != signature:
                    extract(path)
                    seen[path] = signature
            except Exception:
                with (STATE / 'errors.log').open('a', encoding='utf-8') as out:
                    out.write(traceback.format_exc())
        (STATE / 'heartbeat').write_text(str(time.time()))
        time.sleep(1)


if __name__ == '__main__':
    main()
