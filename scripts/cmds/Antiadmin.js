module.exports = {
  config: {
    name: "antiadmin",
    version: "1.0",
    author: "Evariste ᎬᏉᎯᏒᎨᏕᎿᎬ",
    description: "Empêche la suppression d'un admin par un autre membre (hors bot)",
    usage: "Automatique",
    cooldown: 0,
    permissions: [2],
  },

  // La commande n'a pas besoin d'être lancée manuellement
  onStart: async function () {
    console.log("[ANTIADMIN] Protection active automatiquement.");
  },

  onEvent: async function ({ api, event, getThreadInfo }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID, logMessageData, author } = event;
    const botID = api.getCurrentUserID();
    const threadInfo = await getThreadInfo(threadID);

    // Liste des administrateurs actuels
    const adminIDs = threadInfo.adminIDs.map(admin => admin.id);

    const kickedID = logMessageData?.leftParticipantFbId;
    const kickerID = author;

    // Ignorer si le bot a quitté le groupe ou s'il s'agit du bot lui-même
    if (kickedID === botID || kickerID === botID) return;

    // Si la personne expulsée était admin et l'expulseur n’est pas le bot
    if (adminIDs.includes(kickedID) && kickerID !== botID) {
      try {
        await api.removeUserFromGroup(kickerID, threadID);
        await api.sendMessage(
          `⚠️ ${kickerID} a tenté de supprimer un admin.\nIl a été retiré du groupe par ᎬᏉᎯᏒᎨᏕᎿᎬ.`,
          threadID
        );
      } catch (err) {
        console.error("❌ Impossible de supprimer le fautif :", err);
      }
    }
  }
};
