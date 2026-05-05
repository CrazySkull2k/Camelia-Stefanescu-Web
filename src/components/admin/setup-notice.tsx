export function SetupNotice() {
  return (
    <div className="admin-card p-6">
      <h2 className="text-xl font-semibold text-[var(--admin-text)]">
        Configurare necesara
      </h2>
      <p className="mt-2 text-sm text-[var(--admin-muted)]">
        Configureaza variabilele Supabase, Resend si Google Calendar pentru a activa
        administrarea completa. Codul si migrarile sunt pregatite, dar mediul local nu are
        inca secretele necesare.
      </p>
    </div>
  );
}
