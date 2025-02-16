const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent] });

const PREFIX = '!';
const warnDB = 'warnings.json';
if (!fs.existsSync(warnDB)) fs.writeFileSync(warnDB, '{}');

client.once('ready', () => console.log(`${client.user.tag} è online!`));

client.on('messageCreate', async message => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;
    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    // Comando ban
    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply("Non hai i permessi!");
        const user = message.mentions.members.first();
        if (!user) return message.reply("Menziona un utente!");
        await user.ban();
        message.channel.send(`${user.user.tag} è stato bannato.`);
    }

    // Comando kick
    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return message.reply("Non hai i permessi!");
        const user = message.mentions.members.first();
        if (!user) return message.reply("Menziona un utente!");
        await user.kick();
        message.channel.send(`${user.user.tag} è stato kickato.`);
    }

    // Comando warn
    if (command === 'warn') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply("Non hai i permessi!");
        const user = message.mentions.users.first();
        if (!user) return message.reply("Menziona un utente!");
        const warnings = JSON.parse(fs.readFileSync(warnDB));
        warnings[user.id] = (warnings[user.id] || 0) + 1;
        fs.writeFileSync(warnDB, JSON.stringify(warnings));
        message.channel.send(`${user.tag} ha ricevuto un warn! Totale: ${warnings[user.id]}`);
    }

    // Comando clear
    if (command === 'clear') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply("Non hai i permessi!");
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) return message.reply("Inserisci un numero tra 1 e 100.");
        await message.channel.bulkDelete(amount + 1, true);
        message.channel.send(`Eliminati ${amount} messaggi!`).then(msg => setTimeout(() => msg.delete(), 5000));
    }

    // Comando !close per chiudere il ticket
    if (command === 'close') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply("Non hai i permessi per chiudere i ticket.");
        }

        const channel = message.channel;
        if (!channel.name.startsWith('ticket-')) {
            return message.reply("Questo non è un ticket valido.");
        }

        await channel.delete();
        message.reply("Il ticket è stato chiuso.");
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // Apertura del ticket
    if (interaction.customId === 'open_ticket') {
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: 0, // 0 è il tipo di canale testo
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] }
            ]
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim Ticket').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Chiudi Ticket').setStyle(ButtonStyle.Danger)
        );

        channel.send({ content: `${interaction.user}, descrivi il tuo problema.`, components: [row] });
        interaction.reply({ content: `Ticket creato: ${channel}`, ephemeral: true });
    }

    // Reclamo del ticket
    if (interaction.customId === 'claim_ticket') {
        const channel = interaction.channel;
        if (!channel) return;
        await channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true, ManageChannels: true });
        interaction.reply({ content: `${interaction.user} ha preso in carico il ticket!`, ephemeral: false });
    }

    // Chiusura del ticket tramite pulsante
    if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;
        if (!channel) return;
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: "Non hai i permessi per chiudere questo ticket.", ephemeral: true });
        }
    
        // Elimina il canale del ticket
        await channel.delete();
    
        // Rispondi all'interazione con un messaggio che non coinvolga il canale eliminato
        interaction.reply({ content: `Il ticket ${channel.name} è stato chiuso.`, ephemeral: true });
    }
});

client.on('messageCreate', async message => {
    // Comando per creare un ticket
    if (message.content === '!ticket') {
        const embed = new EmbedBuilder().setTitle('Sistema Ticket').setDescription('Clicca il bottone per aprire un ticket.');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_ticket').setLabel('Apri Ticket').setStyle(ButtonStyle.Primary)
        );
        message.channel.send({ embeds: [embed], components: [row] });
    }
});



client.login('MTM0MDMwNjIxMTI5OTM5MzU2Ng.GYunhy.B54xxcyPCppNBOLZktpcmAOLQ2kFUJW-hggRQA');
