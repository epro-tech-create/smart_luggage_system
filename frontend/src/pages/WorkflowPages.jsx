import { ChevronRight, Minus, Plus, RefreshCw, Signal, Wallet, Zap } from 'lucide-react';
import { paymentProviders, demoRows } from '../models/luggageModels.jsx';
import { CostRows, Stepper } from '../components/common/ProcessWidgets.jsx';
import { FormInput, SelectInput, SummaryLine } from '../components/common/FormControls.jsx';

export function WeighScreen({ weight, setWeight, category, setCategory, totalDue, onNavigate }) {
  return (
    <div className="workflow-page">
      <Stepper step={1} />
      <div className="center-title"><h1>Step 1 - Weigh Luggage</h1><p>Place luggage on the digital scale. Confirm weight before proceeding.</p></div>
      <div className="weigh-grid">
        <div>
          <ScaleDisplay weight={weight} />
          <div className="card control-card">
            <p className="section-label">ADJUST WEIGHT</p>
            <div className="weight-control">
              <button onClick={() => setWeight(Math.max(1, weight - 1))}><Minus size={18} /></button>
              <input type="range" min="1" max="45" value={weight} onChange={(event) => setWeight(Number(event.target.value))} />
              <button onClick={() => setWeight(weight + 1)}><Plus size={18} /></button>
            </div>
            <div className="chip-row">{[5, 10, 15, 20, 25, 30, 35, 40].map((value) => <button className={weight === value ? 'selected' : ''} key={value} onClick={() => setWeight(value)}>{value}</button>)}</div>
          </div>
          <div className="card control-card">
            <p className="section-label">LUGGAGE CATEGORY</p>
            <div className="chip-row category-row">{['Bag', 'Box', 'Suitcase', 'Fragile', 'Oversized'].map((name) => <button className={category === name ? 'selected' : ''} key={name} onClick={() => setCategory(name)}>{name}</button>)}</div>
          </div>
        </div>
        <PricingPreview weight={weight} totalDue={totalDue} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export function ConfirmScreen({ weight, category, totalDue, confirmed, setConfirmed, onNavigate }) {
  return (
    <div className="workflow-page">
      <Stepper step={2} />
      <div className="center-title"><h1>Step 2 - Confirm Your Luggage Cost</h1><p>Please review the charges below. Check the box to confirm and proceed.</p></div>
      <div className="confirm-card card">
        <div className="confirm-top"><span>YOUR LUGGAGE WEIGHT</span><strong>{weight.toFixed(1)} <small>kg</small></strong><p>{category}</p></div>
        <CostRows weight={weight} totalDue={totalDue} />
        <label className="confirm-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />I confirm the above weight and charges are correct and agree to proceed with registration.</label>
      </div>
      <div className="workflow-actions">
        <button className="ghost-button" onClick={() => onNavigate('weigh')}><RefreshCw size={17} />Dispute / Reweigh</button>
        <button className="solid-button" disabled={!confirmed} onClick={() => onNavigate('register')}>Confirmed - Register <ChevronRight size={18} /></button>
      </div>
    </div>
  );
}

export function RegisterScreen({ form, setForm, weight, category, totalDue, onSubmit, onNavigate }) {
  return (
    <div className="workflow-page">
      <Stepper step={3} />
      <div className="center-title leftish"><h1>Step 3 - Register Luggage</h1><p>Cost confirmed: <strong>TSh {totalDue.toLocaleString()}</strong> - {weight.toFixed(1)} kg - {category}</p></div>
      <form className="register-form card" onSubmit={onSubmit}>
        <FormInput label="Passenger Full Name" value={form.passenger} placeholder="e.g. Amina Juma Bakari" onChange={(v) => setForm({ ...form, passenger: v })} />
        <FormInput label="Phone Number" value={form.phone} placeholder="+255 7XX XXX XXX" onChange={(v) => setForm({ ...form, phone: v })} />
        <FormInput label="National ID / Passport" value={form.nationalId} placeholder="19XXXXXXXXX" onChange={(v) => setForm({ ...form, nationalId: v })} />
        <FormInput label="Luggage Description" value={form.description} placeholder="e.g. Brown leather suitcase" onChange={(v) => setForm({ ...form, description: v })} />
        <SelectInput label="Origin Terminal" value={form.origin} placeholder="Select origin" onChange={(v) => setForm({ ...form, origin: v })} />
        <SelectInput label="Destination Terminal" value={form.destination} placeholder="Select destination" onChange={(v) => setForm({ ...form, destination: v })} />
        <FormInput label="Bus Number" value={form.bus} placeholder="e.g. DX-4521" onChange={(v) => setForm({ ...form, bus: v })} />
        <FormInput label="Departure Time" type="time" value={form.departure} onChange={(v) => setForm({ ...form, departure: v })} />
        <FormInput label="Declared Value (TSh)" value={form.declaredValue} placeholder="e.g. 250,000" onChange={(v) => setForm({ ...form, declaredValue: v })} />
        <label className="toggle-row"><button type="button" className={`toggle ${form.fragile ? 'on' : ''}`} onClick={() => setForm({ ...form, fragile: !form.fragile })}><span /></button>Fragile / Handle with Care</label>
        <div className="form-footer">
          <button type="button" className="ghost-button" onClick={() => onNavigate('confirm')}>Back</button>
          <button className="solid-button">Register & Assign RFID <Signal size={17} /></button>
        </div>
      </form>
    </div>
  );
}

export function PaymentScreen({ row, provider, setProvider, phone, setPhone, totalDue, onPay }) {
  const active = row || demoRows[0];
  return (
    <div className="workflow-page payment-page">
      <Stepper step={4} />
      <div className="center-title payment-title"><h1>Step 4 - Make Payment</h1><p>Pay via mobile money to activate RFID tracking for your luggage.</p></div>
      <div className="payment-summary">
        <SummaryLine label="Passenger" value={active.passenger} />
        <SummaryLine label="Route" value={active.route} />
        <SummaryLine label="Weight" value={`${active.weight || 15}.0 kg - Bag`} />
        <SummaryLine label="RFID Tag" value={`${active.rfid || 'RF-Z7A8'} (pending activation)`} />
        <div className="summary-total"><strong>Total Amount</strong><b>TSh {Number(active.amount || totalDue).toLocaleString()}</b></div>
      </div>
      <div className="card provider-card">
        <h3>Select Payment Provider</h3>
        <div className="provider-grid">
          {paymentProviders.map((item) => <button className={provider === item.name ? 'active' : ''} key={item.name} onClick={() => setProvider(item.name)}><span className={item.color}><Wallet size={20} /></span><strong>{item.name}</strong><small>{item.brand}</small></button>)}
        </div>
        <FormInput label="Mobile Number" value={phone} placeholder="+255 7XX XXX XXX" onChange={setPhone} />
        <p>You will receive an SMS prompt to confirm</p>
        <button className="solid-button full" onClick={onPay}>Pay TSh {Number(active.amount || totalDue).toLocaleString()} <Zap size={18} /></button>
      </div>
    </div>
  );
}

function ScaleDisplay({ weight }) {
  return <div className="scale-display"><span>GROSS WEIGHT - DIGITAL SCALE</span><strong>{weight.toFixed(1).padStart(5, '0')}</strong><b>kg</b><div className="bars">{Array.from({ length: 10 }).map((_, index) => <i key={index} style={{ height: 10 + index * 5 }} />)}</div></div>;
}

function PricingPreview({ weight, totalDue, onNavigate }) {
  return <div className="card pricing-card"><h2>Pricing Preview <span>Operator View</span></h2><CostRows weight={weight} totalDue={totalDue} compact /><button className="solid-button full" onClick={() => onNavigate('confirm')}>Show Cost to Customer <ChevronRight size={18} /></button><p>Customer confirms cost on next screen</p></div>;
}
