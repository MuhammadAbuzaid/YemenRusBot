// استيراد المكتبات الأساسية
require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const http = require('http');
const mongoose = require('mongoose');

// إعداد البوت
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = '6151168428'; 

// ==========================================
// 1. الاتصال بقاعدة البيانات
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ متصل بقاعدة البيانات بنجاح'))
    .catch(err => console.error('❌ خطأ في الاتصال:', err));

const UserSchema = new mongoose.Schema({ chatId: String });
const User = mongoose.model('User', UserSchema);

bot.use(async (ctx, next) => {
    if (ctx.chat) {
        const chatId = ctx.chat.id.toString();
        const exists = await User.findOne({ chatId });
        if (!exists) { await User.create({ chatId }); }
    }
    return next();
});

// ==========================================
// 2. منطقة البيانات (موسعة لسهولة التعديل)
// ==========================================
const faqData = {

    '🩸 ما هي الفحوصات الطبية المطلوبة للمرحلة الثانية؟': { 
        answer: "🩺 *الفحوصات المطلوبة:*\n• فحص دم شامل (CBC).\n• فحص فيروسات (Syphilis).\n• فحص التهاب الكبد الوبائي (B و C).\n• فحص السل الرئوي (Tuberculosis - TB) أو أشعة للصدر.", 
        photo: null 
    },

    '📝 هل يوجد نموذج طبي محدد من المنحة يجب تعبئته؟': { 
        answer: "لا يوجد نموذج محدد، يمكنك الذهاب إلى أي مستشفى حكومي وطلب فحوصات 'منحة دراسية'.", 
        photo: null 
    },

    '✅ ما هي الشروط التي يجب توفرها في ورقة الفحص الطبي؟': { 
        answer: "📌 *شروط الفحص الطبي:*\n1. يجب أن يكون مطبوعاً بالكمبيوتر.\n2. يجب أن يحتوي على قيم عددية (أرقام).", 
        photo: null 
    },

    '🇷🇺 هل أترجم الفحوصات الطبية إلى اللغة الروسية؟': { 
        answer: "لا، الفحوصات الطبية تُستخرج باللغة الإنجليزية فقط وتُرفق كما هي.", 
        photo: null 
    },

    '🏛️ هل يجب تصديق الفحوصات من وزارة الصحة والخارجية الآن؟': { 
        answer: "لا، للمرحلة الحالية يكفي ختم المستشفى والطبيب.", 
        photo: null 
    },

    '📅 كم مدة صلاحية الفحص الطبي؟': { 
        answer: "مدة صلاحية الفحص الطبي هي 6 أشهر فقط.", 
        photo: null 
    },

    '📂 ما هي الوثائق التي يجب ترجمتها إلى اللغة الروسية؟': { 
        answer: "📄 *الوثائق المطلوبة للترجمة:*\n1. جواز السفر.\n2. الوثائق التعليمية (شهادة الثانوية/البكالوريوس).", 
        photo: null 
    },

    '🏢 متى أعرف الجامعة التي تم قبولي فيها؟': { 
        answer: "سيتم تحديد ذلك في 'مرحلة الأسهم' (المرحلة الثالثة وما بعدها).", 
        photo: null 
    },

    '💵 هل المنحة الروسية ممولة بالكامل (شاملة السفر والمعيشة)؟': { 
        answer: "لا. المنحة توفر لك: 'مقعد دراسي مجاني' و'سكن جامعي'.", 
        photo: null 
    }

};

// ==========================================
// 3. القوائم (Menus)
// ==========================================
const mainMenu = Markup.keyboard([
    ['🩺 الفحوصات الطبية', '📄 الترجمة والوثائق'], 
    ['🎓 القبول الجامعي', '💰 التكاليف والمعيشة'], 
    ['🗣️ الدراسة والتحضيري', '📞 تواصل مع الدعم']
]).resize();

const medicalMenu = Markup.keyboard([
    ['🩸 ما هي الفحوصات الطبية المطلوبة للمرحلة الثانية؟'], 
    ['📝 هل يوجد نموذج طبي محدد من المنحة يجب تعبئته؟'], 
    ['✅ ما هي الشروط التي يجب توفرها في ورقة الفحص الطبي؟'], 
    ['🇷🇺 هل أترجم الفحوصات الطبية إلى اللغة الروسية؟'], 
    ['🏛️ هل يجب تصديق الفحوصات من وزارة الصحة والخارجية الآن؟'], 
    ['📅 كم مدة صلاحية الفحص الطبي؟'],
    ['🔙 القائمة الرئيسية']
]).resize();

// ==========================================
// 4. المنطق البرمجي
// ==========================================
bot.start((ctx) => ctx.reply(`مرحباً بك في *دليل فائزين منح روسيا* 🇷🇺🎓`, { parse_mode: 'Markdown', ...mainMenu }));
bot.hears('🔙 القائمة الرئيسية', (ctx) => ctx.reply('القائمة الرئيسية 🏠:', mainMenu));

// ربط الزر بالقائمة
bot.hears('🩺 الفحوصات الطبية', (ctx) => ctx.reply('اختر سؤالك:', medicalMenu));

// تشغيل الرد التلقائي
for (const questionText in faqData) {
    bot.hears(questionText, async (ctx) => {
        const item = faqData[questionText];
        if (item.photo) {
            await ctx.replyWithPhoto(item.photo, { caption: item.answer, parse_mode: 'Markdown', ...answerKeyboard(questionText) });
        } else {
            await ctx.reply(item.answer, { parse_mode: 'Markdown', ...answerKeyboard(questionText) });
        }
    });
}

const answerKeyboard = (q) => Markup.inlineKeyboard([
    [Markup.button.callback('✏️ اقترح تعديل', `edit_${q.substring(0, 10)}`)],
    [Markup.button.callback('🔙 القائمة الرئيسية', 'back_to_menu')]
]);

// ==========================================
// 5. أوامر الإدارة
// ==========================================
bot.command('stats', async (ctx) => { if (ctx.from.id.toString() === ADMIN_ID) { const count = await User.countDocuments(); ctx.reply(`📊 عدد المشتركين: ${count}`); } });
bot.command('broadcast', async (ctx) => { if (ctx.from.id.toString() === ADMIN_ID) { const msg = ctx.message.text.replace('/broadcast', '').trim(); if (!msg) return; const users = await User.find(); for (const u of users) { try { await bot.telegram.sendMessage(u.chatId, msg); await new Promise(r => setTimeout(r, 100)); } catch (e) {} } ctx.reply(`✅ تم الإرسال.`); } });

let pendingEdits = {};
bot.action('back_to_menu', (ctx) => { ctx.answerCbQuery(); ctx.reply('القائمة الرئيسية 🏠:', mainMenu); });
bot.action(/edit_(.+)/, (ctx) => { pendingEdits[ctx.chat.id] = ctx.match[1]; ctx.answerCbQuery(); ctx.reply('✏️ اكتب الاقتراح:'); });
bot.on('text', (ctx) => { 
    if (pendingEdits[ctx.chat.id]) { 
        bot.telegram.sendMessage(ADMIN_ID, `⚠️ اقتراح من @${ctx.from.username || ctx.from.id}:\n${ctx.message.text}`); 
        ctx.reply('✅ تم الإرسال.'); 
        delete pendingEdits[ctx.chat.id]; 
    } 
});

bot.launch();
http.createServer((req, res) => { res.write('YemenRusBot is alive!'); res.end(); }).listen(process.env.PORT || 8080);