import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { db, handleMcpToolCall, handleMcpResourceRead, logSecurityEvent } from './mcp-server.js';
import { runOrchestrator } from './agents/orchestrator.js';
import { validateInput, sanitizeHTML } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allowed for simple SPA inline routing scripts
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(cors());
app.use(express.json());

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint: Dashboard Server Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    uptime: Math.floor(process.uptime()),
    agents: ['PlannerAgent', 'TaskOptimizerAgent', 'ExamStudyAgent', 'LifeSchedulerAgent'],
    mcpConnected: true,
    securityEngine: 'ACTIVE (ADK + Sanitizer)'
  });
});

// API Endpoint: Retrieve MCP Tasks Resource
app.get('/api/tasks', (req, res) => {
  try {
    const data = handleMcpResourceRead('tasks://list');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint: Retrieve MCP Calendar Resource
app.get('/api/calendar', (req, res) => {
  try {
    const data = handleMcpResourceRead('calendar://today');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint: Retrieve MCP Security Logs Resource
app.get('/api/security/logs', (req, res) => {
  try {
    const data = handleMcpResourceRead('security://status');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint: Call an MCP Tool directly (simulated JSON-RPC)
app.post('/api/mcp/call', (req, res) => {
  const { tool, arguments: args } = req.body;
  
  if (!tool) {
    return res.status(400).json({ error: 'Missing parameter: tool name is required' });
  }
  
  try {
    const result = handleMcpToolCall(tool, args || {});
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API Endpoint: Send prompt to the Multi-Agent Orchestrator
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  // Pre-Execution Input validation
  const validation = validateInput(message);
  if (!validation.isValid) {
    logSecurityEvent('CHAT_BLOCKED', `Blocked dangerous chat input: "${message}" due to: ${validation.reason}`, 'BLOCKED');
    return res.status(400).json({ 
      error: 'Security Alert: Message blocked by the security validation engine.', 
      reason: validation.reason,
      logs: handleMcpResourceRead('security://status').content
    });
  }

  try {
    logSecurityEvent('CHAT_REQUEST', `Received user goal prompt: "${message}"`);
    
    // Run multi-agent solver
    const response = await runOrchestrator(message);
    
    // Return sanitized outputs
    const sanitizedResponse = {
      finalOutput: sanitizeHTML(response.finalOutput),
      executionTrace: response.executionTrace.map(log => ({
        ...log,
        message: sanitizeHTML(log.message)
      }))
    };

    res.json(sanitizedResponse);
  } catch (error) {
    logSecurityEvent('EXECUTION_ERROR', `Error processing user chat: ${error.message}`, 'BLOCKED');
    res.status(500).json({ error: 'Orchestrator Execution Failed', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error: Security Integrity Preserved');
});

// Start Server
app.listen(PORT, () => {
  console.log(`[security +Z ME AI] Running at http://localhost:${PORT}`);
  logSecurityEvent('SERVER_START', `Server started successfully on port ${PORT}`);
});
