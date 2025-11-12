# AI Agent Instructions: Distributed Architecture with GitTree Control

## Overview

This system implements a **hierarchical AI agent architecture** with centralized control and isolated parallel sessions using GitTree. The central agent orchestrates multiple individual agents operating in isolated directory trees, preventing unauthorized access to root or sibling directories.

---

## Architecture Principles

### 1. Central Agent Authority
- **Role**: Acts as the orchestrator and dispatcher for all operations
- **Responsibility**: Manages agent lifecycle, resource allocation, and security
- **Authority**: Only the central agent can:
  - Create new individual agents
  - Assign directory namespaces
  - Authorize cross-agent communication
  - Modify global configuration
  - Terminate agents and clean up resources
  - Monitor and log agent activities

### 2. Individual Agent Isolation
- **Filesystem Sandbox**: Each agent operates exclusively within its assigned directory
- **Access Control**: Agents have read/write permissions ONLY to:
  - `/agents/{agent_id}/` (their own workspace)
  - `/agents/{agent_id}/temp/` (temporary files)
  - `/agents/{agent_id}/output/` (results directory)
- **Restrictions**: Agents CANNOT:
  - Access `/` (root)
  - Access `/agents/` (parent directory)
  - Access `/agents/{other_agent_id}/` (sibling directories)
  - Execute system-level commands outside their sandbox
  - Modify environment variables beyond their scope

### 3. GitTree for Parallel Sessions
- **Purpose**: Manages branching sessions and version control for agent work
- **Structure**:
  ```
  repo/
  ├── main/ (central configuration)
  ├── agents/
  │   ├── agent_001/
  │   │   ├── task.md (assigned task)
  │   │   ├── status.json (current state)
  │   │   ├── workspace/ (working directory)
  │   │   └── output/ (results)
  │   ├── agent_002/
  │   │   └── [same structure]
  │   └── agent_N/
  │       └── [same structure]
  └── logs/ (central audit trail)
  ```

---

## Central Agent Responsibilities

### Session Management
```
TASK: Create parallel sessions
PROCESS:
  1. Central agent receives task distribution request
  2. Generates unique agent_id (UUID or sequential ID)
  3. Creates isolated directory: /agents/{agent_id}/
  4. Initializes git branch: agents/{agent_id}
  5. Writes task manifest to {agent_id}/task.md
  6. Spawns individual agent with limited permissions
  7. Logs creation event with timestamp and parameters
```

### Task Distribution
```
TASK: Distribute work across agents
PROCESS:
  1. Parse incoming workload into discrete tasks
  2. Calculate resource requirements for each task
  3. Assign task to agent with available capacity
  4. Write task.md with:
     - Task description
     - Input data location
     - Expected output format
     - Deadline/timeout
     - Resource constraints
  5. Notify agent (via status.json trigger)
  6. Monitor execution progress
```

### Security Enforcement
```
TASK: Enforce directory isolation
PROCESS:
  1. Apply filesystem permissions:
     - chmod 700 /agents/{agent_id}/ (only agent can access)
     - chmod 600 /agents/{agent_id}/*.json (read-only config)
  2. Set environment variables per agent:
     - AGENT_ID={agent_id}
     - AGENT_HOME=/agents/{agent_id}/
     - SANDBOX_ROOT=/agents/{agent_id}/
  3. Validate all file operations against whitelist
  4. Log and block unauthorized access attempts
  5. Terminate agent on repeated violations
```

### Monitoring & Logging
```
TASK: Monitor all agent activities
PROCESS:
  1. Read status.json from each agent periodically
  2. Check for completion signals or errors
  3. Aggregate metrics:
     - Execution time
     - Resource usage
     - Error count
     - Output quality
  4. Write to /logs/agent_{agent_id}_YYYY-MM-DD.log
  5. Alert on:
     - Timeout exceeded
     - Resource overrun
     - Unauthorized access attempts
     - Task failure
```

---

## Individual Agent Requirements

### Startup Protocol
```
WHEN: Agent process initiates
VERIFY:
  1. Check AGENT_ID environment variable is set
  2. Verify /agents/{AGENT_ID}/ directory exists
  3. Read task.md from local directory ONLY
  4. Validate task schema (has description, input, output spec)
  5. Create /agents/{AGENT_ID}/temp/ if missing
  6. Create /agents/{AGENT_ID}/output/ if missing
  7. Initialize status.json:
     {
       "agent_id": "{AGENT_ID}",
       "status": "initialized",
       "started_at": "ISO_TIMESTAMP",
       "progress": 0
     }
  8. Signal ready to central agent
```

