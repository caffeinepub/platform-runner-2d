# 2D Browser Game

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- A 2D browser game built with HTML Canvas, JavaScript, and CSS
- Player character that moves left/right and can jump
- Enemies that move and must be avoided or defeated
- Collectible items (coins/stars) that increase the score
- Score display and lives counter HUD
- Game states: start screen, playing, game over screen
- Keyboard controls (arrow keys / WASD) and touch/mobile support
- Simple platform-style level with ground and platforms
- Collision detection between player, enemies, platforms, and collectibles
- Visual polish: smooth animations, particle effects on collection

### Modify
- None

### Remove
- None

## Implementation Plan
1. Set up React component that renders a full-screen Canvas element
2. Implement game loop using requestAnimationFrame
3. Define player entity with movement physics (gravity, jump, left/right)
4. Define platform entities and collision resolution
5. Define enemy entities with simple patrol AI
6. Define collectible entities (coins/stars)
7. Implement collision detection for all entity pairs
8. Implement HUD overlay (score, lives, level)
9. Implement game state machine (start, playing, paused, game over)
10. Add keyboard input handler and mobile touch controls
11. Add particle effects for collectible pickup and enemy defeat
12. Style the page to be full-screen with a dark background
