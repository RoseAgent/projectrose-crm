export function CRMSettings(): JSX.Element {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
          About
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
          Contacts are stored per-project at <code>.projectrose/crm/contacts.json</code>. No external API required.
        </p>
      </div>
    </div>
  )
}
