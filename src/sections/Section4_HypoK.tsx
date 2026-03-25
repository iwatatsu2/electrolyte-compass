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

function TTKGCalcLow() {
  const [uK, setUK] = useState('');
  const [sK, setSK] = useState('');
  const [uOsm, setUOsm] = useState('');
  const [sOsm, setSOsm] = useState('');

  const uKV = parseFloat(uK); const sKV = parseFloat(sK); const uOV = parseFloat(uOsm); const sOV = parseFloat(sOsm);
  let result = null;
  if (!isNaN(uKV) && !isNaN(sKV) && !isNaN(uOV) && !isNaN(sOV) && sKV !== 0 && sOV !== 0) {
    const ttkg = (uKV / sKV) / (uOV / sOV);
    const judge = ttkg > 4 ? '腎性K喪失（アルドステロン過剰・Bartter・Gitelman等）' : ttkg < 2 ? '腎外性K喪失（嘔吐・下痢・皮膚）' : '判定困難（2-4）';
    const color: 'red' | 'yellow' | 'green' | 'normal' = ttkg > 4 ? 'red' : ttkg < 2 ? 'yellow' : 'normal';
    result = { ttkg, judge, color };
  }

  return (
    <CalcBox title="TTKG（経尿細管Kグラジエント）- 低K時">
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

function FEKCalc() {
  const [uK, setUK] = useState('');
  const [sK, setSK] = useState('');
  const [uCr, setUCr] = useState('');
  const [sCr, setSCr] = useState('');

  const uKV = parseFloat(uK); const sKV = parseFloat(sK); const uCV = parseFloat(uCr); const sCV = parseFloat(sCr);
  let result = null;
  if (!isNaN(uKV) && !isNaN(sKV) && !isNaN(uCV) && !isNaN(sCV) && sKV !== 0 && uCV !== 0) {
    const fek = (uKV * sCV) / (sKV * uCV) * 100;
    const judge = fek > 10 ? '腎性K喪失（FEK >10%）' : '腎外性K喪失（FEK <10%）';
    const color: 'red' | 'yellow' | 'green' | 'normal' = fek > 10 ? 'red' : 'yellow';
    result = { fek, judge, color };
  }

  return (
    <CalcBox title="FEK（K排泄分画）">
      <InputRow label="尿K" value={uK} onChange={setUK} unit="mEq/L" />
      <InputRow label="血清K" value={sK} onChange={setSK} unit="mEq/L" />
      <InputRow label="尿Cr" value={uCr} onChange={setUCr} unit="mg/dL" />
      <InputRow label="血清Cr" value={sCr} onChange={setSCr} unit="mg/dL" />
      {result && (
        <div className="mt-2 pt-2 border-t border-border">
          <Result label="FEK" value={`${result.fek.toFixed(1)} %`} />
          <Result label="判定" value={result.judge} color={result.color} />
        </div>
      )}
    </CalcBox>
  );
}

function FlowChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <h3 className="text-sm font-bold text-primary mb-3">低K鑑別フロー</h3>
      <div className="text-xs space-y-2">
        <div className="bg-muted rounded p-2">
          <p className="font-bold text-foreground">K &lt; 3.5 mEq/L</p>
        </div>
        <div className="pl-3 border-l-2 border-yellow-500 space-y-1">
          <p className="text-yellow-400 font-semibold">ECG確認：U波、T波平坦化、ST低下</p>
        </div>
        <div className="pl-3 border-l-2 border-primary space-y-1">
          <p className="font-semibold text-primary">TTKG/FEKで腎性・腎外性鑑別</p>
          <div className="pl-3 space-y-1">
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-red-400">腎性（TTKG &gt;4 / FEK &gt;10%）</p>
              <p>原発性アルドステロン症</p>
              <p>Bartter症候群（ループ利尿薬類似）</p>
              <p>Gitelman症候群（サイアザイド類似）</p>
              <p>尿細管性アシドーシス（RTA1・2型）</p>
              <p>低Mg血症（Mg欠乏でK喪失↑）</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <p className="font-bold text-yellow-400">腎外性（TTKG &lt;2 / FEK &lt;10%）</p>
              <p>嘔吐・下痢（UAGで確認）</p>
              <p>皮膚喪失（大量発汗・熱傷）</p>
              <p>摂取不足・アルコール</p>
              <p>インスリン過剰・アルカローシス（細胞内シフト）</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mt-2">
          <p className="text-xs font-bold text-yellow-400 mb-1">治療</p>
          <p><span className="text-red-400">K &lt;3.0 or 症状あり:</span> KCl iv（末梢 ≤20 mEq/hr）</p>
          <p><span className="text-yellow-400">K 3.0-3.5:</span> 経口K補充</p>
          <p className="text-primary">Mg欠乏合併時はMg先補充</p>
          <p>目標K: 4.0-4.5（心疾患・不整脈リスク患者）</p>
        </div>
      </div>
    </div>
  );
}

export function Section4_HypoK() {
  return (
    <div>
      <TTKGCalcLow />
      <FEKCalc />
      <FlowChart />
    </div>
  );
}
