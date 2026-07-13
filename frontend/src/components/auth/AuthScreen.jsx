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
            <p>Secure, role-scoped access for passengers, terminal officers, company operations, and system administration.</p>
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
          {!isRegister && <label className="form-field"><span>Login as</span><select value={form.selectedRole} onChange={(event) => setForm({ ...form, selectedRole: event.target.value })}>{[
            ['CUSTOMER', 'Customer / Passenger'], ['TERMINAL_OFFICER', 'Terminal Officer / Luggage Attendant'], ['BUS_COMPANY_ADMINISTRATOR', 'Bus Company Administrator'], ['SUPER_ADMINISTRATOR', 'Super Administrator']
          ].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
          {error && <p className="auth-error">{error}</p>}
          <button className="solid-button full">{isRegister ? 'Create Account' : 'Login'}</button>
          <div className="demo-logins">
            <span>Customer: user@safiribag.co.tz / user123</span>
            <span>Officer: officer@safiribag.co.tz / officer123</span>
            <span>Company: company@safiribag.co.tz / company123</span>
            <span>Super admin: superadmin@safiribag.co.tz / admin123</span>
          </div>
        </form>
      </section>
    </main>
  );
}
