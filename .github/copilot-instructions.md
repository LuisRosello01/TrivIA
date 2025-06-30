# Copilot Instructions for Trivial Game Project

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a modern trivia game built with vanilla JavaScript, HTML5, and CSS3. The game features:

- **Local multiplayer support** (2-6 players)
- **Dynamic question system** using Open Trivia Database API with local fallback
- **Interactive board** rendered with Canvas 2D
- **Six categories**: Historia, Ciencia, Deportes, Arte, Geografía, Entretenimiento
- **Progressive difficulty levels**: Easy, Medium, Hard
- **Game state persistence** using LocalStorage
- **Responsive design** for desktop and tablet

## Architecture Patterns
- **MVC Pattern**: Clear separation between game logic, UI, and data
- **Event-driven architecture**: Components communicate through events
- **Modular design**: Each class has a specific responsibility
- **Error handling**: Graceful degradation when APIs fail

## Code Style Guidelines
- **Language**: All code comments and variable names should be in Spanish
- **ES6+ Features**: Use modern JavaScript features (classes, arrow functions, async/await)
- **Naming Convention**: Use camelCase for variables and functions, PascalCase for classes
- **Error Handling**: Always include try-catch blocks for async operations
- **Documentation**: Include JSDoc comments for all public methods

## Key Components

### Game Logic (`js/game/`)
- **GameEngine.js**: Main game controller and state management
- **Player.js**: Player state, statistics, and actions
- **Board.js**: Canvas-based game board rendering and animations
- **Question.js**: Question handling, validation, and formatting

### UI Layer (`js/ui/`)
- **MenuUI.js**: Menu screens, configuration, and tutorial
- **GameUI.js**: In-game interface, modals, and player interactions

### Utilities (`js/utils/`)
- **ApiClient.js**: External API integration with fallback support
- **Storage.js**: LocalStorage management and data persistence

## API Integration
- **Primary source**: Open Trivia Database (https://opentdb.com/)
- **Fallback**: Local JSON file with Spanish questions
- **Error handling**: Automatic fallback when API is unavailable
- **Caching**: Prevent question repetition within the same game

## Styling Guidelines
- **CSS Custom Properties**: Use CSS variables for theming
- **Mobile-first**: Responsive design approach
- **Animations**: Smooth transitions and visual feedback
- **Accessibility**: Maintain good contrast ratios and keyboard navigation

## Development Notes
- **Browser Compatibility**: Support modern browsers with ES6+ support
- **Performance**: Optimize Canvas rendering and DOM manipulation
- **State Management**: Use localStorage for game persistence
- **Testing**: Validate game logic and API error scenarios

## Common Tasks
When working on this project, consider:

1. **Adding new questions**: Update `data/fallback-questions.json` for offline support
2. **New game features**: Follow the event-driven pattern for loose coupling
3. **UI improvements**: Maintain consistency with existing design system
4. **Performance optimization**: Focus on Canvas rendering and memory management
5. **Accessibility**: Ensure keyboard navigation and screen reader support

## External Dependencies
- **Open Trivia Database API**: For dynamic question content
- **Canvas 2D API**: For game board rendering
- **LocalStorage API**: For data persistence
- **Fetch API**: For network requests

Remember to maintain the Spanish language context for user-facing content and follow the established patterns for consistency.
