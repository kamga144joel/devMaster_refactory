import { QuizQuestion as IQuizQuestion } from "@shared/api";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizQuestionProps {
  index: number;
  question: IQuizQuestion;
  selectedAnswer: number;
  onAnswerSelect: (index: number) => void;
}

export default function QuizQuestion({ index, question, selectedAnswer, onAnswerSelect }: QuizQuestionProps) {
  const isAnswered = selectedAnswer !== -1;
  const isCorrect = isAnswered && selectedAnswer === question.answerIndex;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4"
    >
      {/* Question Number & Title */}
      <div className="flex items-start gap-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">{index + 1}</span>
        </div>
        <h3 className="text-lg font-semibold leading-tight pt-1">{question.q}</h3>
      </div>

      {/* Options */}
      <div className="space-y-2 pl-12">
        {question.options.map((option, optionIndex) => {
          const isSelected = selectedAnswer === optionIndex;
          const isCorrectOption = optionIndex === question.answerIndex;
          let bgColor = "hover:bg-accent/50";
          let borderColor = "border-border/50";

          if (isAnswered) {
            if (isSelected && isCorrect) {
              bgColor = "bg-green-50 dark:bg-green-950/30";
              borderColor = "border-green-500";
            } else if (isSelected && !isCorrect) {
              bgColor = "bg-red-50 dark:bg-red-950/30";
              borderColor = "border-red-500";
            } else if (isCorrectOption && !isSelected) {
              bgColor = "bg-green-50 dark:bg-green-950/20";
              borderColor = "border-green-500/50";
            }
          }

          return (
            <motion.button
              key={optionIndex}
              whileHover={!isAnswered ? { x: 4 } : {}}
              whileTap={!isAnswered ? { scale: 0.98 } : {}}
              onClick={() => !isAnswered && onAnswerSelect(optionIndex)}
              disabled={isAnswered}
              className={`w-full text-left rounded-lg border-2 px-4 py-3 transition-all ${bgColor} ${borderColor} flex items-center justify-between gap-3`}
            >
              <span className="text-sm font-medium">{option}</span>

              {isAnswered && (
                <>
                  {isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                  {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
                  {isCorrectOption && !isSelected && <CheckCircle2 className="h-5 w-5 text-green-500/60 flex-shrink-0" />}
                </>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      {isAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`pl-12 p-3 rounded-lg text-sm font-medium ${
            isCorrect
              ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
          }`}
        >
          {isCorrect ? "✓ Excellent !" : "✗ Incorrect."}
          {question.explain && ` — ${question.explain}`}
        </motion.div>
      )}
    </motion.div>
  );
}
