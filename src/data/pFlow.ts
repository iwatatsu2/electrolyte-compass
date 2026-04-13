import type { WorkupFlowDef } from '../components/WorkupFlow';

export const pFlow: WorkupFlowDef = {
  title: 'リン（P）異常 鑑別フロー',
  requiredTests: [
    { key: 'p', label: 'P', unit: 'mg/dL', category: 'blood' },
    { key: 'ca', label: 'Ca', unit: 'mg/dL', category: 'blood' },
    { key: 'pth', label: 'intact PTH', unit: 'pg/mL', category: 'blood' },
    { key: 'cr', label: 'Cr', unit: 'mg/dL', category: 'blood' },
    { key: 'alb', label: 'Alb', unit: 'g/dL', category: 'blood' },
    { key: 'vitd', label: '25-OH VitD', unit: 'ng/mL', category: 'blood' },
    { key: 'uP', label: '尿P（随時）', unit: 'mg/dL', category: 'urine' },
    { key: 'uCr', label: '尿Cr（随時）', unit: 'mg/dL', category: 'urine' },
    { key: 'fgf23', label: 'FGF23（疑い例）', unit: 'pg/mL', category: 'blood' },
  ],
  startId: 'step1',
  steps: [
    {
      id: 'step1',
      title: 'Step 1: P値確認 + 腎機能・Ca評価',
      description: 'P・Cr・Caで低P or 高Pか、腎不全合併の有無を確認します',
      type: 'input',
      inputs: [
        { key: 'p', label: 'P', unit: 'mg/dL' },
        { key: 'cr', label: 'Cr', unit: 'mg/dL' },
        { key: 'ca', label: '補正Ca', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const p = parseFloat(v.p);
        const cr = parseFloat(v.cr);
        const ca = parseFloat(v.ca);
        const results = [];
        if (!isNaN(p)) {
          let direction = '';
          let color: 'red' | 'yellow' | 'green' = 'green';
          if (p < 1.0) { direction = '重症低P（< 1.0）緊急補充が必要。呼吸筋麻痺・溶血リスク'; color = 'red'; }
          else if (p < 2.5) { direction = '低P血症（< 2.5）'; color = 'yellow'; }
          else if (p > 5.5) { direction = '高P血症（> 5.5）'; color = 'red'; }
          else { direction = '正常範囲（2.5〜4.5 mg/dL）'; }
          results.push({ label: 'P値', value: `${p} mg/dL`, interpretation: direction, color });
        }
        if (!isNaN(cr) && cr > 2.0) {
          results.push({ label: 'Cr高値', value: `${cr} mg/dL`, interpretation: '腎不全 → 高P血症の最多原因。GFR低下でP排泄障害', color: 'yellow' as 'yellow' });
        }
        if (!isNaN(ca) && !isNaN(p)) {
          const caXp = ca * p;
          results.push({
            label: 'Ca × P積',
            value: `${caXp.toFixed(0)} mg²/dL²`,
            interpretation: caXp > 55 ? '> 55: 異所性石灰化リスク（血管・軟部組織）' : '< 55: 許容範囲',
            color: (caXp > 55 ? 'red' : 'green') as 'red' | 'green',
          });
        }
        return results;
      },
      next: (v) => {
        const p = parseFloat(v.p);
        if (isNaN(p)) return 'step1';
        if (p > 4.5) return 'step_highP';
        if (p < 2.5) return 'step2_lowP';
        return 'result_normalP';
      },
    },

    // 正常P
    {
      id: 'result_normalP',
      type: 'result',
      title: '結果: P値は正常範囲',
      diagnosis: 'P正常（2.5〜4.5 mg/dL）',
      detail: 'P値は正常範囲内です。臨床的にP異常が疑われる場合は再検をご検討ください。',
      treatment: '特に治療介入不要。',
      resultColor: 'green',
    },

    // 低P → FEP計算
    {
      id: 'step2_lowP',
      title: 'Step 2: FEP（P排泄分画）計算',
      description: '腎性 vs 腎外性P喪失を鑑別します',
      type: 'input',
      inputs: [
        { key: 'uP', label: '尿P（随時）', unit: 'mg/dL' },
        { key: 'sP', label: '血清P', unit: 'mg/dL' },
        { key: 'uCr', label: '尿Cr（随時）', unit: 'mg/dL' },
        { key: 'sCr', label: '血清Cr', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const uP = parseFloat(v.uP);
        const sP = parseFloat(v.sP);
        const uCr = parseFloat(v.uCr);
        const sCr = parseFloat(v.sCr);
        if (isNaN(uP) || isNaN(sP) || isNaN(uCr) || isNaN(sCr)) return [];
        const feP = (uP * sCr) / (sP * uCr) * 100;
        return [
          {
            label: 'FEP',
            value: `${feP.toFixed(1)}%`,
            interpretation: feP > 5 ? '> 5%: 腎性P喪失（PTH↑・FGF23↑・Fanconi症候群）' : '≤ 5%: 腎外性（摂取不足・吸収不良・細胞内移行）',
            color: (feP > 5 ? 'red' : 'yellow') as 'red' | 'yellow',
          },
        ];
      },
      next: (v) => {
        const uP = parseFloat(v.uP);
        const sP = parseFloat(v.sP);
        const uCr = parseFloat(v.uCr);
        const sCr = parseFloat(v.sCr);
        if (isNaN(uP) || isNaN(sP) || isNaN(uCr) || isNaN(sCr)) return 'step2_lowP';
        const feP = (uP * sCr) / (sP * uCr) * 100;
        return feP > 5 ? 'step3_renal_lowP' : 'step3_extrarenal_lowP';
      },
    },

    // 腎性低P
    {
      id: 'step3_renal_lowP',
      title: 'Step 3a: 腎性P喪失の原因（PTH・FGF23）',
      description: 'PTHとFGF23を入力して原因を絞ります',
      type: 'input',
      inputs: [
        { key: 'pth', label: 'intact PTH', unit: 'pg/mL' },
        { key: 'ca', label: '補正Ca', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const pth = parseFloat(v.pth);
        const ca = parseFloat(v.ca);
        const results = [];
        if (!isNaN(pth)) {
          results.push({
            label: 'PTH',
            value: `${pth} pg/mL`,
            interpretation: pth > 65 ? '高値 → PHPT（PTHがFEP↑）またはビタミンD欠乏（二次性）' : '正常〜低値 → FGF23過剰・Fanconi症候群・アセタゾラミドを疑う',
            color: (pth > 65 ? 'yellow' : 'red') as 'yellow' | 'red',
          });
        }
        if (!isNaN(ca)) {
          results.push({
            label: '補正Ca',
            value: `${ca} mg/dL`,
            interpretation: ca > 10.5 ? '高Ca＋低P → PHPTを強く支持' : ca < 8.5 ? '低Ca＋低P → ビタミンD欠乏・腫瘍性骨軟化症（TIO）を考慮' : '正常Ca',
            color: (ca > 10.5 ? 'yellow' : ca < 8.5 ? 'red' : 'green') as 'yellow' | 'red' | 'green',
          });
        }
        return results;
      },
      next: (v) => {
        const pth = parseFloat(v.pth);
        const ca = parseFloat(v.ca);
        if (isNaN(pth)) return 'step3_renal_lowP';
        if (pth > 65 && !isNaN(ca) && ca > 10.5) return 'result_phpt_lowP';
        if (pth > 65) return 'result_vitd_lowP';
        return 'result_fgf23_lowP';
      },
    },

    // 腎外性低P
    {
      id: 'step3_extrarenal_lowP',
      title: 'Step 3b: 腎外性P喪失/移行の原因',
      description: '原因を選択します',
      type: 'select',
      options: [
        { label: '再栄養症候群（リフィーディング）', value: 'refeeding', description: '絶食後の急速な栄養補給。Pが最も危険な低下。低Mg・低K合併' },
        { label: 'DKA回復期・インスリン投与', value: 'dka', description: 'インスリンによるP細胞内移行。低K・低Mgとセット' },
        { label: 'リン吸着薬・制酸薬（Al・Ca・Mg含有）', value: 'antacid', description: '腸管でのP結合→吸収阻害。慢性的な使用' },
        { label: '摂取不足・吸収不良', value: 'intake', description: '飢餓・神経性食思不振症・吸収不良症候群（セリアック病）' },
        { label: '呼吸性アルカローシス', value: 'resp_alk', description: 'pHアルカリ化→解糖系亢進→PがATPに取り込まれ細胞内移行' },
      ],
      onSelect: (v) => {
        if (v === 'refeeding') return 'result_refeeding_P';
        if (v === 'dka') return 'result_dka_P';
        if (v === 'antacid') return 'result_antacid_P';
        if (v === 'intake') return 'result_intake_P';
        return 'result_resp_alk_P';
      },
    },

    // 高P血症
    {
      id: 'step_highP',
      title: 'Step 2（高P）: 原因評価',
      description: '腎機能・PTH・細胞崩壊の有無を確認します',
      type: 'select',
      options: [
        { label: '腎不全（AKI/CKD）', value: 'renal', description: 'GFR低下→P排泄障害。最も多い原因' },
        { label: '副甲状腺機能低下症', value: 'hypo_pth', description: 'PTH低下→腎でのP排泄低下。低Ca合併が特徴' },
        { label: '腫瘍崩壊症候群・横紋筋融解', value: 'tls', description: '大量細胞崩壊でP細胞外流出。高K・高尿酸合併' },
        { label: 'VitD中毒・サルコイドーシス', value: 'vitd_tox', description: '腸管Ca・P吸収↑' },
        { label: 'リン製剤過剰摂取・リン酸浣腸', value: 'intake', description: '医原性高P。腎不全患者では危険' },
      ],
      onSelect: (v) => {
        if (v === 'renal') return 'result_ckd_highP';
        if (v === 'hypo_pth') return 'result_hypo_pth_highP';
        if (v === 'tls') return 'result_tls_highP';
        if (v === 'vitd_tox') return 'result_vitd_highP';
        return 'result_intake_highP';
      },
    },

    // Results 低P
    {
      id: 'result_phpt_lowP',
      type: 'result',
      title: '診断: PHPT（低P＋高Ca）',
      diagnosis: '原発性副甲状腺機能亢進症（PTH↑・低P・高Ca）',
      detail: 'PTHがFGF23を誘導→腎でのP再吸収低下（FEP↑）。また直接的にPTC2（リン輸送体）を抑制。低P＋高Ca＋PTH高値の組み合わせが特徴。',
      treatment: '副甲状腺摘出（手術適応あり）。手術不適応例はシナカルセト。リン補充は基本不要（術後は急激に低下するため経過観察）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_vitd_lowP',
      type: 'result',
      title: '診断: ビタミンD欠乏（二次性PTH↑・低P）',
      diagnosis: 'ビタミンD欠乏（二次性副甲状腺機能亢進症）',
      detail: 'VitD欠乏→低Ca→PTH上昇→腎P排泄亢進。低Ca＋低P＋PTH高値の組み合わせ。骨軟化症・くる病の原因。',
      treatment: 'VitD₃補充（コレカルシフェロール 1000〜4000 IU/日）。活性型VitD（吸収不良・腎機能障害時）。炭酸Ca経口。',
      resultColor: 'yellow',
    },
    {
      id: 'result_fgf23_lowP',
      type: 'result',
      title: '診断: FGF23過剰・Fanconi症候群',
      diagnosis: 'FGF23過剰（腫瘍性骨軟化症）またはFanconi症候群',
      detail: '腫瘍性骨軟化症（TIO）：間葉系腫瘍がFGF23を過剰産生→腎P排泄亢進。見つけにくい小腫瘍（四肢・頭部）。FGF23高値が鍵。\nFanconi症候群：近位尿細管障害（P・HCO₃・尿糖・アミノ酸尿）。テノホビル・シスプラチン・骨髄腫。',
      treatment: '腫瘍性骨軟化症：腫瘍摘出（FDG-PET/ソマトスタチン受容体シンチで探索）。リン補充＋活性型VitD（対症）。抗FGF23抗体（ブロスマブ・XLH適応）。',
      resultColor: 'red',
    },
    {
      id: 'result_refeeding_P',
      type: 'result',
      title: '診断: 再栄養症候群（低P）',
      diagnosis: '再栄養症候群（リフィーディング症候群）による低P',
      detail: '絶食後の急速な栄養補給でインスリン分泌→Pが細胞内移行してATP合成に使われる。低Pが最も危険な異常。横紋筋融解・溶血・呼吸不全・心不全・けいれんのリスク。',
      treatment: 'リン酸Kまたはリン酸Na静注。栄養補充を段階的に減速。Mg・K同時補充。心電図モニター。',
      resultColor: 'red',
    },
    {
      id: 'result_dka_P',
      type: 'result',
      title: '診断: DKA回復期の低P',
      diagnosis: 'DKA回復期・インスリン投与による低P',
      detail: 'インスリンによりPが細胞内移行（K・Mgと同様）。DKA時は高P→回復期に急速低下。P < 1.0 mg/dL は緊急補充。',
      treatment: 'P < 1.0 または症状あり：リン酸K静注（0.08〜0.16 mmol/kg/hr）。P 1.0〜2.5：経口リン補充。K補充と組み合わせるとリン酸Kが効率的。',
      resultColor: 'yellow',
    },
    {
      id: 'result_antacid_P',
      type: 'result',
      title: '診断: リン吸着薬・制酸薬による低P',
      diagnosis: 'リン吸着薬・Al/Ca/Mg含有制酸薬による低P',
      detail: '腸管内でPが結合され吸収阻害。Al含有制酸薬は骨軟化症・アルミニウム脳症のリスク（腎不全患者では特に危険）。CaCO₃・炭酸Mg含有制酸薬も過剰使用で低P。',
      treatment: '制酸薬の中止または減量。P含有食品の摂取増加。Al含有制酸薬は腎不全患者には禁忌。',
      resultColor: 'yellow',
    },
    {
      id: 'result_intake_P',
      type: 'result',
      title: '診断: P摂取不足・吸収不良',
      diagnosis: 'P摂取不足・吸収不良',
      detail: '重度の飢餓・神経性食思不振症・Crohn病・セリアック病・短腸症候群。VitD欠乏が吸収不良を増悪させることが多い。',
      treatment: 'P補充（牛乳・ヨーグルト・チーズで食事補充、または経口リン酸塩製剤）。VitD補充。原疾患治療。',
      resultColor: 'yellow',
    },
    {
      id: 'result_resp_alk_P',
      type: 'result',
      title: '診断: 呼吸性アルカローシスによる低P',
      diagnosis: '呼吸性アルカローシスによる低P（細胞内移行）',
      detail: 'pHアルカリ化→解糖系亢進→phosphorylated intermediates増加→細胞内P移行。過換気症候群・人工呼吸管理中に多い。通常は一過性で重症にならない。',
      treatment: '呼吸性アルカローシスの是正（過換気の治療）。P補充は通常不要（原因是正で自然改善）。',
      resultColor: 'green',
    },

    // Results 高P
    {
      id: 'result_ckd_highP',
      type: 'result',
      title: '診断: CKD/AKIによる高P',
      diagnosis: 'CKD/AKIによる高P血症（GFR低下）',
      detail: 'GFR < 30 mL/min で顕著。高P＋低Ca＋PTH上昇（二次性副甲状腺機能亢進症）＋活性型VitD低下 → CKD-MBD。Ca × P > 55 は血管石灰化リスク。',
      treatment: 'P制限食（800〜1000 mg/日）。リン吸着薬（炭酸Ca・セベラマー・炭酸ランタン）。活性型VitD。透析患者：シナカルセト。CaXP積を55以下に。',
      resultColor: 'red',
    },
    {
      id: 'result_hypo_pth_highP',
      type: 'result',
      title: '診断: 副甲状腺機能低下症による高P',
      diagnosis: '副甲状腺機能低下症（PTH低下→腎P排泄低下）',
      detail: 'PTH低下→腎NaPiII共輸送体活性化→P再吸収亢進→高P。同時に低Caを呈する（PTHによるCa動員低下）。頸部手術後が最多。',
      treatment: '活性型VitD＋炭酸Ca。低P食。Ca × P積管理。',
      resultColor: 'yellow',
    },
    {
      id: 'result_tls_highP',
      type: 'result',
      title: '診断: 腫瘍崩壊症候群（TLS）・横紋筋融解',
      diagnosis: '腫瘍崩壊症候群（高K・高P・高尿酸・低Ca）または横紋筋融解',
      detail: 'TLS：大量の細胞崩壊（特に白血病・リンパ腫の化学療法後）でP・K・尿酸が細胞外流出。低Ca（高Pによる沈降）・AKIを伴う。横紋筋融解でも細胞内Pが大量放出。',
      treatment: '大量補液（生理食塩水）。ラスブリカーゼ（尿酸低下）。AlO含有制酸薬（腸管P結合）。高K対策。重症AKIは透析。',
      resultColor: 'red',
    },
    {
      id: 'result_vitd_highP',
      type: 'result',
      title: '診断: VitD中毒・サルコイドーシスによる高P',
      diagnosis: 'VitD中毒・サルコイドーシスによる高P',
      detail: 'VitD中毒（サプリ過剰）：腸管Ca・P吸収↑。高Ca＋高P。サルコイドーシス：肉芽腫内での1,25-OH₂VitD産生過剰→同様。',
      treatment: 'VitD中毒：VitD中止・補液・ステロイド。サルコイドーシス：プレドニゾン（著効）・日光回避。',
      resultColor: 'yellow',
    },
    {
      id: 'result_intake_highP',
      type: 'result',
      title: '診断: リン製剤過剰摂取・リン酸浣腸',
      diagnosis: 'リン製剤過剰摂取・リン酸浣腸（医原性高P）',
      detail: '腎不全患者へのリン酸浣腸は致命的な高Pを起こしうる。経口リン製剤の過剰摂取。通常腎機能正常例では速やかに排泄されるが、腎不全では蓄積。',
      treatment: 'リン製剤中止。補液。腎不全患者は透析適応を検討。',
      resultColor: 'red',
    },
  ],
};
