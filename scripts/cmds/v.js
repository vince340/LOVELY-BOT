module.exports = {
  config: {
    name: "virement",
    version: "1.0",
    author: "Evariste",
    role: 1,
    shortDescription: "Virement d'argent à un utilisateur par UID",
    longDescription: "Permet à un admin de virer de l'argent à un utilisateur via son UID.",
    category: "economy",
    guide: {
      fr: "{pn} <uid> <montant> → vire le montant à l'utilisateur"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    if (args.length < 2) {
      return message.reply("Utilisation : virement <uid> <montant>");
    }

    const [uid, montantStr] = args;
    const montant = parseInt(montantStr);

    if (isNaN(montant) || montant <= 0) {
      return message.reply("Le montant doit être un nombre positif.");
    }

    const adminID = event.senderID;
    const adminSolde = await usersData.get(adminID, "money") || 0;

    if (adminSolde < montant) {
      return message.reply("Tu n'as pas assez d'argent pour ce virement.");
    }

    // Retirer au compte de l'admin
    await usersData.set(adminID, adminSolde - montant, "money");

    // Ajouter au destinataire
    const soldeDest = await usersData.get(uid, "money") || 0;
    await usersData.set(uid, soldeDest + montant, "money");

    return message.reply(`Virement de ${montant} $ effectué à l'utilisateur UID: ${uid}.`);
  }
}
