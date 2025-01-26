import { GameObjects, Scene } from 'phaser';

import { EVENTS_NAME, GameStatus } from '../consts';
import { Text } from '../classes/text';

enum HeartFrames {
  FULL_HEART = 530,
  HALF_HEART = 531,
  EMPTY_HEART = 532,
}

export class UI extends Scene {
  private gameEndPhrase!: Text;
  private hearts: GameObjects.Sprite[] = [];
  private staminaBar: GameObjects.Sprite;
  maxHearts = 3;
  maxStamina = 100;

  private gameEndHandler: (status: GameStatus) => void;

  constructor() {
    super('ui-scene');

    this.gameEndHandler = (status) => {
      console.log('GAME OVER');

      this.cameras.main.setBackgroundColor('rgba(0,0,0,0.3)');

      this.gameEndPhrase = new Text(
        this,
        this.game.scale.width / 2,
        this.game.scale.height * 0.4,
        status === GameStatus.LOSE
          ? `YOU DIED!\nCLICK TO RESTART`
          : `YOU ARE ROCK!\nCLICK TO RESTART`,
      )
        .setAlign('center')
        .setColor(status === GameStatus.LOSE ? '#ff0000' : '#ffffff');

      this.sound.add('ohNo').play();

      this.gameEndPhrase.setPosition(
        this.game.scale.width / 2 - this.gameEndPhrase.width / 2,
        this.game.scale.height * 0.4,
      );

      this.input.on('pointerdown', () => {
        this.game.events.off(EVENTS_NAME.gameEnd, this.gameEndHandler);
        this.scene.get('level-1-scene').scene.restart();
        this.scene.restart();

        this.maxHearts = 3;
        this.createHearts();
      });
    };
  }

  create(): void {
    this.initListeners();

    this.createHearts();
    this.createStaminaBar();
    this.updateLife(this.maxHearts);
  }

  createHearts() {
    this.hearts.map((el) => el.destroy());
    this.hearts = [];

    for (let i = 0; i < this.maxHearts; i++) {
      this.hearts.push(this.add.sprite(20 + 32 * (i + 1), 50, 'tiles_spr').setScale(2));
    }
  }

  updateLife(life: number) {
    let maxH = this.maxHearts;
    for (let i = 0; i < life; i++) {
      this.hearts[i].setFrame(HeartFrames.FULL_HEART);
      maxH = i;
    }
    for (let i = maxH + 1; i < this.hearts.length; i++) {
      this.hearts[i].setFrame(HeartFrames.EMPTY_HEART);
    }
  }

  createStaminaBar() {
    this.staminaBar = this.add.sprite(40, 80, "staminabar");
    this.staminaBar.setScale(0.5);
    this.staminaBar.displayWidth = this.maxStamina * 2;
    this.staminaBar.setOrigin(0, 0);
  }

  updateStamina(stamina: number) {
    this.staminaBar.displayWidth = stamina * 2;
  }

  private initListeners(): void {
    this.game.events.on(EVENTS_NAME.hpChange, this.updateLife, this);
    this.game.events.once(EVENTS_NAME.gameEnd, this.gameEndHandler, this);
    this.game.events.on(EVENTS_NAME.staminaChange, this.updateStamina, this);
  }
}
