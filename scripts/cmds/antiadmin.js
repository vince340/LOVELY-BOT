const fs = require("fs"); const path = __dirname + "/cache/adminProtect.json";

// Créer le fichier si inexistant if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));

module.exports = { config: { name: "protectadmin", version: "1.0", author: "Evariste & ChatGPT", description: "Protège les admins contre les suppressions abusives", category: "admin", role: 2 },

onStart: async function ({ api, message }) { const threads = await api.getThreadList(100, null, ["INBOX"]); const adminData = {};

for (const thread of threads) {
  if (!thread.isGroup) continue;
  try {
    const info = await api.getThreadInfo(thread.threadID);
    const admins = info.adminIDs.map(a => a.id);
    adminData[thread.threadID] = admins;
  } catch (err) {
    console.log(`Erreur récupération thread ${thread.threadID}: ${err.message}`);
  }
}

fs.writeFileSync(path, JSON.stringify(adminData, null, 2));
message.reply("✅ Protection activée. Les admins sont désormais surveillés.");

},

onEvent: async function ({ event, api }) { if (event.logMessageType !== "log:unsubscribe") return;

const threadID = event.threadID;
const userID = event.leftParticipantFbId;
const adminID = event.logMessageData.admin_id;

const adminData = JSON.parse(fs.readFileSync(path));
const knownAdmins = adminData[threadID] || [];

if (!knownAdmins.includes(userID)) return; // la personne supprimée n'était pas un admin enregistré

if (adminID && adminID !== api.getCurrentUserID()) {
  try {
    await api.removeUserFromGroup(adminID, threadID);
    await api.sendMessage(`🚨 Admin protégé expulsé ! L'utilisateur ${adminID} a été banni pour avoir retiré un admin.`, threadID);
  } catch (e) {
    console.log("Erreur bannissement automatique:", e.message);
  }
}

} };
