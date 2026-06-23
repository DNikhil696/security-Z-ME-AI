// Tab Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabId = item.getAttribute('data-tab');
    
    // Deactivate previous active nav/tab
    navItems.forEach(n => n.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));
    
    // Activate current
    item.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
  });
});

// App State Cache
let uptime = 0;
let threatsCount = 0;
let validationCount = 1; // 1 for initialization

// DOM Elements
const statusVal = document.getElementById('status-val');
const uptimeVal = document.getElementById('uptime-val');
const threatsCountEl = document.getElementById('threats-count');
const checksCountEl = document.getElementById('checks-count');
const securityLogsBody = document.getElementById('security-logs-body');

const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const telemetryLog = document.getElementById('telemetry-log');

const quadUI = document.getElementById('quad-ui');
const quadINU = document.getElementById('quad-inu');
const quadUNI = document.getElementById('quad-uni');
const quadNUNI = document.getElementById('quad-nuni');

const calendarBody = document.getElementById('calendar-body');

const mcpAddTaskForm = document.getElementById('mcp-add-task-form');
const customTopicInput = document.getElementById('custom-topic-input');
const loadTopicBtn = document.getElementById('load-topic-btn');
const flashcardsLayout = document.getElementById('flashcards-layout');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Start server clock
  setInterval(() => {
    uptime++;
    uptimeVal.textContent = `${uptime}s`;
  }, 1000);

  // Load Initial Resources
  refreshAllData();
});

// Refresh all dashboard views
async function refreshAllData() {
  await fetchTasks();
  await fetchCalendar();
  await fetchSecurityLogs();
}

// Fetch Tasks and populate Eisenhower Matrix
async function fetchTasks() {
  try {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    const tasks = data.content || [];
    
    // Clear list boxes
    quadUI.innerHTML = '';
    quadINU.innerHTML = '';
    quadUNI.innerHTML = '';
    quadNUNI.innerHTML = '';

    tasks.forEach(task => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${task.title}</span>
        <span class="task-score">Score: ${task.score}</span>
      `;

      // Determine quadrant
      let quad = task.quadrant;
      if (!quad) {
        // Fallback calculation if not set by agent
        if (task.priority === 'High') quad = 'Important & Urgent';
        else if (task.priority === 'Medium') quad = 'Important & Not Urgent';
        else quad = 'Not Important & Urgent';
      }

      if (quad === 'Important & Urgent') quadUI.appendChild(li);
      else if (quad === 'Important & Not Urgent') quadINU.appendChild(li);
      else if (quad === 'Not Important & Urgent') quadUNI.appendChild(li);
      else quadNUNI.appendChild(li);
    });

    // Populate placeholders if empty
    [quadUI, quadINU, quadUNI, quadNUNI].forEach(quadEl => {
      if (quadEl.children.length === 0) {
        quadEl.innerHTML = '<li class="empty-placeholder" style="color: #555; background: none; border: none; justify-content: center;">No active tasks</li>';
      }
    });
  } catch (e) {
    console.error("Failed to load tasks", e);
  }
}

// Fetch Calendar Schedule
async function fetchCalendar() {
  try {
    const res = await fetch('/api/calendar');
    const data = await res.json();
    const events = data.content || [];

    calendarBody.innerHTML = '';
    
    events.forEach(evt => {
      const row = document.createElement('div');
      row.classList.add('calendar-row');
      row.innerHTML = `
        <div style="font-family: var(--font-code); font-size: 0.85rem;">${evt.time}</div>
        <div style="font-weight: 500;">${evt.title}</div>
        <div><span class="type-tag ${evt.type}">${evt.type}</span></div>
        <div style="color: var(--color-text-sub);">${evt.duration}</div>
      `;
      calendarBody.appendChild(row);
    });

    if (events.length === 0) {
      calendarBody.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--color-text-sub);">Schedule is empty</div>';
    }
  } catch (e) {
    console.error("Failed to load calendar", e);
  }
}

// Fetch Security Logs and update counters
async function fetchSecurityLogs() {
  try {
    const res = await fetch('/api/security/logs');
    const data = await res.json();
    const logs = data.content || [];

    securityLogsBody.innerHTML = '';
    
    let blockedCount = 0;
    logs.forEach(log => {
      if (log.status === 'BLOCKED') {
        blockedCount++;
      }
      
      const tr = document.createElement('tr');
      const logTime = new Date(log.timestamp).toLocaleTimeString();
      tr.innerHTML = `
        <td style="font-family: var(--font-code); color: var(--color-text-sub);">${logTime}</td>
        <td><strong>${log.action}</strong></td>
        <td>${log.details}</td>
        <td><span class="audit-status ${log.status}">${log.status}</span></td>
      `;
      securityLogsBody.appendChild(tr);
    });

    threatsCount = blockedCount;
    validationCount = logs.length;

    threatsCountEl.textContent = threatsCount;
    checksCountEl.textContent = validationCount;
  } catch (e) {
    console.error("Failed to load security logs", e);
  }
}

// Send Goal prompt to Agent Orchestrator
async function solveGoal() {
  const goalText = chatInput.value.trim();
  if (!goalText) return;

  // Append user message to chat UI
  appendChatMessage('user', '👤 User Request', goalText);
  chatInput.value = '';

  // Show status / loader bubble
  const loaderId = appendChatMessage('agent', '⚡ security +Z ME AI Orchestrator', 'Analyzing goal and initiating multi-agent validation protocol...');
  
  // Clear telemetry panel
  telemetryLog.innerHTML = '<div class="telemetry-item q-color-1"><span class="tel-time">00:00:00:00</span><span class="tel-text">[System] Initiating ADK Multi-Agent pipeline...</span></div>';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: goalText })
    });

    const data = await response.json();
    
    // Remove loader
    document.getElementById(loaderId).remove();

    if (!response.ok) {
      appendChatMessage('agent', '🛡️ Security Block Alert', `
        <div style="color: var(--color-blocked); font-weight: 600;">Execution Intercepted & Blocked</div>
        <p>${data.error || 'Request violates core security checks.'}</p>
        <p><strong>Reason:</strong> ${data.reason || 'Forbidden injection syntax detected.'}</p>
      `);
      await fetchSecurityLogs();
      return;
    }

    // Append final markdown response
    appendChatMessage('agent', '⚡ security +Z ME AI Orchestrator', data.finalOutput);

    // Populate Telemetry panel logs
    if (data.executionTrace && data.executionTrace.length > 0) {
      telemetryLog.innerHTML = '';
      data.executionTrace.forEach((trace, idx) => {
        const div = document.createElement('div');
        div.classList.add('telemetry-item');
        div.classList.add(`q-color-${(idx % 5) + 1}`);
        
        const dateObj = new Date();
        const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}:${String(Math.floor(dateObj.getMilliseconds() / 10)).padStart(2, '0')}`;
        
        div.innerHTML = `
          <span class="tel-time">${timeStr}</span>
          <span class="tel-text">${trace.message}</span>
        `;
        telemetryLog.appendChild(div);
      });
      // Scroll to bottom of telemetry
      telemetryLog.scrollTop = telemetryLog.scrollHeight;
    }

    // Refresh view states
    await refreshAllData();

  } catch (error) {
    document.getElementById(loaderId).remove();
    appendChatMessage('agent', '⚡ System Error', `Execution failed: ${error.message}`);
  }
}

