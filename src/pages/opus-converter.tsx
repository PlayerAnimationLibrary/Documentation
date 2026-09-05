import React, {useEffect, useRef, useState} from 'react';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import styles from './opus-converter.module.css';

// Emotecraft refuses anything past these, so the page never lets you produce one
const MAX_BYTES = 1048576;
const MAX_SECONDS = 600;
const MAX_KBPS = 96;
const SAMPLE_RATE = 48000;

// The wasm build is 31 MB, so it is fetched from a CDN rather than committed here
const CORE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

// `-ac 1` sums the channels without halving them, which is +6 dB and clips on playback. The limiter
// then catches what the encoder itself overshoots; without level=disabled it would undo its own work.
const DOWNMIX = 'pan=mono|c0=0.5*c0+0.5*c1,alimiter=level=disabled:limit=0.9';

const QUALITIES = [
  {kbps: 16, label: '16 kbps — speech, tiny file'},
  {kbps: 24, label: '24 kbps — small'},
  {kbps: 32, label: '32 kbps — recommended for music'},
  {kbps: 48, label: '48 kbps — better music'},
  {kbps: 64, label: '64 kbps — good music'},
  {kbps: MAX_KBPS, label: '96 kbps — the most Emotecraft allows'},
];

type Plan = {
  error?: string;
  from: number;
  length: number;
  loopAt: number;
  bitrate: number;
  bytes: number;
};

type Result = {url: string; name: string; size: number; length: number; loopAt: number | null};

/** Accepts 90, 1:30 or 1:02:03, all meaning a number of seconds. */
function parseTime(value: string, fallback: number): number {
  const text = value.trim();
  if (!text) return fallback;

  const parts = text.split(':').map(Number);
  if (parts.some((part) => !isFinite(part) || part < 0)) return NaN;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return NaN;
}

