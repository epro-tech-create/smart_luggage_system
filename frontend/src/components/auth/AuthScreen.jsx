import { LockKeyhole, Package, UserPlus } from 'lucide-react';
import { FormInput } from '../common/FormControls.jsx';

export function AuthScreen({ mode, setMode, form, setForm, error, onSubmit }) {
  const isRegister = mode === 'register';
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <div className="auth-brand">
            <div className="brand-icon"><Package size={26} /></div>
            <div><strong>SafiriBag</strong><span>Smart Luggage Tracking System</span></div>
          </div>
          <div className="auth-copy">
            <h1>{isRegister ? 'Create your luggage account' : 'Login to continue'}</h1>
            <p>Secure access keeps each user linked to their own luggage records, while admins can manage the full terminal system.</p>
          </div>
        </div>
        <form className="auth-card" onSubmit={onSubmit}>
          <div className="auth-tabs">
            <button type="button" className={!isRegister ? 'active' : ''} onClick={() => setMode('login')}><LockKeyhole size={16} />Login</button>
            <button type="button" className={isRegister ? 'active' : ''} onClick={() => setMode('register')}><UserPlus size={16} />Register</button>
          </div>
          {isRegister && <FormInput label="Full Name" value={form.fullName} placeholder="e.g. Amina Juma Bakari" onChange={(v) => setForm({ ...form, fullName: v })} />}
          <FormInput label="Email Address" type="email" value={form.email} placeholder="you@example.com" onChange={(v) => setForm({ ...form, email: v })} />
          {isRegister && <FormInput label="Phone Number" value={form.phoneNumber} placeholder="+255 7XX XXX XXX" onChange={(v) => setForm({ ...form, phoneNumber: v })} />}
          <FormInput label="Password" type="password" value={form.password} placeholder="Minimum 6 characters" onChange={(v) => setForm({ ...form, password: v })} />
          {error && <p className="auth-error">{error}</p>}
          <button className="solid-button full">{isRegister ? 'Create Account' : 'Login'}</button>
          <div className="demo-logins">
            <span>Demo admin: admin@safiribag.co.tz / admin123</span>
            <span>Demo user: user@safiribag.co.tz / user123</span>
          </div>
        </form>
      </section>
    </main>
  );
}
