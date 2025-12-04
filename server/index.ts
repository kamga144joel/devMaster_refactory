import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleMentor } from "./routes/mentor";
import { handleExercise } from "./routes/exercise";
import { handleQuiz } from "./routes/quiz";
import { handleCourse } from "./routes/course";
import { handleChat } from "./routes/chat";
import { geniusSearch, geniusLyrics } from "./routes/genius";
import { spotifySearch, spotifyTrack } from "./routes/spotify";
import { handleImage } from "./routes/image";
import { exportPdf, exportDocx, exportCourse } from "./routes/export";
import { webSearch } from "./routes/search";
import { handleGlossary } from "./routes/glossary";
import { handleSave } from "./routes/save";
import { handleContact } from "./routes/contact";
import { handleSendMailjet } from "./routes/send-mailjet";
import { handleSendWelcome } from "./routes/send-welcome-mail";
import { handleWelcomeList } from "./routes/welcome-list";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/mentor", handleMentor);
  app.post("/api/exercise", handleExercise);
  app.post("/api/quiz", handleQuiz);
  app.post("/api/course", handleCourse);
  app.post("/api/chat", handleChat);
  app.post("/api/image", handleImage);
  app.get("/api/genius/search", geniusSearch);
  app.get("/api/genius/lyrics", geniusLyrics);
  app.get("/api/spotify/search", spotifySearch);
  app.get("/api/spotify/track", spotifyTrack);
  app.get("/api/search", webSearch);
  app.post("/api/export/pdf", exportPdf);
  app.post("/api/export/docx", exportDocx);
  app.post("/api/export/course", exportCourse);
  app.post("/api/glossary", handleGlossary);
  app.post("/api/save", handleSave);
  app.post("/api/contact", handleContact);
  app.post("/api/send-mailjet", handleSendMailjet);
  app.post("/api/send-welcome-mail", handleSendWelcome);
  app.get("/api/welcome-list", handleWelcomeList);

  return app;
}
