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
      <label className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</label>
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

function FECaCalc() {
  const [uCa, setUCa] = useState('');
  const [sCa, setSCa] = useState('');
  const [uCr, setUCr] = useState('');
  const [sCr, setSCr] = useState('');

  const uCaV = parseFloat(uCa); const sCaV = parseFloat(sCa); const uCrV = parseFloat(uCr); const sCrV = parseFloat(sCr);
  let result = null;
  if (!isNaN(uCaV) && !isNaN(sCaV) && !isNaN(uCrV) && !isNaN(sCrV) && sCaV !== 0 && uCrV !== 0) {
    const feca = (uCaV * sCrV) / (sCaV * uCrV) * 100;
    let judge = '', color: 'red' | 'yellow' | 'green' | 'normal' = 'normal';
    if (feca < 1) { judge = 'FHH（家族性低カルシウム尿性高カルシウム血症）を疑う'; color = 'yellow'; }
    else if (feca > 2) { judge = 'PHPT（原発性副甲状腺機能亢進症）を疑う'; color = 'red'; }
    else { judge = '境界域（1-2%）：追加検索要'; color = 'yellow'; }
    result = { feca, judge, color };
  }

  return (
    <CalcBox title="FECa（Ca排泄分画）">
      <InputRow label="尿Ca" value={uCa} onChange={setUCa} unit="mg/dL" />
      <InputRow label="血清Ca" value={sCa} onChange={setSCa} unit="mg/dL" />
      <InputRow label="尿Cr" value={uCr} onChange={setUCr} unit="mg/dL" />
      <InputRow label="血清Cr" value={sCr} onChange={setSCr} unit="mg/dL" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="FECa" value={`${result.feca.toFixed(2)} %`} />
          <Result label="判定" value={result.judge} color={result.color} />
          <p className="text-xs text-muted-foreground mt-2">FHH: &lt;1% / PHPT: &gt;2%</p>
        </div>
      )}
    </CalcBox>
  );
}

function FlowChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">高Ca鑑別フロー</h3>
      <div className="text-xs space-y-2">
        <div className="bg-muted rounded p-2">
          <p className="font-bold text-foreground">補正Ca &gt; 10.2 mg/dL</p>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded p-2">
          <p className="text-red-400 font-bold">Ca &gt;14: 高Ca クリーゼ（意識障害・腎不全）→ 緊急対応</p>
        </div>
        <div className="pl-3 border-l-2 border-primary space-y-1">
          <p className="font-semibold text-primary">PTH測定</p>
          <div className="pl-3 space-y-1">
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-yellow-400">PTH 高値</p>
              <p>原発性副甲状腺機能亢進症（PHPT）→ 最多 ※外来患者</p>
              <p>FHH（FECa &lt;1%で鑑別）</p>
              <p>PTHrP産生腫瘍（悪性腫瘍）</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-red-400">PTH 低値</p>
              <p>悪性腫瘍（骨転移・PTHrP産生）→ 最多 ※入院患者</p>
              <p>VitD過剰（サプリメント・肉芽腫症）</p>
              <p>サルコイドーシス（マクロファージでVitD活性化）</p>
              <p>甲状腺機能亢進症（骨吸収↑）</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mt-2">
          <p className="text-xs font-bold text-yellow-400 mb-1">治療</p>
          <p><span className="text-red-400">Ca &gt;14 or 症状あり:</span> 生食輸液（2-4L/day）+ フロセミド</p>
          <p><span className="text-yellow-400">悪性腫瘍:</span> ビスホスホネート（ゾレドロン酸）</p>
          <p><span className="text-primary">VitD過剰・サルコイドーシス:</span> ステロイド（プレドニゾロン）</p>
          <p>カルシトニン（即効性・短時間作用）</p>
          <p>根本治療：原疾患の治療（PHPT → 副甲状腺切除）</p>
        </div>
      </div>
    </div>
  );
}

export function Section7_HyperCa() {
  return (
    <div>
      <FECaCalc />
      <FlowChart />
    </div>
  );
}
