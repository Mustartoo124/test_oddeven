# Quick Start Guide

## 🎮 Play the Game

### Step 1: Start the Server
```bash
npm install
npm run dev
```

You'll see:
```
[1] WebSocket server listening on port 8081
[0] Compiled successfully!
```

### Step 2: Open Game in Two Windows

**Window 1:** Open `http://localhost:3000`
- You'll see "You are ODD Player"
- Status: "Waiting for opponent..."

**Window 2:** Open `http://localhost:3000` in another browser
- You'll see "You are EVEN Player"
- Both windows should now show "Connected" and game is ready

### Step 3: Play!

**How to Win:**
- **ODD Player:** Make a line of all odd numbers (1, 3, 5, 7, 9...)
- **EVEN Player:** Make a line of all even numbers (2, 4, 6, 8, 10...)

**Lines to Complete:**
- Any row (5 horizontal)
- Any column (5 vertical)
- Either diagonal (5 diagonal)

**Example:**
```
ODD player clicks squares until they have:
Row 0: [1, 3, 5, 7, 9]
→ ODD PLAYER WINS! 🎉
```

## 🎯 Understanding What's Happening

### Your First Click
1. Click any square
2. You see it increment immediately (optimistic update)
3. Square gets yellow border (pending)
4. Server processes your operation
5. Server confirms with UPDATE
6. Yellow border disappears (confirmed)
7. Other player sees the change

### Simultaneous Clicks (The Key!)
1. Both players click square 12 at the same time
2. Server receives both INCREMENT operations
3. Server processes in order received:
   - First: 4 → 5
   - Second: 5 → 6
4. Both squares show 6
5. **Both clicks counted!** ✓

This is why operational transforms matter!

## 🎲 Testing Chaos Mode

Enable random network delays to see how the game handles message reordering:

1. Game is running and connected
2. Toggle "Chaos Mode ON" (yellow box)
3. Slide to set max delay (0-2000ms)
4. Click rapidly in both windows
5. Watch messages arrive out of order
6. Notice the game still works correctly!

**Why this matters:** Shows that message order doesn't matter for correctness when using operations instead of states.

## 📊 What to Observe

### Board Color Coding
- **Empty (0):** White
- **Odd numbers (1,3,5...):** Blue background
- **Even numbers (2,4,6...):** Purple background

### Visual Feedback
- **Yellow border:** Waiting for server confirmation (pending)
- **Gold highlight:** Winning line with animation

### Connection Status
- "Connecting..." → Still connecting to server
- "Waiting for opponent..." → You're connected, waiting for other player
- "Connected" → Both players present, game is active
- "Disconnected" → Connection lost

## 🏆 First Win

Try this to win quickly:

**ODD Player:**
1. Click square 0 (top-left)
2. Click square 1
3. Click square 2
4. Click square 3
5. Click square 4

**Result:** Row has [1, 1, 1, 1, 1] - all odd!
**ODD PLAYER WINS!** 🎉

## ⚡ Advanced: Chaos Mode Testing

1. Enable Chaos Mode
2. Set delay to 1000ms
3. Both players rapid-click square 12
4. Watch in browser DevTools (F12 → Network → WS)
5. See messages arrive out of order
6. Verify the final value is correct anyway

This demonstrates operational transforms in action!

## 🐛 If Something's Wrong

### Game won't start (stuck on "Waiting for opponent...")
- Open second window at `http://localhost:3000`
- Check console for errors (F12)
- Make sure server is running: `npm run dev`

### Clicking doesn't work
- Check connection status (should say "Connected")
- Refresh page and try again
- Check console for WebSocket errors

### Numbers don't match between windows
- This shouldn't happen!
- Restart both windows
- Check server logs for errors

### Chaos Mode isn't working
- Chaos Mode must be enabled BEFORE game starts
- Try reloading the page after toggling

## 📱 Mobile Testing

Works on mobile! Open `http://localhost:3000` on:
- iPhone Safari
- Android Chrome
- iPad

Share the URL via QR code if on local network:
```bash
# Show your local IP
ipconfig getifaddr en0  # macOS
hostname -I            # Linux
```

Then use `http://YOUR_IP:3000` from other devices.

## 🎓 Learning Checklist

After playing, you should understand:

- [ ] Why the server needs to be authoritative
- [ ] Why we send operations instead of states
- [ ] How simultaneous clicks both count
- [ ] Why message order doesn't matter for correctness
- [ ] How Google Docs and Figma work similarly
- [ ] Why this is called "operational transforms"

## 🎮 Next Steps

1. **Play 2-3 games** to understand the mechanics
2. **Enable Chaos Mode** and see messages arrive out of order
3. **Read the TESTING_GUIDE.md** for deeper understanding
4. **Read the README.md** for distributed systems concepts
5. **Trace code** to see where operations are processed

## 🚀 You're Ready!

The game is fully functional and demonstrates real distributed systems concepts. Have fun playing and learning!

---

**Need help?** Check out:
- `README.md` - Full documentation and concepts
- `TESTING_GUIDE.md` - How to test edge cases
- `IMPLEMENTATION_SUMMARY.md` - Technical details
