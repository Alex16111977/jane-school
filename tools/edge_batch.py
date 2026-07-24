#!/usr/bin/env python3
"""Fetch many edge-tts clips concurrently (one mp3 per job), resumable.

Usage:
  python3 tools/edge_batch.py jobs.json outdir [concurrency]

jobs.json: [{"id": "...", "voice": "...", "text": "..."}, ...]
Writes outdir/<id>.mp3 for each job. Jobs whose output file already exists
(non-empty) are skipped, so an interrupted run can just be re-launched.
Prints one line per job: "OK <id>" / "SKIP <id>" / "FAIL <id> <error>".
"""
import asyncio
import json
import os
import sys

import edge_tts


async def one(sem, job, outdir):
    path = os.path.join(outdir, job["id"] + ".mp3")
    if os.path.exists(path) and os.path.getsize(path) > 0:
        print("SKIP", job["id"], flush=True)
        return
    async with sem:
        last = None
        for _attempt in range(4):
            try:
                communicate = edge_tts.Communicate(job["text"], job["voice"])
                await communicate.save(path)
                if os.path.exists(path) and os.path.getsize(path) > 0:
                    print("OK", job["id"], flush=True)
                    return
            except Exception as e:  # noqa: BLE001 - retry loop, report last error
                last = e
        print("FAIL", job["id"], str(last)[:200].replace("\n", " "), flush=True)


async def main():
    jobs_file, outdir = sys.argv[1], sys.argv[2]
    concurrency = int(sys.argv[3]) if len(sys.argv) > 3 else 14
    with open(jobs_file, encoding="utf-8") as f:
        jobs = json.load(f)
    os.makedirs(outdir, exist_ok=True)
    sem = asyncio.Semaphore(concurrency)
    done = 0
    total = len(jobs)

    async def wrapped(job):
        nonlocal done
        await one(sem, job, outdir)
        done += 1
        if done % 200 == 0:
            print(f"... {done}/{total}", flush=True)

    await asyncio.gather(*(wrapped(j) for j in jobs))
    print(f"DONE {done}/{total}", flush=True)


asyncio.run(main())
