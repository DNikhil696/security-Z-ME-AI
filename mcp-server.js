import { sanitizeHTML, validateInput, validateSandboxCode } from './security.js';

// In-Memory Data Store simulating MCP server database
export const db = {
  tasks: [
    { id: 1, title: 'Review CISSP Network Security Principles', priority: 'High', category: 'Study', status: 'Pending', score: 95, timeBlock: '09:00 - 10:30' },
    { id: 2, title: 'Setup local server TLS configuration', priority: 'High', category: 'Task', status: 'Pending', score: 85, timeBlock: '11:00 - 12:30' },
    { id: 3, title: 'Cardio workout and hydration break', priority: 'Medium', category: 'Wellness', status: 'Completed', score: 70, timeBlock: '15:00 - 15:45' },
    { id: 4, title: 'Prepare for security certification quiz', priority: 'High', category: 'Study', status: 'Pending', score: 90, timeBlock: '16:00 - 17:30' }
  ],
  calendar: [
    { id: 101, title: 'Morning Alignment Session', time: '08:30', duration: '30m', type: 'Routine' },
    { id: 102, title: 'Study Block: Network Security', time: '09:00', duration: '90m', type: 'Study' },
    { id: 103, title: 'System TLS Integration', time: '11:00', duration: '90m', type: 'Task' },
    { id: 104, title: 'Active Leisure & Lunch', time: '12:30', duration: '60m', type: 'Wellness' },
    { id: 105, title: 'Task Optimization Review', time: '14:00', duration: '30m', type: 'Routine' },
    { id: 106, title: 'Cardio Break', time: '15:00', duration: '45m', type: 'Wellness' },
    { id: 107, title: 'Quiz Prep & Study Deck', time: '16:00', duration: '90m', type: 'Study' }
  ],
  studyDecks: {
    "network security": [
      { question: "What is the primary difference between symmetric and asymmetric encryption?", answer: "Symmetric uses the same key for both encryption and decryption, whereas asymmetric uses a public key for encryption and a private key for decryption." },
      { question: "What security property does a digital signature provide?", answer: "Non-repudiation, integrity, and authenticity." },
      { question: "Explain the concept of Defense in Depth.", answer: "A security strategy that implements multiple layers of defensive controls throughout an IT system to secure assets." }
    ],
    "general security": [
      { question: "What does CIA triad stand for?", answer: "Confidentiality, Integrity, and Availability." },
      { question: "What is a Man-in-the-Middle (MitM) attack?", answer: "An attack where the attacker secretly relays and possibly alters communications between two parties who believe they are directly communicating with each other." }
    ]
  },
  securityLogs: [
    { id: 1, timestamp: new Date().toISOString(), action: 'INIT', details: 'Security +Z ME AI active protection engine initialized.', status: 'SAFE' }
  ]
};

// Log a security event
export function logSecurityEvent(action, details, status = 'SAFE') {
  const newLog = {
    id: db.securityLogs.length + 1,
    timestamp: new Date().toISOString(),
    action,
    details: sanitizeHTML(details),
    status
  };
  db.securityLogs.unshift(newLog); // Prepend to show newest first
  return newLog;
}

// MCP Resources List
export const resources = [
  {
    uri: 'tasks://list',
    name: 'Current task registry',
    description: 'Lists all pending and completed system and study tasks',
    mimeType: 'application/json'
  },
  {
    uri: 'calendar://today',
    name: 'Today\'s active calendar',
    description: 'Retrieves current day timeslots and event classifications',
    mimeType: 'application/json'
  },
  {
    uri: 'security://status',
    name: 'Real-time security logs',
    description: 'Audit logs of safety checks, input sanitization, and blockages',
    mimeType: 'application/json'
  }
];

// MCP Tools List
export const tools = [
  {
    name: 'add_task',
    description: 'Adds a new task to the system database with automatic security evaluation.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The title of the task' },
        priority: { type: 'string', enum: ['High', 'Medium', 'Low'], description: 'Task priority level' },
        category: { type: 'string', enum: ['Study', 'Task', 'Wellness', 'Life'], description: 'Category classification' }
      },
      required: ['title', 'priority', 'category']
    }
  },
  {
    name: 'optimize_schedule',
    description: 'Reorders current tasks based on importance, deadline weights, and health ratios.',
    inputSchema: {
      type: 'object',
      properties: {
        factor: { type: 'string', enum: ['study-heavy', 'balanced', 'wellness-heavy'], description: 'Rationing focus factor' }
      }
    }
  },
  {
    name: 'validate_study_material',
    description: 'Scans and sanitizes foreign content block inputs before feeding it to exam agents.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Raw text content to sanitize' }
      },
      required: ['text']
    }
  },
  {
    name: 'generate_study_deck',
    description: 'Spins up flashcards and study decks for a specific topic with safe content filters.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Study topic (e.g., Network Security, Cryptography)' }
      },
      required: ['topic']
    }
  }
];

