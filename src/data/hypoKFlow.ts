import type { WorkupFlowDef } from '../components/WorkupFlow';

export const hypoKFlow: WorkupFlowDef = {
  title: '低K血症 鑑別フロー',
  requiredTests: [
    { key: 'k', label: 'K', unit: 'mEq/L', category: 'blood' },
    { key: 'na', label: 'Na', unit: 'mEq/L', category: 'blood' },
    { key: 'cl', label: 'Cl', unit: 'mEq/L', category: 'blood' },
    { key: 'hco3', label: 'HCO₃', unit: 'mEq/L', category: 'blood' },
    { key: 'mg', label: 'Mg', unit: 'mg/dL', category: 'blood' },
    { key: 'ph', label: 'pH', unit: '', category: 'blood' },
    { key: 'uK', label: '尿K', unit: 'mEq/L', category: 'urine' },
    { key: 'uCr', label: '尿Cr', unit: 'mg/dL', category: 'urine' },
    { key: 'sCr', label: '血清Cr', unit: 'mg/dL', category: 'blood' },
    { key: 'uOsm', label: '尿浸透圧', unit: 'mOsm/kg', category: 'urine' },
    { key: 'sOsm', label: '血清浸透圧', unit: 'mOsm/kg', category: 'blood' },
    { key: 'uCl', label: '尿Cl', unit: 'mEq/L', category: 'urine' },
    { key: 'ecg', label: 'ECG（U波・QT延長・ST低下の確認）', unit: '', category: 'clinical' },
  ],
  startId: 'step1',
  steps: [
    {
      id: 'step1',
      title: 'Step 1: 低K重症度確認 + ECG評価',
      description: 'K値と症状・ECGから緊急性を判断します',
      type: 'input',
      inputs: [
        { key: 'k', label: '血清K', unit: 'mEq/L' },
        { key: 'mg', label: '血清Mg', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const k = parseFloat(v.k);
        const mg = parseFloat(v.mg);
        const results = [];
        if (!isNaN(k)) {
          let severity = '';
          let color: 'red' | 'yellow' | 'green' = 'green';
          if (k < 2.5) { severity = '重症（< 2.5）緊急補充が必要'; color = 'red'; }
          else if (k < 3.0) { severity = '中等度（2.5〜3.0）入院・静注補充を考慮'; color = 'yellow'; }
          else { severity = '軽度（3.0〜3.5）外来管理可能'; color = 'green'; }
          results.push({ label: '重症度', value: severity, interpretation: 'K < 2.5 は致死性不整脈のリスク', color });
        }
        if (!isNaN(mg) && mg < 1.8) {
          results.push({ label: 'Mg低値', value: `${mg} mg/dL`, interpretation: 'Mg欠乏があると低Kが治療抵抗性になる。先にMgを補充', color: 'red' as 'red' });
        }
        return results;
      },
      next: (v) => {
        const k = parseFloat(v.k);
        if (isNaN(k)) return 'step1';
        return 'step2';
      },
    },
    {
      id: 'step2',
      title: 'Step 2: 腎外性 vs 腎性K喪失（TTKG・FEK）',
      description: '尿K・TTKG・FEKで腎のK排泄能を評価します',
      type: 'input',
      inputs: [
        { key: 'uK', label: '尿K', unit: 'mEq/L' },
        { key: 'sK', label: '血清K', unit: 'mEq/L' },
        { key: 'uOsm', label: '尿浸透圧', unit: 'mOsm/kg' },
        { key: 'sOsm', label: '血清浸透圧', unit: 'mOsm/kg' },
        { key: 'uCr', label: '尿Cr', unit: 'mg/dL' },
        { key: 'sCr', label: '血清Cr', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const uK = parseFloat(v.uK);
        const sK = parseFloat(v.sK);
        const uOsm = parseFloat(v.uOsm);
        const sOsm = parseFloat(v.sOsm);
        const uCr = parseFloat(v.uCr);
        const sCr = parseFloat(v.sCr);
        const results = [];
        if (!isNaN(uK) && !isNaN(sK) && !isNaN(uOsm) && !isNaN(sOsm) && sK > 0 && sOsm > 0) {
          const ttkg = (uK / sK) / (uOsm / sOsm);
          results.push({
            label: 'TTKG',
            value: ttkg.toFixed(1),
            interpretation: ttkg < 2 ? '< 2: 腎外性喪失（腎はKを保持）' : '≥ 2: 腎性喪失（腎からのK排泄亢進）※TTKGの妥当性は近年議論あり。FEKも参考に',
            color: (ttkg < 2 ? 'yellow' : 'red') as 'yellow' | 'red',
          });
        }
        if (!isNaN(uK) && !isNaN(uCr) && !isNaN(sK) && !isNaN(sCr) && sK > 0 && uCr > 0) {
          const fek = (uK * sCr) / (sK * uCr) * 100;
          results.push({
            label: 'FEK',
            value: `${fek.toFixed(1)}%`,
            interpretation: fek < 10 ? '< 10%: 腎外性喪失' : '≥ 10%: 腎性喪失（排泄亢進）',
            color: (fek < 10 ? 'yellow' : 'red') as 'yellow' | 'red',
          });
        }
        return results;
      },
      next: (v) => {
        const uK = parseFloat(v.uK);
        const sK = parseFloat(v.sK);
        const uOsm = parseFloat(v.uOsm);
        const sOsm = parseFloat(v.sOsm);
        if (isNaN(uK) || isNaN(sK) || isNaN(uOsm) || isNaN(sOsm)) return 'step2';
        const ttkg = (uK / sK) / (uOsm / sOsm);
        return ttkg < 2 ? 'step3_extrarenal' : 'step3_renal';
      },
    },

    // 腎外性
    {
      id: 'step3_extrarenal',
      title: 'Step 3a: 腎外性K喪失の原因',
      description: '腎外性K喪失（TTKG < 2）の原因を選択します',
      type: 'select',
      options: [
        { label: '下痢・下剤乱用・腸瘻', value: 'gi', description: '腸管からのK喪失。代謝性アシドーシスを合併することが多い' },
        { label: '嘔吐・胃管吸引', value: 'vomit', description: 'H⁺喪失→代謝性アルカローシス合併。実際の腸管K喪失は少ない' },
        { label: '摂取不足（飢餓・神経性食思不振症）', value: 'intake', description: '極度の低摂取。再栄養症候群にも注意' },
        { label: '細胞内移行（アルカローシス・インスリン・β刺激薬）', value: 'shift', description: 'K総量は正常だが細胞内移行により血清K低下' },
      ],
      onSelect: (v) => {
        if (v === 'gi') return 'result_gi_loss';
        if (v === 'vomit') return 'result_vomit';
        if (v === 'intake') return 'result_intake';
        return 'result_shift';
      },
    },

    // 腎性 → 尿Cl・血圧で細分化
    {
      id: 'step3_renal',
      title: 'Step 3b: 腎性K喪失の原因（尿Cl・酸塩基）',
      description: '尿ClとHCO₃で腎性K喪失の原因を鑑別します',
      type: 'input',
      inputs: [
        { key: 'uCl', label: '尿Cl', unit: 'mEq/L' },
        { key: 'hco3', label: '血清HCO₃', unit: 'mEq/L' },
      ],
      calc: (v) => {
        const uCl = parseFloat(v.uCl);
        const hco3 = parseFloat(v.hco3);
        const results = [];
        if (!isNaN(uCl)) {
          results.push({
            label: '尿Cl',
            value: `${uCl} mEq/L`,
            interpretation: uCl < 20 ? '低値 → 嘔吐後・利尿薬投与後期' : '高値 → 利尿薬使用中・ミネラルコルチコイド過剰・Bartter/Gitelman',
            color: (uCl < 20 ? 'yellow' : 'red') as 'yellow' | 'red',
          });
        }
        if (!isNaN(hco3)) {
          results.push({
            label: 'HCO₃',
            value: `${hco3} mEq/L`,
            interpretation: hco3 > 26 ? '代謝性アルカローシス合併 → ミネラルコルチコイド過剰・利尿薬を疑う' : hco3 < 22 ? '代謝性アシドーシス合併 → RTA2型・DKA・アセタゾラミドを疑う' : '正常HCO₃',
            color: (hco3 > 26 || hco3 < 22 ? 'yellow' : 'green') as 'yellow' | 'green',
          });
        }
        return results;
      },
      next: (v) => {
        const uCl = parseFloat(v.uCl);
        const hco3 = parseFloat(v.hco3);
        if (isNaN(uCl)) return 'step3_renal';
        if (!isNaN(hco3) && hco3 < 22) return 'step4_acidosis_renal';
        return uCl < 20 ? 'result_renal_low_ucl' : 'step4_high_ucl';
      },
    },

    // 尿Cl高値 → 血圧評価
    {
      id: 'step4_high_ucl',
      title: 'Step 4: 血圧で高アルドステロン症を鑑別',
      description: '高血圧の有無でミネラルコルチコイド過剰を評価します',
      type: 'select',
      options: [
        { label: '高血圧あり（収縮期 > 140 mmHg）', value: 'htn', description: '原発性アルドステロン症・Cushing症候群・リコリス摂取・レニン産生腫瘍' },
        { label: '血圧正常 or 低血圧', value: 'normal_bp', description: 'Bartter症候群・Gitelman症候群・マグネシウム欠乏・利尿薬使用' },
      ],
      onSelect: (v) => v === 'htn' ? 'result_hyperaldo' : 'result_bartter_gitelman',
    },

    // RTA/アシドーシス合併の腎性低K
    {
      id: 'step4_acidosis_renal',
      title: 'Step 4: 代謝性アシドーシス合併の腎性低K',
      description: '原因を選択します',
      type: 'select',
      options: [
        { label: 'RTA 2型（近位型）疑い', value: 'rta2', description: '尿pHが変動・Fanconi症候群（尿糖・アミノ酸尿）・骨髄腫・重金属中毒' },
        { label: 'DKA回復期・アセタゾラミド使用', value: 'dka', description: 'インスリン投与後のK細胞内移行＋利尿薬効果' },
        { label: 'RTA 1型（遠位型）', value: 'rta1', description: '尿pH > 5.5 常時・腎石灰化・シェーグレン症候群' },
      ],
      onSelect: (v) => {
        if (v === 'rta2') return 'result_rta2';
        if (v === 'dka') return 'result_dka_recovery';
        return 'result_rta1';
      },
    },

    // Results
    {
      id: 'result_gi_loss',
      type: 'result',
      title: '診断: 腸管からのK喪失',
      diagnosis: '腸管からのK喪失（下痢・腸瘻）',
      detail: '下痢・下剤乱用・腸瘻・VIPoma（大量水様下痢）。腸液中のK濃度は高い（30〜70 mEq/L）。代謝性アシドーシス合併が多い。',
      treatment: 'KCl経口補充（徐放製剤）。下痢の原因治療。Mg同時補充（Mg欠乏で治療抵抗性）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_vomit',
      type: 'result',
      title: '診断: 嘔吐・胃管吸引',
      diagnosis: '嘔吐・胃管吸引によるK喪失',
      detail: '胃液のK濃度は低い（約10 mEq/L）が、嘔吐によるH⁺喪失→代謝性アルカローシス→尿K排泄増加（アルカローシスによる腎K喪失）が主体。代謝性アルカローシス＋低K＋低Clの組み合わせ。',
      treatment: 'KCl補充（生理食塩水＋KCl）。制吐薬。嘔吐の原因治療（摂食障害・幽門狭窄など）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_intake',
      type: 'result',
      title: '診断: K摂取不足',
      diagnosis: 'K摂取不足（飢餓・神経性食思不振症）',
      detail: '極度の低摂取。再栄養症候群（リフィーディング症候群）に注意：急速な栄養補給でインスリン分泌→K細胞内移行で重症低Kになりうる。',
      treatment: '少量から段階的な栄養補充。K・Mg・Pを事前に補充してから栄養開始（再栄養症候群予防）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_shift',
      type: 'result',
      title: '診断: 細胞内移行による低K',
      diagnosis: '細胞内移行による低K（アルカローシス・インスリン・β刺激薬）',
      detail: 'アルカローシス（pH↑0.1でK約0.3低下）・インスリン投与・β₂刺激薬（サルブタモール・テオフィリン）・低K性周期性四肢麻痺（甲状腺機能亢進症関連・家族性）・低体温。K総量は正常。',
      treatment: '原因の除去。低K性周期性四肢麻痺：K補充＋β遮断薬。重症例は慎重なK補充（過補正に注意）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_renal_low_ucl',
      type: 'result',
      title: '診断: 嘔吐後・利尿薬投与後期',
      diagnosis: '腎性K喪失（尿Cl低値：嘔吐後 or 利尿薬投与後期）',
      detail: '嘔吐後：代謝性アルカローシス。利尿薬投与後期：利尿薬の効果が切れた後のNa・Cl保持期。尿Clが低くても腎からのK喪失は亢進している。',
      treatment: 'KCl補充（生理食塩水＋KCl）。アルカローシス補正。利尿薬の見直し。',
      resultColor: 'yellow',
    },
    {
      id: 'result_hyperaldo',
      type: 'result',
      title: '診断: ミネラルコルチコイド過剰（高血圧あり）',
      diagnosis: 'ミネラルコルチコイド過剰（原発性アルドステロン症 etc）',
      detail: '原発性アルドステロン症（Conn症候群：副腎腺腫・過形成）・Cushing症候群・リコリス摂取（偽性アルドステロン症）・レニン産生腫瘍・先天性副腎過形成（11β-OHase欠乏）。\nレニン↓・アルドステロン↑ → 原発性。レニン↑・アルドステロン↑ → 二次性。',
      treatment: 'レニン・アルドステロン・ARR（アルドステロン/レニン比）測定。腺腫は腹腔鏡手術。過形成はスピロノラクトン・エプレレノン。',
      resultColor: 'red',
    },
    {
      id: 'result_bartter_gitelman',
      type: 'result',
      title: '診断: Bartter症候群 / Gitelman症候群',
      diagnosis: 'Bartter症候群 / Gitelman症候群（またはMg欠乏・利尿薬）',
      detail: 'Bartter症候群：低K＋代謝性アルカローシス＋正常〜低血圧＋高尿Cl。ループ利尿薬様病態。\nGitelman症候群：低K＋低Mg＋低尿Ca＋代謝性アルカローシス。サイアザイド様病態。最多の遺伝性K喪失疾患。\n利尿薬使用中も同様の尿電解質パターンになる。',
      treatment: 'Gitelman：KCl＋MgO補充。スピロノラクトン・アミロライドも有効。Bartter：インドメタシン（重症型）。利尿薬の場合は中止。',
      resultColor: 'yellow',
    },
    {
      id: 'result_rta1',
      type: 'result',
      title: '診断: 遠位型RTA（1型）',
      diagnosis: '遠位型RTA（1型）',
      detail: '尿pH常時 > 5.5。集合管のH⁺分泌障害。低K＋代謝性アシドーシス＋腎石灰化。シェーグレン症候群・関節リウマチ・アンフォテリシンB・閉塞性腎症が原因。',
      treatment: 'クエン酸K（重炭酸K）補充。原疾患治療。',
      resultColor: 'red',
    },
    {
      id: 'result_rta2',
      type: 'result',
      title: '診断: 近位型RTA（2型）',
      diagnosis: '近位型RTA（2型）',
      detail: 'HCO₃再吸収障害。Fanconi症候群（尿糖・アミノ酸尿・低P・低尿酸）を合併することが多い。骨髄腫・重金属中毒（鉛・カドミウム）・テノホビル（抗HIV薬）・アセタゾラミドが原因。',
      treatment: 'HCO₃補充（大量必要）。原因薬剤中止。ビタミンD・P補充（Fanconi合併時）。',
      resultColor: 'red',
    },
    {
      id: 'result_dka_recovery',
      type: 'result',
      title: '診断: DKA回復期 / アセタゾラミド',
      diagnosis: 'DKA回復期 or アセタゾラミドによる低K',
      detail: 'DKA回復期：インスリン投与によりK細胞内移行＋尿中K喪失。尿K高値が続く。アセタゾラミド：近位尿細管でのHCO₃再吸収阻害→Na＋HCO₃流出増加→集合管でのK排泄亢進。',
      treatment: 'KClを積極的に補充しながらインスリン投与。血清K 3.5 mEq/L未満ではインスリン開始前にK補充を先行させる。',
      resultColor: 'yellow',
    },
  ],
};
