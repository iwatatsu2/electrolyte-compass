import React, { useState } from 'react';

function CalcBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InputRow({ label, value, onChange, unit, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <label className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? ''}
        className="flex-1 bg-input border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {unit && <span className="text-xs text-muted-foreground w-16">{unit}</span>}
    </div>
  );
}

function Result({ label, value, color }: { label: string; value: string; color?: 'red' | 'yellow' | 'green' | 'normal' }) {
  const colorClass = color === 'red' ? 'text-red-400' : color === 'yellow' ? 'text-yellow-400' : color === 'green' ? 'text-green-400' : 'text-foreground';
  return (
    <div className="flex items-start gap-2 text-xs mt-1">
      <span className="text-muted-foreground flex-shrink-0">{label}:</span>
      <span className={`font-semibold ${colorClass}`}>{value}</span>
    </div>
  );
}

// AG Calculator
function AGCalc() {
  const [na, setNa] = useState('');
  const [cl, setCl] = useState('');
  const [hco3, setHco3] = useState('');
  const [alb, setAlb] = useState('');

  const naV = parseFloat(na);
  const clV = parseFloat(cl);
  const hco3V = parseFloat(hco3);
  const albV = parseFloat(alb);

  const ag = (!isNaN(naV) && !isNaN(clV) && !isNaN(hco3V)) ? naV - (clV + hco3V) : null;
  const corrAG = (ag !== null && !isNaN(albV)) ? ag + 2.5 * (4.0 - albV) : null;
  const agJudge = ag !== null ? (ag > 12 ? '高AG代謝性アシドーシス' : '正常AG') : null;
  const agColor = ag !== null ? (ag > 12 ? 'red' : 'green') : 'normal';

  return (
    <CalcBox title="AG（アニオンギャップ）計算機">
      <InputRow label="Na" value={na} onChange={setNa} unit="mEq/L" />
      <InputRow label="Cl" value={cl} onChange={setCl} unit="mEq/L" />
      <InputRow label="HCO₃" value={hco3} onChange={setHco3} unit="mEq/L" />
      <InputRow label="Alb（任意）" value={alb} onChange={setAlb} unit="g/dL" />
      {ag !== null && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="AG" value={`${ag.toFixed(1)} mEq/L`} color={agColor} />
          {corrAG !== null && <Result label="補正AG" value={`${corrAG.toFixed(1)} mEq/L`} />}
          <Result label="判定" value={agJudge ?? ''} color={agColor} />
        </div>
      )}
    </CalcBox>
  );
}

// Delta ratio
function DeltaRatio() {
  const [ag, setAg] = useState('');
  const [hco3, setHco3] = useState('');

  const agV = parseFloat(ag);
  const hco3V = parseFloat(hco3);

  let result = null;
  if (!isNaN(agV) && !isNaN(hco3V)) {
    const dAG = agV - 12;
    const dHco3 = 24 - hco3V;
    const ratio = dHco3 !== 0 ? dAG / dHco3 : null;
    let judge = '';
    let color: 'red' | 'yellow' | 'green' | 'normal' = 'normal';
    if (ratio !== null) {
      if (ratio < 0.4) { judge = '純粋正常AG代謝性アシドーシス'; color = 'yellow'; }
      else if (ratio < 1.0) { judge = '混合性（高AG + 正常AG代謝性アシドーシス）'; color = 'yellow'; }
      else if (ratio <= 2.0) { judge = '単純高AG代謝性アシドーシス'; color = 'red'; }
      else { judge = '高AG + 代謝性アルカローシス混合'; color = 'red'; }
    }
    result = { dAG, dHco3, ratio, judge, color };
  }

  return (
    <CalcBox title="ΔAG/ΔHCO₃（デルタ比）">
      <InputRow label="AG" value={ag} onChange={setAg} unit="mEq/L" />
      <InputRow label="HCO₃" value={hco3} onChange={setHco3} unit="mEq/L" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="ΔAG" value={`${result.dAG.toFixed(1)}`} />
          <Result label="ΔHCO₃" value={`${result.dHco3.toFixed(1)}`} />
          <Result label="デルタ比" value={result.ratio !== null ? result.ratio.toFixed(2) : 'N/A'} />
          <Result label="判定" value={result.judge} color={result.color} />
        </div>
      )}
    </CalcBox>
  );
}

// Winter formula
function WinterFormula() {
  const [hco3, setHco3] = useState('');
  const [paco2, setPaco2] = useState('');

  const hco3V = parseFloat(hco3);
  const paco2V = parseFloat(paco2);

  let result = null;
  if (!isNaN(hco3V)) {
    const predicted = 1.5 * hco3V + 8;
    const low = predicted - 2;
    const high = predicted + 2;
    let judge = '';
    let color: 'red' | 'yellow' | 'green' | 'normal' = 'normal';
    if (!isNaN(paco2V)) {
      if (paco2V >= low && paco2V <= high) { judge = '適切な呼吸代償'; color = 'green'; }
      else if (paco2V < low) { judge = '呼吸性アルカローシス合併'; color = 'yellow'; }
      else { judge = '呼吸性アシドーシス合併'; color = 'red'; }
    }
    result = { predicted, low, high, judge, color };
  }

  return (
    <CalcBox title="Winter式（代謝性アシドーシスの呼吸代償）">
      <InputRow label="HCO₃" value={hco3} onChange={setHco3} unit="mEq/L" />
      <InputRow label="実測PaCO₂（任意）" value={paco2} onChange={setPaco2} unit="mmHg" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="予測PaCO₂" value={`${result.low.toFixed(0)} ～ ${result.high.toFixed(0)} mmHg`} />
          {result.judge && <Result label="判定" value={result.judge} color={result.color} />}
        </div>
      )}
    </CalcBox>
  );
}

