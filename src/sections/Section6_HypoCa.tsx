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

function CorrectedCaCalc() {
  const [ca, setCa] = useState('');
  const [alb, setAlb] = useState('');

  const caV = parseFloat(ca); const albV = parseFloat(alb);
  let result = null;
  if (!isNaN(caV) && !isNaN(albV)) {
    const corrCa = caV + (4.0 - albV);
    let judge = '', color: 'red' | 'yellow' | 'green' | 'normal' = 'normal';
    if (corrCa < 7.5) { judge = '重篤な低Ca（テタニー・痙攣リスク・緊急対応）'; color = 'red'; }
    else if (corrCa < 8.5) { judge = '低Ca血症'; color = 'yellow'; }
    else if (corrCa <= 10.2) { judge = '正常範囲'; color = 'green'; }
    else { judge = '高Ca血症'; color = 'red'; }
    result = { corrCa, judge, color };
  }

  return (
    <CalcBox title="補正Ca（Payne式）">
      <InputRow label="測定Ca" value={ca} onChange={setCa} unit="mg/dL" />
      <InputRow label="Alb" value={alb} onChange={setAlb} unit="g/dL" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="補正Ca" value={`${result.corrCa.toFixed(1)} mg/dL`} color={result.color} />
          <Result label="判定" value={result.judge} color={result.color} />
          <p className="text-xs text-muted-foreground mt-2">正常範囲: 8.5-10.2 mg/dL</p>
        </div>
      )}
    </CalcBox>
  );
}

function FlowChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">低Ca鑑別フロー</h3>
      <div className="text-xs space-y-2">
        <div className="bg-muted rounded p-2">
          <p className="font-bold text-foreground">補正Ca &lt; 8.5 mg/dL</p>
        </div>
        <div className="pl-3 border-l-2 border-primary space-y-1">
          <p className="font-semibold text-primary">PTH測定</p>
          <div className="pl-3 space-y-1">
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-red-400">PTH 低値（副甲状腺機能低下症）</p>
              <p>術後副甲状腺機能低下（甲状腺手術後）</p>
              <p>自己免疫性副甲状腺機能低下症</p>
              <p>低Mg血症（Mg &lt;0.8 mg/dL でPTH分泌↓）</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-yellow-400">PTH 高値（続発性副甲状腺機能亢進症）</p>
              <p>ビタミンD欠乏・不活性化障害</p>
              <p>慢性腎不全（CKD-MBD）</p>
              <p>Mg欠乏（Mg補充で改善）</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-foreground">その他の原因</p>
              <p>急性膵炎（脂肪壊死でCa消費）</p>
              <p>大量輸血（クエン酸でCaキレート）</p>
              <p>敗血症・重症疾患</p>
              <p>横紋筋融解（筋細胞にCa沈着）</p>
            </div>
          </div>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded p-3 mt-2">
          <p className="text-xs font-bold text-red-400 mb-1">治療</p>
          <p><span className="text-red-400">症状あり（テタニー・痙攣）:</span></p>
          <p className="pl-3">グルコン酸Ca 10mL iv（10分以上かけてゆっくり）</p>
          <p className="pl-3">心電図モニタリング下で投与</p>
          <p><span className="text-yellow-400">慢性:</span> Ca製剤内服 + 活性型VitD（カルシトリオール）</p>
          <p className="text-primary mt-1">Mg欠乏合併時はMg補充を先行</p>
        </div>
      </div>
    </div>
  );
}

export function Section6_HypoCa() {
  return (
    <div>
      <CorrectedCaCalc />
      <FlowChart />
    </div>
  );
}
