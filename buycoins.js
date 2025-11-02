const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buycoins')
    .setDescription('عرض شراء النقاط (DevCoins) بالكريدت'),
  async execute(interaction) {

    const ownerId = '123456789012345678'; // 🔴 حط هنا ID حسابك انت (صاحب السيرفر)

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('💰 نظام شراء DevCoins')
      .setDescription('اختر العرض اللي يناسبك وادفع عن طريق الكريدت!')
      .addFields(
        { name: '💎 العروض المتوفرة', value: '100 نقطة = 100,000 كريدت\n1000 نقطة = 1,000,000 كريدت' },
        { name: '🧾 ملاحظة', value: 'بعد الدفع، يتم إرسال النقاط يدويًا من طرف صاحب السيرفر.' }
      )
      .setFooter({ text: 'DevMarket • نظام النقاط' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('buy_coins')
        .setLabel('🛒 شراء الآن')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};

// ⬇️ داخل نفس الملف أو في ملف listener للأزرار:

module.exports.buttonHandler = async (interaction) => {
  if (interaction.customId === 'buy_coins') {
    const ownerId = '123456789012345678'; // 🔴 نفس ID صاحب السيرفر
    const owner = `<@${ownerId}>`;

    const embed = new EmbedBuilder()
      .setColor('#00FF7F')
      .setTitle('💳 خطوات الشراء')
      .setDescription(`باش تشري النقاط، أرسل الكريدت لصاحب السيرفر:\n\n**1️⃣** استعمل الأمر التالي:\n\`/credit send ${owner} [المبلغ]\`\n\n**2️⃣** بعد الدفع، راسل ${owner} لتصلك النقاط 🎁`)
      .setFooter({ text: 'DevMarket • نظام الكريدت اليدوي' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
