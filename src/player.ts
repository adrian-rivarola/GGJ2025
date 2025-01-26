import { Scene, GameObjects, Physics } from 'phaser';
import { EVENTS_NAME, GameStatus } from './consts';

export default class Player extends GameObjects.Sprite {
    declare body: Physics.Arcade.Body;
    cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys
    staminaRestoreEvent: Phaser.Time.TimerEvent;

    MAX_STAMINA = 100;

    hearts = 3
    takingDamage = false;
    lastCollision = -1;
    stamina = this.MAX_STAMINA;
    restoringStamina = false;

    maxSpeed = 128;
    maxDivingSpeed = 256;
    hasShield = true

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'character', 0);
        scene.add.existing(this);
        // this.setScale(1.5);

        this.setupAnimations();
        this.setupPhysics();
        this.setupControls();
    }

    setupAnimations() {
        this.anims.create({
            key: 'player-swim',
            frames: this.anims.generateFrameNumbers('character', {
                start: 0,
                end: 5,
            }),
            repeat: -1,
            frameRate: 8,
        });
        this.anims.create({
            key: 'player-die',
            frames: this.anims.generateFrameNumbers('character', {
                start: 6,
                end: 11,
            }),
            frameRate: 6,
        });
        this.play('player-swim');
    }

    setupPhysics() {
        this.scene.physics.world.enable(this);
        this.body.setCollideWorldBounds()

        // Reduces speed per second.
        this.body.useDamping = true;
        this.body.setDrag(0.01, 0.01);
        this.body.setMaxSpeed(128);
        this.body.setSize(14, 14);
    }
    setupControls() {
        this.cursorKeys = this.scene.input.keyboard!.createCursorKeys();

        this.scene.events.on('update', () => {
            if (this.hearts > 0) {
                if (this.cursorKeys.space.isDown) {
                    if (this.stamina > 0) {
                        this.body.setMaxSpeed(256);
                        this.body.velocity.scale(4);

                        this.stamina -= 30 * this.scene.game.loop.delta / 1000;
                        if (this.stamina <= 0) {
                            this.stamina = 0;
                            this.body.setMaxSpeed(128);
                        }
                        this.resetStaminaTimer();
                    }
                } else {
                    this.body.setMaxSpeed(128);

                    if (this.stamina != this.MAX_STAMINA && !this.restoringStamina) {
                        this.startStaminaTimer();
                    }
                }
            }
        });
    }

    startStaminaTimer() {
        this.restoringStamina = true;
        this.staminaRestoreEvent = this.scene.time.delayedCall(3000, () => {
            this.restoreStamina();
        });
    }

    restoreStamina() {
        const staminaRegenRate = this.MAX_STAMINA / 100;
        this.staminaRestoreEvent = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                this.stamina += staminaRegenRate;
                if (this.stamina >= this.MAX_STAMINA) {
                    this.stamina = this.MAX_STAMINA;
                    this.resetStaminaTimer();
                }
            },
            callbackScope: this,
            loop: true,
        });
    }

    resetStaminaTimer() {
        if (this.staminaRestoreEvent) {
            this.staminaRestoreEvent.remove();
        }
        this.restoringStamina = false;
    }

    takeDamage() {
        if (this.hasShield) {
            this.takingDamage = true
            const text = this.scene.add.text(this.x, this.y, 'Blocked!', { fontSize: 12 }).setOrigin(0.5).setSize(12, 12).setScale(0.5);
            this.scene.time.delayedCall(500, () => {
                text.destroy();
            });

            this.hasShield = false;
            this.scene.time.delayedCall(1000, () => {
                this.takingDamage = false;
            });

            return;
        }

        this.hearts -= 1
        this.takingDamage = true

        this.scene?.game.events.emit(EVENTS_NAME.hpChange, this.hearts);

        this.tint = 0xFF0000;
        this.scene.time.delayedCall(100, () => this.clearTint());

        if (this.hearts <= 0) {
            this.play('player-die');
            this.resetFlip();
            this.angle = 90;

            this.scene.tweens.add({
                targets: this,
                angle: 0,
                duration: 500,
                onComplete: () => {
                    this.body.setGravityY(-80);
                    this.scene?.game.events.emit(EVENTS_NAME.gameEnd, GameStatus.LOSE);
                },
            });
            return;
        }

        this.scene.time.delayedCall(1000, () => {
            this.takingDamage = false;
        });
    }

    preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);
        this.body.setAcceleration(0, 0);

        if (this.hearts <= 0) {
            return;
        }

        const acceleration = 320

        if (this.cursorKeys.left.isDown) {
            this.body.setAccelerationX(-acceleration);
        }
        if (this.cursorKeys.right.isDown) {
            this.body.setAccelerationX(acceleration)
        }

        if (this.cursorKeys.up.isDown) {
            this.body.setAccelerationY(-acceleration);
        }
        if (this.cursorKeys.down.isDown) {
            this.body.setAccelerationY(acceleration)
        }

        if (this.body.acceleration.x !== 0 || this.body.acceleration.y !== 0) {
            // Check if there was a collision in the last 100 ms
            const isColliding = time - this.lastCollision < 100;
            const dir = isColliding ? this.body.acceleration : this.body.velocity;

            this.setFlipY(dir.x < 0);
            // TODO: Interpolate rotation?
            this.rotation = dir.angle();
        }
    }
}
