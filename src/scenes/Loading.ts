import { Scene } from 'phaser';

export class Loading extends Scene {
  constructor() {
    super('loading-scene');
  }

  preload(): void {
    this.load.spritesheet('character', 'assets/character.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('fish', 'assets/fish.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('powerup', 'assets/powerup.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image("grass-tiles", "assets/grass.png");
    this.load.image("cave-tiles", "assets/cave.png");
    this.load.tilemapTiledJSON("map", "assets/map1.json");
    this.load.spritesheet('tiles_spr', 'assets/dungeon.png', { frameWidth: 16, frameHeight: 16 });
  }

  create(): void {
    this.scene.start('level-1-scene');
    this.scene.start('ui-scene');
  }
}
