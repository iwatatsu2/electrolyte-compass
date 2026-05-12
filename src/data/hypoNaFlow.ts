import type { WorkupFlowDef } from '../components/WorkupFlow';

/** input ステップ用：Record として安全にアクセス */
function asRecord(v: Record<string, string> | string): Record<string, string> {
  return typeof v === 'string' ? {} : v;
}

/**
 * 低Na血症 鑑別フロー（虎ノ門方式）
 *
 * 順番:
 * 1. 血漿浸透圧低下 < 280？ → No: 高張性 or 偽性
 * 2. 脱水症状あり？ → Yes: 尿中Na で腎性/腎外性を鑑別
 * 3. 腎機能低下あり？ → Yes: 腎不全
 * 4. 細胞外液量過剰あり？ → Yes: 肝硬変・心不全・ネフローゼ
 * 5. 甲状腺・副腎機能正常？ → No: 甲状腺機能低下症・副腎不全・下垂体機能低下症
 * 6. SIADH / MRHE / 心因性多飲 / サイアザイド etc.
 */
export const hypoNaFlow: WorkupFlowDef = {
  title: '低Na血症 鑑別フロー（虎ノ門方式）',
  requiredTests: [
    { key: 'na',    label: 'Na',    unit: 'mEq/L',   category: 'blood' },
    { key: 'k',     label: 'K',     unit: 'mEq/L',   category: 'blood' },
    { key: 'cl',    label: 'Cl',    unit: 'mEq/L',   category: 'blood' },
    { key: 'bun',   label: 'BUN',   unit: 'mg/dL',   category: 'blood' },
    { key: 'cr',    label: 'Cr',    unit: 'mg/dL',   category: 'blood' },
    { key: 'gluc',  label: '血糖',  unit: 'mg/dL',   category: 'blood' },
    { key: 'sOsm',  label: '血漿浸透圧', unit: 'mOsm/kg', category: 'blood' },
    { key: 'tsh',   label: 'TSH',   unit: 'μIU/mL',  category: 'blood' },
    { key: 'cortisol', label: 'コルチゾール', unit: 'μg/dL', category: 'blood' },
    { key: 'uNa',   label: '尿Na',  unit: 'mEq/L',   category: 'urine' },
    { key: 'uOsm',  label: '尿浸透圧', unit: 'mOsm/kg', category: 'urine' },
    { key: 'dehydration', label: '脱水徴候（ツルゴール・粘膜乾燥・起立性低血圧）', unit: '', category: 'clinical' },
    { key: 'edema',  label: '浮腫・頸静脈怒張・腹水', unit: '', category: 'clinical' },
  ],
  startId: 'step1',
  steps: [
    // ─────────────────────────────────────────
    // Step 1: 血漿浸透圧の評価
    // ─────────────────────────────────────────
    {
      id: 'step1',
      title: 'Step 1: 血漿浸透圧は低下しているか？',
      description: 'Na・血糖・BUN から計算します。実測値がある場合は優先されます。血漿浸透圧 < 280 mOsm/kg で低張性。',
      type: 'input',
      inputs: [
        { key: 'na',   label: 'Na',   unit: 'mEq/L' },
        { key: 'gluc', label: '血糖', unit: 'mg/dL' },
        { key: 'bun',  label: 'BUN',  unit: 'mg/dL' },
        {
          key: 'sOsm',
          label: '血漿浸透圧（実測）',
          unit: 'mOsm/kg',
          optional: true,
          note: '実測値を入力するとフローに優先使用されます',
        },
      ],
      calc: (v) => {
        const na   = parseFloat(v.na);
        const gluc = parseFloat(v.gluc);
        const bun  = parseFloat(v.bun);
        const measured = parseFloat(v.sOsm);
        const results = [];

        if (!isNaN(na) && !isNaN(gluc) && !isNaN(bun)) {
          const calc = 2 * na + gluc / 18 + bun / 2.8;
          results.push({
            label: '計算浸透圧',
            value: `${calc.toFixed(0)} mOsm/kg`,
            interpretation: '2×Na + 血糖/18 + BUN/2.8',
            color: 'green' as const,
          });
        }

        const osm = !isNaN(measured) ? measured
          : (!isNaN(na) && !isNaN(gluc) && !isNaN(bun) ? 2 * na + gluc / 18 + bun / 2.8 : NaN);

        if (!isNaN(measured)) {
          results.push({
            label: '実測浸透圧（優先使用）',
            value: `${measured} mOsm/kg`,
            interpretation: '↑ フローの判定にはこの値を使用',
            color: 'yellow' as const,
          });
        }

        if (!isNaN(osm)) {
          if (osm < 280) {
            results.push({ label: '判定', value: '低張性（< 280）', interpretation: '→ 真の低Na血症：次のステップへ', color: 'red' as const });
          } else {
            results.push({ label: '判定', value: '浸透圧低下なし（≥ 280）', interpretation: '→ 高張性 or 偽性低Na', color: 'yellow' as const });
          }
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
        return osm < 280 ? 'step2' : 'result_not_hypotonic';
      },
      ruledOut: (v) => {
        const r = asRecord(v);
        const na   = parseFloat(r.na);
        const gluc = parseFloat(r.gluc);
        const bun  = parseFloat(r.bun);
        const measured = parseFloat(r.sOsm);
        const osm = !isNaN(measured) ? measured : 2 * na + gluc / 18 + bun / 2.8;
        if (isNaN(osm)) return [];
        if (osm >= 280) {
          return ['SIADH', 'MRHE', '腎性Na喪失', '腎外性Na喪失', '心不全', '肝硬変', 'ネフローゼ', '腎不全', '甲状腺機能低下症', '副腎不全', '心因性多飲'];
        }
        return ['高張性低Na（高血糖・マンニトール・グリセオール）', '偽性低Na（高TG血症）'];
      },
    },

    // 浸透圧低下なし → 高張性 or 偽性
    {
      id: 'result_not_hypotonic',
      title: '診断: 浸透圧低下なし',
      type: 'result',
      diagnosis: '高張性低Na or 偽性低Na',
      detail: '血漿浸透圧 ≥ 280 mOsm/kg\n\n【高張性低Na】高血糖・マンニトール・グリセオール投与\n→ 補正Na = 実測Na + (血糖 − 100) / 100 × 1.6\n\n【偽性低Na】高中性脂肪血症\n→ 直接電極法で再測定',
      treatment: '原疾患の治療。高血糖ならインスリン投与でNaは改善。偽性低Naは治療不要。',
      resultColor: 'yellow',
    },

    // ─────────────────────────────────────────
    // Step 2: 脱水症状の有無
    // ─────────────────────────────────────────
    {
      id: 'step2',
      title: 'Step 2: 脱水症状はあるか？',
      description: '身体所見で脱水徴候を評価してください',
      type: 'select',
      options: [
        {
          label: '脱水あり',
          value: 'yes',
          description: '皮膚ツルゴール低下・粘膜乾燥・頸静脈虚脱・起立性低血圧・BUN/Cr比上昇',
        },
        {
          label: '脱水なし',
          value: 'no',
          description: '明らかな脱水徴候を認めない',
        },
      ],
      onSelect: (v) => v === 'yes' ? 'step2a' : 'step3',
      ruledOut: (v) => {
        const sel = typeof v === 'string' ? v : '';
        if (sel === 'yes') {
          return ['SIADH', 'MRHE', '心不全', '肝硬変', 'ネフローゼ', '腎不全', '甲状腺機能低下症', '副腎不全', '心因性多飲'];
        }
        if (sel === 'no') {
          return ['腎外性Na喪失（嘔吐・下痢・火傷）', '腎性Na喪失（利尿薬・腎性Na喪失症候群）'];
        }
        return [];
      },
    },

    // Step 2a: 脱水あり → 尿中Na で腎性/腎外性を鑑別
    {
      id: 'step2a',
      title: 'Step 2a: 尿中Na測定',
      description: '尿中Na濃度で腎性・腎外性Na喪失を鑑別します',
      type: 'input',
      inputs: [
        { key: 'uNa', label: '尿Na', unit: 'mEq/L' },
      ],
      calc: (v) => {
        const uNa = parseFloat(v.uNa);
        if (isNaN(uNa)) return [];
        if (uNa < 20) {
          return [{ label: '尿Na', value: `${uNa} mEq/L`, interpretation: '< 20：腎外性Na喪失（腎はNaを保持）', color: 'yellow' as const }];
        }
        return [{ label: '尿Na', value: `${uNa} mEq/L`, interpretation: '≥ 20：腎性Na喪失（腎がNaを保持できていない）', color: 'red' as const }];
      },
      next: (v) => {
        const uNa = parseFloat(v.uNa);
        if (isNaN(uNa)) return 'step2a';
        return uNa < 20 ? 'result_extrarenal' : 'result_renal_loss';
      },
      ruledOut: (v) => {
        const r = asRecord(v);
        const uNa = parseFloat(r.uNa);
        if (isNaN(uNa)) return [];
        if (uNa < 20) return ['腎性Na喪失'];
        return ['腎外性Na喪失'];
      },
    },

    {
      id: 'result_extrarenal',
      title: '診断: 腎外性Na喪失',
      type: 'result',
      diagnosis: '腎外性Na喪失',
      detail: '尿中Na < 20 mEq/L\n\n原因：嘔吐・下痢・火傷・第3腔喪失（膵炎・腸閉塞）\n腎臓はNaを保持しようとしているため尿Naは低値。',
      treatment: '生理食塩水で循環血漿量を補正。\n補正速度に注意：慢性例は < 10 mEq/L/day、ハイリスク例（アルコール・低K・低栄養・肝疾患）は < 8 mEq/L/day（ODS予防）。',
      resultColor: 'yellow',
    },
    {
      id: 'result_renal_loss',
      title: '診断: 腎性Na喪失',
      type: 'result',
      diagnosis: '腎性Na喪失',
      detail: '尿中Na ≥ 20 mEq/L\n\n原因：利尿薬（特にサイアザイド系）・浸透圧利尿・腎性Na喪失症候群・副腎不全（ミネラルコルチコイド欠乏）',
      treatment: '原疾患の治療。副腎不全が疑われれば必ずコルチゾール測定→補充（ヒドロコルチゾン）。循環血漿量補正には生食を使用。',
      resultColor: 'red',
    },

    // ─────────────────────────────────────────
    // Step 3: 腎機能低下の有無
    // ─────────────────────────────────────────
    {
      id: 'step3',
      title: 'Step 3: 腎機能低下はあるか？',
      description: 'Cr上昇・eGFR低下など腎機能障害を評価',
      type: 'select',
      options: [
        {
          label: '腎機能低下あり',
          value: 'yes',
          description: 'Cr上昇・eGFR低下・乏尿',
        },
        {
          label: '腎機能低下なし',
          value: 'no',
          description: '腎機能は正常範囲',
        },
      ],
      onSelect: (v) => v === 'yes' ? 'result_renal_failure' : 'step4',
      ruledOut: (v) => {
        const sel = typeof v === 'string' ? v : '';
        if (sel === 'yes') return ['SIADH', 'MRHE', '心不全', '肝硬変', 'ネフローゼ', '甲状腺機能低下症', '副腎不全', '心因性多飲'];
        if (sel === 'no') return ['腎不全'];
        return [];
      },
    },

    {
      id: 'result_renal_failure',
      title: '診断: 腎不全',
      type: 'result',
      diagnosis: '腎不全による低Na血症',
      detail: 'GFRが著しく低下すると自由水排泄能が障害され、希釈性低Naをきたす。',
      treatment: '水制限。透析適応の検討（重症腎不全・保存的治療困難例）。',
      resultColor: 'red',
    },

    // ─────────────────────────────────────────
    // Step 4: 細胞外液量過剰の有無
    // ─────────────────────────────────────────
    {
      id: 'step4',
      title: 'Step 4: 細胞外液量の過剰はあるか？',
      description: '浮腫・腹水・頸静脈怒張を評価',
      type: 'select',
      options: [
        {
          label: '細胞外液量過剰あり',
          value: 'yes',
          description: '浮腫・腹水・頸静脈怒張・肝腫大',
        },
        {
          label: '細胞外液量過剰なし',
          value: 'no',
          description: '浮腫なし・体液量正常',
        },
      ],
      onSelect: (v) => v === 'yes' ? 'result_edematous' : 'step5',
      ruledOut: (v) => {
        const sel = typeof v === 'string' ? v : '';
        if (sel === 'yes') return ['SIADH', 'MRHE', '甲状腺機能低下症', '副腎不全', '心因性多飲'];
        if (sel === 'no') return ['心不全', '肝硬変', 'ネフローゼ'];
        return [];
      },
    },

    {
      id: 'result_edematous',
      title: '診断: 浮腫性疾患による低Na',
      type: 'result',
      diagnosis: '肝硬変・心不全・ネフローゼ症候群',
      detail: '有効循環血漿量低下によるADH二次分泌亢進が機序。\n総体液量は増加しているが有効循環血漿量は低下している。',
      treatment: '原疾患治療。水制限・利尿薬（ループ利尿薬）。急速補正は危険（ODS）。',
      resultColor: 'red',
    },

    // ─────────────────────────────────────────
    // Step 5: 甲状腺・副腎機能
    // ─────────────────────────────────────────
    {
      id: 'step5',
      title: 'Step 5: 甲状腺・副腎機能は正常か？',
      description: 'TSH・コルチゾール（ACTH）を確認',
      type: 'select',
      options: [
        {
          label: '異常あり',
          value: 'abnormal',
          description: 'TSH高値（甲状腺機能低下）・コルチゾール低値（副腎不全）・ACTH異常（下垂体機能低下）',
        },
        {
          label: '正常',
          value: 'normal',
          description: 'TSH・コルチゾールともに正常範囲',
        },
      ],
      onSelect: (v) => v === 'abnormal' ? 'result_endocrine' : 'result_siadh_etc',
      ruledOut: (v) => {
        const sel = typeof v === 'string' ? v : '';
        if (sel === 'abnormal') return ['SIADH', 'MRHE', '心因性多飲'];
        if (sel === 'normal') return ['甲状腺機能低下症', '副腎皮質機能低下症', '下垂体機能低下症'];
        return [];
      },
    },

    {
      id: 'result_endocrine',
      title: '診断: 内分泌疾患による低Na',
      type: 'result',
      diagnosis: '甲状腺機能低下症・副腎皮質機能低下症・下垂体機能低下症',
      detail: '【甲状腺機能低下症】TSH高値 → 心拍出量低下・GFR低下による水排泄障害\n【副腎皮質機能低下症】コルチゾール低下 → CRH↑によるADH分泌亢進＋ミネラルコルチコイド欠乏\n【下垂体機能低下症】ACTH・TSH複合欠損',
      treatment: '甲状腺機能低下症：レボチロキシン補充\n副腎不全：ヒドロコルチゾン補充（ストレス量考慮）\n下垂体機能低下症：欠損ホルモンの補充',
      resultColor: 'red',
    },

    // ─────────────────────────────────────────
    // Step 6: 残りの鑑別
    // ─────────────────────────────────────────
    {
      id: 'result_siadh_etc',
      title: '診断: 等容量性低Na（内分泌正常）',
      type: 'result',
      diagnosis: 'SIADH / MRHE / 心因性多飲 / サイアザイド系利尿薬 など',
      detail: '低張性低Na＋脱水なし＋腎機能正常＋ECF過剰なし＋甲状腺/副腎正常 の場合：\n\n【SIADH】尿浸透圧 > 100 mOsm/kg ＋ 尿Na > 40 mEq/L が診断基準\n【MRHE】mineralocorticoid responsive hyponatremia of the elderly\n【心因性多飲】尿浸透圧 < 100（希釈尿）が特徴\n【マラソン中の多飲】運動時の低張水過剰摂取\n【ビール多飲】低溶質食（beer potomania）\n【サイアザイド系利尿薬】腎髄質浸透圧勾配維持＋Na喪失',
      treatment: '【SIADH】水制限（500〜1000 mL/day）・食塩補充・重症例はトルバプタン\nけいれん時：3%食塩水（1〜2 mEq/L/hr × 数時間）\n補正速度：< 10 mEq/L/day（ハイリスク例は < 8）でODS予防\n\n【心因性多飲】水分摂取制限・精神科的介入\n【サイアザイド】薬剤中止',
      resultColor: 'red',
    },
  ],
};
