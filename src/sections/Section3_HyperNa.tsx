import React, { useState } from 'react';

function CalcBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InputRow({ label, value, onChange, unit, defaultVal }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; defaultVal?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <label className="text-xs text-muted-foreground w-36 flex-shrink-0">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={defaultVal}
        className="flex-1 bg-input border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {unit && <span className="text-xs text-muted-foreground w-20">{unit}</span>}
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

function CorrectedNaCalc() {
  const [na, setNa] = useState('');
  const [gluc, setGluc] = useState('');

  const nV = parseFloat(na); const gV = parseFloat(gluc);
  let result = null;
  if (!isNaN(nV) && !isNaN(gV)) {
    const corrNa = nV + 1.6 * (gV - 100) / 100;
    const judge = corrNa < 135 ? '低Na' : corrNa <= 145 ? '正常範囲' : '高Na';
    const color: 'red' | 'yellow' | 'green' | 'normal' = corrNa < 135 ? 'yellow' : corrNa <= 145 ? 'green' : 'red';
    result = { corrNa, judge, color };
  }

  return (
    <CalcBox title="補正Na（高血糖時）">
      <InputRow label="実測Na" value={na} onChange={setNa} unit="mEq/L" />
      <InputRow label="血糖" value={gluc} onChange={setGluc} unit="mg/dL" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="補正Na" value={`${result.corrNa.toFixed(1)} mEq/L`} color={result.color} />
          <Result label="判定" value={result.judge} color={result.color} />
        </div>
      )}
    </CalcBox>
  );
}

function FreeWaterDeficit() {
  const [bw, setBw] = useState('');
  const [curNa, setCurNa] = useState('');
  const [tarNa, setTarNa] = useState('140');

  const bwV = parseFloat(bw); const cV = parseFloat(curNa); const tV = parseFloat(tarNa || '140');
  let result = null;
  if (!isNaN(bwV) && !isNaN(cV) && !isNaN(tV) && tV !== 0) {
    const deficit = 0.6 * bwV * (cV / tV - 1);
    result = { deficit };
  }

  return (
    <CalcBox title="自由水欠乏量">
      <InputRow label="体重" value={bw} onChange={setBw} unit="kg" />
      <InputRow label="現Na" value={curNa} onChange={setCurNa} unit="mEq/L" />
      <InputRow label="目標Na" value={tarNa} onChange={setTarNa} unit="mEq/L" defaultVal="140" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="自由水欠乏量" value={`${result.deficit.toFixed(1)} L`} color="yellow" />
          <Result label="注意" value="急速補正禁止：>12 mEq/L/dayのNa低下を避ける" color="red" />
          <Result label="補正速度" value="<0.5 mEq/L/hr、<10 mEq/L/day" color="yellow" />
        </div>
      )}
    </CalcBox>
  );
}

function FreeWaterClearanceHyper() {
  const [uv, setUv] = useState('');
  const [uOsm, setUOsm] = useState('');
  const [sOsm, setSOsm] = useState('');

  const uvV = parseFloat(uv); const uoV = parseFloat(uOsm); const soV = parseFloat(sOsm);
  let result = null;
  if (!isNaN(uvV) && !isNaN(uoV) && !isNaN(soV) && soV !== 0) {
    const ch2o = uvV * (1 - uoV / soV);
    const judge = ch2o > 0 ? '正（水排泄過剰・尿崩症を疑う）' : '負（水保持・ADH作用あり）';
    const color: 'red' | 'yellow' | 'green' | 'normal' = ch2o > 0 ? 'red' : 'green';
    result = { ch2o, judge, color };
  }

  return (
    <CalcBox title="自由水クリアランス（CH₂O）">
      <InputRow label="尿量" value={uv} onChange={setUv} unit="mL/hr" />
      <InputRow label="尿浸透圧" value={uOsm} onChange={setUOsm} unit="mOsm/kg" />
      <InputRow label="血清浸透圧" value={sOsm} onChange={setSOsm} unit="mOsm/kg" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="CH₂O" value={`${result.ch2o.toFixed(1)} mL/hr`} />
          <Result label="判定" value={result.judge} color={result.color} />
        </div>
      )}
    </CalcBox>
  );
}

function FlowChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">高Na鑑別フロー</h3>
      <div className="text-xs space-y-2">
        <div className="bg-muted rounded p-2">
          <p className="font-bold text-foreground">血清Na &gt; 145 mEq/L</p>
        </div>
        <div className="pl-3 border-l-2 border-primary space-y-1">
          <p className="font-semibold text-primary">尿浸透圧で分類</p>
          <div className="pl-3 space-y-1">
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-red-400">&lt; 300 mOsm/kg（尿が薄い）</p>
              <p>中枢性尿崩症（バソプレシン産生↓）</p>
              <p>腎性尿崩症（バソプレシン抵抗性）</p>
              <p>水摂取不足（熱中症・意識障害）</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-yellow-400">&gt; 600 mOsm/kg（尿が濃い）</p>
              <p>腎外性喪失（発汗・嘔吐・下痢）</p>
              <p>不感蒸泄増加（発熱・過換気）</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-foreground">300-600 mOsm/kg</p>
              <p>部分性尿崩症 or 混合型</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mt-2">
          <p className="text-xs font-bold text-yellow-400 mb-1">治療</p>
          <p>原因除去 + 自由水補充（経口水 or 5%ブドウ糖液）</p>
          <p>補正速度：&lt;0.5 mEq/L/hr、&lt;10 mEq/L/day</p>
          <p className="text-red-400">急速補正で脳浮腫リスク → ゆっくり補正</p>
        </div>
      </div>
    </div>
  );
}

export function Section3_HyperNa() {
  return (
    <div>
      <CorrectedNaCalc />
      <FreeWaterDeficit />
      <FreeWaterClearanceHyper />
      <FlowChart />
    </div>
  );
}
