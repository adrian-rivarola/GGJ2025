import { GameObjects, Scene } from 'phaser';
import Player from '../player';
import Fish from '../fish';

export class Game extends Scene {
    map: Phaser.Tilemaps.Tilemap;
    player: Player;
    fish: Fish[];
    powerups: Phaser.GameObjects.Sprite[];

    constructor() {
        super('MainMenu');
    }

    preload() {
        this.load.spritesheet('character', 'assets/character.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('fish', 'assets/fish.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('powerup', 'assets/powerup.png', { frameWidth: 32, frameHeight: 32 });

        this.load.image("water-tiles", "assets/Water.png");
        this.load.image("grass-tiles", "assets/grass.png");
        this.load.image("cave-tiles", "assets/cave.png");
        this.load.tilemapTiledJSON("map", "assets/map1.json");
    }

    createMap() {
        this.map = this.make.tilemap({ key: "map" });

        const caveTileset = this.map.addTilesetImage("cave", "cave-tiles")!;
        const grassTileset = this.map.addTilesetImage("grass", "grass-tiles")!;
        const bgLayer = this.map.createLayer('background', grassTileset)!;
        const cavesLayer = this.map.createLayer("caves", caveTileset)!;

        cavesLayer.setCollisionByProperty({ collides: true });
        this.physics.world.setBounds(0, 0, bgLayer.width, bgLayer.height);

        // TODO: Add effect to background
        // this.tweens.add({
        //     targets: cavesLayer,
        //     x: '+=5',
        //     duration: 500,
        //     yoyo: true,
        //     loop: -1
        // });

        if (this.physics.config.debug) {
            const debugGraphics = this.add.graphics().setAlpha(0.75);
            cavesLayer.renderDebug(debugGraphics, {
                tileColor: null, // Color of non-colliding tiles
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
                faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
            });
        }
    }

    createFish() {
        const fishObjects = this.map.getObjectLayer('enemy-positions')?.objects ?? [];
        this.fish = fishObjects.map((obj) => Fish.fromTileObject(this, obj));
    }

    createPowerups() {
        const powerupObjects = this.map.getObjectLayer('powerup-positions')?.objects ?? [];
        console.log(powerupObjects);
        this.powerups = powerupObjects.map(e => {
            // TODO: define powerup effect
            const idx = Math.round(Math.random() * 20);
            const powerup = this.add.sprite(e.x!, e.y! - 16, 'powerup', idx)
            this.physics.world.enable(powerup);

            return powerup;
        });
        this.tweens.add({
            targets: this.powerups,
            y: '+=8',
            duration: 800,
            yoyo: true,
            loop: -1,
        });
    }

    createPlayer() {
        const [playerOpts,] = this.map.filterObjects('player-position', (e) => e.name === 'player') ?? [];
        this.player = new Player(this, playerOpts?.x ?? 150, playerOpts?.y ?? 500);

        this.physics.add.collider(this.player, this.map.getLayer('caves')!.tilemapLayer)
        this.physics.add.overlap(this.player, this.fish, (_, fish) => {
            if (this.player.takingDamage) {
                return;
            }

            // TODO: Move to Fish class, follow player?
            if (fish instanceof Fish) {
                fish.play('fish-attack', true);
                fish.patrolChain.pause();

                const duration = fish.anims.currentAnim!.duration;
                this.time.delayedCall(duration, () => {
                    fish.play('fish-swim');
                    fish.patrolChain.resume();
                });
            }
            this.player.takeDamage();
        });

        this.physics.add.overlap(this.player, this.powerups, (_, powerup) => {
            if (powerup instanceof GameObjects.Sprite) {
                if (!powerup.active) {
                    return
                }
                //TODO: Add effect to player

                powerup.setActive(false);
                powerup.removeFromDisplayList();
                powerup.removeFromUpdateList();

                // Reactivate powerup in 30 seconds
                this.time.delayedCall(30_000, () => {
                    // TODO: Change powerup type?
                    powerup.setActive(true);
                    powerup.addToDisplayList();
                    powerup.addToUpdateList();
                });
            }
        });


        this.cameras.main
            .setZoom(3.5)
            .startFollow(this.player, false, 1, 1, -75, 0);
    }

    create() {
        this.createMap();
        this.createFish();
        this.createPowerups();
        this.createPlayer();
    }
}

