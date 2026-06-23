import { Agent } from './agent-base.js';

export class PlannerAgent extends Agent {
  constructor() {
    super(
      'Planner Agent',
      `You are the coordinator of the +Z ME AI system. Your task is to analyze user requests, extract core goals, and generate a structured schedule outline. You must delegate optimization, study techniques, and lifestyle balance to your partner agents.`
    );
  }

  async execute(input, context = {}) {
    const rawGoal = input.trim();
    
    // Simple natural language parsing of topics and deadlines
    let topic = 'general security';
    if (/crypto/i.test(rawGoal)) {
      topic = 'cryptography';
    } else if (/network/i.test(rawGoal) || /cissp/i.test(rawGoal) || /firewall/i.test(rawGoal)) {
      topic = 'network security';
    }

    // Deconstruct target tasks
    const tasks = [
      { title: `Study key terms in ${topic}`, priority: 'High', category: 'Study' },
      { title: `Configure system rules for ${topic}`, priority: 'High', category: 'Task' },
      { title: `Take practice exam on ${topic}`, priority: 'Medium', category: 'Study' }
    ];

    const masterPlan = [
      { day: 'Day 1', focus: `Deconstruct ${topic} syllabus and draft firewall guidelines` },
      { day: 'Day 2', focus: `Deep dive study block and initial port configuration` },
      { day: 'Day 3', focus: `Mock exam execution and firewall security audit` }
    ];

    return {
      topic,
      tasks,
      masterPlan,
      summary: `Extracted primary goal to master "${topic}" and secure systems. Generated 3-day roadmap.`
    };
  }
}
