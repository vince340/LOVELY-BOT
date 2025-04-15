module.exports = {
  config: {
    name: "repadmin",
    version: "2.0",
    author: "ChatGPT",
    shortDescription: "Envoyer un message à l'admin via le groupe admin",
    longDescription: "Les utilisateurs peuvent envoyer un message à l'équipe admin, transmis dans un groupe staff spécifique.",
    category: "utils",
    guide: "{p}repadmin ton message"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const staffThreadID = "9292128920882574"; // ID de ton groupe admin
    const senderID = event.senderID;
    const threadID = event.threadID;
    const messageContent = args.join(" ");

    if (!messageContent)
      return api.sendMessage("Tu dois écrire un message à envoyer à l'admin.", threadID);

    const senderData = await usersData.get(senderID);
    const senderName = senderData?.name || "Utilisateur inconnu";

    const messageToStaff =
      `📩 Nouveau message reçu :\n\n` +
      `👤 Nom : ${senderName}\n` +
      `🆔 UID : ${senderID}\n` +
      `🗨️ Message : ${messageContent}`;

    try {
      await api.sendMessage(messageToStaff, staffThreadID);
      api.sendMessage("Ton message a bien été transmis à l'équipe admin.", threadID);
    } catch (err) {
      console.error("Erreur d'envoi au groupe staff :", err);
      api.sendMessage("Une erreur est survenue. Impossible d’envoyer le message à l’équipe admin.", threadID);
    }
  }
};
