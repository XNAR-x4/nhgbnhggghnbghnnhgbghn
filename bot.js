const Discord = require('discord.js');
const { Client, Util } = require('discord.js');
const client = new Discord.Client();
const { PREFIX, GOOGLE_API_KEY } = require('./config');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const youtube = new YouTube(GOOGLE_API_KEY);

const queue = new Map();










client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
client.user.setGame(`✧ s!help ✧`,"http://twitch.tv/S-F")
  console.log('')
  console.log('')
  console.log('╔[═════════════════════════════════════════════════════════════════]╗')
  console.log(`[Start] ${new Date()}`);
  console.log('╚[═════════════════════════════════════════════════════════════════]╝')
  console.log('')
  console.log('╔[════════════════════════════════════]╗');
  console.log(`Logged in as * [ " ${client.user.username} " ]`);
  console.log('')
  console.log('Informations :')
  console.log('')
  console.log(`servers! [ " ${client.guilds.size} " ]`);
  console.log(`Users! [ " ${client.users.size} " ]`);
  console.log(`channels! [ " ${client.channels.size} " ]`);
  console.log('╚[════════════════════════════════════]╝')
  console.log('')
  console.log('╔[════════════]╗')
  console.log(' Bot Is Online')
  console.log('╚[════════════]╝')
  console.log('')
  console.log('')
});






client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => console.log('Yo this ready!'));

// client.on('disconnect', () => console.log('I just disconnected, making sure you know, I will reconnect now...'));

// client.on('reconnecting', () => console.log('I am reconnecting now!'));

client.on('message', async msg => { // eslint-disable-line
    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(PREFIX)) return undefined;

    const args = msg.content.split(' ');
    const searchString = args.slice(1).join(' ');
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(msg.guild.id);

    let command = msg.content.toLowerCase().split(" ")[0];
    command = command.slice(PREFIX.length)

    if (command === `p`) {
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) return msg.channel.send('عليك أن تكون في قناة صوتية !');
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has('CONNECT')) {
            return msg.channel.send('لا أستطيع أن أتكلم في هذه القناة الصوتية، تأكد من أن لدي الصلاحيات الازمة !');
        }
        if (!permissions.has('SPEAK')) {
            return msg.channel.send('لا أستطيع أن أتكلم في هذه القناة الصوتية، تأكد من أن لدي الصلاحيات الازمة !');
        }
        if (!permissions.has('EMBED_LINKS')) {
            return msg.channel.sendMessage("**لا يوجد لدي صلاحيات `EMBED LINKS`**")
        }

        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
            }
            return msg.channel.send(` **${playlist.title}** تم اضافة القائمه!`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 5);
                    let index = 0;
                    const embed1 = new Discord.RichEmbed()
                        .setDescription(`**اختار رقم المقطع** :
${videos.map(video2 => `[**${++index} **] \`${video2.title}\``).join('\n')}`)
                        .setFooter("")
                    msg.channel.sendEmbed(embed1).then(message => { message.delete(20000) })

                    // eslint-disable-next-line max-depth
                    try {
                        var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                            maxMatches: 1,
                            time: 10000,
                            errors: ['time']
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send('لم يتم تحديد العدد لتشغيل المقطع.');
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send(':X: لم أستطع الحصول على أية نتائج بحث.');
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }
    } else if (command === `s`) {
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
        if (!serverQueue) return msg.channel.send('There is nothing playing that I could skip for you.');
        serverQueue.connection.dispatcher.end('Skip command has been used!');
        return undefined;
    } else if (command === `stop`) {
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
        if (!serverQueue) return msg.channel.send('There is nothing playing that I could stop for you.');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('Stop command has been used!');
        return undefined;
    } else if (command === `vol`) {
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
        if (!serverQueue) return msg.channel.send('There is nothing playing.');
        if (!args[1]) return msg.channel.send(`:loud_sound: Current volume is **${serverQueue.volume}**`);
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return msg.channel.send(`:speaker: تم تغير الصوت الي **${args[1]}**`);
    } else if (command === `np`) {
        if (!serverQueue) return msg.channel.send('لا يوجد شيء حالي ف العمل.');
        const embedNP = new Discord.RichEmbed()
            .setDescription(`:notes: الان يتم تشغيل: **${serverQueue.songs[0].title}**`)
        return msg.channel.sendEmbed(embedNP);
    } else if (command === `queue`) {

        if (!serverQueue) return msg.channel.send('There is nothing playing.');
        let index = 0;
        const embedqu = new Discord.RichEmbed()
            .setDescription(`**Songs Queue**
