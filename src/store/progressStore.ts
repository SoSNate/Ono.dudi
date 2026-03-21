import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TopicKey =
  | 'normalDistribution'
  | 'regression'
  | 'probability'
  | 'descriptive'
  | 'conditionalProb'
  | 'discrete';

interface TopicProgress {
  stagesCompleted: number[];
  examScore: number;       // 0 or 100
  topicReadiness: number;  // 0-100
}

interface ProgressState {
  overallReadiness: number;
  topics: Record<TopicKey, TopicProgress>;
  completeStage: (topic: TopicKey, stage: number) => void;
  resetTopic: (topic: TopicKey) => void;
}

const TOTAL_STAGES = 5;
const PREP_STAGES = TOTAL_STAGES - 1;
const PREP_WEIGHT = 40;
const EXAM_WEIGHT = 60;

function calcTopicReadiness(completed: number[], examScore: number): number {
  const prepCompleted = completed.filter(s => s < TOTAL_STAGES).length;
  const prepScore = Math.min(prepCompleted, PREP_STAGES) * (PREP_WEIGHT / PREP_STAGES);
  const examContrib = examScore === 100 ? EXAM_WEIGHT : 0;
  return Math.round(prepScore + examContrib);
}

const initialTopic: TopicProgress = {
  stagesCompleted: [],
  examScore: 0,
  topicReadiness: 0,
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      overallReadiness: 0,
      topics: {
        normalDistribution: { ...initialTopic },
        regression: { ...initialTopic },
        probability: { ...initialTopic },
        descriptive: { ...initialTopic },
        conditionalProb: { ...initialTopic },
        discrete: { ...initialTopic },
      },

      completeStage: (topic, stage) =>
        set((state) => {
          const prev = state.topics[topic];
          if (prev.stagesCompleted.includes(stage)) return state;

          const newCompleted = [...prev.stagesCompleted, stage];
          const newExamScore = stage === TOTAL_STAGES ? 100 : prev.examScore;
          const newReadiness = calcTopicReadiness(newCompleted, newExamScore);

          const newTopics = {
            ...state.topics,
            [topic]: {
              stagesCompleted: newCompleted,
              examScore: newExamScore,
              topicReadiness: newReadiness,
            },
          };

          const overall = Math.round(
            Object.values(newTopics).reduce((sum, t) => sum + t.topicReadiness, 0) /
              Object.keys(newTopics).length,
          );

          return { topics: newTopics, overallReadiness: overall };
        }),

      resetTopic: (topic) =>
        set((state) => {
          const newTopics = {
            ...state.topics,
            [topic]: { ...initialTopic },
          };
          const overall = Math.round(
            Object.values(newTopics).reduce((sum, t) => sum + t.topicReadiness, 0) /
              Object.keys(newTopics).length,
          );
          return { topics: newTopics, overallReadiness: overall };
        }),
    }),
    { name: 'ono-stats-progress' }
  )
);
