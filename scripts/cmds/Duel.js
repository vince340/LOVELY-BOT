module.exports = {
  config: {
    name: "duel",
    version: "1.0",
    author: "Evariste",
    role: 0,
    shortDescription: "Duel entre deux joueurs",
    longDescription: "Duel pierre-feuille-ciseaux en 3 manches. Le gagnant triple sa mise, le perdant la perd.",
    category: "games",
    guide: {
      fr: "{pn} @mention <montant> → Lance un duel contre un joueur"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    if (!event.isGroup) return message.reply("❌ Cette commande est uniquement disponible dans les groupes.");

    const [mention] = Object.keys(event.mentions || {});
    const montant = parseInt(args[1]);
    const challengerID = event.senderID;

    if (!mention || isNaN(montant) || montant <= 0)
      return message.reply("Utilisation invalide. Exemple : duel @Nom 100");

    const targetID = mention;
    const challengerMoney = await usersData.get(challengerID, "money") || 0;
    const targetMoney = await usersData.get(targetID, "money") || 0;

    if (challengerMoney < montant || targetMoney < montant)
      return message.reply("❌ Les deux joueurs doivent avoir assez d'argent pour miser.");

    // Stocker la demande de duel
    global.duels = global.duels || {};
    global.duels[event.threadID] = {
      challengerID,
      targetID,
      montant,
      score: { [challengerID]: 0, [targetID]: 0 },
      choix: {}
    };

    const challengerName = await usersData.getName(challengerID);
    const targetName = await usersData.getName(targetID);

    return message.reply(
      `${targetName}, ${challengerName} te défie dans un duel pierre-feuille-ciseaux pour ${montant} $ !\n\nRéponds avec "duel accept" pour commencer.`
    );
  },

  onChat: async function ({ message, event, usersData }) {
    const threadID = event.threadID;
    const userID = event.senderID;
    const msg = event.body?.toLowerCase().trim();

    if (!global.duels || !global.duels[threadID]) return;

    const duel = global.duels[threadID];

    // Accepter le duel
    if (msg === "duel accept" && userID === duel.targetID) {
      duel.started = true;
      duel.manche = 1;
      duel.choix = {};
      return message.reply(`Manche 1 : Les deux joueurs doivent envoyer "pierre", "feuille" ou "ciseaux".`);
    }

    // Vérifier si le duel est en cours
    if (!duel.started || ![duel.challengerID, duel.targetID].includes(userID)) return;

    if (!["pierre", "feuille", "ciseaux"].includes(msg)) return;

    duel.choix[userID] = msg;

    // Attendre le choix des deux joueurs
    if (Object.keys(duel.choix).length < 2) return;

    const [id1, id2] = [duel.challengerID, duel.targetID];
    const choix1 = duel.choix[id1];
    const choix2 = duel.choix[id2];

    const gagnant = getGagnant(choix1, choix2, id1, id2);
    let result = `Manche ${duel.manche} :\n- ${choix1} vs ${choix2}\n`;

    if (gagnant === "égalité") {
      result += "Résultat : Égalité !";
    } else {
      duel.score[gagnant]++;
      const name = await usersData.getName(gagnant);
      result += `Résultat : ${name} gagne cette manche !`;
    }

    duel.manche++;
    duel.choix = {};

    // Vérifier si un joueur a gagné 2 manches
    const score1 = duel.score[id1];
    const score2 = duel.score[id2];

    if (score1 === 2 || score2 === 2) {
      const gagnantID = score1 === 2 ? id1 : id2;
      const perdantID = score1 === 2 ? id2 : id1;

      await usersData.set(gagnantID, (await usersData.get(gagnantID, "money")) + duel.montant * 2, "money");
      await usersData.set(perdantID, (await usersData.get(perdantID, "money")) - duel.montant, "money");

      const gagnantName = await usersData.getName(gagnantID);
      const perdantName = await usersData.getName(perdantID);

      delete global.duels[threadID];
      return message.reply(`${result}\n\n${gagnantName} remporte le duel et gagne ${duel.montant * 2} $ !\n${perdantName} perd ${duel.montant} $.`);
    }

    return message.reply(`${result}\n\nPréparez-vous pour la manche ${duel.manche} !`);
  }
};

// Fonction pour déterminer le gagnant
function getGagnant(choix1, choix2, id1, id2) {
  if (choix1 === choix2) return "égalité";

  const gagne = {
    pierre: "ciseaux",
    feuille: "pierre",
    ciseaux: "feuille"
  };

  return gagne[choix1] === choix2 ? id1 : id2;
