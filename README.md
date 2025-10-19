# Odd/Even Tic-Tac-Toe: Multiplayer Distributed Game

A real-time multiplayer game demonstrating fundamental distributed systems concepts through WebSocket communication and operational transforms.

## 🎮 Game Rules

### Setup
- **5×5 board** (25 squares) with all squares starting at 0
- **Two players**: Odd Player and Even Player
- Both players can click any square at any time (no turn-based restrictions)

### Gameplay
- Click any square to **increment its number by 1** (0 → 1 → 2 → 3...)
- Both players click simultaneously without waiting for turns
- Multiple clicks on the same square keep incrementing it

### Winning Conditions
- **Odd Player wins** if any row, column, or diagonal has all 5 odd numbers
  - Example: `[1, 3, 5, 7, 9]` or `[1, 1, 1, 1, 1]`
- **Even Player wins** if any row, column, or diagonal has all 5 even numbers
  - Example: `[2, 4, 6, 8, 10]` or `[4, 6, 8, 8, 8]`

### Strategy
- Odd player clicks squares to make/keep them odd
- Even player clicks squares to make/keep them even
- Competing over the same squares is the core mechanic
- If both click a square with 5, it becomes 7 (stays odd)
- If both click a square with 4, it becomes 6 (stays even)

## 🌐 Distributed Systems Architecture

### Why Server Authority?

This game implements **server-authoritative architecture**, the foundation of all real-time multiplayer applications.

**Without server authority:**
```
Player A clicks square 5 → Updates UI to 6, sends state: {square: 5, value: 6}
Player B clicks square 5 → Updates UI to 6, sends state: {square: 5, value: 6}
Server receives both messages with value: 6
Result: Both clicks lost! Only ONE increment recorded.
```

**With server authority:**
```
Player A clicks square 5 → Sends operation: {type: INCREMENT, square: 5}
Player B clicks square 5 → Sends operation: {type: INCREMENT, square: 5}
Server receives both operations and processes in order:
  - Increment square 5: 5 → 6
  - Increment square 5: 6 → 7
Server broadcasts: UPDATE square 5, value 7
Result: BOTH clicks counted! ✅
```

### Operational Transforms (Not State Synchronization)

**The Key Insight:** Send operations, not states.

#### ❌ Wrong Approach (State Synchronization)
```json
{
  "type": "SET_VALUE",
  "square": 5,
  "value": 6
}
```
Problems:
- If both players send simultaneously, the second message overwrites the first
- Race conditions lose concurrent updates
- No natural composition of concurrent actions

#### ✅ Right Approach (Operational Transforms)
```json
{
  "type": "INCREMENT",
  "square": 5,
  "amount": 1
}
```
Benefits:
- Operations compose naturally: 5 → 6 → 7 (both clicks count)
- Server can process messages in arrival order
- Concurrent updates don't conflict—they accumulate
- This is how Google Docs, Figma, and collaborative editors work

### Message Flow

```
Client (Odd Player)          Server           Client (Even Player)
        |                      |                      |
        |--- INCREMENT {5} ---->|                      |
        |                      |                      |
        |                      |<--- INCREMENT {5} ---|
        |                      |                      |
        |<--- UPDATE {5:6} -----|                      |
        |                      |--- UPDATE {5:6} ---->|
        |                      |                      |
        |--- INCREMENT {5} ---->|                      |
        |                      |                      |
        |<--- UPDATE {5:7} -----|                      |
        |                      |--- UPDATE {5:7} ---->|
```

### Win Detection on Server

After processing each INCREMENT operation:

```javascript
// Check rows, columns, and diagonals
for (const line of winningLines) {
  const values = line.map(i => board[i]);
  
  // All odd (> 0 and odd parity)?
  if (values.every(v => v > 0 && v % 2 === 1)) {
    return { winner: 'ODD', winningLine: line };
  }
  
  // All even (> 0 and even parity)?
  if (values.every(v => v > 0 && v % 2 === 0)) {
    return { winner: 'EVEN', winningLine: line };
  }
}
```

## 📋 Architecture

### Frontend (React)
- `Game.js`: Main game logic, WebSocket connection, player management
- `Board.js`: 5×5 grid rendering with win highlighting
- `Square.js`: Individual square with visual state (odd/even coloring, pending, winning)
- `App.css`: Responsive styling with animations

### Backend (Node.js)
- `server.js`: WebSocket server with:
  - Single board state (source of truth)
  - Player assignment (1st player = ODD, 2nd player = EVEN)
  - Operation processing (INCREMENT messages)
  - Win detection logic
  - Broadcast to all clients

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Running the Game
```bash
npm run dev
```

This starts both:
- React development server on `http://localhost:3000`
- WebSocket server on `ws://localhost:8081`

