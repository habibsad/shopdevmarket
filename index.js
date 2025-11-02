require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const prefix = "!";
const currency = "DevCoins";

// ملفات البيانات
const balancesFile = "./balances.json";
const storeFile = "./store.json";

// تحميل البيانات أو إنشاءها
let balances = fs.existsSync(balancesFile)
    ? JSON.parse(fs.readFileSync(balancesFile))
    : {};
let store = fs.existsSync(storeFile)
    ? JSON.parse(fs.readFileSync(storeFile))
    : {};

function saveData() {
    fs.writeFileSync(balancesFile, JSON.stringify(balances, null, 2));
    fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

// البوت جاهز
client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setActivity("DevMarket 💰");
});

// listener للأوامر والرسائل
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    const ownerId = '123456789012345678'; // 🔴 حط ID حسابك هنا

    // 💰 الرصيد
    if (cmd === "balance") {
        const balance = balances[message.author.id] || 0;
        return message.reply(`💰 You have **${balance} ${currency}**`);
    }

    // 🪙 إضافة كريدتس (Admins only)
    if (cmd === "addcoins") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return message.reply("❌ You don't have permission.");

        const target = message.mentions.users.first();
        const amount = parseInt(args[1]);
        if (!target || isNaN(amount)) return message.reply("❌ Usage: !addcoins @user 100");

        balances[target.id] = (balances[target.id] || 0) + amount;
        saveData();

        return message.reply(`✅ Added ${amount} ${currency} to ${target.username}`);
    }

    // 🛒 عرض المتجر
    if (cmd === "store") {
        let reply = "🛍️ **Available Products:**\n";
        for (const key in store) {
            reply += `\n**${store[key].name}** — ${store[key].price} ${currency}\n🔹 ID: \`${key}\``;
        }
        return message.reply(reply);
    }

    // 💵 شراء منتج
    if (cmd === "buy") {
        const id = args[0];
        if (!id || !store[id]) return message.reply("❌ Invalid product ID. Use `!store` to see items.");

        const product = store[id];
        const balance = balances[message.author.id] || 0;

        if (balance < product.price)
            return message.reply(`❌ You need ${product.price - balance} more ${currency}.`);

        balances[message.author.id] -= product.price;
        saveData();

        if (fs.existsSync(product.file)) {
            await message.author.send({
                content: `✅ You bought **${product.name}** for ${product.price} ${currency}`,
                files: [product.file]
            });
        } else {
            await message.author.send(`✅ You bought **${product.name}**, but the file was not found.`);
        }

        return message.reply(`✅ Purchase successful! Check your DMs.`);
    }

    // ➕ إضافة منتج جديد
    if (cmd === "addproduct") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return message.reply("❌ You don't have permission.");

        const [id, nameQuoted, priceArg, fileName] = args;
        if (!id || !nameQuoted || !priceArg || !fileName)
            return message.reply("❌ Usage: !addproduct <id> \"<name>\" <price> <fileName>");

        const price = parseInt(priceArg);
        if (isNaN(price)) return message.reply("❌ Invalid price.");

        const name = nameQuoted.replace(/['"]+/g, "");
        store[id] = { name, price, file: fileName };
        saveData();

        return message.reply(`✅ Product **${name}** added for ${price} ${currency}!`);
    }

    // 🔁 تحويل DevCoins بين الأعضاء
    if (cmd === "pay") {
        const target = message.mentions.users.first();
        const amount = parseInt(args[1]);
        if (!target || isNaN(amount) || amount <= 0)
            return message.reply("❌ Usage: !pay @user 100");

        const senderBalance = balances[message.author.id] || 0;
        if (senderBalance < amount)
            return message.reply("❌ You don't have enough coins.");

        balances[message.author.id] = senderBalance - amount;
        balances[target.id] = (balances[target.id] || 0) + amount;
        saveData();

        return message.reply(`✅ You sent **${amount} ${currency}** to ${target.username}`);
    }

    // 🏆 Top 10 الأغنى
    if (cmd === "top") {
        const sorted = Object.entries(balances).sort((a,b) => b[1]-a[1]).slice(0,10);
        if (sorted.length === 0) return message.reply("📉 No one has any coins yet!");

        let reply = "🏆 **Top 10 Richest Members:**\n";
        for (let i=0;i<sorted.length;i++){
            const userId = sorted[i][0];
            const amount = sorted[i][1];
            const user = await client.users.fetch(userId).catch(()=>null);
            reply += `\n${i+1}. **${user ? user.username : "Unknown"}** — ${amount} ${currency}`;
        }
        return message.reply(reply);
    }

    // 🔹 إغلاق التذكرة
    if (cmd === "close") {
        if (!message.channel.name.startsWith("ticket-"))
            return message.reply('❌ هذا الأمر يمكن استخدامه فقط داخل تذاكر الشراء.');

        if (message.author.id !== ownerId && !message.channel.name.includes(message.author.username)) {
            return message.reply('❌ لا يمكنك إغلاق تذكرة لا تخصك.');
        }

        await message.channel.delete()
            .then(()=>console.log(`Ticket ${message.channel.name} deleted.`))
            .catch(console.error);
    }

    // 🔹 الأمر الجديد !buycoinsmessage
    if (cmd === "buycoinsmessage") {
        const channelMention = message.mentions.channels.first();
        if (!channelMention) return message.reply("❌ حدد روم باستخدام @روم");

        const channel = channelMention;

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('💰 اشترِ DevCoins الآن!')
            .setDescription('اختر العرض اللي يناسبك واضغط على الزر لفتح تذكرة شراء النقاط')
            .addFields(
                { name: '💎 العروض المتوفرة', value: '100 نقطة = 100,000 كريدت\n1000 نقطة = 1,000,000 كريدت' },
                { name: '⚠️ ملاحظة', value: 'بعد الضغط على الزر، يتم فتح تذكرة خاصة بك لتتم عملية الشراء.' }
            )
            .setFooter({ text: 'DevMarket • نظام شراء النقاط' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('🛒 شراء الآن')
                .setStyle(ButtonStyle.Success)
        );

        await channel.send({ embeds: [embed], components: [row] });
        return message.reply({ content: `✅ تم نشر رسالة الشراء في ${channel}`, ephemeral: true });
    }
});

// 💳 زر فتح تذكرة شراء DevCoins
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const ownerId = '1388906700064555050'; // 🔴 حط ID حسابك هنا
    if (interaction.customId === 'open_ticket') {
        const guild = interaction.guild;
        const user = interaction.user;

        const ticketChannel = await guild.channels.create({
            name: `ticket-${user.username}`,
            type: 0, // Text channel
            topic: `تذكرة شراء من ${user.tag}`,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                { id: ownerId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            ],
        });

        const embed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle('🎟️ تذكرة شراء DevCoins')
            .setDescription(`👋 مرحبًا ${user.username}!\n\nانسخ الكود التالي لتحويل الكريدت لصاحب السيرفر:\n\`\`\`c  <@${ownerId}> [المبلغ]\`\`\`\n\nبعد التحويل، انتظر المسؤول ليمنحك النقاط ✅`)
            .setFooter({ text: 'DevMarket • نظام الشراء اليدوي' })
            .setTimestamp();

        await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed] });
        await interaction.reply({ content: `✅ تم فتح تذكرتك بنجاح في ${ticketChannel}`, ephemeral: true });
    }
});

client.login(process.env.TOKEN);
