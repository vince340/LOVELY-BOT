module.exports = { config: { name: "argent", version: "1.4", author: "Evariste", role: 0, shortDescription: "Gérer l'argent et voir le classement global", longDescription: "Afficher le solde et le top 100 des utilisateurs du bot.", category: "economy", guide: { fr:  {pn} → voir ton solde {pn} add/set/remove @mention <montant> → modifier (admin) {pn} add/set/remove moi <montant> → te modifier toi-même (admin) {pn} add/set/remove all <montant> → modifier pour tout le monde (admin) {pn} top → voir le top 100 des plus riches } },

onStart: async function ({ message, event, args, usersData, threadsData, role }) { const senderID = event.senderID;

if (args.length === 0) {
  const money = await usersData.get(senderID, "money") || 0;
  return message.reply(`Ton solde actuel : ${money} $`);
}

if (args[0] === "top") {
  const allUsers = await usersData.getAll();
  const usersWithMoney = allUsers
    .map(user => ({ id: user.userID, name: user.name, money: user.data.money || 0 }))
    .sort((a, b) => b.money - a.money)
    .slice(0, 100);

  if (usersWithMoney.length === 0) return message.reply("Aucun utilisateur trouvé avec de l'argent.");

  const lines = usersWithMoney.map((u, i) => `${i + 1}. ${u.name} - ${u.money} $`);
  return message.reply("🏆 Classement global des plus riches :\n\n" + lines.join("\n"));
}

const [action, cible, montantStr] = args;
const montant = parseInt(montantStr);

if (!["add", "remove", "set"].includes(action) || isNaN(montant)) {
  return message.reply("Utilisation invalide. Exemple : argent add @Nom 100 ou argent add all 100");
}

if (role < 1) return message.reply("Tu n'as pas la permission pour cette commande.");

if (cible === "all") {
  const allUsers = await usersData.getAll();
  for (const user of allUsers) {
    const current = user.data.money || 0;
    let nouveau;
    if (action === "add") nouveau = current + montant;
    if (action === "remove") nouveau = current - montant;
    if (action === "set") nouveau = montant;
    await usersData.set(user.userID, nouveau, "money");
  }
  return message.reply(`${action} ${montant} $ à tous les utilisateurs.`);
}

let targetID;
let name;
if (cible === "moi") {
  targetID = senderID;
  name = "toi-même";
} else {
  const mentions = Object.keys(event.mentions || {});
  if (mentions.length === 0) return message.reply("Tu dois mentionner un utilisateur, ou utiliser 'moi' ou 'all'.");
  targetID = mentions[0];
  name = event.mentions[targetID].replace("@", "");
}

const current = await usersData.get(targetID, "money") || 0;
let nouveau;
if (action === "add") nouveau = current + montant;
if (action === "remove") nouveau = current - montant;
if (action === "set") nouveau = montant;
await usersData.set(targetID, nouveau, "money");

return message.reply(`${action} ${montant} $ à ${name}. Nouveau solde : ${nouveau} $`);

} };