function showTime(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function showSize(bytes: number): string {
  return bytes < MAX_BYTES ? `${Math.round(bytes / 1024)} KB` : `${(bytes / MAX_BYTES).toFixed(2)} MB`;
}

export default function OpusConverter(): React.ReactElement {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [reading, setReading] = useState(false);
  const [unreadable, setUnreadable] = useState(false);

  const [kbps, setKbps] = useState(32);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loop, setLoop] = useState(false);
  const [loopAt, setLoopAt] = useState('');

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [failure, setFailure] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [over, setOver] = useState(false);

  const input = useRef<HTMLInputElement>(null);
  const ffmpeg = useRef<any>(null);

  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  async function choose(chosen: File | undefined) {
    if (!chosen) return;

    setReading(true);
    setUnreadable(false);
    setResult(null);
    setFailure('');

    // Decoding is how the browser tells us the real length; an <audio> element does not always report it
    const audio = new AudioContext();
    try {
      const decoded = await audio.decodeAudioData(await chosen.arrayBuffer());
      setFile(chosen);
      setDuration(decoded.duration);
    } catch {
      setFile(null);
      setUnreadable(true);
    } finally {
      audio.close();
      setReading(false);
    }
  }

  function plan(): Plan {
    const from = parseTime(start, 0);
    const to = parseTime(end, duration);
    const at = parseTime(loopAt, 0);
    const bitrate = kbps * 1000;
    const empty = {from: 0, length: 0, loopAt: 0, bitrate, bytes: 0};

    if (!isFinite(from) || !isFinite(to) || !isFinite(at)) {
      return {...empty, error: 'Those times do not look right. Write them like 1:30.'};
    }
    if (to <= from) return {...empty, error: 'The end has to come after the start.'};

    const length = Math.min(to, duration) - from;
    const bytes = Math.round((length * bitrate) / 8 * 1.02); // the Ogg container adds a couple of percent

    if (length > MAX_SECONDS) {
      return {...empty, error: `That is ${showTime(length)} long, and Emotecraft stops at 10:00.`};
    }
    if (loop && at >= length) return {...empty, error: 'The loop point is past the end of the sound.'};

    return {from, length, loopAt: at, bitrate, bytes};
  }

  const it = file ? plan() : null;
  const tooBig = !!it && !it.error && it.bytes > MAX_BYTES;
  const share = it && !it.error ? Math.round((it.bytes / MAX_BYTES) * 100) : 0;

  async function convert() {
    if (!file || !it || it.error || tooBig) return;

    setBusy(true);
    setFailure('');
    setResult(null);

    try {
      if (!ffmpeg.current) {
        setStatus('Downloading the converter — about 31 MB, only the first time…');

        // Imported here so the module never loads during the static site build
        const [{FFmpeg}, {toBlobURL}] = await Promise.all([
          import('@ffmpeg/ffmpeg'),
          import('@ffmpeg/util'),
        ]);

        const tool = new FFmpeg();
        await tool.load({
          coreURL: await toBlobURL(`${CORE}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${CORE}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        ffmpeg.current = tool;
      }

      const tool = ffmpeg.current;
      setStatus('Converting…');

      await tool.writeFile('input', new Uint8Array(await file.arrayBuffer()));

      const args = ['-i', 'input', '-vn'];
      if (it.from > 0) args.push('-ss', String(it.from));
      args.push('-t', String(it.length));
      args.push('-af', DOWNMIX);
      // Constrained VBR keeps the average near the target, so the size estimate above stays honest
      args.push('-c:a', 'libopus', '-b:a', String(it.bitrate), '-vbr', 'constrained');
      args.push('-ar', String(SAMPLE_RATE));
      if (loop) args.push('-metadata', `LOOPSTART=${Math.round(it.loopAt * SAMPLE_RATE)}`);
      args.push('output.opus');

      await tool.exec(args);
      const data = await tool.readFile('output.opus');
      await tool.deleteFile('input');
      await tool.deleteFile('output.opus');

      const blob = new Blob([data], {type: 'audio/ogg'});
      setResult({
        url: URL.createObjectURL(blob),
        name: `${file.name.replace(/\.[^.]+$/, '')}.opus`,
        size: blob.size,
        length: it.length,
        loopAt: loop ? it.loopAt : null,
      });
      setStatus('');
    } catch (error) {
      setFailure(String(error));
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout
      title="Emote Sound Converter"
      description="Turn any audio file into an .opus file that Emotecraft can play.">
      <main className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <h1>Emote Sound Converter</h1>
            <p>
              Turn any audio file into an <code>.opus</code> file that Emotecraft can play. The conversion runs
              inside your browser, so nothing is uploaded anywhere.
            </p>

            <div className="card margin-bottom--md">
              <div className="card__header">
                <h3>1. Pick your audio</h3>
              </div>
              <div className="card__body">
                <div
                  className={over ? `${styles.drop} ${styles.dropOver}` : styles.drop}
                  onClick={() => input.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOver(true);
                  }}
                  onDragLeave={() => setOver(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setOver(false);
                    choose(event.dataTransfer.files[0]);
                  }}>
                  <span className={styles.dropTitle}>Drop a file here, or click to choose</span>
                  <span className={styles.hint}>MP3, WAV, FLAC, M4A, OGG — whatever you have</span>
                  <input
                    ref={input}
                    className={styles.hidden}
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(event) => choose(event.target.files?.[0])}
                  />
                </div>

                {reading && <p className={styles.hint}>Reading the file…</p>}
                {file && !reading && (
                  <p className={styles.hint}>
                    {file.name} — {showTime(duration)}
                  </p>
                )}
                {unreadable && (
                  <div className="alert alert--danger margin-top--sm" role="alert">
                    Your browser cannot read that file. Try another one.
                  </div>
                )}
              </div>
            </div>

            {file && (
              <div className="card margin-bottom--md">
                <div className="card__header">
                  <h3>2. Settings</h3>
                </div>
                <div className="card__body">
                  <div className={styles.field}>
                    <label htmlFor="quality">Quality</label>
                    <select
                      id="quality"
                      value={kbps}
                      onChange={(event) => setKbps(Number(event.target.value))}>
                      {QUALITIES.map((option) => (
                        <option key={option.kbps} value={option.kbps}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className={styles.hint}>
                      Higher quality means a bigger file, and the sound has to stay under 1 MB.
                    </p>
                  </div>

                  <div className="row">
                    <div className="col col--6">
                      <div className={styles.field}>
                        <label htmlFor="start">Start at</label>
                        <input
                          id="start"
                          type="text"
                          placeholder="0:00"
                          value={start}
                          onChange={(event) => setStart(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col col--6">
                      <div className={styles.field}>
                        <label htmlFor="end">End at</label>
                        <input
                          id="end"
                          type="text"
                          placeholder={showTime(duration)}
                          value={end}
                          onChange={(event) => setEnd(event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <p className={styles.hint}>Use these to keep only the part you want.</p>

                  <div className={`${styles.field} margin-top--md`}>
                    <label className={styles.toggle}>
                      <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />
                      Repeat the sound while the emote keeps playing
                    </label>
                  </div>

                  {loop && (
                    <div className={styles.field}>
                      <label htmlFor="loopAt">Jump back to</label>
                      <input
                        id="loopAt"
                        type="text"
                        placeholder="0:00"
                        value={loopAt}
                        onChange={(event) => setLoopAt(event.target.value)}
                      />
                      <p className={styles.hint}>
                        Leave this empty to start over from the beginning. Set it later to skip an intro that
                        should only be heard once.
                      </p>
                    </div>
                  )}

                  {it?.error && (
                    <div className="alert alert--danger" role="alert">
                      {it.error}
                    </div>
                  )}
                  {tooBig && it && (
                    <div className="alert alert--danger" role="alert">
                      About {showSize(it.bytes)} — too big, the limit is 1 MB. Either cut it down to{' '}
                      {showTime(Math.floor(((MAX_BYTES / 1.02) * 8) / it.bitrate))}, or pick a lower quality.
                    </div>
                  )}
                  {it && !it.error && !tooBig && (
                    <div className={share > 85 ? 'alert alert--warning' : 'alert alert--success'} role="alert">
                      About {showSize(it.bytes)}, {share}% of the 1 MB limit.
                      {share > 85 && ' That is close to the edge — the emote itself needs room in the same packet.'}
                    </div>
                  )}
                </div>
                <div className="card__footer">
                  <button
                    className="button button--primary button--block"
                    disabled={busy || !it || !!it.error || tooBig}
                    onClick={convert}>
                    {busy ? 'Working…' : 'Convert to .opus'}
                  </button>
                  {status && <p className={styles.hint}>{status}</p>}
                  {failure && (
                    <div className="alert alert--danger margin-top--sm" role="alert">
                      It did not work: {failure}
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && (
              <div className="card margin-bottom--md">
                <div className="card__header">
                  <h3>3. Done</h3>
                </div>
                <div className="card__body">
                  <table className={styles.summary}>
                    <tbody>
                      <tr>
                        <td>Length</td>
                        <td>{showTime(result.length)}</td>
                      </tr>
                      <tr>
                        <td>Size</td>
                        <td>{showSize(result.size)} of 1 MB</td>
                      </tr>

                      <tr>
                        <td>Loop</td>
                        <td>{result.loopAt === null ? 'plays once' : `from ${showTime(result.loopAt)}`}</td>
                      </tr>
                    </tbody>
                  </table>

                  {result.size > MAX_BYTES && (
                    <div className="alert alert--danger" role="alert">
                      This came out larger than 1 MB, so Emotecraft will not accept it. Pick a lower quality or
                      make it shorter, then convert again.
                    </div>
                  )}

                  <audio className={styles.player} controls src={result.url} />

                  <p>
                    Put the file in your <code>emotes</code> folder next to the emote and give it the same
                    name. If the emote is <code>wave.json</code>, the sound has to be <code>wave.opus</code>:
                  </p>
                  <CodeBlock language="text">{'emotes/\n  wave.json\n  wave.opus'}</CodeBlock>
                </div>
                <div className="card__footer">
                  <a className="button button--primary button--block" href={result.url} download={result.name}>
                    Download {result.name}
                  </a>
                </div>
              </div>
            )}

            <h2>What it does for you</h2>
            <ul>
              <li>Converts to mono at 48 kHz, which is what Emotecraft expects.</li>
              <li>Keeps the result under 1 MB and 96 kbps, the limits the mod enforces.</li>
              <li>Writes the loop point into the file, so you never have to edit tags by hand.</li>
            </ul>
            <p>
              Volume is left alone on purpose. Emotecraft evens out loudness between emotes on its own, and
              players who would rather hear the original can turn that off in the settings.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
