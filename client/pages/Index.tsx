import HeroSection from "@/components/index-sections/HeroSection";
import QuizSection from "@/components/index-sections/QuizSection";
import MentorSection from "@/components/index-sections/MentorSection";
import ChatSection from "@/components/index-sections/ChatSection";
import GlossarySection from "@/components/index-sections/GlossarySection";
import GlossaryAI from "@/components/GlossaryAI";
import RoadmapSection from "@/components/index-sections/RoadmapSection";

export default function Index() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <HeroSection />

      {/* Quiz Section */}
      <QuizSection />

      {/* Chat Section */}
      <ChatSection />

      {/* Mentor Section */}
      <MentorSection />

      {/* Glossary Section */}
      <GlossarySection />

      {/* AI Glossary Section */}
      <GlossaryAI />

      {/* Roadmap Section */}
      <RoadmapSection />
    </div>
  );
}
