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
let lives = 3;
let hearts;
let gameRunning = true;
let projectiles;
let lasers;
let burstShots;
let cursors;
let shiftKey;
let lastFired = 0;
let fireRate = 500;
let asteroidTimer;

function preload() {
    this.load.image('background', 'https://labs.phaser.io/assets/skies/starfield.png');
    this.load.image('character', 'SpaceShip.png');
    this.load.image('projectileSmall', 'Asteroid.png');
    this.load.image('laser', 'Laser.png');
    this.load.image('heart', 'heart.png');
}

function create() {
    this.add.tileSprite(0, 0, this.sys.game.config.width, this.sys.game.config.height, 'background').setOrigin(0, 0);

    lasers = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image
    });

    burstShots = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        maxSize: 30 // Allows for some off-screen management
    });

    character = this.physics.add.sprite(400, 300, 'character').setScale(0.5);
    character.setCollideWorldBounds(true);
    character.setDepth(1);

    projectiles = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image
    });

    cursors = this.input.keyboard.createCursorKeys();
    shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

    hearts = this.add.group({
        classType: Phaser.GameObjects.Image,
        key: 'heart',
        repeat: lives - 1,
        setXY: { x: 40, y: 80, stepX: 50 }
    });

    hearts.children.iterate(function (heart) {
        heart.setScale(0.25);
    });

    asteroidTimer = this.time.addEvent({
        delay: 800,
        callback: createProjectile,
        callbackScope: this,
        loop: true
    });
}

function update() {
    if (!gameRunning) {
        projectiles.getChildren().forEach(projectile => projectile.destroy());
        asteroidTimer.remove();
        return;
    }

    handlePlayerMovement();

    projectiles.getChildren().forEach(projectile => {
        if (projectile.x < 0) {
            projectile.destroy();
        }
    });

    if (Phaser.Input.Keyboard.JustDown(shiftKey)) {
        shootBurst();
    }

    if (Phaser.Input.Keyboard.JustDown(cursors.space) && this.time.now > lastFired + fireRate) {
        shootLaser();
        lastFired = this.time.now + fireRate;
    }
}

function handlePlayerMovement() {
    character.setVelocity(0);

    if (cursors.left.isDown) {
        character.setVelocityX(-250);
    } else if (cursors.right.isDown) {
        character.setVelocityX(250);
    }

    if (cursors.up.isDown) {
        character.setVelocityY(-250);
        character.setRotation(-0.2);
    } else if (cursors.down.isDown) {
        character.setVelocityY(250);
        character.setRotation(0.2);
    } else {
        character.setRotation(0);
    }
}

function shootLaser() {
    let laser = lasers.create(character.x, character.y, 'laser');
    laser.setVelocityX(300);
    laser.setScale(0.25);
}

function shootBurst() {
    let angles = [-15, 0, 15]; // Angles for the three shots
    angles.forEach(angle => {
        let burst = burstShots.get(character.x, character.y, 'laser');
        if (burst) {
            burst.setActive(true).setVisible(true);
            burst.setScale(0.5);
            burst.setRotation(Phaser.Math.DegToRad(angle));
            this.physics.velocityFromAngle(angle - 90, 400, burst.body.velocity);
        }
    });
}

function createProjectile() {
    const y = Phaser.Math.Between(0, this.sys.game.config.height);
    let projectile = projectiles.create(800, y, 'projectileSmall').setScale(0.3);
    projectile.setVelocityX(-Phaser.Math.Between(100, 200));
    this.physics.add.collider(character, projectile, handleCollision, null, this);
    this.physics.add.collider(lasers, projectile, destroyProjectile, null, this);
    this.physics.add.collider(burstShots, projectile, destroyProjectile, null, this);
}

function handleCollision(character, projectile) {
    this.cameras.main.shake(250, 0.01);
    character.setTint(0xff0000);
    this.time.delayedCall(500, () => character.clearTint(), [], this);
    projectile.destroy();
    lives--;
    updateHearts();
    if (lives <= 0) gameOver();
}

function destroyProjectile(laser, projectile) {
    laser.destroy();
    projectile.destroy();
    score += 100;
    scoreText.setText(`Score: ${score}`);
}

function updateHearts() {
    hearts.children.each((heart, index) => heart.setVisible(index < lives));
}

function gameOver() {
    gameRunning = false;
    this.physics.pause();
    character.setTint(0xff0000);
    scoreText.setText(`Game Over! Your score was: ${score}`);
}

new Phaser.Game(config);
