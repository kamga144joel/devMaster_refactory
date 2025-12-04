import { useState, useEffect } from "react";
import type { QuizQuestion, QuizResponse } from "@shared/api";
import { motion, AnimatePresence } from "framer-motion";
import QuizHeader from "@/components/quiz/QuizHeader";
import QuizControls from "@/components/quiz/QuizControls";
import QuizQuestion from "@/components/quiz/QuizQuestion";

export default function Quiz({ language, framework }: { language: string; framework?: string }) {
  const [topic, setTopic] = useState("bases");
  const [level, setLevel] = useState(1);
  const [translate, setTranslate] = useState(() => (localStorage.getItem("quiz:translate") ?? "true") === "true");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [err, setErr] = useState("");
  const [autoUpdate, setAutoUpdate] = useState(
    () => (localStorage.getItem("prefs:quiz:autoUpdate") ?? "true") === "true"
  );

  // Listen to storage events
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "learn:lang" || e.key === "learn:fw" || e.key === "quiz:translate") {
        const id = setTimeout(() => generate().catch(() => {}), 250);
        return () => clearTimeout(id);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Listen to prefs changes
  useEffect(() => {
    const onPrefs = (e: any) => {
      if (e?.key === "prefs:quiz:autoUpdate" || e?.detail?.key === "prefs:quiz:autoUpdate") {
        const v = (localStorage.getItem("prefs:quiz:autoUpdate") ?? "true") === "true";
        setAutoUpdate(v);
      }
    };
    window.addEventListener("storage", onPrefs);
    window.addEventListener("prefs:changed", onPrefs as EventListener);
    return () => {
      window.removeEventListener("storage", onPrefs);
      window.removeEventListener("prefs:changed", onPrefs as EventListener);
    };
  }, []);

  const generate = async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, framework, topic, level, translate }),
      });
      const text = await r.text();
      let data: QuizResponse & { error?: string; details?: string };

      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text } as any;
      }

      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(-1));
      } else {
        setErr(data.error || data.details || "Erreur: Aucune question reçue de l'API");
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate when conditions change
  useEffect(() => {
    if (!autoUpdate) return;
    const id = setTimeout(() => {
      generate().catch(() => {});
    }, 300);
    return () => clearTimeout(id);
  }, [language, framework, topic, level, translate, autoUpdate]);

  // Calculate score
  const correctAnswers = answers.filter((ans, idx) => ans === questions[idx]?.answerIndex).length;
  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return (
    <section className="container mx-auto py-16">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="space-y-8"
      >
        {/* Header */}
        <QuizHeader />

        {/* Controls */}
        <QuizControls
          topic={topic}
          setTopic={setTopic}
          level={level}
          setLevel={setLevel}
          translate={translate}
          setTranslate={setTranslate}
          autoUpdate={autoUpdate}
          setAutoUpdate={setAutoUpdate}
          loading={loading}
          onGenerate={generate}
        />

        {/* Error */}
        {err && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive font-medium"
          >
            ⚠️ {err}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && !questions.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-8 w-8 rounded-full border-3 border-primary/30 border-t-primary"
              />
              <p className="text-muted-foreground">Génération des questions…</p>
            </div>
          </motion.div>
        )}

        {/* Questions List */}
        {questions.length > 0 && (
          <>
            {/* Score Bar */}
            {answers.some((a) => a !== -1) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progression</p>
                  <p className="text-2xl font-bold">
                    {correctAnswers}/{totalQuestions} correctes
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-primary">{score}%</p>
                  <p className="text-sm text-muted-foreground">Score</p>
                </div>
              </motion.div>
            )}

            {/* Questions */}
            <motion.div
              layout
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
            >
              <AnimatePresence mode="popLayout">
                {questions.map((question, idx) => (
                  <QuizQuestion
                    key={idx}
                    index={idx}
                    question={question}
                    selectedAnswer={answers[idx] ?? -1}
                    onAnswerSelect={(optionIdx) => {
                      const newAnswers = [...answers];
                      newAnswers[idx] = optionIdx;
                      setAnswers(newAnswers);
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {/* Empty State */}
        {!loading && questions.length === 0 && !err && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">Générez un quiz pour commencer…</p>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
