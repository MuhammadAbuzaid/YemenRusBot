require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const http = require('http');
const mongoose = require('mongoose'); // أضفنا هذه المكتبة

const bot = new Telegraf(process.env.BOT_TOKEN);

// الاتصال بقاعدة البيانات (يقرأ الرابط من موقع Render)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ متصل بقاعدة البيانات بنجاح'))
  .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

// تعريف نموذج المستخدم لحفظهم في قاعدة البيانات
const UserSchema = new mongoose.Schema({ chatId: String });
const User = mongoose.model('User', UserSchema);

// وسيط (Middleware) لحفظ كل مستخدم جديد يتفاعل مع البوت تلقائياً
bot.use(async (ctx, next) => {
    if (ctx.chat) {
        const chatId = ctx.chat.id.toString();
        const exists = await User.findOne({ chatId });
        if (!exists) {
            await User.create({ chatId });
        }
    }
    return next();
});

const ADMIN_ID = '6151168428'; // تأكد أن هذا هو الـ ID الخاص بك
let pendingEdits = {};

// =========================================================================
// 1. القوائم (Menus) - (بقيت كما هي)
// =========================================================================
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

const docsMenu = Markup.keyboard([
    ['📂 ما هي الوثائق التي يجب ترجمتها إلى اللغة الروسية؟'],
    ['✒️ هل يُشترط ختم النتاريوس (Notarius) للترجمة في هذه المرحلة؟'],
    ['🎓 هل يجب تصديق الشهادة والجواز من وزارتي التربية والخارجية قبل الترجمة؟'],
    ['⬆️ أين أُرفق الملفات المترجمة في الموقع؟'],
    ['🏅 ماذا عن ختم (Apostille - الأبوستيل)؟'],
    ['🖋️ ما هي ورقة الموافقة على معالجة البيانات؟'],
    ['🔙 القائمة الرئيسية']
]).resize();

const admissionMenu = Markup.keyboard([
    ['🏢 متى أعرف الجامعة التي تم قبولي فيها؟'],
    ['🔄 هل يمكنني تغيير ترتيب الجامعات الآن أو بعد القبول؟'],
    ['🧪 هل يوجد اختبارات قبول أو مقابلات شخصية؟'],
    ['⚠️ ماذا يحدث إذا رفضتني الجامعة أو فشلت في اختبارها؟'],
    ['⏳ أنا في "قائمة الاحتياط"، هل هناك أمل لترقيتي لـ "أساسي"؟'],
    ['🔙 القائمة الرئيسية']
]).resize();

const financeMenu = Markup.keyboard([
    ['💵 هل المنحة الروسية ممولة بالكامل (شاملة السفر والمعيشة)؟'],
    ['✈️ كم التكلفة التقديرية للسفر إلى روسيا؟'],
    ['🛒 كم أحتاج مصروف شهري في روسيا؟'],
    ['💼 هل يمكنني العمل بجانب الدراسة لتوفير مصروفي؟'],
    ['💸 كيف يتم تحويل الأموال من اليمن إلى روسيا؟'],
    ['🔙 القائمة الرئيسية']
]).resize();

const studyMenu = Markup.keyboard([
    ['🏫 هل السنة التحضيرية (دراسة اللغة) مجانية؟'],
    ['🇬🇧 إذا اخترت الدراسة باللغة الإنجليزية، هل أنا ملزم بالسنة التحضيرية؟'],
    ['📜 ما هي شروط النجاح والاستمرار في الجامعة الروسية؟'],
    ['🔙 القائمة الرئيسية']
]).resize();

const answerKeyboard = (questionText) => Markup.inlineKeyboard([
    [Markup.button.callback('✏️ اقترح تعديل', `edit_${questionText.substring(0, 10)}`)],
    [Markup.button.callback('🔙 العودة للقائمة الرئيسية', 'back_to_menu')]
]);

// =========================================================================
// 2. الأوامر والإجابات
// =========================================================================
bot.start((ctx) => ctx.reply(`مرحباً بك في *دليل فائزين منح روسيا* 🇷🇺🎓`, { parse_mode: 'Markdown', ...mainMenu }));
bot.hears('🔙 القائمة الرئيسية', (ctx) => ctx.reply('القائمة الرئيسية 🏠:', mainMenu));

// إضافة أوامر الإدارة الجديدة
bot.command('stats', async (ctx) => {
    if (ctx.from.id.toString() === ADMIN_ID) {
        const count = await User.countDocuments();
        ctx.reply(`📊 عدد المشتركين في البوت: ${count} مستخدم.`);
    }
});

bot.command('broadcast', async (ctx) => {
    if (ctx.from.id.toString() === ADMIN_ID) {
        const message = ctx.message.text.replace('/broadcast', '').trim();
        if (!message) return ctx.reply('⚠️ اكتب الرسالة بعد الأمر: /broadcast نص الرسالة');
        const users = await User.find();
        ctx.reply(`🚀 جاري الإرسال لـ ${users.length} مستخدم...`);
        for (const user of users) {
            try {
                await bot.telegram.sendMessage(user.chatId, message);
                await new Promise(r => setTimeout(r, 100));
            } catch (e) { console.log(`خطأ إرسال لـ ${user.chatId}`); }
        }
        ctx.reply(`✅ تم الإرسال بنجاح.`);
    }
});

// ... (هنا ضع بقية `bot.hears` الخاصة بأسئلتك الطبية والجامعية كما كانت في ملفك)
// ملاحظة: لقد حذفتها من هنا لتوفير المساحة، لكن تأكد من وجودها في ملفك!

bot.hears('📞 تواصل مع الدعم', (ctx) => ctx.reply(`للتواصل: https://wa.me/967775777716`));

// معالجة الأزرار
bot.action('back_to_menu', (ctx) => { ctx.answerCbQuery(); ctx.reply('القائمة الرئيسية 🏠:', mainMenu); });
bot.action(/edit_(.+)/, (ctx) => {
    pendingEdits[ctx.chat.id] = ctx.match[1];
    ctx.answerCbQuery();
    ctx.reply('✏️ يرجى كتابة التعديل أو الاقتراح للإدارة:');
});

bot.on('text', (ctx) => {
    if (pendingEdits[ctx.chat.id]) {
        bot.telegram.sendMessage(ADMIN_ID, `⚠️ اقتراح تعديل من @${ctx.from.username || ctx.from.id}:\n${ctx.message.text}`);
        ctx.reply('✅ تم الإرسال للإدارة.');
        delete pendingEdits[ctx.chat.id];
    }
});

bot.launch();
http.createServer((req, res) => { res.write('YemenRusBot is alive!'); res.end(); }).listen(process.env.PORT || 8080);