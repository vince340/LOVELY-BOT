 module.exports = {
  config: {
    name: "ask",
    version: "2.1",
    author: "𝐄𝐯𝐚𝐫𝐢𝐬𝐭𝐞",
    longDescription: "Assistant IA avec cache et stylisation",
    category: "ai",
    guide: {
      en: "{p} [question]",
      fr: "{p} [question]"
    }
  },

  onStart: async function () {
    process.on('exit', () => cache.saveCache());
    process.on('SIGINT', () => process.exit());
  },

  onChat: async function ({ api, event, message }) {
    try {
      const prefixes = ['ae', 'ai', 'evariste', 'salut'];
      const body = event.body.toLowerCase();
      const prefix = prefixes.find(p => body.startsWith(p));
      
      if (!prefix) return;

      const prompt = event.body.substring(prefix.length).trim();
      
      // Réponse aux salutations
      if (!prompt) {
        const randomSticker = CONFIG.stickers[
          Math.floor(Math.random() * CONFIG.stickers.length)
        ];
        await api.sendMessage({
          body: "✨ Posez-moi une question ! ✨",
          sticker: randomSticker
        }, event.threadID);
        return api.setMessageReaction("👋", event.messageID, () => {}, true);
      }

      // Vérification du cache
      const cacheKey = `${event.threadID}_${event.senderID}_${prompt}`;
      const cachedResponse = cache.get(cacheKey);
      
      if (cachedResponse) {
        await message.reply(cachedResponse);
        return api.setMessageReaction("♻️", event.messageID, () => {}, true);
      }

      // Requête API
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      
      const userInfo = await api.getUserInfo(event.senderID);
      const userName = userInfo[event.senderID].name;
      
      const { data } = await axios.get(CONFIG.apiSettings.url, {
        params: { prompt: encodeURIComponent(prompt) },
        timeout: CONFIG.apiSettings.timeout
      });

      if (!data?.answer) throw new Error("Réponse API vide");
      
      // Formatage et stockage
      const formattedResponse = formatText(data.answer, userName);
      cache.set(cacheKey, formattedResponse);
      
      await message.reply(formattedResponse);
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (error) {
      console.error("[ASK ERROR]", error);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      
      const errorMessage = "⚠️ Erreur de traitement. Veuillez reformuler votre question.";
      await message.reply(errorMessage);
    }
  }
};
