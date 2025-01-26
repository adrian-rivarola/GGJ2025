import { GameObjects, Scene } from 'phaser';

export class Text extends GameObjects.Text {
  constructor(scene: Scene, x: number, y: number, text: string) {
    super(scene, x, y, text, {
      fontFamily: 'Georgia',
      fontSize: 'calc(100vw / 25)',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4,
    });

    this.setOrigin(0, 0);

    scene.add.existing(this);
  }

  static showPowerupText(scene: Scene, x: number, y: number, text: string) {
    const txt = scene.add.text(x, y, text, { fontSize: 12 }).setOrigin(0.5).setSize(12, 12).setScale(0.5);

    scene.tweens.add({
      targets: txt,
      y: '-=30',
      duration: 1000,
      alpha: 0,
      onComplete: () => txt.destroy(),
    });

    return txt;
  }
}
