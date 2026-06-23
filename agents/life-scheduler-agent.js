import { Agent } from './agent-base.js';

export class LifeSchedulerAgent extends Agent {
  constructor() {
    super(
      'Life Scheduler Agent',
      `You are the health and balance advisor of the +Z ME AI system. Your task is to analyze schedule workloads, insert wellness breaks, and maintain study/life equilibrium.`
    );
  }

  async execute(input, context = {}) {
    const { calendar = [], tasks = [] } = context;

    // Analyze work vs life balance in tasks
    const workTasks = tasks.filter(t => t.category === 'Study' || t.category === 'Task').length;
    const lifeTasks = tasks.filter(t => t.category === 'Wellness' || t.category === 'Life').length;
    
    const totalTasks = workTasks + lifeTasks || 1;
    const workPercent = Math.round((workTasks / totalTasks) * 100);
    const wellnessPercent = 100 - workPercent;

    // Generate wellness blocks
    const lifeRecommendations = [
      { activity: "Cardio interval: 20-30 min brisk walk or run to oxygenate brain.", time: "15:00" },
      { activity: "Hydration protocol: consume 500ml water and stretch for 5 mins.", time: "10:30" }
    ];

    // Suggestions to adjust metrics
    let healthRating = "Good";
    let advice = "Your schedule has a healthy balance of focused work and recovery periods.";
    
    if (workPercent > 80) {
      healthRating = "Warning (High Stress)";
      advice = "Your task load is extremely high. Please consider delegating tasks or adding an extra 30-minute meditation/wellness block.";
    }

    return {
      workPercent,
      wellnessPercent,
      healthRating,
      lifeRecommendations,
      advice,
      summary: `Analyzed schedule metrics (Work: ${workPercent}%, Wellness: ${wellnessPercent}%). Assigned Health Rating: ${healthRating}.`
    };
  }
}
