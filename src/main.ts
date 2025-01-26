import { Game as GameScene } from './scenes/Game';
import { Loading } from './scenes/Loading';
import { UI } from './scenes/UI';

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
            tileBias: 4,
        }
    },
    pixelArt: true,
    zoom: 4,
    scale: {
        mode: Phaser.Scale.RESIZE,
    },
    scene: [
        Loading,
        GameScene,
        UI,
    ]
};

export default new Game(config);
