# Conversation Memory System - Clean Architecture

## Problem
The code had **complex nested logic** that extracted conversations from observation memories during prompt building. This was inefficient and confusing.

## Root Cause
Conversations were embedded in sensory data along with visual observations (coins, agents), making them hard to separate and diluting their importance in the prompt.

## Solution Implemented

### Architecture: Separate Conversations from Sensory Data

**Key Principle:** Conversations and sensory observations are fundamentally different data types and should be handled separately throughout the entire pipeline.

### 1. **Frontend: Separate at Source** (`static/js/systems/sensory-system.js`)

Instead of embedding messages in sensory data:

```javascript
// OLD (conversations buried in sensory data):
return {
    position: {...},
    nearbyAgents: [...],
    worldObjects: [...],
    receivedTexts: [...]  // ❌ Mixed with sensory data
};

// NEW (clean separation):
getSensoryData(agentId, worldSimulator = null) {
    const newMessages = this.agentManager.getAndClearReceivedTexts(agentId);
    
    const sensoryData = {
        position: {...},
        nearbyAgents: [...],
        worldObjects: [...]
        // NO receivedTexts! ✅
    };
    
    return { sensoryData, newMessages };  // Separate!
}
```

### 2. **Frontend: Send Separately** (`static/js/services/brain-service.js`)

```javascript
async requestDecision(agentId, sensoryData, newMessages = []) {
    await fetch(`${this.baseUrl}/${agentId}/brain/decide`, {
        body: JSON.stringify({
            sensory_data: sensoryData,
            new_messages: newMessages  // Separate parameter!
        })
    });
}
```

### 3. **Backend: Receive Separately** (`routes/agent_routes.py`)

```python
sensory_data = data['sensory_data']
new_messages = data.get('new_messages', [])  # Separate parameter!

decision = asyncio.run(
    agent.make_decision_from_sensory_data(sensory_data, new_messages)
)
```

### 4. **Backend: Store in Dedicated Memory** (`models/agent.py`)

```python
async def make_decision_from_sensory_data(
    self, sensory_data: Dict[str, Any], 
    new_messages: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    # Store new messages in conversation history BEFORE getting it
    num_new_messages = len(new_messages or [])
    if new_messages:
        for text in new_messages:
            self.add_message(
                speaker=text.get('sender'),
                message=text.get('message'),
                time=simulation_time
            )
    
    # Get conversation history (now includes new messages!)
    conversation_history = self.get_conversation_history()
    
    # Pass conversation_history + count (no duplication!)
    decision = await self.llm_service.make_agent_decision(
        conversation_history=conversation_history,  # Single source of truth
        num_new_messages=num_new_messages,          # Just the count
        ...
    )
```

### 5. **Simplified Prompt Building** (`services/llm_service.py`)

**Before (Complex):**
```python
# ❌ Extract conversations from sensory_data
received_texts = sensory_data.get('receivedTexts', [])
current_conversation = format(received_texts)

# ❌ Extract past conversations from observation memories
for mem in observation_memories:
    if 'receivedTexts' in mem and mem['receivedTexts']:
        for text in mem['receivedTexts']:
            past_conversations.append(...)  # Nested extraction!
    clean_mem = {k: v for k, v in mem.items() if k != 'receivedTexts'}
    obs_mem_text_parts.append(...)  # Clean observation
```

**After (Simple):**
```python
# ✅ Split conversation_history using count
if num_new_messages > 0:
    # Last N messages are current
    new_messages = conversation_history[-num_new_messages:]
    current_conversation = "\n".join([
        f"- {msg['speaker']}: \"{msg['message']}\""
        for msg in new_messages
    ])
    
    # Rest are past (exclude last N)
    past_messages = conversation_history[:-num_new_messages]
    past_conversation_text = "\n".join([
        f"- Time {msg['time']}s: {msg['speaker']}: \"{msg['message']}\""
        for msg in past_messages
    ])

# ✅ Observations are just observations - no extraction needed!
for mem in observation_memories:
    readable_obs = self._format_observation_readable(mem)
    obs_texts.append(f"- Time {time_s}s: {readable_obs}")
```

