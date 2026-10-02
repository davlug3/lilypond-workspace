import { createElement, useEffect, useRef, useState } from 'react'
import { Editor } from '@monaco-editor/react'
import { registerLilypond } from '@/lib/lilypondLanguage'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

declare global {
  interface Window {
    scheduleCompile: (immediate?: boolean) => void
  }
}

function TreeFiles({ node, depth, selected, onOpen }: { node: any; depth: number; selected: string; onOpen: (p: string) => void }) {
  return (
    <>
      {node.dirs.map((d: any) => (
        <details key={d.path} open={depth < 1}>
          <summary className="cursor-pointer font-medium hover:underline">{d.name}/</summary>
          <div className="pl-4">
            <TreeFiles node={d} depth={depth + 1} selected={selected} onOpen={onOpen} />
          </div>
        </details>
      ))}
      {node.files.map((f: any) => (
        <button key={f.path} type="button" className={`block w-full text-left py-0.5 hover:underline cursor-pointer ${f.path === selected ? 'font-semibold text-primary' : ''}`} onClick={() => onOpen(f.path)}>{f.name}</button>
      ))}
    </>
  )
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
  const [band, setBand] = useState<any>(null)
  const [newSection, setNewSection] = useState('')
  const [newToken, setNewToken] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newMidi, setNewMidi] = useState('')
  const [newClef, setNewClef] = useState('treble')
  const [scaffoldKind, setScaffoldKind] = useState<'part' | 'staff' | 'instrument' | 'voice' | 'polyphony'>('part')
  const { theme, setTheme } = useTheme()
  const monacoTheme = theme === 'dark' ? 'lilypond-dark' : theme === 'light' ? 'lilypond-light' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'lilypond-dark' : 'lilypond-light')
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
    if (!r.ok) {
      let msg = `${r.status} ${r.statusText}`
      try { const j = await r.json(); if (j.error) msg = j.error } catch { /* keep status text */ }
      throw new Error(msg)
    }
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

  const showCompileResult = (data: any, compiledLabel: string | null) => {
    setErrorLines([])
    setStale(false)
    if (data.success) {
      setHasGood(true)
      setStatus({ state: 'ok', text: `${data.pages} page(s)${compiledLabel ? ` (${compiledLabel})` : ''}` })
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
  }

  const runCompile = async () => {
    if (!code.trim()) return
    setStatus({ state: 'busy', text: 'compiling…' })
    // A section token (sections/<section>/<token>.ily) renders on its own —
    // just that section's music — not the whole song.
    const solo = selected.match(/^(.+)\/sections\/([^/]+)\/([^/]+)\.ily$/i)
    if (selected.toLowerCase().endsWith('.ily') && solo) {
      try {
        // Save the edited ily so the solo render picks it up.
        await api(`/api/file?name=${encodeURIComponent(selected)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = await api('/api/band/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: solo[1], section: solo[2], token: solo[3] }),
        })
        showCompileResult(data, data.label ?? `${solo[2]} · ${solo[3]}`)
      } catch (e) {
        setStatus({ state: 'err', text: 'request failed' })
        setLog((e as Error).message)
      }
      return
    }
    // Other `.ily` files are fragments; the server resolves their compilable
    // wrapper (sibling .ly, else the .ly whose \include graph references
    // them, preferring a "full" one) and compiles that instead.
    let compileCode = code
    let compileName = selected || 'score'
    if (selected && selected.toLowerCase().endsWith('.ily')) {
      try {
        // Save the edited ily so the wrapper's \include picks it up.
        await api(`/api/file?name=${encodeURIComponent(selected)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        compileCode = ''
      } catch {
        /* fall back to compiling the ily itself */
      }
    }
    try {
      const data = await api('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: compileCode, name: compileName }),
      })
      showCompileResult(data, data.name && data.name !== compileName ? data.name : null)
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
            setStatus({ state: 'ok', text: `${msg.pages} page(s)${msg.label ? ` (${msg.label})` : ''}` })
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

  const bandProjectOf = (name: string) => name.includes('/') ? name.split('/')[0] : null

  const loadBand = async (project: string | null) => {
    if (!project) { setBand(null); return }
    try {
      const j = await api(`/api/band?project=${encodeURIComponent(project)}`)
      setBand(j.sections ? j : null)
    } catch { setBand(null) }
  }

  // Refresh the band panel whenever the open file or tree changes.
  useEffect(() => { loadBand(bandProjectOf(selected)) }, [selected, tree])

  const bandMutate = async (url: string, init: RequestInit, what: string) => {
    try {
      const j = await api(url, init)
      setBand(j.structure ?? null)
      await refreshFiles()
      setStatus({ state: 'ok', text: what })
    } catch (e) {
      setLog(`${what} failed: ${(e as Error).message}`)
    }
  }

  const onAddSection = () => {
    const proj = bandProjectOf(selected)
    const name = newSection.trim()
    if (!proj || !name) return
    bandMutate('/api/band/section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: proj, section: name }),
    }, `section added: ${name}`).then(() => setNewSection(''))
  }

  const onDelSection = (s: string) => {
    const proj = bandProjectOf(selected)
    if (!proj) return
    if (!window.confirm(`Delete section "${s}" from ${proj}? Its files are removed and full-band.ly is restitched.`)) return
    bandMutate(`/api/band/section?project=${encodeURIComponent(proj)}&section=${encodeURIComponent(s)}`, { method: 'DELETE' }, `section deleted: ${s}`)
    if (selected.startsWith(`${proj}/sections/${s}/`)) loadFile(`${proj}/full-band.ly`)
  }

  const onAddToken = () => {
    const proj = bandProjectOf(selected)
    const name = newToken.trim()
    if (!proj || !name) return
    bandMutate('/api/band/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: proj, token: name, label: newLabel.trim(), midi: newMidi.trim(), clef: newClef }),
    }, `instrument added: ${name}`).then(() => { setNewToken(''); setNewLabel(''); setNewMidi('') })
  }

  const onDelToken = (t: string) => {
    const proj = bandProjectOf(selected)
    if (!proj) return
    if (!window.confirm(`Delete instrument "${t}" from ${proj}? Its files, stitches, and score staff are removed.`)) return
    bandMutate(`/api/band/token?project=${encodeURIComponent(proj)}&token=${encodeURIComponent(t)}`, { method: 'DELETE' }, `instrument deleted: ${t}`)
    if (selected.startsWith(`${proj}/sections/`) && selected.endsWith(`/${t}.ily`)) loadFile(`${proj}/full-band.ly`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">My Workspace<span className="text-primary">.</span></h1>
          <p className="text-xs text-muted-foreground">{version}</p>
        </div>
        <div className="header-actions flex items-center gap-3">
          <label className="text-sm flex items-center gap-1">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> auto-preview
          </label>
          <button type="button" className="text-xs rounded border px-2 py-1" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle light/dark mode">
            {theme === 'dark' ? '☾ Dark' : '☀ Light'}
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.state === 'err' ? 'bg-destructive/10 text-destructive' : status.state === 'busy' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-green-500/10 text-green-600'}`} aria-live="polite">{status.text}</span>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-2 p-2 md:p-4">

        <section className="min-w-0 w-full lg:w-[var(--split)]" style={{ ['--split']: `${split}%` } as any}>
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
            <Button id="newBtn" variant="outline" size="sm" onClick={onScaffold}>+ New</Button>
            <Button id="saveBtn" variant="outline" size="sm" onClick={onSave}>Save</Button>
            <Button id="compileBtn" size="sm" onClick={() => runCompile()}>Compile ▶</Button>
          </div>

          <details id="dirPanel" className="border rounded mb-2" open>
            <summary className="p-2 font-semibold cursor-pointer">Files &amp; presets</summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t">
              <section className="p-3 border-r">
                <h3 className="text-xs uppercase text-muted-foreground mb-2">Presets <span className="normal-case">read-only</span></h3>
                <ul className="space-y-1 text-sm max-h-48 overflow-auto">
                  {presets.map((p) => (
                    <li key={p.name} className="flex items-center justify-between gap-2">
                      <span>{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.files.length} files</span>
                      <Button size="sm" onClick={() => onPresetUse(p.name)}>Use</Button>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="p-3">
                <h3 className="text-xs uppercase text-muted-foreground mb-2">Workspace</h3>
                <div id="workspaceTree" className="text-sm max-h-64 overflow-auto">
                  {tree && (tree.dirs.length > 0 || tree.files.length > 0) ? (
                    <ul className="space-y-0.5">
                      <TreeFiles node={tree} depth={0} selected={selected} onOpen={loadFile} />
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Empty — pick a preset.</p>
                  )}
                </div>
              </section>
            </div>
          </details>

          {band && (
            <details id="bandPanel" className="border rounded mb-2">
              <summary className="p-2 font-semibold cursor-pointer">Sections &amp; instruments <span className="text-xs font-normal text-muted-foreground">({band.project})</span></summary>
              <div className="p-3 border-t space-y-3 text-sm">
                <div>
                  <h3 className="text-xs uppercase text-muted-foreground mb-1">Sections</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {band.sections.map((s: any) => (
                      <span key={s.name} className="inline-flex items-center gap-1 border rounded px-2 py-0.5">
                        {s.name}
                        <button type="button" aria-label={`Delete section ${s.name}`} title={`Delete section ${s.name}`} disabled={band.sections.length <= 1} className="text-destructive hover:underline disabled:opacity-30" onClick={() => onDelSection(s.name)}>✕</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input id="newSection" className="border rounded px-2 py-1 text-sm flex-1 min-w-0" placeholder="new section (e.g. bridge)" value={newSection} onChange={(e) => setNewSection(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onAddSection() }} />
                    <Button size="sm" variant="outline" onClick={onAddSection}>+ Section</Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs uppercase text-muted-foreground mb-1">Instruments</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {band.tokens.map((t: string) => (
                      <span key={t} className="inline-flex items-center gap-1 border rounded px-2 py-0.5">
                        {t}
                        <button type="button" aria-label={`Delete instrument ${t}`} title={`Delete instrument ${t}`} className="text-destructive hover:underline" onClick={() => onDelToken(t)}>✕</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <input id="newToken" className="border rounded px-2 py-1 text-sm flex-1 min-w-24" placeholder="name (e.g. horns)" value={newToken} onChange={(e) => setNewToken(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onAddToken() }} />
                    <input id="newTokenLabel" className="border rounded px-2 py-1 text-sm flex-1 min-w-24" placeholder="label (optional)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                    <input id="newTokenMidi" className="border rounded px-2 py-1 text-sm flex-1 min-w-24" placeholder="midi (optional)" value={newMidi} onChange={(e) => setNewMidi(e.target.value)} />
                    <select id="newTokenClef" className="border rounded px-1 py-1 text-sm" value={newClef} onChange={(e) => setNewClef(e.target.value)}>
                      <option value="treble">treble</option>
                      <option value="treble_8">treble_8</option>
                      <option value="bass">bass</option>
                      <option value="alto">alto</option>
                      <option value="tenor">tenor</option>
                    </select>
                    <Button size="sm" variant="outline" onClick={onAddToken}>+ Instrument</Button>
                  </div>
                </div>
              </div>
            </details>
          )}

          <div className="w-full h-[45vh] lg:h-96 border rounded overflow-hidden">
            <Editor
              theme={monacoTheme}
              height="100%"
              defaultLanguage="lilypond"
              onMount={(editor, monaco) => {
                registerLilypond(monaco)
                if (editor.getModel()) monaco.editor.setModelLanguage(editor.getModel(), 'lilypond')
                monaco.editor.setTheme(monacoTheme)
              }}
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

        <section className="min-w-0 w-full lg:w-[var(--remain)]" style={{ ['--remain']: `${100 - split}%` } as any}>
          {errorLines.length > 0 && (
            <div id="errorBanner" role="alert" className="mb-2 p-3 border border-destructive rounded bg-destructive/5 text-sm text-destructive">
              <strong>Compile errors:</strong>
              <ul className="list-disc pl-5">{errorLines.map((l, i) => <li key={i}>{l}</li>)}</ul>
            </div>
          )}
          <nav className="flex items-center gap-2 mb-2">
            {(['png', 'pdf', 'midi'] as const).map((t) => (
              <Button key={t} size="sm" variant={tab === t ? 'default' : 'outline'} onClick={() => setTab(t)}>{t.toUpperCase()}</Button>
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
              <iframe id="pdfFrame" title="PDF preview" className="w-full h-[50vh] lg:h-[70vh] border rounded" src={pdfUrl ?? undefined} style={{ opacity: pdfOpacity }} />
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
                  <Button size="sm" data-section="full">Full</Button>
                  <Button size="sm" data-section="verse">Verse</Button>
                  <Button size="sm" data-section="chorus">Chorus</Button>
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
                  <Button id="sf2Play" size="sm">Play</Button>
                  <Button id="sf2Pause" variant="outline" size="sm">Pause</Button>
                  <Button id="sf2Stop" variant="outline" size="sm">Stop</Button>
                  <input id="sf2Seek" type="range" min={0} max={1000} value={0} className="flex-1" />
                  <span id="sf2Time" className="text-xs font-mono">0:00 / 0:00</span>
                </div>
                <div className="text-sm mb-2">
                  <input id="sf2File" type="file" accept=".sf2,.sf3,.dls,.sfogg" hidden />
                  <input id="sf2Url" type="url" placeholder="https://…/bank.sf2 or .sf3" hidden />
                  <Button id="sf2LoadBtn" variant="outline" size="sm" hidden>Load bank</Button>
                  <Button id="sf2DeleteBtn" variant="outline" size="sm" hidden>Delete saved bank</Button>
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
