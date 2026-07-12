---
name: خلّيها ترند
description: منصة عراقية لإدارة حملات تسويق المؤثرين بين العلامات التجارية وصناع المحتوى
colors:
  trend-lime: "#D6F61D"
  trend-lime-hover: "#C2DF15"
  trend-lime-active: "#9FB80E"
  trend-lime-tint: "#F5FFC2"
  forest-dark: "#062619"
  forest-raised: "#123828"
  forest-secondary-text: "#244C36"
  forest-muted-text: "#70937D"
  forest-border-strong: "#9FB7A9"
  mist-surface: "#FAFCFB"
  mist-surface-muted: "#F4F8F5"
  mist-bg: "#E7EDE9"
  mist-border: "#D2DDD6"
typography:
  display:
    fontFamily: "IBM Plex Sans Arabic, Tajawal, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.125rem, 5vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.1
  headline:
    fontFamily: "IBM Plex Sans Arabic, Tajawal, Inter, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "IBM Plex Sans Arabic, Tajawal, Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "IBM Plex Sans Arabic, Tajawal, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Sans Arabic, Tajawal, Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.trend-lime}"
    textColor: "{colors.forest-dark}"
    rounded: "{rounded.md}"
    padding: "0 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.trend-lime-hover}"
    textColor: "{colors.forest-dark}"
  button-primary-active:
    backgroundColor: "{colors.trend-lime-active}"
    textColor: "{colors.forest-dark}"
  button-secondary:
    backgroundColor: "{colors.forest-dark}"
    textColor: "{colors.mist-surface}"
    rounded: "{rounded.md}"
    padding: "0 22px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.forest-raised}"
    textColor: "{colors.mist-surface}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.forest-dark}"
    rounded: "{rounded.md}"
    padding: "0 22px"
    height: "48px"
  card:
    backgroundColor: "{colors.mist-surface}"
    textColor: "{colors.forest-dark}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.mist-surface}"
    textColor: "{colors.forest-dark}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 16px"
---

# Design System: خلّيها ترند

## 1. Overview

**Creative North Star: "إشارة الترند" (The Trend Signal)**

المنصة أداة عمل يومية لثلاثة أدوار مختلفة (صانع محتوى، علامة تجارية، مشرف) تدير عبرها أموالاً حقيقية ومشاهدات وحملات، وليست موقعاً تسويقياً يُستهلك مرة واحدة. الشخصية البصرية شبابية وحاسمة ونظيفة: لون واحد جريء (Trend Lime) يُستخدم بندرة كإشارة — لتأكيد إجراء، تمييز حالة نشطة، أو جذب الانتباه للحظة واحدة — فوق أرضية هادئة من درجات Forest وMist. النظام يرفض صراحة قالب SaaS المولّد بالذكاء الاصطناعي (بطاقات متطابقة، gradient نصوص، حدود جانبية ملونة)، ويرفض الواجهات الساكنة بلا أي حركة، ويرفض أي مكوّن ينكسر أو يفيض أفقياً على الهاتف. الحركة، حين تُضاف، تتبع فلسفة Linear/Stripe: سريعة (150-400ms)، هادفة، بلا ارتداد (bounce) أو مبالغة، تشرح للمستخدم ماذا تغيّر بالضبط.

**Key Characteristics:**
- لون واحد فقط يحمل معنى "الفعل" (Trend Lime)، والباقي محايد بدرجات Forest/Mist.
- كثافة معلومات تتصاعد مع خبرة الدور: عام بسيط → Creator/Brand متوسط → Admin كثيف.
- Mobile-first حرفياً: كل قائمة منسدلة وجدول ومودال يُصمم أولاً لعرض 375px.
- حركة وظيفية دائماً، زخرفية أبداً.

## 2. Colors

نظام ثلاثي صارم: لون فعل واحد (Trend Lime) ولون هيكلي داكن واحد (Forest Dark) وأرضية محايدة واحدة (Mist)، وكل الباقي تدرجات مشتقة من هذه الثلاثة فقط. لا ألوان خارجية، لا أبيض صافٍ، لا أسود صافٍ.

