const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { shorten } = require("tinyurl");

function formatSize(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}

module.exports = {
  config: {
    name: "sing",
    aliases: ["sing", "chante"],
    version: "2.1",
    author: "Mariancross",
    countDown: 10,
    role: 0,
    longDescription: "Télécharger des chansons Spotify.",
    category: "media",
    guide: { en: "{pn} <nom_de_la_chanson>" },
  },

  onStart: async function ({ api, event, args, message }) {
    const query = args.join(" ");
    if (!query) {
      return message.reply("Veuillez entrer le nom d'une chanson !");
    }

    // URL corrigée pour la recherche
    const searchUrl = `https://zetbot-page.onrender.com/api/spotify?action=search&search=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get(searchUrl);

      if (!response.data.status || !response.data.tracks || response.data.tracks.length === 0) {
        return message.reply("Aucune chanson trouvée pour cette recherche.");
      }

      const tracksData = response.data.tracks;
      const trackInfo = tracksData
        .map(
          (track, index) =>
            `${index + 1}. ${track.name || track.track?.name}\nAlbum : ${track.album || track.track?.album}\nArtistes : ${(track.artists || track.track?.artists || []).join(", ")}\nDurée : ${track.duration_ms || track.track?.duration_ms}`
        )
        .join("\n\n");

      // Adaptation pour les images d'album selon la structure de réponse
      const thumbnails = tracksData.map((track) => 
        track.album_image || track.track?.album_image || track.image
      ).filter(Boolean);

      let attachments = [];
      if (thumbnails.length > 0) {
        try {
          attachments = await Promise.all(
            thumbnails.map((thumbnail) =>
              global.utils.getStreamFromURL(thumbnail)
            )
          );
        } catch (imgError) {
          console.warn("Erreur lors du chargement des images:", imgError);
        }
      }

      const replyMessage = await message.reply({
        body: `${trackInfo}\n\nRépondez avec le numéro de votre choix pour télécharger.`,
        attachment: attachments,
      });

      const data = {
        commandName: this.config.name,
        messageID: replyMessage.messageID,
        tracks: tracksData,
      };
      global.GoatBot.onReply.set(replyMessage.messageID, data);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      message.reply("Une erreur est survenue lors de la recherche.");
    }
  },

  onReply: async function ({ api, event, Reply, args, message }) {
    const userInput = parseInt(args[0]);
    const { tracks } = Reply;

    if (!isNaN(userInput) && userInput >= 1 && userInput <= tracks.length) {
      const selectedTrack = tracks[userInput - 1];
      message.unsend(Reply.messageID);

      const downloadingMessage = await message.reply("𝕲𝖋𝖎𝖋𝖋𝖎𝖙𝖍 télécharge la musique 📥");

      try {
        // Debug: afficher la structure de la track sélectionnée
        console.log("Structure de la track sélectionnée:", JSON.stringify(selectedTrack, null, 2));

        // Récupération de l'URL Spotify depuis la track sélectionnée - essayer plusieurs champs possibles
        const spotifyUrl = selectedTrack.url || 
                          selectedTrack.external_urls?.spotify || 
                          selectedTrack.track?.external_urls?.spotify ||
                          selectedTrack.spotify_url ||
                          selectedTrack.track?.url ||
                          selectedTrack.track?.spotify_url ||
                          selectedTrack.link ||
                          selectedTrack.track?.link;

        console.log("URL Spotify trouvée:", spotifyUrl);

        if (!spotifyUrl) {
          // Essayer de construire l'URL si on a un ID
          const trackId = selectedTrack.id || selectedTrack.track?.id;
          if (trackId) {
            const constructedUrl = `https://open.spotify.com/track/${trackId}`;
            console.log("URL construite:", constructedUrl);

            // Utilisation du nouvel endpoint de téléchargement avec l'URL construite
            const downloadApiUrl = `https://zetbot-page.onrender.com/api/spotifydl?url=${encodeURIComponent(constructedUrl)}`;

            const downloadResponse = await axios.get(downloadApiUrl);

            if (!downloadResponse.data.status || !downloadResponse.data.metadata?.spotify_url) {
              throw new Error("Impossible d'obtenir le lien de téléchargement avec l'URL construite");
            }

            // Continuer avec le téléchargement...
            await this.downloadAndSendTrack(downloadResponse, selectedTrack, message, downloadingMessage);
            return;
          }

          throw new Error(`URL Spotify non trouvée pour cette chanson. Champs disponibles: ${Object.keys(selectedTrack).join(', ')}`);
        }

        // Utilisation du nouvel endpoint de téléchargement
        const downloadApiUrl = `https://zetbot-page.onrender.com/api/spotifydl?url=${encodeURIComponent(spotifyUrl)}`;

        console.log("URL de l'API de téléchargement:", downloadApiUrl);

        const downloadResponse = await axios.get(downloadApiUrl);

        console.log("Réponse de l'API:", JSON.stringify(downloadResponse.data, null, 2));

        if (!downloadResponse.data.status || !downloadResponse.data.metadata?.spotify_url) {
          throw new Error("Impossible d'obtenir le lien de téléchargement");
        }

        await this.downloadAndSendTrack(downloadResponse, selectedTrack, message, downloadingMessage);

      } catch (error) {
        console.error("Erreur lors du téléchargement:", error);
        message.reply(`Une erreur est survenue lors du téléchargement: ${error.message}`);
      }

      message.unsend(downloadingMessage.messageID);
    } else {
      message.reply("Veuillez entrer un numéro valide.");
    }
  },

  // Fonction helper pour télécharger et envoyer la track
  downloadAndSendTrack: async function(downloadResponse, selectedTrack, message, downloadingMessage) {
    try {
      // Récupération du vrai lien de téléchargement MP3
      const downloadUrl = downloadResponse.data.metadata.spotify_url;
      const trackName = downloadResponse.data.metadata.track_name;

      console.log("Lien de téléchargement MP3:", downloadUrl);

      // Téléchargement du fichier MP3
      const audioResponse = await axios.get(downloadUrl, { 
        responseType: "arraybuffer",
        timeout: 60000, // 60 secondes de timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir);
      }

      const filePath = path.join(cacheDir, `spotify_${Date.now()}.mp3`);
      fs.writeFileSync(filePath, Buffer.from(audioResponse.data));

      const fileSize = fs.statSync(filePath).size;
      const sizeFormatted = formatSize(fileSize);
      const attachment = fs.createReadStream(filePath);

      // Adaptation des propriétés selon la structure de réponse
      const originalTrackName = selectedTrack.name || selectedTrack.track?.name;
      const trackAlbum = selectedTrack.album || selectedTrack.track?.album;
      const trackArtists = selectedTrack.artists || selectedTrack.track?.artists || [];
      const releaseDate = selectedTrack.release_date || selectedTrack.track?.release_date;

      // Générer un lien TinyURL pour inclure dans le message
      let shortenedUrl = "";
      try {
        shortenedUrl = await shorten(downloadUrl);
      } catch (urlError) {
        console.warn("Erreur lors de la création du lien court:", urlError);
      }

      // Récupérer le thumbnail de l'album
      const thumbnailUrl = selectedTrack.album_image || 
                          selectedTrack.track?.album_image || 
                          selectedTrack.image ||
                          selectedTrack.track?.image ||
                          selectedTrack.album?.images?.[0]?.url ||
                          selectedTrack.track?.album?.images?.[0]?.url;

      let thumbnailAttachment = null;
      if (thumbnailUrl) {
        try {
          thumbnailAttachment = await global.utils.getStreamFromURL(thumbnailUrl);
        } catch (thumbError) {
          console.warn("Erreur lors du chargement du thumbnail:", thumbError);
        }
      }

      // Message texte avec toutes les infos
      const messageText = `🎵 Titre : ${trackName || originalTrackName}\n📀 Album : ${trackAlbum}\n👤 Artistes : ${trackArtists.join(", ")}\n📅 Date de sortie : ${releaseDate}\n📦 Taille : ${sizeFormatted}${shortenedUrl ? `\n🔗 Lien direct : ${shortenedUrl}` : ''}`;

      // Envoyer le texte avec le thumbnail
      if (thumbnailAttachment) {
        await message.reply({
          body: messageText,
          attachment: thumbnailAttachment
        });
      } else {
        // Si pas de thumbnail, envoyer juste le texte
        await message.reply(messageText);
      }

      // Petit délai pour s'assurer que le texte s'affiche
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Puis envoyer l'audio séparément
      await message.reply({ attachment: attachment });

      // Nettoyer le fichier temporaire après 2 minutes
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 120000);

    } catch (error) {
      console.error("Erreur dans downloadAndSendTrack:", error);
      throw error;
    }
  }
};
