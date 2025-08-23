# Copilot Instructions for Trivial Game Project

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
Modern trivia game with vanilla JavaScript, HTML5, and CSS3 featuring:
- **Two game modes**: Classic multiplayer (2-6 players) and Challenge mode (single player)
- **Dynamic questions**: Open Trivia Database API with Spanish translations via Ollama LLM
- **Progressive rendering**: Canvas 2D board with dynamic sizing and smooth animations
- **23 categories total**: 6 main + 17 additional categories from Open Trivia DB
- **Advanced features**: Google Analytics tracking, vibration feedback, mobile optimizations

## Architecture Insights

### Module Loading Pattern
The app uses a sophisticated module loading system:
```javascript
// main.js waits for DOM, then for custom 'modulesReady' event
// Modules are loaded via HTML includes: menu.html, game.html, modals.html
// attemptInitialization() retries with exponential backoff if elements aren't ready
```

### Event Communication
Components communicate through custom events and callbacks:
- **GameEngine** emits: `gameStarted`, `gameQuit`, `translationStarted/Completed/Error`
- **Global events**: `backToMenu`, `modulesReady`, `appReady`
- **ApiClient** propagates translation events through GameEngine

### State Management
- **GameEngine** owns game state, persisted to LocalStorage via Storage utility
- **ChallengeEngine** manages independent challenge mode state
- **Pending states**: `pendingQuestionData` and `pendingMovement` handle async flows

## Key Implementation Details

### Question System
```javascript
// ApiClient handles 3 layers of questions:
// 1. Open Trivia DB (primary) - returns English questions
// 2. Ollama translation (if enabled) - translates to Spanish
// 3. Fallback JSON (offline) - pre-translated Spanish questions
// Category mapping: Open Trivia IDs (9-32) → Spanish names
```

### Canvas Rendering
```javascript
// Board.js implements dynamic sizing:
// - calculateOptimalDimensions() adapts to viewport
// - Double buffering for smooth animations
// - RequestAnimationFrame for 60fps rendering
// setupResizeHandlers() with debouncing prevents performance issues
```

### Mobile Detection & Optimization
```javascript
// MobileUtils uses multi-factor detection:
// - Screen size + UserAgent + Touch + Memory
// - Explicitly excludes Windows touchscreens
// - Applies CSS classes and performance tweaks
```

## Development Workflows

### Local Development
```powershell
# Start development server (Python HTTP server on port 8000)
python -m http.server 8000
# Access at http://localhost:8000
```

### Ollama Integration (Optional)
```javascript
// OllamaClient auto-detects servers at:
// - localhost:11434 (default)
// - 192.168.31.88:11434 (network)
// Uses gpt-oss model for thinking-optimized translations
```

### Debug Functions
```javascript
// Available in browser console:
debugInfo()        // Game state and storage info
debugTrivial()     // Module loading diagnostics  
clearAllData()     // Reset all game data
exportGameData()   // Export save to JSON
importGameData()   // Load save from JSON
testIncorrectAnswerVibration() // Test haptic feedback
```

## Project-Specific Patterns

### Translation Flow
1. Question fetched from Open Trivia DB (English)
2. If translation enabled: OllamaClient translates to Spanish
3. Events fired: `translationStarted` → `translationCompleted/Error`
4. UI shows translation indicator during process

### Analytics Integration
```javascript
// TrivialAnalytics wraps Google Analytics (G-RQVNQE35NT)
// Tracks: game setup, question answers, challenge modes, technical events
// Challenge mode has dedicated tracking methods
```

### CSS Architecture
```css
/* Modular structure:
   base/     - Reset, typography, CSS variables
   components/ - Reusable UI elements  
   layouts/   - Screen-specific styles
   themes/    - Category colors, player themes
   utilities/ - Helpers, animations, responsive
*/
```

## Critical Files to Understand

- **js/main.js**: Application bootstrap, retry logic, global event handling
- **js/game/GameEngine.js**: Core game state machine and turn management
- **js/game/ChallengeEngine.js**: Independent challenge mode implementation
- **js/utils/ApiClient.js**: Question fetching, translation, category mapping
- **js/utils/MenuTransitionManager.js**: Menu animation orchestration
- **modules/*.html**: HTML templates loaded dynamically

## Common Pitfalls & Solutions

### Module Loading Issues
If UI doesn't initialize, check browser console with `debugTrivial()`. The app retries loading 3 times with exponential backoff.

### Translation Delays
Ollama translations can be slow. The app continues without translations if they timeout (45s default).

### Canvas Performance
Board rendering is optimized for 60fps but can lag on low-end devices. Mobile optimizations automatically reduce quality.

### Question Repetition
`usedQuestions` Set prevents repeats within a game session. Clears on new game start.

## Language Context
- **Spanish UI**: All user-facing text in Spanish
- **Spanish code comments**: Developer comments in Spanish
- **English**: Variable names and console logs
- **Translations**: Questions auto-translated if Ollama available
