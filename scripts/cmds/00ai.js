const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration centrale
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
    timeout: 10000
  }
};

// Gestion du cache
class ResponseCache {
  constructor() {
    this.cache = new Map();
    this.cacheFile = path.join(__dirname, 'askCache.json');
    this.loadCache();
  }

  loadCache() {
    if (fs.existsSync(this.cacheFile)) {
      try {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        JSON.parse(data).forEach(([key, value]) => this.cache.set(key, value));
      } catch (e) {
        console.error("Erreur de lecture du cache:", e);
      }
    }
  }

  saveCache() {
    const data = JSON.stringify(Array.from(this.cache.entries()));
    fs.writeFileSync(this.cacheFile, data);
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
    this.saveCache();
  }
}

const cache = new ResponseCache();

// Fonction utilitaire pour formater le texte
function formatText(text, user) {
  let result = `📚 𝐄𝐕𝐀𝐑𝐑𝐈𝐒𝐓𝐄 (pour ${user}) 📚\n\n`;
  
  for (const char of text) {
    result += CONFIG.fonts.mathsans[char] || char;
  }
  
  return result + "\n\n✨ Créé par Evariste ✨";
}

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
