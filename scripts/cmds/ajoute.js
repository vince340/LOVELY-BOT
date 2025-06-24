module.exports = {
  config: {
    name: "ajoute",
    version: "3.0",
    author: "Evariste",
    role: 0,
    shortDescription: "Ajoute un utilisateur dans le groupe (UID, mention, réponse)",
    longDescription: "Commande pour ajouter un utilisateur dans le groupe. Seuls les UID autorisés peuvent l'utiliser.",
    category: "admin",
    guide: "{pn} <UID> | en réponse | en mention"
  },

  onStart: async function ({ api, event, args }) {
    // UID autorisés à utiliser cette commande
    const authorizedUIDs = [
      "100093009031914", // Toi
      "61571572433426"   // Un autre admin
    ];

    const executorUID = event.senderID;

    // Vérifie si l'utilisateur est autorisé
    if (!authorizedUIDs.includes(executorUID)) {
      return api.sendMessage("❌ Tu n'es pas autorisé à utiliser cette commande.", event.threadID);
    }

    // Déterminer l’UID de la personne à ajouter
    let targetUID = null;

    if (event.messageReply) {
      targetUID = event.messageReply.senderID;
    } else if (Object.keys(event.mentions || {}).length > 0) {
      targetUID = Object.keys(event.mentions)[0];
    } else if (args[0] && !isNaN(args[0])) {
      targetUID = args[0];
    }

    if (!targetUID) {
      return api.sendMessage("❌ Utilisation : ajoute <UID> ou en réponse/mention.", event.threadID);
    }

    try {
      // Vérifie si l’utilisateur est déjà dans le groupe
      const threadInfo = await api.getThreadInfo(event.threadID);
      const isAlreadyInGroup = threadInfo.participantIDs.includes(targetUID);

      if (isAlreadyInGroup) {
        return api.sendMessage("⚠️ Cet utilisateur est déjà dans le groupe.", event.threadID);
      }

      // Tente d'ajouter
      await api.addUserToGroup(targetUID, event.threadID);
      return api.sendMessage(`✅ L'utilisateur ${targetUID} a été ajouté au groupe.`, event.threadID);
    } catch (err) {
      return api.sendMessage(`❌ Erreur lors de l'ajout : ${err.message}`, event.threadID);
    }
  }
};
