import type { WorkupFlowDef } from '../components/WorkupFlow';

export const hyperCaFlow: WorkupFlowDef = {
  title: '高Ca血症 鑑別フロー',
  requiredTests: [
    { key: 'ca', label: '総Ca', unit: 'mg/dL', category: 'blood' },
    { key: 'alb', label: 'Alb', unit: 'g/dL', category: 'blood' },
    { key: 'pth', label: 'intact PTH', unit: 'pg/mL', category: 'blood' },
    { key: 'p', label: 'P', unit: 'mg/dL', category: 'blood' },
    { key: 'cr', label: 'Cr', unit: 'mg/dL', category: 'blood' },
    { key: 'cl', label: 'Cl', unit: 'mEq/L', category: 'blood' },
    { key: 'pth_rp', label: 'PTHrP', unit: 'pmol/L', category: 'blood' },
    { key: 'vitd', label: '1,25-(OH)₂VitD', unit: 'pg/mL', category: 'blood' },
    { key: 'uCa', label: '24時間尿Ca', unit: 'mg/日', category: 'urine' },
    { key: 'uCr', label: '尿Cr（随時）', unit: 'mg/dL', category: 'urine' },
    { key: 'ecg', label: 'ECG（QT短縮確認）', unit: '', category: 'clinical' },
    { key: 'sx', label: '症状（多尿・便秘・嘔吐・意識障害）', unit: '', category: 'clinical' },
  ],
  startId: 'step1',
  steps: [
    {
      id: 'step1',
      title: 'Step 1: 補正Ca確認 + 緊急度評価',
      description: '総Ca・Albから補正Caを計算し、症状（bones/stones/groans/moans）を確認します',
      type: 'input',
      inputs: [
        { key: 'ca', label: '総Ca', unit: 'mg/dL' },
        { key: 'alb', label: 'Alb', unit: 'g/dL' },
        { key: 'cr', label: 'Cr', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const ca = parseFloat(v.ca);
        const alb = parseFloat(v.alb);
        const cr = parseFloat(v.cr);
        if (isNaN(ca) || isNaN(alb)) return [];
        const corrCa = ca + 0.8 * (4.0 - alb);
        let severity = '';
        let color: 'red' | 'yellow' | 'green' = 'green';
        if (corrCa >= 14) { severity = '高Ca危機（≥ 14）緊急対応！'; color = 'red'; }
        else if (corrCa >= 12) { severity = '重症（12〜14）入院・積極的治療'; color = 'red'; }
        else if (corrCa >= 10.5) { severity = '軽〜中等度（10.5〜12）精査・外来管理可'; color = 'yellow'; }
        else { severity = '軽度/偽性高Ca'; color = 'green'; }
        const results = [
          { label: '補正Ca', value: `${corrCa.toFixed(1)} mg/dL`, interpretation: '', color: (corrCa >= 12 ? 'red' : corrCa >= 10.5 ? 'yellow' : 'green') as 'red' | 'yellow' | 'green' },
          { label: '重症度', value: severity, interpretation: 'bones（骨痛）stones（腎石）groans（腹痛/嘔吐）moans（精神症状）', color },
        ];
        if (!isNaN(cr) && cr > 2.0) {
          results.push({ label: 'Cr高値', value: `${cr} mg/dL`, interpretation: '高Ca腎症（尿崩症・腎石灰化）の可能性', color: 'yellow' as 'yellow' });
        }
        return results;
      },
      next: (v) => {
        const ca = parseFloat(v.ca);
        const alb = parseFloat(v.alb);
        if (isNaN(ca) || isNaN(alb)) return 'step1';
        return 'step2';
      },
    },

    {
      id: 'step2',
      title: 'Step 2: PTH測定（最重要）',
      description: 'PTHで副甲状腺性 vs 非副甲状腺性を鑑別します',
      type: 'input',
      inputs: [
        { key: 'pth', label: 'intact PTH', unit: 'pg/mL' },
        { key: 'p', label: 'P', unit: 'mg/dL' },
        { key: 'cl', label: 'Cl', unit: 'mEq/L' },
      ],
      calc: (v) => {
        const pth = parseFloat(v.pth);
        const p = parseFloat(v.p);
        const cl = parseFloat(v.cl);
        const results = [];
        if (!isNaN(pth)) {
          results.push({
            label: 'PTH',
            value: `${pth} pg/mL`,
            interpretation: pth > 65 ? '高値 → 副甲状腺由来の高Ca（PHPT・FHH）' : pth < 15 ? '抑制 → 非副甲状腺性（悪性腫瘍・VitD中毒・サルコイドーシス）' : '不適切正常（高Ca下でPTH非抑制 → PHPT示唆）',
            color: (pth > 65 ? 'yellow' : pth < 15 ? 'red' : 'yellow') as 'yellow' | 'red',
          });
        }
        if (!isNaN(p)) {
          results.push({
            label: 'P',
            value: `${p} mg/dL`,
            interpretation: p < 2.5 ? '低P → PHPT（PTHがリン排泄促進）を支持' : '正常〜高P → 悪性腫瘍・VitD中毒を示唆',
            color: (p < 2.5 ? 'yellow' : 'green') as 'yellow' | 'green',
          });
        }
        if (!isNaN(cl) && !isNaN(p)) {
          const ratio = cl / p;
          results.push({
            label: 'Cl/P比',
            value: ratio.toFixed(1),
            interpretation: ratio > 33 ? '> 33: PHPT支持（PTH→塩素貯留・リン排泄）' : '≤ 33: 非PTH性高Ca示唆',
            color: (ratio > 33 ? 'yellow' : 'red') as 'yellow' | 'red',
          });
        }
        return results;
      },
      next: (v) => {
        const pth = parseFloat(v.pth);
        if (isNaN(pth)) return 'step2';
        return pth > 30 ? 'step3_pth_high' : 'step3_pth_low';
      },
    },

    // PTH高値 → PHPT vs FHH
    {
      id: 'step3_pth_high',
      title: 'Step 3a: PTH高値/不適切高値 → FECa計算',
      description: 'FECa（カルシウム排泄分画）でFHH（家族性低尿Ca性高Ca血症）と原発性副甲状腺機能亢進症（PHPT）を鑑別します',
      type: 'input',
      inputs: [
        { key: 'uCa', label: '尿Ca（随時）', unit: 'mg/dL' },
        { key: 'sCa', label: '血清Ca', unit: 'mg/dL' },
        { key: 'uCr', label: '尿Cr（随時）', unit: 'mg/dL' },
        { key: 'sCr', label: '血清Cr', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const uCa = parseFloat(v.uCa);
        const sCa = parseFloat(v.sCa);
        const uCr = parseFloat(v.uCr);
        const sCr = parseFloat(v.sCr);
        if (isNaN(uCa) || isNaN(sCa) || isNaN(uCr) || isNaN(sCr)) return [];
        const feca = (uCa * sCr) / (sCa * uCr) * 100;
        return [
          {
            label: 'FECa',
            value: `${feca.toFixed(2)}%`,
            interpretation: feca < 1.0 ? '< 1%: FHH疑い（腎がCaを保持）。無症候性・手術不要' : '≥ 1%: PHPT（腎Ca排泄↑）。手術適応検討',
            color: (feca < 1.0 ? 'yellow' : 'red') as 'yellow' | 'red',
          },
        ];
      },
      next: (v) => {
        const uCa = parseFloat(v.uCa);
        const sCa = parseFloat(v.sCa);
        const uCr = parseFloat(v.uCr);
        const sCr = parseFloat(v.sCr);
        if (isNaN(uCa) || isNaN(sCa) || isNaN(uCr) || isNaN(sCr)) return 'step3_pth_high';
        const feca = (uCa * sCr) / (sCa * uCr) * 100;
        return feca < 1.0 ? 'result_fhh' : 'result_phpt';
      },
    },

    // PTH低値 → 悪性腫瘍・VitD・サルコイド
    {
      id: 'step3_pth_low',
      title: 'Step 3b: PTH抑制 → 非副甲状腺性高Ca',
      description: 'PTHrP・1,25-OH₂VitDで原因を絞ります',
      type: 'input',
      inputs: [
        { key: 'pthrp', label: 'PTHrP', unit: 'pmol/L' },
        { key: 'vitd', label: '1,25-(OH)₂VitD', unit: 'pg/mL' },
      ],
      calc: (v) => {
        const pthrp = parseFloat(v.pthrp);
        const vitd = parseFloat(v.vitd);
        const results = [];
        if (!isNaN(pthrp)) {
          results.push({
            label: 'PTHrP',
            value: `${pthrp} pmol/L`,
            interpretation: pthrp > 2.0 ? '高値 → 悪性腫瘍に伴う高Ca（HHM）を強く疑う' : '正常 → 骨転移・VitD関連・肉芽腫性疾患を考慮',
            color: (pthrp > 2.0 ? 'red' : 'yellow') as 'red' | 'yellow',
          });
        }
        if (!isNaN(vitd)) {
          results.push({
            label: '1,25-(OH)₂VitD',
            value: `${vitd} pg/mL`,
            interpretation: vitd > 80 ? '高値 → サルコイドーシス・リンパ腫・VitD中毒（肉芽腫でのVitD活性化）' : '正常〜低値',
            color: (vitd > 80 ? 'red' : 'green') as 'red' | 'green',
          });
        }
        return results;
      },
      next: (v) => {
        const pthrp = parseFloat(v.pthrp);
        const vitd = parseFloat(v.vitd);
        if (isNaN(pthrp) && isNaN(vitd)) return 'step3_pth_low';
        if (!isNaN(pthrp) && pthrp > 2.0) return 'result_hhm';
        if (!isNaN(vitd) && vitd > 80) return 'result_granuloma';
        return 'result_other_malignancy';
      },
    },

    // Results
    {
      id: 'result_phpt',
      type: 'result',
      title: '診断: 原発性副甲状腺機能亢進症（PHPT）',
      diagnosis: '原発性副甲状腺機能亢進症（PHPT）',
      detail: '孤立性副甲状腺腺腫（80%）・過形成（15〜20%）・癌（< 1%）。MEN1・MEN2A合併を除外。首部エコー＋99mTcセスタミビシンチで局在診断。\n骨密度低下（橈骨遠位端が最もよく反映）・腎石灰化・消化性潰瘍合併に注意。',
      treatment: '手術適応：年齢 < 50歳・補正Ca > 12.0・腎結石・骨密度T-score < -2.5・腎機能低下。\n手術非適応：シナカルセト（骨には効果薄）・ビスホスホネート（骨密度改善）。\n水分摂取促進・低Ca食。',
      resultColor: 'yellow',
    },
    {
      id: 'result_fhh',
      type: 'result',
      title: '診断: 家族性低尿Ca性高Ca血症（FHH）',
      diagnosis: '家族性低尿Ca性高Ca血症（FHH）',
      detail: 'Ca感知受容体（CaSR）の機能喪失変異。常染色体優性遺伝。FECa < 1%（腎がCaを保持）。無症候性で生涯治療不要。家族の高Caを確認（家族歴が重要）。PHPTとの誤診で手術してはいけない！',
      treatment: '治療不要。経過観察。家族のCa検索。遺伝子検査（CaSR・GNA11・AP2S1変異）。',
      resultColor: 'green',
    },
    {
      id: 'result_hhm',
      type: 'result',
      title: '診断: 悪性腫瘍に伴う高Ca（HHM）',
      diagnosis: '悪性腫瘍に伴う高Ca血症（HHM：PTHrP産生）',
      detail: 'PTHrP産生腫瘍：扁平上皮癌（肺・頭頸部）・腎癌・膀胱癌・乳癌・HTLV-1関連T細胞白血病。急激に高Caが進行する。PTHは抑制されている点がPHPTと異なる。',
      treatment: '【緊急対応】①生理食塩水大量補液（3〜4 L/日）②ビスホスホネート（ゾレドロン酸 4mg iv）③デノスマブ（腎不全時に有用）④ステロイド（リンパ腫・VitD関連）\n原発腫瘍の治療。',
      resultColor: 'red',
    },
    {
      id: 'result_granuloma',
      type: 'result',
      title: '診断: 肉芽腫性疾患による高Ca',
      diagnosis: '肉芽腫性疾患（サルコイドーシス・結核・リンパ腫）',
      detail: '肉芽腫内のマクロファージが1α水酸化酵素を産生→1,25-OH₂VitD産生過剰→腸管Ca吸収↑。サルコイドーシスが最多。日光暴露・VitDサプリで悪化する。',
      treatment: 'ステロイド（プレドニゾン 20〜40 mg/日）が著効。日光・VitDサプリ回避。原疾患治療（結核：抗結核薬）。水分補充。',
      resultColor: 'red',
    },
    {
      id: 'result_other_malignancy',
      type: 'result',
      title: '診断: 骨転移・多発性骨髄腫・その他',
      diagnosis: '骨転移 / 多発性骨髄腫 / VitD中毒 / サイアザイド / 長期臥床',
      detail: '骨転移（乳癌・肺癌・前立腺癌）：破骨細胞活性化によるCa遊離。骨髄腫：OAF産生→破骨細胞活性化。VitD中毒：サプリ過剰。サイアザイド：尿Ca排泄低下。長期臥床：骨吸収亢進。',
      treatment: 'ビスホスホネート（骨転移・骨髄腫）。補液。原因薬剤中止（サイアザイド・VitD）。可動化（廃用による高Ca）。',
      resultColor: 'red',
    },
  ],
};
