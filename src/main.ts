import { Game as GameScene } from './scenes/Game';

import { Game, Types } from "phaser";

const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            // debug: true,
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
    },
    scene: [
        // TODO: Add UI
        GameScene,
    ]
};

export default new Game(config);
