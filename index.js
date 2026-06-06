// ... existing code ...
// ==========================================
// 3. القوائم (Menus)
// ==========================================
const mainMenu = Markup.keyboard([
    ['🩺 الفحوصات الطبية', '📄 الترجمة والوثائق'], 
    ['🎓 القبول الجامعي', '💰 التكاليف والمعيشة'], 
    ['🗣️ الدراسة والسفر', '📞 الدعم الفني']
]).resize();

const medicalMenu = Markup.keyboard([
// ... existing code ...
```

```javascript:YemenRusBot:bot/index.js
// ... existing code ...
// ==========================================
// 4. المنطق البرمجي (Routing)
// ==========================================
bot.start((ctx) => {
    const userName = ctx.from.first_name || 'عزيزي';
    ctx.reply(`مرحباً بك يا ${userName} في *دليل فائزين منح روسيا* 🇷🇺🎓\nاختر القسم الذي تريد الاستفسار عنه:`, { parse_mode: 'Markdown', ...mainMenu });
});
bot.hears('🔙 القائمة الرئيسية', (ctx) => ctx.reply('اختر القسم الذي تريد الاستفسار عنه 📌:', mainMenu));

bot.hears('📞 الدعم الفني', (ctx) => {
    ctx.reply('للتواصل مع الدعم الفني، اضغط على الزر أدناه للانتقال فوراً إلى الواتساب:', 
        Markup.inlineKeyboard([
            [Markup.button.url('📱 تواصل عبر واتساب', 'https://wa.me/967775777716')]
        ])
    );
});

// ربط الأزرار بالقوائم الفرعية
bot.hears('🩺 الفحوصات الطبية', (ctx) => ctx.reply('اختر سؤالك من قسم الفحوصات 🩺:', medicalMenu));
// ... existing code ...
```

```javascript:YemenRusBot:bot/index.js
// ... existing code ...
let pendingEdits = {};
bot.action('back_to_menu', (ctx) => { 
    ctx.answerCbQuery(); 
    ctx.reply('اختر القسم الذي تريد الاستفسار عنه 📌:', mainMenu); 
});

bot.action(/edit_(.+)/, (ctx) => { 
// ... existing code ...