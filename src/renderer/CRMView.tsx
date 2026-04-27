import { useEffect, useMemo, useState } from 'react'
import type { Contact, ContactType } from '../shared/types'
import styles from './CRMView.module.css'

type ContactDraft = Partial<Contact>

interface ListResult {
  ok: boolean
  contacts?: Contact[]
  error?: string
}

interface MutationResult {
  ok: boolean
  contact?: Contact
  error?: string
}

async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return (await window.api.invoke(channel, ...args)) as T
}

export function CRMView(): JSX.Element {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<ContactDraft>({})
  const [error, setError] = useState<string | null>(null)

  const load = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const result = await invoke<ListResult>('rose-crm:list')
      if (result.ok) setContacts(result.contacts ?? [])
      else setError(result.error ?? 'Failed to load contacts')
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const doSave = async (): Promise<void> => {
    setError(null)
    try {
      const channel = editingId ? 'rose-crm:update' : 'rose-crm:create'
      const result = await invoke<MutationResult>(channel, form)
      if (result.ok) {
        setForm({})
        setEditingId(null)
        setShowCreate(false)
        await load()
      } else {
        setError(result.error ?? 'Save failed')
      }
    } catch (err) {
      setError((err as Error).message ?? 'Save failed')
    }
  }

  const doDelete = async (id: string): Promise<void> => {
    setError(null)
    try {
      const result = await invoke<MutationResult>('rose-crm:delete', id)
      if (result.ok) await load()
      else setError(result.error ?? 'Delete failed')
    } catch (err) {
      setError((err as Error).message ?? 'Delete failed')
    }
  }

  const edit = (c: Contact): void => {
    setForm({ ...c })
    setEditingId(c.id)
    setShowCreate(true)
  }

  const startCreate = (): void => {
    setForm({ type: 'person' })
    setEditingId(null)
    setShowCreate(true)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.company ?? '').toLowerCase().includes(q) ||
        (c.notes ?? '').toLowerCase().includes(q) ||
        (c.tags ?? []).join(' ').toLowerCase().includes(q)
    )
  }, [contacts, search])

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
      <div className={styles.header}>
        <h1 className={styles.title}>CRM</h1>
        <button className={styles.btn} onClick={() => void load()} disabled={loading}>
          ↻ Refresh
        </button>
        <button className={styles.btnPrimary} onClick={startCreate}>
          ＋ New
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.searchRow}>
        <input
          className={styles.searchInput}
          placeholder="Search by name, email, company, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className={styles.count}>
          {filtered.length} of {contacts.length}
        </span>
      </div>

      {loading && <div className={styles.center}>Loading…</div>}

      {showCreate && (
        <div className={styles.modal}>
          <div className={styles.modalInner}>
            <h2>{editingId ? 'Edit' : 'Create'} Contact</h2>

            <label className={styles.label}>Type</label>
            <select
              className={styles.input}
              value={form.type ?? 'person'}
              onChange={(e) => setForm({ ...form, type: e.target.value as ContactType })}
            >
              <option value="person">Person</option>
              <option value="place">Place</option>
            </select>

            <label className={styles.label}>Name *</label>
            <input
              className={styles.input}
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name or place name"
            />

            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <label className={styles.label}>Phone</label>
            <input
              className={styles.input}
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <label className={styles.label}>Company / Place</label>
            <input
              className={styles.input}
              value={form.company ?? ''}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />

            <label className={styles.label}>Tags (comma-separated)</label>
            <input
              className={styles.input}
              value={(form.tags ?? []).join(', ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                })
              }
            />

            <label className={styles.label}>Notes</label>
            <textarea
              className={styles.textarea}
              rows={4}
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <div className={styles.modalActions}>
              <button className={styles.btn} onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={() => void doSave()}
                disabled={!form.name?.trim()}
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className={styles.list}>
          {filtered.length === 0 && (
            <div className={styles.center}>
              {contacts.length === 0
                ? 'No contacts yet. Click ＋ New to add one.'
                : 'No matches found.'}
            </div>
          )}

          {filtered.map((c) => (
            <div className={styles.card} key={c.id}>
              <div className={styles.cardHeader}>
                <span className={styles.badge}>
                  {c.type === 'place' ? '📍' : '👤'} {c.type}
                </span>
                <h3 className={styles.cardName}>{c.name}</h3>
                <div className={styles.cardActions}>
                  <button className={styles.btnSmall} onClick={() => edit(c)}>
                    Edit
                  </button>
                  <button
                    className={styles.btnSmallDanger}
                    onClick={() => void doDelete(c.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                {c.email && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Email</span>
                    <span>{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Phone</span>
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.company && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Company</span>
                    <span>{c.company}</span>
                  </div>
                )}
                {c.notes && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Notes</span>
                    <span className={styles.notes}>{c.notes}</span>
                  </div>
                )}
                {c.tags && c.tags.length > 0 && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Tags</span>
                    <div className={styles.tagList}>
                      {c.tags.map((t) => (
                        <span className={styles.tag} key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {c.updatedAt && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Updated</span>
                    <span>{new Date(c.updatedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