## Benefits

✅ **Cleaner code** - removed complex nested loops  
✅ **Separation of concerns** - conversations and observations are separate throughout the pipeline  
✅ **No duplication** - conversation_history is the single source of truth (no passing both history + new_messages)  
✅ **Better performance** - no extraction during prompt building  
✅ **Easier to maintain** - clear data flow with simple count-based splitting  
✅ **More extensible** - easy to add conversation features later

## Data Flow (After Cleanup)

### NEW: Clean Separation Throughout

```
Frontend: sensory-system.js
  ├─→ sensoryData (position, nearby agents, coins)
  └─→ newMessages (read and clear)
         ↓
Frontend: brain-service.js
  → POST { sensory_data, new_messages }
         ↓
Backend: agent_routes.py
  ├─→ sensory_data
  └─→ new_messages
         ↓
Backend: agent.make_decision_from_sensory_data()
  ├─→ Store new_messages in conversation_history
  ├─→ Get conversation_history (includes new messages now!)
  └─→ Pass to LLM: conversation_history + num_new_messages (count only!)
         ↓
Backend: llm_service._create_decision_prompt()
  ├─→ Split conversation_history using count:
  │   ├─ Last N messages → Current Conversation
  │   └─ Rest → Past Conversations
  └─→ Observations: sensory_data (clean, no conversations!)
```

### Read Once Strategy Preserved

1. **Frontend** reads messages from agent's local state with `getAndClearReceivedTexts()`
2. Messages are **cleared immediately** (read once!)
3. **Backend** receives only NEW messages
4. Backend stores them in `conversation_history`
5. Next decision: they appear in "Past Conversations", not "Current"

## Human-Readable, LLM-Friendly Format

All data is converted to **natural first-person language**:

**Actions:**
- `{'action': 'move', 'target': {'x': 2, 'z': 1.6}}` → `"I moved to position (2, 1.6)"`
- `{'action': 'text', 'target': {'agent': 'Alice'}, 'utterance': 'Found coins!'}` → `"I texted Alice: 'Found coins!'"`

**Current Observations (present tense):**
- JSON sensory data → `"I am at position (2, 1), have collected 1 coin; I see 2 coins at: (2, 1.6), (2.4, 0.4); I see no other agents"`

**Past Observations (past tense):**
- JSON sensory data → `"I was at position (2, 1), had collected 1 coin; I saw 2 coins at: (2, 1.6), (2.4, 0.4); I saw no other agents"`

**Time Format:**
- `"Time 0s: Moved to position (2, 1)"` → `"At time 0s I moved to position (2, 1)"`
- `"Time 5s: Bob: 'Hello!'"` → `"At time 5s Bob said: 'Hello!'"`

This natural, conversational format makes it much easier for the LLM to understand context and make intelligent decisions.

## Summary

This refactor implements a **clean separation of concerns** throughout the entire architecture:

- **Conversations** are treated as distinct data from the moment they're received
- **No mixing** of conversations with sensory observations
- **No extraction** needed during prompt building
- **Read once** strategy preserved for message delivery
- **Human-readable** format for better LLM understanding
- **Single source of truth** - `conversation_history` is the only conversation data passed (with a count, not duplicated messages)

### Key Optimization

Instead of passing both `conversation_history` AND `new_messages` to the LLM service (duplication!), we:

1. **Store** new messages in `conversation_history` immediately
2. **Pass** only `conversation_history` + `num_new_messages` (count)
3. **Split** in LLM service using count: last N = current, rest = past

This eliminates redundancy and ensures `conversation_history` is the single source of truth.

The result is simpler, faster, and easier to maintain code that should lead to better agent communication and decision-making.

