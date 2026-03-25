import React, { useState } from 'react';

function CalcBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InputRow({ label, value, onChange, unit }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <label className="text-xs text-muted-foreground w-36 flex-shrink-0">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
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

function SerumOsmCalc() {
  const [na, setNa] = useState('');
  const [gluc, setGluc] = useState('');
  const [bun, setBun] = useState('');

  const nV = parseFloat(na); const gV = parseFloat(gluc); const bV = parseFloat(bun);
  let result = null;
  if (!isNaN(nV) && !isNaN(gV) && !isNaN(bV)) {
    const osm = 2 * nV + gV / 18 + bV / 2.8;
    let judge = '', color: 'red' | 'yellow' | 'green' | 'normal' = 'normal';
    if (osm < 275) { judge = '低張性低Na（真の低Na）'; color = 'red'; }
    else if (osm <= 295) { judge = '等張性低Na（偽性低Na）'; color = 'yellow'; }
    else { judge = '高張性低Na（高血糖・マンニトール）'; color = 'yellow'; }
    result = { osm, judge, color };
  }

  return (
    <CalcBox title="血清浸透圧計算">
      <InputRow label="Na" value={na} onChange={setNa} unit="mEq/L" />
      <InputRow label="血糖" value={gluc} onChange={setGluc} unit="mg/dL" />
      <InputRow label="BUN" value={bun} onChange={setBun} unit="mg/dL" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="血清浸透圧" value={`${result.osm.toFixed(0)} mOsm/kg`} />
          <Result label="判定" value={result.judge} color={result.color} />
        </div>
      )}
    </CalcBox>
  );
}

function EffectiveOsmCalc() {
  const [na, setNa] = useState('');
  const [gluc, setGluc] = useState('');

  const nV = parseFloat(na); const gV = parseFloat(gluc);
  let result = null;
  if (!isNaN(nV) && !isNaN(gV)) {
    const osm = 2 * nV + gV / 18;
    const judge = osm < 280 ? '低張性（細胞浮腫リスクあり）' : '正常〜高張性';
    const color: 'red' | 'yellow' | 'green' | 'normal' = osm < 280 ? 'red' : 'green';
    result = { osm, judge, color };
  }

  return (
    <CalcBox title="有効浸透圧">
      <InputRow label="Na" value={na} onChange={setNa} unit="mEq/L" />
      <InputRow label="血糖" value={gluc} onChange={setGluc} unit="mg/dL" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="有効浸透圧" value={`${result.osm.toFixed(0)} mOsm/kg`} />
          <Result label="判定" value={result.judge} color={result.color} />
        </div>
      )}
    </CalcBox>
  );
}

function FreeWaterClearance() {
  const [uv, setUv] = useState('');
  const [uNa, setUNa] = useState('');
  const [uK, setUK] = useState('');
  const [sNa, setSNa] = useState('');

  const uvV = parseFloat(uv); const unV = parseFloat(uNa); const ukV = parseFloat(uK); const snV = parseFloat(sNa);
  let result = null;
  if (!isNaN(uvV) && !isNaN(unV) && !isNaN(ukV) && !isNaN(snV) && snV !== 0) {
    const ceH2O = uvV * (1 - (unV + ukV) / snV);
    const judge = ceH2O < 0 ? '負（水貯留・ADH作用あり）→ SIADH・心不全・肝硬変等' : '正（水排泄・ADH作用なし）→ 水利尿';
    const color: 'red' | 'yellow' | 'green' | 'normal' = ceH2O < 0 ? 'red' : 'green';
    result = { ceH2O, judge, color };
  }

  return (
    <CalcBox title="電解質自由水クリアランス（CeH₂O）">
      <InputRow label="尿量" value={uv} onChange={setUv} unit="mL/hr" />
      <InputRow label="尿Na" value={uNa} onChange={setUNa} unit="mEq/L" />
      <InputRow label="尿K" value={uK} onChange={setUK} unit="mEq/L" />
      <InputRow label="血清Na" value={sNa} onChange={setSNa} unit="mEq/L" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="CeH₂O" value={`${result.ceH2O.toFixed(1)} mL/hr`} />
          <Result label="判定" value={result.judge} color={result.color} />
        </div>
      )}
    </CalcBox>
  );
}

function FlowChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">低Na鑑別フロー</h3>
      <div className="text-xs space-y-2">
        <div className="bg-muted rounded p-2">
          <p className="font-bold text-foreground">血清Na &lt; 135 mEq/L</p>
        </div>
        <div className="pl-3 border-l-2 border-primary space-y-1">
          <p className="font-semibold text-primary">① 血清浸透圧で分類</p>
          <div className="pl-3 space-y-1">
            <p><span className="text-yellow-400">等張性 (275-295):</span> 偽性低Na（高脂血症・高蛋白血症）</p>
            <p><span className="text-yellow-400">高張性 (&gt;295):</span> 高血糖、マンニトール使用</p>
            <p><span className="text-red-400">低張性 (&lt;275):</span> ↓ 細胞外液量で分類</p>
          </div>
        </div>
        <div className="pl-3 border-l-2 border-red-500 space-y-1">
          <p className="font-semibold text-red-400">② 低張性低Naの鑑別（細胞外液量）</p>
          <div className="pl-3 space-y-1">
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-foreground">低値（脱水）</p>
              <p>腎性（FENa &gt;1%）: 利尿薬、塩類喪失性腎症、副腎不全</p>
              <p>腎外性（FENa &lt;1%）: 嘔吐・下痢・熱傷・第3腔喪失</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-foreground">正常（等容量）</p>
              <p>SIADH、甲状腺機能低下症、副腎不全（グルココルチコイド）</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-foreground">高値（浮腫）</p>
              <p>心不全、肝硬変、ネフローゼ症候群、腎不全</p>
            </div>
          </div>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded p-3 mt-2">
          <p className="text-xs font-bold text-red-400 mb-1">治療の注意点</p>
          <p><span className="text-yellow-400">症候性（けいれん等）:</span> 3%食塩水、最初の数時間は1-2 mEq/L/hrで補正</p>
          <p><span className="text-yellow-400">慢性低Na:</span> 補正速度 &lt;10 mEq/L/day（ODS予防）</p>
          <p><span className="text-primary">SIADH:</span> 水制限、塩分補充、バプタン系（重症）</p>
        </div>
      </div>
    </div>
  );
}

export function Section2_HypoNa() {
  return (
    <div>
      <SerumOsmCalc />
      <EffectiveOsmCalc />
      <FreeWaterClearance />
      <FlowChart />
    </div>
  );
}