// UAG
function UAGCalc() {
  const [uNa, setUNa] = useState('');
  const [uK, setUK] = useState('');
  const [uCl, setUCl] = useState('');

  const uNaV = parseFloat(uNa);
  const uKV = parseFloat(uK);
  const uClV = parseFloat(uCl);

  let result = null;
  if (!isNaN(uNaV) && !isNaN(uKV) && !isNaN(uClV)) {
    const uag = uNaV + uKV - uClV;
    const judge = uag < 0 ? '陰性 → 下痢（腸管性HCO₃喪失、NH₄⁺産生正常）' : '陽性 → 尿細管性アシドーシス（RTA）を疑う';
    const color: 'red' | 'yellow' | 'green' | 'normal' = uag < 0 ? 'yellow' : 'red';
    result = { uag, judge, color };
  }

  return (
    <CalcBox title="UAG（尿アニオンギャップ）">
      <InputRow label="尿Na" value={uNa} onChange={setUNa} unit="mEq/L" />
      <InputRow label="尿K" value={uK} onChange={setUK} unit="mEq/L" />
      <InputRow label="尿Cl" value={uCl} onChange={setUCl} unit="mEq/L" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="UAG" value={`${result.uag.toFixed(1)} mEq/L`} />
          <Result label="判定" value={result.judge} color={result.color} />
        </div>
      )}
    </CalcBox>
  );
}

// 尿浸透圧ギャップ
function UrineOsmGap() {
  const [measOsm, setMeasOsm] = useState('');
  const [uNa, setUNa] = useState('');
  const [uK, setUK] = useState('');
  const [uUrea, setUUrea] = useState('');
  const [uGluc, setUGluc] = useState('');

  const mV = parseFloat(measOsm);
  const nV = parseFloat(uNa);
  const kV = parseFloat(uK);
  const uV = parseFloat(uUrea);
  const gV = parseFloat(uGluc);

  let result = null;
  if (!isNaN(mV) && !isNaN(nV) && !isNaN(kV) && !isNaN(uV) && !isNaN(gV)) {
    const calcOsm = 2 * (nV + kV) + uV / 2.8 + gV / 18;
    const gap = mV - calcOsm;
    const judge = gap > 100 ? 'NH₄⁺増加（アシドーシスへの代償あり）' : 'NH₄⁺産生低下（代謝性アシドーシス代償不十分）';
    const color: 'red' | 'yellow' | 'green' | 'normal' = gap > 100 ? 'green' : 'red';
    result = { calcOsm, gap, judge, color };
  }

  return (
    <CalcBox title="尿浸透圧ギャップ">
      <InputRow label="実測尿浸透圧" value={measOsm} onChange={setMeasOsm} unit="mOsm/kg" />
      <InputRow label="尿Na" value={uNa} onChange={setUNa} unit="mEq/L" />
      <InputRow label="尿K" value={uK} onChange={setUK} unit="mEq/L" />
      <InputRow label="尿Urea" value={uUrea} onChange={setUUrea} unit="mg/dL" />
      <InputRow label="尿Glucose" value={uGluc} onChange={setUGluc} unit="mg/dL" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="計算尿浸透圧" value={`${result.calcOsm.toFixed(0)} mOsm/kg`} />
          <Result label="ギャップ" value={`${result.gap.toFixed(0)} mOsm/kg`} />
          <Result label="判定" value={result.judge} color={result.color} />
        </div>
      )}
    </CalcBox>
  );
}

// 血清浸透圧ギャップ
function SerumOsmGap() {
  const [measOsm, setMeasOsm] = useState('');
  const [na, setNa] = useState('');
  const [gluc, setGluc] = useState('');
  const [bun, setBun] = useState('');

  const mV = parseFloat(measOsm);
  const nV = parseFloat(na);
  const gV = parseFloat(gluc);
  const bV = parseFloat(bun);

  let result = null;
  if (!isNaN(mV) && !isNaN(nV) && !isNaN(gV) && !isNaN(bV)) {
    const calcOsm = 2 * nV + gV / 18 + bV / 2.8;
    const gap = mV - calcOsm;
    const judge = gap > 10 ? 'メタノール・エタノール・エチレングリコール中毒を疑う' : '正常範囲内';
    const color: 'red' | 'yellow' | 'green' | 'normal' = gap > 10 ? 'red' : 'green';
    result = { calcOsm, gap, judge, color };
  }

  return (
    <CalcBox title="血清浸透圧ギャップ">
      <InputRow label="実測浸透圧" value={measOsm} onChange={setMeasOsm} unit="mOsm/kg" />
      <InputRow label="Na" value={na} onChange={setNa} unit="mEq/L" />
      <InputRow label="血糖" value={gluc} onChange={setGluc} unit="mg/dL" />
      <InputRow label="BUN" value={bun} onChange={setBun} unit="mg/dL" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="計算浸透圧" value={`${result.calcOsm.toFixed(0)} mOsm/kg`} />
          <Result label="ギャップ" value={`${result.gap.toFixed(0)} mOsm/kg`} />
          <Result label="判定" value={result.judge} color={result.color} />
        </div>
      )}
    </CalcBox>
  );
}

export function Section1_AcidBase() {
  return (
    <div>
      <AGCalc />
      <DeltaRatio />
      <WinterFormula />
      <UAGCalc />
      <UrineOsmGap />
      <SerumOsmGap />
    </div>
  );
}
