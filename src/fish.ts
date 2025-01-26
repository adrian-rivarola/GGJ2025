import { Scene, GameObjects, Physics } from 'phaser';

type FishMovement = "static" | "horizontal" | "vertical" | "mixed";
export type FishOpts = {
    movement: FishMovement,
    patrolArea?: number,
}

export default class Fish extends GameObjects.Sprite {
    declare body: Physics.Arcade.Body;
    patrolChain: Phaser.Tweens.TweenChain;

    constructor(scene: Scene, initialX: number, initialY: number, fishOpts?: FishOpts) {
        super(scene, initialX, initialY, 'fish', 0);
        scene.add.existing(this);

        this.setupAnimations();
        this.setupPhysics();
        this.setupPatrol(fishOpts);
    }

    static fromTileObject(scene: Scene, tileObj: Phaser.Types.Tilemaps.TiledObject) {
        const config = (tileObj.properties || []) as any[];
        const fishOpts = config.reduce((acc, e) => ({ ...acc, [e.name]: e.value }), {});

        return new Fish(scene, tileObj.x!, tileObj.y!, fishOpts);
    }

    setupAnimations() {
        this.anims.create({
            key: 'fish-swim',
            frames: this.anims.generateFrameNumbers('fish', {
                start: 0,
                end: 3,
            }),
            repeat: -1,
            frameRate: 6,
        });
        this.anims.create({
            key: 'fish-attack',
            frames: this.anims.generateFrameNumbers('fish', {
                start: 10,
                end: 13,
            }),
            frameRate: 8,
        });
        this.play('fish-swim');
    }

    setupPhysics() {
        this.scene.physics.world.enable(this);

        // Reduces speed per second.
        this.body.useDamping = true;
        this.body.setDrag(0.01, 0.01);
        this.body.setMaxSpeed(150);

        this.body.setSize(30, 30);
    }

    setupPatrol(fishOpts?: FishOpts) {
        const { patrolArea = 100, movement = "static" } = fishOpts || {};
        const incProp = `+=${patrolArea}`
        const decProp = `-=${patrolArea}`

        const moveRight: Phaser.Types.Tweens.TweenBuilderConfig = {
            targets: this,
            x: incProp,
            duration: 1000,
            onStart: () => {
                this.setFlipX(false);
            },
        };
        const moveLeft: Phaser.Types.Tweens.TweenBuilderConfig = {
            targets: this,
            x: decProp,
            duration: 1000,
            onStart: () => {
                this.setFlipX(true);
            },
        };
        const moveUp: Phaser.Types.Tweens.TweenBuilderConfig = {
            targets: this,
            y: decProp,
            duration: 1000,
        };
        const moveDown: Phaser.Types.Tweens.TweenBuilderConfig = {
            targets: this,
            y: incProp,
            duration: 1000,
        };
        const rotateLeft: Phaser.Types.Tweens.TweenBuilderConfig = {
            targets: this,
            angle: '-=90',
            duration: 400,
        };
        const rotateRight: Phaser.Types.Tweens.TweenBuilderConfig = {
            targets: this,
            angle: '+=90',
            duration: 400,
        };

        // TODO: Improve this and add more patterns
        const moveOpts: Record<FishMovement, Phaser.Types.Tweens.TweenBuilderConfig[]> = {
            // Float effect
            "static": [
                {
                    y: '-=5',
                    targets: this,
                    duration: 1000,
                    yoyo: true,
                    loop: -1,
                }
            ],
            "horizontal": [
                { delay: 700, ...moveRight, },
                { delay: 700, ...moveLeft, },
            ],
            "vertical": [
                rotateRight,
                moveDown,
                rotateLeft,
                rotateLeft,
                { delay: 700, ...moveUp, },
                rotateRight,
            ],
            "mixed": [
                { delay: 700, ...moveRight, },
                { delay: 700, ...moveLeft, },
                rotateLeft,
                moveDown,
                rotateRight,
                rotateRight,
                { delay: 700, ...moveUp, },
                rotateLeft,
                moveLeft,
                { delay: 700, ...moveRight, },
                rotateLeft,
                { delay: 700, ...moveUp, },
                rotateRight,
                rotateRight,
                { delay: 700, ...moveDown, },
                rotateLeft,
            ]
        };

        this.patrolChain = this.scene.tweens.chain({
            targets: this,
            tweens: moveOpts[movement],
            delay: 0,
            loop: -1,
            repeatDelay: 0,
            paused: false,
            persist: true,
        });
    }

    attack() {
        this.play('fish-attack', true);
        this.patrolChain.pause();

        const duration = this.anims.currentAnim!.duration;
        this.scene.time.delayedCall(duration, () => {
            this.play('fish-swim');
            this.patrolChain.resume();
        });

    }
}

