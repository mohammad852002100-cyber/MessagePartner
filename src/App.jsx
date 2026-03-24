import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

import { useState, useEffect, useRef } from "react";

/* ═══ Supabase Database ═══ */
const SB_URL = "https://ldtgnvuadqtwaalbcasu.supabase.co";
const SB_KEY = "sb_publishable__vG7MUUuS7gk7xLQQoFVmQ_kPA-55P1";
const SB_H = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" };

async function sbGet(table, key) {
  try {
    var res = await fetch(SB_URL + "/rest/v1/" + table + "?key=eq." + encodeURIComponent(key) + "&select=value", { headers: SB_H });
    if (!res.ok) { console.error("sbGet failed:", res.status, await res.text()); return null; }
    var data = await res.json();
    return (data && data[0]) ? data[0].value : null;
  } catch (e) { console.error("sbGet error:", e); return null; }
}

async function sbSet(table, key, value) {
  try {
    var res = await fetch(SB_URL + "/rest/v1/" + table, {
      method: "POST",
      headers: Object.assign({}, SB_H, { "Prefer": "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify({ key: key, value: value })
    });
    if (!res.ok) { console.error("sbSet failed:", res.status, await res.text()); return false; }
    return true;
  } catch (e) { console.error("sbSet error:", e); return false; }
}

async function sbDel(table, key) {
  try {
    var res = await fetch(SB_URL + "/rest/v1/" + table + "?key=eq." + encodeURIComponent(key), {
      method: "DELETE", headers: SB_H
    });
    if (!res.ok) { console.error("sbDel failed:", res.status); }
    return true;
  } catch (e) { console.error("sbDel error:", e); return false; }
}

var gU = async function() { return (await sbGet("r_users", "all_users")) || {}; };
var sU = async function(u) { return sbSet("r_users", "all_users", u); };
var gA = async function(u) { return (await sbGet("r_answers", u)) || {}; };
var sA = async function(u, a) { return sbSet("r_answers", u, a); };

/* Saved accounts — device-local only */
var gSaved = async function() {
  try { var r = await window.storage.get("r_saved", false); return r ? JSON.parse(r.value) : []; }
  catch (e) { return []; }
};
var sSaved = async function(a) {
  try { await window.storage.set("r_saved", JSON.stringify(a), false); return true; }
  catch (e) { return false; }
};

/* ═══ Colors ═══ */
const C = {
  pri: "#0c1f3f", priL: "#1b3a6b", gold: "#b8860b", goldL: "#d4a017", goldBg: "#fef9ec",
  bg: "#f5f3ee", card: "#fff", tx: "#1a1a2e", txM: "#555770", txL: "#8b8fa3", bdr: "#e5e1d8",
  ok: "#16794a", okBg: "#edfaf3", err: "#c0392b", errBg: "#fdf0ef",
  ph: ["#1b3a6b", "#1a6b42", "#8b4513", "#4a148c", "#880e4f", "#6d4c00", "#0d5c5c", "#6a1b9a"],
};
const ST = { teen: "مراهق", young: "شاب", mid: "منتصف العمر", senior: "55+" };

const CSS_TEXT = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{font-family:'Tajawal',system-ui;background:${C.bg};color:${C.tx};direction:rtl;
  -webkit-overflow-scrolling:touch;overscroll-behavior-y:none;
  padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);
  padding-right:env(safe-area-inset-right);padding-left:env(safe-area-inset-left);
  position:relative;width:100%;overflow-x:hidden}
textarea,input,select,button{font-family:inherit;font-size:16px}
input[type=text],input[type=password],textarea,select{font-size:16px!important;
  border-radius:0!important;-webkit-appearance:none;appearance:none;border-radius:11px!important}
/* Hide scrollbar */
*{scrollbar-width:none;-ms-overflow-style:none}
*::-webkit-scrollbar{display:none}
/* Native touch feel */
button{-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}
html,body{overscroll-behavior:none;touch-action:manipulation}
img,svg{max-width:100%;height:auto}
/* No text select on UI — only on content */
h1,h2,h3,h4,label,nav,button,span[style]{-webkit-user-select:none;user-select:none}
p,textarea,input,div[style*="pre-line"]{-webkit-user-select:text;user-select:text}
/* Disable long-press context menu on UI */
nav,button{-webkit-touch-callout:none}
/* Press feedback on all tappable items */
button:active{transform:scale(0.96)!important;opacity:0.85!important}
div[style*="cursor: pointer"]:active{transform:scale(0.98)!important;opacity:0.9!important}
/* Smooth transitions */
*{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
/* Fix iOS */
@supports (-webkit-touch-callout:none){
  input,textarea,select{font-size:16px!important}
}
/* Animations */
@keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes si{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
@keyframes sd{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
@keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes pl{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes slideIn{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
@keyframes fadeScale{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
@keyframes splashPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.fu{animation:fu .35s ease both}
.si{animation:si .3s ease both}
.slideIn{animation:slideIn .3s ease both}
.fadeScale{animation:fadeScale .3s ease both}
.sg>*{animation:fu .35s ease both}
.sg>*:nth-child(1){animation-delay:0ms}.sg>*:nth-child(2){animation-delay:40ms}
.sg>*:nth-child(3){animation-delay:80ms}.sg>*:nth-child(4){animation-delay:120ms}
.sg>*:nth-child(5){animation-delay:160ms}.sg>*:nth-child(6){animation-delay:200ms}
.sg>*:nth-child(7){animation-delay:240ms}.sg>*:nth-child(8){animation-delay:280ms}
input[type=range]{accent-color:${C.gold};height:6px}
`;

/* ═══ Data ═══ */
const PHASES = [
  { id: 1, icon: "🌱", title: "الأساسيات", sub: "ما معنى أن تبحث عن رسالتك؟", color: C.ph[0] },
  { id: 2, icon: "⚖️", title: "القيم", sub: "ما الذي يهمك حقاً؟", color: C.ph[1] },
  { id: 3, icon: "💪", title: "نقاط القوة", sub: "ما الذي يمنحك الطاقة؟", color: C.ph[2] },
  { id: 4, icon: "📖", title: "قصة حياتك", sub: "ما القصة التي تبنيها؟", color: C.ph[3] },
  { id: 5, icon: "🎯", title: "الأهداف", sub: "هل أهدافك تنبع منك؟", color: C.ph[4] },
  { id: 6, icon: "🗺️", title: "تصميم المستقبل", sub: "كيف يمكن أن تبدو حياتك؟", color: C.ph[5] },
  { id: 7, icon: "🏛️", title: "الحكمة", sub: "فلسفة عملية تُنير طريقك", color: C.ph[6] },
  { id: 8, icon: "✨", title: "تجميع الصورة", sub: "رسالتك تتشكّل", color: C.ph[7] },
];

const LESSONS = [
  { p: 1, n: 1, title: "ما هي الرسالة؟", content: [
    { h: "تعريف الرسالة", p: "الرسالة (Purpose) هي الهدف الكبير الذي تشعر أنك موجود من أجله.\n\nعرّفها العلماء بأنها: هدف طويل الأمد، ذو معنى شخصي عميق، يتجاوز حدود ذاتك ليخدم الآخرين.\n\n🔑 رسالة بلا أثر على الناس = مجرد طموح\n🔑 رسالة بلا اتجاه = مجرد شعور جيد" },
    { h: "الفرق بين الرسالة والشغف", p: "الشغف = حماس قوي لا يشترط أثراً\nالموهبة = قدرة قد تُستثمر أو لا\nالرسالة = كل ذلك مع خدمة الآخرين" },
    { h: "المتعة مقابل الازدهار", p: "المتعة = سعادة عبر اللذة والراحة\nالازدهار = سعادة عميقة من المعنى والنمو\n\nالرسالة من النوع الثاني — أعمق وأبقى." },
  ]},
  { p: 1, n: 2, title: "العلم وراء الرسالة", content: [
    { h: "صحة أفضل وعمر أطول", p: "دراسة Cohen (2016) على 136,265 شخصاً:\n• تخفض الوفيات 17%\n• تخفض مشاكل القلب 17%" },
    { h: "صحة الدماغ", p: "أصحاب الرسالة لديهم نصف خطر الزهايمر.\nالرسالة تبني احتياطياً معرفياً يحمي الدماغ." },
    { h: "الصحة النفسية", p: "ارتباط قوي بين الرسالة وانخفاض الاكتئاب والقلق.\nالرسالة حاجة أساسية كالنوم والغذاء." },
  ]},
  { p: 1, n: 3, title: "أخطاء تُضلّك", content: [
    { h: "خداع الذات", p: "أحياناً تظن أنك تتبع قيمك بينما الخوف هو المحرّك.\nالاختبار: لو لا أحد يراك — هل ستستمر؟" },
    { h: "فخ يجب أن أكون", p: "صوت يقول: يجب أن أنجح مثل فلان.\nهذا ليس صوتك — الرسالة تنبع من داخلك." },
    { h: "وهم الوصول", p: "السعادة لا تأتي من الوصول بل من الرحلة.\nالرسالة أسلوب حياة وليست وجهة." },
  ]},
  { p: 2, n: 4, title: "ما هي القيم؟", content: [
    { h: "القيم ليست أهدافاً", p: "القيم = بوصلة دائمة\nالأهداف = وجهة تنتهي حين تتحقق\nالقيم ترشدك طوال حياتك." },
    { h: "نظرية شوارتز", p: "أُثبتت في 80+ دولة:\n🔵 تجاوز الذات: العدالة + العناية بالمقربين\n🔴 تعزيز الذات: المكانة + الإنجاز\n🟢 الانفتاح: الاستقلالية + المغامرة\n🟡 المحافظة: التقاليد + الأمان + الانضباط" },
  ]},
  { p: 2, n: 5, title: "القيم واليقظة", content: [
    { h: "حين تجتمعان", p: "القيم + اليقظة = الأثر يتضاعف 3 مرات!\nالقيم تمنحك الاتجاه واليقظة تمنحك الثبات." },
    { h: "التعامل مع الأفكار السلبية", p: "جرّب: «لديّ فكرة بأنني غير كافٍ» بدلاً من «أنا غير كافٍ»\nهذه المسافة تمنحك حرية التصرف وفق قيمك." },
  ]},
  { p: 2, n: 6, title: "أين أنت الآن؟", content: [
    { h: "مقياس العيش بالقيم", p: "المناطق ذات الأهمية العالية والاتساق المنخفض = أولويات عملك الآن." },
    { h: "هدف رمي السهام", p: "🎯 المركز = تعيش قيمك بالكامل\n⭕ الحافة = سلوكك بعيد عن قيمك\nالهدف: الوعي والحركة التدريجية." },
  ]},
  { p: 3, n: 7, title: "نقاط قوتك", content: [
    { h: "الاكتشاف العلمي", p: "تمرين «استخدم قوتك بطريقة جديدة» رفع السعادة 6 أشهر!\nالأهم: تحديد القوة دون تطبيق = بلا فائدة." },
    { h: "كيف تعرف أنها قوة حقيقية؟", p: "✓ تشعر أنها أنت\n✓ تشحن طاقتك\n✓ تُثير شوقاً لاستخدامها\n✓ تظهر تلقائياً" },
  ]},
  { p: 3, n: 8, title: "التدفق وPERMA", content: [
    { h: "ما هو التدفق؟", p: "حالة تنسى فيها الوقت.\nشروطه: أهداف واضحة + تغذية راجعة + تحدٍّ مناسب." },
    { h: "PERMA", p: "P مشاعر إيجابية · E اندماج · R علاقات · M معنى · A إنجازات\n\nالتدفق + المعنى = أقرب ما يكون لرسالتك." },
  ]},
  { p: 4, n: 9, title: "قصتك ورسالتك", content: [
    { h: "الهوية السردية", p: "هويتنا ليست سوى القصة التي نرويها.\nطريقة روايتك لقصتك تحدد كيف تعيشها." },
    { h: "القصة الفدائية", p: "أصحاب الرسالة القوية حوّلوا الصعوبات لدروس وهم حساسون لمعاناة الآخرين." },
  ]},
  { p: 4, n: 10, title: "الكتابة والنمو", content: [
    { h: "قوة الكتابة", p: "الكتابة عن التجارب الصعبة تحسّن الصحة!\nقاعدة: عِش المشاعر الصعبة أولاً ثم ابحث عن المعنى." },
    { h: "النمو بعد الصدمة", p: "89% من الناجين يُبلّغون عن نمو حقيقي!\n5 مجالات: إمكانيات جديدة، علاقات أعمق، قوة أكبر، نظرة جديدة، تقدير أعمق." },
  ]},
  { p: 5, n: 11, title: "أهداف تتوافق معك", content: [
    { h: "الأهداف المتوافقة", p: "فقط الأهداف المتوافقة مع قيمك تجلب السعادة.\nالاختبار: هل ستستمر لو لم يعلم أحد؟" },
    { h: "تقرير المصير", p: "3 حاجات: الاستقلالية + الكفاءة + الانتماء = طاقة ودافعية طبيعية." },
  ]},
  { p: 5, n: 12, title: "مساعيك الشخصية", content: [
    { h: "المساعي", p: "مساعي التجنب = رفاهية أقل.\nحوّلها: «أحاول ألا أفشل» ← «أحاول أن أتعلم»." },
  ]},
  { p: 6, n: 13, title: "التفكير التصميمي", content: [
    { h: "مبدأ ستانفورد", p: "لا تنتظر الوضوح لتبدأ — ابدأ لكي يأتيك الوضوح." },
    { h: "التجريب", p: "جرّب لـ30 يوماً. محادثات + تجارب صغيرة + مشاريع جانبية." },
  ]},
  { p: 6, n: 14, title: "أعِد تصميم عملك", content: [
    { h: "صياغة العمل", p: "3 طرق: صياغة المهام + صياغة العلاقات + صياغة الإدراك" },
    { h: "الاكتشاف المذهل", p: "موظفون بنفس العمل: ثلث يراه وظيفة، ثلث مسيرة، ثلث رسالة!\nالفرق في نظرتهم." },
  ]},
  { p: 7, n: 15, title: "اللوغوثيرابي", content: [
    { h: "3 طرق للمعنى", p: "1. ما تقدمه للعالم\n2. ما تستقبله من العالم\n3. موقفك من المعاناة" },
    { h: "التحول الكوبرنيكي", p: "❌ ما أتوقعه من الحياة؟\n✓ ما تتوقعه الحياة مني؟" },
  ]},
  { p: 7, n: 16, title: "الإيكيغاي", content: [
    { h: "الأصل الياباني", p: "المخطط الشهير ليس يابانياً! الإيكيغاي الحقيقي = أن تحبه." },
    { h: "إيكيغاي اليابانيين", p: "قهوة الصباح، موسيقى، صديق — كل ما يجعل الصباح يستحق الاستيقاظ." },
  ]},
  { p: 7, n: 17, title: "الحكمة الرواقية", content: [
    { h: "ثنائية التحكم", p: "✓ بيدك: أفكارك، ردود أفعالك\n✗ ليس بيدك: النتائج، ردود فعل الناس" },
    { h: "العقبة هي الطريق", p: "العقبة نفسها هي المادة الخام لرسالتك." },
  ]},
  { p: 8, n: 18, title: "كيف تعرف أنك وجدتها؟", content: [
    { h: "5 علامات", p: "1. تثابر رغم الصعوبات\n2. قيمك وأفعالك متوافقة\n3. تأثير يتجاوز مصلحتك\n4. قصة حياة متماسكة\n5. الصعوبات = وقود" },
    { h: "الرسالة تتطور", p: "رسالتك تتغير مع العمر — وهذا طبيعي وصحي." },
  ]},
];

const VD = [
  { n: "العدالة والمساواة", d: "الإيمان بأن كل إنسان يستحق فرصاً متساوية. السعي للتسامح والاهتمام بقضايا المجتمع والبيئة — حتى لو لم تعرف الناس شخصياً." },
  { n: "العناية بالمقربين", d: "الحرص على مساعدة من تعرفهم: عائلتك، أصدقاؤك، جيرانك. التواجد من أجلهم والإخلاص لهم." },
  { n: "الاستقلالية", d: "أن تفكر بنفسك وتتخذ قراراتك بحرية دون أن يفرض عليك أحد." },
  { n: "المغامرة والتجديد", d: "حب التجارب الجديدة والمخاطرة المحسوبة. الشعور بالحياة حين تخوض شيئاً مختلفاً." },
  { n: "الاستمتاع بالحياة", d: "تقدير لحظات السعادة البسيطة: طعام لذيذ، ضحكة، استرخاء." },
  { n: "النجاح والإنجاز", d: "السعي لتحقيق أهداف ملموسة. الرضا حين تُتمّ مهمة صعبة." },
  { n: "التأثير والقيادة", d: "الرغبة في صوت مسموع وقدرة على توجيه الأمور." },
  { n: "الأمان والاستقرار", d: "الحاجة لحياة مستقرة: أمان مالي، بيئة آمنة، علاقات ثابتة." },
  { n: "الانضباط والالتزام", d: "احترام القواعد والوفاء بالوعود. النظام أساس البناء." },
  { n: "التقاليد والموروث", d: "تقدير العادات الموروثة من ثقافتك ودينك وعائلتك." },
];

const EX = [
  { id: 1, p: 1, title: "التشخيص الأولي", sub: "أين أنت الآن؟", mins: 20, icon: "🔍", type: "diag" },
  { id: 2, p: 1, title: "مرحلتك العمرية", sub: "تحديات وفرص مرحلتك", mins: 15, icon: "🗓️", type: "mq", qs: ["ما أكبر التحديات في مرحلتك الحالية؟", "ما الأسئلة الكبرى التي تشغلك؟", "كيف يمكن لمرحلتك أن تكون ميزة؟", "ما الشخص الذي تريد أن تصبحه؟"] },
  { id: 3, p: 2, title: "تقييم القيم العشر", sub: "اكتشف ما يحركك مع شرح كل قيمة", mins: 25, icon: "⚖️", type: "vals", refl: ["ما قيمك الثلاث الأعلى ولماذا؟", "هل وجدت قيماً تتعارض؟", "كيف تظهر قيمك في قراراتك اليومية؟"] },
  { id: 4, p: 2, title: "هدف رمي السهام", sub: "ارسم قيمك وانظر كيف تعيشها", mins: 30, icon: "🎯", type: "mq", qs: ["العمل: كيف تريد أن تكون فيه؟", "الترفيه: كيف تستمتع؟", "العلاقات: أي علاقات تريد؟", "النمو: كيف تتطور؟", "العوائق وخطوة هذا الأسبوع؟"] },
  { id: 5, p: 2, title: "عيد ميلادك الثمانين", sub: "رحلة تأملية", mins: 20, icon: "🎂", type: "mq", qs: ["ماذا يقول عنك أقرب شخص؟", "ماذا يقول شخص من عملك؟", "ما الذي ظهر وماذا تعلمت؟", "ما القيم التي يكشفها؟"] },
  { id: 6, p: 2, title: "استبيان العيش بالقيم", sub: "قارن ما تعتقد بما تعيش", mins: 20, icon: "📊", type: "vlq", domains: ["العائلة", "الشراكة العاطفية", "الأبناء", "الصداقات", "العمل", "التعليم", "الترفيه", "الروحانية", "المجتمع", "الصحة"] },
  { id: 7, p: 3, title: "نقاط قوتك", sub: "حدّد أعلى 5", mins: 30, icon: "💎", type: "via", strengths: ["الفضول", "حب التعلم", "التفكير النقدي", "الإبداع", "الحكمة", "الشجاعة", "المثابرة", "الصدق", "الحيوية", "الحب", "اللطف", "الذكاء الاجتماعي", "روح الفريق", "الإنصاف", "القيادة", "الغفران", "التواضع", "الحكمة العملية", "ضبط النفس", "تقدير الجمال", "الامتنان", "التفاؤل", "الفكاهة", "الروحانية"] },
  { id: 8, p: 3, title: "يوميات التدفق", sub: "سجّل ما يشحن طاقتك", mins: 25, icon: "🌊", type: "flow" },
  { id: 9, p: 3, title: "تقييم PERMA", sub: "قِس ازدهارك", mins: 30, icon: "🌟", type: "mq", qs: ["P — 3 أشياء سارت جيداً ولماذا", "E — متى نسيت الوقت؟", "R — كيف علاقاتك وكيف تعمّقها؟", "M — ما يمنح حياتك معنى؟ اكتب رسالة أولية.", "A — أمنيتك ← نتيجة ← عائق ← خطة"] },
  { id: 10, p: 4, title: "مقابلة قصة الحياة", sub: "الموضوعات المتكررة", mins: 45, icon: "📚", type: "mq", qs: ["فصول حياتك (2-7)", "أسعد لحظة", "أصعب تجربة", "نقطة تحول", "أحلامك لـ10 سنوات", "فلسفتك في الحياة"] },
  { id: 11, p: 4, title: "القصة الفدائية", sub: "حوّل الصعوبة لقوة", mins: 40, icon: "🦋", type: "mq", qs: ["3-5 تجارب صعبة واختر واحدة", "اكتب ما حدث بصدق", "لماذا حدث وماذا تعلمت؟", "كيف تغيّرت وأي قوى تطوّرت؟", "القصة الكاملة"] },
  { id: 12, p: 4, title: "النمو بعد الصعوبات", sub: "كيف شكّلتك", mins: 30, icon: "🌱", type: "mq", qs: ["أبواب انفتحت لأن أخرى أُغلقت؟", "علاقات تعمّقت بعد التحديات؟", "3 جمل: نجوت لأنني...", "ما تقدّره أكثر الآن؟"] },
  { id: 13, p: 5, title: "الأهداف المتوافقة", sub: "أي أهدافك لك فعلاً", mins: 30, icon: "🧭", type: "mq", qs: ["اكتب 5-10 أهداف", "لكل هدف: خارجي أم داخلي؟", "أي أهداف تتخلى عنها وأيها أكثر توافقاً؟"] },
  { id: 14, p: 5, title: "مساعيك الشخصية", sub: "الأنماط العميقة", mins: 25, icon: "🔭", type: "mq", qs: ["أكمل «أحاول أن ___» 8-10 مرات", "مساعي التجنب وكيف تحوّلها؟", "أين الصراع بين مساعيك؟", "المساعي التي تعكس هويتك؟"] },
  { id: 15, p: 6, title: "خطط أوديسي", sub: "3 مسارات لحياتك", mins: 45, icon: "🗺️", type: "mq", qs: ["الحياة 1 — المسار الحالي بعد 5 سنوات", "الحياة 2 — لو أصبح الأول مستحيلاً", "الحياة 3 — لو لم يهم المال أو رأي الناس", "أي خطة تثيرك أكثر؟ المواضيع المشتركة؟"] },
  { id: 16, p: 6, title: "أعِد تصميم عملك", sub: "طبّق صياغة العمل", mins: 30, icon: "🔧", type: "mq", qs: ["مهامك الرئيسية", "ما تحبه وتشغف به؟", "كيف تعيد تصميم مهامك؟", "فعل محدد هذا الأسبوع"] },
  { id: 17, p: 7, title: "تمارين اللوغوثيرابي", sub: "مصادر المعنى", mins: 30, icon: "📜", type: "mq", qs: ["مساهماتك ومن يحتاجك؟", "تجارب تملأ حياتك معنى؟", "موقف يخدم كرامتك", "ما تطلبه الحياة منك؟"] },
  { id: 18, p: 7, title: "تأمل الإيكيغاي", sub: "ما يجعل حياتك تستحق", mins: 25, icon: "🌸", type: "mq", qs: ["ما أريد فعله؟ واجبي؟ أين يلتقيان؟", "5-10 أشياء تجعل صباحك يستحق", "مقارنة تتخلى عنها", "نشاط اليوم ستكون حاضراً فيه"] },
  { id: 19, p: 7, title: "التمارين الرواقية", sub: "حكمة الرواقيين", mins: 25, icon: "🏛️", type: "mq", qs: ["لو كان اليوم آخر أيامك ما الذي يهم؟", "حدث مرهق: ما بيدك وما ليس؟", "عقبة الأسبوع (وقائع فقط)", "كيف تخدم هذه العقبة رسالتك؟"] },
  { id: 20, p: 8, title: "أفضل ذات ممكنة", sub: "تخيّل أجمل صورة", mins: 20, icon: "⭐", type: "mq", qs: ["الجانب الشخصي", "الجانب العلاقاتي", "الجانب المهني", "ما فاجأك وما يكشفه عن رسالتك؟"] },
  { id: 21, p: 8, title: "التأمل النهائي", sub: "صُغ رسالتك", mins: 40, icon: "🌟", type: "mq", qs: ["أهم 3-5 قيم اكتشفتها", "أبرز 3 نقاط قوة", "الموضوع المتكرر في قصتك", "أي خطة أوديسي أثارتك؟", "ما تطلبه الحياة منك؟", "كيف تخدم الناس؟", "لو كان آخر أيامك ما يُقال عنك؟", "مسودة رسالتك (2-3 جمل):"] },
  { id: 22, p: 8, title: "صياغة رسالتك بالذكاء الاصطناعي", sub: "الذكاء الاصطناعي يقرأ كل إجاباتك ويصوغ رسالتك", mins: 5, icon: "🔮", type: "ai_mission" },
];

const QUOTES = [
  { q: "من يملك لماذا يعيش يستطيع تحمّل أي كيف", a: "فرانكل" },
  { q: "العقبة في طريقك هي نفسها الطريق", a: "ماركوس أوريليوس" },
  { q: "ليس المهم ما تتوقعه من الحياة بل ما تتوقعه الحياة منك", a: "فرانكل" },
  { q: "الشمعة التي تضيء للآخرين لا ينقص منها شيء", a: "حكمة قديمة" },
  { q: "اعرف نفسك — بداية كل حكمة", a: "أرسطو" },
];

/* ═══ Answer Label Mapper ═══ */
function ansLabel(key, ex) {
  const dC = ["إحساس واضح بالرسالة", "رسالة تعكس هويتي", "أعمل نحو شيء ذي معنى", "إحساس قوي بما أريد"];
  const dE = ["أبحث عن رسالة", "أبحث عن معنى", "أستكشف اتجاهات"];
  if (/^c\d$/.test(key)) return "الالتزام: " + (dC[+key[1]] || key);
  if (/^e\d$/.test(key)) return "الاستكشاف: " + (dE[+key[1]] || key);
  if (/^v\d+$/.test(key)) { const i = +key.slice(1); return "تقييم: " + (VD[i] ? VD[i].n : "قيمة " + (i + 1)); }
  if (/^r\d$/.test(key)) return "تأمل: " + (ex && ex.refl ? (ex.refl[+key[1]] || "سؤال") : "سؤال");
  if (/^s\d+$/.test(key)) { const i = +key.slice(1); return "نقطة قوة: " + (ex && ex.strengths ? (ex.strengths[i] || i) : i); }
  if (key === "via_app") return "خطة استخدام نقاط القوة";
  if (/^imp\d+$/.test(key)) { const i = +key.slice(3); const e6 = EX.find(function(e) { return e.id === 6; }); return "أهمية: " + (e6 && e6.domains ? (e6.domains[i] || i) : i); }
  if (/^con\d+$/.test(key)) { const i = +key.slice(3); const e6 = EX.find(function(e) { return e.id === 6; }); return "اتساق: " + (e6 && e6.domains ? (e6.domains[i] || i) : i); }
  if (key === "vlq_plan") return "خطة سد الفجوات";
  if (/^fa\d$/.test(key)) return "نشاط التدفق " + (+key[2] + 1);
  if (/^fe\d$/.test(key)) return "الاندماج — نشاط " + (+key[2] + 1);
  if (/^fne\d$/.test(key)) return "الطاقة بعد نشاط " + (+key.slice(3) + 1);
  if (/^ff\d$/.test(key)) return "تدفق — نشاط " + (+key[2] + 1);
  if (/^aeiou\d$/.test(key)) { var labels = ["ماذا كنت أفعل", "أين كنت", "مع من", "الأدوات", "الأنماط"]; return "AEIOU: " + (labels[+key.slice(5)] || key); }
  if (/^q\d+$/.test(key)) return (ex && ex.qs) ? (ex.qs[+key.slice(1)] || "السؤال " + (+key.slice(1) + 1)) : "السؤال " + (+key.slice(1) + 1);
  return key;
}

/* ═══ UI Components ═══ */
function Btn({ onClick, children, v, sz, dis, full, sx }) {
  const vs = {
    pri: { bg: C.pri, c: "#fff", b: "none" },
    gold: { bg: "linear-gradient(135deg," + C.gold + "," + C.goldL + ")", c: "#fff", b: "none" },
    out: { bg: "transparent", c: C.pri, b: "2px solid " + C.pri },
    ghost: { bg: "transparent", c: C.txM, b: "none" },
    err: { bg: C.err, c: "#fff", b: "none" },
    soft: { bg: C.pri + "08", c: C.pri, b: "1px solid " + C.pri + "15" },
  };
  const szs = { sm: { p: "7px 14px", f: 13 }, md: { p: "10px 20px", f: 14 }, lg: { p: "13px 28px", f: 15 } };
  const vv = vs[v || "pri"] || vs.pri;
  const ss = szs[sz || "md"] || szs.md;
  return (
    <button onClick={onClick} disabled={dis} style={{
      padding: ss.p, fontSize: ss.f, background: vv.bg, color: vv.c, border: vv.b,
      borderRadius: 10, cursor: dis ? "not-allowed" : "pointer", fontWeight: 700,
      opacity: dis ? 0.5 : 1, transition: "all .15s ease", width: full ? "100%" : "auto",
      WebkitTapHighlightColor: "transparent", transform: "scale(1)", ...(sx || {})
    }}>{children}</button>
  );
}

function Crd({ children, sx, cls, onClick }) {
  return (
    <div className={cls || ""} onClick={onClick} style={{
      background: C.card, borderRadius: 14, padding: 20,
      boxShadow: "0 2px 14px rgba(12,31,63,.05)", border: "1px solid " + C.bdr,
      cursor: onClick ? "pointer" : "default", ...(sx || {})
    }}>{children}</div>
  );
}

function PB({ v, color, h }) {
  return (
    <div style={{ background: (color || C.gold) + "15", borderRadius: 99, height: h || 7, overflow: "hidden" }}>
      <div style={{ width: Math.min(100, Math.max(0, v || 0)) + "%", height: "100%", background: (color || C.gold), borderRadius: 99, transition: "width .6s ease" }} />
    </div>
  );
}

function SL({ value, onChange, min, max, label }) {
  const mn = min || 1;
  const mx = max || 7;
  return (
    <div style={{ marginBottom: 5 }}>
      {label && <div style={{ fontSize: 12, color: C.txL, marginBottom: 2, fontWeight: 500 }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 11, color: C.txL, width: 14 }}>{mn}</span>
        <input type="range" min={mn} max={mx} value={value || mn} onChange={function(e) { onChange(+e.target.value); }} style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: C.txL, width: 14 }}>{mx}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.gold, background: C.gold + "10", borderRadius: 7, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>{value || mn}</span>
      </div>
    </div>
  );
}

function TA({ value, onChange, placeholder, rows }) {
  return (
    <textarea value={value || ""} onChange={function(e) { onChange(e.target.value); }}
      placeholder={placeholder || "اكتب إجابتك هنا..."} rows={rows || 4}
      style={{ width: "100%", border: "1.5px solid " + C.bdr, borderRadius: 11, padding: "11px 14px", fontSize: 14, lineHeight: 2, resize: "vertical", direction: "rtl", background: "#fafaf7", outline: "none" }}
      onFocus={function(e) { e.target.style.borderColor = C.gold; }}
      onBlur={function(e) { e.target.style.borderColor = C.bdr; }}
    />
  );
}

function Inp({ value, onChange, placeholder, type, icon, sx }) {
  return (
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none" }}>{icon}</span>}
      <input type={type || "text"} value={value || ""} onChange={function(e) { onChange(e.target.value); }}
        placeholder={placeholder}
        style={{ width: "100%", border: "1.5px solid " + C.bdr, borderRadius: 11, padding: icon ? "10px 36px 10px 14px" : "10px 14px", fontSize: 14, direction: "rtl", background: "#fafaf7", outline: "none", ...(sx || {}) }}
        onFocus={function(e) { e.target.style.borderColor = C.gold; }}
        onBlur={function(e) { e.target.style.borderColor = C.bdr; }}
      />
    </div>
  );
}

function Badge({ children, color }) {
  var cl = color || C.pri;
  return <span style={{ background: cl + "12", color: cl, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{children}</span>;
}

function Stat({ icon, value, label, color }) {
  var cl = color || C.pri;
  return (
    <div style={{ background: cl + "06", borderRadius: 12, padding: "14px 10px", textAlign: "center", border: "1px solid " + cl + "10" }}>
      <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: cl }}>{value}</div>
      <div style={{ fontSize: 11, color: C.txL, marginTop: 1 }}>{label}</div>
    </div>
  );
}

function Toast({ msg, onClose }) {
  useEffect(function() { var t = setTimeout(onClose, 3200); return function() { clearTimeout(t); }; }, [onClose]);
  var ok = msg.indexOf("✅") >= 0;
  return (
    <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: ok ? C.okBg : C.errBg, color: ok ? C.ok : C.err, padding: "11px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, boxShadow: "0 6px 28px rgba(0,0,0,.12)", animation: "sd .3s ease", fontFamily: "'Tajawal',sans-serif", direction: "rtl" }}>{msg}</div>
  );
}

/* Floating back button — always visible, right side */
function FloatingBack({ onClick }) {
  return (
    <button onClick={function() { onClick(); window.scrollTo(0, 0); }}
      style={{
        position: "fixed", bottom: 28, right: 18, zIndex: 900,
        width: 46, height: 46, borderRadius: "50%",
        background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)",
        border: "1px solid " + C.bdr,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: "0 3px 14px rgba(0,0,0,.1)",
        color: C.pri, fontSize: 18, fontWeight: 700,
        WebkitTapHighlightColor: "transparent",
      }}>→</button>
  );
}

/* ═══ PWA Install Support ═══ */
var _deferredPrompt = null;

function usePWA() {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(function() {
    // Check if running as installed PWA
    var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    var ua = navigator.userAgent || "";
    var isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isiOS);

    // If iOS and in browser (not standalone) — show manual instructions
    if (isiOS && !standalone) {
      setCanInstall(true);
    }

    // Android/Chrome — capture install prompt
    function onPrompt(e) {
      e.preventDefault();
      _deferredPrompt = e;
      setCanInstall(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Inject PWA manifest
    if (!document.querySelector('link[rel="manifest"]')) {
      var manifest = {
        name: "رسالتك في الحياة",
        short_name: "رسالتك",
        description: "رحلة اكتشاف رسالتك الشخصية",
        start_url: window.location.href.split("?")[0],
        display: "standalone",
        background_color: "#f5f3ee",
        theme_color: "#0c1f3f",
        orientation: "portrait",
        icons: [
          { src: "https://api.iconify.design/noto:compass.svg", sizes: "any", type: "image/svg+xml" }
        ]
      };
      var blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("link");
      link.rel = "manifest";
      link.href = url;
      document.head.appendChild(link);
    }

    return function() { window.removeEventListener("beforeinstallprompt", onPrompt); };
  }, []);

  function triggerInstall() {
    if (_deferredPrompt) {
      _deferredPrompt.prompt();
      _deferredPrompt.userChoice.then(function() { _deferredPrompt = null; setCanInstall(false); });
    }
  }

  return { canInstall: canInstall, isStandalone: isStandalone, isIOS: isIOS, triggerInstall: triggerInstall };
}

function PWABanner({ pwa }) {
  const [dismissed, setDismissed] = useState(false);

  if (pwa.isStandalone || !pwa.canInstall || dismissed) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,.95)", backdropFilter: "blur(10px)",
      borderRadius: 16, padding: "16px 18px", marginBottom: 20,
      border: "1px solid " + C.gold + "30", boxShadow: "0 4px 20px rgba(0,0,0,.08)",
      direction: "rtl"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>📲</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: C.pri }}>حمّل التطبيق</span>
        </div>
        <button onClick={function() { setDismissed(true); }} style={{
          background: "none", border: "none", cursor: "pointer", fontSize: 16,
          color: C.txL, padding: 4, lineHeight: 1
        }}>✕</button>
      </div>

      {pwa.isIOS ? (
        <div>
          <p style={{ fontSize: 13, color: C.txM, lineHeight: 1.8, margin: "0 0 12px" }}>
            أضف التطبيق للشاشة الرئيسية لتجربة أسرع وأسهل:
          </p>
          <div style={{ background: C.pri + "06", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ background: C.pri, color: "#fff", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>1</span>
              <span style={{ fontSize: 13, color: C.tx }}>اضغط على زر المشاركة <span style={{ fontSize: 16 }}>⬆️</span> أسفل الشاشة</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: C.pri, color: "#fff", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>2</span>
              <span style={{ fontSize: 13, color: C.tx }}>اختر <strong>إضافة إلى الشاشة الرئيسية</strong> ➕</span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: C.txM, lineHeight: 1.8, margin: "0 0 10px" }}>
            حمّل التطبيق على هاتفك لفتحه بشكل أسرع بدون متصفح
          </p>
          <button onClick={pwa.triggerInstall} style={{
            width: "100%", padding: "11px 0", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg," + C.gold + "," + C.goldL + ")",
            color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
            fontFamily: "'Tajawal',sans-serif"
          }}>⬇️ تثبيت التطبيق</button>
        </div>
      )}
    </div>
  );
}

/* ═══ Login ═══ */
function Login({ onLogin }) {
  const [un, sUn] = useState("");
  const [pw, sPw] = useState("");
  const [err, sErr] = useState("");
  const [ld, sLd] = useState(false);
  const [saved, sSv] = useState([]);
  var pwa = usePWA();

  useEffect(function() { gSaved().then(function(s) { sSv(s || []); }); }, []);

  function doLogin(u, p) {
    if (!u || !u.trim() || !p || !p.trim()) { sErr("يرجى كتابة اسم المستخدم وكلمة المرور"); return; }
    sLd(true); sErr("");
    gU().then(function(users) {
      var k = u.trim().toLowerCase();
      var usr = users[k];
      if (!usr) { sErr("اسم المستخدم غير موجود"); sLd(false); return; }
      if (usr.password !== p.trim()) { sErr("كلمة المرور غير صحيحة"); sLd(false); return; }
      sU(Object.assign({}, users, { [k]: Object.assign({}, usr, { lastActive: Date.now() }) })).then(function() {
        gSaved().then(function(ac) {
          var exists = ac.find(function(a) { return a.u === k; });
          var newAc = exists ? ac.map(function(a) { return a.u === k ? { u: k, p: p.trim(), n: usr.name } : a; }) : ac.concat([{ u: k, p: p.trim(), n: usr.name }]);
          sSaved(newAc).then(function() {
            onLogin(Object.assign({ username: k }, usr));
            sLd(false);
          });
        });
      });
    });
  }

  function rmSv(username) {
    gSaved().then(function(ac) {
      var filtered = ac.filter(function(a) { return a.u !== username; });
      sSaved(filtered).then(function() { sSv(filtered); });
    });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, direction: "rtl", fontFamily: "'Tajawal',sans-serif", background: "linear-gradient(155deg," + C.pri + "," + C.priL + " 50%," + C.gold + "40 100%)" }}>
      <style>{CSS_TEXT}</style>
      <div className="si" style={{ maxWidth: 440, width: "100%", background: "rgba(255,255,255,.97)", borderRadius: 22, padding: "36px 30px", boxShadow: "0 28px 72px rgba(0,0,0,.25)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 12px", background: "linear-gradient(135deg," + C.pri + "," + C.priL + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>🧭</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: C.pri, marginBottom: 3 }}>رسالتك في الحياة</h1>
          <p style={{ color: C.txL, fontSize: 13 }}>سجّل دخولك لتكمل رحلتك</p>
        </div>

        <PWABanner pwa={pwa} />

        {saved.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.txM, marginBottom: 6 }}>حساباتك المحفوظة:</div>
            {saved.map(function(a) {
              return (
                <div key={a.u} onClick={function() { doLogin(a.u, a.p); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, marginBottom: 5, background: C.pri + "04", border: "1px solid " + C.pri + "10", cursor: "pointer" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg," + C.gold + "," + C.goldL + ")", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>{a.n ? a.n[0] : "?"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.pri }}>{a.n}</div>
                    <div style={{ fontSize: 11, color: C.txL }}>@{a.u}</div>
                  </div>
                  <button onClick={function(e) { e.stopPropagation(); rmSv(a.u); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.txL }}>✕</button>
                </div>
              );
            })}
            <div style={{ textAlign: "center", margin: "10px 0 0", fontSize: 12, color: C.txL }}>أو سجّل بحساب آخر:</div>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: 4, fontSize: 13, color: C.txM }}>اسم المستخدم</label>
          <Inp value={un} onChange={sUn} placeholder="اسم المستخدم..." icon="👤" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: 4, fontSize: 13, color: C.txM }}>كلمة المرور</label>
          <Inp value={pw} onChange={sPw} placeholder="كلمة المرور..." type="password" icon="🔒" />
        </div>
        {err && <div style={{ background: C.errBg, color: C.err, borderRadius: 10, padding: "9px 12px", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{err}</div>}
        <Btn onClick={function() { doLogin(un, pw); }} dis={ld} v="gold" sz="lg" full>{ld ? "جارٍ التحقق..." : "ادخل إلى رحلتك ←"}</Btn>
      </div>
    </div>
  );
}

/* ═══ Lesson View ═══ */
function LsnV({ lesson, onDone, onBack }) {
  var ph = PHASES.find(function(x) { return x.id === lesson.p; });
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "10px 14px 56px" }}>
      <div className="fu" style={{ marginBottom: 14 }}>
        <Badge color={ph.color}>{ph.icon} {ph.title} · الدرس {lesson.n}</Badge>
      </div>
      <Crd cls="fadeScale" sx={{ borderTop: "4px solid " + ph.color }}>
        <h2 style={{ color: C.pri, fontSize: 19, fontWeight: 900, marginBottom: 16 }}>{lesson.title}</h2>
        {lesson.content.map(function(s, i) {
          return (
            <div key={i} style={{ marginBottom: 22 }}>
              <h3 style={{ color: ph.color, fontSize: 15, fontWeight: 800, marginBottom: 7, paddingRight: 10, borderRight: "3px solid " + C.gold }}>{s.h}</h3>
              <p style={{ lineHeight: 2.2, color: C.tx, whiteSpace: "pre-line", fontSize: 14 }}>{s.p}</p>
            </div>
          );
        })}
        <div style={{ borderTop: "1px solid " + C.bdr, paddingTop: 16 }}>
          <Btn onClick={onDone} v="gold" sz="lg" full>أنهيت الدرس ✓</Btn>
        </div>
      </Crd>
    </div>
  );
}

/* ═══ Exercise View ═══ */
function ExV({ ex, saved, user, onSave, onDone, onBack }) {
  const [a, sA2] = useState(saved || {});
  const [toast, sT] = useState("");
  const tm = useRef(null);
  const [aiSt, sAiSt] = useState(saved && saved.ai_result ? "done" : "idle");
  const [aiRes, sAiRes] = useState((saved && saved.ai_result) || "");
  const [allAns, sAllAns] = useState(null);
  var ph = PHASES.find(function(x) { return x.id === ex.p; });

  useEffect(function() {
    if (ex.type === "ai_mission" && user && user.username) {
      gA(user.username).then(function(answers) {
        sAllAns(answers || {});
      });
    }
  }, [ex.type, user]);

  function up(k, v) {
    var n = Object.assign({}, a, { [k]: v });
    sA2(n);
    clearTimeout(tm.current);
    tm.current = setTimeout(function() { onSave(n); }, 800);
  }

  function hSave() { onSave(a); sT("✅ تم حفظ إجاباتك بنجاح"); }

  function renderEx() {
    if (ex.type === "diag") {
      var cq = ["حياتي لديها إحساس واضح بالرسالة", "لديّ رسالة تعكس هويتي", "أعمل نحو شيء ذي معنى", "حياتي تسترشد بإحساس قوي"];
      var eq = ["أبحث بنشاط عن رسالة", "أبحث عن معنى", "أستكشف اتجاهات مختلفة"];
      var ca = cq.map(function(_, i) { return a["c" + i] || 1; });
      var ea = eq.map(function(_, i) { return a["e" + i] || 1; });
      var cv = ca.reduce(function(x, y) { return x + y; }, 0) / ca.length;
      var ev = ea.reduce(function(x, y) { return x + y; }, 0) / ea.length;
      var hC = cv >= 4.5, hE = ev >= 4.5;
      var profiles = [
        { c: true, e: true, l: "رسالة مُحققة ✨", d: "استكشفت بعمق والتزمت.", cl: C.ok },
        { c: true, e: false, l: "رسالة مُتبنّاة 🔒", d: "ملتزم لكن لم تستكشف البدائل.", cl: C.ph[3] },
        { c: false, e: true, l: "البحث النشط 🔍", d: "تبحث بنشاط. انتقل للعمق.", cl: C.gold },
        { c: false, e: false, l: "البداية 🌫️", d: "ابدأ بأنشطة متنوعة.", cl: C.ph[2] },
      ];
      var pr = profiles.find(function(x) { return x.c === hC && x.e === hE; }) || profiles[3];
      return (
        <div>
          <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>مدى قوة التزامك (1=لا أوافق، 7=أوافق تماماً)</h3>
          {cq.map(function(q, i) { return (
            <div key={i} style={{ background: "#fafaf7", borderRadius: 10, padding: 12, marginBottom: 5, border: "1px solid " + C.bdr }}>
              <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 600 }}>{q}</p>
              <SL value={a["c" + i]} onChange={function(v) { up("c" + i, v); }} />
            </div>
          ); })}
          <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginTop: 16, marginBottom: 10 }}>مدى نشاط استكشافك</h3>
          {eq.map(function(q, i) { return (
            <div key={i} style={{ background: "#fafaf7", borderRadius: 10, padding: 12, marginBottom: 5, border: "1px solid " + C.bdr }}>
              <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 600 }}>{q}</p>
              <SL value={a["e" + i]} onChange={function(v) { up("e" + i, v); }} />
            </div>
          ); })}
          <div style={{ background: pr.cl, borderRadius: 12, padding: 18, color: "#fff", marginTop: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{pr.l}</div>
            <p style={{ margin: 0, lineHeight: 1.7, fontSize: 13 }}>{pr.d}</p>
            <div style={{ marginTop: 8, fontSize: 11, opacity: 0.8 }}>الالتزام: {cv.toFixed(1)}/7 · الاستكشاف: {ev.toFixed(1)}/7</div>
          </div>
        </div>
      );
    }

    if (ex.type === "vals") {
      return (
        <div>
          <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 4 }}>قيّم هذه القيم (1=ليست مهمة، 10=مهمة جداً)</h3>
          <p style={{ fontSize: 12, color: C.txL, marginBottom: 12 }}>اقرأ شرح كل قيمة بعناية ثم قيّمها</p>
          {VD.map(function(vd, i) { return (
            <div key={i} style={{ background: "#fafaf7", borderRadius: 11, padding: 14, marginBottom: 7, border: "1px solid " + C.bdr }}>
              <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: C.pri }}>{vd.n}</p>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: C.txM, lineHeight: 1.7 }}>{vd.d}</p>
              <SL value={a["v" + i]} onChange={function(v) { up("v" + i, v); }} min={1} max={10} />
            </div>
          ); })}
          <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginTop: 18, marginBottom: 10 }}>تأمّل في نتائجك</h3>
          {ex.refl.map(function(q, i) { return (
            <div key={i} style={{ marginBottom: 10 }}>
              <p style={{ fontWeight: 600, margin: "0 0 5px", fontSize: 13 }}>{q}</p>
              <TA value={a["r" + i]} onChange={function(v) { up("r" + i, v); }} />
            </div>
          ); })}
        </div>
      );
    }

    if (ex.type === "vlq") {
      return (
        <div>
          <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>قيّم كل مجال</h3>
          {ex.domains.map(function(d, i) { return (
            <div key={i} style={{ background: "#fafaf7", borderRadius: 10, padding: 12, marginBottom: 7, border: "1px solid " + C.bdr }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700 }}>{d}</p>
              <SL value={a["imp" + i]} onChange={function(v) { up("imp" + i, v); }} min={1} max={10} label="الأهمية لي" />
              <SL value={a["con" + i]} onChange={function(v) { up("con" + i, v); }} min={1} max={10} label="اتساق سلوكي" />
            </div>
          ); })}
          <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 6 }}>كيف ستسد الفجوات؟</h3>
          <TA value={a.vlq_plan} onChange={function(v) { up("vlq_plan", v); }} rows={4} />
        </div>
      );
    }

    if (ex.type === "via") {
      var top5 = ex.strengths.map(function(s, i) { return { s: s, v: a["s" + i] || 0 }; }).sort(function(x, y) { return y.v - x.v; }).slice(0, 5);
      return (
        <div>
          <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>قيّم نقاط القوة (1-5)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
            {ex.strengths.map(function(s, i) { return (
              <div key={i} style={{ background: "#fafaf7", borderRadius: 10, padding: 9, border: "1px solid " + C.bdr }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>{s}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(function(n) { return (
                    <button key={n} onClick={function() { up("s" + i, n); }} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, background: (a["s" + i] || 0) >= n ? C.gold : "#e5e1d8", color: (a["s" + i] || 0) >= n ? "#fff" : "#999" }}>{n}</button>
                  ); })}
                </div>
              </div>
            ); })}
          </div>
          {top5[0] && top5[0].v > 0 && (
            <Crd sx={{ background: C.goldBg, marginBottom: 12, padding: 14 }}>
              <div style={{ fontWeight: 800, color: C.gold, marginBottom: 6, fontSize: 13 }}>⭐ أعلى 5 نقاط قوة</div>
              {top5.map(function(x, i) { return <div key={i} style={{ fontSize: 13, marginBottom: 2 }}>{i + 1}. {x.s} — {x.v}/5</div>; })}
            </Crd>
          )}
          <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 6 }}>كيف ستستخدمها هذا الأسبوع؟</h3>
          <TA value={a.via_app} onChange={function(v) { up("via_app", v); }} rows={5} />
        </div>
      );
    }

    if (ex.type === "flow") {
      return (
        <div>
          <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>سجّل 5 أنشطة</h3>
          {[0, 1, 2, 3, 4].map(function(i) { return (
            <div key={i} style={{ background: "#fafaf7", borderRadius: 10, padding: 12, marginBottom: 7, border: "1px solid " + C.bdr }}>
              <Inp value={a["fa" + i] || ""} onChange={function(v) { up("fa" + i, v); }} placeholder={"النشاط " + (i + 1)} sx={{ marginBottom: 6 }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 110 }}><SL value={a["fe" + i]} onChange={function(v) { up("fe" + i, v); }} min={1} max={5} label="الاندماج" /></div>
                <div style={{ flex: 1, minWidth: 110 }}><SL value={a["fne" + i]} onChange={function(v) { up("fne" + i, v); }} min={1} max={5} label="الطاقة بعده" /></div>
              </div>
            </div>
          ); })}
          <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginTop: 12, marginBottom: 6 }}>حلّل النشاط الأعلى (AEIOU)</h3>
          {["ماذا كنت تفعل؟", "أين كنت؟", "مع من؟", "الأدوات؟", "الأنماط؟"].map(function(q, i) { return (
            <div key={i} style={{ marginBottom: 8 }}>
              <p style={{ fontWeight: 600, margin: "0 0 3px", fontSize: 12 }}>{q}</p>
              <TA value={a["aeiou" + i]} onChange={function(v) { up("aeiou" + i, v); }} rows={2} />
            </div>
          ); })}
        </div>
      );
    }

    if (ex.type === "ai_mission") {
      var answeredCount = allAns ? Object.keys(allAns).length : 0;
      var totalFields = allAns ? Object.values(allAns).reduce(function(s, v) { return s + Object.keys(v || {}).length; }, 0) : 0;

      function runAi() {
        if (!allAns || !user) return;
        sAiSt("loading");
        fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            messages: [{
              role: "user",
              content: "أنت خبير في علم النفس الإيجابي واكتشاف الرسالة الشخصية (Purpose). أمامك كل إجابات شخص أكمل رحلة كاملة لاكتشاف ذاته.\n\nالمستخدم: " + user.name + "، " + user.age + " سنة، " + (ST[user.lifeStage] || "") + "\n\nجميع إجاباته على كل التمارين:\n" + JSON.stringify(allAns).slice(0, 5000) + "\n\nمهمتك: اقرأ كل إجابة بعناية، واستخلص منها رسالة هذا الشخص في الحياة. أجب بالعربية الفصحى المبسطة:\n\n✨ رسالتك في جملة واحدة:\n[جملة قوية وملهمة تلخص رسالته]\n\n📖 شرح رسالتك:\n[4-6 جمل تشرح الرسالة بعمق وتربطها بإجاباته الفعلية]\n\n⚖️ قيمك الجوهرية:\n[3-5 قيم مع شرح قصير لكل واحدة مستند لإجاباته]\n\n💪 نقاط قوتك المحورية:\n[3-4 نقاط قوة واضحة من إجاباته مع أمثلة]\n\n📖 الموضوع المتكرر في قصتك:\n[تحليل للأنماط والمواضيع المتكررة عبر كل إجاباته]\n\n🎯 5 خطوات عملية تبدأ بها:\n[5 أفعال محددة جداً ومخصصة له بناء على إجاباته]\n\n⚠️ فخوخ عليك الانتباه منها:\n[2-3 تحذيرات مبنية على أنماط في إجاباته]\n\n🌟 رسالة أخيرة لك:\n[فقرة ملهمة وشخصية تختم بها]\n\nكن دقيقاً وعميقاً. استند لإجاباته الفعلية وليس لعموميات. هذه لحظة مهمة في حياته."
            }]
          })
        }).then(function(r) { return r.json(); }).then(function(d) {
          var text = (d.content || []).map(function(x) { return x.text || ""; }).join("\n");
          var result = text || "تعذّر التحليل. حاول مجدداً.";
          sAiRes(result);
          sAiSt("done");
          // Save result
          var n = Object.assign({}, a, { ai_result: result });
          sA2(n);
          onSave(n);
        }).catch(function() { sAiSt("error"); });
      }

      return (
        <div>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg," + C.ph[7] + "," + C.ph[3] + ")", borderRadius: 14, padding: 24, color: "#fff", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 10, animation: "fl 3s ease-in-out infinite" }}>🔮</div>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>لحظة اكتشاف رسالتك</h3>
            <p style={{ opacity: 0.85, fontSize: 13, lineHeight: 1.8 }}>الذكاء الاصطناعي سيقرأ كل إجاباتك من كل التمارين ويصوغ رسالتك الشخصية</p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "#fafaf7", borderRadius: 10, padding: 14, textAlign: "center", border: "1px solid " + C.bdr }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.gold }}>{answeredCount}</div>
              <div style={{ fontSize: 11, color: C.txL }}>تمرين مُجاب</div>
            </div>
            <div style={{ background: "#fafaf7", borderRadius: 10, padding: 14, textAlign: "center", border: "1px solid " + C.bdr }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.pri }}>{totalFields}</div>
              <div style={{ fontSize: 11, color: C.txL }}>إجابة إجمالية</div>
            </div>
          </div>

          {/* AI States */}
          {aiSt === "idle" && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <p style={{ color: C.txM, fontSize: 14, lineHeight: 2, marginBottom: 16 }}>
                أكملت رحلة كاملة من الاستكشاف والتأمل 🎉
                {"\n"}الآن حان الوقت لتجميع كل ما اكتشفته في رسالة واحدة واضحة.
              </p>
              <Btn onClick={runAi} v="gold" sz="lg" full dis={!allAns}>🔮 اكتشف رسالتك الآن</Btn>
            </div>
          )}

          {aiSt === "loading" && (
            <div style={{ textAlign: "center", padding: 30 }}>
              <div style={{ fontSize: 44, animation: "pl 1.5s infinite", marginBottom: 12 }}>🔮</div>
              <h3 style={{ color: C.pri, fontSize: 16, fontWeight: 800, marginBottom: 6 }}>يقرأ كل إجاباتك...</h3>
              <p style={{ color: C.txL, fontSize: 13 }}>يحلل رحلتك بالكامل ويصوغ رسالتك — لحظات</p>
            </div>
          )}

          {aiSt === "error" && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
              <p style={{ color: C.err, fontSize: 14, marginBottom: 12 }}>حدث خطأ أثناء التحليل</p>
              <Btn onClick={runAi} v="gold" sz="sm">🔄 إعادة المحاولة</Btn>
            </div>
          )}

          {aiSt === "done" && (
            <div>
              <div style={{ background: "linear-gradient(135deg," + C.goldBg + ",#fff)", borderRadius: 14, padding: 22, border: "1px solid " + C.gold + "25" }}>
                <p style={{ fontSize: 15, lineHeight: 2.4, color: C.tx, whiteSpace: "pre-line", margin: 0 }}>{aiRes}</p>
              </div>
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <Btn onClick={function() { sAiSt("idle"); sAiRes(""); }} v="soft" sz="sm">🔄 إعادة التحليل</Btn>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default: mq type
    return (
      <div>
        {(ex.qs || []).map(function(q, i) { return (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ background: ph.color + "08", borderRadius: 10, padding: "10px 14px", marginBottom: 7, borderRight: "4px solid " + ph.color }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: ph.color }}>{(i + 1) + ". " + q}</p>
            </div>
            <TA value={a["q" + i]} onChange={function(v) { up("q" + i, v); }} rows={4} />
          </div>
        ); })}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "10px 14px 70px" }}>
      {toast && <Toast msg={toast} onClose={function() { sT(""); }} />}
      <div className="fu" style={{ marginBottom: 14 }}>
        <Badge color={ph.color}>{ph.icon} {ph.title}</Badge>
      </div>
      <Crd cls="fadeScale" sx={{ borderTop: "4px solid " + C.gold }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 30 }}>{ex.icon}</span>
          <div>
            <h2 style={{ margin: 0, color: C.pri, fontSize: 18, fontWeight: 900 }}>{ex.title}</h2>
            <p style={{ margin: "2px 0 0", color: C.txL, fontSize: 12 }}>{ex.sub} · ~{ex.mins} دقيقة</p>
          </div>
        </div>
        {renderEx()}
        <div style={{ borderTop: "1px solid " + C.bdr, paddingTop: 14, marginTop: 8, display: "flex", gap: 7, flexWrap: "wrap" }}>
          <Btn onClick={hSave} v="soft" sz="sm">💾 حفظ</Btn>
          <Btn onClick={function() { hSave(); onDone(); }} v="gold" sx={{ flex: 1 }}>أنهيت التمرين ✓</Btn>
        </div>
      </Crd>
    </div>
  );
}

/* ═══ Phase View ═══ */
function PhV({ phId, user, onL, onE, onBack }) {
  var ph = PHASES.find(function(x) { return x.id === phId; });
  var pL = LESSONS.filter(function(l) { return l.p === phId; });
  var pE = EX.filter(function(e) { return e.p === phId; });
  var dL = user.completedLessons || [];
  var dE = user.completedExercises || [];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "18px 14px 50px" }}>
      <Btn onClick={onBack} v="ghost" sz="sm" sx={{ marginBottom: 16 }}>→ الرئيسية</Btn>
      <div className="fu" style={{ background: "linear-gradient(135deg," + ph.color + "," + ph.color + "bb)", borderRadius: 14, padding: 22, color: "#fff", marginBottom: 16 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>{ph.icon}</div>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 1 }}>المرحلة {ph.id}: {ph.title}</h2>
        <p style={{ opacity: 0.85, fontSize: 13 }}>{ph.sub}</p>
      </div>
      <h3 style={{ color: C.pri, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>📚 الدروس</h3>
      {pL.map(function(l, i) {
        var k = l.p + "-" + l.n;
        var dn = dL.indexOf(k) >= 0;
        var pv = i === 0 || dL.indexOf(pL[i - 1].p + "-" + pL[i - 1].n) >= 0;
        return (
          <div key={k} onClick={pv ? function() { onL(l); } : null} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 5, cursor: pv ? "pointer" : "default", background: dn ? ph.color + "06" : C.card, border: "1.5px solid " + (dn ? ph.color : C.bdr), opacity: pv ? 1 : 0.5 }}>
            <span style={{ fontSize: 18 }}>{dn ? "✅" : pv ? "📖" : "🔒"}</span>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13, color: dn ? ph.color : C.tx }}>الدرس {l.n}: {l.title}</div></div>
            {pv && !dn && <span style={{ color: ph.color, fontSize: 13 }}>←</span>}
          </div>
        );
      })}
      <h3 style={{ color: C.pri, fontSize: 13, fontWeight: 800, marginTop: 18, marginBottom: 8 }}>✏️ التمارين</h3>
      {pE.map(function(e, i) {
        var dn = dE.indexOf(e.id) >= 0;
        var aLD = pL.every(function(l) { return dL.indexOf(l.p + "-" + l.n) >= 0; });
        var pED = i === 0 || dE.indexOf(pE[i - 1].id) >= 0;
        var ok = aLD && pED;
        return (
          <div key={e.id} onClick={ok ? function() { onE(e); } : null} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 5, cursor: ok ? "pointer" : "default", background: dn ? C.gold + "06" : C.card, border: "1.5px solid " + (dn ? C.gold : C.bdr), opacity: ok ? 1 : 0.5 }}>
            <span style={{ fontSize: 18 }}>{dn ? "⭐" : ok ? e.icon : "🔒"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: dn ? C.gold : C.tx }}>{e.title}</div>
              <div style={{ fontSize: 11, color: C.txL }}>{e.sub}{dn ? " ✓" : ""}</div>
            </div>
            {ok && !dn && <span style={{ color: C.gold, fontSize: 13 }}>←</span>}
          </div>
        );
      })}
      <FloatingBack onClick={onBack} />
    </div>
  );
}

/* ═══ Dashboard ═══ */
function Dash({ user, onNav }) {
  var q = QUOTES[new Date().getDay() % QUOTES.length];
  var dL = (user.completedLessons || []).length;
  var dE = (user.completedExercises || []).length;
  var pct = Math.round((dL + dE) / 40 * 100);

  var nxL = "ابدأ من المرحلة الأولى 🌱";
  var nxP = 1;
  for (var pi = 0; pi < PHASES.length; pi++) {
    var ph = PHASES[pi];
    var pL = LESSONS.filter(function(l) { return l.p === ph.id; });
    var pE = EX.filter(function(e) { return e.p === ph.id; });
    var fL = pL.find(function(l) { return (user.completedLessons || []).indexOf(l.p + "-" + l.n) < 0; });
    if (fL) { nxL = ph.icon + " " + fL.title; nxP = ph.id; break; }
    var fE = pE.find(function(e) { return (user.completedExercises || []).indexOf(e.id) < 0; });
    if (fE) { nxL = ph.icon + " " + fE.title; nxP = ph.id; break; }
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "18px 14px 50px" }}>
      <div className="fu" style={{ background: "linear-gradient(140deg," + C.pri + "," + C.priL + " 55%," + C.gold + "40 100%)", borderRadius: 18, padding: "24px 22px 20px", color: "#fff", marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 3 }}>مرحباً 👋</div>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 1 }}>{user.name}</h2>
        <div style={{ opacity: 0.55, fontSize: 12, marginBottom: 16 }}>@{user.username}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}><span>التقدم</span><span style={{ fontWeight: 800 }}>{pct}%</span></div>
        <PB v={pct} color={C.gold} h={8} />
      </div>

      <Crd cls="fu" sx={{ background: C.goldBg, border: "1px solid " + C.gold + "18", marginBottom: 14, padding: 16 }}>
        <div style={{ fontSize: 11, color: C.gold, fontWeight: 800, marginBottom: 4 }}>💫 اقتباس اليوم</div>
        <p style={{ fontSize: 14, fontStyle: "italic", color: C.tx, margin: "0 0 4px", lineHeight: 2 }}>«{q.q}»</p>
        <p style={{ fontSize: 12, color: C.txL, margin: 0 }}>— {q.a}</p>
      </Crd>

      <div className="sg" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 14 }}>
        <Stat icon="📚" value={dL + "/18"} label="دروس" color={C.pri} />
        <Stat icon="✏️" value={dE + "/22"} label="تمارين" color={C.gold} />
        <Stat icon="🎯" value={pct + "%"} label="إنجاز" color={C.ok} />
      </div>

      {pct < 100 && (
        <Crd cls="fu" sx={{ marginBottom: 14, padding: 16 }}>
          <div style={{ fontSize: 12, color: C.pri, fontWeight: 800, marginBottom: 4 }}>📍 أكمل من حيث توقفت</div>
          <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600 }}>{nxL}</p>
          <Btn onClick={function() { onNav("phase", nxP); }} v="gold" full sz="lg">▶ أكمل رحلتك</Btn>
        </Crd>
      )}

      <Crd cls="fu">
        <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 900, marginBottom: 12 }}>🗺️ خريطة الرحلة</h3>
        {PHASES.map(function(ph2) {
          var pL2 = LESSONS.filter(function(l) { return l.p === ph2.id; });
          var pE2 = EX.filter(function(e) { return e.p === ph2.id; });
          var d = pL2.filter(function(l) { return (user.completedLessons || []).indexOf(l.p + "-" + l.n) >= 0; }).length + pE2.filter(function(e) { return (user.completedExercises || []).indexOf(e.id) >= 0; }).length;
          var t = pL2.length + pE2.length;
          var pp = Math.round(d / t * 100);
          return (
            <div key={ph2.id} onClick={function() { onNav("phase", ph2.id); }} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 9, marginBottom: 5, cursor: "pointer", background: pp === 100 ? ph2.color + "06" : "#fafaf7", border: "1.5px solid " + (pp === 100 ? ph2.color : pp > 0 ? ph2.color + "28" : C.bdr) }}>
              <span style={{ fontSize: 18 }}>{ph2.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: ph2.color }}>{ph2.title}</span>
                  <span style={{ fontSize: 10, color: C.txL }}>{d}/{t}</span>
                </div>
                <PB v={pp} color={ph2.color} h={4} />
              </div>
              {pp === 100 && <span style={{ fontSize: 11 }}>✅</span>}
            </div>
          );
        })}
      </Crd>
    </div>
  );
}

/* ═══ Read-Only Exercise View (for Admin) ═══ */
function ExReadOnly({ ex, answers }) {
  var a = answers || {};
  var ph = PHASES.find(function(x) { return x.id === ex.p; });

  function ROText({ value }) {
    if (!value) return <div style={{ color: C.txL, fontSize: 13, fontStyle: "italic", padding: "8px 12px" }}>لم يُجب بعد</div>;
    return <div style={{ fontSize: 14, lineHeight: 2, background: "#fafaf7", borderRadius: 10, padding: "10px 14px", border: "1px solid " + C.bdr, whiteSpace: "pre-line", color: C.tx }}>{value}</div>;
  }

  function ROSlider({ value, min, max, label }) {
    var mn = min || 1, mx = max || 7, val = value || mn;
    var pct = ((val - mn) / (mx - mn)) * 100;
    return (
      <div style={{ marginBottom: 5 }}>
        {label && <div style={{ fontSize: 12, color: C.txL, marginBottom: 2, fontWeight: 500 }}>{label}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 11, color: C.txL }}>{mn}</span>
          <div style={{ flex: 1, height: 6, background: C.bdr, borderRadius: 99, position: "relative" }}>
            <div style={{ width: pct + "%", height: "100%", background: C.gold, borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 11, color: C.txL }}>{mx}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.gold, background: C.gold + "10", borderRadius: 7, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>{val}</span>
        </div>
      </div>
    );
  }

  if (ex.type === "diag") {
    var cq = ["حياتي لديها إحساس واضح بالرسالة", "لديّ رسالة تعكس هويتي", "أعمل نحو شيء ذي معنى", "حياتي تسترشد بإحساس قوي"];
    var eq = ["أبحث بنشاط عن رسالة", "أبحث عن معنى", "أستكشف اتجاهات مختلفة"];
    var ca = cq.map(function(_, i) { return a["c" + i] || 1; });
    var ea = eq.map(function(_, i) { return a["e" + i] || 1; });
    var cv = ca.reduce(function(x, y) { return x + y; }, 0) / ca.length;
    var ev = ea.reduce(function(x, y) { return x + y; }, 0) / ea.length;
    var hC = cv >= 4.5, hE = ev >= 4.5;
    var profiles = [
      { c: true, e: true, l: "رسالة مُحققة ✨", d: "استكشفت بعمق والتزمت.", cl: C.ok },
      { c: true, e: false, l: "رسالة مُتبنّاة 🔒", d: "ملتزم لكن لم تستكشف البدائل.", cl: C.ph[3] },
      { c: false, e: true, l: "البحث النشط 🔍", d: "تبحث بنشاط. انتقل للعمق.", cl: C.gold },
      { c: false, e: false, l: "البداية 🌫️", d: "ابدأ بأنشطة متنوعة.", cl: C.ph[2] },
    ];
    var pr = profiles.find(function(x) { return x.c === hC && x.e === hE; }) || profiles[3];
    return (
      <div>
        <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>مدى قوة الالتزام</h3>
        {cq.map(function(q, i) { return (
          <div key={i} style={{ background: "#fafaf7", borderRadius: 10, padding: 12, marginBottom: 5, border: "1px solid " + C.bdr }}>
            <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 600 }}>{q}</p>
            <ROSlider value={a["c" + i]} />
          </div>
        ); })}
        <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginTop: 16, marginBottom: 10 }}>مدى نشاط الاستكشاف</h3>
        {eq.map(function(q, i) { return (
          <div key={i} style={{ background: "#fafaf7", borderRadius: 10, padding: 12, marginBottom: 5, border: "1px solid " + C.bdr }}>
            <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 600 }}>{q}</p>
            <ROSlider value={a["e" + i]} />
          </div>
        ); })}
        <div style={{ background: pr.cl, borderRadius: 12, padding: 18, color: "#fff", marginTop: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{pr.l}</div>
          <p style={{ margin: 0, lineHeight: 1.7, fontSize: 13 }}>{pr.d}</p>
          <div style={{ marginTop: 8, fontSize: 11, opacity: 0.8 }}>الالتزام: {cv.toFixed(1)}/7 · الاستكشاف: {ev.toFixed(1)}/7</div>
        </div>
      </div>
    );
  }

  if (ex.type === "vals") {
    return (
      <div>
        <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 12 }}>تقييم القيم</h3>
        {VD.map(function(vd, i) { return (
          <div key={i} style={{ background: "#fafaf7", borderRadius: 11, padding: 14, marginBottom: 7, border: "1px solid " + C.bdr }}>
            <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: C.pri }}>{vd.n}</p>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: C.txM, lineHeight: 1.7 }}>{vd.d}</p>
            <ROSlider value={a["v" + i]} min={1} max={10} />
          </div>
        ); })}
        <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginTop: 18, marginBottom: 10 }}>التأملات</h3>
        {(ex.refl || []).map(function(q, i) { return (
          <div key={i} style={{ marginBottom: 10 }}>
            <p style={{ fontWeight: 600, margin: "0 0 5px", fontSize: 13 }}>{q}</p>
            <ROText value={a["r" + i]} />
          </div>
        ); })}
      </div>
    );
  }

  if (ex.type === "vlq") {
    var gaps = (ex.domains || []).map(function(d, i) { return { d: d, imp: a["imp" + i] || 5, con: a["con" + i] || 5 }; }).map(function(x) { return Object.assign({}, x, { gap: x.imp - x.con }); }).filter(function(x) { return x.gap >= 3; }).sort(function(x, y) { return y.gap - x.gap; });
    return (
      <div>
        <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>تقييم المجالات</h3>
        {(ex.domains || []).map(function(d, i) { return (
          <div key={i} style={{ background: "#fafaf7", borderRadius: 10, padding: 12, marginBottom: 7, border: "1px solid " + C.bdr }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700 }}>{d}</p>
            <ROSlider value={a["imp" + i]} min={1} max={10} label="الأهمية" />
            <ROSlider value={a["con" + i]} min={1} max={10} label="الاتساق" />
          </div>
        ); })}
        {gaps.length > 0 && (
          <Crd sx={{ background: C.errBg, border: "1px solid " + C.err + "18", marginBottom: 10, padding: 14 }}>
            <div style={{ fontWeight: 800, color: C.err, fontSize: 12, marginBottom: 6 }}>🚨 أكبر الفجوات</div>
            {gaps.slice(0, 4).map(function(x, i) { return <div key={i} style={{ fontSize: 12, marginBottom: 2 }}>• {x.d}: أهمية {x.imp} — اتساق {x.con} = فجوة {x.gap}</div>; })}
          </Crd>
        )}
        <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 6 }}>خطة سد الفجوات</h3>
        <ROText value={a.vlq_plan} />
      </div>
    );
  }

  if (ex.type === "via") {
    var top5 = (ex.strengths || []).map(function(s, i) { return { s: s, v: a["s" + i] || 0 }; }).sort(function(x, y) { return y.v - x.v; }).slice(0, 5);
    return (
      <div>
        <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>تقييم نقاط القوة</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
          {(ex.strengths || []).map(function(s, i) { return (
            <div key={i} style={{ background: "#fafaf7", borderRadius: 10, padding: 9, border: "1px solid " + C.bdr }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>{s}</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4, 5].map(function(n) { return (
                  <div key={n} style={{ width: 26, height: 26, borderRadius: "50%", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", background: (a["s" + i] || 0) >= n ? C.gold : "#e5e1d8", color: (a["s" + i] || 0) >= n ? "#fff" : "#999" }}>{n}</div>
                ); })}
              </div>
            </div>
          ); })}
        </div>
        {top5[0] && top5[0].v > 0 && (
          <Crd sx={{ background: C.goldBg, marginBottom: 12, padding: 14 }}>
            <div style={{ fontWeight: 800, color: C.gold, marginBottom: 6, fontSize: 13 }}>⭐ أعلى 5 نقاط قوة</div>
            {top5.map(function(x, i) { return <div key={i} style={{ fontSize: 13, marginBottom: 2 }}>{i + 1}. {x.s} — {x.v}/5</div>; })}
          </Crd>
        )}
        <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 6 }}>خطة الاستخدام</h3>
        <ROText value={a.via_app} />
      </div>
    );
  }

  if (ex.type === "flow") {
    return (
      <div>
        <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>الأنشطة المسجّلة</h3>
        {[0, 1, 2, 3, 4].map(function(i) {
          if (!a["fa" + i]) return null;
          return (
            <div key={i} style={{ background: "#fafaf7", borderRadius: 10, padding: 12, marginBottom: 7, border: "1px solid " + C.bdr }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.pri, marginBottom: 6 }}>{a["fa" + i]}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 110 }}><ROSlider value={a["fe" + i]} min={1} max={5} label="الاندماج" /></div>
                <div style={{ flex: 1, minWidth: 110 }}><ROSlider value={a["fne" + i]} min={1} max={5} label="الطاقة بعده" /></div>
              </div>
              {a["ff" + i] && <div style={{ marginTop: 4 }}><Badge color={a["ff" + i].indexOf("✓") >= 0 ? C.ok : C.txL}>{a["ff" + i]}</Badge></div>}
            </div>
          );
        })}
        <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800, marginTop: 12, marginBottom: 6 }}>تحليل AEIOU</h3>
        {["ماذا كنت أفعل؟", "أين كنت؟", "مع من؟", "الأدوات؟", "الأنماط؟"].map(function(q, i) { return (
          <div key={i} style={{ marginBottom: 8 }}>
            <p style={{ fontWeight: 600, margin: "0 0 3px", fontSize: 12 }}>{q}</p>
            <ROText value={a["aeiou" + i]} />
          </div>
        ); })}
      </div>
    );
  }

  // AI Mission type
  if (ex.type === "ai_mission") {
    if (a.ai_result) {
      return (
        <div>
          <div style={{ background: "linear-gradient(135deg," + C.ph[7] + "," + C.ph[3] + ")", borderRadius: 12, padding: 20, color: "#fff", marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🔮</div>
            <h3 style={{ fontSize: 16, fontWeight: 900 }}>رسالته — صاغها الذكاء الاصطناعي</h3>
          </div>
          <div style={{ background: "linear-gradient(135deg," + C.goldBg + ",#fff)", borderRadius: 14, padding: 22, border: "1px solid " + C.gold + "25" }}>
            <p style={{ fontSize: 14, lineHeight: 2.4, color: C.tx, whiteSpace: "pre-line", margin: 0 }}>{a.ai_result}</p>
          </div>
        </div>
      );
    }
    return (
      <div style={{ textAlign: "center", padding: 24, color: C.txL }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔮</div>
        <p>لم يُشغّل تحليل الذكاء الاصطناعي بعد</p>
      </div>
    );
  }

  // Default: mq type
  return (
    <div>
      {(ex.qs || []).map(function(q, i) { return (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ background: ph.color + "08", borderRadius: 10, padding: "10px 14px", marginBottom: 7, borderRight: "4px solid " + ph.color }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: ph.color }}>{(i + 1) + ". " + q}</p>
          </div>
          <ROText value={a["q" + i]} />
        </div>
      ); })}
    </div>
  );
}

/* ═══ Admin Panel ═══ */
function Admin({ onLogout }) {
  const [users, setU2] = useState({});
  const [sel, sSel] = useState(null);
  const [ans, sAns] = useState({});
  const [adding, sAdd] = useState(false);
  const [form, sForm] = useState({ username: "", password: "", name: "", age: "", gender: "male", lifeStage: "young" });
  const [error, sError] = useState("");
  const [toast, sToast] = useState("");
  const [tab, sTab] = useState("overview");
  const [ansV, sAnsV] = useState(null);
  const [aiStatus, sAiStatus] = useState("idle");
  const [aiResult, sAiResult] = useState("");

  useEffect(function() { gU().then(function(u) { setU2(u); }); }, []);

  function addUser() {
    if (!form.username.trim() || !form.password.trim() || !form.name.trim()) { sError("يرجى ملء الحقول"); return; }
    gU().then(function(u) {
      if (u[form.username.toLowerCase()]) { sError("الاسم موجود"); return; }
      u[form.username.toLowerCase()] = { password: form.password, name: form.name, age: +form.age || 0, gender: form.gender, lifeStage: form.lifeStage, completedLessons: [], completedExercises: [], createdAt: Date.now(), lastActive: Date.now() };
      sU(u).then(function() { sForm({ username: "", password: "", name: "", age: "", gender: "male", lifeStage: "young" }); sAdd(false); sError(""); sToast("✅ تمت الإضافة"); gU().then(function(u2) { setU2(u2); }); });
    });
  }

  function delUser(un) {
    if (un === "admin" || !window.confirm("حذف " + un + "?")) return;
    gU().then(function(u) { delete u[un]; sU(u).then(function() { sbDel("r_answers", un); gU().then(function(u2) { setU2(u2); }); sToast("✅ تم الحذف"); sSel(null); }); });
  }

  function viewUser(un) {
    sSel(un); sTab("overview"); sAnsV(null); sAiStatus("idle"); sAiResult("");
    gA(un).then(function(a) { sAns(a); });
  }

  function runAiAnalysis() {
    if (!sel || !users[sel]) return;
    var u = users[sel];
    sAiStatus("loading");
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: "أنت خبير في علم النفس الإيجابي واكتشاف الرسالة الشخصية. حلّل إجابات هذا الشخص بعمق وصُغ رسالته.\n\nالمستخدم: " + u.name + "، " + u.age + " سنة، المرحلة: " + (ST[u.lifeStage] || u.lifeStage) + "\n\nالإجابات الكاملة:\n" + JSON.stringify(ans).slice(0, 4000) + "\n\nأجب بالعربية الفصحى المبسطة وفق هذا الشكل:\n\n## ✨ رسالتك في جملة واحدة\n[جملة قوية وملهمة]\n\n## 📖 الشرح المفصّل\n[3-5 جمل تشرح الرسالة بعمق مع ربطها بإجاباته]\n\n## ⚖️ قيمك الجوهرية\n[3-5 قيم مستخلصة من إجاباته مع شرح قصير لكل واحدة]\n\n## 💪 نقاط قوتك المحورية\n[2-4 نقاط قوة واضحة من إجاباته]\n\n## 📖 الموضوع المتكرر في قصتك\n[تحليل للأنماط المتكررة في قصة حياته]\n\n## 🎯 3 خطوات عملية تبدأ بها هذا الأسبوع\n[3 أفعال محددة جداً ومرتبطة بإجاباته]\n\n## ⚠️ تحذير — فخ عليك الانتباه منه\n[فخ واحد أو اثنين مبني على أنماط إجاباته]\n\n## 🌟 رسالة أخيرة\n[فقرة ملهمة تختم بها]\n\nكن دقيقاً وعميقاً وملهماً. هذه لحظة مهمة في حياة هذا الشخص. استند لإجاباته الفعلية ولا تعمّم."
        }]
      })
    }).then(function(r) { return r.json(); }).then(function(d) {
      var text = (d.content || []).map(function(x) { return x.text || ""; }).join("\n");
      sAiResult(text || "تعذّر الحصول على تحليل. حاول مجدداً.");
      sAiStatus("done");
    }).catch(function() {
      sAiStatus("error");
    });
  }

  var nonAdmin = Object.entries(users).filter(function(e) { return e[0] !== "admin"; });
  var su = sel ? users[sel] : null;
  var aExs = Object.entries(ans).filter(function(e) { return e[1] && Object.keys(e[1]).length > 0; });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Tajawal',sans-serif", direction: "rtl" }}>
      <style>{CSS_TEXT}</style>
      {toast && <Toast msg={toast} onClose={function() { sToast(""); }} />}
      <nav style={{ background: C.pri, padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>🛡️</span><span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>لوحة المشرف</span></div>
        <Btn onClick={onLogout} v="ghost" sz="sm" sx={{ color: "#fff", border: "1px solid rgba(255,255,255,.2)" }}>خروج</Btn>
      </nav>

      <div style={{ maxWidth: 1050, margin: "0 auto", padding: "18px 14px" }}>
        <div className="sg" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
          <Stat icon="👥" value={nonAdmin.length} label="مستخدمون" color={C.pri} />
          <Stat icon="📚" value={nonAdmin.reduce(function(s, e) { return s + (e[1].completedLessons || []).length; }, 0)} label="دروس" color={C.ph[1]} />
          <Stat icon="✏️" value={nonAdmin.reduce(function(s, e) { return s + (e[1].completedExercises || []).length; }, 0)} label="تمارين" color={C.gold} />
          <Stat icon="🏆" value={nonAdmin.filter(function(e) { return (e[1].completedExercises || []).length >= 22; }).length} label="أنهوا الرحلة" color={C.ph[4]} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 14, alignItems: "start" }}>
          {/* Users List */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ color: C.pri, fontSize: 14, fontWeight: 800 }}>المستخدمون</h3>
              <Btn onClick={function() { sAdd(!adding); }} v="gold" sz="sm">{adding ? "إلغاء" : "＋"}</Btn>
            </div>

            {adding && (
              <Crd cls="si" sx={{ marginBottom: 10, padding: 16 }}>
                {[{ k: "username", l: "اسم المستخدم", ic: "👤" }, { k: "password", l: "كلمة المرور", ic: "🔒" }, { k: "name", l: "الاسم الكامل", ic: "📝" }, { k: "age", l: "العمر", t: "number", ic: "🎂" }].map(function(f) {
                  return (
                    <div key={f.k} style={{ marginBottom: 7 }}>
                      <label style={{ fontSize: 11, display: "block", marginBottom: 2, fontWeight: 600, color: C.txM }}>{f.l}</label>
                      <Inp value={form[f.k]} onChange={function(v) { sForm(Object.assign({}, form, { [f.k]: v })); }} type={f.t || "text"} placeholder={f.l} icon={f.ic} />
                    </div>
                  );
                })}
                <div style={{ marginBottom: 7 }}><label style={{ fontSize: 11, display: "block", marginBottom: 2, fontWeight: 600, color: C.txM }}>الجنس</label><select value={form.gender} onChange={function(e) { sForm(Object.assign({}, form, { gender: e.target.value })); }} style={{ width: "100%", border: "1.5px solid " + C.bdr, borderRadius: 10, padding: "8px 10px", fontSize: 13, background: "#fafaf7" }}><option value="male">ذكر</option><option value="female">أنثى</option></select></div>
                <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, display: "block", marginBottom: 2, fontWeight: 600, color: C.txM }}>المرحلة</label><select value={form.lifeStage} onChange={function(e) { sForm(Object.assign({}, form, { lifeStage: e.target.value })); }} style={{ width: "100%", border: "1.5px solid " + C.bdr, borderRadius: 10, padding: "8px 10px", fontSize: 13, background: "#fafaf7" }}>{Object.entries(ST).map(function(e) { return <option key={e[0]} value={e[0]}>{e[1]}</option>; })}</select></div>
                {error && <p style={{ color: C.err, fontSize: 11, marginBottom: 6 }}>{error}</p>}
                <Btn onClick={addUser} v="gold" sz="sm" full>حفظ</Btn>
              </Crd>
            )}

            {nonAdmin.map(function(entry) {
              var un = entry[0], u = entry[1];
              var pct = Math.round(((u.completedLessons || []).length + (u.completedExercises || []).length) / 40 * 100);
              return (
                <div key={un} onClick={function() { viewUser(un); }} style={{ padding: "10px 12px", borderRadius: 11, marginBottom: 5, cursor: "pointer", background: sel === un ? C.pri + "05" : C.card, border: "2px solid " + (sel === un ? C.gold : C.bdr) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div><div style={{ fontWeight: 700, fontSize: 13, color: C.pri }}>{u.name}</div><div style={{ fontSize: 10, color: C.txL }}>@{un}</div></div>
                    <Badge color={pct >= 100 ? C.ok : C.txL}>{pct}%</Badge>
                  </div>
                  <PB v={pct} h={4} />
                </div>
              );
            })}
            {nonAdmin.length === 0 && <div style={{ textAlign: "center", padding: 24, color: C.txL, fontSize: 13 }}>لا يوجد مستخدمون</div>}
          </div>

          {/* User Detail */}
          <div>
            {su ? (function() {
              var u = su;
              var dL = (u.completedLessons || []).length;
              var dE = (u.completedExercises || []).length;
              var pct = Math.round((dL + dE) / 40 * 100);

              return (
                <div className="fu">
                  <Crd sx={{ marginBottom: 12, background: "linear-gradient(135deg," + C.pri + "," + C.priL + ")", color: "#fff", border: "none", padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div><h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 1 }}>{u.name}</h2><p style={{ opacity: 0.6, fontSize: 11 }}>@{sel} · {u.age} سنة · {ST[u.lifeStage]}</p></div>
                      <Btn onClick={function() { delUser(sel); }} v="err" sz="sm">حذف</Btn>
                    </div>
                    <div style={{ marginTop: 12 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.7, marginBottom: 4 }}><span>التقدم</span><span style={{ fontWeight: 800 }}>{pct}%</span></div><PB v={pct} color={C.gold} h={8} /></div>
                  </Crd>

                  <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
                    {[{ id: "overview", l: "نظرة عامة", i: "📊" }, { id: "answers", l: "الإجابات (" + aExs.length + ")", i: "📝" }, { id: "ai", l: "تحليل الرسالة", i: "✨" }].map(function(t) {
                      return <button key={t.id} onClick={function() { sTab(t.id); sAnsV(null); }} style={{ padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: tab === t.id ? C.pri : C.pri + "08", color: tab === t.id ? "#fff" : C.txM }}>{t.i} {t.l}</button>;
                    })}
                  </div>

                  {tab === "overview" && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                        <Stat icon="📚" value={dL + "/18"} label="دروس" color={C.pri} />
                        <Stat icon="✏️" value={dE + "/22"} label="تمارين" color={C.gold} />
                        <Stat icon="🎯" value={pct + "%"} label="تقدم" color={C.ok} />
                      </div>
                      <Crd>
                        {PHASES.map(function(ph) {
                          var pL = LESSONS.filter(function(l) { return l.p === ph.id; });
                          var pE = EX.filter(function(e) { return e.p === ph.id; });
                          var d = pL.filter(function(l) { return (u.completedLessons || []).indexOf(l.p + "-" + l.n) >= 0; }).length + pE.filter(function(e) { return (u.completedExercises || []).indexOf(e.id) >= 0; }).length;
                          var t = pL.length + pE.length;
                          return (
                            <div key={ph.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                              <span style={{ fontSize: 14 }}>{ph.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}><span style={{ fontWeight: 600, color: ph.color }}>{ph.title}</span><span style={{ color: C.txL }}>{d}/{t}</span></div>
                                <PB v={Math.round(d / t * 100)} color={ph.color} h={4} />
                              </div>
                              {d === t && <span style={{ fontSize: 11 }}>✅</span>}
                            </div>
                          );
                        })}
                      </Crd>
                    </div>
                  )}

                  {tab === "answers" && (
                    <div>
                      {aExs.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 36, color: C.txL }}>لم تُقدّم إجابات بعد</div>
                      ) : ansV ? (function() {
                        var exItem = EX.find(function(e) { return e.id === +ansV; });
                        var ea = ans[ansV] || {};
                        var phItem = PHASES.find(function(p) { return p.id === (exItem ? exItem.p : 0); });
                        return (
                          <div>
                            <Btn onClick={function() { sAnsV(null); }} v="ghost" sz="sm" sx={{ marginBottom: 8 }}>→ العودة</Btn>
                            <Crd sx={{ borderTop: "4px solid " + (phItem ? phItem.color : C.gold) }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <span style={{ fontSize: 28 }}>{exItem ? exItem.icon : "📝"}</span>
                                <div>
                                  <h3 style={{ color: C.pri, fontSize: 15, fontWeight: 800 }}>{exItem ? exItem.title : ""}</h3>
                                  <p style={{ color: C.txL, fontSize: 11 }}>{exItem ? exItem.sub : ""}</p>
                                </div>
                              </div>
                              <div style={{ background: C.gold + "08", borderRadius: 8, padding: "6px 12px", marginBottom: 14, display: "inline-block" }}>
                                <span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>🔒 للقراءة فقط — إجابات المستخدم</span>
                              </div>
                              {exItem && <ExReadOnly ex={exItem} answers={ea} />}
                            </Crd>
                          </div>
                        );
                      })() : aExs.map(function(entry3) {
                        var exId = entry3[0], ea2 = entry3[1];
                        var exItem2 = EX.find(function(e) { return e.id === +exId; });
                        var phItem2 = PHASES.find(function(p) { return p.id === (exItem2 ? exItem2.p : 0); });
                        var tA = Object.entries(ea2).filter(function(e) { return typeof e[1] === "string" && e[1].length > 0; });
                        var pv = tA[0] ? tA[0][1].slice(0, 90) : "";
                        return (
                          <Crd key={exId} onClick={function() { sAnsV(exId); }} sx={{ marginBottom: 7, padding: 14, cursor: "pointer" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 22 }}>{exItem2 ? exItem2.icon : "📝"}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                  <span style={{ fontWeight: 700, fontSize: 13, color: C.pri }}>{exItem2 ? exItem2.title : "تمرين"}</span>
                                  <Badge color={phItem2 ? phItem2.color : C.pri}>{phItem2 ? phItem2.title : ""}</Badge>
                                </div>
                                {pv && <p style={{ fontSize: 12, color: C.txM, lineHeight: 1.5, margin: 0 }}>«{pv}{pv.length >= 90 ? "..." : ""}»</p>}
                              </div>
                              <span style={{ color: C.gold, fontSize: 14, fontWeight: 700 }}>←</span>
                            </div>
                          </Crd>
                        );
                      })}
                    </div>
                  )}

                  {tab === "ai" && (
                    <div>
                      {aExs.length === 0 ? (
                        <Crd sx={{ textAlign: "center", padding: 36 }}>
                          <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
                          <p style={{ color: C.txL, fontSize: 14 }}>لا توجد إجابات بعد لتحليلها</p>
                          <p style={{ color: C.txL, fontSize: 12 }}>يجب أن يكمل المستخدم بعض التمارين أولاً</p>
                        </Crd>
                      ) : aiStatus === "idle" ? (
                        <div>
                          <Crd sx={{ background: "linear-gradient(135deg," + C.ph[7] + "," + C.ph[3] + ")", border: "none", textAlign: "center", padding: 28, marginBottom: 14 }}>
                            <div style={{ fontSize: 48, marginBottom: 10, animation: "fl 3s ease-in-out infinite" }}>✨</div>
                            <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 900, marginBottom: 6 }}>تحليل رسالة {u.name}</h3>
                            <p style={{ color: "rgba(255,255,255,.8)", fontSize: 13, marginBottom: 16, lineHeight: 1.8 }}>
                              الذكاء الاصطناعي سيحلل {aExs.length} تمرين مُكتمل ويصوغ رسالة شخصية بناءً على كل الإجابات
                            </p>
                            <Btn onClick={runAiAnalysis} v="gold" sz="lg">🔮 ابدأ تحليل الرسالة</Btn>
                          </Crd>
                          <Crd sx={{ padding: 16 }}>
                            <div style={{ fontSize: 12, color: C.txM, fontWeight: 700, marginBottom: 8 }}>📋 ملخص البيانات المتوفرة:</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <div style={{ background: "#fafaf7", borderRadius: 8, padding: 10, textAlign: "center" }}>
                                <div style={{ fontSize: 20, fontWeight: 900, color: C.gold }}>{aExs.length}</div>
                                <div style={{ fontSize: 11, color: C.txL }}>تمرين مُجاب</div>
                              </div>
                              <div style={{ background: "#fafaf7", borderRadius: 8, padding: 10, textAlign: "center" }}>
                                <div style={{ fontSize: 20, fontWeight: 900, color: C.pri }}>{Object.values(ans).reduce(function(s, v) { return s + Object.keys(v || {}).length; }, 0)}</div>
                                <div style={{ fontSize: 11, color: C.txL }}>إجابة إجمالية</div>
                              </div>
                            </div>
                          </Crd>
                        </div>
                      ) : aiStatus === "loading" ? (
                        <Crd sx={{ textAlign: "center", padding: 48 }}>
                          <div style={{ fontSize: 40, animation: "pl 1.5s infinite", marginBottom: 14 }}>🔮</div>
                          <h3 style={{ color: C.pri, fontSize: 16, fontWeight: 800, marginBottom: 6 }}>يحلل رحلة {u.name}...</h3>
                          <p style={{ color: C.txL, fontSize: 13 }}>يقرأ كل الإجابات ويستخلص الرسالة — لحظات</p>
                        </Crd>
                      ) : aiStatus === "error" ? (
                        <Crd sx={{ textAlign: "center", padding: 32 }}>
                          <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
                          <p style={{ color: C.err, fontSize: 14, marginBottom: 14 }}>حدث خطأ أثناء التحليل</p>
                          <Btn onClick={runAiAnalysis} v="gold" sz="sm">🔄 إعادة المحاولة</Btn>
                        </Crd>
                      ) : (
                        <div>
                          <Crd sx={{ borderTop: "4px solid " + C.gold, marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 28 }}>✨</span>
                                <div>
                                  <h3 style={{ color: C.pri, fontSize: 16, fontWeight: 900 }}>رسالة {u.name}</h3>
                                  <p style={{ color: C.txL, fontSize: 11 }}>تم التحليل بنجاح</p>
                                </div>
                              </div>
                              <Btn onClick={function() { sAiStatus("idle"); sAiResult(""); }} v="soft" sz="sm">🔄 إعادة</Btn>
                            </div>
                            <div style={{ background: "linear-gradient(135deg," + C.goldBg + "," + C.card + ")", borderRadius: 12, padding: 20, border: "1px solid " + C.gold + "20" }}>
                              <p style={{ fontSize: 14, lineHeight: 2.4, color: C.tx, whiteSpace: "pre-line", margin: 0 }}>{aiResult}</p>
                            </div>
                          </Crd>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })() : (
              <div style={{ textAlign: "center", padding: 44, color: C.txL }}><div style={{ fontSize: 40, marginBottom: 8 }}>👆</div><p>اختر مستخدماً</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ Main App ═══ */
export default function App() {
  const [auth, sAuth] = useState(null);
  const [ld, sLd] = useState(true);
  const [view, sV] = useState("dash");
  const [vd, sVd] = useState(null);
  const [exO, sExO] = useState(null);
  const [exS, sExS] = useState({});

  /* Fix mobile viewport */
  useEffect(function() {
    // Set viewport
    var existing = document.querySelector('meta[name="viewport"]');
    var content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
    if (existing) {
      existing.setAttribute("content", content);
    } else {
      var meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = content;
      document.head.appendChild(meta);
    }
    // Theme color for mobile browser bar
    var theme = document.querySelector('meta[name="theme-color"]');
    if (!theme) {
      theme = document.createElement("meta");
      theme.name = "theme-color";
      document.head.appendChild(theme);
    }
    theme.content = C.pri;
    // Mobile-first CSS fixes
    var style = document.createElement("style");
    style.textContent = [
      "html{touch-action:manipulation}",
      "*{-webkit-tap-highlight-color:transparent}",
      "body{position:relative;width:100%;overflow-x:hidden}",
      "input,textarea{border-radius:0;-webkit-appearance:none;appearance:none}",
    ].join("");
    document.head.appendChild(style);
  }, []);

  useEffect(function() {
    gU().then(function(u) {
      var changed = false;
      if (!u.admin) {
        u.admin = { password: "admin1234", name: "المشرف", age: 0, gender: "other", lifeStage: "mid", isAdmin: true, completedLessons: [], completedExercises: [], createdAt: Date.now(), lastActive: Date.now() };
        changed = true;
      }
      if (!u["m7md.abu.sneneh"]) {
        u["m7md.abu.sneneh"] = { password: "Allah19@", name: "M7md Abu Sneneh", age: 23, gender: "male", lifeStage: "young", completedLessons: [], completedExercises: [], createdAt: Date.now(), lastActive: Date.now() };
        changed = true;
      }
      if (changed) {
        sU(u).then(function() {
          console.log("✅ Users initialized in Supabase");
          sLd(false);
        });
      } else {
        console.log("✅ Users loaded from Supabase:", Object.keys(u).length, "users");
        sLd(false);
      }
    });
  }, []);

  function upU(ch) {
    gU().then(function(u) {
      var upd = Object.assign({}, u[auth.username], ch, { lastActive: Date.now() });
      u[auth.username] = upd;
      sU(u).then(function(ok) {
        if (ok) { console.log("✅ User updated:", auth.username); }
        sAuth(function(p) { return Object.assign({}, p, upd); });
      });
    });
  }

  function doneL(l) {
    var k = l.p + "-" + l.n;
    if ((auth.completedLessons || []).indexOf(k) < 0) { upU({ completedLessons: (auth.completedLessons || []).concat([k]) }); }
    sV("phase"); sVd(l.p);
  }

  function saveE(exItem, ans2) {
    gA(auth.username).then(function(c) {
      var updated = Object.assign({}, c, { [exItem.id]: ans2 });
      sA(auth.username, updated).then(function(ok) {
        if (ok) { console.log("✅ Answers saved for", auth.username, "exercise", exItem.id); }
        else { console.error("❌ Failed to save answers"); }
      });
      sExS(ans2);
    });
  }

  function doneE(exItem) {
    var p = auth.completedExercises || [];
    if (p.indexOf(exItem.id) < 0) { upU({ completedExercises: p.concat([exItem.id]) }); }
    sV("phase"); sVd(exItem.p);
  }

  function openE(e) {
    gA(auth.username).then(function(c) {
      sExS(c[e.id] || {});
      sExO(e);
      sV("exercise");
      sVd(e);
    });
  }

  function nav(v, d) { sV(v); sVd(d); window.scrollTo(0, 0); }

  if (ld) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "'Tajawal',sans-serif", direction: "rtl", background: C.pri }}>
      <style>{CSS_TEXT}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 22, margin: "0 auto 18px", background: "linear-gradient(135deg," + C.gold + "," + C.goldL + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, boxShadow: "0 8px 32px rgba(0,0,0,.3)", animation: "splashPulse 2s ease-in-out infinite" }}>🧭</div>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 900, marginBottom: 6 }}>رسالتك</h1>
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>جارٍ التحميل...</p>
      </div>
    </div>
  );

  if (!auth) return (<Login onLogin={function(u) { sAuth(u); sV("dash"); }} />);
  if (auth.isAdmin) return (<Admin onLogout={function() { sAuth(null); }} />);

  var isInner = view === "lesson" || view === "exercise";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Tajawal',sans-serif", direction: "rtl", paddingBottom: isInner ? 0 : 72 }}>
      <style>{CSS_TEXT}</style>

      {/* Native-style header for inner pages */}
      {isInner && (
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(245,243,238,.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderBottom: "0.5px solid rgba(0,0,0,.08)",
          padding: "0 16px", height: 48,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <button onClick={function() {
            if (view === "lesson" && vd) nav("phase", vd.p);
            else if (view === "exercise" && exO) nav("phase", exO.p);
          }} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
            color: C.gold, fontSize: 14, fontWeight: 700, fontFamily: "inherit",
            padding: "8px 4px"
          }}>→ رجوع</button>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.pri }}>
            {view === "lesson" && vd ? vd.title : ""}
            {view === "exercise" && exO ? exO.title : ""}
          </span>
          <div style={{ width: 60 }}></div>
        </div>
      )}

      {/* Page content with transition */}
      <div className="fadeScale" key={view + "-" + (vd && vd.id || vd || "")}>
        {view === "dash" && <Dash user={auth} onNav={nav} />}

        {view === "phases" && (
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "18px 14px 20px" }}>
            <h2 style={{ color: C.pri, fontSize: 17, fontWeight: 900, marginBottom: 14 }}>🗺️ مراحل الرحلة</h2>
            {PHASES.map(function(ph) {
              var pL = LESSONS.filter(function(l) { return l.p === ph.id; });
              var pE = EX.filter(function(e) { return e.p === ph.id; });
              var d = pL.filter(function(l) { return (auth.completedLessons || []).indexOf(l.p + "-" + l.n) >= 0; }).length + pE.filter(function(e) { return (auth.completedExercises || []).indexOf(e.id) >= 0; }).length;
              var pp = Math.round(d / (pL.length + pE.length) * 100);
              return (
                <Crd key={ph.id} onClick={function() { nav("phase", ph.id); }} sx={{ marginBottom: 7, padding: 16, cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 26 }}>{ph.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: ph.color, marginBottom: 2 }}>المرحلة {ph.id}: {ph.title}</div>
                      <div style={{ fontSize: 11, color: C.txL, marginBottom: 5 }}>{ph.sub}</div>
                      <PB v={pp} color={ph.color} h={4} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: ph.color }}>{pp}%</div>
                  </div>
                </Crd>
              );
            })}
          </div>
        )}

        {view === "phase" && <PhV phId={vd} user={auth} onL={function(l) { nav("lesson", l); }} onE={openE} onBack={function() { nav("dash"); }} />}
        {view === "lesson" && vd && <LsnV lesson={vd} onDone={function() { doneL(vd); }} onBack={function() { nav("phase", vd.p); }} />}
        {view === "exercise" && exO && <ExV ex={exO} saved={exS} user={auth} onSave={function(ans2) { saveE(exO, ans2); }} onDone={function() { doneE(exO); }} onBack={function() { nav("phase", exO.p); }} />}
      </div>

      {/* ═══ Bottom Tab Bar — like native app ═══ */}
      {!isInner && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
          background: "rgba(255,255,255,.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderTop: "0.5px solid rgba(0,0,0,.08)",
          paddingBottom: "env(safe-area-inset-bottom)",
          display: "flex", justifyContent: "space-around", alignItems: "center",
          height: 62
        }}>
          {[
            { v: "dash", i: "🏠", l: "الرئيسية" },
            { v: "phases", i: "🗺️", l: "الرحلة" },
          ].map(function(tab) {
            var active = view === tab.v || (tab.v === "phases" && view === "phase");
            return (
              <button key={tab.v} onClick={function() { nav(tab.v, null); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: "6px 20px", fontFamily: "inherit",
                  color: active ? C.gold : C.txL,
                  transition: "all .15s ease",
                  transform: "scale(1)"
                }}>
                <span style={{ fontSize: 22, lineHeight: 1, transition: "transform .15s", transform: active ? "scale(1.15)" : "scale(1)" }}>{tab.i}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, letterSpacing: ".3px" }}>{tab.l}</span>
                {active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, marginTop: 1 }} />}
              </button>
            );
          })}
          {/* Profile/logout button */}
          <button onClick={function() { sAuth(null); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "6px 20px", fontFamily: "inherit",
              color: C.txL, transition: "all .15s ease", transform: "scale(1)"
            }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>👤</span>
            <span style={{ fontSize: 10, fontWeight: 500 }}>خروج</span>
          </button>
        </div>
      )}
    </div>
  );
}