${serverQueue.songs.map(song => `**${++index} -** ${song.title}`).join('\n')}
**الان يتم تشغيل** ${serverQueue.songs[0].title}`)
        return msg.channel.sendEmbed(embedqu);
    } else if (command === `pause`) {
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return msg.channel.send('تم إيقاف المقطع مؤقتا!');
        }
        return msg.channel.send('There is nothing playing.');
    } else if (command === "resume") {
        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send('استأنفت المقطع  !');
        }
        return msg.channel.send('لا يوجد شيء حالي في العمل.');
    }

    return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id);
    console.log(video);

    //	console.log('yao: ' + Util.escapeMarkdown(video.thumbnailUrl));
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        queue.set(msg.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`I could not join the voice channel: ${error}`);
            queue.delete(msg.guild.id);
            return msg.channel.send(`I could not join the voice channel: ${error}`);
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        if (playlist) return undefined;
        else return msg.channel.send(` **${song.title}** تم اضافه المقطع الي القائمة!`);
    }
    return undefined;
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    console.log(serverQueue.songs);

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', reason => {
            if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
            else console.log(reason);
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send(`بدء تشغيل: **${song.title}**`);
}
client.on('message', message => {
    if (message.content.startsWith("s!avatar")) {
        var mentionned = message.mentions.users.first();
        var x5bzm;
        if (mentionned) {
            var x5bzm = mentionned;
        } else {
            var x5bzm = message.author;

        }
        const embed = new Discord.RichEmbed()
            .setColor("RANDOM")
            .setImage(`${x5bzm.avatarURL}`)
        message.channel.sendEmbed(embed);
    }
});
client.on('message', message => {
    if (message.content.startsWith("s!bot")) {
        message.channel.send({
            embed: new Discord.RichEmbed()
                .setAuthor(client.user.username, client.user.avatarURL)
                .setThumbnail(client.user.avatarURL)
                .setColor('RANDOM')
                .setTitle('``TJM ~ BOT#0395`` ')
                .addField('**سرعة الاتصال📡**', `${Date.now() - message.createdTimestamp}` + ' ms')
                .addField('**الذاكرة المستخدمة 💾**', `${(process.memoryUsage().rss / 1000000).toFixed()}MB`, true)
                .addField('**استخدام المعالج💿**', `${(process.cpuUsage().rss / 10000).toFixed()}%`, true)
                .addField('``الاسم``', `[ ${client.user.tag} ]`, true)
                .addField('``الايدي 🆔 ``', `[ ${client.user.id} ]`, true)
                .addField('``مفتاح التشغيل 🔑 ``', `s!`, true)
                .addField('``اللغة المستخدمة 💬 ``', `[ Java Script ]`, true)
                .setFooter('By | @XNAR-x4#9065 ')
        })
    }
});

client.on('message', message => {
    if (message.content.startsWith('s!movall')) {
        if (!message.member.hasPermission("MOVE_MEMBERS")) return message.channel.send('**لايوجد لديك صلاحية سحب الأعضاء**');
        if (!message.guild.member(client.user).hasPermission("MOVE_MEMBERS")) return message.reply("**لايوجد لدي صلاحية السحب**");
        if (message.member.voiceChannel == null) return message.channel.send(`**الرجاء الدخول لروم صوتي**`)
        var author = message.member.voiceChannelID;
        var m = message.guild.members.filter(m => m.voiceChannel)
        message.guild.members.filter(m => m.voiceChannel).forEach(m => {
            m.setVoiceChannel(author)
        })
        message.channel.send(`**تم سحب جميع الأعضاء إليك**`)


    }
});

client.on('message', message => {
    if (message.author.id === client.user.id) return;
    if (message.guild) {
        let embed = new Discord.RichEmbed()
        let args = message.content.split(' ').slice(1).join(' ');
        if (message.content.split(' ')[0] == 's!br') {
            if (!args[1]) {
                message.channel.send("***broadcast <message>**");
                return;
            }
            message.guild.members.forEach(m => {
                if (!message.member.hasPermission('ADMINISTRATOR')) return;
                var bc = new Discord.RichEmbed()
                    .addField('» المرسل : ', `${message.author.username}#${message.author.discriminator}`)
                    .addField(' » 📋| الرسالة : ', args)
                    .setColor('#ff0000')
                // m.send(`[${m}]`);
                m.send(`${m}`, { embed: bc });
            });
        }
    } else {
        return;
    }
});
client.on('guildMemberAdd', member => {
    let channel = member.guild.channels.find('name', 'welcome');
    let memberavatar = member.user.avatarURL
    if (!channel) return;
    let embed = new Discord.RichEmbed()
        .setColor('RANDOM')
        .setThumbnail(memberavatar)
        .addField('🏷️ | الأسم :  ', `${member}`)
        .addField('📢 |Welcome to TJM  ', `, ${member}`)
        .addField('➡| انت العضو رقم', `${member.guild.memberCount}`)

        .addField(' الـسيرفر', `${member.guild.name}`, true)

        .setFooter(`${member.guild.name}`)
        .setTimestamp()

    channel.sendEmbed(embed);
});
client.on('guildMemberRemove', member => {
    var embed = new Discord.RichEmbed()
        .setAuthor(member.user.username, member.user.avatarURL)
        .setThumbnail(member.user.avatarURL)
        .setTitle(`غادر من السيرفر`)
        .setDescription(`تشرفنا بك `)
        .addField('👤   تبقي', `**[ ${member.guild.memberCount} ]**`, true)
        .setColor('RED')
        .setFooter(`==== نــتــمــنــآ لــكــم آســتــمـــتــآع ====`, 'https://cdn.discordapp.com/attachments/456405370819051532/462721060379557908/smiling-face-with-smiling-eyes_1f60a.png')

    var channel = member.guild.channels.find('name', 'welcome')
    if (!channel) return;
    channel.send({ embed: embed });
});
client.on("message", message => {
    if (!message.channel.guild) return;
    if (message.author.bot) return;
    if (message.content === "s!image") {
        const embed = new Discord.RichEmbed()

            .setTitle(`** ${message.guild.name} **هاذي هي صورة سيرفر`)
            .setAuthor(message.author.username, message.guild.iconrURL)
            .setColor(0x164fe3)
            .setImage(message.guild.iconURL)
            .setURL(message.guild.iconrURL)
            .setTimestamp()

        message.channel.send({ embed });
    }
});
client.on("message", async message => {
    if (message.content === "s!server") {
        if (!message.channel.guild) return;
        const millis = new Date().getTime() - message.guild.createdAt.getTime();
        const now = new Date();

        const verificationLevels = ['None', 'Low', 'Medium', 'Insane', 'Extreme'];
        const days = millis / 1000 / 60 / 60 / 24;
        let roles = client.guilds.get(message.guild.id).roles.map(r => r.name);
        var embed = new Discord.RichEmbed()
            .setAuthor(message.guild.name, message.guild.iconURL)
            .addField("**🆔 ايدي السيرفر**", "**" + message.guild.id + "**", true)
            .addField("**👑 صاحب السيرفر**", "**" + message.guild.owner + "**", true)
            .addField("**🌍 موقع السيرفر **", "**" + message.guild.region + "**", true)
            .addField('**🔴 عدد الاعضاء**', `[** ${message.guild.memberCount} **]`, true)
            .addField('**🔵 عدد الاعضاء الاونلاين**', `[** ${message.guild.members.filter(m => m.presence.status == 'online').size} **]`, true)
            .addField('**💬 عدد الرومات الكتابية **', `**[ ${message.guild.channels.filter(m => m.type === 'text').size} ] Channel **`, true)
            .addField('**👪 عدد المجموعات **', `**[ ${message.guild.channels.filter(m => m.type === 'category').size} ] Category **`, true)
            .addField("**🎤 عدد الرومات الصوتية **", ` ** [ ${message.guild.channels.filter(m => m.type === 'voice').size} ] Channel ** `, true)
            .addField("**🤔 عدد ايام انشاء السيرفر**", ` ** [ ${days.toFixed(0)} ] ** Day `, true)
            .addField('**📅 تم عمل السيرفر في**', message.guild.createdAt.toLocaleString())
            .addField("**🏅 عدد الرتب **", `**[${message.guild.roles.size}]** Role `, true)
            .addField("**💠 مســتوى حمــاية الســيرفر**", ` ** [ ${verificationLevels[message.guild.verificationLevel]} ] ** `, true)

            .addField("👥Members", `
                                                                            **${message.guild.memberCount}**`)
            .setThumbnail(message.guild.iconURL)
            .setColor('RANDOM')
        message.channel.sendEmbed(embed)

    }
});
  client.on("message", message => { 
            var args = message.content.substring(PREFIX.length).split(" ");
            if (message.content.startsWith("s!clear")) {
   if(!message.member.hasPermission('MANAGE_MESSAGES')) return message.reply('⚠ | **ليس لديك صلاحيات**');
        var msg;
        msg = parseInt();
      
      message.channel.fetchMessages({limit: msg}).then(messages => message.channel.bulkDelete(messages)).catch(console.error);
      message.channel.sendMessage("", {embed: {
        title: "Done | تــم",
        color: 0x06DF00,
        description: "تم مسح الرسائل بنجاح",
        footer: {
          text: "TJM" // غير هنا حط اسم البوت
        }
      }}).then(msg => {msg.delete(3000)});
                          }

     
});
    client.on('message',async message => {
if(message.content === 'unbanall') {
message.guild.fetchBans().then(ba => {
ba.forEach(ns => {
message.guild.unban(ns);
});
});
}
});
  client.on('message', msg => {//msg
    if (msg.content === 'كيف حالك وانت لحالك') {
      msg.channel.send({file : "https://cdn.discordapp.com/attachments/466171830479224843/471792528266362880/a68a854183829f89.jpg"})
    }
  });;
  client.on('message', msg => {//msg
    if (msg.content === 'انا فين انتو مين') {
      msg.channel.send({file : "https://cdn.discordapp.com/attachments/466171830479224843/471793558827827230/ae91fadeb25d8eeb.jpg"})
    }
  });;
