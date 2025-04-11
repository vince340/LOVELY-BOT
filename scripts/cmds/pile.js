module.exports = {
  config: {
    name: "pileface",
    version: "1.0",
    author: "Evariste",
    role: 0,
    shortDescription: "Jeu de pile ou face pour gagner de l'argent",
    longDescription: "Parie un montant sur pile ou face. Si tu gagnes, tu doubles ta mise.",
    category: "games",
    guide: {
      fr: "{pn} <pile|face> <montant>"
    }
  },

  onStart: async function ({ message, args, event, usersData }) {
    const [choix, montantStr] = args;
    const userID = event.senderID;

    const montant = parseInt(montantStr);
    if (!["pile", "face"].includes(choix?.toLowerCase()) || isNaN(montant) || montant <= 0) {
      return message.reply("Utilisation : pileface <pile|face> <montant>");
    }

    const argent = await usersData.get(userID, "money") || 0;
    if (montant > argent) {
      return message.reply("Tu n'as pas assez d'argent pour ce pari.");
    }

    const resultat = Math.random() < 0.5 ? "pile" : "face";
    let messageResultat = `Résultat : ${resultat.toUpperCase()}\n`;

    if (choix.toLowerCase() === resultat) {
      const gain = montant;
      await usersData.set(userID, argent + gain, "money");
      messageResultat += `Bravo ! Tu gagnes ${gain} $. Ton nouveau solde est ${argent + gain} $.`;
    } else {
      await usersData.set(userID, argent - montant, "money");
      messageResultat += `Dommage, tu perds ${montant} $. Ton nouveau solde est ${argent - montant} $.`;
    }

    return message.reply(messageResultat);
  }
};
