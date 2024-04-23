const config = {
    type: Phaser.AUTO,
    parent: 'gameArea',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let character;
let score = 0;
let scoreText;
let gameRunning = true;
let projectiles;
let lasers;
let cursors;
let lastFired = 0;
let fireRate = 500; 

function preload() {
    this.load.image('background', 'https://labs.phaser.io/assets/skies/starfield.png');
    this.load.image('character', 'SpaceShip.png');
    this.load.image('projectileSmall', 'Asteroid.png');
    this.load.image('laser', 'Laser.png');
}

function create() {
    this.add.tileSprite(0, 0, this.sys.game.config.width, this.sys.game.config.height, 'background').setOrigin(0, 0);

    character = this.physics.add.sprite(400, 300, 'character').setScale(0.1);
    character.setCollideWorldBounds(true);

    projectiles = this.physics.add.group();
    lasers = this.physics.add.group();

    cursors = this.input.keyboard.createCursorKeys();
    let wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };
    cursors = Object.assign(cursors, wasd);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

    this.time.addEvent({
        delay: 800, 
        callback: createProjectile,
        callbackScope: this,
        loop: true
    });
}

function update() {
    if (!gameRunning) {
        return;
    }

    projectiles.getChildren().forEach(projectile => {
        if (projectile.x < 0) {
            projectile.destroy();
        }
    });

    character.setVelocity(0);

    if (cursors.left.isDown) {
        character.setVelocityX(-250);
    } else if (cursors.right.isDown) {
        character.setVelocityX(250);
    }

    if (cursors.up.isDown) {
        character.setVelocityY(-250);
    } else if (cursors.down.isDown) {
        character.setVelocityY(250);
    }

    let time = this.time.now;
    if (Phaser.Input.Keyboard.JustDown(cursors.space) && time > lastFired + fireRate) {
        shootLaser();
        lastFired = time;
    }
}

function createProjectile() {
    const y = Phaser.Math.Between(0, this.sys.game.config.height);
    let projectile = projectiles.create(800, y, 'projectileSmall').setScale(0.3);
    projectile.setVelocityX(-Phaser.Math.Between(100, 200));
    projectile.setAngularVelocity(20);

    this.physics.add.collider(character, projectile, handleCollision, null, this);
    this.physics.add.collider(lasers, projectile, destroyProjectile, null, this);
}

function handleCollision(character, projectile) {
    gameRunning = false;
    this.physics.pause();
    character.setTint(0xff0000);
    scoreText.setText(`Game Over! Your score was: ${score}`);
}

function shootLaser() {
    let laser = lasers.create(character.x, character.y, 'laser');
    laser.setVelocityX(300);
    laser.setScale(0.25); 
}

function destroyProjectile(laser, projectile) {
    projectile.destroy();
    laser.destroy();
    score += 100;
    scoreText.setText(`Score: ${score}`);
}

new Phaser.Game(config);