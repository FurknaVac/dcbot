const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    Events 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Bot çalışınca terminalde bildirim ver
client.once(Events.ClientReady, c => {
    console.log(`Bot başarıyla aktif oldu: ${c.user.tag}`);
});

// 1. Yeni üye katıldığında otomatik rol ver ve butonlu mesaj gönder
client.on(Events.GuildMemberAdd, async (member) => {
    // --- OTOMATİK ROL VERME ---
    try {
        const roleId = '905119564487081984'; // owye rol ID'si
        const role = await member.guild.roles.fetch(roleId);
        
        if (role) {
            await member.roles.add(role);
            console.log(`[BAŞARILI] ${member.user.tag} kullanıcısına 'owye' rolü verildi.`);
        } else {
            console.log(`[HATA] '905119564487081984' ID'li rol sunucuda bulunamadı.`);
        }
    } catch (err) {
        console.error("[HATA] Rol verilirken bir sorun oluştu:", err.message);
    }

    // --- HOŞ GELDİN MESAJI VE BUTON ---
    const channel = member.guild.channels.cache.get('1014301242371100842'); 
    if (!channel) return;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('set_nickname_btn')
            .setLabel('İsmini Gir')
            .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
        content: `Aramıza hoş geldin ${member}! Sunucuda adının güncellenmesi için aşağıdaki butona basıp adını yazabilirsin.`,
        components: [row]
    });
});

// 2. Butona basıldığında veya Form gönderildiğinde çalışacak kısım
client.on(Events.InteractionCreate, async (interaction) => {
    
    // --- BUTONA BASILDIĞINDA FORM (POPUP / MODAL) AÇ ---
    if (interaction.isButton() && interaction.customId === 'set_nickname_btn') {
        const modal = new ModalBuilder()
            .setCustomId('nickname_modal')
            .setTitle('Kayıt Formu');

        const nameInput = new TextInputBuilder()
            .setCustomId('user_real_name')
            .setLabel('İsminiz nedir?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Örn: Furkan')
            .setRequired(true)
            .setMaxLength(20);

        const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }

    // --- FORM DOLDURULUP GÖNDERİLDİĞİNDE ---
    if (interaction.isModalSubmit() && interaction.customId === 'nickname_modal') {
        const inputName = interaction.fields.getTextInputValue('user_real_name');
        
        // Kullanıcının o anki sunucudaki görünen adı (displayName) alınıyor
        const currentDisplayName = interaction.member.displayName; 
        const newNickname = `${inputName} | ${currentDisplayName}`;

        try {
            // Kullanıcının sunucudaki rumuzunu değiştir
            await interaction.member.setNickname(newNickname);

            // Başarılı yanıtını gönder
            await interaction.reply({ 
                content: `Kayıt başarılı! İsmin **${newNickname}** olarak güncellendi.`, 
                ephemeral: true 
            });

            // Butonun bulunduğu karşılama mesajını sil
            if (interaction.message) {
                await interaction.message.delete().catch(() => {});
            }

        } catch (error) {
            console.error("[HATA] İsim değiştirilemedi:", error.message);
            await interaction.reply({ 
                content: 'İsmin değiştirilirken bir hata oluştu. (Botun rolü kullanıcıdan altta olabilir veya yetkisi yetmiyor olabilir).', 
                ephemeral: true 
            });
        }
    }
});

const token = process.env.DISCORD_TOKEN;
client.login(token);
