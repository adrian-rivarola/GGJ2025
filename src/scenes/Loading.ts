import { Scene } from 'phaser';

export class Loading extends Scene {
  constructor() {
    super('loading-scene');
  }

  preload(): void {
    this.load.spritesheet('character', 'assets/character.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('fish', 'assets/fish.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('powerup', 'assets/powerup.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('powerup-frame', 'assets/powerup-frame.png');
    this.load.spritesheet('tiles_spr', 'assets/dungeon.png', { frameWidth: 16, frameHeight: 16 });
    this.load.image("grass-tiles", "assets/grass.png");
    this.load.image("cave-tiles", "assets/cave.png");
    this.load.image("staminabar", "assets/energybar.png");
    this.load.tilemapTiledJSON("map", "assets/map1.json");

    this.load.audio('hitHurt', 'assets/sounds/hitHurt.wav');
    this.load.audio('bubblePop', 'assets/sounds/bubble-pop.mp3');
    this.load.audio('coolHipHop', 'assets/sounds/cool-hip-hop-loop.mp3');
    this.load.audio('etherealUplifting', 'assets/sounds/ethereal-uplifting-loop.mp3');
    this.load.audio('happyRelaxing', 'assets/sounds/happy-relaxing-loop.mp3');
    this.load.audio('ohNo', 'assets/sounds/oh-no.mp3');
    this.load.audio('powerUp', 'assets/sounds/power-up-type-1.mp3');
    this.load.audio('stoneEffect', 'assets/sounds/stone-effect.mp3');
  }

  create(): void {
    this.scene.start('level-1-scene');
    this.scene.start('ui-scene');
  }
}
