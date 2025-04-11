module.exports = {
  config: {
    name: "transfert",
    version: "1.0",
    author: "Evariste",
    role: 1,  // Seuls les administrateurs peuvent utiliser cette commande (modifiable si nécessaire)
    shortDescription: "Transfert d'argent entre utilisateurs",
    longDescription: "Permet de transférer de l'argent à un autre utilisateur via leur UID.",
    category: "economy",
    guide: "{pn} <UID> <montant> → Transfert d'argent à un utilisateur par son UID"
  },

  onStart: async function ({ message, event, usersData, args, role }) {
    // Vérifie si l'utilisateur a les permissions
    if (role < 1) {
      return message.reply("❌ Tu n'as pas la permission pour cette commande.");
    }

    // Vérifie les arguments de la commande
    if (args.length !== 2) {
      return message.reply("❌ Utilisation invalide. Exemple : `transfert <UID> <montant>`");
    }

    const targetUID = args[0];  // UID de la personne qui reçoit l'argent
    const montant = parseInt(args[1]);  // Montant à transférer

    if (isNaN(montant) || montant <= 0) {
      return message.reply("❌ Le montant doit être un nombre positif.");
    }

    // Récupérer l'argent actuel de l'utilisateur
    const senderID = event.senderID;
    const senderMoney = await usersData.get(senderID, "money") || 0;

    // Vérifie si l'utilisateur a assez d'argent
    if (senderMoney < montant) {
      return message.reply("❌ Tu n'as pas assez d'argent pour effectuer ce transfert.");
    }

    // Vérifie si le destinataire existe et récupère son solde
    const targetMoney = await usersData.get(targetUID, "money") || 0;

    // Effectuer le transfert
    await usersData.set(senderID, senderMoney - montant, "money");  // Réduire l'argent de l'expéditeur
    await usersData.set(targetUID, targetMoney + montant, "money");  // Ajouter l'argent au destinataire

    return message.reply(`✅ Transfert de ${montant} $ effectué avec succès !\n**${targetUID}** a maintenant ${targetMoney + montant} $ et toi, tu as ${senderMoney - montant} $.`);
  }
};
