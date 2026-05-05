import { GoogleAuthButton } from "@/components/auth/google-auth-button";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="admin-card w-full max-w-md p-8">
        <h1 className="text-3xl font-semibold text-[var(--admin-text)]">Autentificare admin</h1>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">
          Accesul in panoul de administrare este permis exclusiv prin Google pentru conturile care au rol admin activ.
        </p>
        {params.error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </div>
        ) : null}
        <div className="mt-6 space-y-4">
          <GoogleAuthButton
            className="inline-flex w-full items-center justify-center rounded-full border border-[var(--admin-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--admin-text)] transition hover:border-[var(--admin-accent)] hover:bg-[var(--admin-bg-muted)]"
            label="Continua cu Google"
            redirectTo="/admin"
          />
        </div>
        <p className="mt-6 text-xs leading-6 text-[var(--admin-muted)]">
          Contul Google trebuie sa existe in Supabase Auth si sa aiba rol admin in
          <code className="mx-1 rounded bg-[var(--admin-bg-muted)] px-1.5 py-0.5 text-[11px]">
            role_memberships
          </code>
          pentru a intra in panou.
        </p>
      </div>
    </div>
  );
}
