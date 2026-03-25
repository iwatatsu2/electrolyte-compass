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

function FENaCalc() {
  const [uNa, setUNa] = useState('');
  const [sNa, setSNa] = useState('');
  const [uCr, setUCr] = useState('');
  const [sCr, setSCr] = useState('');

  const uNaV = parseFloat(uNa); const sNaV = parseFloat(sNa); const uCrV = parseFloat(uCr); const sCrV = parseFloat(sCr);
  let result = null;
  if (!isNaN(uNaV) && !isNaN(sNaV) && !isNaN(uCrV) && !isNaN(sCrV) && sNaV !== 0 && uCrV !== 0) {
    const fena = (uNaV * sCrV) / (sNaV * uCrV) * 100;
    let judge = '', color: 'red' | 'yellow' | 'green' | 'normal' = 'normal';
    if (fena < 1) { judge = '腎前性AKI（or 造影剤腎症・急性糸球体腎炎）'; color = 'yellow'; }
    else if (fena <= 2) { judge = '判定困難（1-2%）'; color = 'normal'; }
    else { judge = '腎性AKI（ATN）'; color = 'red'; }
    result = { fena, judge, color };
  }

  return (
    <CalcBox title="FENa（Na排泄分画）">
      <p className="text-xs text-yellow-400 mb-2">⚠ 利尿薬使用中はFEUrea（尿素排泄分画）を使用</p>
      <InputRow label="尿Na" value={uNa} onChange={setUNa} unit="mEq/L" />
      <InputRow label="血清Na" value={sNa} onChange={setSNa} unit="mEq/L" />
      <InputRow label="尿Cr" value={uCr} onChange={setUCr} unit="mg/dL" />
      <InputRow label="血清Cr" value={sCr} onChange={setSCr} unit="mg/dL" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="FENa" value={`${result.fena.toFixed(2)} %`} />
          <Result label="判定" value={result.judge} color={result.color} />
          <p className="text-xs text-muted-foreground mt-2">腎前性 &lt;1% / ATN &gt;2%</p>
        </div>
      )}
    </CalcBox>
  );
}

function FlowChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">AKI鑑別フロー</h3>
      <div className="text-xs space-y-2">
        <div className="bg-muted rounded p-2">
          <p className="font-bold text-foreground">AKI診断（KDIGO基準）</p>
          <p>Cr ≥0.3 mg/dL上昇（48時間以内）</p>
          <p>Cr ≥1.5倍（7日以内）</p>
          <p>尿量 &lt;0.5 mL/kg/hr × 6時間</p>
        </div>
        <div className="pl-3 border-l-2 border-primary space-y-1">
          <p className="font-semibold text-primary">3分類で鑑別</p>
          <div className="pl-3 space-y-1">
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-yellow-400">腎前性（最多 55-60%）</p>
              <p>FENa &lt;1%、BUN/Cr &gt;20、尿浸透圧 &gt;500</p>
              <p>尿Na &lt;20 mEq/L、尿比重 &gt;1.020</p>
              <p>原因：脱水、心不全、肝硬変、敗血症、NSAIDs/ACEi</p>
              <p className="text-green-400">治療：補液（輸液チャレンジ）、原因除去</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-red-400">腎性（ATN 25-40%）</p>
              <p>FENa &gt;2%、BUN/Cr &lt;20、尿浸透圧 &lt;350</p>
              <p>尿Na &gt;40 mEq/L、泥様顆粒円柱、尿細管上皮細胞</p>
              <p>原因：虚血（長引いた腎前性）、腎毒性薬（アミノグリコシド・造影剤・シスプラチン）</p>
              <p className="text-yellow-400">治療：補液過剰を避ける、腎毒性薬中止、透析適応検討</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-primary">腎後性（5-10%）</p>
              <p>水腎症（エコーで確認）、膀胱残尿増加</p>
              <p>原因：前立腺肥大、膀胱腫瘍、骨盤内腫瘍、尿路結石、留置カテーテル閉塞</p>
              <p className="text-green-400">治療：閉塞解除（カテーテル留置、泌尿器科コンサルト）</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mt-2">
          <p className="text-xs font-bold text-yellow-400 mb-1">その他の腎性AKI（鑑別が重要）</p>
          <p>急性糸球体腎炎（蛋白尿・血尿・赤血球円柱）</p>
          <p>急速進行性糸球体腎炎（RPGN）→ 迅速な生検・免疫抑制療法</p>
          <p>間質性腎炎（薬剤アレルギー：発熱・皮疹・好酸球増多）</p>
          <p>血栓性微小血管症（TMA）：MAHA + 血小板減少</p>
        </div>
      </div>
    </div>
  );
}

export function Section10_AKI() {
  return (
    <div>
      <FENaCalc />
      <FlowChart />
    </div>
  );
}