### Primary
- **Trend Lime** (`#D6F61D`): لون الفعل الوحيد في النظام كله. أزرار CTA الأساسية، الحالة النشطة، badges التمييز، مؤشر التركيز (focus ring). يظهر على 10% فقط من أي شاشة — ندرته هي ما يمنحه قوته.
- **Trend Lime Hover** (`#C2DF15`) و **Trend Lime Active** (`#9FB80E`): درجتان أغمق للتفاعل، تستخدمان حصراً كحالات hover/active للون الأساسي، لا كألوان مستقلة.

### Neutral
- **Forest Dark** (`#062619`): النص الرئيسي فوق الأرضية الفاتحة، وأرضية الأقسام الداكنة (Header عند التمرير، Hero، Footer). فوق Trend Lime يكون النص دائماً بهذا اللون.
- **Forest Secondary** (`#244C36`) و **Forest Muted** (`#70937D`): نص ثانوي وتلميحات/placeholders على التوالي.
- **Forest Raised** (`#123828`): سطح مرتفع فوق خلفية داكنة (بطاقة داخل قسم Hero داكن).
- **Mist Surface** (`#FAFCFB`) و **Mist Surface Muted** (`#F4F8F5`): بديل الأبيض الصافي للبطاقات والحقول؛ الثاني لحالات hover خفيفة أو أقسام فرعية داخل بطاقة.
- **Mist Background** (`#E7EDE9`): أرضية الصفحة الافتراضية.
- **Mist Border** (`#D2DDD6`) و **Forest Border Strong** (`#9FB7A9`): حدود عادية وحدود مؤكدة (مثل حقل بحالة خطأ أو تبويب نشط).

### Named Rules
**The One Signal Rule.** Trend Lime لا يُستخدم إلا لعنصر واحد يحتاج انتباه المستخدم فوراً في أي شاشة: زر الفعل الأساسي، أو حالة "نشط"، أو رقم مالي حرج. لا صفحة كاملة ليمونية، ولا أكثر من عنصرين ليمونيين متجاورين.
**No Pure Black/White Rule.** كل "أبيض" في الواجهة هو `#FAFCFB` أو `#F4F8F5`، وكل "أسود" هو أحد درجات Forest (`#062619` فما فوق غمقاً). لا `#000` ولا `#fff` مباشرة في أي مكوّن.

## 3. Typography

**Display Font:** IBM Plex Sans Arabic (مع Tajawal كبديل عربي، وInter للأرقام/النص الإنكليزي)
**Body Font:** نفس التكديس — لا خط ثانٍ منفصل للنص.

**Character:** خط عربي واضح ومحايد بلا زخرفة، يمنح كثافة قراءة عالية للوحات التحكم دون أن يفقد حضوراً بصرياً في العناوين الكبيرة. الأوزان هي أداة التمايز الأساسية (400/500 للنص، 700/800 للعناوين)، لا تنويع العائلات.

### Hierarchy
- **Display** (800, `clamp(2.125rem, 5vw, 4rem)`, line-height 1.1): عنوان Hero الرئيسي فقط. من 34px على الموبايل إلى 64px على الديسكتوب.
- **Headline** (700, 1.875rem/30px, line-height 1.2): عناوين الأقسام الرئيسية داخل الصفحة (مثل "أهلاً بك في لوحة تحكم...").
- **Title** (700، 1.25rem/20px، line-height 1.3): عناوين البطاقات والمكوّنات الفرعية.
- **Body** (500، 1rem/16px، line-height 1.6): نص المحتوى العادي. يُحدّ سطر النص بعرض مريح للقراءة (لا يمتد كامل عرض الشاشة على الديسكتوب).
- **Label** (700، 0.75rem/12px، letter-spacing 0.01em): تسميات الحقول، badges، نصوص مساعدة صغيرة.

