module.exports = {
  config: {
    name: "diffuse",
    version: "1.0",
    author: "ChatGPT",
    shortDescription: "Diffuser un message dans tous les groupes",
    longDescription: "Permet à l'admin principal du bot d'envoyer un message dans tous les groupes.",
    category: "admin",
    guide: "{p}diffuse ton message ici"
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const adminUID = "100093009031914"; // Remplace par ton UID (admin du bot)
    const senderID = event.senderID;

    if (senderID !== adminUID) return api.sendMessage("Tu n'es pas autorisé à utiliser cette commande.", event.threadID);

    const message = args.join(" ");
    if (!message) return api.sendMessage("Tu dois fournir un message à diffuser.", event.threadID);

    const allThreads = await threadsData.getAll();
    let count = 0;

    for (const thread of allThreads) {
      if (thread.isGroup) {
        try {
          await api.sendMessage(`Annonce de l'admin :\n\n${message}`, thread.threadID);
          count++;
        } catch (e) {
          console.log(`Erreur dans le groupe ${thread.threadID}`);
        }
      }
    }

    return api.sendMessage(`Message envoyé dans ${count} groupes.`, event.threadID);
  }
};
