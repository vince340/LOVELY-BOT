module.exports = {
  config: {
    name: "supprime",
    version: "3.0",
    author: "Evariste",
    role: 0,
    shortDescription: "Supprimer un membre du groupe (réservé aux UID autorisés)",
    longDescription: "Retire un membre par UID, mention ou message répondu. Protège les UID autorisés.",
    category: "admin",
    guide: "{pn} <UID> | en réponse | en mention"
  },

  onStart: async function ({ api, event, args }) {
    // Liste des UID autorisés à utiliser la commande
    const authorizedUIDs = [
      "100093009031914", // Ton UID principal
      "61571572433426"   // Exemple d'autre UID autorisé
    ];

    // UID de l'utilisateur qui tente la commande
    const executorUID = event.senderID;

    // Vérifie si l'utilisateur est autorisé
    if (!authorizedUIDs.includes(executorUID)) {
      return api.sendMessage("❌ Tu n'es pas autorisé à utiliser cette commande.", event.threadID);
    }

    // Récupération de la cible à supprimer
    let targetUID = null;

    if (event.messageReply) {
      targetUID = event.messageReply.senderID;
    } else if (Object.keys(event.mentions || {}).length > 0) {
      targetUID = Object.keys(event.mentions)[0];
    } else if (args[0] && !isNaN(args[0])) {
      targetUID = args[0];
    }

    if (!targetUID) {
      return api.sendMessage("❌ Utilisation : supprime <UID> ou en réponse/mention.", event.threadID);
    }

    // Empêche de se supprimer soi-même ou un UID autorisé
    if (authorizedUIDs.includes(targetUID)) {
      return api.sendMessage("⚠️ Impossible de supprimer c'est un roi supprême.", event.threadID);
    }

    try {
      await api.removeUserFromGroup(targetUID, event.threadID);
      return api.sendMessage(`✅ L'utilisateur ${targetUID} a été supprimé du groupe.`, event.threadID);
    } catch (err) {
      return api.sendMessage(`❌ Erreur lors de la suppression :\n${err.message}`, event.threadID);
    }
  }
};
