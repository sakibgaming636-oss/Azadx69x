const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

const commandEmoji = cmd => {
  const map = {
    "autodl": "📥", "approve": "✔️", "pfp": "🖼️", "translate": "🌐",
    "pinterest": "🖼️", "4k": "🖼️", "avatar": "🖼️", "daily": "🤖",
    "help": "🗃️", "say": "🗣️", "balance": "💰", "vip": "💎",
    "ban": "🚫", "kick": "🥾", "segx": "🔞", "bby": "👶", "nt": "📝",
    "islamicvideo": "🎥"
  };
  return map[cmd] || "📝";
};

function fancyText(text) {
  return text
    .split("")
    .map(c => {
      const map = {
        a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴",
        h: "𝗵", i: "𝗶", j: "𝗷", k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻",
        o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿", s: "𝘀", t: "𝘁", u: "𝘂",
        v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇",
        A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚",
        H: "𝗛", I: "𝗜", J: "𝗝", K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡",
        O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧", U: "𝗨",
        V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭",
        0:"0",1:"1",2:"2",3:"3",4:"4",5:"5",6:"6",7:"7",8:"8",9:"9"
      };
      return map[c] || c;
    })
    .join("");
}

module.exports = {
  config: {
    name: "help",
    version: "3.0",
    author: "Azadx69x",
    countDown: 5,
    role: 0,
    description: { en: "View all commands with categories or command details" },
    category: "Info"
  },

  onStart: async function({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID);
    const commandName = (args[0] || "").toLowerCase();
    const cmd = commands.get(commandName) || commands.get(aliases.get(commandName));

    function roleTextToString(role) {  
      return role === 0 ? "All Users"  
        : role === 1 ? "Group Admins"  
        : "Bot Admins";  
    }  
    
    if (cmd) {
      const cfg = cmd.config;
      const desc = typeof cfg.description === "string" ? cfg.description : cfg.description?.en || "No description";
      const aliasesText = cfg.aliases?.length ? cfg.aliases.join(", ") : "None";
      const usage = typeof cfg.guide?.en === "string" ? cfg.guide.en.replace(/\{pn\}/g, prefix + cfg.name) : "No usage info";

      const msg = `╔═════════════════╗
║ 🏷️ X69X_Help_Menu
║ ${commandEmoji(cfg.name)} Command: ${prefix}${cfg.name}
║ 🗂️ Category: ${cfg.category || "Uncategorized"}
║ 📄 Description: ${desc}
║ ⚡ Aliases: ${aliasesText}
║ ⚙️ Version: ${cfg.version || "1.0"}
║ ⏳ Cooldown: ${cfg.countDown || 1}s
║ 🔒 Role: ${roleTextToString(cfg.role || 0)}
║ 👑 Author: Azadx69x
║ 💎 Premium: ${cfg.premium ? "✅" : "❌"}
║ 📘 Usage: ${usage}
╚═════════════════╝`;
      return message.reply(msg);
    }
    
    const categories = {};
    for (const [, c] of commands) {
      if (c.config.role > 1 && role < c.config.role) continue;
      const cat = c.config.category || "Uncategorized";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(c.config.name);
    }

    let msg = `╔═════════════════╗\n║ 🏷️ X69X_Help_Menu\n╚═════════════════╝\n\n`;

    for (const cat of Object.keys(categories).sort()) {
      msg += `╔═════════════════╗\n`;
      msg += `║ 🗂️ ${cat.toUpperCase()}\n`;
      for (const name of categories[cat]) {
        msg += `║ ${commandEmoji(name)} ${fancyText(name)}\n`;
      }
      msg += `╚═════════════════╝\n\n`;
    }
    
    msg += `╔═════════════════╗
║ 🗂️ Total Commands: ${commands.size}
║ 📌 Prefix: ${prefix}
║ 👤 Developer: Azadx69x
║ 💡 Use ${prefix}help <command> for details
╚═════════════════╝`;

    return message.reply(msg);
  }
};
