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

let character, glow, laserSight; // Include the glow and laser sight
let score = 0;
let scoreText;
let lives = 3;
let hearts;
let gameRunning = true;
let projectiles;
let lasers;
let cursors;
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

    glow = this.add.sprite(400, 300, 'character').setScale(0.55);
    glow.setTint(0xffff99);
    glow.setAlpha(0.4);

    lasers = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image
    });

    character = this.physics.add.sprite(400, 300, 'character').setScale(0.5);
    character.setCollideWorldBounds(true);
    character.setDepth(1);

    projectiles = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image
    });

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

    laserSight = this.add.graphics({ lineStyle: { width: 2, color: 0xff0000, alpha: 0.5 } });
}

function update() {
    if (!gameRunning) {
        projectiles.getChildren().forEach(projectile => projectile.destroy());
        asteroidTimer.remove();
        return;
    }

    projectiles.getChildren().forEach(projectile => {
        if (projectile.x < 0) {
            projectile.destroy();
        }
    });

    character.setVelocity(0);
    glow.x = character.x;
    glow.y = character.y;
    glow.rotation = character.rotation;

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

    let time = this.time.now;
    if (Phaser.Input.Keyboard.JustDown(cursors.space) && time > lastFired + fireRate) {
        shootLaser();
        lastFired = time;
    }

    // Update laser sight
    laserSight.clear();
    laserSight.strokeLineShape(new Phaser.Geom.Line(character.x, character.y, character.x + 800 * Math.cos(character.rotation), character.y + 800 * Math.sin(character.rotation)));
}

function shootLaser() {
    let laser = lasers.create(character.x, character.y, 'laser');
    laser.body.velocity.x = 300 * Math.cos(character.rotation); // Calculate the correct velocity based on rotation
    laser.body.velocity.y = 300 * Math.sin(character.rotation);
    laser.setScale(0.25);
    laser.rotation = character.rotation; // Align laser with the ship's rotation
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
    this.cameras.main.shake(250, 0.01);
    character.setTint(0xff0000);

    this.time.delayedCall(500, () => {
        character.clearTint();
    }, [], this);

    projectile.destroy();
    lives -= 1;
    updateHearts();
    if (lives <= 0) {
        gameRunning = false;
        this.physics.pause();
        character.setTint(0xff0000);
        scoreText.setText(`Game Over! Your score was: ${score}`);
    }
}

function updateHearts() {
    hearts.children.each((heart, index) => {
        heart.setVisible(index < lives);
    });
}

function destroyProjectile(laser, projectile) {
    if (projectile.scaleX === 0.3) {  // Check if it's a large asteroid
        splitAsteroid(projectile);
    } else {
        projectile.destroy();
    }
    laser.destroy();
    score += 100;
    scoreText.setText(`Score: ${score}`);
}

function splitAsteroid(asteroid) {
    for (let i = 0; i < 2; i++) {
        let smallAsteroid = projectiles.create(asteroid.x, asteroid.y, 'projectileSmall');
        smallAsteroid.setScale(0.15);
        const angle = Phaser.Math.Between(-90, 90);
        this.physics.velocityFromAngle(angle, Phaser.Math.Between(150, 250), smallAsteroid.body.velocity);
        smallAsteroid.setAngularVelocity(50);
    }
    asteroid.destroy();
}

new Phaser.Game(config);