### During Execution
```
WHILE: Task is running
CONSTRAINTS:
  - ALL file operations must use relative paths from AGENT_HOME
  - NEVER use absolute paths starting with /
  - NEVER use ../ to traverse above AGENT_HOME
  - NEVER access /root, /etc, /sys, etc.
  - NEVER execute shell commands with system() calls
  - Only use sandboxed subprocess calls
  - Update status.json every N seconds (e.g., 10s)
  - Write progress to /agents/{AGENT_ID}/status.json:
    {
      "progress": 45,
      "current_step": "processing data",
      "eta_seconds": 120,
      "status": "running"
    }
```

### Output Generation
```
WHEN: Task completes (success or failure)
WRITE:
  1. Final results to /agents/{AGENT_ID}/output/result.json
  2. Update status.json with completion info:
     {
       "status": "completed",
       "ended_at": "ISO_TIMESTAMP",
       "duration_seconds": 300,
       "success": true,
       "result_location": "output/result.json",
       "error": null
     }
  3. Write human-readable summary to /agents/{AGENT_ID}/output/summary.md
  4. Create manifest of all output files
  5. DO NOT write outside /agents/{AGENT_ID}/output/
```

### Error Handling
```
IF: Error occurs during execution
THEN:
  1. Write error details to /agents/{AGENT_ID}/output/error.log
  2. Update status.json:
     {
       "status": "failed",
       "error": "Human-readable error message",
       "error_type": "TimeoutError|RuntimeError|etc",
       "stack_trace": "if available"
     }
  3. Clean up temp files
  4. DO NOT attempt to access central logs or other agents
  5. Await central agent decision (retry/terminate/escalate)
```

---

## Central Agent Operations

### Initialize System
```bash
#!/bin/bash
# 1. Setup directory structure
mkdir -p {main,agents,logs}
git init

# 2. Create main branch with configuration
git branch main
echo "# Central Configuration
version: 1.0
max_agents: 100
isolation_level: strict
" > main/config.md

# 3. Create logging infrastructure
touch logs/.gitkeep
echo "timestamp,agent_id,event,details" > logs/audit.csv

# 4. Setup git hooks for security
cat > .git/hooks/pre-receive << 'EOF'
# Prevent direct commits to main branch
EOF
```

### Spawn New Agent
```python
import os
import json
import uuid
from datetime import datetime

def spawn_agent(task_description, task_input):
    # Generate unique ID
    agent_id = str(uuid.uuid4())[:8]
    agent_path = f"/agents/{agent_id}"
    
    # Create isolated directory
    os.makedirs(f"{agent_path}/workspace", mode=0o700)
    os.makedirs(f"{agent_path}/temp", mode=0o700)
    os.makedirs(f"{agent_path}/output", mode=0o700)
    
    # Write task manifest
    task = {
        "agent_id": agent_id,
        "description": task_description,
        "input": task_input,
        "created_at": datetime.now().isoformat(),
        "timeout_seconds": 3600,
        "max_memory_mb": 512,
        "max_cpu_percent": 80
    }
    with open(f"{agent_path}/task.md", "w") as f:
        json.dump(task, f, indent=2)
    
    # Initialize git branch
    os.system(f"cd /agents && git checkout -b agents/{agent_id}")
    
    # Create status file
    status = {
        "agent_id": agent_id,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    with open(f"{agent_path}/status.json", "w") as f:
        json.dump(status, f)
    
    # Log creation
    log_event(f"agent_created", agent_id, f"Task: {task_description[:50]}")
    
    return agent_id
```

### Monitor Agent Progress
```python
import json
import os

def monitor_agents():
    agents_dir = "/agents"
    for agent_id in os.listdir(agents_dir):
        status_file = f"{agents_dir}/{agent_id}/status.json"
        
        try:
            with open(status_file) as f:
                status = json.load(f)
            
            # Check for timeout
            created = datetime.fromisoformat(status['created_at'])
            if (datetime.now() - created).seconds > 3600:
                terminate_agent(agent_id, "timeout")
            
            # Log progress
            if status['status'] == 'running':
                print(f"Agent {agent_id}: {status['progress']}% - {status['current_step']}")
            
            elif status['status'] == 'completed':
                print(f"Agent {agent_id}: SUCCESS")
                collect_results(agent_id)
            
            elif status['status'] == 'failed':
                print(f"Agent {agent_id}: FAILED - {status['error']}")
                log_event("agent_failed", agent_id, status['error'])
        
        except Exception as e:
            log_event("monitoring_error", agent_id, str(e))
```

