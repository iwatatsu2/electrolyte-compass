import type { WorkupFlowDef } from '../components/WorkupFlow';

export const hyperKFlow: WorkupFlowDef = {
  title: '高K血症 鑑別フロー',
  requiredTests: [
    { key: 'k', label: 'K', unit: 'mEq/L', category: 'blood' },
    { key: 'na', label: 'Na', unit: 'mEq/L', category: 'blood' },
    { key: 'bun', label: 'BUN', unit: 'mg/dL', category: 'blood' },
    { key: 'cr', label: 'Cr', unit: 'mg/dL', category: 'blood' },
    { key: 'gluc', label: '血糖', unit: 'mg/dL', category: 'blood' },
    { key: 'hco3', label: 'HCO3', unit: 'mEq/L', category: 'blood' },
    { key: 'ph', label: 'pH', unit: '', category: 'blood' },
    { key: 'wbc', label: 'WBC', unit: '/μL', category: 'blood' },
    { key: 'plt', label: '血小板', unit: '/μL', category: 'blood' },
    { key: 'ldh', label: 'LDH', unit: 'U/L', category: 'blood' },
    { key: 'uK', label: '尿K', unit: 'mEq/L', category: 'urine' },
    { key: 'uCr', label: '尿Cr', unit: 'mg/dL', category: 'urine' },
    { key: 'uOsm', label: '尿浸透圧', unit: 'mOsm/kg', category: 'urine' },
    { key: 'ecg', label: 'ECG（テント状T波・PR延長・QRS幅・サイン波）', unit: '', category: 'clinical' },
    { key: 'sampling', label: '採血条件（溶血・白血球増多の確認）', unit: '', category: 'clinical' },
  ],
  startId: 'step1',
  steps: [
    {
      id: 'step1',
      title: 'Step 1: ECGで緊急度判定',
      description: 'まずECGで生命に関わる所見がないか確認します',
      type: 'select',
      options: [
        {
          label: '緊急所見あり',
          value: 'emergency',
          description: 'テント状T波・PR延長・QRS幅広・サイン波・VF',
        },
        {
          label: 'ECG正常・軽度異常',
          value: 'stable',
          description: '明らかな緊急所見なし',
        },
      ],
      onSelect: (v) => v === 'emergency' ? 'result_emergency' : 'step2',
    },
    {
      id: 'result_emergency',
      title: '緊急対応！',
      type: 'result',
      diagnosis: '緊急性高！即座に対応',
      detail: 'ECG変化は致死性不整脈のリスクを示す。直ちに治療を開始する。',
      treatment: '① グルコン酸Ca 1A iv（心保護・即効・5分以内に効果）\n② GI療法（50%ブドウ糖50mL＝25g＋インスリン10単位 iv）※低血糖リスク軽減のため25gが推奨\n③ 炭酸水素Na（代謝性アシドーシス合併時）\n④ β刺激薬吸入（サルブタモール）\n⑤ カリメート/ケイキサレート（腸管K排泄）\n⑥ 透析（上記で改善なし・腎不全）',
      resultColor: 'red',
    },
    {
      id: 'step2',
      title: 'Step 2: 偽性高K血症の除外',
      description: '採血手技・検体の問題がないか確認します',
      type: 'select',
      options: [
        {
          label: '採血手技問題なし・溶血なし',
          value: 'ok',
          description: '適切な手技で採血。肉眼的溶血なし。',
        },
        {
          label: '偽性高K疑い',
          value: 'pseudo',
          description: '溶血あり / WBC > 100,000 / 血小板 > 100万 / 止血帯長時間使用',
        },
      ],
      onSelect: (v) => v === 'ok' ? 'step3' : 'result_pseudo',
    },
    {
      id: 'result_pseudo',
      title: '診断: 偽性高K血症',
      type: 'result',
      diagnosis: '偽性高K血症',
      detail: '溶血・白血球増多症（> 100,000/μL）・血小板増多症（> 100万/μL）・採血手技問題（止血帯長時間・強い吸引）による。真の高K血症ではない。',
      treatment: '再採血（溶血なし・適切な手技で）。または血漿K測定で確認。',
      resultColor: 'yellow',
    },
    {
      id: 'step3',
      title: 'Step 3: 経腎排泄の評価（TTKG・FEK）',
      description: '尿K・尿Cr・血清K・浸透圧を入力して腎のK排泄能を評価します',
      type: 'input',
      inputs: [
        { key: 'uK', label: '尿K', unit: 'mEq/L' },
        { key: 'uCr', label: '尿Cr', unit: 'mg/dL' },
        { key: 'sK', label: '血清K', unit: 'mEq/L' },
        { key: 'uOsm', label: '尿浸透圧', unit: 'mOsm/kg' },
        { key: 'sOsm', label: '血清浸透圧', unit: 'mOsm/kg' },
        { key: 'sCr', label: '血清Cr', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const uK = parseFloat(v.uK);
        const uCr = parseFloat(v.uCr);
        const sK = parseFloat(v.sK);
        const uOsm = parseFloat(v.uOsm);
        const sOsm = parseFloat(v.sOsm);
        const sCr = parseFloat(v.sCr);
        const results = [];
        if (!isNaN(uK) && !isNaN(sK) && !isNaN(uOsm) && !isNaN(sOsm) && sK > 0 && sOsm > 0) {
          const ttkg = (uK / sK) / (uOsm / sOsm);
          results.push({
            label: 'TTKG',
            value: ttkg.toFixed(1),
            interpretation: ttkg < 7 ? '< 7: 腎排泄低下（低アルドステロン・腎不全）※高K時の正常は>7-10' : '≥ 7: 腎排泄は保たれている',
            color: (ttkg < 7 ? 'red' : 'green') as 'red' | 'green',
          });
        }
        if (!isNaN(uK) && !isNaN(uCr) && !isNaN(sK) && !isNaN(sCr) && sK > 0 && uCr > 0) {
          const fek = (uK * sCr) / (sK * uCr) * 100;
          results.push({
            label: 'FEK',
            value: `${fek.toFixed(1)}%`,
            interpretation: fek < 10 ? '< 10%: 腎排泄低下' : '≥ 10%: 腎排泄は保たれている',
            color: (fek < 10 ? 'red' : 'green') as 'red' | 'green',
          });
        }
        return results;
      },
      next: (v) => {
        const uK = parseFloat(v.uK);
        const sK = parseFloat(v.sK);
        const uOsm = parseFloat(v.uOsm);
        const sOsm = parseFloat(v.sOsm);
        if (isNaN(uK) || isNaN(sK) || isNaN(uOsm) || isNaN(sOsm) || sK <= 0 || sOsm <= 0) return 'step3';
        const ttkg = (uK / sK) / (uOsm / sOsm);
        return ttkg < 7 ? 'step4a' : 'result_transcellular';
      },
    },
    {
      id: 'result_transcellular',
      title: '診断: 細胞外移行による高K',
      type: 'result',
      diagnosis: '細胞外移行による高K',
      detail: 'アシドーシス（pH低下0.1でK約0.6上昇）・インスリン欠乏（DKA）・β遮断薬・高浸透圧・横紋筋融解・腫瘍崩壊症候群・偽性低アルドステロン症。腎のK排泄能は保たれている。',
      treatment: '原因の治療。アシドーシス補正・インスリン投与・原因薬剤中止。',
      resultColor: 'yellow',
    },
    {
      id: 'step4a',
      title: 'Step 4a: 腎排泄低下の原因',
      description: '腎排泄が低下している場合の原因を選択します',
      type: 'select',
      options: [
        {
          label: '乏尿・腎不全あり',
          value: 'aki_ckd',
          description: 'AKI/CKD・乏尿・BUN/Cr上昇',
        },
        {
          label: 'アルドステロン欠乏疑い',
          value: 'hypoaldo',
          description: '副腎不全・低レニン低アルドステロン（糖尿病性腎症）・先天性副腎過形成',
        },
        {
          label: '薬剤性',
          value: 'drug',
          description: 'ACE阻害薬・ARB・NSAIDs・ヘパリン・カルシニューリン阻害薬（CyA/TAC）・スピロノラクトン',
        },
      ],
      onSelect: (v) => {
        if (v === 'aki_ckd') return 'result_aki_ckd';
        if (v === 'hypoaldo') return 'result_hypoaldo';
        return 'result_drug';
      },
    },
    {
      id: 'result_aki_ckd',
      title: '診断: 腎不全による高K',
      type: 'result',
      diagnosis: '腎不全による高K',
      detail: 'AKI/CKDによるK排泄障害。GFR < 20 mL/minで特に注意。乏尿があればさらにリスク高。',
      treatment: '食事制限（K制限食）・ループ利尿薬（尿量確保）・カリメート/ケイキサレート。透析適応検討（GFRの著明低下・保存的治療困難）。',
      resultColor: 'red',
    },
    {
      id: 'result_hypoaldo',
      title: '診断: 低アルドステロン症',
      type: 'result',
      diagnosis: '低アルドステロン症',
      detail: 'アジソン病・低レニン性低アルドステロン症（糖尿病性腎症に多い）・先天性副腎過形成。レニン・アルドステロン・コルチゾール・ACTH測定で鑑別。',
      treatment: 'フルドロコルチゾン（低アルドステロン症）。アジソン病はヒドロコルチゾン+フルドロコルチゾン。原疾患治療。',
      resultColor: 'red',
    },
    {
      id: 'result_drug',
      title: '診断: 薬剤性高K',
      type: 'result',
      diagnosis: '薬剤性高K',
      detail: 'ACE阻害薬・ARB・NSAIDs・ヘパリン・カルシニューリン阻害薬（CyA/TAC）・スピロノラクトン・TMP（ST合剤）。',
      treatment: '原因薬剤の中止または減量。腎機能・K値のモニタリング。代替薬への変更を検討。',
      resultColor: 'yellow',
    },
  ],
};