// Append bubble to chat console
function appendChatMessage(sender, name, content) {
  const id = 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5);
  const div = document.createElement('div');
  div.classList.add('chat-message');
  div.classList.add(sender === 'user' ? 'user-msg' : 'agent-msg');
  div.id = id;

  div.innerHTML = `
    <div class="sender-tag">${name}</div>
    <div class="msg-body">${content}</div>
  `;
  
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
  return id;
}

// Event Bindings
chatSendBtn.addEventListener('click', solveGoal);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    solveGoal();
  }
});

// Call add_task via Direct MCP Tool Form
mcpAddTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('task-title').value;
  const priority = document.getElementById('task-priority').value;
  const category = document.getElementById('task-category').value;

  try {
    const res = await fetch('/api/mcp/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'add_task',
        arguments: { title, priority, category }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`MCP Call Blocked: ${data.error}`);
    } else {
      document.getElementById('task-title').value = '';
      await refreshAllData();
    }
  } catch (err) {
    alert(`Error calling MCP tool: ${err.message}`);
  }
});

// Direct generate study deck trigger
async function generateStudyDeck(topic) {
  if (!topic) return;
  flashcardsLayout.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Calling generate_study_deck...</div>';
  
  try {
    const res = await fetch('/api/mcp/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'generate_study_deck',
        arguments: { topic }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      flashcardsLayout.innerHTML = `<div class="empty-state" style="color: var(--color-blocked);">Blocked: ${data.error}</div>`;
      await fetchSecurityLogs();
      return;
    }

    flashcardsLayout.innerHTML = '';
    const cards = data.cards || [];
    
    cards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.classList.add('flashcard');
      cardEl.innerHTML = `
        <div class="flashcard-inner">
          <div class="flashcard-front">
            <span style="font-size: 0.75rem; color: var(--color-text-sub); margin-bottom: 0.5rem; text-transform: uppercase;">Question</span>
            <p><strong>${card.question}</strong></p>
            <span style="font-size: 0.7rem; color: var(--color-accent-dim); margin-top: 1rem;">Click to flip</span>
          </div>
          <div class="flashcard-back">
            <span style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-bottom: 0.5rem; text-transform: uppercase;">Answer</span>
            <p>${card.answer}</p>
          </div>
        </div>
      `;
      
      cardEl.addEventListener('click', () => {
        cardEl.classList.toggle('flipped');
      });
      
      flashcardsLayout.appendChild(cardEl);
    });

    if (cards.length === 0) {
      flashcardsLayout.innerHTML = '<div class="empty-state">No cards returned.</div>';
    }

    await refreshAllData();

  } catch (err) {
    flashcardsLayout.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
  }
}

loadTopicBtn.addEventListener('click', () => {
  const topic = customTopicInput.value.trim();
  generateStudyDeck(topic);
});
customTopicInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    generateStudyDeck(customTopicInput.value.trim());
  }
});
