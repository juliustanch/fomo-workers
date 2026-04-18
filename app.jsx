// app.jsx — Fomo Workers upload app
// Single-screen mobile upload flow: project name → category → photos → submit

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Design tokens (tweakable via parent)
// ─────────────────────────────────────────────────────────────
const THEMES = {
  terracotta: {
    label: 'Terracotta',
    bg: 'oklch(0.975 0.012 75)',
    surface: '#ffffff',
    ink: 'oklch(0.22 0.018 55)',
    inkSoft: 'oklch(0.48 0.02 60)',
    inkFaint: 'oklch(0.72 0.015 60)',
    accent: 'oklch(0.66 0.14 42)',
    accentInk: '#ffffff',
    accentSoft: 'oklch(0.94 0.035 45)',
    success: 'oklch(0.68 0.11 150)',
    border: 'oklch(0.9 0.01 70)',
  },
  ocean: {
    label: 'Ocean',
    bg: 'oklch(0.975 0.01 220)',
    surface: '#ffffff',
    ink: 'oklch(0.22 0.02 240)',
    inkSoft: 'oklch(0.48 0.02 235)',
    inkFaint: 'oklch(0.72 0.015 235)',
    accent: 'oklch(0.6 0.13 230)',
    accentInk: '#ffffff',
    accentSoft: 'oklch(0.94 0.03 225)',
    success: 'oklch(0.68 0.11 150)',
    border: 'oklch(0.9 0.01 230)',
  },
  moss: {
    label: 'Moss',
    bg: 'oklch(0.975 0.012 130)',
    surface: '#ffffff',
    ink: 'oklch(0.22 0.018 140)',
    inkSoft: 'oklch(0.48 0.02 140)',
    inkFaint: 'oklch(0.72 0.015 140)',
    accent: 'oklch(0.56 0.11 145)',
    accentInk: '#ffffff',
    accentSoft: 'oklch(0.94 0.035 140)',
    success: 'oklch(0.68 0.11 150)',
    border: 'oklch(0.9 0.01 130)',
  },
  plum: {
    label: 'Plum',
    bg: 'oklch(0.975 0.01 330)',
    surface: '#ffffff',
    ink: 'oklch(0.22 0.02 330)',
    inkSoft: 'oklch(0.48 0.02 325)',
    inkFaint: 'oklch(0.72 0.015 325)',
    accent: 'oklch(0.56 0.14 330)',
    accentInk: '#ffffff',
    accentSoft: 'oklch(0.94 0.04 325)',
    success: 'oklch(0.68 0.11 150)',
    border: 'oklch(0.9 0.012 330)',
  },
  fomo: {
    label: 'FOMO Brand',
    bg: '#0D1B35',          // Deep Navy
    surface: '#1a2847',     // slightly lifted navy for cards
    ink: '#FFFFFF',         // white text
    inkSoft: '#c9d2e0',     // dimmed white for secondary
    inkFaint: '#8899AA',    // Caption Grey
    accent: '#FF7F41',      // FOMO Orange — used only for dividers/accents
    accentInk: '#0D1B35',   // navy on orange for contrast
    accentSoft: '#5B78A0',  // Slate Blue for soft surfaces
    success: '#7fd4a4',     // soft green retained for success toast only
    border: '#2a3a5c',      // subtle navy divider
  },
};

// ─────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'before',     label: 'Site survey',   icon: 'eye', hint: 'Before' },
  { id: 'install',    label: 'Installation',  icon: 'wrench' },
  { id: 'after',      label: 'Completion',    icon: 'check', hint: 'After' },
  { id: 'maintain',   label: 'Maintenance',   icon: 'gear' },
  { id: 'receipt',    label: 'Purchase receipt', icon: 'receipt' },
];

// Categories that don't need a project name
const NO_PROJECT_CATEGORIES = ['receipt'];

