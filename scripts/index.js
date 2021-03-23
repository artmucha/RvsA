const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// globals
const cellSize = 100;
const cellGap = 3;
const gameGrid = [];
const defenders = [];
const enemies = [];
const enemiesPosition = [];
const projectiles = [];
let numberOfResources = 300;
let frame = 0;
let enemiesInterval = 600;
let gameOver = false;
let score = 0;

// mouse
const mouse = {
  x: 10,
  y: 10,
  width: 0.1,
  height: 0.1,
};

let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', e => {
  mouse.x = e.x - canvasPosition.left;
  mouse.y = e.y - canvasPosition.top;
});

canvas.addEventListener('mouseleave', () => {
  mouse.x = undefined;
  mouse.y = undefined;
});

// game board
const controlsBar = {
  width: canvas.width,
  height: cellSize,
};

const collision = (first, second) => {
  if ( !(
          first.x > second.x + second.width ||
          first.x + first.width < second.x ||
          first.y > (second.y + second.height) ||
          first.y + first.height < second.y
  ) ) {
    return true;
  };
};

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
  };
  draw() {
    if(mouse.x && mouse.y && collision(this, mouse)) {
      ctx.strokeStyle = 'black';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
};

const createGrid = () => {
  for (let y = cellSize; y < canvas.height; y += cellSize) {
    for (let x = 0; x < canvas.width; x += cellSize) {
      gameGrid.push(new Cell(x, y));
    };
  };
};

createGrid();

const handleGameGrid = () => {
  for (let i = 0; i < gameGrid.length; i++) {
    gameGrid[i].draw();
  };
};

// projectiles
class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.health = 10;
    this.power = 20;
    this.speed = 5;
  };
  update() {
    this.x += this.speed;
  };
  draw() {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    ctx.fill();
  };
};

const hadleProjectiles = () => {
  for (let i = 0; i < projectiles.length; i++) {
    projectiles[i].update();
    projectiles[i].draw();

    for (let j = 0; j < enemies.length; j++) {
      if (enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])) {
        enemies[j].health -= projectiles[i].power;
        projectiles.splice(i, 1);
        i--;
      };
    };

    if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
      projectiles.splice(i, 1);
      i--;
    };
  };
};

// defenders
class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;;
    this.shooting = false;
    this.health = 100;
    this.projectiles = [];
    this.timer = 0;
  };
  draw() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'gold';
    ctx.font = '20px Orbitron';
    ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 25);
  };
  update() {
    if(this.shooting) {
      this.timer++;
      if (this.timer % 100 === 0) {
        projectiles.push(new Projectile(this.x, this.y + 50));
      };
    } else {
      this.timer = 0;
    }
  };
};

canvas.addEventListener('click', () => {
  const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
  const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
  if(gridPositionY < cellSize) return;

  for (let i = 0; i < defenders.length; i++) {
    if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) return;
  };
  
  let defenderCost = 100;
  if(numberOfResources >= defenderCost) {
    defenders.push(new Defender(gridPositionX, gridPositionY));
    numberOfResources -= defenderCost;
  };
});

const handleDefenders = () => {
  for (let i = 0; i < defenders.length; i++) {
    defenders[i].draw();
    defenders[i].update();
    if (enemiesPosition.indexOf(defenders[i].y !== -1)) {
      defenders[i].shooting = true;
    } else {
      defenders[i].shooting = false;
    };
    for (let j = 0; j < enemies.length; j ++) {
      if (defenders[i] && collision(defenders[i], enemies[j])) {
        enemies[j].movement = 0;
        defenders[i].health -= 1;
      };
      if (defenders[i] && defenders[i].health <= 0) {
        defenders.splice(i, 1);
        i--;
        enemies[j].movement = enemies[j].speed;
      };
    };
  };
};

// enemies
class Enemy {
  constructor(verticalPosition) {
    this.x = canvas.width;
    this.y = verticalPosition;
    this.width = cellSize;
    this.height = cellSize;
    this.speed = Math.random() * 0.2 + 0.4;
    this.movement = this.speed;
    this.health = 100;
    this.maxHealth = this.health;
  }
  update() {
    this.x -= this.movement;
  };
  draw() {
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px Orbitron';
    ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 25);
  };
};

const handleEnemies = () => {
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].update();
    enemies[i].draw();
    if (enemies[i].x < 0) {
      gameOver = true;
    };
    if (enemies[i].health <= 0) {
      let gainedResources = enemies[i].maxHealth/10;
      numberOfResources += gainedResources;
      score += gainedResources;
      const enemyIndex = enemiesPosition.indexOf(enemies[i].y);
      enemiesPosition.splice(enemyIndex, 1);
      enemies.splice(i, 1);
      i--;
    };
  };
  if(frame % enemiesInterval === 0) {
    let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize;
    enemies.push(new Enemy(verticalPosition));
    enemiesPosition.push(verticalPosition);
    if(enemiesInterval > 120) enemiesInterval -= 50;
  };
};

// resources

// utilities
const handleGameStatus = () => {
  ctx.fillStyle = 'white';
  ctx.font = '30px Orbitron';
  ctx.fillText('Score: ' + score, 20, 40);
  ctx.fillText('Resources: ' + numberOfResources, 20, 80);
  if (gameOver) {
    ctx.fillStyle = 'black';
    ctx.font = '90px Orbitron';
    ctx.fillText('GAME OVER', 135, 330);
  };
};

const animate = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
  handleGameGrid();
  handleDefenders();
  handleEnemies();
  hadleProjectiles();
  handleGameStatus();
  frame++;
  if (!gameOver) requestAnimationFrame(animate);
};

animate();