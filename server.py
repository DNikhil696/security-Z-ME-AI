import json
import http.server
import socketserver
import os
import re
import sys
from datetime import datetime

# Port to serve
PORT = 3000

# Mock DB
db = {
    "tasks": [
        { "id": 1, "title": "Review CISSP Network Security Principles", "priority": "High", "category": "Study", "status": "Pending", "score": 95, "timeBlock": "09:00 - 10:30" },
        { "id": 2, "title": "Setup local server TLS configuration", "priority": "High", "category": "Task", "status": "Pending", "score": 85, "timeBlock": "11:00 - 12:30" },
        { "id": 3, "title": "Cardio workout and hydration break", "priority": "Medium", "category": "Wellness", "status": "Completed", "score": 70, "timeBlock": "15:00 - 15:45" },
        { "id": 4, "title": "Prepare for security certification quiz", "priority": "High", "category": "Study", "status": "Pending", "score": 90, "timeBlock": "16:00 - 17:30" }
    ],
    "calendar": [
        { "id": 101, "title": "Morning Alignment Session", "time": "08:30", "duration": "30m", "type": "Routine" },
        { "id": 102, "title": "Study Block: Network Security", "time": "09:00", "duration": "90m", "type": "Study" },
        { "id": 103, "title": "System TLS Integration", "time": "11:00", "duration": "90m", "type": "Task" },
        { "id": 104, "title": "Active Leisure & Lunch", "time": "12:30", "duration": "60m", "type": "Wellness" },
        { "id": 105, "title": "Task Optimization Review", "time": "14:00", "duration": "30m", "type": "Routine" },
        { "id": 106, "title": "Cardio Break", "time": "15:00", "duration": "45m", "type": "Wellness" },
        { "id": 107, "title": "Quiz Prep & Study Deck", "time": "16:00", "duration": "90m", "type": "Study" }
    ],
    "studyDecks": {
        "network security": [
            { "question": "What is the primary difference between symmetric and asymmetric encryption?", "answer": "Symmetric uses the same key for both encryption and decryption, whereas asymmetric uses a public key for encryption and a private key for decryption." },
            { "question": "What security property does a digital signature provide?", "answer": "Non-repudiation, integrity, and authenticity." },
            { "question": "Explain the concept of Defense in Depth.", "answer": "A security strategy that implements multiple layers of defensive controls throughout an IT system to secure assets." }
        ],
        "general security": [
            { "question": "What does CIA triad stand for?", "answer": "Confidentiality, Integrity, and Availability." },
            { "question": "What is a Man-in-the-Middle (MitM) attack?", "answer": "An attack where the attacker secretly relays and possibly alters communications between two parties who believe they are directly communicating with each other." }
        ]
    },
    "securityLogs": [
        { "id": 1, "timestamp": datetime.utcnow().isoformat() + "Z", "action": "INIT", "details": "Security +Z ME AI active protection engine initialized.", "status": "SAFE" }
    ]
}

start_time = datetime.utcnow()

# Security functions
def validate_input(text):
    if not isinstance(text, str):
        return {"isValid": False, "reason": "Input must be a string"}
    # Block common command injections
    if re.search(r'[;&|`\$\(\)\{\}\[\]\<\>\*]', text):
        return {"isValid": False, "reason": "Input contains forbidden character (potential shell/command injection attempt)"}
    # Block path traversal
    if '..' in text or ('/' in text and '\\' in text):
        return {"isValid": False, "reason": "Input contains path traversal indicators (.. or mixed slashes)"}
    return {"isValid": True}

def sanitize_html(html_str):
    if not isinstance(html_str, str):
        return ""
    clean = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '[REMOVED SCRIPT]', html_str, flags=re.IGNORECASE)
    clean = re.sub(r'on\w+\s*=\s*(?:["\'][^\'"]*["\']|[^>\s]+)', '[REMOVED EVENT]', clean, flags=re.IGNORECASE)
    clean = re.sub(r'href\s*=\s*["\']javascript:[^\'"]*["\']', 'href="#"', clean, flags=re.IGNORECASE)
    return clean

def log_security_event(action, details, status="SAFE"):
    new_log = {
        "id": len(db["securityLogs"]) + 1,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "action": action,
        "details": sanitize_html(details),
        "status": status
    }
    db["securityLogs"].insert(0, new_log)
    return new_log

