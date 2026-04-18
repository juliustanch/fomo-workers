// tweaks.jsx — floating color/theme Tweaks panel

const { useState: useTweakState, useEffect: useTweakEffect } = React;

function TweaksPanel({ themeKey, onChange }) {
  const [visible, setVisible] = useTweakState(false);

  useTweakEffect(() => {
    function onMsg(e) {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setVisible(true);
      if (d.type === '__deactivate_edit_mode') setVisible(false);
    }
    window.addEventListener('message', onMsg);
    // Only announce after listener is live
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!visible) return null;

  const options = Object.entries(THEMES);

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
      background: '#ffffff', color: '#111',
      borderRadius: 18, padding: 16,
      boxShadow: '0 14px 40px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.06)',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      width: 260,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: -0.2 }}>Tweaks</div>
        <div style={{ fontSize: 11, color: '#888' }}>Color theme</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {options.map(([key, t]) => {
          const active = key === themeKey;
          return (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                window.parent.postMessage({
                  type: '__edit_mode_set_keys',
                  edits: { themeKey: key },
                }, '*');
              }}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 12,
                border: `1.5px solid ${active ? t.accent : '#eee'}`,
                background: active ? t.accentSoft : '#fafafa',
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: 6,
                background: t.accent, flexShrink: 0,
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
              }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { TweaksPanel });
