import type { WorkupFlowDef } from '../components/WorkupFlow';

export const acidBaseFlow: WorkupFlowDef = {
  title: '酸塩基平衡 鑑別フロー',
  requiredTests: [
    { key: 'ph', label: 'pH', unit: '', category: 'blood' },
    { key: 'paco2', label: 'PaCO₂', unit: 'mmHg', category: 'blood' },
    { key: 'hco3', label: 'HCO₃', unit: 'mEq/L', category: 'blood' },
    { key: 'na', label: 'Na', unit: 'mEq/L', category: 'blood' },
    { key: 'cl', label: 'Cl', unit: 'mEq/L', category: 'blood' },
    { key: 'alb', label: 'Alb', unit: 'g/dL', category: 'blood' },
    { key: 'bun', label: 'BUN', unit: 'mg/dL', category: 'blood' },
    { key: 'gluc', label: '血糖', unit: 'mg/dL', category: 'blood' },
    { key: 'uNa', label: '尿Na', unit: 'mEq/L', category: 'urine' },
    { key: 'uK', label: '尿K', unit: 'mEq/L', category: 'urine' },
    { key: 'uCl', label: '尿Cl', unit: 'mEq/L', category: 'urine' },
    { key: 'uOsm', label: '尿浸透圧', unit: 'mOsm/kg', category: 'urine' },
  ],
  startId: 'step1',
  steps: [
    {
      id: 'step1',
      title: 'Step 1: 一次性障害の判定',
      description: 'pH・PaCO₂・HCO₃を入力して一次性の酸塩基障害を判定します',
      type: 'input',
      inputs: [
        { key: 'ph', label: 'pH', unit: '' },
        { key: 'paco2', label: 'PaCO₂', unit: 'mmHg' },
        { key: 'hco3', label: 'HCO₃', unit: 'mEq/L' },
      ],
      calc: (v) => {
        const ph = parseFloat(v.ph);
        const paco2 = parseFloat(v.paco2);
        const hco3 = parseFloat(v.hco3);
        if (isNaN(ph) || isNaN(paco2) || isNaN(hco3)) return [];
        let disorder = '';
        let color: 'red' | 'yellow' | 'green' = 'red';
        if (ph < 7.35) {
          if (hco3 < 22) { disorder = '代謝性アシドーシス（一次性）'; }
          else if (paco2 > 45) { disorder = '呼吸性アシドーシス（一次性）'; }
          else { disorder = '混合性アシドーシス'; }
        } else if (ph > 7.45) {
          if (hco3 > 26) { disorder = '代謝性アルカローシス（一次性）'; color = 'yellow'; }
          else if (paco2 < 35) { disorder = '呼吸性アルカローシス（一次性）'; color = 'yellow'; }
          else { disorder = '混合性アルカローシス'; color = 'yellow'; }
        } else {
          disorder = 'pH正常範囲（混合性障害または代償完了）'; color = 'green';
        }
        return [
          { label: '一次性障害', value: disorder, color },
        ];
      },
      next: (v) => {
        const ph = parseFloat(v.ph);
        const hco3 = parseFloat(v.hco3);
        const paco2 = parseFloat(v.paco2);
        if (isNaN(ph) || isNaN(hco3) || isNaN(paco2)) return 'step1';
        if (ph < 7.35 && hco3 < 22) return 'step2_met_acid';
        if (ph < 7.35 && paco2 > 45) return 'step2_resp_acid';
        if (ph > 7.45 && hco3 > 26) return 'step2_met_alk';
        if (ph > 7.45 && paco2 < 35) return 'result_resp_alk';
        return 'step2_met_acid';
      },
    },

    // 代謝性アシドーシス → AG計算
    {
      id: 'step2_met_acid',
      title: 'Step 2: AG（アニオンギャップ）計算',
      description: 'Na・Cl・HCO₃・Albを入力してAGを計算します。Albが低い場合は補正AGも算出します',
      type: 'input',
      inputs: [
        { key: 'na', label: 'Na', unit: 'mEq/L' },
        { key: 'cl', label: 'Cl', unit: 'mEq/L' },
        { key: 'hco3', label: 'HCO₃', unit: 'mEq/L' },
        { key: 'alb', label: 'Alb（任意）', unit: 'g/dL' },
      ],
      calc: (v) => {
        const na = parseFloat(v.na);
        const cl = parseFloat(v.cl);
        const hco3 = parseFloat(v.hco3);
        const alb = parseFloat(v.alb);
        if (isNaN(na) || isNaN(cl) || isNaN(hco3)) return [];
        const ag = na - (cl + hco3);
        const corrAG = !isNaN(alb) ? ag + 2.5 * (4.0 - alb) : null;
        const results = [
          {
            label: 'AG',
            value: `${ag.toFixed(1)} mEq/L`,
            interpretation: ag > 12 ? '高AG（>12）→ 高AG代謝性アシドーシス' : '正常AG（≤12）→ 正常AG代謝性アシドーシス',
            color: (ag > 12 ? 'red' : 'yellow') as 'red' | 'yellow',
          },
        ];
        if (corrAG !== null) {
          results.push({
            label: '補正AG',
            value: `${corrAG.toFixed(1)} mEq/L`,
            interpretation: corrAG > 12 ? '低Alb補正後も高AG' : '補正後は正常AG',
            color: (corrAG > 12 ? 'red' : 'yellow') as 'red' | 'yellow',
          });
        }
        return results;
      },
      next: (v) => {
        const na = parseFloat(v.na);
        const cl = parseFloat(v.cl);
        const hco3 = parseFloat(v.hco3);
        const alb = parseFloat(v.alb);
        if (isNaN(na) || isNaN(cl) || isNaN(hco3)) return 'step2_met_acid';
        const ag = na - (cl + hco3);
        const effAG = !isNaN(alb) ? ag + 2.5 * (4.0 - alb) : ag;
        return effAG > 12 ? 'step3_high_ag' : 'step3_normal_ag';
      },
    },

    // 高AG → デルタ比 + Winter式
    {
      id: 'step3_high_ag',
      title: 'Step 3a: デルタ比（ΔAG/ΔHCO₃）+ Winter式',
      description: '混合性障害の評価と呼吸代償の確認を行います',
      type: 'input',
      inputs: [
        { key: 'ag', label: 'AG', unit: 'mEq/L' },
        { key: 'hco3', label: 'HCO₃', unit: 'mEq/L' },
        { key: 'paco2', label: '実測PaCO₂', unit: 'mmHg' },
      ],
      calc: (v) => {
        const ag = parseFloat(v.ag);
        const hco3 = parseFloat(v.hco3);
        const paco2 = parseFloat(v.paco2);
        const results = [];
        if (!isNaN(ag) && !isNaN(hco3)) {
          const dAG = ag - 12;
          const dHco3 = 24 - hco3;
          const ratio = dHco3 !== 0 ? dAG / dHco3 : null;
          let judge = '';
          let color: 'red' | 'yellow' | 'green' = 'yellow';
          if (ratio !== null) {
            if (ratio < 1.0) { judge = '混合性（高AG＋正常AG代謝性アシドーシス）'; color = 'red'; }
            else if (ratio <= 2.0) { judge = '単純高AG代謝性アシドーシス'; color = 'red'; }
            else { judge = '高AG＋代謝性アルカローシス混合'; color = 'yellow'; }
            results.push({ label: 'デルタ比', value: ratio.toFixed(2), interpretation: judge, color });
          }
        }
        if (!isNaN(hco3)) {
          const predLow = 1.5 * hco3 + 8 - 2;
          const predHigh = 1.5 * hco3 + 8 + 2;
          results.push({ label: 'Winter式 予測PaCO₂', value: `${predLow.toFixed(0)}〜${predHigh.toFixed(0)} mmHg`, interpretation: '', color: 'green' as 'green' });
          if (!isNaN(paco2)) {
            let compJudge = '';
            let compColor: 'red' | 'yellow' | 'green' = 'green';
            if (paco2 >= predLow && paco2 <= predHigh) { compJudge = '適切な呼吸代償'; }
            else if (paco2 < predLow) { compJudge = '呼吸性アルカローシス合併'; compColor = 'yellow'; }
            else { compJudge = '呼吸性アシドーシス合併'; compColor = 'red'; }
            results.push({ label: '代償評価', value: compJudge, interpretation: '', color: compColor });
          }
        }
        return results;
      },
      next: (v) => {
        const ag = parseFloat(v.ag);
        const hco3 = parseFloat(v.hco3);
        if (isNaN(ag) || isNaN(hco3)) return 'step3_high_ag';
        const dAG = ag - 12;
        const dHco3 = 24 - hco3;
        const ratio = dHco3 !== 0 ? dAG / dHco3 : 1;
        if (ratio < 1.0) return 'result_mixed_high_normal_ag';
        if (ratio > 2.0) return 'result_mixed_high_ag_alk';
        return 'result_high_ag';
      },
    },

    // 正常AG → UAG
    {
      id: 'step3_normal_ag',
      title: 'Step 3b: UAG（尿アニオンギャップ）',
      description: '腸管性（下痢）vs 尿細管性アシドーシス（RTA）を鑑別します',
      type: 'input',
      inputs: [
        { key: 'uNa', label: '尿Na', unit: 'mEq/L' },
        { key: 'uK', label: '尿K', unit: 'mEq/L' },
        { key: 'uCl', label: '尿Cl', unit: 'mEq/L' },
      ],
      calc: (v) => {
        const uNa = parseFloat(v.uNa);
        const uK = parseFloat(v.uK);
        const uCl = parseFloat(v.uCl);
        if (isNaN(uNa) || isNaN(uK) || isNaN(uCl)) return [];
        const uag = uNa + uK - uCl;
        const judge = uag < 0 ? '陰性 → 下痢（腸管性HCO₃喪失）。NH₄⁺産生は正常' : '陽性 → RTA疑い。NH₄⁺産生低下';
        const color: 'red' | 'yellow' | 'green' = uag < 0 ? 'yellow' : 'red';
        return [{ label: 'UAG', value: `${uag.toFixed(1)} mEq/L`, interpretation: judge, color }];
      },
      next: (v) => {
        const uNa = parseFloat(v.uNa);
        const uK = parseFloat(v.uK);
        const uCl = parseFloat(v.uCl);
        if (isNaN(uNa) || isNaN(uK) || isNaN(uCl)) return 'step3_normal_ag';
        return (uNa + uK - uCl) < 0 ? 'result_gi_loss' : 'result_rta';
      },
    },

    // 呼吸性アシドーシス → 代償評価
    {
      id: 'step2_resp_acid',
      title: 'Step 2: 呼吸性アシドーシス 代償評価',
      description: '急性 vs 慢性の判定と代謝代償を評価します',
      type: 'input',
      inputs: [
        { key: 'paco2', label: 'PaCO₂', unit: 'mmHg' },
        { key: 'hco3', label: 'HCO₃', unit: 'mEq/L' },
      ],
      calc: (v) => {
        const paco2 = parseFloat(v.paco2);
        const hco3 = parseFloat(v.hco3);
        if (isNaN(paco2) || isNaN(hco3)) return [];
        const dPaco2 = paco2 - 40;
        const acuteHco3 = 24 + dPaco2 * 0.1;
        const chronicHco3 = 24 + dPaco2 * 0.35;
        let interp = '';
        let color: 'red' | 'yellow' | 'green' = 'yellow';
        const diff = Math.abs(hco3 - acuteHco3);
        const diffChronic = Math.abs(hco3 - chronicHco3);
        if (diff <= 2) { interp = '急性呼吸性アシドーシス（代償適切）'; }
        else if (diffChronic <= 3) { interp = '慢性呼吸性アシドーシス（代償適切）'; }
        else if (hco3 < acuteHco3 - 2) { interp = '代謝性アシドーシス合併'; color = 'red'; }
        else { interp = '代謝性アルカローシス合併'; color = 'yellow'; }
        return [
          { label: '急性代償予測 HCO₃', value: `${acuteHco3.toFixed(1)} mEq/L`, interpretation: '', color: 'green' as 'green' },
          { label: '慢性代償予測 HCO₃', value: `${chronicHco3.toFixed(1)} mEq/L`, interpretation: '', color: 'green' as 'green' },
          { label: '代償評価', value: interp, interpretation: '', color },
        ];
      },
      next: () => 'result_resp_acid',
    },

    // 代謝性アルカローシス
    {
      id: 'step2_met_alk',
      title: 'Step 2: 代謝性アルカローシス 原因評価',
      description: '尿Clで食塩反応性 vs 食塩抵抗性を鑑別します',
      type: 'input',
      inputs: [
        { key: 'uCl', label: '尿Cl', unit: 'mEq/L' },
      ],
      calc: (v) => {
        const uCl = parseFloat(v.uCl);
        if (isNaN(uCl)) return [];
        const judge = uCl < 20 ? '食塩反応性（Cl欠乏）→ 嘔吐・利尿薬・低Cl摂取' : '食塩抵抗性 → 高アルドステロン・Mg欠乏・Bartter/Gitelman';
        const color: 'red' | 'yellow' | 'green' = uCl < 20 ? 'yellow' : 'red';
        return [{ label: '尿Cl', value: `${uCl} mEq/L`, interpretation: judge, color }];
      },
      next: (v) => {
        const uCl = parseFloat(v.uCl);
        if (isNaN(uCl)) return 'step2_met_alk';
        return uCl < 20 ? 'result_met_alk_cl_responsive' : 'result_met_alk_cl_resistant';
      },
    },

    // Results
    {
      id: 'result_high_ag',
      title: '診断: 高AG代謝性アシドーシス',
      type: 'result',
      diagnosis: '高AG代謝性アシドーシス',
      detail: '乳酸アシドーシス（ショック・敗血症・低酸素）・DKA（インスリン欠乏・高血糖・ケトン体）・尿毒症（Cr上昇）・中毒（メタノール・エチレングリコール・サリチル酸）を疑う。\n\n血清浸透圧ギャップ ＞10 なら中毒を考慮。',
      treatment: '原疾患の治療。乳酸アシドーシス → 循環改善。DKA → インスリン＋補液。尿毒症 → 透析検討。',
      resultColor: 'red',
    },
    {
      id: 'result_mixed_high_normal_ag',
      title: '診断: 混合性（高AG＋正常AG代謝性アシドーシス）',
      type: 'result',
      diagnosis: '混合性代謝性アシドーシス（高AG＋正常AG）',
      detail: 'デルタ比 < 1.0。高AGの原因（乳酸・ケトン体・尿毒症など）に加えて、腸管からのHCO₃喪失（下痢）やRTAが合併している状態。',
      treatment: '両方の原因を同時に治療する。HCO₃補充は慎重に（乳酸アシドーシスでは禁忌の場合あり）。',
      resultColor: 'red',
    },
    {
      id: 'result_mixed_high_ag_alk',
      title: '診断: 高AG代謝性アシドーシス＋代謝性アルカローシス混合',
      type: 'result',
      diagnosis: '高AG代謝性アシドーシス＋代謝性アルカローシス混合',
      detail: 'デルタ比 > 2.0。高AG産生（DKA・乳酸など）が存在するにもかかわらず、HCO₃が期待より高い。嘔吐・利尿薬・ステロイドなどによる代謝性アルカローシス合併を疑う。',
      treatment: '高AG原因の治療とアルカローシス原因（嘔吐止め・利尿薬調整）を並行して対処。',
      resultColor: 'yellow',
    },
    {
      id: 'result_gi_loss',
      title: '診断: 腸管性HCO₃喪失（下痢）',
      type: 'result',
      diagnosis: '腸管性HCO₃喪失（正常AG代謝性アシドーシス）',
      detail: '下痢・腸瘻・ileostomy・膵液・胆汁漏出。腸管からのHCO₃直接喪失。腎臓はNH₄⁺産生を増加させてH⁺排泄を試みているためUAGは陰性。',
      treatment: 'HCO₃またはクエン酸K補充。下痢の原因治療。脱水・低Kの補正。',
      resultColor: 'yellow',
    },
    {
      id: 'result_rta',
      title: '診断: 尿細管性アシドーシス（RTA）疑い',
      type: 'result',
      diagnosis: '尿細管性アシドーシス（RTA）疑い',
      detail: 'UAG陽性（NH₄⁺産生低下）。1型（遠位型）：尿pH > 5.5 + 低K + 腎石灰化。2型（近位型）：尿pH < 5.5、低K、Fanconi症候群。4型：高K + 低アルドステロン（糖尿病性腎症に多い）。',
      treatment: 'クエン酸K（1型・2型）。フルドロコルチゾン（4型）。原疾患治療（シェーグレン症候群・多発性骨髄腫など）。',
      resultColor: 'red',
    },
    {
      id: 'result_resp_acid',
      title: '診断: 呼吸性アシドーシス',
      type: 'result',
      diagnosis: '呼吸性アシドーシス',
      detail: '気道閉塞・COPD増悪・重症肺炎・神経筋疾患（GBS・MG・ALS）・麻薬過剰投与・肥満低換気。急性：PaCO₂上昇0.1でHCO₃約+1。慢性：0.1でHCO₃約+3.5。',
      treatment: 'NPPV/気管挿管・人工呼吸管理。気管支拡張薬（COPD）。原因の治療。麻薬拮抗（ナロキソン）。',
      resultColor: 'red',
    },
    {
      id: 'result_resp_alk',
      title: '診断: 呼吸性アルカローシス',
      type: 'result',
      diagnosis: '呼吸性アルカローシス',
      detail: '過換気症候群・低酸素（高地・肺塞栓・肺炎）・敗血症（初期）・妊娠・肝不全・サリチル酸中毒（初期）・中枢神経障害。',
      treatment: '原疾患治療。過換気症候群：ペーパーバッグ法（慎重に）・抗不安薬。低酸素への対処。',
      resultColor: 'yellow',
    },
    {
      id: 'result_met_alk_cl_responsive',
      title: '診断: 食塩反応性代謝性アルカローシス',
      type: 'result',
      diagnosis: '食塩反応性代謝性アルカローシス（尿Cl < 20）',
      detail: '嘔吐・胃管吸引（H⁺喪失）・利尿薬投与後（K・Cl喪失）・低Cl摂取。細胞外液量が低下しておりNaClで改善する。',
      treatment: '生理食塩水＋KCl補充。嘔吐止め。利尿薬中止。重症はアセタゾラミド。',
      resultColor: 'yellow',
    },
    {
      id: 'result_met_alk_cl_resistant',
      title: '診断: 食塩抵抗性代謝性アルカローシス',
      type: 'result',
      diagnosis: '食塩抵抗性代謝性アルカローシス（尿Cl ≥ 20）',
      detail: '原発性アルドステロン症・Cushing症候群・Bartter症候群・Gitelman症候群・Mg欠乏・現在の利尿薬使用中。ミネラルコルチコイド過剰が主な機序。',
      treatment: '原疾患治療。原発性アルドステロン症：スピロノラクトン・片側腺腫は手術。Mg補充（Mg欠乏時）。',
      resultColor: 'red',
    },
  ],
};
