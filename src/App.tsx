import React, { useState, useCallback } from 'react';
import { QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Section1_AcidBase } from '@/sections/Section1_AcidBase';
import { Section2_HypoNa } from '@/sections/Section2_HypoNa';
import { Section3_HyperNa } from '@/sections/Section3_HyperNa';
import { Section4_HypoK } from '@/sections/Section4_HypoK';
import { Section5_HyperK } from '@/sections/Section5_HyperK';
import { Section6_HypoCa } from '@/sections/Section6_HypoCa';
import { Section7_HyperCa } from '@/sections/Section7_HyperCa';
import { Section8_Mg } from '@/sections/Section8_Mg';
import { Section9_P } from '@/sections/Section9_P';
import { Section10_AKI } from '@/sections/Section10_AKI';
import { Section11_Author } from '@/sections/Section11_Author';

const DM_URL = 'https://iwatatsu2.github.io/dm-compass/';
const ENDO_URL = 'https://endoguide.vercel.app/endocrine';
const EC_URL = 'https://iwatatsu2.github.io/electrolyte-compass/';

function qrSrc(url: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=ffffff&bgcolor=120d06&data=${encodeURIComponent(url)}`;
}

function QRShareDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary border border-border rounded-lg px-4 py-2 transition-colors whitespace-nowrap">
          <QrCode className="w-5 h-5" />
          <span>共有</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">アプリを共有する</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { url: DM_URL,   label: 'DM Compass',          sub: '糖尿病病棟OS',   color: 'text-green-400' },
            { url: ENDO_URL, label: 'Endo Compass',         sub: '内分泌負荷試験', color: 'text-blue-400' },
            { url: EC_URL,   label: 'Electrolyte Compass',  sub: '電解質異常鑑別', color: 'text-amber-400' },
          ].map((app) => (
            <div key={app.url} className="flex flex-col items-center gap-2">
              <img src={qrSrc(app.url)} alt={app.label} className="w-full aspect-square rounded-xl" />
              <div className="text-center">
                <p className={`text-xs font-bold ${app.color}`}>{app.label}</p>
                <p className="text-xs text-muted-foreground">{app.sub}</p>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 text-xs text-blue-400 underline hover:text-blue-300"
                >
                  開く
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center pt-1">QRコードをスキャンしてアクセス</p>
      </DialogContent>
    </Dialog>
  );
}

interface SectionDef {
  id: number;
  label: string;
  subtitle: string;
  component: React.ReactNode;
}

const sections: SectionDef[] = [
  { id: 1,  label: '酸塩基',        subtitle: 'AG・デルタ比・Winter式・UAG',   component: <Section1_AcidBase /> },
  { id: 2,  label: 'Na異常（低Na）', subtitle: '浸透圧・自由水・鑑別フロー',    component: <Section2_HypoNa /> },
  { id: 3,  label: 'Na異常（高Na）', subtitle: '補正Na・自由水欠乏・尿崩症',    component: <Section3_HyperNa /> },
  { id: 4,  label: 'K異常（低K）',   subtitle: 'TTKG・FEK・腎性vs腎外性',      component: <Section4_HypoK /> },
  { id: 5,  label: 'K異常（高K）',   subtitle: 'TTKG・緊急対応・治療',          component: <Section5_HyperK /> },
  { id: 6,  label: 'Ca異常（低Ca）', subtitle: '補正Ca・PTH・副甲状腺',         component: <Section6_HypoCa /> },
  { id: 7,  label: 'Ca異常（高Ca）', subtitle: 'FECa・PTH・PHPT vs 悪性腫瘍',  component: <Section7_HyperCa /> },
  { id: 8,  label: 'Mg異常',        subtitle: 'FEMg・低K低Ca合併',             component: <Section8_Mg /> },
  { id: 9,  label: 'P異常',         subtitle: 'FEP・RFS・CKD-MBD',            component: <Section9_P /> },
  { id: 10, label: 'AKI鑑別',       subtitle: 'FENa・腎前性vs腎性vs腎後性',    component: <Section10_AKI /> },
  { id: 11, label: '制作者',        subtitle: 'Dr.いわたつ',                   component: <Section11_Author /> },
];

export default function App() {
  const [activeSection, setActiveSection] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentSection = sections.find((s) => s.id === activeSection);

  const handleSectionSelect = useCallback((id: number) => {
    setActiveSection(id);
    setSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={{ maxWidth: '100vw', overflow: 'hidden' }}>
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded hover:bg-border/50 transition-colors"
            aria-label="メニュー"
          >
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-foreground"></div>
              <div className="w-5 h-0.5 bg-foreground"></div>
              <div className="w-5 h-0.5 bg-foreground"></div>
            </div>
          </button>
          <div>
            <h1 className="text-lg font-bold text-primary tracking-tight">Electrolyte Compass</h1>
            <p className="text-xs text-muted-foreground leading-none">電解質異常 鑑別・計算ツール</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {currentSection?.label}
          </div>
          <QRShareDialog />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* モバイルオーバーレイ */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* サイドバー */}
        <aside
          className={[
            'fixed lg:static top-0 left-0 h-full lg:h-auto z-50 lg:z-auto',
            'w-64 lg:w-56 xl:w-64',
            'bg-sidebar border-r border-border',
            'flex flex-col',
            'transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
        >
          {/* モバイルヘッダー */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">セクション一覧</span>
            <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>

          {/* セクションリスト */}
          <nav className="flex-1 overflow-y-auto py-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section.id)}
                className={[
                  'w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors hover:bg-border/50',
                  activeSection === section.id ? 'bg-primary/20 border-r-2 border-primary' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex-shrink-0 w-6 h-6 rounded text-xs font-bold flex items-center justify-center mt-0.5',
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {section.id}
                </span>
                <div className="min-w-0">
                  <p
                    className={[
                      'text-xs font-semibold leading-tight',
                      activeSection === section.id ? 'text-primary' : 'text-foreground',
                    ].join(' ')}
                  >
                    {section.label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                    {section.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </nav>

          {/* 免責事項 */}
          <div className="p-3 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              本アプリは教育目的であり、最終的な治療判断は主治医の責任で行ってください。最新添付文書をご確認ください。
            </p>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 max-w-2xl mx-auto">
            {/* セクションタイトル */}
            {currentSection && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-7 h-7 rounded bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {currentSection.id}
                  </span>
                  <h2 className="text-lg font-bold text-foreground">{currentSection.label}</h2>
                </div>
                <p className="text-sm text-muted-foreground ml-9">{currentSection.subtitle}</p>
              </div>
            )}

            {/* セクションコンテンツ */}
            {currentSection?.component}
          </div>
        </main>
      </div>
    </div>
  );
}