### Named Rules
**The Weight-Not-Family Rule.** التمايز الهرمي يأتي من الوزن (500 → 700 → 800) لا من تبديل عائلة الخط. عائلة واحدة فقط عبر كامل الواجهة.

## 4. Elevation

النظام مسطّح غالباً (flat by default) مع ظلال ناعمة جداً تُستخدم فقط للفصل الوظيفي (بطاقة عن أرضية، قائمة منسدلة عن الصفحة)، لا للزخرفة أو الإيحاء بعمق درامي. لا ظلال ثقيلة، لا glassmorphism افتراضي.

### Shadow Vocabulary
- **Ambient Small** (`0 2px 8px rgba(6, 38, 25, 0.06)`): البطاقات في حالة الراحة (rest state).
- **Ambient Medium** (`0 8px 24px rgba(6, 38, 25, 0.10)`): القوائم المنسدلة، البطاقات عند hover، العناصر الطافية فوق المحتوى.
- **Ambient Large** (`0 20px 50px rgba(6, 38, 25, 0.14)`): المودالات والعناصر ذات الأولوية العليا فقط (نادر الاستخدام).
- **Brand Glow** (`0 12px 30px rgba(214, 246, 29, 0.25)`): حصراً لحالة hover/focus على زر Primary، لتعزيز أنه العنصر الليموني المهم.

### Named Rules
**The Purposeful Shadow Rule.** الظل يظهر فقط عند الحاجة لفصل طبقة عن أخرى (بطاقة، قائمة منسدلة، مودال). العناصر الساكنة داخل نفس المستوى البصري لا تحمل ظلالاً منفصلة.

## 5. Components

### Buttons
- **Shape:** نصف قطر 12px (`--radius-md`)، ارتفاع ثابت 48px لكل الأزرار.
- **Primary:** خلفية Trend Lime، نص Forest Dark، وزن 700. Hover يرفع الزر 1px مع Brand Glow، Active يعيده لمكانه بخلفية أغمق (`trend-600`). Focus-visible: حلقة `0 0 0 4px rgba(214,246,29,.3)`. الانتقال على `background/transform/box-shadow` بمدة 150ms مع `cubic-bezier(.2,.8,.2,1)`.
- **Secondary:** خلفية Forest Dark، نص Mist Surface، hover إلى `forest-600`.
- **Ghost:** شفاف، حدود `1px solid forest-200`، نص Forest Dark، hover خلفية `trend-100` خفيفة جداً.
- **ممنوع:** gradient داخل أي زر، ألوان خارج المنظومة، زر CTA فاتح فوق خلفية فاتحة.

### Cards / Containers
- **Corner Style:** 16px (`--radius-lg`)، البطاقات الكبيرة/الأقسام المميزة 24px (`--radius-xl`).
- **Background:** Mist Surface فاتحة، أو Forest Raised للبطاقات داخل قسم داكن.
- **Shadow Strategy:** Ambient Small بالراحة، Ambient Medium عند hover إن كانت البطاقة تفاعلية (قابلة للنقر).
- **Border:** `1px solid mist-border` دائماً حول البطاقة الفاتحة.
- **بطاقة مميزة:** badge أو خط علوي ليموني صغير، لا تعبئة ليمونية كاملة إلا لرقم/تنبيه حرج جداً.

### Inputs / Fields
- **Style:** خلفية Mist Surface، حدود `1px solid mist-border`، نصف قطر 12px، ارتفاع أدنى 48px.
- **Focus:** الحدود تتحول إلى Trend Lime مع هالة `0 0 0 4px rgba(214,246,29,.18)`.
- **Placeholder:** لون `forest-muted` (`#70937D`).
- **Error/Disabled:** حدود بدرجة من Forest للخطأ الوظيفي (وليس أحمر خارجي)، تعتيم واضح للتعطيل.

