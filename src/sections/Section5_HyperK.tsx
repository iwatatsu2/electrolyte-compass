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

function TTKGCalcHigh() {
  const [uK, setUK] = useState('');
  const [sK, setSK] = useState('');
  const [uOsm, setUOsm] = useState('');
  const [sOsm, setSOsm] = useState('');

  const uKV = parseFloat(uK); const sKV = parseFloat(sK); const uOV = parseFloat(uOsm); const sOV = parseFloat(sOsm);
  let result = null;
  if (!isNaN(uKV) && !isNaN(sKV) && !isNaN(uOV) && !isNaN(sOV) && sKV !== 0 && sOV !== 0) {
    const ttkg = (uKV / sKV) / (uOV / sOV);
    const judge = ttkg < 7 ? '低アルドステロン疑い（副腎不全・低レニン低アルドステロン）' : 'アルドステロン作用正常（腎外性 or 細胞外シフト）';
    const color: 'red' | 'yellow' | 'green' | 'normal' = ttkg < 7 ? 'red' : 'yellow';
    result = { ttkg, judge, color };
  }

  return (
    <CalcBox title="TTKG（経尿細管Kグラジエント）- 高K時">
      <InputRow label="尿K" value={uK} onChange={setUK} unit="mEq/L" />
      <InputRow label="血清K" value={sK} onChange={setSK} unit="mEq/L" />
      <InputRow label="尿浸透圧" value={uOsm} onChange={setUOsm} unit="mOsm/kg" />
      <InputRow label="血清浸透圧" value={sOsm} onChange={setSOsm} unit="mOsm/kg" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="TTKG" value={result.ttkg.toFixed(1)} />
          <Result label="判定" value={result.judge} color={result.color} />
        </div>
      )}
    </CalcBox>
  );
}

function FlowChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">高K鑑別・治療フロー</h3>
      <div className="text-xs space-y-2">
        <div className="bg-muted rounded p-2">
          <p className="font-bold text-foreground">K &gt; 5.5 mEq/L</p>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded p-2">
          <p className="font-bold text-red-400">まず偽性高K除外！</p>
          <p>溶血（採血手技）、白血球増多症（&gt;100,000/μL）、血小板増多症</p>
          <p>→ 再採血 or 血漿K測定で確認</p>
        </div>
        <div className="pl-3 border-l-2 border-red-500 space-y-1">
          <p className="font-semibold text-red-400">ECG変化あり → 緊急対応！</p>
          <p className="pl-3">テント状T波 → PR延長 → QRS幅広 → サインカーブ波 → VF</p>
        </div>
        <div className="pl-3 border-l-2 border-primary space-y-1">
          <p className="font-semibold text-primary">原因検索</p>
          <div className="pl-3 space-y-1">
            <p>薬剤：ACEi/ARB、K保持性利尿薬、NSAID、ST合剤、ヘパリン</p>
            <p>内分泌：副腎不全、低レニン低アルドステロン（糖尿病性腎症）</p>
            <p>腎不全：GFR &lt;30で高K リスク↑</p>
            <p>組織崩壊：横紋筋融解、腫瘍崩壊症候群、大量輸血</p>
            <p>代謝：アシドーシス（H⁺-K⁺交換でK細胞外シフト）</p>
          </div>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded p-3 mt-2">
          <p className="text-xs font-bold text-red-400 mb-1">治療（緊急度別）</p>
          <div className="space-y-1">
            <p><span className="text-red-400 font-bold">ECG変化あり:</span></p>
            <p className="pl-3">① グルコン酸Ca 10mL iv（心保護・5分以内）</p>
            <p className="pl-3">② インスリン6単位 + 50%Glu 50mL iv（K細胞内シフト）</p>
            <p className="pl-3">③ 重炭酸Na（アシドーシス合併時）</p>
            <p><span className="text-yellow-400 font-bold">K &gt;6.5 or 症状あり:</span></p>
            <p className="pl-3">④ カルメリメラートNa（腸管K排泄）</p>
            <p className="pl-3">⑤ フロセミド + 生食（尿からK排泄）</p>
            <p><span className="text-primary font-bold">維持:</span> 食事制限、原因薬中止、透析適応検討</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Section5_HyperK() {
  return (
    <div>
      <TTKGCalcHigh />
      <FlowChart />
    </div>
  );
}
