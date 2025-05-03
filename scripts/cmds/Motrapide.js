module.exports = {
  config: {
    name: "motrapide",
    version: "1.1",
    author: "Evariste",
    role: 0,
    shortDescription: "Jeu de mot rapide en groupe",
    longDescription: "Le bot donne une lettre, et le premier à répondre avec un mot qui commence par cette lettre gagne.",
    category: "games",
    guide: {
      fr: "{pn} → Lance une partie de mot rapide"
    }
  },

  onStart: async function ({ message, event }) {
    if (!event.isGroup) return message.reply("Ce jeu peut seulement être lancé dans un groupe.");

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lettre = alphabet[Math.floor(Math.random() * alphabet.length)];

    global.motRapide = global.motRapide || {};
    global.motRapide[event.threadID] = {
      lettre: lettre,
      active: true
    };

    return message.reply(`**Jeu du Mot Rapide !**\nLa lettre est : **${lettre}**\nEnvoyez un mot qui commence par cette lettre pour gagner **100 $** !`);
  },

  onMessage: async function ({ message, event, usersData }) {
    const { threadID, body, senderID } = event;
    if (!body || !global.motRapide || !global.motRapide[threadID] || !global.motRapide[threadID].active) return;

    const lettre = global.motRapide[threadID].lettre;
    if (body[0].toUpperCase() !== lettre) return;

    global.motRapide[threadID].active = false;

    const gain = 100;
    const currentMoney = await usersData.get(senderID, "money") || 0;
    await usersData.set(senderID, currentMoney + gain, "money");

    const name = await global.utils.getName(senderID);
    return message.reply(`Bravo ${name} ! Tu as gagné avec **"${body}"** et tu gagnes **${gain} $** !`);
  }
}
