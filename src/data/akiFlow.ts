import type { WorkupFlowDef } from '../components/WorkupFlow';

export const akiFlow: WorkupFlowDef = {
  title: 'AKI鑑別フロー（腎前性・腎性・腎後性）',
  requiredTests: [
    { key: 'cr', label: 'Cr（現在）', unit: 'mg/dL', category: 'blood' },
    { key: 'cr_base', label: 'Cr（ベースライン）', unit: 'mg/dL', category: 'blood' },
    { key: 'bun', label: 'BUN', unit: 'mg/dL', category: 'blood' },
    { key: 'na', label: 'Na', unit: 'mEq/L', category: 'blood' },
    { key: 'uNa', label: '尿Na', unit: 'mEq/L', category: 'urine' },
    { key: 'uCr', label: '尿Cr', unit: 'mg/dL', category: 'urine' },
    { key: 'uOsm', label: '尿浸透圧', unit: 'mOsm/kg', category: 'urine' },
    { key: 'uBun', label: '尿BUN', unit: 'mg/dL', category: 'urine' },
    { key: 'ua', label: '尿定性（タンパク・血尿・円柱）', unit: '', category: 'urine' },
    { key: 'echo', label: '腎エコー（水腎症・腎サイズ）', unit: '', category: 'clinical' },
    { key: 'uv', label: '尿量', unit: 'mL/hr', category: 'clinical' },
  ],
  startId: 'step1',
  steps: [
    {
      id: 'step1',
      title: 'Step 1: AKI確認 + 重症度・BUN/Cr比',
      description: 'CrとBUNを入力してAKI重症度・腎前性の初期スクリーニングを行います',
      type: 'input',
      inputs: [
        { key: 'cr', label: 'Cr（現在）', unit: 'mg/dL' },
        { key: 'cr_base', label: 'Cr（ベースライン）', unit: 'mg/dL' },
        { key: 'bun', label: 'BUN', unit: 'mg/dL' },
      ],
      calc: (v) => {
        const cr = parseFloat(v.cr);
        const crBase = parseFloat(v.cr_base);
        const bun = parseFloat(v.bun);
        const results = [];
        if (!isNaN(cr) && !isNaN(crBase)) {
          const rise = cr - crBase;
          const ratio = cr / crBase;
          let stage = '';
          let color: 'red' | 'yellow' | 'green' = 'green';
          if (ratio >= 3.0 || cr >= 4.0) { stage = 'Stage 3（重症）透析適応を検討'; color = 'red'; }
          else if (ratio >= 2.0) { stage = 'Stage 2（中等症）'; color = 'yellow'; }
          else if (ratio >= 1.5 || rise >= 0.3) { stage = 'Stage 1（軽症）'; color = 'yellow'; }
          else { stage = 'AKI基準未満'; color = 'green'; }
          results.push({ label: 'AKI Stage', value: stage, interpretation: `Cr上昇: ${rise.toFixed(2)} mg/dL (×${ratio.toFixed(1)})`, color });
        }
        if (!isNaN(bun) && !isNaN(cr)) {
          const bunCrRatio = bun / cr;
          results.push({
            label: 'BUN/Cr比',
            value: bunCrRatio.toFixed(0),
            interpretation: bunCrRatio > 20 ? '> 20: 腎前性AKIを示唆（尿素再吸収↑）' : '≤ 20: 腎性AKI・腎後性AKIの可能性',
            color: (bunCrRatio > 20 ? 'yellow' : 'red') as 'yellow' | 'red',
          });
        }
        return results;
      },
      next: (v) => {
        const cr = parseFloat(v.cr);
        const bun = parseFloat(v.bun);
        if (isNaN(cr) || isNaN(bun)) return 'step1';
        return 'step2_echo';
      },
    },

    // 腎後性除外（エコー）
    {
      id: 'step2_echo',
      title: 'Step 2: 腎後性AKIの除外（エコー）',
      description: '腎エコーで水腎症・尿管・膀胱の閉塞を確認します',
      type: 'select',
      options: [
        { label: '水腎症あり・膀胱残尿増加', value: 'obstruction', description: '閉塞性尿路疾患（前立腺肥大・尿路結石・骨盤内腫瘍・後腹膜線維症）' },
        { label: 'エコー異常なし', value: 'no_obstruction', description: '腎後性を除外し、腎前性 or 腎性へ' },
        { label: 'エコー未施行', value: 'unknown', description: 'まず尿道カテーテルで残尿確認を推奨' },
      ],
      onSelect: (v) => {
        if (v === 'obstruction') return 'result_postrenal';
        return 'step3_fena';
      },
    },

    // FENa計算
    {
      id: 'step3_fena',
      title: 'Step 3: FENa（Na排泄分画）計算',
      description: 'FENaで腎前性 vs 腎性を鑑別します。利尿薬使用時はFEUrea（尿素排泄分画）も参考に',
      type: 'input',
      inputs: [
        { key: 'uNa', label: '尿Na', unit: 'mEq/L' },
        { key: 'sNa', label: '血清Na', unit: 'mEq/L' },
        { key: 'uCr', label: '尿Cr', unit: 'mg/dL' },
        { key: 'sCr', label: '血清Cr', unit: 'mg/dL' },
        { key: 'uBun', label: '尿BUN（任意）', unit: 'mg/dL' },
        { key: 'sBun', label: '血清BUN（任意）', unit: 'mg/dL' },
        { key: 'uOsm', label: '尿浸透圧', unit: 'mOsm/kg' },
      ],
      calc: (v) => {
        const uNa = parseFloat(v.uNa);
        const sNa = parseFloat(v.sNa);
        const uCr = parseFloat(v.uCr);
        const sCr = parseFloat(v.sCr);
        const uBun = parseFloat(v.uBun);
        const sBun = parseFloat(v.sBun);
        const uOsm = parseFloat(v.uOsm);
        const results = [];

        if (!isNaN(uNa) && !isNaN(sNa) && !isNaN(uCr) && !isNaN(sCr)) {
          const fena = (uNa * sCr) / (sNa * uCr) * 100;
          results.push({
            label: 'FENa',
            value: `${fena.toFixed(2)}%`,
            interpretation: fena < 1 ? '< 1%: 腎前性AKI（尿細管機能正常・Na保持）' : '> 2%: 腎性AKI（尿細管障害→Na保持できない）',
            color: (fena < 1 ? 'yellow' : 'red') as 'yellow' | 'red',
          });
        }
        if (!isNaN(uBun) && !isNaN(sBun) && !isNaN(uCr) && !isNaN(sCr)) {
          const feUrea = (uBun * sCr) / (sBun * uCr) * 100;
          results.push({
            label: 'FEUrea（利尿薬使用時に有用）',
            value: `${feUrea.toFixed(1)}%`,
            interpretation: feUrea < 35 ? '< 35%: 腎前性を示唆（利尿薬使用下でも有効）' : '≥ 35%: 腎性AKIを示唆',
            color: (feUrea < 35 ? 'yellow' : 'red') as 'yellow' | 'red',
          });
        }
        if (!isNaN(uOsm)) {
          results.push({
            label: '尿浸透圧',
            value: `${uOsm} mOsm/kg`,
            interpretation: uOsm > 500 ? '> 500: 腎前性（尿濃縮能正常）' : uOsm < 350 ? '< 350: 腎性ATN（尿濃縮障害）' : '中間',
            color: (uOsm > 500 ? 'yellow' : uOsm < 350 ? 'red' : 'green') as 'yellow' | 'red' | 'green',
          });
        }
        return results;
      },
      next: (v) => {
        const uNa = parseFloat(v.uNa);
        const sNa = parseFloat(v.sNa);
        const uCr = parseFloat(v.uCr);
        const sCr = parseFloat(v.sCr);
        if (isNaN(uNa) || isNaN(sNa) || isNaN(uCr) || isNaN(sCr)) return 'step3_fena';
        const fena = (uNa * sCr) / (sNa * uCr) * 100;
        return fena < 1 ? 'step4_prerenal' : 'step4_intrinsic';
      },
    },

    // 腎前性 → 原因選択
    {
      id: 'step4_prerenal',
      title: 'Step 4a: 腎前性AKIの原因',
      description: '腎前性AKI（FENa < 1%）の原因を選択します',
      type: 'select',
      options: [
        { label: '循環血液量減少（脱水・出血）', value: 'hypovolemia', description: '嘔吐・下痢・出血・熱傷・サードスペース移行' },
        { label: '心拍出量低下（心不全・心タンポナーデ）', value: 'cardiorenal', description: '有効循環血漿量低下による腎血流低下（心腎症候群）' },
        { label: '肝腎症候群（重症肝硬変・肝不全）', value: 'hrs', description: '重症肝障害→内臓血管拡張→腎血管収縮。FENa < 1%が特徴' },
        { label: 'NSAID・ACE阻害薬・ARB・造影剤', value: 'drug_prerenal', description: '腎内血行動態への影響（輸入 or 輸出細動脈拡張/収縮）' },
        { label: '腎動脈狭窄（RAS）', value: 'ras', description: '両側腎動脈狭窄＋ACE阻害薬/ARBで急性増悪することが多い' },
      ],
      onSelect: (v) => {
        if (v === 'hypovolemia') return 'result_hypovolemia';
        if (v === 'cardiorenal') return 'result_cardiorenal';
        if (v === 'hrs') return 'result_hrs';
        if (v === 'drug_prerenal') return 'result_drug_prerenal';
        return 'result_ras';
      },
    },

    // 腎性 → 尿所見で分類
    {
      id: 'step4_intrinsic',
      title: 'Step 4b: 腎性AKIの尿所見による分類',
      description: '尿定性・尿沈渣で腎性AKIの部位を絞ります',
      type: 'select',
      options: [
        { label: '泥状円柱・顆粒円柱・尿細管上皮細胞', value: 'atn', description: '尿細管障害（ATN）が最多。低血圧・敗血症・造影剤・アミノグリコシドが原因' },
        { label: '赤血球円柱・変形赤血球・タンパク尿（> 1+）', value: 'gn', description: '糸球体腎炎（GN）。RPGN（急速進行性）では緊急腎生検が必要' },
        { label: '白血球円柱・好酸球尿・軽度タンパク尿', value: 'tin', description: '間質性腎炎（AIN）。抗菌薬・NSAIDs・PPI・アロプリノールが原因' },
        { label: '尿所見正常（タンパク尿なし・円柱なし）', value: 'vascular', description: '血管性（TTP・HUS・塞栓症・腎静脈血栓・強皮症腎クリーゼ）' },
      ],
      onSelect: (v) => {
        if (v === 'atn') return 'result_atn';
        if (v === 'gn') return 'result_gn';
        if (v === 'tin') return 'result_tin';
        return 'result_vascular';
      },
    },

    // Results
    {
      id: 'result_postrenal',
      type: 'result',
      title: '診断: 腎後性AKI（閉塞性）',
      diagnosis: '腎後性AKI（閉塞性尿路疾患）',
      detail: '前立腺肥大（最多・男性）・尿路結石・骨盤内腫瘍（子宮頸癌・直腸癌）・後腹膜線維症・凝血塊・尿道狭窄。両側閉塞または単腎での閉塞でAKIになる。解除後に利尿（post-obstructive diuresis）に注意。',
      treatment: '尿道カテーテル（膀胱頸部閉塞）。腎瘻（上部尿路閉塞）。D-J stent。前立腺肥大：α遮断薬→手術（TURP）。原因腫瘍の治療。解除後の多尿管理（0.45%食塩水補充）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_hypovolemia',
      type: 'result',
      title: '診断: 循環血液量減少による腎前性AKI',
      diagnosis: '循環血液量減少による腎前性AKI',
      detail: '脱水（嘔吐・下痢・発熱）・出血・熱傷・利尿薬過剰・サードスペース移行（膵炎・腸閉塞・腹膜炎）。皮膚ツルゴール低下・起立性低血圧・頸静脈虚脱が所見。補液に速やかに反応するのが特徴。',
      treatment: '生理食塩水またはラクテート加リンガー液で積極的補液。出血は輸血。尿量 > 0.5 mL/kg/hr を目標。利尿薬の中止。原因の治療。',
      resultColor: 'yellow',
    },
    {
      id: 'result_cardiorenal',
      type: 'result',
      title: '診断: 心腎症候群（心拍出量低下）',
      diagnosis: '心腎症候群（心不全・心タンポナーデ）',
      detail: '心拍出量低下→腎灌流圧低下→RAAS・SNS活性化→腎血管収縮。FENa < 1%でも腎性との鑑別に注意（浮腫・心拡大・BNP上昇）。利尿薬投与でさらに腎機能悪化することも。',
      treatment: '心不全の治療（強心薬・利尿薬の調整）。タンポナーデは心嚢穿刺。カテーテル的補助（IABP・Impella）。腎灌流圧を維持（MAP > 65 mmHg）。',
      resultColor: 'red',
    },
    {
      id: 'result_hrs',
      type: 'result',
      title: '診断: 肝腎症候群（HRS）',
      diagnosis: '肝腎症候群（HRS）',
      detail: '重症肝硬変・肝不全での機能的腎不全。内臓血管拡張→有効循環血漿量低下→腎血管収縮。FENa < 0.1%。尿所見は正常。感染（SBP）・消化管出血・過剰利尿が誘因。\nHRS-AKI（旧1型）：急性・急速。HRS-CKD（旧2型）：慢性・緩徐。',
      treatment: 'HRS-AKI：テルリプレシン＋アルブミン（標準治療）。ノルエピネフリン＋アルブミン（代替）。輸液試験でも改善なし。肝移植が根本治療。アルブミン補充（SBP予防）。',
      resultColor: 'red',
    },
    {
      id: 'result_drug_prerenal',
      type: 'result',
      title: '診断: 薬剤性腎前性AKI',
      diagnosis: '薬剤性腎前性AKI（NSAID・ACE阻害薬・ARB・造影剤）',
      detail: 'NSAID：PG産生低下→輸入細動脈収縮→GFR低下。ACE-I/ARB：輸出細動脈拡張→GFR低下（両側RAS・CKD・脱水で顕著）。造影剤：腎血管収縮＋直接尿細管毒性。',
      treatment: '原因薬剤の中止。補液（造影剤腎症予防：生食0.9%、腎機能悪化前後）。NSAIDはアセトアミノフェンへ変更。RAS薬は脱水・CKD時は一時中止（sick day rules）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_ras',
      type: 'result',
      title: '診断: 腎動脈狭窄（RAS）',
      diagnosis: '腎動脈狭窄（両側またはsolitary kidney）',
      detail: '両側腎動脈狭窄患者へのACE阻害薬/ARB投与が最多の誘因。治療抵抗性高血圧・閃光性肺水腫・若年女性の高血圧（線維筋性異形成）でも疑う。腎エコーでサイズ差（> 1.5 cm）が参考になる。',
      treatment: 'ACE-I/ARBの中止。腎血管形成術（PTRA）・stent留置。外科的腎動脈再建。血圧管理にはCa拮抗薬を使用。',
      resultColor: 'red',
    },
    {
      id: 'result_atn',
      type: 'result',
      title: '診断: 急性尿細管壊死（ATN）',
      diagnosis: '急性尿細管壊死（ATN）',
      detail: '虚血性ATN：長時間低血圧・敗血症性ショック・大手術後。中毒性ATN：造影剤・アミノグリコシド・シスプラチン・NSAID・横紋筋融解（ミオグロビン）・溶血（ヘモグロビン）。\n顆粒円柱・泥状円柱・尿細管上皮細胞が特徴的所見。',
      treatment: '原因除去。補液（循環維持）。尿量確保（利尿薬は尿量確保のみ、腎保護効果なし）。腎毒性薬剤の回避。透析適応：乏尿持続・高K・アシドーシス・溢水・尿毒症症状。多尿期には補液管理。',
      resultColor: 'red',
    },
    {
      id: 'result_gn',
      type: 'result',
      title: '診断: 糸球体腎炎（GN）',
      diagnosis: '糸球体腎炎（急速進行性GN・RPGN）',
      detail: 'RPGN（1型：抗GBM・Goodpasture、2型：免疫複合体・IgA腎症・ループス腎炎、3型：ANCA血管炎・MPA・GPA・EGPA）。赤血球円柱・変形赤血球・ネフローゼ範囲のタンパク尿。\nANCAnc（MPO・PR3）・抗GBM抗体・ANA・補体（C3/C4）・血清学的検査が必須。緊急腎生検。',
      treatment: 'ステロイドパルス（メチルプレドニゾロン1g/日×3日）。シクロホスファミド（ANCA・抗GBM）。リツキシマブ（ANCA）。血漿交換（抗GBM・重症ANCA）。腎生検結果に基づく免疫抑制。',
      resultColor: 'red',
    },
    {
      id: 'result_tin',
      type: 'result',
      title: '診断: 急性間質性腎炎（AIN）',
      diagnosis: '急性間質性腎炎（AIN）',
      detail: '薬剤性（最多）：β-ラクタム系・NSAIDs・PPI・スルファメトキサゾール・アロプリノール。三徴（発疹・発熱・好酸球増多）は古典的だが揃うのは10〜30%のみ。尿の好酸球（Hansel染色）・白血球円柱。腎生検で確定。',
      treatment: '原因薬剤の中止（最重要・多くは改善）。重症例・改善遅延例：プレドニゾン 40〜60 mg/日（2〜4週）。サルコイドーシスはステロイド著効。',
      resultColor: 'yellow',
    },
    {
      id: 'result_vascular',
      type: 'result',
      title: '診断: 血管性腎障害',
      diagnosis: '血管性腎障害（TTP・HUS・塞栓症・強皮症腎クリーゼ）',
      detail: 'TTP（血栓性血小板減少性紫斑病）：ADAMTS13欠乏・血栓性微小血管障害（TMA）。5徴：発熱・腎不全・溶血性貧血・血小板減少・神経症状。\nHUS：志賀毒素産生大腸菌O157（小児）・非典型HUS（補体異常）。\n強皮症腎クリーゼ：急激な高血圧＋AKI。\n腎動脈/静脈血栓症・コレステロール塞栓症（カテーテル後）。',
      treatment: 'TTP：血漿交換（緊急）＋カプラシズマブ。HUS：補液（志賀毒素型）・エクリズマブ（非典型HUS）。強皮症腎クリーゼ：ACE阻害薬（禁忌ではない）＋厳格血圧管理。腎静脈血栓：抗凝固療法。',
      resultColor: 'red',
    },
  ],
};
