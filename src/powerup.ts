import { GameObjects, Scene, Math as M } from "phaser";
import Player from "./player";

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
            // TODO: 
            'oxygen': () => { },
            'random': () => {
                this.randomizing = true;
                this.play('random');

                this.scene.time.delayedCall(2000, () => {
                    this.anims.stop();

                    const wheelOfFortune = Math.random() < 0.9;
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
                    this.scene.time.delayedCall(500, () => {
                        text.destroy();
                    });

                });
            },
            'health': () => {
                player.hearts++;
            },
            'stamina': () => {
                player.stamina = Math.min(player.stamina + player.MAX_STAMINA, player.MAX_STAMINA);
            },
            'shield': () => {
                player.hasShield = true;
            },
            'speed': () => {
                player.maxSpeed += 16;
                player.maxDivingSpeed += 24;
            },
            'size': () => {
                const ogScale = player.scale;
                player.setScale(player.scale * 1.5);
                this.scene.time.delayedCall(this.effectDuration, () => {
                    player.setScale(ogScale);
                });
            },
            'pull-down': () => {
                player.body.setGravityY(250);
                this.scene.time.delayedCall(this.effectDuration, () => {
                    player.body.setGravityY(0);
                });
            },
        }

        effectMap[this.effect]();

    }

    protected preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        this.iconFrame.setPosition(this.x, this.y);
    }
}