// Router-like MCP tool call handler
export function handleMcpToolCall(toolName, args) {
  logSecurityEvent('MCP_TOOL_CALL', `Attempting tool execution: ${toolName} with args ${JSON.stringify(args)}`);

  // General argument security checking
  for (const key in args) {
    if (typeof args[key] === 'string') {
      const validationResult = validateInput(args[key]);
      if (!validationResult.isValid) {
        logSecurityEvent('SECURITY_VIOLATION', `Blocked tool: ${toolName}. Param '${key}' failed validation: ${validationResult.reason}`, 'BLOCKED');
        throw new Error(`Security Violation: Parameter '${key}' contains forbidden characters or patterns.`);
      }
    }
  }

  switch (toolName) {
    case 'add_task': {
      const { title, priority, category } = args;
      const sanitizedTitle = sanitizeHTML(title);
      
      // Calculate a score dynamically based on priority
      const scores = { 'High': 90, 'Medium': 70, 'Low': 50 };
      const score = (scores[priority] || 50) + Math.floor(Math.random() * 10);
      
      const newTask = {
        id: db.tasks.length + 1,
        title: sanitizedTitle,
        priority,
        category,
        status: 'Pending',
        score,
        timeBlock: 'Unscheduled'
      };
      
      db.tasks.push(newTask);
      logSecurityEvent('TASK_ADDED', `Successfully added task: ${sanitizedTitle}`);
      return { success: true, task: newTask };
    }

    case 'optimize_schedule': {
      const { factor = 'balanced' } = args;
      
      // Sort tasks based on score (descending)
      db.tasks.sort((a, b) => b.score - a.score);
      
      // Re-allocate time blocks based on focus factor
      let currentHour = 9;
      db.calendar = db.calendar.filter(evt => evt.type === 'Routine'); // Keep alignment and reviews
      
      db.tasks.forEach(task => {
        const timeBlock = `${String(currentHour).padStart(2, '0')}:00 - ${String(currentHour + 1).padStart(2, '0')}:30`;
        task.timeBlock = timeBlock;
        task.optimized = true;
        
        db.calendar.push({
          id: 200 + task.id,
          title: task.title,
          time: `${String(currentHour).padStart(2, '0')}:00`,
          duration: '90m',
          type: task.category
        });
        
        currentHour += 2;
        if (factor === 'balanced' && currentHour === 13) {
          // Insert lunch/wellness
          db.calendar.push({ id: 104, title: 'Active Leisure & Lunch', time: '13:00', duration: '60m', type: 'Wellness' });
          currentHour++;
        }
      });
      
      // Sort calendar by time
      db.calendar.sort((a, b) => a.time.localeCompare(b.time));
      
      logSecurityEvent('SCHEDULE_OPTIMIZED', `Reorganized tasks & calendar focusing on '${factor}' metrics`);
      return { success: true, message: `Calendar optimized for ${factor} focus.` };
    }

    case 'validate_study_material': {
      const { text } = args;
      const validationResult = validateInput(text);
      if (!validationResult.isValid) {
        logSecurityEvent('SECURITY_VIOLATION', `Study material blocked: ${validationResult.reason}`, 'BLOCKED');
        return { isSafe: false, reason: validationResult.reason };
      }
      
      const cleanText = sanitizeHTML(text);
      logSecurityEvent('STUDY_MATERIAL_SCAN', 'Study material scan complete: Clean');
      return { isSafe: true, sanitizedContent: cleanText };
    }

    case 'generate_study_deck': {
      const { topic } = args;
      const cleanTopic = sanitizeHTML(topic).toLowerCase();
      
      let deck = db.studyDecks[cleanTopic];
      if (!deck) {
        // Generate mock study cards if topic is new, but keep it clean
        deck = [
          { question: `Define standard security practice in ${topic}.`, answer: `Implementing role-based access control, monitoring logs, and validating user inputs.` },
          { question: `What is the key vulnerability in ${topic}?`, answer: `Lack of sanitization and weak authentication mechanisms.` },
          { question: `How do you mitigate risks in ${topic}?`, answer: `By using strong encryption algorithms, regular audits, and least privilege principles.` }
        ];
        db.studyDecks[cleanTopic] = deck;
      }
      
      logSecurityEvent('DECK_GENERATED', `Generated flashcards and quiz questions for '${topic}'`);
      return { success: true, topic, cards: deck };
    }

    default:
      logSecurityEvent('MCP_ERROR', `Requested execution of unknown tool: ${toolName}`, 'BLOCKED');
      throw new Error(`Tool not found: ${toolName}`);
  }
}

// Read resource contents
export function handleMcpResourceRead(uri) {
  logSecurityEvent('MCP_RESOURCE_READ', `Resource fetch requested: ${uri}`);
  switch (uri) {
    case 'tasks://list':
      return { content: db.tasks };
    case 'calendar://today':
      return { content: db.calendar };
    case 'security://status':
      return { content: db.securityLogs };
    default:
      logSecurityEvent('MCP_ERROR', `Failed reading unknown resource: ${uri}`, 'BLOCKED');
      throw new Error(`Resource not found: ${uri}`);
  }
}
