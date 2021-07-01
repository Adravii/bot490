const Discord = require("discord.js");
require("dotenv").config({ path: ".env" });


const client = new Discord.Client();
client.login(process.env.token);

client.on("ready", () => {
  console.log(`sesion iniciada como ${client.user.tag}.`);
  client.user.setActivity("mis Dms", { type: "WATCHING" });
});

require("./mailmod.js")(client, {
  id: "789976770836299826",
  categoryID: "854842296175427594",
  loggingID: "854842321770381323",
});