### Navigation / Header
- **Style:** خلفية `rgba(250,252,251,.88)` مع `backdrop-filter: blur(16px)` وحد سفلي `1px solid rgba(210,221,214,.8)`. الرابط النشط: نص Forest عريض مع مؤشر ليموني صغير.
- **Mobile:** قائمة موبايل قابلة للطي (hamburger)، تنفتح كـ overlay/sheet كامل العرض لا قائمة صغيرة منزلقة تفيض عن الشاشة.

### Dropdowns / Filter Panels (Signature Component)
هذا المكوّن هو النقطة الأضعف حالياً في التطبيق ويحتاج معالجة صريحة: قائمة الفلاتر بصفحة استكشاف الحملات، وقائمة الإشعارات، وأي قائمة منسدلة أخرى.
- **الشكل:** بطاقة بنصف قطر 16px، خلفية Mist Surface، ظل Ambient Medium، حدود `1px solid mist-border`.
- **الموضع:** ترتكز على العنصر المُشغّل (trigger) عبر `insetInlineStart`/`insetInlineEnd` المنطقي المتوافق مع RTL — ليس `left`/`right` الفيزيائي مباشرة، لتفادي الفيض عن حافة الشاشة.
- **على الموبايل (< 640px):** تتحول تلقائياً من قائمة مرتكزة صغيرة إلى لوحة (sheet) ثابتة بعرض شبه كامل الشاشة (`inset-x` بهامش صغير)، لا قائمة 320px تفيض عن حواف عرض 375px.
- **الحركة:** ظهور بمدة 200-250ms (كما توثّق الهوية للقوائم)، فيد + انزلاق بسيط (translateY 4-8px)، لا ظهور/اختفاء فوري بلا انتقال.
- **الفلاتر تحديداً:** كل خيار فلتر تفاعلي (checkbox/chip/radio) يحتاج حالة "محدد" واضحة بخلفية `trend-100` أو حدود `trend-400`، وليس مجرد تغيير لون نص خافت.

## 6. Do's and Don'ts

### Do:
- **Do** استخدم المتغيرات الدلالية (`--color-brand`, `--color-surface`...) لا قيم HEX مباشرة داخل المكوّنات.
- **Do** طبّق انتقالاً (transition) على كل عنصر تفاعلي: فتح/إغلاق قائمة 200-250ms، hover الأزرار 150ms، ظهور الأقسام 300-400ms، بمنحنى `cubic-bezier(.2,.8,.2,1)`.
- **Do** صمّم كل قائمة منسدلة ومودال وجدول أولاً لعرض 375px (mobile-first)، ثم وسّعه لسطح المكتب.
- **Do** استخدم موضعاً منطقياً متوافقاً مع RTL (`inset-inline-start/end`) بدل `left`/`right` الفيزيائي عند تموضع عناصر عائمة.
- **Do** احترم `prefers-reduced-motion: reduce` بتعطيل أو تقليل كل حركة غير جوهرية.
- **Do** أضف حالات hover وfocus-visible وdisabled وloading صريحة لكل عنصر تفاعلي.

### Don't:
- **Don't** تستخدم `border-left`/`border-right` كخط تمييز ملوّن على البطاقات أو التنبيهات — استخدم خلفية مصبوغة خفيفة أو badge أو خط علوي بدلاً منها.
- **Don't** تستخدم gradient على النص (`background-clip: text`) لأي غرض، ولا داخل الأزرار الأساسية.
- **Don't** تترك قائمة منسدلة أو مودال يظهر/يختفي فجأة بلا أي transition أو fade.
- **Don't** تجعل الصفحة كاملة أو أغلبها ليمونية؛ Trend Lime نسبته القصوى 10% من أي شاشة.
- **Don't** تستخدم أبيضاً صافياً `#fff` أو أسوداً صافياً `#000` في أي مكوّن.
- **Don't** تسمح لأي عنصر عائم (قائمة، تولتيب، مودال) بالفيض أفقياً خارج حدود شاشة 375px.
- **Don't** تكرر شكل بطاقات متطابقة (أيقونة + عنوان + نص) كقالب SaaS عام متكرر بلا تمايز وظيفي.
