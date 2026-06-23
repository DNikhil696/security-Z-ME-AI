/**
 * Base Agent class for the ADK (Agent Development Kit) multi-agent pattern.
 */
export class Agent {
  constructor(name, systemPrompt) {
    this.name = name;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Process a request under the context of this agent's persona.
   * @param {string} input - The input goal or instruction.
   * @param {object} context - Shared execution context from other agents.
   * @returns {Promise<object>} - Agent execution output.
   */
  async execute(input, context = {}) {
    throw new Error('Execute method must be implemented by subclass');
  }
}
