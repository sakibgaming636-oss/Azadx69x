const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const doNotDelete = "[ RAKIB ]";

module.exports = {
  config: {
    name: "help",
    version: "1.17",
    author: "EDEN",
    countDown: 5,
    role: 0,
    shortDescription: { en: "View command usage and list all commands directly" },
    longDescription: { en: "View command usage and list all commands directly" },
    category: "𝗔𝗟𝗟 𝗖𝗠𝗗",
    guide: { en: "{pn} / help cmdName " },
    priority: 1,
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);

    // ✅ ONLY ONE IMAGE (no other links)
    const helpImage = "https://files.catbox.moe/pkdlkk.jpeg";

    if (args.length === 0) {
      const categories = {};
      let msg = "";

      msg += `🏴‍☠️ X Y P H E R  H E L P  M E N U 🏴‍☠️\n`;

      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;
        const category = value.config.category || "Uncategorized";
        if (!categories[category]) categories[category] = [];
        categories[category].push(name);
      }

      for (const category of Object.keys(categories)) {
        msg += `\n╭━═━┈⟬ ${category.toUpperCase()} ⟭`;
        for (const cmd of categories[category].sort()) {
          msg += `\n┋—ᐉ ◈ ${cmd}`;
        }
        msg += `\n╰━━━━═━┈┈━═━━━🗿`;
      }

      msg += `
❏━━━═━┈┈━═━━━❏
📜 Total Commands: [ ${commands.size} ]
📬 All cmd: ${prefix}help [cmdName]
🛠️ Prefix: ${prefix}
👑 Owner: ☠ 𝗦ᴀᴋɪʙ 𝗔ʜᴍᴇᴅ ☠
❏━━━═━┈┈━═━━━❏`;

      try {
        const imgPath = path.join(__dirname, "help.jpg");
        const img = await axios.get(helpImage, { responseType: "arraybuffer" });
        fs.writeFileSync(imgPath, Buffer.from(img.data));

        await message.reply({
          body: msg,
          attachment: fs.createReadStream(imgPath)
        });

        fs.unlinkSync(imgPath);
      } catch (e) {
        await message.reply(msg);
      }

    } else {
      const name = args[0].toLowerCase();
      const command = commands.get(name) || commands.get(aliases.get(name));
      if (!command) return message.reply(`❌ Command "${name}" not found`);

      const c = command.config;
      const usage = c.guide?.en
        ?.replace(/{pn}/g, prefix)
        ?.replace(/{n}/g, c.name) || "No guide";

      const info = `
╭── NAME ──
│ ${c.name}
├── INFO
│ Description: ${c.longDescription?.en || "N/A"}
│ Version: ${c.version}
│ Role: ${c.role}
│ Author: ${c.author}
├── USAGE
│ ${usage}
╰──────────`;

      await message.reply(info);
    }
  }
};
