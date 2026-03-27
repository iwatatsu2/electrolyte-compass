import React from 'react';

export function Section11_Author() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col items-center mb-4">
          <img
            src={`${import.meta.env.BASE_URL}dr-iwatatsu.png`}
            alt="Dr.いわたつ イラスト"
            style={{ width: 'clamp(160px, 40vw, 220px)', height: 'auto' }}
          />
          <h2 className="text-lg font-bold text-foreground mt-2">Dr.いわたつ</h2>
          <p className="text-sm text-primary">糖尿病・内分泌専門医</p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>内分泌・代謝内科専門医として日々の臨床で感じた「使えるリファレンスが欲しい」という思いからこのアプリを作成しました。</p>
          <p>電解質異常は研修医から専門医まで、日常診療で頻繁に遭遇します。計算式と鑑別フローをいつでもすぐ参照できるよう設計しました。</p>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <a
            href="https://www.instagram.com/dr.iwatatsu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <span>📸</span>
            <span>Instagram: @dr.iwatatsu</span>
          </a>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-bold text-foreground mb-2">関連アプリ</h3>
        <a
          href="https://iwatatsu2.github.io/dm-compass/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-border/50 transition-colors"
        >
          <div className="w-8 h-8 rounded bg-green-600 flex items-center justify-center text-white text-xs font-bold">DM</div>
          <div>
            <p className="text-sm font-semibold text-foreground">DM Compass</p>
            <p className="text-xs text-muted-foreground">糖尿病病棟管理 研修医向け</p>
          </div>
        </a>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-bold text-foreground mb-2">免責事項</h3>
        <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
          <p>本アプリは医療従事者の教育・参考目的のために作成されています。</p>
          <p>本アプリの情報は一般的な医学知識に基づくものであり、個々の患者の診断・治療の代替となるものではありません。</p>
          <p>最終的な診療判断は、担当医師が患者の状態・最新のガイドライン・添付文書を十分に考慮した上で行ってください。</p>
          <p>本アプリの使用によって生じた結果について、制作者は一切の責任を負いかねます。</p>
          <p className="text-primary mt-2">計算結果は参考値です。必ず最新の添付文書・ガイドラインをご確認ください。</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-bold text-foreground mb-2">バージョン情報</h3>
        <p className="text-xs text-muted-foreground">Electrolyte Compass v1.0.0</p>
        <p className="text-xs text-muted-foreground">React + TypeScript + Vite + Tailwind CSS</p>
      </div>
    </div>
  );
}
