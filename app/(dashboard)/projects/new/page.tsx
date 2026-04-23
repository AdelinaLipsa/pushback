import NewProjectForm from '@/components/project/NewProjectForm'

export default function NewProjectPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '560px' }}>
      <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>New project</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Add a client project. You can link a contract later.
      </p>
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '2rem' }}>
        <NewProjectForm />
      </div>
    </div>
  )
}
