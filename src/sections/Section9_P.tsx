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

function FEPCalc() {
  const [uP, setUP] = useState('');
  const [sP, setSP] = useState('');
  const [uCr, setUCr] = useState('');
  const [sCr, setSCr] = useState('');

  const uPV = parseFloat(uP); const sPV = parseFloat(sP); const uCrV = parseFloat(uCr); const sCrV = parseFloat(sCr);
  let result = null;
  if (!isNaN(uPV) && !isNaN(sPV) && !isNaN(uCrV) && !isNaN(sCrV) && sPV !== 0 && uCrV !== 0) {
    const fep = (uPV * sCrV) / (sPV * uCrV) * 100;
    let judge = '', color: 'red' | 'yellow' | 'green' | 'normal' = 'normal';
    if (fep > 5) { judge = '腎性P喪失（PTH過剰・FGF23過剰・Fanconi症候群）'; color = 'red'; }
    else { judge = '腎外性P喪失（吸収障害・RFS・摂取不足）'; color = 'yellow'; }
    result = { fep, judge, color };
  }

  return (
    <CalcBox title="FEP（P排泄分画）">
      <InputRow label="尿P" value={uP} onChange={setUP} unit="mg/dL" />
      <InputRow label="血清P" value={sP} onChange={setSP} unit="mg/dL" />
      <InputRow label="尿Cr" value={uCr} onChange={setUCr} unit="mg/dL" />
      <InputRow label="血清Cr" value={sCr} onChange={setSCr} unit="mg/dL" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="FEP" value={`${result.fep.toFixed(1)} %`} />
          <Result label="判定" value={result.judge} color={result.color} />
          <p className="text-xs text-muted-foreground mt-2">腎性 &gt;5% / 腎外性 &lt;5%</p>
        </div>
      )}
    </CalcBox>
  );
}

function FlowChartLow() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">低P鑑別フロー</h3>
      <div className="text-xs space-y-2">
        <div className="bg-muted rounded p-2">
          <p className="font-bold text-foreground">P &lt; 2.5 mg/dL（正常：2.5-4.5）</p>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded p-2">
          <p className="text-red-400 font-bold">重症低P（&lt;1.0 mg/dL）の合併症</p>
          <p>横紋筋融解、呼吸筋麻痺（人工呼吸器離脱困難）</p>
          <p>溶血性貧血、意識障害、心不全</p>
        </div>
        <div className="pl-3 border-l-2 border-primary space-y-1">
          <p className="font-semibold text-primary">FEPで腎性・腎外性鑑別</p>
          <div className="pl-3 space-y-1">
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-red-400">腎性（FEP &gt;5%）</p>
              <p>原発性副甲状腺機能亢進症（PHPT）</p>
              <p>ビタミンD欠乏</p>
              <p>FGF23産生腫瘍（腫瘍性骨軟化症）</p>
              <p>X染色体性低リン血症（XLH）</p>
              <p>Fanconi症候群（近位尿細管障害）</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-yellow-400">腎外性（FEP &lt;5%）</p>
              <p>吸収不良・慢性下痢</p>
              <p>アルコール依存症</p>
              <p>再栄養症候群（RFS）：絶食後の急速栄養補給</p>
              <p>DKA治療後（インスリンでP細胞内シフト）</p>
              <p>制酸剤（リン酸塩結合）</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mt-2">
          <p className="text-xs font-bold text-yellow-400 mb-1">治療</p>
          <p><span className="text-red-400">重症低P（&lt;1.0 or 症状あり）:</span> リン酸Na・K iv</p>
          <p><span className="text-yellow-400">軽症:</span> 経口リン酸Na補充</p>
          <p className="text-primary">RFS予防：栄養補給前にP・Mg・K・VitB₁補充</p>
        </div>
      </div>
    </div>
  );
}

function FlowChartHigh() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">高P（P &gt; 4.5 mg/dL）</h3>
      <div className="text-xs space-y-2">
        <div className="pl-3 border-l-2 border-primary space-y-1">
          <p className="font-semibold text-primary">原因</p>
          <div className="pl-3 space-y-1">
            <p>腎不全（最多）：GFR &lt;30で高Pリスク↑</p>
            <p>副甲状腺機能低下症（PTH↓→P排泄↓）</p>
            <p>VitD中毒（腸管P吸収↑）</p>
            <p>横紋筋融解・腫瘍崩壊症候群（細胞内P放出）</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <p className="font-bold text-foreground mb-1">治療</p>
          <p>リン吸着薬（炭酸Ca、セベラマー、炭酸ランタン）</p>
          <p>低リン食（乳製品・加工食品制限）</p>
          <p>透析（腎不全）</p>
          <p className="text-yellow-400 mt-1">Ca × P &gt;55: 血管石灰化・異所性石灰化リスク</p>
        </div>
      </div>
    </div>
  );
}

export function Section9_P() {
  return (
    <div>
      <FEPCalc />
      <FlowChartLow />
      <FlowChartHigh />
    </div>
  );
}
