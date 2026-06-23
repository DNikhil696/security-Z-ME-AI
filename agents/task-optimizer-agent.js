import { Agent } from './agent-base.js';

export class TaskOptimizerAgent extends Agent {
  constructor() {
    super(
      'Task Optimization Agent',
      `You are the task prioritizer of the +Z ME AI system. Your task is to apply time management models (e.g. Eisenhower Matrix) and assign critical scores to tasks to ensure efficient execution.`
    );
  }

  async execute(input, context = {}) {
    const { tasks = [] } = context;
    
    // Sort tasks into Eisenhower Matrix quadrants
    const optimizedTasks = tasks.map((task, index) => {
      let quadrant = 'Important & Urgent';
      let score = 90;
      
      if (task.priority === 'Medium') {
        quadrant = 'Important & Not Urgent';
        score = 70;
      } else if (task.priority === 'Low') {
        quadrant = 'Not Important & Urgent';
        score = 45;
      }
      
      // If task title mentions firewall or rules, boost importance score due to security risk
      if (/firewall|tls|configure/i.test(task.title)) {
        score += 8;
        quadrant = 'Important & Urgent';
      }

      return {
        ...task,
        quadrant,
        score: Math.min(score, 100)
      };
    });

    // Sort by score descending
    optimizedTasks.sort((a, b) => b.score - a.score);

    return {
      optimizedTasks,
      summary: `Prioritized ${optimizedTasks.length} tasks. Identified security-sensitive operations and placed them in Important & Urgent quadrant.`
    };
  }
}
