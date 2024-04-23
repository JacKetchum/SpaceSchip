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

function preload() {
    this.load.image('background', 'assets/background.png'); // Make sure this path is correct
    this.load.image('character', 'assets/SpaceShip.png'); // Make sure this path is correct
    this.load.image('projectile', 'assets/projectile.png'); // Make sure this path is correct
}

function create() {
    this.add.image(400, 300, 'background');
    character = this.physics.add.sprite(400, 300, 'character');
    character.setCollideWorldBounds(true);
    projectiles = this.physics.add.group();

    this.input.on('wheel', (event) => {
        if (event.deltaY < 0) {
            character.setVelocityY(-160);
        } else {
            character.setVelocityY(160);
        }
    }, this);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

    this.time.addEvent({
        delay: 1000,
        callback: createProjectile,
        callbackScope: this,
        loop: true
    });
}

function update() {
    if (!gameRunning) {
        this.physics.pause();
        return;
    }

    projectiles.getChildren().forEach(projectile => {
        if (projectile.x < 0) {
            projectile.destroy(); // Remove the projectile if it goes off screen
        }
    });
}

function createProjectile() {
    const y = Phaser.Math.Between(0, this.sys.game.config.height);
    let projectile = projectiles.create(800, y, 'projectile');
    projectile.setVelocityX(-Phaser.Math.Between(100, 200));

    let type = Math.random();
    if (type < 0.3) {
        projectile.setScale(2);
    } else if (type < 0.6) {
        projectile.setScale(0.5);
    } else {
        projectile.setScale(1);
        projectile.setData('type', 'coin');
    }

    this.physics.add.collider(character, projectile, handleCollision, null, this);
}

function handleCollision(character, projectile) {
    if (projectile.getData('type') === 'coin') {
        score += 10;
        scoreText.setText(`Score: ${score}`);
        projectile.destroy();
    } else {
        gameRunning = false;
        alert(`Game Over! Your score was: ${score}`);
        projectile.destroy();
    }
}

new Phaser.Game(config);
