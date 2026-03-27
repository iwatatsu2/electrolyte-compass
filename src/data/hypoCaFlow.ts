import type { WorkupFlowDef } from '../components/WorkupFlow';

export const hypoCaFlow: WorkupFlowDef = {
  title: '低Ca血症 鑑別フロー',
  requiredTests: [
    { key: 'ca', label: '総Ca', unit: 'mg/dL', category: 'blood' },
    { key: 'alb', label: 'Alb', unit: 'g/dL', category: 'blood' },
    { key: 'pth', label: 'intact PTH', unit: 'pg/mL', category: 'blood' },
    { key: 'p', label: 'P', unit: 'mg/dL', category: 'blood' },
    { key: 'mg', label: 'Mg', unit: 'mg/dL', category: 'blood' },
    { key: 'cr', label: 'Cr', unit: 'mg/dL', category: 'blood' },
    { key: 'vitd', label: '25-OH VitD', unit: 'ng/mL', category: 'blood' },
    { key: 'uCa', label: '尿Ca（随時）', unit: 'mg/dL', category: 'urine' },
    { key: 'ecg', label: 'ECG（QT延長確認）', unit: '', category: 'clinical' },
    { key: 'sx', label: 'テタニー・Chvostek徴候・Trousseau徴候', unit: '', category: 'clinical' },
  ],
  startId: 'step1',
  steps: [
    {
      id: 'step1',
      title: 'Step 1: 補正Ca計算 + 緊急度評価',
      description: '総Ca・Albから補正Caを計算し、症状の重症度を確認します',
      type: 'input',
      inputs: [
        { key: 'ca', label: '総Ca', unit: 'mg/dL' },
        { key: 'alb', label: 'Alb', unit: 'g/dL' },
      ],
      calc: (v) => {
        const ca = parseFloat(v.ca);
        const alb = parseFloat(v.alb);
        if (isNaN(ca) || isNaN(alb)) return [];
        const corrCa = ca + 0.8 * (4.0 - alb);
        let severity = '';
        let color: 'red' | 'yellow' | 'green' = 'green';
        if (corrCa < 7.0) { severity = '重症（< 7.0）緊急Ca補充が必要。痙攣・不整脈リスク'; color = 'red'; }
        else if (corrCa < 8.0) { severity = '中等度（7.0〜8.0）症状に応じて補充'; color = 'yellow'; }
        else { severity = '軽度（8.0〜8.5）経過観察または経口補充'; color = 'green'; }
        return [
          { label: '補正Ca', value: `${corrCa.toFixed(1)} mg/dL`, interpretation: '正常値: 8.5〜10.2 mg/dL', color: (corrCa < 8.0 ? 'red' : 'green') as 'red' | 'green' },
          { label: '重症度', value: severity, interpretation: '', color },
        ];
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
      title: 'Step 2: PTH・Mg・P測定',
      description: 'PTH・Mgで副甲状腺機能を評価します',
      type: 'input',
      inputs: [
        { key: 'pth', label: 'intact PTH', unit: 'pg/mL' },
        { key: 'mg', label: 'Mg', unit: 'mg/dL' },
        { key: 'p', label: 'P', unit: 'mg/dL' },
        { key: 'cr', label: 'Cr', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const pth = parseFloat(v.pth);
        const mg = parseFloat(v.mg);
        const p = parseFloat(v.p);
        const cr = parseFloat(v.cr);
        const results = [];
        if (!isNaN(pth)) {
          results.push({
            label: 'PTH',
            value: `${pth} pg/mL`,
            interpretation: pth < 15 ? '低値/正常低値 → 副甲状腺機能低下症疑い' : pth > 65 ? '高値 → PTH抵抗性（偽性副甲状腺機能低下症）またはビタミンD欠乏' : '適正範囲（代償反応あり）',
            color: (pth < 15 ? 'red' : pth > 65 ? 'yellow' : 'green') as 'red' | 'yellow' | 'green',
          });
        }
        if (!isNaN(mg) && mg < 1.8) {
          results.push({ label: 'Mg', value: `${mg} mg/dL`, interpretation: 'Mg欠乏 → PTH分泌抑制・PTH抵抗性の原因。先にMg補充！', color: 'red' as 'red' });
        }
        if (!isNaN(p)) {
          results.push({
            label: 'P',
            value: `${p} mg/dL`,
            interpretation: p > 4.5 ? '高P → 副甲状腺機能低下症・腎不全を疑う' : p < 2.5 ? '低P → ビタミンD欠乏・吸収不良を疑う' : '正常',
            color: (p > 4.5 || p < 2.5 ? 'yellow' : 'green') as 'yellow' | 'green',
          });
        }
        if (!isNaN(cr) && cr > 2.0) {
          results.push({ label: 'Cr高値', value: `${cr} mg/dL`, interpretation: '腎不全 → 活性型VitD産生低下・高P → 低Caの主因', color: 'yellow' as 'yellow' });
        }
        return results;
      },
      next: (v) => {
        const pth = parseFloat(v.pth);
        const mg = parseFloat(v.mg);
        if (isNaN(pth)) return 'step2';
        if (!isNaN(mg) && mg < 1.8) return 'result_mg_deficiency';
        if (pth < 15) return 'step3_low_pth';
        return 'step3_high_pth';
      },
    },

    // PTH低値 → 副甲状腺機能低下症の原因
    {
      id: 'step3_low_pth',
      title: 'Step 3a: PTH低値 → 副甲状腺機能低下症の原因',
      description: '副甲状腺機能低下症の原因を選択します',
      type: 'select',
      options: [
        { label: '頸部手術・放射線治療後', value: 'post_surgery', description: '甲状腺・副甲状腺手術後が最多。術後24〜48時間で発症' },
        { label: '自己免疫性（APS1・孤立性）', value: 'autoimmune', description: '抗PTH抗体・APS1（AIRE遺伝子変異）。Addison病・粘膜皮膚カンジダ症合併' },
        { label: 'DiGeorge症候群（22q11欠失）', value: 'digeorge', description: '先天性副甲状腺無形成。心奇形・免疫不全合併' },
        { label: 'その他（低Mg・浸潤性疾患・特発性）', value: 'other', description: 'Mg欠乏（PTH分泌抑制）・ヘモクロマトーシス・Wilson病' },
      ],
      onSelect: (v) => {
        if (v === 'post_surgery') return 'result_postsurgical_hypo';
        if (v === 'autoimmune') return 'result_autoimmune_hypo';
        if (v === 'digeorge') return 'result_digeorge';
        return 'result_other_hypo';
      },
    },

    // PTH高値 → VitD欠乏 vs 偽性副甲状腺機能低下症
    {
      id: 'step3_high_pth',
      title: 'Step 3b: PTH高値 → VitD欠乏 vs PTH抵抗性',
      description: 'ビタミンD・腎機能で原因を鑑別します',
      type: 'input',
      inputs: [
        { key: 'vitd', label: '25-OH VitD', unit: 'ng/mL' },
        { key: 'cr', label: 'Cr', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const vitd = parseFloat(v.vitd);
        const cr = parseFloat(v.cr);
        const results = [];
        if (!isNaN(vitd)) {
          results.push({
            label: '25-OH VitD',
            value: `${vitd} ng/mL`,
            interpretation: vitd < 20 ? '欠乏（< 20）→ VitD欠乏性低Ca' : vitd < 30 ? '不足（20〜30）→ 境界' : '正常（> 30）',
            color: (vitd < 20 ? 'red' : vitd < 30 ? 'yellow' : 'green') as 'red' | 'yellow' | 'green',
          });
        }
        if (!isNaN(cr) && cr > 2.0) {
          results.push({ label: 'Cr高値', value: `${cr} mg/dL`, interpretation: '腎性骨異栄養症（CKD-MBD）を疑う', color: 'yellow' as 'yellow' });
        }
        return results;
      },
      next: (v) => {
        const vitd = parseFloat(v.vitd);
        const cr = parseFloat(v.cr);
        if (isNaN(vitd) && isNaN(cr)) return 'step3_high_pth';
        if (!isNaN(cr) && cr > 2.0) return 'result_ckd_mbd';
        if (!isNaN(vitd) && vitd < 20) return 'result_vitd_deficiency';
        return 'result_php';
      },
    },

    // Results
    {
      id: 'result_mg_deficiency',
      type: 'result',
      title: '診断: Mg欠乏による低Ca',
      diagnosis: 'Mg欠乏による低Ca（PTH分泌抑制・PTH抵抗性）',
      detail: 'Mg欠乏はPTHの分泌を抑制し、末梢でのPTH抵抗性も引き起こす。アルコール依存症・下痢・プロトンポンプ阻害薬・利尿薬（ループ・サイアザイド）が原因。低K・低Mgの組み合わせに注意。',
      treatment: 'まずMg補充（硫酸Mg静注または経口酸化Mg）。Mgが回復するとPTH分泌が再開しCaは自然改善することが多い。Ca補充は効果が薄いためMg先行が原則。',
      resultColor: 'red',
    },
    {
      id: 'result_postsurgical_hypo',
      type: 'result',
      title: '診断: 術後副甲状腺機能低下症',
      diagnosis: '術後副甲状腺機能低下症',
      detail: '甲状腺全摘・副甲状腺切除後に最多。一過性（6ヶ月以内に回復）と永続性がある。Hungry bone syndrome（骨へのCa・P急速取り込み）との鑑別も重要。',
      treatment: '急性期：グルコン酸Ca 10% 10mL iv（緩徐に）。維持：活性型VitD（アルファカルシドール or カルシトリオール）＋炭酸Ca経口。目標補正Ca 8〜9 mg/dL（高Caは尿路結石リスク）。',
      resultColor: 'red',
    },
    {
      id: 'result_autoimmune_hypo',
      type: 'result',
      title: '診断: 自己免疫性副甲状腺機能低下症',
      diagnosis: '自己免疫性副甲状腺機能低下症',
      detail: '孤立性または多内分泌腺不全症候群1型（APS1：副甲状腺機能低下症＋Addison病＋粘膜皮膚カンジダ症）。抗PTH抗体・抗NALP5抗体測定。',
      treatment: '活性型VitD（カルシトリオール）＋炭酸Ca。APS1ではコルチゾール補充も並行。',
      resultColor: 'red',
    },
    {
      id: 'result_digeorge',
      type: 'result',
      title: '診断: DiGeorge症候群',
      diagnosis: 'DiGeorge症候群（22q11.2欠失症候群）',
      detail: '先天性副甲状腺・胸腺無形成。心奇形（大動脈弓離断・Fallot四徴症）・T細胞免疫不全・口蓋裂合併。FISH法で染色体検査。',
      treatment: '活性型VitD＋炭酸Ca。重症免疫不全には胸腺移植。心奇形は外科的修復。',
      resultColor: 'red',
    },
    {
      id: 'result_other_hypo',
      type: 'result',
      title: '診断: その他の副甲状腺機能低下症',
      diagnosis: 'その他（浸潤性疾患・放射線・特発性）',
      detail: 'ヘモクロマトーシス（鉄沈着）・ウィルソン病（銅沈着）・サルコイドーシス・転移性腫瘍・頸部放射線治療後・特発性（成人発症）。',
      treatment: '活性型VitD＋炭酸Ca。原疾患治療（鉄キレート療法・銅除去）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_vitd_deficiency',
      type: 'result',
      title: '診断: ビタミンD欠乏',
      diagnosis: 'ビタミンD欠乏性低Ca（二次性副甲状腺機能亢進症）',
      detail: '25-OH VitD < 20 ng/mL。日光暴露不足・吸収不良（炎症性腸疾患・胃切除後）・腎機能障害（1α水酸化障害）・抗てんかん薬（VitD代謝促進）。二次性副甲状腺機能亢進症（PTH高値）を伴う。',
      treatment: 'VitD₃（コレカルシフェロール）補充：1000〜4000 IU/日。吸収不良では大量補充。炭酸Ca経口。腎機能障害では活性型VitD（カルシトリオール）を使用。',
      resultColor: 'yellow',
    },
    {
      id: 'result_php',
      type: 'result',
      title: '診断: 偽性副甲状腺機能低下症（PHP）',
      diagnosis: '偽性副甲状腺機能低下症（PTH高値・PTH抵抗性）',
      detail: 'PTH受容体（GNAS1遺伝子変異）の異常によりPTHが効かない。PHP1a：Albright骨異形成症（短指・低身長・皮下石灰化・知的障害）。PHP1b：受容体機能異常のみ。',
      treatment: '活性型VitD（カルシトリオール）＋炭酸Ca。PTH製剤は無効（受容体障害のため）。',
      resultColor: 'red',
    },
    {
      id: 'result_ckd_mbd',
      type: 'result',
      title: '診断: 慢性腎臓病-骨ミネラル代謝異常（CKD-MBD）',
      diagnosis: 'CKD-MBD（腎性骨異栄養症）',
      detail: 'CKDでの活性型VitD産生低下（1α水酸化酵素障害）＋高P血症（GFR低下）→ 低Ca＋二次性PTH上昇。長期放置で線維性骨炎・骨軟化症・転移性石灰化。',
      treatment: 'P制限食＋リン吸着薬（炭酸Ca・炭酸ランタン・スベラム）。活性型VitD（アルファカルシドール）。透析患者ではシナカルセト（擬似Ca受容体作動薬）。',
      resultColor: 'red',
    },
  ],
};