# Multi-agent simulation
def run_orchestrator(goal):
    execution_trace = []
    
    def log_trace(agent, action, message):
        execution_trace.append({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "agent": agent,
            "action": action,
            "message": message
        })

    log_trace('Orchestrator', 'START', f'Starting multi-agent resolution for goal: "{goal}"')
    
    # 1. Planner Agent
    log_trace('Planner Agent', 'PLANNING', 'Analyzing user goal, deconstructing tasks, and designing roadmap...')
    
    topic = 'general security'
    if re.search(r'crypto', goal, re.IGNORECASE):
        topic = 'cryptography'
    elif re.search(r'network|cissp|firewall', goal, re.IGNORECASE):
        topic = 'network security'

    tasks = [
        { "title": f"Study key terms in {topic}", "priority": "High", "category": "Study" },
        { "title": f"Configure system rules for {topic}", "priority": "High", "category": "Task" },
        { "title": f"Take practice exam on {topic}", "priority": "Medium", "category": "Study" }
    ]

    master_plan = [
        { "day": "Day 1", "focus": f"Deconstruct {topic} syllabus and draft firewall guidelines" },
        { "day": "Day 2", "focus": f"Deep dive study block and initial port configuration" },
        { "day": "Day 3", "focus": f"Mock exam execution and firewall security audit" }
    ]
    log_trace('Planner Agent', 'COMPLETE', f'Extracted primary goal to master "{topic}" and secure systems. Generated 3-day roadmap.')

    # Sync Tasks to db
    log_trace('Orchestrator', 'MCP_SYNC', f'Registering {len(tasks)} tasks via MCP tool \'add_task\'...')
    for t in tasks:
        scores = { 'High': 90, 'Medium': 70, 'Low': 50 }
        score = scores.get(t['priority'], 50)
        new_task = {
            "id": len(db["tasks"]) + 1,
            "title": sanitize_html(t['title']),
            "priority": t['priority'],
            "category": t['category'],
            "status": "Pending",
            "score": score,
            "timeBlock": "Unscheduled"
        }
        db["tasks"].append(new_task)
        log_trace('Orchestrator', 'MCP_TOOL_OK', f'Created task: "{t["title"]}"')
        log_security_event('TASK_ADDED', f'Successfully added task: {t["title"]}')

    # 2. Task Optimization Agent
    log_trace('Task Optimization Agent', 'OPTIMIZATION', 'Prioritizing new tasks and calculating security importance scores...')
    
    optimized_tasks = []
    for t in db["tasks"]:
        quadrant = 'Important & Urgent'
        score = 90
        if t['priority'] == 'Medium':
            quadrant = 'Important & Not Urgent'
            score = 70
        elif t['priority'] == 'Low':
            quadrant = 'Not Important & Urgent'
            score = 45
            
        if re.search(r'firewall|tls|configure', t['title'], re.IGNORECASE):
            score += 8
            quadrant = 'Important & Urgent'
            
        t['quadrant'] = quadrant
        t['score'] = min(score, 100)
        optimized_tasks.append(t)
        
    optimized_tasks.sort(key=lambda x: x['score'], reverse=True)
    log_trace('Task Optimization Agent', 'COMPLETE', f'Prioritized {len(optimized_tasks)} tasks. Identified security-sensitive operations.')

    # 3. Exam & Study Agent
    log_trace('Exam & Study Agent', 'STUDY_PLAN', f'Requesting active study card generation for topic: "{topic}"...')
    log_trace('Exam & Study Agent', 'MCP_CALL', f'Calling tool: generate_study_deck with params {{"topic": "{topic}"}}')
    
    deck_cards = db["studyDecks"].get(topic.lower(), [])
    if not deck_cards:
        deck_cards = [
            { "question": f"Define standard security practice in {topic}.", "answer": "Implementing role-based access control, monitoring logs, and validating user inputs." },
            { "question": f"What is the key vulnerability in {topic}?", "answer": "Lack of sanitization and weak authentication mechanisms." },
            { "question": f"How do you mitigate risks in {topic}?", "answer": "By using strong encryption algorithms, regular audits, and least privilege principles." }
        ]
        db["studyDecks"][topic.lower()] = deck_cards
        
    log_security_event('DECK_GENERATED', f'Generated flashcards and quiz questions for \'{topic}\'')
    log_trace('Exam & Study Agent', 'COMPLETE', f'Generated active recall deck with {len(deck_cards)} cards for "{topic}".')

    # 4. Life Scheduler Agent
    log_trace('Life Scheduler Agent', 'LIFE_BALANCE', 'Analyzing overall workload density and work-life balance scores...')
    
    work_tasks = len([t for t in db["tasks"] if t['category'] in ['Study', 'Task']])
    life_tasks = len([t for t in db["tasks"] if t['category'] in ['Wellness', 'Life']])
    total = work_tasks + life_tasks or 1
    work_percent = int((work_tasks / total) * 100)
    wellness_percent = 100 - work_percent
    
    health_rating = "Good"
    advice = "Your schedule has a healthy balance of focused work and recovery periods."
    if work_percent > 80:
        health_rating = "Warning (High Stress)"
        advice = "Your task load is extremely high. Please consider adding an extra 30-minute wellness block."
        
    log_trace('Life Scheduler Agent', 'COMPLETE', f'Analyzed schedule metrics (Work: {work_percent}%, Wellness: {wellness_percent}%). Assigned Health Rating: {health_rating}.')

    # Optimize Schedule via MCP
    log_trace('Life Scheduler Agent', 'MCP_CALL', 'Triggering task scheduler optimization via MCP tool...')
    
    db["tasks"].sort(key=lambda x: x['score'], reverse=True)
    db["calendar"] = [evt for evt in db["calendar"] if evt['type'] == 'Routine']
    
    current_hour = 9
    for task in db["tasks"]:
        time_block = f"{current_hour:02d}:00 - {current_hour+1:02d}:30"
        task['timeBlock'] = time_block
        task['optimized'] = True
        
        db["calendar"].append({
            "id": 200 + task['id'],
            "title": task['title'],
            "time": f"{current_hour:02d}:00",
            "duration": "90m",
            "type": task['category']
        })
        current_hour += 2
        if current_hour == 13:
            db["calendar"].append({ "id": 104, "title": "Active Leisure & Lunch", "time": "13:00", "duration": "60m", "type": "Wellness" })
            current_hour += 1
            
    db["calendar"].sort(key=lambda x: x['time'])
    log_security_event('SCHEDULE_OPTIMIZED', "Reorganized tasks & calendar focusing on 'balanced' metrics")
    log_trace('Orchestrator', 'MCP_TOOL_OK', 'Successfully optimized schedule grid.')

    final_output = f"""
<h3>System Resolution Complete!</h3>
<p>Here is your personalized, secure study and lifestyle plan generated by our ADK multi-agent network:</p>

<h4>1. Study & Task Roadmap</h4>
<ul>
  {"".join([f"<li><strong>{p['day']}</strong>: {p['focus']}</li>" for p in master_plan])}
</ul>

<h4>2. Optimized Eisenhower Priority Matrix</h4>
<ul>
  {"".join([f"<li><code>[{t['quadrant']}]</code> {t['title']} (Priority: {t['priority']}, Score: {t['score']})</li>" for t in db["tasks"][:4]])}
</ul>

<h4>3. Active Recall Revision Flashcards</h4>
<div class="flashcard-sample-box">
  {"".join([f'<div class="sample-card"><p class="question"><strong>Q{i+1}:</strong> {f["question"]}</p><p class="answer"><strong>A:</strong> {f["answer"]}</p></div>' for i, f in enumerate(deck_cards)])}
</div>

<h4>4. Health & Well-being Audit</h4>
<p><strong>Work-Life Balance:</strong> Study/Work tasks consume {work_percent}% of your active schedule, leaving {wellness_percent}% for wellness and active rest.</p>
<p><strong>Health Rating:</strong> <span class="badge {'badge-warning' if 'Warning' in health_rating else 'badge-safe'}">{health_rating}</span></p>
<p><strong>Wellness Recommendations:</strong></p>
<ul>
  <li>At 15:00: Cardio interval: 20-30 min brisk walk or run to oxygenate brain.</li>
  <li>At 10:30: Hydration protocol: consume 500ml water and stretch for 5 mins.</li>
</ul>
<p><em>Advisor Note: {advice}</em></p>
"""
    
    log_trace('Orchestrator', 'FINISH', 'Multi-agent coordination successfully completed. Final report generated.')
    
    return {
        "finalOutput": final_output,
        "executionTrace": execution_trace
    }

