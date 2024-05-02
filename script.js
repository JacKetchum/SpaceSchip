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
let cursors;
let lastFired = 0;
let fireRate = 500;
let asteroidTimer; 
let thrustBar;
let maxThrust = 100;
let currentThrust = 100;
let thrustKey;

function preload() {
    this.load.image('background', 'https://labs.phaser.io/assets/skies/starfield.png');
    this.load.image('character', 'SpaceShip.png');
    this.load.image('projectileSmall', 'Asteroid.png');
    this.load.image('laser', 'Laser.png');
    this.load.image('heart', 'heart.png');
    this.load.image('thrustBar', 'bar.png');  // Assume a plain horizontal bar graphic
}

function create() {
    this.add.tileSprite(0, 0, this.sys.game.config.width, this.sys.game.config.height, 'background').setOrigin(0, 0);

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
    thrustKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

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

    // Create a thrust meter
    thrustBar = this.add.graphics();
    thrustBar.fillStyle(0x00ff00, 1);
    thrustBar.fillRect(16, 100, 200, 20);  // Starting full width

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

    if (thrustKey.isDown && currentThrust > 0) {
        currentThrust -= 0.5;  // Decrease thrust when SHIFT is pressed
        updateThrustBar();
    } else {
        currentThrust = Math.min(maxThrust, currentThrust + 0.2);  // Recharge thrust when not used
        updateThrustBar();
    }

    let time = this.time.now;
    if (Phaser.Input.Keyboard.JustDown(cursors.space) && time > lastFired + fireRate) {
        shootLaser();
        lastFired = time;
    }
}

function updateThrustBar() {
    thrustBar.clear();
    thrustBar.fillStyle(0x00ff00, 1);
    thrustBar.fillRect(16, 100, 200 * (currentThrust / maxThrust), 20);
}

function handleCollision(character, projectile) {
    this.cameras.main.shake(250, 0.01); 
    character.setTint(0xff0000); 

    this.time.delayedCall(500, function() {
        character.clearTint();
        character.setTint(0x8888ff); 
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
