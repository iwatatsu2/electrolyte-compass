import type { WorkupFlowDef } from '../components/WorkupFlow';

export const hyperNaFlow: WorkupFlowDef = {
  title: '高Na血症 鑑別フロー',
  requiredTests: [
    { key: 'na', label: 'Na', unit: 'mEq/L', category: 'blood' },
    { key: 'gluc', label: '血糖', unit: 'mg/dL', category: 'blood' },
    { key: 'bun', label: 'BUN', unit: 'mg/dL', category: 'blood' },
    { key: 'bw', label: '体重', unit: 'kg', category: 'clinical' },
    { key: 'uOsm', label: '尿浸透圧', unit: 'mOsm/kg', category: 'urine' },
    { key: 'uNa', label: '尿Na', unit: 'mEq/L', category: 'urine' },
    { key: 'thirst', label: '口渇感の有無', unit: '', category: 'clinical' },
    { key: 'polyuria', label: '多尿の有無（>3L/日）', unit: '', category: 'clinical' },
  ],
  startId: 'step1',
  steps: [
    {
      id: 'step1',
      title: 'Step 1: 高Na確認と自由水欠乏量計算',
      description: 'Na・体重・性別から自由水欠乏量を計算します',
      type: 'input',
      inputs: [
        { key: 'na', label: 'Na', unit: 'mEq/L' },
        { key: 'bw', label: '体重', unit: 'kg' },
        { key: 'sex_f', label: '女性なら1・男性なら0', unit: '' },
      ],
      calc: (v) => {
        const na = parseFloat(v.na);
        const bw = parseFloat(v.bw);
        const isFemale = parseFloat(v.sex_f) === 1;
        if (isNaN(na) || isNaN(bw)) return [];
        const tbwFraction = isFemale ? 0.5 : 0.6;
        const tbw = bw * tbwFraction;
        const fwd = tbw * (na / 140 - 1);
        let severity = '';
        let color: 'red' | 'yellow' | 'green' = 'green';
        if (na > 160) { severity = '重症高Na（>160）'; color = 'red'; }
        else if (na > 150) { severity = '中等度高Na（150〜160）'; color = 'yellow'; }
        else { severity = '軽度高Na（145〜150）'; }
        return [
          { label: '重症度', value: severity, interpretation: '', color },
          { label: '自由水欠乏量', value: `${fwd.toFixed(1)} L`, interpretation: '補正目標：0.5 mEq/L/hr（慢性例は慎重に）', color: 'yellow' as 'yellow' },
        ];
      },
      next: (v) => {
        const na = parseFloat(v.na);
        if (isNaN(na)) return 'step1';
        return 'step2';
      },
    },
    {
      id: 'step2',
      title: 'Step 2: 尿浸透圧で水利尿 vs 溶質利尿を鑑別',
      description: '尿浸透圧により腎での水保持能力を評価します',
      type: 'input',
      inputs: [
        { key: 'uOsm', label: '尿浸透圧', unit: 'mOsm/kg' },
      ],
      calc: (v) => {
        const uOsm = parseFloat(v.uOsm);
        if (isNaN(uOsm)) return [];
        let interp = '';
        let color: 'red' | 'yellow' | 'green' = 'red';
        if (uOsm < 300) { interp = '水利尿 → 尿崩症（中枢性 or 腎性）を疑う'; color = 'red'; }
        else if (uOsm < 600) { interp = '部分的尿崩症 or 溶質利尿'; color = 'yellow'; }
        else { interp = '腎の水保持は正常 → 不感蒸泄増加・水摂取不足・高張液投与を疑う'; color = 'yellow'; }
        return [{ label: '尿浸透圧', value: `${uOsm} mOsm/kg`, interpretation: interp, color }];
      },
      next: (v) => {
        const uOsm = parseFloat(v.uOsm);
        if (isNaN(uOsm)) return 'step2';
        if (uOsm < 300) return 'step3_di';
        if (uOsm < 600) return 'step3_partial';
        return 'step3_non_renal';
      },
    },

    // 尿崩症疑い → DDAVP試験 or 選択
    {
      id: 'step3_di',
      title: 'Step 3a: 尿崩症の鑑別（中枢性 vs 腎性）',
      description: 'DDAVP（デスモプレシン）投与反応で中枢性 vs 腎性を鑑別します',
      type: 'select',
      options: [
        {
          label: 'DDAVP投与後 尿浸透圧 > 600 mOsm/kgまたは50%以上上昇',
          value: 'central',
          description: 'DDAVPに反応あり → 中枢性尿崩症',
        },
        {
          label: 'DDAVP投与後も尿浸透圧上昇なし（< 50%上昇）',
          value: 'nephrogenic',
          description: 'DDAVPに無反応 → 腎性尿崩症',
        },
        {
          label: 'DDAVP未施行・評価中',
          value: 'unknown',
          description: '臨床所見から推定',
        },
      ],
      onSelect: (v) => {
        if (v === 'central') return 'result_central_di';
        if (v === 'nephrogenic') return 'result_nephrogenic_di';
        return 'result_di_unknown';
      },
    },

    {
      id: 'step3_partial',
      title: 'Step 3b: 部分的尿崩症 or 溶質利尿',
      description: '臨床状況から原因を選択します',
      type: 'select',
      options: [
        { label: '多尿あり・口渇あり', value: 'partial_di', description: '部分的尿崩症・高血糖による浸透圧利尿も考慮' },
        { label: '高血糖（>300 mg/dL）', value: 'osmotic', description: '糖尿病性浸透圧利尿' },
        { label: '経管栄養・高Na輸液使用中', value: 'hypertonic_load', description: '医原性高Na' },
      ],
      onSelect: (v) => {
        if (v === 'partial_di') return 'result_partial_di';
        if (v === 'osmotic') return 'result_osmotic_diuresis';
        return 'result_hypertonic_load';
      },
    },

    {
      id: 'step3_non_renal',
      title: 'Step 3c: 腎外性原因の鑑別',
      description: '尿浸透圧高値（腎の水保持は正常）の場合の原因を選択します',
      type: 'select',
      options: [
        { label: '発熱・高温環境・熱傷', value: 'insensible', description: '不感蒸泄の増加' },
        { label: '意識障害・嚥下障害・口渇感なし', value: 'access', description: '水摂取制限（意識障害・介護者依存）' },
        { label: '高張食塩水・重炭酸Na大量投与歴', value: 'iatrogenic', description: '医原性Na負荷' },
      ],
      onSelect: (v) => {
        if (v === 'insensible') return 'result_insensible_loss';
        if (v === 'access') return 'result_restricted_access';
        return 'result_sodium_load';
      },
    },

    // Results
    {
      id: 'result_central_di',
      title: '診断: 中枢性尿崩症',
      type: 'result',
      diagnosis: '中枢性尿崩症（CDI）',
      detail: 'ADH産生障害。原因：視床下部・下垂体手術後・外傷・腫瘍（頭蓋咽頭腫・転移）・サルコイドーシス・ランゲルハンス細胞組織球症・特発性。\nMRI（下垂体・視床下部）・抗ADH抗体を検索。',
      treatment: 'デスモプレシン（DDAVP）点鼻薬・経口薬。急性期は低張液（D5W・0.45%食塩水）補充。補正速度：慢性例は0.5 mEq/L/hr以内。',
      resultColor: 'red',
    },
    {
      id: 'result_nephrogenic_di',
      title: '診断: 腎性尿崩症',
      type: 'result',
      diagnosis: '腎性尿崩症（NDI）',
      detail: 'ADH受容体・アクアポリン障害。原因：リチウム（最多）・デメクロサイクリン・低K血症・高Ca血症・閉塞性腎症・慢性腎不全・先天性（AVPR2・AQP2変異）。',
      treatment: '原因薬剤中止。低塩食＋サイアザイド系利尿薬（逆説的効果）。低K・低Ca補正。リチウム中止困難な場合はアミロライド。',
      resultColor: 'red',
    },
    {
      id: 'result_di_unknown',
      title: '診断: 尿崩症疑い（評価中）',
      type: 'result',
      diagnosis: '尿崩症疑い（中枢性 vs 腎性 評価中）',
      detail: 'DDAVP試験（デスモプレシン2μg iv/sc → 4時間後の尿浸透圧比較）または高張食塩水負荷試験で鑑別。MRI・ADH測定も考慮。',
      treatment: '水分補充を継続しながら精査。低張液（D5W）で補正。補正速度に注意。',
      resultColor: 'yellow',
    },
    {
      id: 'result_partial_di',
      title: '診断: 部分的尿崩症',
      type: 'result',
      diagnosis: '部分的尿崩症',
      detail: '尿浸透圧が300〜600の範囲。完全な尿崩症よりADH反応が残存。DDAVPに部分的反応あり。精査にて中枢性・腎性の完全型への移行を監視。',
      treatment: '水分摂取増加。DDAVP少量から試験的投与。原因精査（MRI・ホルモン検査）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_osmotic_diuresis',
      title: '診断: 浸透圧利尿による高Na',
      type: 'result',
      diagnosis: '浸透圧利尿（高血糖・尿素・マンニトール）',
      detail: '高血糖（DKA・HHS）・高BUN（過剰な蛋白投与）・マンニトール投与。浸透圧物質が尿中に大量排泄されることで等張〜低張尿となり水が排泄される。',
      treatment: 'インスリン投与（高血糖）・低張液補充。DKAは生食→インスリン→K補充。',
      resultColor: 'yellow',
    },
    {
      id: 'result_hypertonic_load',
      title: '診断: 医原性高Na（高張液投与）',
      type: 'result',
      diagnosis: '医原性高Na（高張経管栄養・高Na輸液）',
      detail: '経管栄養の水分不足・重炭酸Na大量投与・高張食塩水の過剰投与。ICU・術後患者に多い。',
      treatment: '高張液の中止。経管栄養に自由水追加（フリーウォーターフラッシュ）。低張液（D5W）補充。',
      resultColor: 'yellow',
    },
    {
      id: 'result_insensible_loss',
      title: '診断: 不感蒸泄増加による高Na',
      type: 'result',
      diagnosis: '不感蒸泄増加（発熱・高温・熱傷）',
      detail: '発熱1℃上昇で不感蒸泄約10%増加。熱傷では大量の水分が皮膚から喪失。口渇があれば水分摂取で代償されるが、意識障害・嚥下障害では代償不全。',
      treatment: '低張液（0.45%食塩水 or D5W）補充。解熱。熱傷は熱傷面積に応じた補液（Parkland式）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_restricted_access',
      title: '診断: 水分摂取制限による高Na',
      type: 'result',
      diagnosis: '水分摂取不足（意識障害・嚥下障害・介護不足）',
      detail: '口渇感は正常だが水分へのアクセスが制限されている。高齢者施設・脳卒中後・認知症患者に多い。ADL障害が背景にある。',
      treatment: '低張液（0.45%食塩水）または経口水分補充。嚥下リハビリ。介護環境の改善。',
      resultColor: 'yellow',
    },
    {
      id: 'result_sodium_load',
      title: '診断: Na負荷による高Na',
      type: 'result',
      diagnosis: 'Na負荷（医原性・海水誤嚥・食塩過剰摂取）',
      detail: '重炭酸Na投与（心停止蘇生・アシドーシス補正）・高張食塩水・海水誤嚥・食塩錠過剰摂取。腎機能が正常なら尿中Na排泄が増加するが、追いつかない場合に高Naとなる。',
      treatment: 'Na負荷の中止。D5W（自由水）補充。腎機能障害がある場合は透析も考慮。利尿薬（ループ利尿薬）でNa排泄促進。',
      resultColor: 'red',
    },
  ],
};
