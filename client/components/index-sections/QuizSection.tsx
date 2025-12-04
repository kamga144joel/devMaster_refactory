import { useState, useEffect } from "react";
import type { QuizQuestion, QuizResponse } from "@shared/api";
import { motion, AnimatePresence } from "framer-motion";
import QuizHeader from "@/components/quiz/QuizHeader";
import QuizControls from "@/components/quiz/QuizControls";
import QuizQuestionComponent from "@/components/quiz/QuizQuestion";

export default function QuizSection() {
  const [topic, setTopic] = useState("bases");
  const [level, setLevel] = useState(1);
  const [translate, setTranslate] = useState(() => (localStorage.getItem("quiz:translate") ?? "true") === "true");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [err, setErr] = useState("");
  const [autoUpdate, setAutoUpdate] = useState(() => (localStorage.getItem("prefs:quiz:autoUpdate") ?? "true") === "true");
  const [language, setLanguage] = useState(() => (localStorage.getItem('learn:lang') as any) || "JavaScript");
  const [framework, setFramework] = useState(() => (localStorage.getItem('learn:fw') as any) || "Aucun");

  // Listen to storage events
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "learn:lang" || e.key === "learn:fw" || e.key === "quiz:translate") {
        if (e.key === "learn:lang") setLanguage(e.newValue || "JavaScript");
        if (e.key === "learn:fw") setFramework(e.newValue || "Aucun");
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
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          framework: framework === "Aucun" ? undefined : framework,
          topic,
          level,
          translate,
          count: 5, // Moins de questions pour la page d'accueil
        }),
      });
      if (!res.ok) throw new Error("Erreur HTTP");
      const data: QuizResponse & { error?: string } = await res.json();
      if (data.error) throw new Error(data.error);
      setQuestions(data.questions || []);
      setAnswers([]);
    } catch (e: any) {
      setErr(e.message || "Erreur inconnue");
      setQuestions([]);
      setAnswers([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate questions on mount if none exist
  useEffect(() => {
    if (questions.length === 0 && !loading) {
      generate().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!autoUpdate) return;
    const id = setTimeout(() => {
      generate().catch(() => {});
    }, 300);
    return () => clearTimeout(id);
  }, [language, framework, topic, level, translate, autoUpdate]);

  const correctAnswers = answers.filter((ans, idx) => ans === questions[idx]?.answerIndex).length;
  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return (
    <section className="container mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-8 max-w-4xl"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">Q</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">Quiz Interactif</p>
            <h3 className="text-xl font-semibold mt-2 text-foreground">Teste tes connaissances en {language}</h3>
          </div>
        </div>

        {/* Controls simplifiés pour la page d'accueil */}
        <div className="mb-6">
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
        </div>

        {/* Score bar */}
        {questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Score</span>
              <span className="text-sm font-semibold text-primary">{score}%</span>
            </div>
            <div className="w-full bg-muted/50 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {correctAnswers} sur {totalQuestions} bonnes réponses
            </div>
          </motion.div>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <motion.div layout className="space-y-4" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
            <AnimatePresence mode="popLayout">
              {questions.map((question, idx) => (
                <QuizQuestionComponent
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
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Génération des questions...</span>
          </div>
        )}

        {/* Error state */}
        {err && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm font-medium"
          >
            ⚠️ {err}
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !err && questions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Clique sur "Générer" pour commencer le quiz</p>
          </div>
        )}
      </motion.div>
    </section>
  );
}