### Collect Results
```python
def collect_results(agent_id):
    output_dir = f"/agents/{agent_id}/output"
    central_results = "/main/results"
    
    # Verify output exists
    if not os.path.exists(output_dir):
        log_event("collection_failed", agent_id, "No output directory")
        return
    
    # Copy results to central location
    for file in os.listdir(output_dir):
        src = f"{output_dir}/{file}"
        dst = f"{central_results}/{agent_id}_{file}"
        shutil.copy(src, dst)
    
    # Commit to git
    os.system(f"git add /main/results && git commit -m 'Results from {agent_id}'")
    
    # Cleanup agent
    cleanup_agent(agent_id)
```

### Terminate Agent
```python
def terminate_agent(agent_id, reason):
    agent_path = f"/agents/{agent_id}"
    
    # Update status
    status = {
        "status": "terminated",
        "reason": reason,
        "terminated_at": datetime.now().isoformat()
    }
    with open(f"{agent_path}/status.json", "w") as f:
        json.dump(status, f)
    
    # Kill any running processes
    os.system(f"pkill -f 'agent_id={agent_id}'")
    
    # Archive agent directory
    shutil.move(agent_path, f"/agents/.archive/{agent_id}_{datetime.now().timestamp()}")
    
    # Merge branch back to main
    os.system(f"git checkout main && git merge agents/{agent_id}")
    os.system(f"git branch -d agents/{agent_id}")
    
    log_event("agent_terminated", agent_id, reason)
```

---

## Security Checklist

- [ ] Each agent process runs with restricted user permissions
- [ ] Filesystem permissions enforce directory isolation (chmod 700)
- [ ] Environment variables constrain agent scope
- [ ] No agent can read/write outside assigned directory
- [ ] All file paths validated against whitelist
- [ ] Git branches prevent data contamination
- [ ] Audit logs track all agent activities
- [ ] Resource limits enforced (CPU, memory, timeout)
- [ ] Central agent is the only authority for agent lifecycle
- [ ] Periodic security audits of agent operations
- [ ] Encrypted communication between central and individual agents

---

## Example Workflow

```
STEP 1: Central Agent receives task
  → Task: "Process 1000 records in parallel batches"

STEP 2: Central Agent spawns 4 individual agents
  → agent_001, agent_002, agent_003, agent_004

STEP 3: Each agent operates independently
  → agent_001 processes records 1-250 in /agents/agent_001/
  → agent_002 processes records 251-500 in /agents/agent_002/
  → agent_003 processes records 501-750 in /agents/agent_003/
  → agent_004 processes records 751-1000 in /agents/agent_004/

STEP 4: Central Agent monitors progress
  → Reads status.json from each agent every 10 seconds
  → Logs progress to audit trail

STEP 5: Agents complete tasks
  → Each writes results to /agents/{agent_id}/output/
  → Updates status.json with completion info

STEP 6: Central Agent collects results
  → Merges outputs from all agents
  → Commits to main branch
  → Cleans up agent directories

STEP 7: System ready for next workload
```

---

## Troubleshooting

| Issue | Root Cause | Resolution |
|-------|-----------|-----------|
| Agent cannot write output | Permission denied | Central agent must set chmod 700 on output dir |
| Agent reads sibling directory | Broken isolation | Terminate agent, audit git history, reinstall permissions |
| Status updates stop | Agent crashed | Monitor detects inactivity, check error.log in output dir |
| GitTree merge conflict | Two agents modified same file | Branch isolation failed - central agent must investigate |
| Memory exhaustion | Resource limits not enforced | Implement cgroup limits, add OOM killer |
| Timeout not respected | No monitoring loop | Central agent must implement periodic heartbeat check |

---

## Notes

- **Scalability**: This architecture supports 10-1000 concurrent agents (depends on system resources)
- **Fault Tolerance**: Individual agent failure does not affect central system or other agents
- **Auditability**: All operations logged to `/logs/` with full traceability
- **Security Model**: Defense in depth with filesystem, environment, and code-level isolation
- **GitTree Benefits**: Prevents accidental merge conflicts, enables easy rollback, maintains history per agent