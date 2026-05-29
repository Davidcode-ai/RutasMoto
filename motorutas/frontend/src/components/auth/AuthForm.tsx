import { useState } from 'react';
import { login, register } from '@/stores/auth';

type Props = { mode: 'login' | 'register' };

export default function AuthForm({ mode }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ username, email, password, pace_base: 'intermedio' });
      }
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="no-scrollbar-x flex min-h-app w-full min-w-0 flex-col justify-center px-4 pb-safe">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">MotoRutas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta de motero'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        {mode === 'register' && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Usuario</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-press w-full rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground disabled:opacity-50"
        >
          {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Registrarse'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === 'login' ? (
          <>
            ¿No tienes cuenta?{' '}
            <a href="/auth/registro" className="font-semibold text-primary">
              Regístrate
            </a>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{' '}
            <a href="/auth/login" className="font-semibold text-primary">
              Inicia sesión
            </a>
          </>
        )}
      </p>
    </main>
  );
}
