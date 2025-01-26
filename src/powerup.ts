import { GameObjects, Scene } from "phaser";
import Player from "./player";
import { EVENTS_NAME } from "./consts";
import { Text } from "./classes/text";

// Map effect names to frame index in spritesheet
export const EFFECTS = [
    'oxygen',
    'random',
    'health',
    'stamina',
    'shield',
    'speed',
    'size',
    'pull-down',
]

export default class PowerUp extends GameObjects.Sprite {
    iconFrame: GameObjects.Image;
    regenerationTime = 30_000;
    effectDuration = 7_500;

    randomizing = false;
    effect: string;

    constructor(scene: Scene, x: number, y: number, effect: string) {
        super(scene, x, y, 'powerup');

        this.iconFrame = scene.add.image(this.x, this.y, 'powerup-frame').setOrigin(0.5);
        scene.add.existing(this).setOrigin(0.5);

        this.setScale(0.5);
        this.iconFrame.setScale(0.5);

        this.createAnimation();
        this.setEffect(effect);
    }

    static createOxygen(scene: Scene, x: number, y: number) {
        const p = new PowerUp(scene, x, y, 'oxygen');
        p.iconFrame.destroy();

        p.setTexture('bubble');
        return p;
    }

    createAnimation() {
        this.anims.create({
            key: 'random',
            frames: this.anims.generateFrameNumbers('powerup', {
                start: 0,
                end: 7,
            }),
            repeat: -1,
            frameRate: 8,
        });
    }

    use(player: Player) {
        if (!this.active || this.randomizing) {
            return;
        }

        this.applyEffect(player);

        if (!this.randomizing) {
            this.scene.sound.add('powerUp').play();
            this.remove();
        }
    }

    remove() {
        this.setActive(false);
        this.setVisible(false);
        this.iconFrame.setVisible(false);

        // Reactivate powerup in X seconds
        this.scene.time.delayedCall(this.regenerationTime, () => {
            const newEffectIdx = Math.floor(Math.random() * EFFECTS.length);
            this.effect = EFFECTS[newEffectIdx];
            this.setFrame(newEffectIdx);

            this.setActive(true);
            this.setVisible(true);
            this.iconFrame.setVisible(true);
        });
    }

    setEffect(effectName: string) {
        // Map effect to a frame number
        this.effect = effectName;
        this.setFrame(EFFECTS.indexOf(effectName));
    }

    applyEffect(player: Player) {
        const effectMap: Record<string, Function> = {
            'oxygen': () => {
                player.oxygen++;
                Text.showPowerupText(this.scene, player.x, player.y, '+1 oxygen');
            },
            'random': () => {
                this.randomizing = true;
                this.play('random');

                this.scene.time.delayedCall(2000, () => {
                    this.anims.stop();

                    const wheelOfFortune = Math.random() < 0.8;
                    if (wheelOfFortune) {
                        const newEffectIdx = Math.floor(Math.random() * EFFECTS.length);
                        this.effect = EFFECTS[newEffectIdx];
                        this.setFrame(newEffectIdx);

                        this.scene.time.delayedCall(500, () => {
                            this.randomizing = false;
                        });
                        return;
                    }

                    this.remove();
                    this.randomizing = false;
                    this.setFrame(EFFECTS.indexOf('random'));

                    const text = this.scene.add.text(this.x, this.y, 'Nope!', { fontSize: 12 }).setOrigin(0.5).setSize(12, 12).setScale(0.5);
                    text.angle = -10;
                    this.scene.tweens.add({
                        targets: text,
                        angle: 10,
                        duration: 100,
                        yoyo: true,
                        loop: 1,
                        onComplete: () => text.destroy(),
                    });
                });
            },
            'health': () => {
                player.hearts++;
                Text.showPowerupText(this.scene, player.x, player.y, '+1 heart');
            },
            'stamina': () => {
                player.MAX_STAMINA += 20;
                player.stamina = player.MAX_STAMINA;
                Text.showPowerupText(this.scene, player.x, player.y, 'Stamina improved!');

            },
            'shield': () => {
                player.hasShield = true;
                player.shield.setVisible(true);
                player.shield.setPosition(player.x, player.y);
                Text.showPowerupText(this.scene, player.x, player.y, 'Shield acquired!');
            },
            'speed': () => {
                player.maxSpeed += 16;
                player.maxDivingSpeed += 24;
                Text.showPowerupText(this.scene, player.x, player.y, 'Speed improved!');
            },
            'size': () => {
                player.setScale(player.scale * 1.5);
                Text.showPowerupText(this.scene, player.x, player.y, '${powerupMsg}');
                this.scene.time.delayedCall(this.effectDuration, () => {
                    player.setScale(player.scale / 1.5);
                });
            },
            'pull-down': () => {
                player.body.setGravityY(250);
                Text.showPowerupText(this.scene, player.x, player.y, 'Gravity augmented!');
                this.scene.time.delayedCall(this.effectDuration, () => {
                    player.body.setGravityY(0);
                    Text.showPowerupText(this.scene, player.x, player.y, 'Gravity restored!');
                });
            },
        };

        effectMap[this.effect]();
        this.scene.game.events.emit(EVENTS_NAME.uiChange, player);
    }

    protected preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        this.iconFrame.setPosition(this.x, this.y);
    }
}

