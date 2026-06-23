import { Agent } from './agent-base.js';

export class ExamAgent extends Agent {
  constructor() {
    super(
      'Exam & Study Agent',
      `You are the study expert of the +Z ME AI system. Your task is to generate active recall study decks, flashcards, and practice quizzes to help the user master technical content.`
    );
  }

  async execute(input, context = {}) {
    const { topic = 'general security', mcpConnector } = context;

    let deck = { cards: [] };
    
    // Simulate calling the MCP tool via the orchestrator connector
    if (mcpConnector && typeof mcpConnector.callTool === 'function') {
      try {
        deck = await mcpConnector.callTool('generate_study_deck', { topic });
      } catch (err) {
        console.error("ExamAgent failed to call MCP generate_study_deck:", err);
      }
    }

    // Fallback deck if MCP call failed or was empty
    if (!deck || !deck.cards || deck.cards.length === 0) {
      deck = {
        cards: [
          { question: `What is the CIA triad in ${topic}?`, answer: "Confidentiality, Integrity, and Availability." },
          { question: `What is a common threat to ${topic}?`, answer: "Eavesdropping and data alteration due to insufficient sanitization or weak controls." }
        ]
      };
    }

    const activeRecallGuide = [
      "Use spaced repetition: review these cards 1 hour from now, then tomorrow, then in 3 days.",
      "Self-explanation: explain the answers to yourself aloud to reinforce memory connection."
    ];

    return {
      topic,
      flashcards: deck.cards,
      activeRecallGuide,
      summary: `Generated active recall deck with ${deck.cards.length} cards for "${topic}". Compiled revision strategies.`
    };
  }
}
