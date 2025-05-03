module.exports = {
    config: {
        name: "top20",
        version: "1.0",
        author: "𝐄𝐯𝐚𝐫𝐢𝐬𝐭𝐞",
        description: "Affiche le top 20 des plus riches",
        category: "economy",
        guide: {
            en: "{p}top20"
        }
    },

    onStart: async function () {},

    onChat: async function ({ api, event, message }) {
        try {
            // Vérifie si le fichier existe
            if (!fs.existsSync(DATA_FILE)) {
                return message.reply("ℹ️ Aucune donnée économique disponible.");
            }

            // Charge les données
            const userData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

            // Trie les utilisateurs
            const sortedUsers = Object.entries(userData)
                .sort((a, b) => (b[1].balance || 0) - (a[1].balance || 0))
                .slice(0, 20);

            // Formatage du message
            let topList = "🏆 𝗧𝗢𝗣 𝟮𝟬 𝗗𝗘𝗦 𝗣𝗟𝗨𝗦 𝗥𝗜𝗖𝗛𝗘𝗦 🏆\n\n";
            
            for (const [index, [userId, data]] of sortedUsers.entries()) {
                const userInfo = await api.getUserInfo(userId);
                const userName = userInfo[userId]?.name || `Utilisateur ${userId}`;
                topList += `▸ ${index + 1}. ${userName} ➟ 𝗠𝗔𝗥𝗖𝗔𝗗𝗢𝗥𝗘 ${data.balance || 0}\n`;
            }

            // Réponse avec style
            await message.reply(topList);
            api.setMessageReaction("💰", event.messageID, () => {}, true);

        } catch (error) {
            console.error("Erreur top20:", error);
            message.reply("❌ Erreur lors de la génération du classement.");
        }
    }
}
