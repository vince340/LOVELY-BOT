const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "save",
    version: "1.0",
    author: "ChatGPT",
    shortDescription: "Sauvegarde manuelle des données utilisateurs",
    category: "admin",
    guide: "{p}save"
  },

  onStart: async function ({ api, event, usersData }) {
    const adminUID = "100093009031914";
    if (event.senderID !== adminUID)
      return api.sendMessage("Tu n'es pas autorisé à utiliser cette commande.", event.threadID);

    const allUsers = await usersData.getAll();

    const filePath = path.join(__dirname, "backup_users.json");
    fs.writeFileSync(filePath, JSON.stringify(allUsers, null, 2));

    api.sendMessage("✅ Données utilisateurs sauvegardées avec succès dans `backup_users.json`.", event.threadID);
  }
}
