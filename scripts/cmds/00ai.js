const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration améliorée
const CONFIG = {
  fonts: {
    mathsans: {
      a: "𝖺", b: "𝖻", c: "𝖼", d: "𝖽", e: "𝖾", f: "𝖿", g: "𝗀", h: "𝗁", i: "𝗂",
      j: "𝗃", k: "𝗄", l: "𝗅", m: "𝗆", n: "𝗇", o: "𝗈", p: "𝗉", q: "𝗊", r: "𝗋",
      s: "𝗌", t: "𝗍", u: "𝗎", v: "𝗏", w: "𝗐", x: "𝗑", y: "𝗒", z: "𝗓",
      A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜",
      J: "𝗝", K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥",
      S: "𝗦", T: "𝗧", U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭"
    }
  },
  stickers: [
    "254594546003916", "254595732670464", "254593389337365",
    "37117808696806", "254597316003639", "254598806003490",
    "254596219337082", "2379537642070973", "2379545095403561",
    "2379551785402892", "254597059336998"
  ],
  apiSettings: {
    url: "https://sandipbaruwal.onrender.com/gemini",
    timeout: 10000,
    retries: 2
  }
};

// Gestion robuste des erreurs
async function callAPI(prompt) {
  let lastError;
  
  for (let i = 0; i < CONFIG.apiSettings.retries; i++) {
    try {
      const response = await axios.get(CONFIG.apiSettings.url, {
        params: { prompt: encodeURIComponent(prompt) },
        timeout: CONFIG.apiSettings.timeout
      });
      return response.data?.answer;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw lastError || new Error('Échec de la requête API');
}

module.exports = {
  config: {
    name: "ask",
    version: "2.2",
    author: "𝐄𝐯𝐚𝐫𝐢𝐬𝐭𝐞",
    longDescription: "Assistant IA avec gestion d'erreur améliorée",
    category: "ai",
    guide: {
      en: "{p} [question]",
      fr: "{p} [question]"
    }
  },

  onChat: async function ({ api, event, message }) {
    try {
      const prefixes = ['ae', 'ai', 'evariste', 'salut'];
      const body = event.body?.toLowerCase() || '';
      const prefix = prefixes.find(p => body.startsWith(p));
      
      if (!prefix) return;

      const prompt = body.substring(prefix.length).trim();
      
      // Réponse aux salutations
      if (!prompt) {
        const randomSticker = CONFIG.stickers[
          Math.floor(Math.random() * CONFIG.stickers.length)
        ];
        await api.sendMessage({
          body: "✨ Posez-moi une question précise ! ✨",
          sticker: randomSticker
        }, event.threadID);
        return api.setMessageReaction("👋", event.messageID, () => {}, true);
      }

      // Traitement de la requête
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      
      const userInfo = await api.getUserInfo(event.senderID);
      const userName = userInfo[event.senderID]?.name || 'Utilisateur';
      
      const answer = await callAPI(prompt);
      
      if (!answer) throw new Error("Réponse vide de l'API");

      // Formatage stylisé
      let formattedResponse = `📚 𝐄𝐕𝐀𝐑𝐈𝐒𝐓𝐄 (pour ${userName}) 📚\n\n`;
      for (const char of answer) {
        formattedResponse += CONFIG.fonts.mathsans[char] || char;
      }
      formattedResponse += "\n\n✨ Réponse générée par EvaristeBot ✨";

      await message.reply(formattedResponse);
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (error) {
      console.error("[ERREUR ASK]", error.message);
      
      // Message d'erreur amélioré
      const errorMessage = "🔧 Désolé, je n'ai pas pu traiter votre demande.\n"
        + "Essayez de :\n"
        + "- Reformuler votre question\n"
        + "- Vérifier votre connexion\n"
        + "- Me redemander plus tard";
      
      await message.reply(errorMessage);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
