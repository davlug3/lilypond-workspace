import { createElement, useEffect, useRef, useState } from 'react'
import { Editor } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

declare global {
  interface Window {
    scheduleCompile: (immediate?: boolean) => void
  }
}

export default function App() {
  const [version, setVersion] = useState('checking lilypond…')
  const [status, setStatus] = useState<{ state: 'idle' | 'busy' | 'ok' | 'err'; text: string }>({ state: 'idle', text: 'idle' })
  const [files, setFiles] = useState<string[]>([])
  const [tree, setTree] = useState<any>(null)
  const [selected, setSelected] = useState('')
  const [log, setLog] = useState('Press Compile or type (auto-preview on).')
  const [auto, setAuto] = useState(true)
  const [follow, setFollow] = useState(true)
  const [autoplay, setAutoplay] = useState(true)
  const [followNotice, setFollowNotice] = useState('')
  const [tab, setTab] = useState<'png' | 'pdf' | 'midi'>('png')
  const [errorLines, setErrorLines] = useState<string[]>([])
  const [hasGood, setHasGood] = useState(false)
  const [stale, setStale] = useState(false)
  const [pngUrls, setPngUrls] = useState<string[]>([])
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [midiUrl, setMidiUrl] = useState<string | null>(null)
  const [presets, setPresets] = useState<{ name: string; files: string[] }[]>([])
  const [scaffoldKind, setScaffoldKind] = useState<'part' | 'staff' | 'instrument' | 'voice' | 'polyphony'>('part')
  const [code, setCode] = useState('')
  const [split, setSplit] = useState(50)
  const [pngOpacity, setPngOpacity] = useState(() => { try { return Number(localStorage.getItem('pngOpacity') ?? 1) } catch { return 1 } })
  const [pdfOpacity, setPdfOpacity] = useState(() => { try { return Number(localStorage.getItem('pdfOpacity') ?? 1) } catch { return 1 } })
  useEffect(() => { try { localStorage.setItem('pngOpacity', String(pngOpacity)) } catch {} }, [pngOpacity])
  useEffect(() => { try { localStorage.setItem('pdfOpacity', String(pdfOpacity)) } catch {} }, [pdfOpacity])
  const codeRef = useRef('')
  codeRef.current = code
  const eventSourceRef = useRef<EventSource | null>(null)

  // Auto-compile when the editor text settles
  useEffect(() => {
    if (!auto) return
    const t = window.setTimeout(() => runCompile(), 600)
    return () => window.clearTimeout(t)
  }, [code, selected, auto])

  const api = async (url: string, init?: RequestInit) => {
    const r = await fetch(url, init)
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
    return r.json()
  }

  const refreshFiles = async (sel?: string) => {
    try {
      const j = await api('/api/files')
      setFiles(j.files)
      if (sel) setSelected(sel)
      try { const t = await api('/api/tree'); setTree(t.tree) } catch { /* noop */ }
    } catch { /* noop */ }
  }

  const loadFile = async (name: string) => {
    try {
      const j = await api(`/api/file?name=${encodeURIComponent(name)}`)
      setCode(j.code)
      setSelected(name)
      runCompile()
    } catch (e) {
      setLog(`Load failed: ${(e as Error).message}`)
    }
  }

  const runCompile = async () => {
    if (!code.trim()) return
    setStatus({ state: 'busy', text: 'compiling…' })
    try {
      const data = await api('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name: selected || 'score' }),
      })
      setErrorLines([])
      setStale(false)
      if (data.success) {
        setHasGood(true)
        setStatus({ state: 'ok', text: `${data.pages} page(s)` })
        setPngUrls(data.pngs ?? [])
        setPdfUrl(data.urls?.pdf ?? null)
        setMidiUrl(data.urls?.midi ?? null)
        if (data.urls?.midi) {
          window.dispatchEvent(new CustomEvent('lily:midi', { detail: { url: data.urls.midi, autoplay: autoplay } }))
        } else {
          window.dispatchEvent(new CustomEvent('lily:midi-clear'))
        }
      } else {
        setErrorLines((data.log ?? '').split('\n').filter((l: string) => /error|fatal/i.test(l)))
        setStale(hasGood)
        setStatus({ state: 'err', text: 'compile failed' })
      }
      setLog(data.log ?? '')
    } catch (e) {
      setStatus({ state: 'err', text: 'request failed' })
      setLog((e as Error).message)
    }
  }

  // Inject the legacy audio engine once (midi parser + SF2 player).
  useEffect(() => {
    if (!document.querySelector('script[src="/midi-tools.js"]')) {
      const s = document.createElement('script')
      s.src = '/midi-tools.js'
      document.body.appendChild(s)
    }
    if (!document.querySelector('script[src="/sf2-player.js"]')) {
      const s = document.createElement('script')
      s.type = 'module'
      s.src = '/sf2-player.js'
      document.body.appendChild(s)
    }
  }, [])

  useEffect(() => {
    fetch('/api/version').then((r) => r.json()).then((j) => setVersion(j.version)).catch(() => setVersion('lilypond not found'))
    refreshFiles()
    fetch('/api/presets').then((r) => r.json()).then((j) => setPresets(j.presets)).catch(() => setPresets([]))
    // SSE
    const es = new EventSource('/api/watch')
    eventSourceRef.current = es
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg.type === 'file-saved') {
          setFollowNotice(`${msg.file} saved on disk`)
          setTimeout(() => setFollowNotice(''), 5000)
        }
        if (msg.type === 'auto-compiled' && follow) {
          if (msg.success) {
            setErrorLines([])
            setPngUrls(msg.pngUrls ?? [])
            setPdfUrl(msg.pdfUrl ?? null)
            setMidiUrl(msg.midiUrl ?? null)
            setStatus({ state: 'ok', text: `${msg.pages} page(s)` })
            if (msg.midiUrl) window.dispatchEvent(new CustomEvent('lily:midi', { detail: { url: msg.midiUrl, autoplay } }))
          } else {
            setErrorLines((msg.log ?? '').split('\n').filter((l: string) => /error|fatal/i.test(l)))
            setStale(hasGood)
            setStatus({ state: 'err', text: 'compile failed' })
          }
          setLog(msg.log ?? '')
          if (follow && msg.file === selected) {
            api(`/api/file?name=${encodeURIComponent(msg.file)}`).then((j) => { if (j.code !== codeRef.current) setCode(j.code) }).catch(() => {})
          }
        }
      } catch { /* noop */ }
    }
    return () => es.close()
  }, [follow, hasGood, autoplay])


