import { terminals } from '../../models/luggageModels.jsx';

export function FormInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function SelectInput({ label, value, onChange, placeholder }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {terminals.map((terminal) => <option key={terminal}>{terminal}</option>)}
      </select>
    </label>
  );
}

export function SummaryLine({ label, value }) {
  return <p><span>{label}</span><strong>{value}</strong></p>;
}

export function Detail({ label, value, link }) {
  return <p><span>{label}</span><strong className={link ? 'link' : ''}>{value}</strong></p>;
}