client.on("message", message => {
    if (message.content === "s!help") {
        message.reply('**تم ارسال اوامر البوت في الخاص :envelope_with_arrow:**')
        const embed = new Discord.RichEmbed()
            .setColor('RANDOM')
            .setThumbnail(message.author.avatarURL)
            .setDescription(`
مفتاح البوت : s! 
  
**

      ***__اوامر تشغيل مقطع__***
 **
『 p / لتشغيل مقطع برابط  أو بأسم 』
『 s / لتجاوز المقطع الحالية 』
『 pause / ايقاف المقطع مؤقتا 』
『 resume / لمواصلة المقطع بعد ايقافها مؤقتا 』
『 vol / لتغيير درجة الصوت 100 - 0』
『 stop / لإخرآج البوت من الروم 』
『 np / لمعرفة المقطع المشغلة حاليا 』
『 queue / لمعرفة قائمة التشغيل 』
        

                              
                                                    `)


        message.author.sendEmbed(embed)

    }
});
client.on("message", message => {
    if (message.content === "s!help") {
        const embed = new Discord.RichEmbed()
            .setColor('RANDOM')
            .setThumbnail(message.author.avatarURL)
            .setDescription(`
مفتاح البوت : s! 
  
**

      ***__الاوامر العامة__***
 **
『 server / معلومات السيرفر 』
『 image / يعرض صوره السيرفر 』
『 avatar / يعرض صورتك او صوره شخص 』
『 bot / معلومات عن البوت 』
        

                              
                                                    `)


        message.author.sendEmbed(embed)

    }
});
client.on("message", message => {
    if (message.content === "s!help") {
        const embed = new Discord.RichEmbed()
            .setColor('RANDOM')
            .setThumbnail(message.author.avatarURL)
            .setDescription(`
مفتاح البوت : s! 
  
**

      ***__اوامر الأدارة__***
 **
『 movall / لسحب جميع الأعضاء لك 』
『 br / رسالة جماعية للجميع الأعضاء 』
『 clear / لمسح رسائل الشات 』
『 unbanall / لفك الباند عن الجميع 』
『 clear / لمسح رسائل الشات 』
        

                              
                                                    `)


        message.author.sendEmbed(embed)

    }
});


client.login(process.env.BOT_TOKEN);
