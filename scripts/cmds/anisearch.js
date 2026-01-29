const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "anisearch",
    version: "2.5",
    author: "Azadx69x",
    role: 0,
    category: "anime",
    shortDescription: "Fetch Anisearch video",
    longDescription: "Anisearch send a video",
    cooldown: 5
  },

  onStart: async function({ message, args, api, event }) {
    return this.run({ message, args, api, event });
  },

  onChat: async function({ message, args, event, api }) {
    const body = (event.body || "").toLowerCase();
    if (!body.startsWith("anisearch")) return;
    args = body.split(" ").slice(1);
    return this.run({ message, args, api, event });
  },

  run: async function({ message, args, api, event }) {
    try {
      const character = args.join(" ").trim();
      const apiUrl = `https://azadx69x-all-apis-top.vercel.app/api/anisearch?character=${encodeURIComponent(character)}`;
    	
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const { data } = await axios.get(apiUrl);

      if (!data?.success) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply(`❌ ${data?.message || "No Anisearch videos found"}`);
      }

      let video = data.data;
    	
      if (video.duration && video.duration > 60) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply("❌ Video is too long! Only short videos (< 1 min) are allowed.");
      }
    	
      const videoUrl = video.video_url.replace(/^\[|\]$/g, "");
      const filePath = path.join(__dirname, `anisearch_${Date.now()}.mp4`);
      const writer = fs.createWriteStream(filePath);
      const response = await axios({ url: videoUrl, method: "GET", responseType: "stream" });
      response.data.pipe(writer);

      writer.on("finish", async () => {
        api.setMessageReaction("✅", event.messageID, () => {}, true);

        const textMsg =
`━━━━━ ANISEARCH ━━━━━
🎬 Title: ${video.title}
👤 Author: ${video.author}
❤️ Likes: ${video.stats.likes || 0} | 💬 Comments: ${video.stats.comments || 0} | 🔄 Shares: ${video.stats.shares || 0}

${character ? `🔍 Search: ${character}` : '🎲 Random video'}
━━━━━━━━━━━━━━━━━━━`;

        await message.reply({
          body: textMsg,
          attachment: fs.createReadStream(filePath)
        });

        fs.unlinkSync(filePath);
      });

      writer.on("error", () => {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply("❌ Error downloading video!");
      });

    } catch (err) {
      console.error("❌ Anisearch CMD Error:", err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ Failed to fetch Anisearch video. Try again later.");
    }
  }
};
