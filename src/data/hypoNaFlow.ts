import type { WorkupFlowDef } from '../components/WorkupFlow';

/** input ステップ用：Record として安全にアクセス */
function asRecord(v: Record<string, string> | string): Record<string, string> {
  return typeof v === 'string' ? {} : v;
}

export const hypoNaFlow: WorkupFlowDef = {
  title: '低Na血症 鑑別フロー',
  requiredTests: [
    { key: 'na',    label: 'Na',    unit: 'mEq/L',   category: 'blood' },
    { key: 'k',     label: 'K',     unit: 'mEq/L',   category: 'blood' },
    { key: 'cl',    label: 'Cl',    unit: 'mEq/L',   category: 'blood' },
    { key: 'bun',   label: 'BUN',   unit: 'mg/dL',   category: 'blood' },
    { key: 'cr',    label: 'Cr',    unit: 'mg/dL',   category: 'blood' },
    { key: 'gluc',  label: '血糖',  unit: 'mg/dL',   category: 'blood' },
    { key: 'alb',   label: 'Alb',   unit: 'g/dL',    category: 'blood' },
    { key: 'tprot', label: 'T-Prot', unit: 'g/dL',   category: 'blood' },
    { key: 'sOsm',  label: '血清浸透圧（実測）', unit: 'mOsm/kg', category: 'blood' },
    { key: 'uNa',   label: '尿Na',  unit: 'mEq/L',   category: 'urine' },
    { key: 'uK',    label: '尿K',   unit: 'mEq/L',   category: 'urine' },
    { key: 'uCr',   label: '尿Cr',  unit: 'mg/dL',   category: 'urine' },
    { key: 'uOsm',  label: '尿浸透圧', unit: 'mOsm/kg', category: 'urine' },
    { key: 'ecf',   label: '細胞外液量評価（浮腫・頸静脈怒張・脱水徴候）', unit: '', category: 'clinical' },
  ],
  startId: 'step1',
  steps: [
    // ─────────────────────────────────────────
    // Step 1: 血清浸透圧の評価（計算 or 実測）
    // ─────────────────────────────────────────
    {
      id: 'step1',
      title: 'Step 1: 血清浸透圧の評価',
      description: 'Na・血糖・BUNから計算します。実測値がある場合は「任意入力」に入れると優先されます。',
      type: 'input',
      inputs: [
        { key: 'na',   label: 'Na',   unit: 'mEq/L' },
        { key: 'gluc', label: '血糖', unit: 'mg/dL' },
        { key: 'bun',  label: 'BUN',  unit: 'mg/dL' },
        {
          key: 'sOsm',
          label: '血清浸透圧（実測）',
          unit: 'mOsm/kg',
          optional: true,
          note: '実測値を入力するとフローに優先使用されます（計算値も参考表示）',
        },
      ],
      calc: (v) => {
        const na   = parseFloat(v.na);
        const gluc = parseFloat(v.gluc);
        const bun  = parseFloat(v.bun);
        const measured = parseFloat(v.sOsm);
        const results = [];

        // 計算浸透圧（Na/Gluc/BUN が揃えば常に表示）
        if (!isNaN(na) && !isNaN(gluc) && !isNaN(bun)) {
          const calc = 2 * na + gluc / 18 + bun / 2.8;
          results.push({
            label: '計算浸透圧',
            value: `${calc.toFixed(0)} mOsm/kg`,
            interpretation: `2×Na + 血糖/18 + BUN/2.8`,
            color: 'green' as const,
          });
        }

        // 判定に使う値
        const osm = !isNaN(measured) ? measured : (!isNaN(na) && !isNaN(gluc) && !isNaN(bun) ? 2 * na + parseFloat(v.gluc) / 18 + parseFloat(v.bun) / 2.8 : NaN);

        if (!isNaN(measured)) {
          results.push({
            label: '実測浸透圧（優先使用）',
            value: `${measured} mOsm/kg`,
            interpretation: '↑ フローの判定にはこの値を使用します',
            color: 'yellow' as const,
          });
        }

        if (!isNaN(osm)) {
          let interp = '';
          let color: 'red' | 'yellow' | 'green' = 'red';
          if (osm < 275)       { interp = '低張性 → 真の低Na血症'; color = 'red'; }
          else if (osm <= 295) { interp = '等張性 → 偽性低Na（高脂血症・高蛋白血症）'; color = 'yellow'; }
          else                  { interp = '高張性 → 高浸透圧物質（高血糖・マンニトール）'; color = 'yellow'; }
          results.push({ label: '判定', value: osm < 275 ? '低張性' : osm <= 295 ? '等張性' : '高張性', interpretation: interp, color });
        }

        return results;
      },
      next: (v) => {
        const na   = parseFloat(v.na);
        const gluc = parseFloat(v.gluc);
        const bun  = parseFloat(v.bun);
        const measured = parseFloat(v.sOsm);
        const osm = !isNaN(measured) ? measured : 2 * na + gluc / 18 + bun / 2.8;
        if (isNaN(osm)) return 'step1';
        if (osm < 275) return 'step2';
        if (osm <= 295) return 'result_isotonic';
        return 'result_hypertonic';
      },
      ruledOut: (v) => {
        const r = asRecord(v);
        const na   = parseFloat(r.na);
        const gluc = parseFloat(r.gluc);
        const bun  = parseFloat(r.bun);
        const measured = parseFloat(r.sOsm);
        const osm = !isNaN(measured) ? measured : 2 * na + gluc / 18 + bun / 2.8;
        if (isNaN(osm)) return [];
        if (osm >= 275) {
          return ['SIADH', '腎性Na喪失', '腎外性Na喪失', '心不全による低Na', '肝硬変による低Na', 'ネフローゼによる低Na', '原発性多飲症', '腎不全による低Na'];
        }
        return [];
      },
    },

    // ─────────────────────────────────────────
    // 等張性・高張性の結果
    // ─────────────────────────────────────────
    {
      id: 'result_isotonic',
      title: '診断: 等張性低Na（偽性低Na）',
      type: 'result',
      diagnosis: '等張性低Na（偽性低Na）',
      detail: '高脂血症・高蛋白血症による偽性低Naを疑う。血清浸透圧は正常であり、真の低張性低Na血症ではない。直接電極法で再測定することで確認できる。',
      treatment: '原疾患の治療（高脂血症・高蛋白血症）。低Na自体への直接治療は不要。',
      resultColor: 'yellow',
    },
    {
      id: 'result_hypertonic',
      title: '診断: 高張性低Na',
      type: 'result',
      diagnosis: '高張性低Na',
      detail: '高血糖・マンニトール等の高浸透圧物質による希釈性低Na。補正Na = 実測Na + (血糖 - 100) / 100 × 1.6',
      treatment: '原疾患（高血糖など）の治療。インスリン投与で血糖を下げるとNaは改善する。',
      resultColor: 'yellow',
    },

    // ─────────────────────────────────────────
    // Step 2: 尿浸透圧（ADH活性の評価）
    // ─────────────────────────────────────────
    {
      id: 'step2',
      title: 'Step 2: 尿浸透圧の評価',
      description: '尿浸透圧を入力してADH活性を評価します',
      type: 'input',
      inputs: [
        { key: 'uOsm', label: '尿浸透圧', unit: 'mOsm/kg' },
      ],
      calc: (v) => {
        const uOsm = parseFloat(v.uOsm);
        if (isNaN(uOsm)) return [];
        let interp = '';
        let color: 'red' | 'yellow' | 'green' = 'red';
        if (uOsm < 100) { interp = '水利尿（ADH抑制）→ 原発性多飲症・ビール多飲・低溶質食'; color = 'green'; }
        else { interp = 'ADH活性あり → 細胞外液量評価へ'; color = 'red'; }
        return [
          { label: '尿浸透圧', value: `${uOsm} mOsm/kg`, interpretation: interp, color },
        ];
      },
      next: (v) => {
        const uOsm = parseFloat(v.uOsm);
        if (isNaN(uOsm)) return 'step2';
        return uOsm < 100 ? 'result_water_diuresis' : 'step3';
      },
      ruledOut: (v) => {
        const r = asRecord(v);
        const uOsm = parseFloat(r.uOsm);
        if (isNaN(uOsm)) return [];
        if (uOsm < 100) {
          return ['SIADH', '心不全による低Na', '肝硬変による低Na', 'ネフローゼによる低Na', '腎不全による低Na', '腎性Na喪失', '腎外性Na喪失'];
        } else {
          return ['原発性多飲症', '低溶質食（tea & toast）'];
        }
      },
    },
    {
      id: 'result_water_diuresis',
      title: '診断: 水利尿（ADH抑制）',
      type: 'result',
      diagnosis: '水利尿（ADH抑制）',
      detail: '尿浸透圧 < 100 mOsm/kg はADH抑制を示す。原発性多飲症・ビール多飲症・低溶質食（tea & toast syndrome）を考慮する。',
      treatment: '水分摂取制限。原因行動の修正。低溶質食の場合は栄養指導。',
      resultColor: 'green',
    },

    // ─────────────────────────────────────────
    // Step 3: 細胞外液量
    // ─────────────────────────────────────────
    {
      id: 'step3',
      title: 'Step 3: 細胞外液量の評価（臨床判断）',
      description: '身体所見から細胞外液量を評価してください',
      type: 'select',
      options: [
        {
          label: '低下（脱水）',
          value: 'low',
          description: '皮膚ツルゴール低下・粘膜乾燥・頸静脈虚脱・起立性低血圧',
        },
        {
          label: '正常（等容量）',
          value: 'normal',
          description: '浮腫なし・脱水なし・身体所見に異常なし',
        },
        {
          label: '増加（浮腫）',
          value: 'high',
          description: '浮腫・腹水・頸静脈怒張・肝腫大',
        },
      ],
      onSelect: (v) => {
        if (v === 'low') return 'step4a';
        if (v === 'normal') return 'step4b';
        return 'step4c';
      },
      ruledOut: (v) => { const r = asRecord(v);
        const sel = typeof v === 'string' ? v : '';
        if (sel === 'low') {
          return ['SIADH', '心不全による低Na', '肝硬変による低Na', 'ネフローゼによる低Na', '腎不全による低Na'];
        }
        if (sel === 'normal') {
          return ['心不全による低Na', '肝硬変による低Na', 'ネフローゼによる低Na', '腎外性Na喪失', '腎性Na喪失'];
        }
        if (sel === 'high') {
          return ['SIADH', '腎外性Na喪失', '腎性Na喪失'];
        }
        return [];
      },
    },

    // ─────────────────────────────────────────
    // Step 4a: 低ECF → 尿Na
    // ─────────────────────────────────────────
    {
      id: 'step4a',
      title: 'Step 4a: 低ECF → 尿Na測定',
      description: '尿Naで腎性・腎外性Na喪失を鑑別します',
      type: 'input',
      inputs: [
        { key: 'uNa', label: '尿Na', unit: 'mEq/L' },
      ],
      calc: (v) => {
        const uNa = parseFloat(v.uNa);
        if (isNaN(uNa)) return [];
        let interp = '';
        let color: 'red' | 'yellow' | 'green' = 'red';
        if (uNa < 20) { interp = '腎外性Na喪失（尿細管はNaを保持）'; color = 'yellow'; }
        else { interp = '腎性Na喪失（尿細管がNaを保持できない）'; color = 'red'; }
        return [{ label: '尿Na', value: `${uNa} mEq/L`, interpretation: interp, color }];
      },
      next: (v) => {
        const uNa = parseFloat(v.uNa);
        if (isNaN(uNa)) return 'step4a';
        return uNa < 20 ? 'result_extrarenal' : 'result_renal_loss';
      },
      ruledOut: (v) => {
        const r = asRecord(v);
        const uNa = parseFloat(r.uNa);
        if (isNaN(uNa)) return [];
        if (uNa < 20) return ['腎性Na喪失（利尿薬・副腎不全・CSW）'];
        return ['腎外性Na喪失（嘔吐・下痢・熱傷）'];
      },
    },
    {
      id: 'result_extrarenal',
      title: '診断: 腎外性Na喪失',
      type: 'result',
      diagnosis: '腎外性Na喪失',
      detail: '嘔吐・下痢・熱傷・第3腔喪失（膵炎・腸閉塞）。腎臓はNaを保持しようとしているため尿Naは低値。',
      treatment: '生理食塩水で循環血漿量補正。補正速度に注意（慢性例は < 10 mEq/L/day、ハイリスク例〔アルコール・低K・低栄養・肝疾患〕は < 8 mEq/L/day でODS予防）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_renal_loss',
      title: '診断: 腎性Na喪失',
      type: 'result',
      diagnosis: '腎性Na喪失',
      detail: '利尿薬（特にサイアザイド系）・塩類喪失性腎症・副腎不全（ミネラルコルチコイド欠乏）・脳性塩類喪失症候群（CSW）。',
      treatment: '原疾患治療。副腎不全は必ずコルチゾール補充（ヒドロコルチゾン）。循環血漿量補正には生食を使用。',
      resultColor: 'red',
    },

    // ─────────────────────────────────────────
    // Step 4b: 等容量 → SIADH確認
    // ─────────────────────────────────────────
    {
      id: 'step4b',
      title: 'Step 4b: 等容量 → SIADH確認',
      description: '尿Na・尿浸透圧でSIADH診断基準を確認します',
      type: 'input',
      inputs: [
        { key: 'uNa',  label: '尿Na',   unit: 'mEq/L' },
        { key: 'uOsm', label: '尿浸透圧', unit: 'mOsm/kg' },
      ],
      calc: (v) => {
        const uNa  = parseFloat(v.uNa);
        const uOsm = parseFloat(v.uOsm);
        const results = [];
        if (!isNaN(uNa)) {
          results.push({
            label: '尿Na',
            value: `${uNa} mEq/L`,
            interpretation: uNa >= 40 ? 'SIADH基準満たす (≥40)' : 'SIADH基準未満 (<40)',
            color: (uNa >= 40 ? 'red' : 'green') as 'red' | 'green',
          });
        }
        if (!isNaN(uOsm)) {
          results.push({
            label: '尿浸透圧',
            value: `${uOsm} mOsm/kg`,
            interpretation: uOsm > 100 ? 'ADH活性あり (>100)' : 'ADH抑制',
            color: (uOsm > 100 ? 'red' : 'green') as 'red' | 'green',
          });
        }
        return results;
      },
      next: (v) => {
        const uNa = parseFloat(v.uNa);
        if (isNaN(uNa)) return 'step4b';
        return uNa >= 40 ? 'result_siadh' : 'result_other_euvolemic';
      },
      ruledOut: (v) => {
        const r = asRecord(v);
        const uNa  = parseFloat(r.uNa);
        const uOsm = parseFloat(r.uOsm);
        const ruled: string[] = [];
        if (!isNaN(uNa) && uNa < 40) ruled.push('SIADH');
        if (!isNaN(uOsm) && uOsm <= 100) ruled.push('SIADH（ADH抑制のため）');
        return ruled;
      },
    },
    {
      id: 'result_siadh',
      title: '診断: SIADH疑い',
      type: 'result',
      diagnosis: 'SIADH疑い',
      detail: '診断基準: 低張性低Na + 尿浸透圧 > 100 mOsm/kg + 尿Na > 40 mEq/L + 副腎・甲状腺・腎機能正常。\n除外必須: 甲状腺機能低下症（TSH測定）、コルチゾール欠乏（コルチゾール・ACTH測定）。',
      treatment: '水制限（500〜1000 mL/day）・食塩補充・重症例はバプタン系（トルバプタン）・けいれん時は3%食塩水（最初の数時間1〜2 mEq/L/hr）。補正速度：< 10 mEq/L/day（ハイリスク例は < 8）でODS予防。',
      resultColor: 'red',
    },
    {
      id: 'result_other_euvolemic',
      title: '診断: 等容量性低Na（SIADH以外）',
      type: 'result',
      diagnosis: '等容量性低Na（SIADH以外）',
      detail: '甲状腺機能低下症（TSH必須）・糖質コルチコイド欠乏（コルチゾール・ACTH測定）・低溶質食（tea & toast）を考慮。',
      treatment: '原疾患の治療。甲状腺機能低下症はレボチロキシン。副腎不全はコルチゾール補充。',
      resultColor: 'yellow',
    },

    // ─────────────────────────────────────────
    // Step 4c: 高ECF → 尿Na
    // ─────────────────────────────────────────
    {
      id: 'step4c',
      title: 'Step 4c: 高ECF → 尿Na測定',
      description: '尿Naで有効循環血漿量低下の程度を評価します',
      type: 'input',
      inputs: [
        { key: 'uNa', label: '尿Na', unit: 'mEq/L' },
      ],
      calc: (v) => {
        const uNa = parseFloat(v.uNa);
        if (isNaN(uNa)) return [];
        let interp = '';
        let color: 'red' | 'yellow' | 'green' = 'red';
        if (uNa < 20) { interp = '有効循環血漿量低下→ADH二次分泌↑（心不全・肝硬変・ネフローゼ）'; color = 'red'; }
        else { interp = '腎からのNa排泄障害（腎不全）'; color = 'yellow'; }
        return [{ label: '尿Na', value: `${uNa} mEq/L`, interpretation: interp, color }];
      },
      next: (v) => {
        const uNa = parseFloat(v.uNa);
        if (isNaN(uNa)) return 'step4c';
        return uNa < 20 ? 'result_edematous' : 'result_renal_failure';
      },
      ruledOut: (v) => {
        const r = asRecord(v);
        const uNa = parseFloat(r.uNa);
        if (isNaN(uNa)) return [];
        if (uNa < 20) return ['腎不全による低Na'];
        return ['心不全による低Na', '肝硬変による低Na', 'ネフローゼによる低Na'];
      },
    },
    {
      id: 'result_edematous',
      title: '診断: 浮腫性疾患による低Na',
      type: 'result',
      diagnosis: '浮腫性疾患による低Na',
      detail: '心不全・肝硬変・ネフローゼ症候群。いずれも有効循環血漿量低下によるADH二次分泌↑が機序。総体液量は増加しているが有効循環血漿量は低下。',
      treatment: '原疾患治療。水制限・利尿薬（ループ利尿薬）。急速補正は危険（ODS）。',
      resultColor: 'red',
    },
    {
      id: 'result_renal_failure',
      title: '診断: 腎不全による低Na',
      type: 'result',
      diagnosis: '腎不全による低Na',
      detail: '慢性腎臓病・急性腎障害での水排泄障害。GFRが著しく低下すると希釈能が障害される。',
      treatment: '水制限。透析適応の検討（重症腎不全・保存的治療困難例）。',
      resultColor: 'yellow',
    },
  ],
};
