import type { WorkupFlowDef } from '../components/WorkupFlow';

export const mgFlow: WorkupFlowDef = {
  title: 'Mg異常 鑑別フロー',
  requiredTests: [
    { key: 'mg', label: 'Mg', unit: 'mg/dL', category: 'blood' },
    { key: 'ca', label: 'Ca', unit: 'mg/dL', category: 'blood' },
    { key: 'k', label: 'K', unit: 'mEq/L', category: 'blood' },
    { key: 'cr', label: 'Cr', unit: 'mg/dL', category: 'blood' },
    { key: 'uMg', label: '尿Mg（随時）', unit: 'mg/dL', category: 'urine' },
    { key: 'uCr', label: '尿Cr（随時）', unit: 'mg/dL', category: 'urine' },
    { key: 'sMg', label: '血清Mg（再確認）', unit: 'mg/dL', category: 'blood' },
    { key: 'ecg', label: 'ECG（QT延長・Torsade de pointes）', unit: '', category: 'clinical' },
  ],
  startId: 'step1',
  steps: [
    {
      id: 'step1',
      title: 'Step 1: Mg重症度 + 合併電解質異常確認',
      description: 'Mg・K・Caを入力して重症度と合併電解質異常を確認します',
      type: 'input',
      inputs: [
        { key: 'mg', label: '血清Mg', unit: 'mg/dL' },
        { key: 'k', label: '血清K', unit: 'mEq/L' },
        { key: 'ca', label: '補正Ca', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const mg = parseFloat(v.mg);
        const k = parseFloat(v.k);
        const ca = parseFloat(v.ca);
        const results = [];
        if (!isNaN(mg)) {
          let severity = '';
          let color: 'red' | 'yellow' | 'green' = 'green';
          if (mg < 1.0) { severity = '重症低Mg（< 1.0）静注補充が必要。Torsadeリスク'; color = 'red'; }
          else if (mg < 1.5) { severity = '中等度低Mg（1.0〜1.5）症状・合併に応じて補充'; color = 'yellow'; }
          else if (mg > 4.0) { severity = '高Mg血症（> 4.0）深部腱反射消失・呼吸抑制リスク'; color = 'red'; }
          else if (mg > 2.5) { severity = '軽度高Mg（2.5〜4.0）'; color = 'yellow'; }
          else { severity = '正常範囲（1.5〜2.5）'; }
          results.push({ label: '血清Mg', value: `${mg} mg/dL`, interpretation: severity, color });
        }
        if (!isNaN(k) && k < 3.5) {
          results.push({ label: 'K低値', value: `${k} mEq/L`, interpretation: 'Mg欠乏で低Kが治療抵抗性になる。Mg補充が先', color: 'red' as 'red' });
        }
        if (!isNaN(ca) && ca < 8.0) {
          results.push({ label: 'Ca低値', value: `${ca} mg/dL`, interpretation: 'Mg欠乏でPTH分泌低下→低Ca。Mg補充で改善', color: 'red' as 'red' });
        }
        return results;
      },
      next: (v) => {
        const mg = parseFloat(v.mg);
        if (isNaN(mg)) return 'step1';
        if (mg > 2.5) return 'step_hyperMg';
        return 'step2';
      },
    },

    // 低Mg → FEMg計算
    {
      id: 'step2',
      title: 'Step 2: FEMg（Mg排泄分画）計算',
      description: '腎性 vs 腎外性Mg喪失を鑑別します',
      type: 'input',
      inputs: [
        { key: 'uMg', label: '尿Mg（随時）', unit: 'mg/dL' },
        { key: 'sMg', label: '血清Mg', unit: 'mg/dL' },
        { key: 'uCr', label: '尿Cr（随時）', unit: 'mg/dL' },
        { key: 'sCr', label: '血清Cr', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const uMg = parseFloat(v.uMg);
        const sMg = parseFloat(v.sMg);
        const uCr = parseFloat(v.uCr);
        const sCr = parseFloat(v.sCr);
        if (isNaN(uMg) || isNaN(sMg) || isNaN(uCr) || isNaN(sCr)) return [];
        // FEMg = (uMg × sCr) / (0.7 × sMg × uCr) × 100
        const feMg = (uMg * sCr) / (0.7 * sMg * uCr) * 100;
        return [
          {
            label: 'FEMg',
            value: `${feMg.toFixed(1)}%`,
            interpretation: feMg > 4 ? '> 4%: 腎性Mg喪失（腎がMgを保持できない）' : '≤ 4%: 腎外性喪失（腎はMgを保持）→ 消化管・摂取不足',
            color: (feMg > 4 ? 'red' : 'yellow') as 'red' | 'yellow',
          },
        ];
      },
      next: (v) => {
        const uMg = parseFloat(v.uMg);
        const sMg = parseFloat(v.sMg);
        const uCr = parseFloat(v.uCr);
        const sCr = parseFloat(v.sCr);
        if (isNaN(uMg) || isNaN(sMg) || isNaN(uCr) || isNaN(sCr)) return 'step2';
        const feMg = (uMg * sCr) / (0.7 * sMg * uCr) * 100;
        return feMg > 4 ? 'step3_renal' : 'step3_extrarenal';
      },
    },

    // 腎性Mg喪失
    {
      id: 'step3_renal',
      title: 'Step 3a: 腎性Mg喪失の原因',
      description: '腎からのMg喪失の原因を選択します',
      type: 'select',
      options: [
        { label: '利尿薬（ループ利尿薬・サイアザイド）', value: 'diuretic', description: 'Mgの再吸収阻害。最も多い医原性原因' },
        { label: 'シスプラチン・アミノグリコシド・アムフォテリシンB', value: 'nephrotoxin', description: '尿細管障害によるMg排泄亢進。シスプラチンは長期持続' },
        { label: 'プロトンポンプ阻害薬（PPI）長期服用', value: 'ppi', description: 'TRPM6発現低下→腸管吸収低下＋腎保持障害' },
        { label: 'Gitelman症候群・Bartter症候群', value: 'bartter', description: '遺伝性尿細管障害。低K低Mg合併が特徴' },
        { label: '高Ca血症・高血糖・アルコール', value: 'other_renal', description: 'Ca・グルコースとの競合的排泄阻害' },
      ],
      onSelect: (v) => {
        if (v === 'diuretic') return 'result_diuretic_mg';
        if (v === 'nephrotoxin') return 'result_cisplatin_mg';
        if (v === 'ppi') return 'result_ppi_mg';
        if (v === 'bartter') return 'result_gitelman_mg';
        return 'result_other_renal_mg';
      },
    },

    // 腎外性Mg喪失
    {
      id: 'step3_extrarenal',
      title: 'Step 3b: 腎外性Mg喪失/摂取不足の原因',
      description: '腎外性の原因を選択します',
      type: 'select',
      options: [
        { label: '下痢・吸収不良症候群', value: 'gi', description: '消化管からのMg喪失。潰瘍性大腸炎・クローン病・短腸症候群' },
        { label: 'アルコール依存症・栄養不足', value: 'alcohol', description: '摂取不足＋嘔吐＋利尿＋肝障害による複合機序' },
        { label: '再栄養症候群（リフィーディング）', value: 'refeeding', description: 'インスリン分泌によりMg細胞内移行。絶食後の栄養開始時' },
      ],
      onSelect: (v) => {
        if (v === 'gi') return 'result_gi_mg';
        if (v === 'alcohol') return 'result_alcohol_mg';
        return 'result_refeeding_mg';
      },
    },

    // 高Mg血症
    {
      id: 'step_hyperMg',
      title: 'Step 2（高Mg）: 原因評価',
      description: '高Mg血症の原因を選択します（腎機能障害が最多）',
      type: 'select',
      options: [
        { label: '腎機能障害（AKI/CKD）', value: 'renal', description: 'Mg排泄低下。CKD患者でのMg含有制酸薬・緩下薬の使用が引き金になることが多い' },
        { label: 'Mg製剤過剰投与（硫酸Mg静注）', value: 'iatrogenic', description: '子癇前症治療・早産予防での硫酸Mg過剰投与' },
        { label: 'Mg含有制酸薬・緩下薬の大量使用', value: 'antacid', description: '腎機能障害患者での使用が危険。高齢者に多い' },
      ],
      onSelect: () => 'result_hyperMg',
    },

    // Results
    {
      id: 'result_diuretic_mg',
      type: 'result',
      title: '診断: 利尿薬による低Mg',
      diagnosis: '利尿薬による腎性Mg喪失',
      detail: 'ループ利尿薬（フロセミド）：ヘンレループ上行脚でのMg再吸収阻害。サイアザイド：遠位曲尿細管でのMg再吸収阻害。低K低Mgの組み合わせが多い。',
      treatment: '酸化Mg経口補充（300〜600 mg/日）。低Kも並行補充（Mg欠乏で低Kが治療抵抗性になるため）。利尿薬の減量・変更を検討。スピロノラクトン（Mgを保持する）への変更。',
      resultColor: 'yellow',
    },
    {
      id: 'result_cisplatin_mg',
      type: 'result',
      title: '診断: 腎毒性薬剤による低Mg',
      diagnosis: '腎毒性薬剤（シスプラチン・アミノグリコシド）による低Mg',
      detail: 'シスプラチン：近位尿細管障害→TRPM6発現低下→慢性持続性低Mg（投与後数年続くことあり）。アミノグリコシド：尿細管障害。アムフォテリシンB：集合管障害。',
      treatment: '経口Mg補充（酸化Mg）。シスプラチン前補液・Mg補充で予防（1〜2 g MgSO₄ iv）。持続する場合は長期Mg補充が必要。',
      resultColor: 'red',
    },
    {
      id: 'result_ppi_mg',
      type: 'result',
      title: '診断: PPI長期服用による低Mg',
      diagnosis: 'PPI長期服用（低Mg血症）',
      detail: 'プロトンポンプ阻害薬の長期使用（通常1年以上）でTRPM6発現低下→腸管Mg吸収低下。経口Mg補充が効きにくい。PPI中止で通常改善。',
      treatment: 'PPI中止または H₂ブロッカーへの変更が最も効果的。酸化Mg経口（吸収が限界）。症状が重い場合はMgSO₄静注。',
      resultColor: 'yellow',
    },
    {
      id: 'result_gitelman_mg',
      type: 'result',
      title: '診断: Gitelman症候群による低Mg',
      diagnosis: 'Gitelman症候群（低K・低Mg・低Ca尿）',
      detail: 'SLC12A3遺伝子変異（NCC障害）。低K＋低Mg＋代謝性アルカローシス＋低尿Ca（サイアザイド様）。若年発症。無症候〜テタニー・Torsade。',
      treatment: 'KCl＋酸化Mg大量補充（症状改善まで）。スピロノラクトン・アミロライド。インドメタシン（一部有効）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_other_renal_mg',
      type: 'result',
      title: '診断: その他の腎性Mg喪失',
      diagnosis: 'その他の腎性Mg喪失（高Ca・高血糖・アルコール）',
      detail: '高Ca血症：CaとMgがTRPM6で競合。高血糖（DKA）：浸透圧利尿でMg排泄。アルコール：利尿作用＋肝障害＋摂取不足。',
      treatment: '原因の治療（高Ca・高血糖の補正）。酸化Mg経口。DKA回復期のMg補充は重要（低K・低Pと並行）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_gi_mg',
      type: 'result',
      title: '診断: 消化管からのMg喪失',
      diagnosis: '消化管からのMg喪失（下痢・吸収不良）',
      detail: '急性・慢性下痢・潰瘍性大腸炎・クローン病・セリアック病・短腸症候群。腸管からのMg吸収障害と直接喪失。',
      treatment: '酸化Mg経口補充（吸収不良例では効果限定的）。重症例はMgSO₄静注。原疾患治療。',
      resultColor: 'yellow',
    },
    {
      id: 'result_alcohol_mg',
      type: 'result',
      title: '診断: アルコール依存症による低Mg',
      diagnosis: 'アルコール依存症・栄養不足による低Mg',
      detail: '摂取不足＋嘔吐＋アルコールの利尿作用＋肝障害の複合。低K・低P・低Ca・チアミン欠乏も合併することが多い。',
      treatment: 'MgSO₄静注（0.5〜1 mEq/kg/日）。チアミン（VB1）補充も忘れずに。低K・低Pの同時補充。',
      resultColor: 'yellow',
    },
    {
      id: 'result_refeeding_mg',
      type: 'result',
      title: '診断: 再栄養症候群（低Mg）',
      diagnosis: '再栄養症候群（リフィーディング症候群）による低Mg',
      detail: '絶食後の急速な栄養補給でインスリン分泌→Mg・K・Pが細胞内移行。神経筋症状・心不全・横紋筋融解。低Pが最も危険だが低Mgも重要。',
      treatment: '栄養補充速度を遅くする。MgSO₄静注。KCl・リン酸K補充を並行。心電図モニター。',
      resultColor: 'red',
    },
    {
      id: 'result_hyperMg',
      type: 'result',
      title: '診断: 高Mg血症',
      diagnosis: '高Mg血症（腎不全・Mg製剤過剰投与）',
      detail: 'Mg > 4.9 mg/dL（≒4 mEq/L）：悪心・潮紅・低血圧。> 7.3 mg/dL（≒6 mEq/L）：深部腱反射消失（毒性の早期サイン）。> 9.7 mg/dL（≒8 mEq/L）：呼吸筋麻痺。> 14.6 mg/dL（≒12 mEq/L）：心停止。\n原因：腎不全＋Mg製剤・子癇前症治療での硫酸Mg過剰・Mg含有制酸薬大量摂取。',
      treatment: '軽症：Mg含有薬剤中止・補液。\n中等症（反射消失）：グルコン酸Ca（Ca拮抗）iv・透析準備。\n重症（呼吸抑制・心停止）：グルコン酸Ca 1〜2g iv（即効拮抗）＋透析。腎機能正常例はループ利尿薬＋補液でMg排泄。',
      resultColor: 'red',
    },
  ],
};
