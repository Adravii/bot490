const Discord = require("discord.js");
const path = require("path");

module.exports = (client, options) => {
  const MODMAIL_SERVER = {
    id: (options && options.id) || "",
    categoryID: (options && options.categoryID) || "",
    loggingID: (options && options.loggingID) || "",
    method: (options && options.method) || 0,
    depth: (options && options.depth) || 0,
    cooldown: Boolean(options && options.cooldown),
    limitedMsg: Boolean(options && options.limitedMsg),
    reasonAlert: Boolean(options && options.reasonAlert),
    logStaff: Boolean(options && options.logStaff),
    webhookEmbeds: Boolean(options && options.webhookEmbeds),
    prefix: (options && options.prefix) || "m!",
    help: (options && options.help) || "help",
    reply: (options && options.reply) || "reply",
    close: (options && options.close) || "close",
    errors: (options && options.errors) || "errors",
    imageExtensions: new Set(require("./extensions.json").images),
    unsafeExtensions: new Set(require("./extensions.json").unsafe),
  };

  function verifyFile(f) {
    if (
      MODMAIL_SERVER.imageExtensions.has(path.extname(f).slice(1).toLowerCase())
    )
      return true;
    else if (
      MODMAIL_SERVER.unsafeExtensions.has(
        path.extname(f).slice(1).toLowerCase()
      )
    )
      return false;
    else false;
  }

  function isImage(f) {
    return MODMAIL_SERVER.imageExtensions.has(
      path.extname(f).slice(1).toLowerCase()
    );
  }

  function logMessage(
    message,
    options = {
      response: 0,
      user: null,
      id: null,
      cnt: null,
      atch: [],
      to: null,
      reason: null,
      staff: null,
    }
  ) {
    return new Promise((res, rej) => {
      if (options.user == null)
        rej(new Error("No se especificó ningún usuario para los logs"));
      const embed = new Discord.MessageEmbed();
      if (options.response == 0 || options.response == "normal")
        embed
          .setTitle(`Respuesta recibida: ${options.user.username}`)
          .setColor("GOLD")
          .addField("ID del usuario", options.user.id, true)
          .addField("ticket ID", options.id, true)
          .setThumbnail(options.user.displayAvatarURL())
          .setDescription(
            `${options.cnt ? options.cnt : `[Sin contenido]`}` +
              `${
                options.atch && options.atch.length > 0
                  ? options.atch
                      .map((index) => {
                        return `\n[URL del archivo](${index.url})`
                      })
                      .join("")
                  : ""
              }`
          );
      else if (
        options.response == 1 ||
        (options.response == "staff" && MODMAIL_SERVER.logStaff)
      )
        embed
          .setTitle(`Respuesta enviada: ${options.user.username}`)
          .setColor("AQUA")
          .addField("ID del usuario", options.user.id, true)
          .addField("ticket ID", options.id, true)
          .setThumbnail(options.user.displayAvatarURL())
          .setDescription(options.cnt);
      else if (options.response == 2 || options.response == "reply")
        embed
          .setTitle(`Respuesta enviada: ${options.user.username}`)
          .setColor("GOLD")
          .addField(
            "De",
            `${options.staff.username} (${options.staff.id})`,
            true
          )
          .addField(
            "Para",
            `${options.user.username} (${options.user.id})`,
            true
          )
          .setThumbnail(options.user.displayAvatarURL())
          .setDescription(
            `${options.cnt ? options.cnt : `[Sin contenido]`}` +
              `${
                options.atch && options.atch.length > 0
                  ? options.atch
                      .map((index) => {
                        return `\n[URL del archivo](${index.url})`;
                      })
                      .join("")
                  : ""
              }`
          );
      else if (options.response == 3 || options.response == "delete")
        embed
          .setTitle(`Ticket cerrado: ${options.user.username}`)
          .setColor("RED")
          .addField(
            "Miembro del staff",
            `${options.staff.username} (${options.staff.id})`,
            true
          )
          .addField(
            "Razón",
            options.reason ? options.reason : "Sin especificar",
            true
          )
          .setThumbnail(options.user.displayAvatarURL());
      else if (options.response == 4 || options.response == "create")
        embed
          .setTitle(`Ticket creado: ${options.user.username}`)
          .setColor("GREEN")
          .setThumbnail(options.user.displayAvatarURL())
          .addField("ID del usuario", `${options.user.id}`, true);
      res(client.channels.cache.get(MODMAIL_SERVER.loggingID).send(embed));
    });
  }

  function elevation(message) {
    let permlvl = 0;
    if (message.member.permissions.has("KICK_MEMBERS")) permlvl = 1;
    if (message.member.permissions.has("BAN_MEMBERS")) permlvl = 2;
    if (message.member.permissions.has("ADMINISTRATOR")) permlvl = 3;
    if (message.member.id === message.member.guild.ownerID) permlvl = 4;
    return permlvl;
  }

  client.on("message", async (message) => {
    if (message.channel.type == "dm" && !message.author.bot) {
      switch (MODMAIL_SERVER.method) {
        case 0: {
          const info = {
            id: message.author.id,
            cnt: message.content,
            attachments: [],
            avatarURL: message.author.displayAvatarURL({
              format: "png",
              size: 256,
            }),
          };
          const guild = await message.client.guilds.fetch(
            MODMAIL_SERVER.id,
            true,
            true
          );
          if (!guild || !guild.id)
            return console.error(
              new Error("Fallo al buscar un server con id " + MODMAIL_SERVER.id)
            );
          var channel = await guild.channels.cache.find(
            (c) => c.topic == `${info.id}`
          );
          if (!channel || channel.size == 0) {
            channel = await guild.channels
              .create(`${message.author.username}`, {
                type: "text",
                topic: `${info.id}`,
                parent: MODMAIL_SERVER.categoryID,
              })
              .catch((e) => {
                message.reply(
                  `Vaya! Hubo un problema con el sistema de soporte :/ Contacta al staff para que puedan resolverlo lo antes posible (Especificales el código de error).\nError: CREATE_${message.author.id}`
                );
                console.error(
                  `CREATE_${message.author.id} ` + e.stack ? e.stack : e
                );
              });
            if (channel && channel.type) {
              logMessage(message, {
                response: 4,
                user: client.users.cache.get(channel.topic.trim()),
              });
              message.author.send(
                `Mensaje enviado! Por favor sé paciente y no atosigues al staff ;)`
              );
            }
          } else
            channel = channel.type
              ? await channel.fetch(true)
              : await channel.first().fetch(true);
          var webhook = await channel.fetchWebhooks();
          if (!webhook || webhook.size == 0)
            webhook = await channel
              .createWebhook(`${info.id}`, {
                avatar: info.avatarURL,
                reason: `ModMail Hook for: ${info.id}`,
              })
              .catch((e) => {
                console.error(
                  `CHOOK_${message.author.id} ` + e.stack ? e.stack : e
                );
                return message.reply(
                  `Vaya! Hubo un problema con el sistema de soporte :/ Contacta al staff para que puedan resolverlo lo antes posible (Especificales el código de error).\nError: CHOOK_${message.author.id}`
                );
              });
          else webhook = webhook.first();
          if (message.attachments.size > 0) {
            message.attachments.each((m) => {
              if (verifyFile(m.name))
                info.attachments.push({
                  image: { url: m.url },
                  color: 10040319,
                  description: `[URL del archivo](${m.url})`,
                });
              else
                info.attachments.push({
                  image: { url: m.url },
                  color: 10040319,
                  description: `[URL del archivo](${m.url}): CUIDADO: El archivo puede ser peligroso`,
                });
            });

            if (MODMAIL_SERVER.webhookEmbeds)
              info.attachments.unshift({
                thumbnail: {
                  url: message.author.displayAvatarURL({ format: "png" }),
                },
                description: info.cnt,
                color: 16766720,
                title: message.author.username,
              });
            webhook
              .send(
                MODMAIL_SERVER.webhookEmbeds
                  ? " "
                  : info.cnt.length > 0
                  ? info.cnt
                  : "*[Ningún mensaje, pero se adjuntó un archivo]*",
                {
                  username: message.author.username,
                  avatarURL: info.avatarURL,
                  embeds: info.attachments,
                }
              )
              .then(() => {
                message.react("✅");
                var a = [];
                message.attachments.each((m) =>
                  a.push({ url: m.url, name: m.name })
                );
                logMessage(message, {
                  response: 0,
                  user: client.users.cache.get(channel.topic),
                  id: channel.id,
                  cnt: info.cnt ? info.cnt : "",
                  atch: a,
                });
              })
              .catch((e) => {
                console.error(
                  `SHOOK_${message.author.id} ` + e.stack ? e.stack : e
                );
                return message.reply(
                  `Vaya! Hubo un problema con el sistema de soporte :/ Contacta al staff para que puedan resolverlo lo antes posible (Especificales el código de error).\nError: SHOOK_${message.author.id}`
                );
              });
          } else {
            if (MODMAIL_SERVER.webhookEmbeds)
              info.attachments.unshift({
                thumbnail: {
                  url: message.author.displayAvatarURL({ format: "png" }),
                },
                description: info.cnt,
                color: 16766720,
                title: message.author.username,
              });
            webhook
              .send(
                MODMAIL_SERVER.webhookEmbeds
                  ? ""
                  : info.cnt.length > 0
                  ? info.cnt
                  : "*[Sin contenido]*",
                {
                  username: message.author.username,
                  avatarURL: info.avatarURL,
                  embeds: MODMAIL_SERVER.webhookEmbeds ? info.attachments : [],
                }
              )
              .then(() => {
                message.react("✅");
                logMessage(message, {
                  response: 0,
                  user: client.users.cache.get(channel.topic),
                  id: channel.id,
                  cnt: info.cnt ? info.cnt : "",
                });
              })
              .catch((e) => {
                console.error(
                  `SHOOK_${message.author.id} ` + e.stack ? e.stack : e
                );
                return message.reply(
                  `Vaya! Hubo un problema con el sistema de soporte :/ Contacta al staff para que puedan resolverlo lo antes posible (Especificales el código de error).\nError: SHOOK_${message.author.id}`
                );
              });
          }
          break;
        }
        case 1: {
          const info = {
            id: message.author.id,
            cnt: message.content,
            attachments: [],
            avatarURL: message.author.displayAvatarURL({
              format: "png",
              size: 256,
            }),
          };
          const guild = await message.client.guilds.fetch(
            MODMAIL_SERVER.id,
            true,
            true
          );
          if (!guild || !guild.id)
            return console.error(
              new Error("Fallo al encontrar server con id " + MODMAIL_SERVER.id)
            );
          var channel = await guild.channels.cache.find(
            (c) => c.topic == `${info.id}`
          );
          if (!channel || channel.size == 0) {
            channel = await guild.channels
              .create(`${message.author.username}`, {
                type: "text",
                topic: `${info.id}`,
                parent: MODMAIL_SERVER.categoryID,
              })
              .catch((e) => {
                message.reply(
                  `Vaya! Hubo un problema con el sistema de soporte :/ Contacta al staff para que puedan resolverlo lo antes posible (Especificales el código de error).\nError: CREATE_${message.author.id}`
                );
                console.error(
                  `CREATE_${message.author.id} ` + e.stack ? e.stack : e
                );
              });
            if (channel && channel.type) {
              logMessage(message, {
                response: 4,
                user: client.users.cache.get(channel.topic.trim()),
                reason: args[0] ? args.join(" ") : false,
              });
              message.author.send(
                `Mensaje enviado! Por favor sé paciente y no atosigues al staff ;)`
              );
            }
          } else
            channel = channel.type
              ? await channel.fetch(true)
              : await channel.first().fetch(true);
          if (message.attachments.size > 0) {
            const embed = new Discord.MessageEmbed();
            var links = [];
            message.attachments.each((m) => {
              if (verifyFile(m.name))
                links.push(
                  `[URL del archivo](${m.url})`
                );
              else
                links.push(
                  `[URL del archivo](${m.url}): CUIDADO: El archivo puede ser peligroso`
                );
            });
            links = links.join("\n");
            embed.setColor("PURPLE");
            embed.setDescription(links);
            channel
              .send(info.cnt.length > 0 ? info.cnt : "*[Sin contenido]*", {
                embed,
              })
              .then(() => {
                message.react("✅");
                var a = [];
                message.attachments.each((m) =>
                  a.push({ url: m.url, name: m.name })
                );
                logMessage(message, {
                  response: 0,
                  user: client.users.cache.get(channel.topic),
                  id: channel.id,
                  cnt: info.cnt ? info.cnt : "",
                  atch: a,
                });
              })
              .catch((e) => {
                console.error(
                  `SMSG_${message.author.id} ` + e.stack ? e.stack : e
                );
                return message.reply(
                  `Vaya! Hubo un problema con el sistema de soporte :/ Contacta al staff para que puedan resolverlo lo antes posible (Especificales el código de error).\nError: SMSG_${message.author.id}`
                );
              });
          } else {
            channel
              .send(
                info.cnt.length > 0
                  ? `Nuevo mensaje: ${info.cnt}`
                  : "*[Sin contenido]*"
              )
              .then(() => {
                message.react("✅");
                logMessage(message, {
                  response: 0,
                  user: client.users.cache.get(channel.topic),
                  id: channel.id,
                  cnt: info.cnt ? info.cnt : "",
                });
              })
              .catch((e) => {
                console.error(
                  `SMSG_${message.author.id} ` + e.stack ? e.stack : e
                );
                return message.reply(
                  `Vaya! Hubo un problema con el sistema de soporte :/ Contacta al staff para que puedan resolverlo lo antes posible (Especificales el código de error).\nError: SMSG_${message.author.id}`
                );
              });
          }
          break;
        }
        default: {
          const info = {
            id: message.author.id,
            cnt: message.content,
            attachments: [],
            avatarURL: message.author.displayAvatarURL({
              format: "png",
              size: 256,
            }),
          };
          const guild = await message.client.guilds.fetch(
            MODMAIL_SERVER.id,
            true,
            true
          );
          if (!guild || !guild.id)
            return console.error(
              new Error("failed to fetch guild with " + MODMAIL_SERVER.id)
            );
          var channel = await guild.channels.cache.find(
            (c) => c.topic == `${info.id}`
          );
          if (!channel || channel.size == 0) {
            channel = await guild.channels
              .create(`${message.author.username}`, {
                type: "text",
                topic: `${info.id}`,
                parent: MODMAIL_SERVER.categoryID,
              })
              .catch((e) => {
                message.reply(
                  `Vaya! Hubo un problema con el sistema de soporte :/ Contacta al staff para que puedan resolverlo lo antes posible (Especificales el código de error).\nError: CREATE_${message.author.id}`
                );
                console.error(
                  `CREATE_${message.author.id} ` + e.stack ? e.stack : e
                );
              });
            if (channel && channel.type) {
              logMessage(message, {
                response: 4,
                user: client.users.cache.get(channel.topic.trim()),
                reason: args[0] ? args.join(" ") : false,
              });
              message.author.send(
                `Mensaje enviado! Por favor sé paciente y no atosigues al staff ;)`
              );
            }
          } else
            channel = channel.type
              ? await channel.fetch(true)
              : await channel.first().fetch(true);
          var webhook = await channel.fetchWebhooks();
          if (!webhook || webhook.size == 0)
            webhook = await channel
              .createWebhook(`${info.id}`, {
                avatar: info.avatarURL,
                reason: `ModMail Hook for: ${info.id}`,
              })
              .catch((e) => {
                console.error(
                  `CHOOK_${message.author.id} ` + e.stack ? e.stack : e
                );
                return message.reply(
                  `Vaya! Hubo un problema con el sistema de soporte :/ Contacta al staff para que puedan resolverlo lo antes posible (Especificales el código de error).\nError: CHOOK_${message.author.id}`
                );
              });
          else webhook = webhook.first();
          if (message.attachments.size > 0) {
            message.attachments.each((m) => {
              if (verifyFile(m.name))
                info.attachments.push({
                  image: { url: m.url },
                  color: 10040319,
                  description: `[URL del archivo](${m.url})`,
                });
              else
                info.attachments.push({
                  image: { url: m.url },
                  color: 10040319,
                  description: `[URL del archivo](${m.url}): CUIDADO: El archivo puede ser peligroso`,
                });
            });
            webhook
              .send(
                info.cnt.length > 0
                  ? info.cnt
                  : "*[Sin contenido, pero se adujntaron archivos]*",
                {
                  username: message.author.username,
                  avatarURL: info.avatarURL,
                  embeds: info.attachments,
                }
              )
              .then(() => {
                message.react("✅");
                var a = [];
                message.attachments.each((m) =>
                  a.push({ url: m.url, name: m.name })
                );
                logMessage(message, {
                  response: 0,
                  user: client.users.cache.get(channel.topic),
                  id: channel.id,
                  cnt: info.cnt ? info.cnt : "",
                  atch: a,
                });
              })
              .catch((e) => {
                console.error(
                  `SHOOK_${message.author.id} ` + e.stack ? e.stack : e
                );
                return message.reply(
                  `Vaya! Hubo un problema con el sistema de soporte :/ Contacta al staff para que puedan resolverlo lo antes posible (Especificales el código de error).\nError: SHOOK_${message.author.id}`
                );
              });
          } else {
            webhook
              .send(info.cnt.length > 0 ? info.cnt : "*[Sin contenido]*", {
                username: message.author.username,
                avatarURL: info.avatarURL,
              })
              .then(() => {
                message.react("✅");
                logMessage(message, {
                  response: 0,
                  user: client.users.cache.get(channel.topic),
                  id: channel.id,
                  cnt: info.cnt ? info.cnt : "",
                });
              })
              .catch((e) => {
                console.error(
                  `SHOOK_${message.author.id} ` + e.stack ? e.stack : e
                );
                return message.reply(
                  `Vaya! Hubo un problema con el sistema de soporte :/ Contacta al staff para que puedan resolverlo lo antes posible (Especificales el código de error).\nError: SHOOK_${message.author.id}`
                );
              });
          }
        }
      }
    }

    if (message.content.startsWith(MODMAIL_SERVER.prefix)) {
      const command = message.content
        .substring(MODMAIL_SERVER.prefix.length)
        .split(/[ \n]/)[0]
        .trim();
      const args = message.content
        .slice(MODMAIL_SERVER.prefix.length + command.length)
        .trim()
        .split(/ +/g);

      switch (command) {
        case MODMAIL_SERVER.help: {
          const embed = new Discord.MessageEmbed()
            .setTitle("Ayuda de Soprte whaat")
            .setThumbnail(
              message.client.user.displayAvatarURL({ format: "png" })
            )
            .setDescription(
              `Enviarme un mensaje abrirá un ticket para hablar con el staff de \`${
                message.client.guilds.cache.get(MODMAIL_SERVER.id).name
              }\`. Las respuestas te serán enviadas aquí. Puedes adjuntar archivos si es necesario. Los mensajes enviados recibirán esta reacción ✅. Se te notificará cuando el ticket cierre.`
            )
            .addField("Comandos normales", `${MODMAIL_SERVER.help}`)
            .addField(
              "Comandos de staff",
              `${MODMAIL_SERVER.reply}, ${MODMAIL_SERVER.close}`
            )
            .setColor(10040319);
          message.author.send({ embed }).catch(console.log);
          message.react("✅");
          break;
        }
        case MODMAIL_SERVER.reply: {
          if (elevation(message) > 1) {
            const channel = await message.channel.fetch(true);
            if (
              channel.parentID !== MODMAIL_SERVER.categoryID ||
              channel.id == MODMAIL_SERVER.loggingID
            )
              return;
            const user = await message.client.users.fetch(
              channel.topic.trim(),
              true,
              true
            );
            if (!user)
              return message.reply(
                `No pude encontrar a ningún miembro con id \`${channel.topic}\`. Comprueba que la descripción de este canal concuerda con el id del usuario del ticket`
              );
            if (!args)
              return message.reply(
                `Especifica una respuesta para ${user.username}.`
              );
            if (message.attachments.size > 0) {
              const embed = new Discord.MessageEmbed()
                .setAuthor(
                  "Soporte whaat",
                  "https://cdn.discordapp.com/attachments/791001789800906782/855200099070902332/discordiaaaa.png"
                )
                .setColor(10040319)
                .setImage(message.attachments.first().url)
                .setDescription(`${args.join(" ")}`)
                .setTimestamp();
              user.send(embed).then(() => {
                message.reply("Mensaje enviado!");
                logMessage(message, {
                  response: 2,
                  staff: message.author,
                  user: user,
                  cnt: args[0] ? args.join(" ") : false,
                  atch: [
                    {
                      url: message.attachments.first().url,
                      name: message.attachments.first().name,
                    },
                  ],
                });
              });
            } else {
              const embed = new Discord.MessageEmbed()
                .setAuthor(
                  "Soporte whaat",
                  "https://cdn.discordapp.com/attachments/791001789800906782/855200099070902332/discordiaaaa.png"
                )
                .setColor(10040319)
                .setDescription(`${args.join(" ")}`)
                .setTimestamp();
              user.send(embed).then(() => {
                message.reply("Mensaje enviado!");
                logMessage(message, {
                  response: 2,
                  staff: message.author,
                  user: user,
                  cnt: args[0] ? args.join(" ") : false,
                });
              });
            }
          }
          break;
        }

        case MODMAIL_SERVER.close: {
          if (elevation(message) > 1) {
            const num = Math.floor(1000 + Math.random() * 9000);
            const user = await message.client.users.fetch(
              message.channel.topic.trim()
            );
            const closeEmbed = new Discord.MessageEmbed()
              .setTitle("Confirmación de cierre")
              .setDescription(
                "Para confirmar el cierre de este ticket, escribe a cotinuacion el código de 4 digitos ue encontrarás más abajo"
              )
              .addField("Código:", num)
              .setFooter("Este proceso se cancelará en 60 segundos");
            const msg = await message.channel.send(closeEmbed);
            const collector = message.channel.createMessageCollector(
              (m) =>
                m.content.trim() == `${num}` &&
                m.author.id == message.author.id,
              { time: 60000, max: 1 }
            );
            collector.on("collect", () => {
              msg.delete().catch((e) => console.log(new Error(e)));
              message.channel
                .send(
                  "El ticket se eliminará en 15 segundos. Alertaré al miembro del cierre."
                )
                .catch(console.log);
              setTimeout(() => {
                let id = message.channel.topic;
                const avatarGif = message.author.displayAvatarURL({
                  dynamic: true,
                });

                const avatarPng = message.author.displayAvatarURL({
                  type: "png",
                });
                let avatar = avatarGif.includes(".gif") ? avatarGif : avatarPng;

                const embed = new Discord.MessageEmbed()
                  .setAuthor(message.author.username, avatar)
                  .setTitle("Ticket cerrado")
                  .setDescription(`Gracias por contactar al equipo de soporte!`)
                  .setColor(10040319)
                  .setFooter(
                    "Responde a este mensaje para crear un nuevo ticket!"
                  );
                if (args[0]) embed.addField("Razón", args.join(" "));
                if (
                  message.attachments.size > 0 &&
                  isImage(message.attachments.first().name)
                )
                  embed.setImage(message.attachments.first().url);
                user.send(embed).catch(console.log);
                logMessage(message, {
                  response: 3,
                  staff: message.author,
                  user: user,
                  reason: args[0] ? args.join(" ") : false,
                });
                message.channel
                  .delete(`MM: ${id} closed by ${message.author.tag}`)
                  .catch(console.log);
              }, 15000);
            });
            collector.on("end", (c) => {
              if (c.size == 0)
                msg
                  .edit(
                    `:x: El tiempo ha acabado y no he recibido ninguna respuesta!`
                  )
                  .catch((e) => console.log(new Error(e)));
            });
          }
          break;
        }
      }
    }
  });
};
