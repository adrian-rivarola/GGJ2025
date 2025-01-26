import { GameObjects, Scene } from 'phaser';

import { EVENTS_NAME, GameStatus } from '../consts';
import { Text } from '../classes/text';
import Player from '../player';

enum HeartFrames {
  FULL_HEART = 530,
  HALF_HEART = 531,
  EMPTY_HEART = 532,
}

export class UI extends Scene {
  private gameEndPhrase!: Text;
  private hearts: GameObjects.Sprite[] = [];
  private staminaBar: GameObjects.Sprite;
  private bubbles: GameObjects.Sprite[] = [];

  maxHearts = 3;
  maxBubbles = 5;
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
          : `YOU ARE ROCK!\nYour time: ${Math.round(this.game.loop.time / 1000)} s\nCLICK TO RESTART`,
      )
        .setAlign('center')
        .setColor(status === GameStatus.LOSE ? '#ff0000' : '#ffffff');

      if (status === GameStatus.LOSE) {
        this.sound.add('ohNo').play();
      }

      this.gameEndPhrase.setPosition(
        this.game.scale.width / 2 - this.gameEndPhrase.width / 2,
        this.game.scale.height * 0.4,
      );

      this.input.on('pointerdown', () => {
        window.location.reload()
      });
    };
  }

  create(): void {
    this.initListeners();

    this.createStaminaBar();

    this.game?.events.emit(EVENTS_NAME.uiSceneCreated);
  }

  createHearts() {
    if (this.hearts.length === this.maxHearts) {
      return;
    }

    this.hearts.map((el) => el.destroy());
    this.hearts = [];

    for (let i = 0; i < this.maxHearts; i++) {
      this.hearts.push(this.add.sprite(20 + 32 * (i + 1), 50, 'tiles_spr', HeartFrames.FULL_HEART).setScale(2));
    }
  }

  createBubbles() {
    if (this.bubbles.length === this.maxBubbles) {
      return;
    }

    this.bubbles.map((el) => el.destroy());
    this.bubbles = [];

    for (let i = 0; i < this.maxBubbles; i++) {
      this.bubbles.push(this.add.sprite(20 + 32 * (i + 1), 100, 'bubble').setScale(1));
    }
  }

  createStaminaBar() {
    this.staminaBar = this.add.sprite(40, 140, "staminabar");
    this.staminaBar.setScale(0.5);
    this.staminaBar.displayWidth = this.maxStamina * 2;
    this.staminaBar.setOrigin(0, 0);
  }


  updateUI(player: Player) {
    this.maxHearts = player.hearts;
    this.maxBubbles = player.oxygen;
    this.createHearts();
    this.createBubbles();
    this.staminaBar.displayWidth = player.stamina * 2;
  }

  private initListeners(): void {
    this.game.events.on(EVENTS_NAME.uiChange, this.updateUI, this);
    this.game.events.once(EVENTS_NAME.gameEnd, this.gameEndHandler, this);
  }
}
