import { AlertTriangle, CheckCircle2, Package, QrCode, Trash2 } from 'lucide-react';
import { Detail, FormInput } from '../components/common/FormControls.jsx';
import { EventsFeed, ManifestPanel } from '../components/common/ProcessWidgets.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';

export function TrackingScreen({ livePulse }) {
  const alertCount = 3 + (livePulse % 2);
  return (
    <div className="tracking-page">
      <div className="page-title-row">
        <div><h1>Live Luggage Tracking</h1><p>RFID sensors detect luggage on each bus - GPS locates buses in real-time</p></div>
        <div className="tracking-pills"><span className="warn"><AlertTriangle size={17} />{alertCount} alerts</span><span className="live-dot">Live - RFID Active</span></div>
      </div>
      <div className="tracking-layout">
        <FleetList />
        <RouteMap livePulse={livePulse} />
        <div className="side-stack"><ManifestPanel /><EventsFeed livePulse={livePulse} /></div>
      </div>
    </div>
  );
}

export function VerifyScreen({ manualCode, setManualCode, onVerify }) {
  return (
    <div className="verification-page">
      <div className="floating-alert"><CheckCircle2 size={22} /><span><strong>Luggage Arrived at Destination!</strong>TZ-2024-00887 - Ali Mohamed Juma - now at Moshi Terminal. PIN required for pickup.</span></div>
      <div className="center-title verification-title"><h1>QR / RFID Verification</h1><p>Scan tag or enter ID to verify</p></div>
      <div className="verify-grid">
        <div className="card scanner-card">
          <h3>Scanner</h3>
          <div className="scanner-box"><QrCode size={52} /><p>Point scanner at QR code or RFID tag</p></div>
          <button className="solid-button full" onClick={onVerify}><QrCode size={18} />Start Scan</button>
        </div>
        <div>
          <div className="card manual-card">
            <h3>Manual Entry</h3>
            <FormInput label="Tracking ID or RFID Tag" value={manualCode} placeholder="TZ-2024-XXXXX or RF-XXXX" onChange={setManualCode} />
            <button className="outline-green full" onClick={onVerify}>Verify</button>
          </div>
          <div className="card recent-card">
            <h3>Recent Verifications</h3>
            {['TZ-2024-00888   RF-B2C3   11:42   Verified', 'TZ-2024-00875   RF-D4E5   11:38   Verified', 'TZ-2024-00861   RF-????   11:30   Failed'].map((text) => <p key={text}>{text}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PickupScreen({ row, pin, setPin, addPinDigit, deletePinDigit }) {
  return (
    <div className="pickup-page">
      <div className="center-title"><h1>Pickup PIN Confirmation</h1><p>Enter 4-digit PIN to release luggage</p></div>
      <div className="pickup-luggage card">
        <div className="pickup-main"><span><Package size={24} /></span><div><h3>{row.id}</h3><p>{row.passenger}</p></div><StatusBadge status={row.status} /></div>
        <div className="pickup-details"><Detail label="Route" value={row.route} /><Detail label="RFID Tag" value={row.rfid} link /></div>
      </div>
      <div className="pin-pad card">
        <div className="pin-dots">{[0, 1, 2, 3].map((dot) => <span className={pin.length > dot ? 'filled' : ''} key={dot} />)}</div>
        <div className="key-grid">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => <button key={digit} onClick={() => addPinDigit(digit)}>{digit}</button>)}<i /><button onClick={() => addPinDigit(0)}>0</button><button className="delete-key" onClick={deletePinDigit}><Trash2 size={20} /></button></div>
        <p>Hint: {row.pin}</p>
        {pin.length === 4 && <button className="ghost-button full" onClick={() => setPin('')}>Clear PIN</button>}
      </div>
    </div>
  );
}

function FleetList() {
  return <div><p className="section-label">ACTIVE FLEET</p>{[['DX-4521', 'DSM -> Arusha', 5, 'On Schedule'], ['KK-2208', 'Mwanza -> DSM', 3, 'On Schedule'], ['SC-7730', 'Arusha -> Moshi', 2, 'Delayed'], ['DX-4522', 'DSM -> Mbeya', 3, 'On Schedule']].map((bus, index) => <div className={`fleet-card ${index === 2 ? 'selected' : ''}`} key={bus[0]}><strong>{bus[0]}<span>1A</span></strong><p>{bus[1]}</p><i><b style={{ width: `${70 - index * 12}%` }} /></i><small><Package size={13} />{bus[2]}<em>{bus[3]}</em></small></div>)}</div>;
}

function RouteMap({ livePulse }) {
  const cities = [['Mwanza', 32, 18], ['Dodoma', 58, 56], ['DSM', 88, 62], ['Moshi', 80, 26], ['Tanga', 88, 42], ['Mbeya', 38, 84], ['Iringa', 58, 72]];
  return <div className="map-card card"><div className="map-head"><strong>Tanzania GPS Route Map</strong><span><i />Route <b />Bus <em />Arrived <u />Selected</span></div><div className="map-canvas">{cities.map(([name, x, y]) => <span className="city" style={{ left: `${x}%`, top: `${y}%` }} key={name}>{name}</span>)}<span className="route-sweep" /><span className="bus-dot first" style={{ transform: `translate(${livePulse % 2 ? 18 : 0}px, ${livePulse % 2 ? -12 : 0}px)` }}>DX</span><span className="bus-dot second" style={{ transform: `translate(${livePulse % 2 ? -10 : 6}px, ${livePulse % 2 ? 8 : -4}px)` }}>KK</span><span className="bus-dot selected">SC-7730</span></div><div className="map-footer"><strong>SC-7730</strong><span>{'Arusha -> Moshi'}</span><code>Moshi outskirts</code><b>Delayed</b></div></div>;
}
