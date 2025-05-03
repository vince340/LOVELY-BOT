module.exports = {
  config: {
    name: "broadcast",
    version: "1.0",
    author: "Evariste",
    role: 1,
    shortDescription: "Envoie un message à tous les groupes",
    longDescription: "Diffuse un message global (réservé aux admins).",
    category: "Admin",
    guide: "{prefix}broadcast [message]"
  },
  onStart: async function ({ api, event, args, threads }) {
    if (!args[0]) {
      return api.sendMessage("❌ Entrez un message à diffuser !", event.threadID);
    }
    
    const message = args.join(" ");
    const allThreads = await threads.getAll(); // Récupère tous les threads
    
    allThreads.forEach(thread => {
      if (thread.isGroup) {
        api.sendMessage(
          `📢 Annonce de l'admin :\n${message}`,
          thread.threadID
        );
      }
    });
    
    api.sendMessage("✅ Message diffusé à " + allThreads.length + " groupes !", event.threadID);
  }
}
