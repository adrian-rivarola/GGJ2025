import { Scene, GameObjects, Physics } from 'phaser';

export default class Player extends GameObjects.Sprite {
    declare body: Physics.Arcade.Body;
    cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys

    takingDamage = false;

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
                start: 6,
                end: 11,
            }),
            repeat: -1,
            frameRate: 8,
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

        this.body.setSize(16, 16);
    }

    setupControls() {
        this.cursorKeys = this.scene.input.keyboard!.createCursorKeys();

        this.cursorKeys.space.onDown = () => {
            this.body.setMaxSpeed(256);
            this.body.velocity.scale(4);
        }
        this.cursorKeys.space.onUp = () => {
            this.body.setMaxSpeed(128);
        }
    }

    takeDamage() {
        this.takingDamage = true

        this.tint = 0xFF0000;

        this.scene.time.delayedCall(100, () => this.clearTint());
        this.scene.time.delayedCall(1000, () => {
            this.takingDamage = false;
        });
    }

    preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        const acceleration = 320

        this.body.setAcceleration(0, 0);

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

        // TODO: Improve behavior on collisions (use acceleration for angle and direction?)
        if (this.body.acceleration.x !== 0 || this.body.acceleration.y !== 0) {
            const dir = this.body.velocity;
            this.setFlipY(dir.x < 0);
            // TODO: Interpolate rotation?
            this.rotation = dir.angle()
        }
    }
}
