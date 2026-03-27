import React, { useState } from 'react';

export interface RequiredTest {
  key: string;
  label: string;
  unit: string;
  category: 'blood' | 'urine' | 'clinical';
}

export interface FlowStep {
  id: string;
  title: string;
  description?: string;
  type: 'input' | 'select' | 'result';
  inputs?: Array<{ key: string; label: string; unit: string }>;
  calc?: (values: Record<string, string>) => Array<{
    label: string;
    value: string;
    interpretation?: string;
    color?: 'red' | 'yellow' | 'green';
  }>;
  next?: (values: Record<string, string>) => string;
  options?: Array<{ label: string; value: string; description?: string; color?: string }>;
  onSelect?: (selected: string) => string;
  diagnosis?: string;
  detail?: string;
  treatment?: string;
  resultColor?: 'red' | 'yellow' | 'green';
}

export interface WorkupFlowDef {
  title: string;
  requiredTests: RequiredTest[];
  steps: FlowStep[];
  startId: string;
}

interface StepRecord {
  stepId: string;
  inputValues?: Record<string, string>;
  calcResults?: Array<{ label: string; value: string; interpretation?: string; color?: 'red' | 'yellow' | 'green' }>;
  selectedOption?: string;
  selectedLabel?: string;
}

const ACCENT = '#f97316';

function colorClass(color?: 'red' | 'yellow' | 'green') {
  if (color === 'red') return 'text-red-400';
  if (color === 'yellow') return 'text-yellow-400';
  if (color === 'green') return 'text-green-400';
  return 'text-foreground';
}

function bgColorClass(color?: 'red' | 'yellow' | 'green') {
  if (color === 'red') return 'bg-red-900/30 border-red-700';
  if (color === 'yellow') return 'bg-yellow-900/30 border-yellow-700';
  if (color === 'green') return 'bg-green-900/30 border-green-700';
  return 'bg-card border-border';
}

interface RequiredTestsPanelProps {
  tests: RequiredTest[];
}