// ─────────────────────────────────────────────────────────────
// Inline icons — drawn with primitives only (lines, circles, rects)
// ─────────────────────────────────────────────────────────────
function Icon({ name, size = 26, color = 'currentColor', stroke = 2 }) {
  const p = { stroke: color, strokeWidth: stroke, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    wrench: <><path d="M17 5a4 4 0 00-5 5l-7 7 2 2 7-7a4 4 0 005-5l-2 2-2-2 2-2z" {...p}/></>,
    gear: <><circle cx="12" cy="12" r="3" {...p}/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" {...p}/></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" {...p}/><path d="M9 8h6M9 12h6M9 16h4" {...p}/></>,
    doc: <><path d="M7 3h8l4 4v14H7V3z" {...p}/><path d="M15 3v4h4" {...p}/><path d="M10 12h6M10 16h6" {...p}/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" {...p}/><circle cx="12" cy="12" r="3" {...p}/></>,
    check: <><path d="M4 12l5 5L20 6" {...p}/></>,
    camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4V8z" {...p}/><circle cx="12" cy="13" r="4" {...p}/></>,
    plus: <><path d="M12 5v14M5 12h14" {...p}/></>,
    x: <><path d="M6 6l12 12M6 18L18 6" {...p}/></>,
    image: <><rect x="3" y="5" width="18" height="14" rx="2" {...p}/><circle cx="9" cy="11" r="2" {...p}/><path d="M21 17l-5-5-8 8" {...p}/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" {...p}/><path d="M3 10h18M8 3v4M16 3v4" {...p}/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" {...p}/></>,
    sparkle: <><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" {...p}/></>,
    pin: <><path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" {...p}/><circle cx="12" cy="9" r="2.5" {...p}/></>,
    upload: <><path d="M12 16V4M6 10l6-6 6 6" {...p}/><path d="M4 20h16" {...p}/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>;
}

// ─────────────────────────────────────────────────────────────
// Tweakable defaults — persist via EDITMODE markers in index.html
// Populated via props from the host shell
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────
function FomoUploadApp({ themeKey = 'terracotta' }) {
  const theme = THEMES[themeKey] || THEMES.terracotta;
  const [project, setProject] = useState('');
  const [userName, setUserName] = useState(() => {
    try { return localStorage.getItem('fomo_user_name') || ''; } catch { return ''; }
  });
  const [category, setCategory] = useState(null);
  const [photos, setPhotos] = useState([]); // [{id, url, name}]
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(() => {
    if (typeof window !== 'undefined' && window.location && window.location.hash === '#preview-success') return 'done';
    return 'idle';
  });
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState('');
  const [now, setNow] = useState(new Date());
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // prefill some recent projects for the chip suggestions — loaded from localStorage
  const [recentProjects, setRecentProjects] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('fomo_recent_projects') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch { return []; }
  });

  const skipProject = NO_PROJECT_CATEGORIES.includes(category);
  const canSubmit = userName.trim() && (skipProject || project.trim()) && category && photos.length > 0 && !submitting;

  // Persist user name on change
  useEffect(() => {
    try {
      if (userName.trim()) localStorage.setItem('fomo_user_name', userName.trim());
    } catch {}
  }, [userName]);

  function addFiles(fileList) {
    const files = Array.from(fileList || []);
    const next = files.map((f) => ({
      id: Math.random().toString(36).slice(2),
      url: URL.createObjectURL(f),
      name: f.name,
      size: f.size,
    }));
    setPhotos((ps) => [...ps, ...next]);
  }

  function removePhoto(id) {
    setPhotos((ps) => ps.filter((p) => p.id !== id));
  }

  async function submit() {
    if (!canSubmit) return;
    setErrorMsg('');
    setSubmitting(true);
    setStatus('submitting');
    setProgress({ current: 0, total: photos.length });

    const FLOW_URL = "https://default52f4c70d6ff341fd9304e65f606937.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/8ef2b3f1b56344d2997f9da170afb050/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=QuBdzBKlAupD358CS7nyqwH-FUbemLuIIz_EzAN4QKg";

    async function compress(blob) {
      return new Promise((resolve) => {
        try {
          const img = new Image();
          img.onload = () => {
            try {
              const MAX = 1600;
              let { width, height } = img;
              if (width > MAX || height > MAX) {
                const ratio = Math.min(MAX / width, MAX / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
              }
              const canvas = document.createElement('canvas');
              canvas.width = width; canvas.height = height;
              canvas.getContext('2d').drawImage(img, 0, 0, width, height);
              canvas.toBlob(b => resolve(b || blob), 'image/jpeg', 0.8);
            } catch { resolve(blob); }
          };
          img.onerror = () => resolve(blob);
          img.src = URL.createObjectURL(blob);
        } catch { resolve(blob); }
      });
    }

    try {
      // Build Singapore-time filename prefix: YYYY-MM-DD_HHMM_Uploader
      const sgFmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Singapore',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(new Date());
      const get = (t) => sgFmt.find(p => p.type === t)?.value || '';
      const safeName = userName.trim().replace(/[^A-Za-z0-9 _-]/g, '').replace(/\s+/g, '-');
      const filePrefix = `${get('year')}-${get('month')}-${get('day')}_${get('hour')}${get('minute')}_${safeName}`;

      // If there's a note, send it first as a .txt file
      const noteText = note.trim();
      const extraItems = noteText ? 1 : 0;
      setProgress({ current: 0, total: photos.length + extraItems });

      if (noteText) {
        const header = [
          `Project: ${skipProject ? '(none)' : project.trim()}`,
          `Uploader: ${userName.trim()}`,
          `Category: ${CATEGORIES.find(c => c.id === category)?.label}`,
          `Submitted: ${new Date().toLocaleString('en-SG')}`,
          '',
          '--- Note ---',
          noteText,
        ].join('\n');
        const noteBlob = new Blob([header], { type: 'text/plain' });
        const noteB64 = await new Promise(res => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result.split(',')[1]);
          reader.readAsDataURL(noteBlob);
        });
        const notePayload = {
          project: skipProject ? '' : project.trim(),
          uploader: userName.trim(),
          category: CATEGORIES.find(c => c.id === category)?.label,
          timestamp: new Date().toISOString(),
          note: '',
          photos: [{ name: `${filePrefix}_NOTE.txt`, data: noteB64 }],
        };
        const noteRes = await fetch(FLOW_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notePayload),
        });
        if (!noteRes.ok) {
          const txt = await noteRes.text().catch(() => '');
          throw new Error(`Note: HTTP ${noteRes.status} ${txt.slice(0, 200)}`);
        }
        setProgress({ current: 1, total: photos.length + extraItems });
      }

      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        const originalBlob = await fetch(p.url).then(r => r.blob());
        const compressedBlob = await compress(originalBlob);
        const b64 = await new Promise(res => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result.split(',')[1]);
          reader.readAsDataURL(compressedBlob);
        });

        const payload = {
          project: skipProject ? '' : project.trim(),
          uploader: userName.trim(),
          category: CATEGORIES.find(c => c.id === category)?.label,
          timestamp: new Date().toISOString(),
          note: i === 0 ? note : '',
          photos: [{ name: `${filePrefix}_${String(i + 1).padStart(2, '0')}.jpg`, data: b64 }],
        };

        const res = await fetch(FLOW_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`Photo ${i + 1}: HTTP ${res.status} ${txt.slice(0, 200)}`);
        }
        setProgress({ current: (noteText ? 1 : 0) + i + 1, total: photos.length + extraItems });
      }
      // Save project to recents on success
      if (!skipProject && project.trim()) {
        saveRecentProject(project.trim());
      }
      setStatus('done');
    } catch (e) {
      console.error('Upload error:', e);
      setErrorMsg(String(e && e.message ? e.message : e));
      setStatus('idle');
    } finally {
      setSubmitting(false);
      setProgress({ current: 0, total: 0 });
    }
  }

  function saveRecentProject(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentProjects.filter(r => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
    setRecentProjects(updated);
    try { localStorage.setItem('fomo_recent_projects', JSON.stringify(updated)); } catch {}
  }

  function resetAll() {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setProject('');
    setCategory(null);
    setPhotos([]);
    setNote('');
    setStatus('idle');
  }

  const formattedDate = now.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' });
  const formattedTime = now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });

  // ───────────────────── Success overlay ─────────────────────
  if (status === 'done') {
    return <SuccessScreen theme={theme} project={project} category={CATEGORIES.find(c => c.id === category)} count={photos.length} uploader={userName.trim()} onDone={resetAll} />;
  }

  return (
    <div style={{
      height: '100%', background: theme.bg, color: theme.ink,
      fontFamily: '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 24 }} className="phone-scroll">
      {/* Header */}
      <div style={{ padding: '72px 22px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <img src="fomo-logo.png" alt="FOMO Energy" style={{ height: 22, display: 'block', marginBottom: 14 }} />
          <div style={{
            fontFamily: '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif',
            fontWeight: 700, fontSize: 26, lineHeight: 1.15, letterSpacing: -0.5,
          }}>
            Upload photos to Ops Team
          </div>
          <div style={{ marginTop: 6, color: theme.inkSoft, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="calendar" size={14} color={theme.inkFaint} stroke={2} />
            {formattedDate} · {formattedTime}
          </div>
        </div>
        {/* Fomo mark hidden when logo is shown in header */}
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div style={{ padding: '14px 18px 0' }}>
          <div style={{
            background: '#fee', border: '1px solid #fbb', color: '#900',
            borderRadius: 14, padding: '12px 14px', fontSize: 13, lineHeight: 1.4,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1, wordBreak: 'break-word' }}>
              <b>Upload failed</b><br />{errorMsg}
            </div>
            <button onClick={() => setErrorMsg('')} style={{
              all: 'unset', cursor: 'pointer', color: '#900', padding: 2,
            }}>
              <Icon name="x" size={14} stroke={2.4} />
            </button>
          </div>
        </div>
      )}

      {/* Intro card removed */}

      {/* 0. Name */}
      <Section theme={theme} step={1} title="What's your name?">
        <input
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="e.g. Bellal"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: theme.surface, color: theme.ink,
            border: `1px solid ${theme.border}`, borderRadius: 14,
            padding: '14px 16px', fontSize: 16, outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </Section>

      {/* 1. Project name (hidden for purchase receipts) */}
      {!skipProject && (
        <Section theme={theme} step={2} title="Which project?">
          <ProjectInput
            theme={theme}
            value={project}
            onChange={setProject}
            onCommit={saveRecentProject}
            recent={recentProjects}
          />
        </Section>
      )}

      {/* 2. Category */}
      <Section theme={theme} step={skipProject ? 2 : 3} title="What kind of upload?">
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 18px',
        }}>
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  all: 'unset', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  borderRadius: 14,
                  background: active ? theme.accent : theme.surface,
                  color: active ? theme.accentInk : theme.ink,
                  boxShadow: active
                    ? '0 4px 14px -6px ' + theme.accent
                    : '0 1px 0 ' + theme.border + ', inset 0 0 0 1px ' + theme.border,
                  transition: 'all 160ms ease',
                  minHeight: 52,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: active ? 'rgba(255,255,255,0.18)' : theme.accentSoft,
                  color: active ? theme.accentInk : theme.accent,
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <Icon name={c.icon} size={16} stroke={2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, letterSpacing: -0.2, lineHeight: 1.15 }}>{c.label}</div>
                  {c.hint && (
                    <div style={{
                      fontSize: 11, marginTop: 1,
                      color: active ? 'rgba(255,255,255,0.75)' : theme.inkFaint,
                    }}>{c.hint}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* 3. Photos */}
      <Section theme={theme} step={skipProject ? 3 : 4} title="Photos" subtitle={photos.length > 0 ? `${photos.length} selected` : 'Add as many as you need'}>
        <div style={{ padding: '0 18px' }}>
          {photos.length === 0 ? (
            <EmptyPhotoPicker theme={theme} onPick={() => fileRef.current?.click()} onCamera={() => cameraRef.current?.click()} />
          ) : (
            <PhotoGrid theme={theme} photos={photos} onRemove={removePhoto} onAdd={() => fileRef.current?.click()} onCamera={() => cameraRef.current?.click()} />
          )}
          <input
            ref={fileRef} type="file" accept="image/*" multiple
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            style={{ display: 'none' }}
          />
          <input
            ref={cameraRef} type="file" accept="image/*" capture="environment"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            style={{ display: 'none' }}
          />
        </div>
      </Section>

      {/* 4. Note (optional) */}
      <Section theme={theme} step={skipProject ? 4 : 5} title="Note" subtitle="Optional">
        <div style={{ padding: '0 18px' }}>
          <textarea
            placeholder="e.g. Replaced the condenser coil, tested at 18°C."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '14px 16px', borderRadius: 16,
              border: `1px solid ${theme.border}`,
              background: theme.surface, color: theme.ink,
              fontFamily: 'inherit', fontSize: 15, lineHeight: 1.45,
              resize: 'none', outline: 'none',
            }}
          />
        </div>
      </Section>

    </div>
      {/* Sticky submit bar — fixed footer below scrolling content */}
      <div style={{
        flexShrink: 0, zIndex: 30,
        padding: '14px 18px 38px',
        background: theme.bg,
        borderTop: `1px solid ${theme.border}`,
      }}>
        <button
          onClick={submit}
          disabled={!canSubmit}
          style={{
            all: 'unset', boxSizing: 'border-box', cursor: canSubmit ? 'pointer' : 'not-allowed',
            width: '100%', height: 58,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            borderRadius: 20,
            background: canSubmit ? theme.accent : theme.border,
            color: canSubmit ? theme.accentInk : theme.inkFaint,
            fontWeight: 700, fontSize: 16, letterSpacing: -0.1,
            boxShadow: canSubmit ? '0 12px 28px -12px ' + theme.accent : 'none',
            transition: 'all 200ms ease',
          }}
        >
          {submitting ? (
            <>
              <Spinner color={theme.accentInk} />
              {progress.total > 0 ? `Uploading ${progress.current} of ${progress.total}…` : 'Preparing…'}
            </>
          ) : (
            <>
              Send update
              <Icon name="arrow" size={18} color={canSubmit ? theme.accentInk : theme.inkFaint} stroke={2.4} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────
function Section({ step, title, subtitle, children, theme }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ padding: '0 22px 10px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{
          fontFamily: '"Fraunces", Georgia, serif', fontWeight: 500,
          fontSize: 13, color: theme.inkFaint, fontFeatureSettings: '"tnum"',
          fontStyle: 'italic',
        }}>
          {String(step).padStart(2, '0')}
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 13, color: theme.inkFaint, marginLeft: 'auto', paddingRight: 4 }}>
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Project input with recent-chip suggestions
// ─────────────────────────────────────────────────────────────
function ProjectInput({ theme, value, onChange, onCommit, recent }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ padding: '0 18px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: theme.surface, borderRadius: 18,
        padding: '0 14px',
        border: `1px solid ${focus ? theme.accent : theme.border}`,
        transition: 'border-color 160ms ease',
        boxShadow: focus ? `0 0 0 4px ${theme.accent}22` : 'none',
      }}>
        <Icon name="pin" size={20} color={theme.accent} stroke={2} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => { setFocus(false); if (onCommit && value && value.trim().length >= 2) onCommit(value); }}
          placeholder="e.g. 50 Jalan Jarak"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            padding: '16px 0', fontFamily: 'inherit', fontSize: 16, color: theme.ink,
          }}
        />
        {value && (
          <button onClick={() => onChange('')} style={{
            all: 'unset', cursor: 'pointer', color: theme.inkFaint,
            display: 'grid', placeItems: 'center',
          }}>
            <Icon name="x" size={16} stroke={2.2} />
          </button>
        )}
      </div>
      {recent.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: 12, color: theme.inkFaint, alignSelf: 'center', marginRight: 2 }}>Recent</span>
          {recent.map((r) => (
            <button key={r} onClick={() => onChange(r)} style={{
              all: 'unset', cursor: 'pointer',
              fontSize: 12.5, padding: '6px 10px', borderRadius: 999,
              border: `1px solid ${theme.border}`, color: theme.inkSoft,
              background: theme.surface,
            }}>{r}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Photo picker (empty & grid states)
// ─────────────────────────────────────────────────────────────
function EmptyPhotoPicker({ theme, onPick, onCamera }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <PickerTile theme={theme} icon="camera" label="Take photo" sub="Use camera" primary onClick={onCamera} />
      <PickerTile theme={theme} icon="image" label="From gallery" sub="Choose photos" onClick={onPick} />
    </div>
  );
}

function PickerTile({ theme, icon, label, sub, primary, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      minHeight: 176, borderRadius: 22,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 14,
      padding: '20px 16px',
      textAlign: 'center',
      background: primary ? theme.ink : theme.surface,
      color: primary ? theme.bg : theme.ink,
      boxShadow: primary
        ? '0 12px 28px -12px ' + theme.ink
        : '0 1px 0 ' + theme.border + ', inset 0 0 0 1px ' + theme.border,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: primary ? 'rgba(255,255,255,0.14)' : theme.accentSoft,
        color: primary ? theme.bg : theme.accent,
        display: 'grid', placeItems: 'center',
      }}>
        <Icon name={icon} size={40} stroke={2} />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: -0.2 }}>{label}</div>
        <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 3 }}>{sub}</div>
      </div>
    </button>
  );
}