const SCAFFOLD_TEMPLATES: Record<'part' | 'staff' | 'instrument' | 'voice' | 'polyphony', string> = {
  part: `
\\version "2.24.4"
\\header { title = "{{NAME}} Part" }
\\score {
  \\new Staff \\with { instrumentName = "{{NAME}}" }
  \\relative c'' {
    \\time 4/4
    c4 d e f | g2 r2 |
  }
  \\layout { }
  \\midi { }
}
`,
  staff: `
\\version "2.24.4"
\\header { title = "{{NAME}} Staff" }
\\score {
  \\new StaffGroup <<
    \\new Staff \\with { instrumentName = "{{NAME}}" }
    \\relative c' { \\time 4/4 c4 d e f | g2 r2 | }
  >>
  \\layout { }
  \\midi { }
}
`,
  instrument: `
\\version "2.24.4"
\\header { title = "{{NAME}} Instrument" }
\\score {
  \\new Staff \\with { instrumentName = "{{NAME}}" }
  \\relative c'' {
    \\time 4/4
    c4 d e f | g2 r2 |
  }
  \\layout { }
  \\midi { }
}
`,
  voice: `
\\version "2.24.4"
\\header { title = "{{NAME}} Voices" }
\\score {
  \\new Staff <<
    \\new Voice = "v1" { \\voiceOne \\relative c'' { \\time 4/4 c4 d e f | g2 r2 | } }
    \\new Voice = "v2" { \\voiceTwo \\relative c' { \\time 4/4 c c c c | g2 r2 | } }
  >>
  \\layout { }
  \\midi { }
}
`,
  polyphony: `
\\version "2.24.4"
\\header { title = "{{NAME}} Polyphony" }
\\score {
  \\new StaffGroup <<
    \\new Staff \\with { instrumentName = "Top" }
    \\relative c'' { \\time 4/4 c4 <e g c> d | g2 r2 | }
    \\new Staff \\with { instrumentName = "Bottom" }
    \\relative c' { \\time 4/4 c4 d e f | g2 r2 | }
  >>
  \\layout { }
  \\midi { }
}
`,
}


  const onScaffold = async () => {
    const name = prompt(`Name for the new ${scaffoldKind} (no extension):`, `new-${scaffoldKind}`)
    if (!name) return
    const safe = name.trim().replace(/\s+/g, '-').toLowerCase()
    if (!safe) return
    const template = SCAFFOLD_TEMPLATES[scaffoldKind].replace(/{{NAME}}/g, safe)
    try {
      await api(`/api/file?name=${encodeURIComponent(safe + '.ly')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: template }),
      })
      await refreshFiles(safe + '.ly')
      loadFile(safe + '.ly')
    } catch (e) {
      setLog(`Create failed: ${(e as Error).message}`)
    }
  }

  const onPresetUse = async (name: string) => {
    try {
      const r = await api('/api/presets/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      await refreshFiles()
      if (r.files?.length) await loadFile(r.files[0])
      setStatus({ state: 'ok', text: `preset: ${name}` })
    } catch (e) {
      setLog(String((e as Error).message))
    }
  }

  const onSave = async () => {
    if (!selected) return
    try {
      await api(`/api/file?name=${encodeURIComponent(selected)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      setStatus({ state: 'ok', text: 'saved' })
    } catch (e) {
      setLog(`Save failed: ${(e as Error).message}`)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Workspace<span className="text-primary">.</span></h1>
          <p className="text-xs text-muted-foreground">{version}</p>
        </div>
        <div className="header-actions flex items-center gap-3">
          <label className="text-sm flex items-center gap-1">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> auto-preview
          </label>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.state === 'err' ? 'bg-destructive/10 text-destructive' : status.state === 'busy' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-green-500/10 text-green-600'}`} aria-live="polite">{status.text}</span>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-4 p-4">

        <section className="min-w-0" style={{ width: `${split}%` }}>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <select id="fileSelect" className="border rounded p-2 text-sm" value={selected} onChange={(e) => loadFile(e.target.value)}>
              {files.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select id="scaffoldKind" className="border rounded p-1.5 text-sm" onChange={(e) => setScaffoldKind(e.target.value as 'part' | 'staff' | 'instrument' | 'voice' | 'polyphony')} value={scaffoldKind}>
              <option value="part">Part</option>
              <option value="staff">Staff</option>
              <option value="instrument">Instrument</option>
              <option value="voice">Voice</option>
              <option value="polyphony">Polyphony</option>
            </select>
            <Button id="newBtn" className="h-8 px-3 text-sm border border-input bg-background hover:bg-accent" onClick={onScaffold}>+ New</Button>
            <Button id="saveBtn" className="h-8 px-3 text-sm border border-input bg-background hover:bg-accent" onClick={onSave}>Save</Button>
            <Button id="compileBtn" className="h-8 px-3 text-sm" onClick={() => runCompile()}>Compile ▶</Button>
          </div>

          <details id="dirPanel" className="border rounded mb-2" open>
            <summary className="p-2 font-semibold cursor-pointer">Files &amp; presets</summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t">
              <section className="p-3 border-r">
                <h3 className="text-xs uppercase text-muted-foreground mb-2">Presets <span className="normal-case">read-only</span></h3>
                <ul className="space-y-1 text-sm">
                  {presets.map((p) => (
                    <li key={p.name} className="flex items-center justify-between gap-2">
                      <span>{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.files.length} files</span>
                      <Button className="h-8 px-3 text-sm" onClick={() => onPresetUse(p.name)}>Use</Button>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="p-3">
                <h3 className="text-xs uppercase text-muted-foreground mb-2">Workspace</h3>
                <div id="workspaceTree" className="text-sm">
                  {tree && (tree.dirs.length > 0 || tree.files.length > 0) ? (
                    <ul>
                      {tree.dirs.map((d: any, i: number) => (
                        <li key={i}>
                          <details open>
                            <summary className="cursor-pointer font-medium hover:underline">{d.name}/</summary>
                            <ul className="pl-4">
                              {d.dirs.map((dd: any, j: number) => (
                                <li key={j}>
                                  <details>
                                    <summary className="cursor-pointer font-medium hover:underline">{dd.name}/</summary>
                                    <ul className="pl-4">
                                      {dd.files.map((f: any) => (
                                        <li key={f.path}>
                                          <button type="button" className="block w-full text-left py-0.5 hover:underline cursor-pointer" onClick={() => loadFile(f.path)}>{f.name}</button>
                                        </li>
                                      ))}
                                    </ul>
                                  </details>
                                </li>
                              ))}
                              {d.files.map((f: any) => (
                                <li key={f.path}>
                                  <button type="button" className="block w-full text-left py-0.5 hover:underline cursor-pointer" onClick={() => loadFile(f.path)}>{f.name}</button>
                                </li>
                              ))}
                            </ul>
                          </details>
                        </li>
                      ))}
                      {tree.files.map((f: any) => (
                        <li key={f.path}>
                          <button type="button" className="block w-full text-left py-0.5 hover:underline cursor-pointer" onClick={() => loadFile(f.path)}>{f.name}</button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Empty — pick a preset.</p>
                  )}
                </div>
              </section>
            </div>
          </details>

          <div className="w-full h-96 border rounded overflow-hidden">
            <Editor
              height="28rem"
              defaultLanguage="plaintext"
              value={code}
              onChange={(value) => setCode(value ?? '')}
              options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on' }}
            />
          </div>

          <details open className="border rounded mt-2">
            <summary className="p-2 font-semibold cursor-pointer">Compiler log</summary>
            <pre id="log" className="p-3 text-xs whitespace-pre-wrap max-h-40 overflow-auto">{log}</pre>
          </details>

          <p className="text-xs text-muted-foreground mt-1">Tip: also edit <code>workspace/*.ly</code> — the server watches, recompiles on save, and pushes the result.</p>

          <div className="flex items-center gap-4 mt-2 text-sm">
            <label><input id="follow" type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> follow file (auto-reload)</label>
            <label><input id="autoplay" type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} /> auto-play MIDI on save</label>
          </div>
          {followNotice && <div id="watchNotice" className="mt-2 p-2 border rounded bg-yellow-50 text-sm">{followNotice}</div>}
        </section>

        <div
          id="splitter"
          className="hidden lg:block w-1 bg-border cursor-col-resize hover:bg-primary"
          onMouseDown={(e) => {
            e.preventDefault()
            const main = document.querySelector('main')
            if (!main) return
            const startX = e.clientX
            const startSplit = split
            const onMove = (ev: MouseEvent) => {
              const delta = ((ev.clientX - startX) / main.clientWidth) * 100
              setSplit(Math.min(80, Math.max(20, startSplit + delta)))
            }
            const onUp = () => {
              window.removeEventListener('mousemove', onMove)
              window.removeEventListener('mouseup', onUp)
            }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
          }}
          onDoubleClick={() => setSplit(50)}
        />

        <section className="min-w-0" style={{ width: `${100 - split}%` }}>
          {errorLines.length > 0 && (
            <div id="errorBanner" role="alert" className="mb-2 p-3 border border-destructive rounded bg-destructive/5 text-sm text-destructive">
              <strong>Compile errors:</strong>
              <ul className="list-disc pl-5">{errorLines.map((l, i) => <li key={i}>{l}</li>)}</ul>
            </div>
          )}
          <nav className="flex items-center gap-2 mb-2">
            {(['png', 'pdf', 'midi'] as const).map((t) => (
              <Button key={t} className={tab === t ? 'h-8 px-3 text-sm' : 'h-8 px-3 text-sm border border-input bg-background hover:bg-accent'} onClick={() => setTab(t)}>{t.toUpperCase()}</Button>
            ))}
            {stale && <Badge className="bg-secondary text-secondary-foreground">showing last good version</Badge>}
          </nav>

          {tab === 'png' && (
            <div>
              <div className="flex items-center gap-3 mb-2 text-sm">
                <a id="dlPng" href={pngUrls[0] ?? '#'} className="text-primary underline" download="preview.png">Download PNG</a>
                <label>Score opacity <input id="pngOp" type="range" min={0} max={1} step={0.01} value={pngOpacity} onChange={(e) => setPngOpacity(Number(e.target.value))} /></label>
              </div>
              <div id="pngWrap" className="border rounded p-2 overflow-auto bg-card" style={{ opacity: pngOpacity }}>
                {pngUrls.length ? pngUrls.map((u, i) => <img key={i} src={u} alt={`page ${i + 1}`} className="w-full" />) : <p className="text-muted-foreground p-4">No render yet.</p>}
              </div>
            </div>
          )}

          {tab === 'pdf' && (
            <div>
              <div className="flex items-center gap-3 mb-2 text-sm">
                <a id="dlPdf" href={pdfUrl ?? '#'} className="text-primary underline" download="preview.pdf">Download PDF</a>
                <label>PDF opacity <input id="pdfOp" type="range" min={0} max={1} step={0.01} value={pdfOpacity} onChange={(e) => setPdfOpacity(Number(e.target.value))} /></label>
              </div>
              <iframe id="pdfFrame" title="PDF preview" className="w-full h-[70vh] border rounded" src={pdfUrl ?? undefined} style={{ opacity: pdfOpacity }} />
            </div>
          )}

          {tab === 'midi' && (
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2 text-sm">
                <a id="dlMidi" href={midiUrl ?? '#'} className="text-primary underline" download="preview.midi">Download MIDI</a>
                <button id="sf2UploadBtn" className="underline">Upload soundfont</button>
                <input id="sf2UploadFile" type="file" accept=".sf2,.sf3,.dls,.sfogg" hidden />
                <label>Engine <select id="engineSelect" className="border rounded px-1"><option value="magenta">Magenta</option><option value="sf2">SF2</option></select></label>
                <label id="magentaSfWrap">Sound <select id="sfSelect" className="border rounded px-1"><option value="sgm">General MIDI</option><option value="salamander">Salamander</option><option value="jazz">Jazz Kit</option><option value="synth">Synth</option></select></label>
                <label id="sf2Wrap" hidden>Bank <select id="sf2Select" className="border rounded px-1"><option value="generaluser">GeneralUser GS</option><option value="custom">Uploaded file…</option><option value="url">Custom URL…</option></select></label>
              </div>
              <div id="mixerBox" hidden>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">Section</span>
                  <Button className="h-8 px-3 text-sm" data-section="full">Full</Button>
                  <Button className="h-8 px-3 text-sm" data-section="verse">Verse</Button>
                  <Button className="h-8 px-3 text-sm" data-section="chorus">Chorus</Button>
                  <label className="text-sm"><input id="loopBox" type="checkbox" /> loop</label>
                  <span id="sectionTimes" className="text-xs font-mono" />
                </div>
                <div id="mixerRows" />
              </div>
              <div id="midiBox">
                {createElement('midi-player', { id: 'midiPlayer' })}
                {createElement('midi-visualizer', { id: 'midiViz', type: 'piano-roll' })}
                <p id="noMidi" className="text-muted-foreground">No MIDI yet — add a <code>\midi { }</code> block.</p>
              </div>
              <div id="sf2Box" hidden>
                <div className="flex items-center gap-2 mb-2">
                  <Button id="sf2Play" className="h-8 px-3 text-sm">Play</Button>
                  <Button id="sf2Pause" className="h-8 px-3 text-sm border border-input bg-background hover:bg-accent">Pause</Button>
                  <Button id="sf2Stop" className="h-8 px-3 text-sm border border-input bg-background hover:bg-accent">Stop</Button>
                  <input id="sf2Seek" type="range" min={0} max={1000} value={0} className="flex-1" />
                  <span id="sf2Time" className="text-xs font-mono">0:00 / 0:00</span>
                </div>
                <div className="text-sm mb-2">
                  <input id="sf2File" type="file" accept=".sf2,.sf3,.dls,.sfogg" hidden />
                  <input id="sf2Url" type="url" placeholder="https://…/bank.sf2 or .sf3" hidden />
                  <Button id="sf2LoadBtn" className="h-8 px-3 text-sm" hidden>Load bank</Button>
                  <Button id="sf2DeleteBtn" className="h-8 px-3 text-sm" hidden>Delete saved bank</Button>
                </div>
                <p id="sf2Status" className="text-sm text-muted-foreground">SF2 engine idle.</p>
              </div>
            </div>
          )}
        </section>
      </main>

    </div>
  )
}
