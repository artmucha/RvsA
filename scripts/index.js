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
let numberOfResources = 300;
let frame = 0;
let enemiesInterval = 600;
let gameOver = false;

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
          first.y > second.y + second.height ||
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

// defenders
class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
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
};

canvas.addEventListener('click', () => {
  const gridPositionX = mouse.x - (mouse.x % cellSize);
  const gridPositionY = mouse.y - (mouse.y % cellSize);
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
    for (let j = 0; j < enemies.length; j ++) {
      if (collision(defenders[i], enemies[j])) {
        enemies[j].movement = 0;
        defenders[i].health -= 0.2;
      }
      if (defenders[i] && defenders[i].health <= 0) {
        defenders.splice(i, 1);
        i--;
        enemies[j].movement = enemies[j].speed;
      }
    }
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
  }
  draw() {
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px Orbitron';
    ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 25);
  }
}

const handleEnemies = () => {
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].update();
    enemies[i].draw();
    if (enemies[i].x < 0) {
      gameOver = true;
    }
  };
  if(frame % enemiesInterval === 0) {
    let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize;
    enemies.push(new Enemy(verticalPosition));
    enemiesPosition.push(verticalPosition);
    if(enemiesInterval > 120) enemiesInterval -= 50;
  }
};

// resources

// utilities
const handleGameStatus = () => {
  ctx.fillStyle = 'white';
  ctx.font = '30px Orbitron';
  ctx.fillText('Resources: ' + numberOfResources, 20, 50);
  if (gameOver) {
    ctx.fillStyle = 'black';
    ctx.font = '90px Orbitron';
    ctx.fillText('GAME OVER', 135, 330);
  }
};

const animate = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
  handleGameGrid();
  handleDefenders();
  handleEnemies();
  handleGameStatus();
  frame++;
  if (!gameOver) requestAnimationFrame(animate);
};

animate();