function PhotoGrid({ theme, photos, onRemove, onAdd, onCamera }) {
  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
      }}>
        {photos.map((p) => (
          <div key={p.id} style={{
            position: 'relative', aspectRatio: '1 / 1',
            borderRadius: 14, overflow: 'hidden',
            background: theme.border,
          }}>
            <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button
              onClick={() => onRemove(p.id)}
              style={{
                all: 'unset', cursor: 'pointer',
                position: 'absolute', top: 6, right: 6,
                width: 24, height: 24, borderRadius: 999,
                background: 'rgba(0,0,0,0.62)', color: '#fff',
                display: 'grid', placeItems: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Icon name="x" size={14} stroke={2.4} />
            </button>
          </div>
        ))}
        {/* add tile */}
        <button onClick={onAdd} style={{
          all: 'unset', cursor: 'pointer',
          aspectRatio: '1 / 1', borderRadius: 14,
          border: `1.5px dashed ${theme.accent}`,
          background: theme.accentSoft,
          color: theme.accent,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <Icon name="plus" size={20} stroke={2.4} />
          <div style={{ fontSize: 11.5, fontWeight: 600 }}>Add more</div>
        </button>
      </div>
      <button onClick={onCamera} style={{
        all: 'unset', cursor: 'pointer', marginTop: 10,
        width: '100%', boxSizing: 'border-box',
        padding: '13px 14px', borderRadius: 14,
        background: theme.surface, border: `1px solid ${theme.border}`,
        color: theme.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontWeight: 600, fontSize: 14,
      }}>
        <Icon name="camera" size={18} color={theme.accent} stroke={2} />
        Take another with camera
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Success screen
// ─────────────────────────────────────────────────────────────
function SuccessScreen({ theme, project, category, count, uploader, onDone }) {
  const isPreview = typeof window !== 'undefined' && window.location && window.location.hash === '#preview-success';
  useEffect(() => {
    if (isPreview) return;
    const t = setTimeout(onDone, 10000);
    return () => clearTimeout(t);
  }, [onDone, isPreview]);

  return (
    <div style={{
      minHeight: '100%', background: theme.bg, color: theme.ink,
      fontFamily: '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif',
      padding: '80px 22px 60px',
      display: 'flex', flexDirection: 'column',
      animation: 'fadein 400ms ease',
    }}>
      <style>{`
        @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes pop { 0% { transform: scale(0.3); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes confetti {
          0% { transform: translate(0,0) rotate(0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate(var(--x), var(--y)) rotate(var(--r)); opacity: 0; }
        }
      `}</style>

      {/* confetti */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const angle = (i / 18) * Math.PI * 2;
          const dist = 180 + Math.random() * 100;
          const colors = [theme.accent, theme.success, theme.ink, theme.accent];
          return (
            <span key={i} style={{
              position: 'absolute', top: '30%', left: '50%',
              width: i % 3 === 0 ? 10 : 6, height: i % 3 === 0 ? 10 : 6,
              borderRadius: i % 2 === 0 ? 2 : 999,
              background: colors[i % colors.length],
              ['--x']: Math.cos(angle) * dist + 'px',
              ['--y']: Math.sin(angle) * dist + 'px',
              ['--r']: (Math.random() * 720 - 360) + 'deg',
              animation: `confetti ${1100 + Math.random() * 700}ms cubic-bezier(.2,.7,.3,1) forwards`,
              animationDelay: (i * 18) + 'ms',
            }} />
          );
        })}
      </div>

      {/* Check */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <div style={{
          width: 104, height: 104, borderRadius: 999,
          background: theme.success, color: '#fff',
          display: 'grid', placeItems: 'center',
          animation: 'pop 500ms cubic-bezier(.2,.7,.3,1)',
          boxShadow: '0 16px 40px -12px ' + theme.success,
        }}>
          <Icon name="check" size={56} color="#fff" stroke={3} />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <div style={{
          fontFamily: '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 32, letterSpacing: -0.6, lineHeight: 1.1,
        }}>
          <span>Thanks{uploader ? `, ${uploader}` : (isPreview ? ', Ahmad' : '')}!</span>
        </div>
        <div style={{ marginTop: 6, color: theme.inkSoft, fontSize: 15.5, lineHeight: 1.5, maxWidth: 300, margin: '6px auto 0' }}>
          {(count || 3)} photo{(count || 3) === 1 ? '' : 's'} filed under <b style={{ color: theme.ink }}>{project || 'Project Frontier'}</b>
          {category ? <> · <span>{category.label}</span></> : <> · <span>Installation</span></>}
        </div>

        <button onClick={onDone} style={{
          all: 'unset', cursor: 'pointer',
          marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 28px', borderRadius: 999,
          background: theme.accent, color: theme.accentInk,
          fontSize: 15.5, fontWeight: 600, letterSpacing: -0.2,
          boxShadow: '0 8px 24px -8px ' + theme.accent,
        }}>
          <Icon name="plus" size={16} color={theme.accentInk} stroke={2.4} />
          Upload another
        </button>
      </div>

      <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 12, color: theme.inkFaint }}>
        Auto-returning in 10 seconds…
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────
function Spinner({ color = '#fff' }) {
  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 800ms linear infinite' }}>
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="3" fill="none" strokeOpacity="0.25"/>
        <path d="M21 12a9 9 0 00-9-9" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
    </>
  );
}

Object.assign(window, { FomoUploadApp, THEMES });