class SecureAgentAPIHandler(http.server.BaseHTTPRequestHandler):
    def end_headers(self):
        # Apply standard security headers (simulating Helmet middleware)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("X-XSS-Protection", "1; mode=block")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_GET(self):
        url_path = self.path.split('?')[0]
        
        # Route to API status
        if url_path == '/api/status':
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            uptime_seconds = int((datetime.utcnow() - start_time).total_seconds())
            res = {
                "status": "ONLINE",
                "uptime": uptime_seconds,
                "agents": ["PlannerAgent", "TaskOptimizerAgent", "ExamStudyAgent", "LifeSchedulerAgent"],
                "mcpConnected": True,
                "securityEngine": "ACTIVE (ADK + Sanitizer)"
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return
            
        # Route to API tasks list
        elif url_path == '/api/tasks':
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"content": db["tasks"]}).encode('utf-8'))
            return

        # Route to API calendar
        elif url_path == '/api/calendar':
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"content": db["calendar"]}).encode('utf-8'))
            return

        # Route to API security logs
        elif url_path == '/api/security/logs':
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"content": db["securityLogs"]}).encode('utf-8'))
            return

        # Route to static files
        else:
            if url_path == '/' or url_path == '':
                filename = 'public/index.html'
            else:
                filename = 'public/' + url_path.lstrip('/')
                
            # Prevent path traversal
            if '..' in filename or not filename.startswith('public/'):
                self.send_response(403)
                self.end_headers()
                self.wfile.write(b"Forbidden")
                return

            if os.path.exists(filename) and not os.path.isdir(filename):
                self.send_response(200)
                
                # Set mime types
                if filename.endswith('.html'):
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                elif filename.endswith('.css'):
                    self.send_header("Content-Type", "text/css; charset=utf-8")
                elif filename.endswith('.js'):
                    self.send_header("Content-Type", "application/javascript; charset=utf-8")
                else:
                    self.send_header("Content-Type", "application/octet-stream")
                    
                self.end_headers()
                with open(filename, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"Not Found")

    def do_POST(self):
        url_path = self.path.split('?')[0]
        
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            body = json.loads(post_data) if post_data else {}
        except Exception:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Invalid JSON body")
            return

        if url_path == '/api/chat':
            message = body.get('message', '')
            if not message:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Message content is required"}).encode('utf-8'))
                return

            # Input validation
            val = validate_input(message)
            if not val["isValid"]:
                log_security_event('CHAT_BLOCKED', f'Blocked dangerous chat input: "{message}" due to: {val["reason"]}', 'BLOCKED')
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                res = {
                    "error": "Security Alert: Message blocked by the security validation engine.",
                    "reason": val["reason"]
                }
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            # Run Orchestrator
            log_security_event('CHAT_REQUEST', f'Received user goal prompt: "{message}"')
            response_data = run_orchestrator(message)
            
            # Sanitize output html elements
            response_data["finalOutput"] = sanitize_html(response_data["finalOutput"])
            for trace in response_data["executionTrace"]:
                trace["message"] = sanitize_html(trace["message"])

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            return

        elif url_path == '/api/mcp/call':
            tool = body.get('tool', '')
            args = body.get('arguments', {})
            
            if not tool:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Tool name is required"}).encode('utf-8'))
                return

            log_security_event('MCP_TOOL_CALL', f'Attempting tool execution: {tool} with args {json.dumps(args)}')

            # Check parameters for command injection
            for key, val in args.items():
                if isinstance(val, str):
                    v_res = validate_input(val)
                    if not v_res["isValid"]:
                        log_security_event('SECURITY_VIOLATION', f"Blocked tool: {tool}. Param '{key}' failed: {v_res['reason']}", 'BLOCKED')
                        self.send_response(400)
                        self.send_header("Content-Type", "application/json")
                        self.end_headers()
                        self.wfile.write(json.dumps({"error": f"Security Violation: Parameter '{key}' contains forbidden characters."}).encode('utf-8'))
                        return

            if tool == 'add_task':
                title = args.get('title', '')
                priority = args.get('priority', 'High')
                category = args.get('category', 'Study')
                
                sanitized_title = sanitize_html(title)
                scores = { 'High': 90, 'Medium': 70, 'Low': 50 }
                score = scores.get(priority, 50)
                
                new_task = {
                    "id": len(db["tasks"]) + 1,
                    "title": sanitized_title,
                    "priority": priority,
                    "category": category,
                    "status": "Pending",
                    "score": score,
                    "timeBlock": "Unscheduled"
                }
                db["tasks"].append(new_task)
                log_security_event('TASK_ADDED', f"Successfully added task: {sanitized_title}")
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "task": new_task}).encode('utf-8'))
                return

            elif tool == 'generate_study_deck':
                topic = args.get('topic', '')
                clean_topic = sanitize_html(topic).lower()
                
                cards = db["studyDecks"].get(clean_topic, [])
                if not cards:
                    cards = [
                        { "question": f"Define standard security practice in {topic}.", "answer": "Implementing role-based access control, monitoring logs, and validating user inputs." },
                        { "question": f"What is the key vulnerability in {topic}?", "answer": "Lack of sanitization and weak authentication mechanisms." },
                        { "question": f"How do you mitigate risks in {topic}?", "answer": "By using strong encryption algorithms, regular audits, and least privilege principles." }
                    ]
                    db["studyDecks"][clean_topic] = cards

                log_security_event('DECK_GENERATED', f"Generated study deck cards for '{topic}'")
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "cards": cards}).encode('utf-8'))
                return
            
            else:
                log_security_event('MCP_ERROR', f"Requested execution of unknown tool: {tool}", 'BLOCKED')
                self.send_response(404)
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Tool {tool} not found"}).encode('utf-8'))
                return

        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    # Force working directory to current folder
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    handler = SecureAgentAPIHandler
    # Set server to reuse address
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"[security +Z ME AI] Python Server started successfully at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            sys.exit(0)
