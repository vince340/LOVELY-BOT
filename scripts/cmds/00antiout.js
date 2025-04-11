 module.exports = {
  config: {
    name: "antiout",
    version: "1.0",
    author: "ChatGPT",
    role: 1, // admin only
    shortDescription: "Empêche les membres de quitter",
    longDescription: "Active ou désactive la protection anti-sortie du groupe",
    category: "group",
    guide: {
      en: "{pn} on/off"
    }
  },

  onStart: async function ({ message, event, args, threadsData }) {
    const threadID = event.threadID;
    const status = args[0];

    if (status !== "on" && status !== "off") {
      return message.reply("Utilisation : antiout on / off");
    }

    await threadsData.set(threadID, status === "on", "settings.antiout");
    return message.reply(`Antiout a été ${status === "on" ? "activé" : "désactivé"} avec succès.`);
  },

  onEvent: async function ({ event, threadsData, api }) {
    if (event.logMessageType === "log:unsubscribe") {
      const isEnabled = await threadsData.get(event.threadID, "settings.antiout");
      if (!isEnabled) return;

      const leftUserID = event.logMessageData.leftParticipantFbId;
      const botID = api.getCurrentUserID();

      if (leftUserID !== botID) {
        try {
          await api.addUserToGroup(leftUserID, event.threadID);
        } catch (err) {
          console.error("Erreur lors de la réinsertion :", err);
        }
      }
    }
  }
};
