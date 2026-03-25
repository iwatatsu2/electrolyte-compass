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

function FEMgCalc() {
  const [uMg, setUMg] = useState('');
  const [sMg, setSMg] = useState('');
  const [uCr, setUCr] = useState('');
  const [sCr, setSCr] = useState('');

  const uMgV = parseFloat(uMg); const sMgV = parseFloat(sMg); const uCrV = parseFloat(uCr); const sCrV = parseFloat(sCr);
  let result = null;
  if (!isNaN(uMgV) && !isNaN(sMgV) && !isNaN(uCrV) && !isNaN(sCrV) && sMgV !== 0 && uCrV !== 0) {
    const femg = (uMgV * sCrV) / (sMgV * uCrV) * 100;
    let judge = '', color: 'red' | 'yellow' | 'green' | 'normal' = 'normal';
    if (femg > 4) { judge = '腎性Mg喪失（利尿薬・アミノグリコシド・シスプラチン・Gitelman）'; color = 'red'; }
    else if (femg < 2) { judge = '腎外性Mg喪失（下痢・吸収障害・アルコール）'; color = 'yellow'; }
    else { judge = '境界域（2-4%）'; color = 'normal'; }
    result = { femg, judge, color };
  }

  return (
    <CalcBox title="FEMg（Mg排泄分画）">
      <InputRow label="尿Mg" value={uMg} onChange={setUMg} unit="mg/dL" />
      <InputRow label="血清Mg" value={sMg} onChange={setSMg} unit="mg/dL" />
      <InputRow label="尿Cr" value={uCr} onChange={setUCr} unit="mg/dL" />
      <InputRow label="血清Cr" value={sCr} onChange={setSCr} unit="mg/dL" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="FEMg" value={`${result.femg.toFixed(1)} %`} />
          <Result label="判定" value={result.judge} color={result.color} />
          <p className="text-xs text-muted-foreground mt-2">腎性 &gt;4% / 腎外性 &lt;2%</p>
        </div>
      )}
    </CalcBox>
  );
}

function FlowChartLow() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">低Mg鑑別フロー</h3>
      <div className="text-xs space-y-2">
        <div className="bg-muted rounded p-2">
          <p className="font-bold text-foreground">Mg &lt; 1.8 mg/dL（正常：1.8-2.5）</p>
        </div>
        <div className="pl-3 border-l-2 border-primary space-y-1">
          <p className="font-semibold text-primary">FEMgで腎性・腎外性鑑別</p>
          <div className="pl-3 space-y-1">
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-red-400">腎性（FEMg &gt;4%）</p>
              <p>PPI（大腸のMg吸収チャネルTRPM6阻害）</p>
              <p>ループ利尿薬・サイアザイド系利尿薬</p>
              <p>シスプラチン（尿細管障害）</p>
              <p>アミノグリコシド系抗菌薬</p>
              <p>Gitelman症候群</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-yellow-400">腎外性（FEMg &lt;2%）</p>
              <p>慢性下痢・短腸症候群</p>
              <p>吸収不良症候群</p>
              <p>アルコール依存症</p>
              <p>摂取不足</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mt-2">
          <p className="text-xs font-bold text-yellow-400 mb-1">臨床的重要ポイント</p>
          <p className="text-primary font-semibold">低K・低Caが改善しない場合はMg欠乏を先に補正！</p>
          <p>Mg欠乏でPTH分泌↓ → 低Ca</p>
          <p>Mg欠乏でK腎保持↓ → 低K（難治性）</p>
        </div>
        <div className="bg-card border border-border rounded p-3 mt-2">
          <p className="text-xs font-bold text-foreground mb-1">治療</p>
          <p><span className="text-red-400">症状あり（神経筋症状・不整脈）:</span> MgSO₄ iv</p>
          <p><span className="text-yellow-400">軽症:</span> 経口Mg製剤（酸化Mg・硫酸Mg）</p>
          <p>腎不全では過剰投与に注意</p>
        </div>
      </div>
    </div>
  );
}

function FlowChartHigh() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">高Mg（Mg &gt; 2.5 mg/dL）</h3>
      <div className="text-xs space-y-2">
        <div className="pl-3 border-l-2 border-primary space-y-1">
          <p className="font-semibold text-primary">原因</p>
          <p className="pl-3">腎不全（Mg排泄↓）</p>
          <p className="pl-3">Mg製剤過剰投与（硫酸Mg：子癇前症治療）</p>
          <p className="pl-3">制酸剤過剰使用（Mg含有）</p>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded p-2">
          <p className="text-red-400 font-bold">Mg &gt;4 mg/dL: 反射消失、呼吸抑制</p>
          <p className="text-red-400">Mg &gt;6 mg/dL: 心停止リスク</p>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <p className="font-bold text-foreground mb-1">治療</p>
          <p>グルコン酸Ca（拮抗）</p>
          <p>輸液 + フロセミド（尿中排泄促進）</p>
          <p>重症：血液透析</p>
        </div>
      </div>
    </div>
  );
}

export function Section8_Mg() {
  return (
    <div>
      <FEMgCalc />
      <FlowChartLow />
      <FlowChartHigh />
    </div>
  );
}
