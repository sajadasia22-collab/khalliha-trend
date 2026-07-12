"use client";

import { useState } from "react";
import { useToast } from "../ui/Toast";
import { InfoIcon, ClipboardIcon, CircleCheckIcon } from "../ui/icons";

export function CampaignGuide() {
  const { showToast } = useToast();
  const [targetViews, setTargetViews] = useState("50000");
  const [cpm, setCpm] = useState("8000"); // 8,000 IQD default

  // Calculate expected cost
  const viewsNum = parseInt(targetViews.replace(/[^0-9]/g, "")) || 0;
  const cpmNum = parseInt(cpm.replace(/[^0-9]/g, "")) || 0;
  const expectedCost = Math.round((viewsNum * cpmNum) / 1000);

  const templates = [
    {
      title: "قالب ترويج منتج (تيك توك)",
      text: `1. استعراض ميزات وشكل المنتج بوضوح في أول 5 ثوانٍ من الفيديو.
2. تقديم مراجعة صادقة وطبيعية تتناسب مع محتوى حسابك اليومي.
3. ذكر اسم العلامة التجارية بشكل مسموع واستخدام هاشتاقات الحملة الرسمية.
4. عدم حذف الفيديو أو إخفائه لمدة لا تقل عن 30 يوماً من النشر.`,
    },
    {
      title: "قالب تغطية موقع ومطعم (انستغرام)",
      text: `1. تصوير جودة الطعام، الديكورات، وجودة الخدمة بدقة عالية (Reels).
2. الإشارة إلى الحساب الرسمي للمطعم (Tag) وتضمين الموقع الجغرافي.
3. توفير كود الخصم الممنوح للمتابعين في وصف الفيديو.
4. الالتزام بالنشر خلال أوقات الذروة (بين الساعة 6:00 مساءً إلى 9:00 مساءً).`,
    },
  ];

  const copyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("تم نسخ القالب إلى الحافظة! يمكنك لصقه في حقل الشروط.", "success");
  };

  return (
    <div className="space-y-6">
      {/* Smart Budget Calculator */}
      <div className="card border border-[rgba(214,246,29,0.15)] bg-gradient-to-b from-[rgba(18,56,40,0.5)] to-[rgba(6,38,25,0.8)] p-5 rounded-[var(--radius-xl)] shadow-[var(--shadow-brand)]">
        <h3 className="text-sm font-black text-[var(--color-text)] flex items-center gap-2 mb-4 border-b border-[rgba(200,214,206,0.1)] pb-3">
          <span>📊</span>
          <span>حاسبة الميزانية والـ CPM الذكية</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label
              className="block text-[10px] font-bold text-[var(--color-text-secondary)] mb-1"
              htmlFor="calc-views"
            >
              المشاهدات المستهدفة بالفيديو الواحد
            </label>
            <input
              id="calc-views"
              type="text"
              className="w-full rounded-[var(--radius-md)] border border-[rgba(214,246,29,0.2)] bg-[rgba(6,38,25,0.4)] px-3 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none"
              value={targetViews}
              onChange={(e) => setTargetViews(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>

          <div>
            <label
              className="block text-[10px] font-bold text-[var(--color-text-secondary)] mb-1"
              htmlFor="calc-cpm"
            >
              سعر الـ CPM المقترح (د.ع لكل 1000 مشاهدة)
            </label>
            <input
              id="calc-cpm"
              type="text"
              className="w-full rounded-[var(--radius-md)] border border-[rgba(214,246,29,0.2)] bg-[rgba(6,38,25,0.4)] px-3 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none"
              value={cpm}
              onChange={(e) => setCpm(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>

          <div className="bg-[rgba(250,252,251,0.03)] p-3 rounded-[var(--radius-md)] border border-[rgba(200,214,206,0.08)]">
            <span className="block text-[9px] text-[var(--color-text-muted)] font-black uppercase">
              المكافأة التقديرية للفيديو الواحد
            </span>
            <strong className="block text-base text-[var(--color-brand)] mt-1">
              {expectedCost.toLocaleString()} د.ع
            </strong>
            <span className="block text-[8px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              * المكافأة = (المشاهدات × CPM ÷ 1000). تذكر تحديد سقف المكافأة (Cap) في
              الجدول لتفادي تخطي ميزانيتك.
            </span>
          </div>
        </div>
      </div>

      {/* Trust Score Guidelines */}
      <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-5 rounded-[var(--radius-xl)] shadow-sm">
        <h3 className="text-sm font-black text-[var(--color-text)] flex items-center gap-2 mb-4 border-b border-[rgba(200,214,206,0.1)] pb-3">
          <span>🛡️</span>
          <span>تحديد مستوى الموثوقية (Trust Score)</span>
        </h3>

        <div className="space-y-3.5 text-xs">
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed font-medium">
            مستوى الموثوقية يحدد أي من صناع المحتوى يمكنهم الانضمام لحملتك تلقائياً:
          </p>

          <ul className="space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 font-bold font-mono">
                80+
              </span>
              <div className="flex-1">
                <strong className="block text-[var(--color-text)] text-[11px]">
                  مستوى ذهبي 🏆
                </strong>
                <p className="text-[9px] text-[var(--color-text-secondary)] mt-0.5">
                  أعلى جودة وموثوقية، نسبة استبعاد روابطهم صفر ومضمونون بالكامل.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400 font-bold font-mono">
                60+
              </span>
              <div className="flex-1">
                <strong className="block text-[var(--color-text)] text-[11px]">
                  مستوى محترف ⚡
                </strong>
                <p className="text-[9px] text-[var(--color-text-secondary)] mt-0.5">
                  صناع محتوى نشطون يمتلكون سجلات تسليم روابط ممتازة وفيديوهات ناجحة.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-400/10 text-gray-400 font-bold font-mono">
                50+
              </span>
              <div className="flex-1">
                <strong className="block text-[var(--color-text)] text-[11px]">
                  مستوى مبتدئ 🌱 (الافتراضي)
                </strong>
                <p className="text-[9px] text-[var(--color-text-secondary)] mt-0.5">
                  يسمح لجميع الموثقين الجدد بالانضمام؛ خيار رائع للانتشار العام.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Copy-paste Templates */}
      <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-5 rounded-[var(--radius-xl)] shadow-sm">
        <h3 className="text-sm font-black text-[var(--color-text)] flex items-center gap-2 mb-4 border-b border-[rgba(200,214,206,0.1)] pb-3">
          <span>📋</span>
          <span>قوالب شروط جاهزة للنسخ</span>
        </h3>

        <div className="space-y-4">
          {templates.map((tpl, i) => (
            <div
              key={i}
              className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] relative group"
            >
              <h4 className="text-xs font-black text-[var(--color-text)] mb-2 flex justify-between items-center">
                <span>{tpl.title}</span>
                <button
                  type="button"
                  onClick={() => copyTemplate(tpl.text)}
                  className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-brand-active)] hover:bg-[rgba(214,246,29,0.08)] transition-all"
                  title="نسخ الشروط"
                >
                  <ClipboardIcon size={14} />
                </button>
              </h4>
              <p className="text-[9px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line font-medium">
                {tpl.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
