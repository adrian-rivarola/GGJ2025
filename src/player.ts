import { Scene, GameObjects, Physics } from 'phaser';
import { EVENTS_NAME, GameStatus } from './consts';

export default class Player extends GameObjects.Sprite {
    declare body: Physics.Arcade.Body;
    shield: GameObjects.Image;
    cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys
    staminaRestoreEvent: Phaser.Time.TimerEvent;
    breathing: Phaser.Time.TimerEvent;

    MAX_STAMINA = 100;

    hearts = 3
    oxygen = 5
    takingDamage = false;
    lastCollision = -1;
    stamina = this.MAX_STAMINA;
    restoringStamina = false;

    maxSpeed = 128;
    maxDivingSpeed = 256;
    hasShield = false;
    isDiving = false;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'character', 0);
        scene.add.existing(this);

        this.setupAnimations();
        this.setupPhysics();
        this.setupControls();

        this.scene.game?.events?.on(EVENTS_NAME.uiSceneCreated, () => {
            this.scene.game.events.emit(EVENTS_NAME.uiChange, this);
        });
        this.breathing = this.scene.time.addEvent({
            delay: 15_000,
            callback: () => {
                this.checkOxygen();
            },
            callbackScope: this,
            loop: true,
        });

        this.shield = this.scene.add.image(this.x, this.y, 'bubble').setScale(1.5).setOrigin(0.5).setVisible(false);
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

        this.cursorKeys.space.onDown = () => {
            if (this.hearts <= 0 || this.stamina <= 0 || (this.body.acceleration.x === 0 && this.body.acceleration.y == 0)) {
                return;
            }

            this.isDiving = true;
            this.body.setMaxSpeed(this.maxDivingSpeed);
            this.body.velocity.scale(3);

        };

        this.cursorKeys.space.onUp = () => {
            this.isDiving = false;
            this.body.setMaxSpeed(this.maxSpeed);
        }
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
                this.scene.game.events.emit(EVENTS_NAME.uiChange, this);
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

    takeDamage(amount: number = 1) {
        if (this.hasShield) {
            this.takingDamage = true
            const text = this.scene.add.text(this.x, this.y, 'Blocked!', { fontSize: 12 }).setOrigin(0.5).setSize(12, 12).setScale(0.5);
            this.scene.time.delayedCall(500, () => {
                text.destroy();
            });

            this.hasShield = false;
            this.shield.setVisible(false);
            this.scene.time.delayedCall(1000, () => {
                this.takingDamage = false;
            });

            return;
        }

        this.hearts -= amount
        this.takingDamage = true

        this.scene.game.events.emit(EVENTS_NAME.uiChange, this);
        this.scene.sound.add('hitHurt').play();

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

    checkOxygen() {
        if (this.hasShield) {
            return;
        }

        this.oxygen--;
        console.log(this.oxygen);

        this.scene.game.events.emit(EVENTS_NAME.uiChange, this);
        if (this.oxygen === 0) {
            this.takeDamage(this.hearts);
        }
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

        if (this.hasShield) {
            this.shield.setPosition(this.x, this.y)
        }

        if (this.body.acceleration.x !== 0 || this.body.acceleration.y !== 0) {
            // Check if there was a collision in the last 100 ms
            const isColliding = time - this.lastCollision < 100;
            const dir = isColliding ? this.body.acceleration : this.body.velocity;

            this.setFlipY(dir.x < 0);
            // TODO: Interpolate rotation?
            this.rotation = dir.angle();
        }

        if (this.isDiving) {
            this.stamina -= 30 * this.scene.game.loop.delta / 1000;
            this.scene.game.events.emit(EVENTS_NAME.uiChange, this);
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.body.setMaxSpeed(this.maxSpeed);
            }
            this.resetStaminaTimer();
        } else {
            if (this.stamina != this.MAX_STAMINA && !this.restoringStamina) {
                this.startStaminaTimer();
            }
        }
    }
}