### Playing
1. Open `http://localhost:3000` in one browser window
2. Open `http://localhost:3000` in another browser window (or different browser)
3. First window becomes ODD Player, second becomes EVEN Player
4. Game starts when both players connect
5. Click squares to increment numbers and try to complete a line

## 🎯 Learning Outcomes

After playing and understanding this game, you understand:

1. **Server Authority**: Why a single source of truth is essential
2. **Race Conditions**: How simultaneous clicks from multiple clients cause problems
3. **Operational Transforms**: How operations solve what state synchronization can't
4. **Message Ordering**: Why the order messages arrive matters more than the order they were sent
5. **Real-time Systems**: How Google Docs, Figma, multiplayer games, and collaborative tools actually work

## 🌟 Bonus Features (Not Required)

### Chaos Mode
Test race conditions and distributed system challenges:

```javascript
const toggleChaosMode = () => {
  chaosMode = !chaosMode;
};

// In WebSocket send wrapper
const originalSend = ws.send.bind(ws);
ws.send = (data) => {
  if (chaosMode) {
    const delay = Math.random() * 1000; // Random 0-1s delay
    setTimeout(() => originalSend(data), delay);
  } else {
    originalSend(data);
  }
};
```

With chaos mode enabled:
- Messages arrive out of order
- See why operational transforms matter
- Observe natural recovery from message reordering

### UI Enhancements
- Color-coded squares (blue = odd, purple = even)
- Yellow border for pending squares waiting for server confirmation
- Winning line highlighted in gold with animation
- Connection status indicator
- Player assignment display
- Game instructions

### Advanced Features
- Move history and replay
- Multiple game rooms with unique URLs
- Spectator mode for third+ players
- Statistics (moves per player, game duration)
- Reconnection handling

## 📊 Key Concepts Visualized

### Simultaneous Clicks Example
```
Initial: square[5] = 4

Time 0ms:  Player A clicks          Player B clicks
           Sends: INCREMENT          Sends: INCREMENT

Time 1ms:                Server receives A's INCREMENT
                         Processes: 4 → 5
                         Broadcasts: UPDATE square[5] = 5

Time 2ms:  Receives: 5           Receives: 5
           Updates UI

Time 3ms:                Server receives B's INCREMENT
                         Processes: 5 → 6
                         Broadcasts: UPDATE square[5] = 6

Time 4ms:  Receives: 6           Receives: 6
           Updates UI

RESULT: square[5] goes 4 → 5 → 6
        Both clicks counted! ✅
```

### Why This Matters

This pattern applies to every real-time system:
- **Google Docs**: Operational transforms (OT) for concurrent edits
- **Figma**: Conflict-free replicated data types (CRDTs)
- **Slack**: Eventual consistency with message ordering
- **Multiplayer Games**: Server authority with client prediction
- **Version Control**: Git merging is applying conflicting operations

## 🔍 Message Protocol

### Client → Server
```json
{
  "type": "INCREMENT",
  "square": 12
}
```

### Server → All Clients
```json
{
  "type": "UPDATE",
  "square": 12,
  "value": 6,
  "board": [0, 0, ..., 6, ...]
}
```

### Game Over
```json
{
  "type": "GAME_OVER",
  "winner": "ODD",
  "winningLine": [0, 6, 12, 18, 24]
}
```

### Disconnection
```json
{
  "type": "GAME_OVER",
  "winner": "DISCONNECT",
  "message": "Opponent disconnected"
}
```

## 🧠 Discussion Questions

1. **Why can't clients update their own squares without waiting for the server?**
   - Multiple clients could process the same increment differently, creating inconsistency

2. **What happens if two players click the same square at the exact same nanosecond?**
   - Network messages never arrive at exactly the same time; the server processes them sequentially

3. **Could we use timestamps to determine click order instead of message arrival order?**
   - Possible, but requires synchronized clocks across all devices (nearly impossible at scale)
   - This is why distributed systems use logical clocks, not physical time

4. **Why is INCREMENT better than SET_VALUE for this game?**
   - SET overwrites; INCREMENT accumulates. With concurrent operations, only INCREMENT preserves both players' intentions

## 📚 Further Reading

- **Operational Transforms**: Google Docs technical paper
- **CRDTs**: Conflict-free Replicated Data Types (used by modern platforms)
- **Lamport Clocks**: Logical ordering without physical time synchronization
- **Raft Consensus**: Distributed consensus algorithm

## 🎓 Assignment Notes

This assignment teaches **practical distributed systems** through play:
- Not about complex math or formal proofs
- About understanding why systems are built the way they are
- About recognizing these patterns in real applications
- About implementing solutions that actually work at scale

Focus on understanding the "why" more than the "how." Can you explain these concepts to someone else? You've succeeded.

---

**Built to understand distributed systems through play. Good luck! 🚀**