function RequiredTestsPanel({ tests }: RequiredTestsPanelProps) {
  const [open, setOpen] = useState(true);
  const blood = tests.filter(t => t.category === 'blood');
  const urine = tests.filter(t => t.category === 'urine');
  const clinical = tests.filter(t => t.category === 'clinical');

  return (
    <div className="bg-card border border-border rounded-lg mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ color: ACCENT }}
      >
        <span className="text-sm font-bold">必要な検査一覧</span>
        <span className="text-xs">{open ? '▲ 閉じる' : '▼ 開く'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {blood.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">血液検査</p>
              <div className="flex flex-wrap gap-1">
                {blood.map(t => (
                  <span key={t.key} className="text-xs bg-muted rounded px-2 py-0.5 text-foreground">
                    {t.label} <span className="text-muted-foreground">({t.unit})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {urine.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">尿検査</p>
              <div className="flex flex-wrap gap-1">
                {urine.map(t => (
                  <span key={t.key} className="text-xs bg-muted rounded px-2 py-0.5 text-foreground">
                    {t.label} <span className="text-muted-foreground">({t.unit})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {clinical.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">臨床評価</p>
              <div className="flex flex-wrap gap-1">
                {clinical.map(t => (
                  <span key={t.key} className="text-xs bg-muted rounded px-2 py-0.5 text-foreground">
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SummaryStepProps {
  record: StepRecord;
  step: FlowStep;
}

function SummaryStep({ record, step }: SummaryStepProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-muted rounded-lg mb-2 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-xs font-semibold text-foreground">{step.title}</span>
        <span className="text-xs text-muted-foreground">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 text-xs space-y-1">
          {record.inputValues && step.inputs?.map(inp => (
            <div key={inp.key} className="flex gap-2">
              <span className="text-muted-foreground">{inp.label}:</span>
              <span className="text-foreground font-semibold">{record.inputValues![inp.key] || '—'} {inp.unit}</span>
            </div>
          ))}
          {record.calcResults?.map((r, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground">{r.label}:</span>
              <span className={`font-semibold ${colorClass(r.color)}`}>{r.value}</span>
            </div>
          ))}
          {record.selectedLabel && (
            <div className="flex gap-2">
              <span className="text-muted-foreground">選択:</span>
              <span className="text-foreground font-semibold">{record.selectedLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface InputStepProps {
  step: FlowStep;
  onComplete: (values: Record<string, string>, nextId: string, calcResults: Array<{ label: string; value: string; interpretation?: string; color?: 'red' | 'yellow' | 'green' }>) => void;
}

function InputStep({ step, onComplete }: InputStepProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const calcResults = step.calc ? step.calc(values) : [];
  const allFilled = step.inputs ? step.inputs.every(inp => values[inp.key] && values[inp.key] !== '') : true;

  const handleNext = () => {
    if (!step.next) return;
    const nextId = step.next(values);
    onComplete(values, nextId, calcResults);
  };

  return (
    <div className="bg-card border rounded-lg p-4 mb-4" style={{ borderColor: ACCENT }}>
      <h3 className="text-sm font-bold mb-1" style={{ color: ACCENT }}>{step.title}</h3>
      {step.description && <p className="text-xs text-muted-foreground mb-3">{step.description}</p>}
      <div className="space-y-2 mb-3">
        {step.inputs?.map(inp => (
          <div key={inp.key} className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-32 flex-shrink-0">{inp.label}</label>
            <input
              type="number"
              value={values[inp.key] || ''}
              onChange={e => setValues(v => ({ ...v, [inp.key]: e.target.value }))}
              className="flex-1 bg-input border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
            />
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{inp.unit}</span>
          </div>
        ))}
      </div>
      {calcResults.length > 0 && (
        <div className="bg-muted rounded p-3 mb-3 space-y-1">
          {calcResults.map((r, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="text-muted-foreground">{r.label}:</span>
              <span className={`font-semibold ${colorClass(r.color)}`}>{r.value}</span>
              {r.interpretation && <span className="text-muted-foreground">— {r.interpretation}</span>}
            </div>
          ))}
        </div>
      )}
      {step.next && (
        <button
          onClick={handleNext}
          disabled={!allFilled}
          className="w-full py-2 rounded text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          style={{ backgroundColor: allFilled ? ACCENT : undefined }}
        >
          次へ →
        </button>
      )}
    </div>
  );
}

interface SelectStepProps {
  step: FlowStep;
  onComplete: (value: string, label: string, nextId: string) => void;
}

function SelectStep({ step, onComplete }: SelectStepProps) {
  return (
    <div className="bg-card border rounded-lg p-4 mb-4" style={{ borderColor: ACCENT }}>
      <h3 className="text-sm font-bold mb-1" style={{ color: ACCENT }}>{step.title}</h3>
      {step.description && <p className="text-xs text-muted-foreground mb-3">{step.description}</p>}
      <div className="space-y-2">
        {step.options?.map(opt => (
          <button
            key={opt.value}
            onClick={() => {
              if (!step.onSelect) return;
              const nextId = step.onSelect(opt.value);
              onComplete(opt.value, opt.label, nextId);
            }}
            className="w-full text-left p-3 rounded border border-border bg-muted hover:bg-muted/70 transition-colors"
          >
            <p className="text-xs font-semibold text-foreground">{opt.label}</p>
            {opt.description && <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ResultStepProps {
  step: FlowStep;
  onReset: () => void;
}

function ResultStep({ step, onReset }: ResultStepProps) {
  const borderColorStyle = step.resultColor === 'red' ? '#ef4444' : step.resultColor === 'green' ? '#22c55e' : step.resultColor === 'yellow' ? '#eab308' : ACCENT;
  return (
    <div className={`rounded-lg p-4 mb-4 border ${bgColorClass(step.resultColor)}`}>
      <p className="text-xs font-bold mb-1" style={{ color: borderColorStyle }}>診断</p>
      <p className={`text-sm font-bold mb-3 ${colorClass(step.resultColor)}`}>{step.diagnosis}</p>
      {step.detail && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">詳細</p>
          <p className="text-xs text-foreground leading-relaxed">{step.detail}</p>
        </div>
      )}
      {step.treatment && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-1">治療</p>
          <p className="text-xs text-foreground leading-relaxed">{step.treatment}</p>
        </div>
      )}
      <button
        onClick={onReset}
        className="w-full py-2 rounded text-xs font-bold text-white"
        style={{ backgroundColor: ACCENT }}
      >
        最初からやり直す
      </button>
    </div>
  );
}

interface WorkupFlowProps {
  def: WorkupFlowDef;
}

export function WorkupFlow({ def }: WorkupFlowProps) {
  const [history, setHistory] = useState<StepRecord[]>([]);
  const [currentStepId, setCurrentStepId] = useState(def.startId);

  const stepMap = new Map(def.steps.map(s => [s.id, s]));
  const currentStep = stepMap.get(currentStepId);

  const handleReset = () => {
    setHistory([]);
    setCurrentStepId(def.startId);
  };

  const handleInputComplete = (
    values: Record<string, string>,
    nextId: string,
    calcResults: Array<{ label: string; value: string; interpretation?: string; color?: 'red' | 'yellow' | 'green' }>
  ) => {
    setHistory(h => [...h, { stepId: currentStepId, inputValues: values, calcResults }]);
    setCurrentStepId(nextId);
  };

  const handleSelectComplete = (value: string, label: string, nextId: string) => {
    setHistory(h => [...h, { stepId: currentStepId, selectedOption: value, selectedLabel: label }]);
    setCurrentStepId(nextId);
  };

  if (!currentStep) return null;

  return (
    <div>
      <RequiredTestsPanel tests={def.requiredTests} />

      {/* History summary */}
      {history.length > 0 && (
        <div className="mb-4">
          {history.map((record, i) => {
            const step = stepMap.get(record.stepId);
            if (!step) return null;
            return <SummaryStep key={i} record={record} step={step} />;
          })}
        </div>
      )}

      {/* Current step */}
      {currentStep.type === 'input' && (
        <InputStep step={currentStep} onComplete={handleInputComplete} />
      )}
      {currentStep.type === 'select' && (
        <SelectStep step={currentStep} onComplete={handleSelectComplete} />
      )}
      {currentStep.type === 'result' && (
        <ResultStep step={currentStep} onReset={handleReset} />
      )}
    </div>
  );
}
