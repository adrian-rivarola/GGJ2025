import { Scene } from 'phaser';
import Player from '../player';
import Fish from '../fish';
import PowerUp from '../powerup';
import { EVENTS_NAME, GameStatus } from '../consts';

export class Game extends Scene {
    map: Phaser.Tilemaps.Tilemap;
    player: Player;
    win: Phaser.Physics.Arcade.Body;
    fish: Fish[];
    powerups: PowerUp[];
    bgMusic: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound

    constructor() {
        super('level-1-scene');
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
        this.powerups = powerupObjects.map(e => new PowerUp(this, e.x!, e.y! - 16, 'random'));

        const oxygenObjects = this.map.getObjectLayer('oxygen-positions')?.objects ?? [];
        this.powerups = this.powerups.concat(...oxygenObjects.map(e => PowerUp.createOxygen(this, e.x!, e.y! - 16)))

        this.physics.world.enable(this.powerups);
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
        const [winOpts,] = this.map.filterObjects('player-position', (e) => e.name === 'Win') ?? [];
        this.player = new Player(this, playerOpts?.x ?? 150, playerOpts?.y ?? 500);
        this.win = new Phaser.Physics.Arcade.Body(this.physics.world);
        this.win.position = new Phaser.Math.Vector2(winOpts.x, winOpts.y);
        this.win.setSize(this.win.width, this.game.canvas.height);

        this.physics.add.collider(this.player, this.map.getLayer('caves')!.tilemapLayer, () => {
            this.player.lastCollision = this.game.getTime();
        });

        this.physics.add.overlap(this.player, this.fish, (_, fish) => {
            if (this.player.takingDamage || !(fish instanceof Fish)) {
                return;
            }

            fish.attack();
            this.player.takeDamage();
        });

        this.physics.add.overlap(this.player, this.powerups, (_, powerup) => {
            if (powerup instanceof PowerUp) {
                powerup.use(this.player);
            }
        });

        this.physics.add.overlap(this.player, this.win, (_) => {
            this.game.events.emit(EVENTS_NAME.gameEnd, GameStatus.WIN)
        });
    }

    create() {
        this.createMap();
        this.createFish();
        this.createPowerups();
        this.createPlayer();

        this.bgMusic = this.sound.add('etherealUplifting');
        this.bgMusic.loop = true;
        this.bgMusic.play();

        this.cameras.main
            .setZoom(4)
            .startFollow(this.player, false, 0.15, 0.15, -64, 0)
    }
}

