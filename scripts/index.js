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
const resources = [];
const amounts = [20, 30, 40];
const floatingMessages = [];
let chosenDefender = 1;
let numberOfResources = 300;
let frame = 0;
let enemiesInterval = 600;
let gameOver = false;
let score = 0;
let winningScore = 50;

// mouse
const mouse = {
  x: 10,
  y: 10,
  width: 0.1,
  height: 0.1,
  clicked: false,
};

canvas.addEventListener('mousedown', () => {
  mouse.clicked = true;
});

canvas.addEventListener('mouseup', () => {
  mouse.clicked = false;
});

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
    this.height = 10;
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
const defender1 = new Image();
defender1.src = './assets/hero_1.png';
const defender2 = new Image();
defender2.src = './assets/hero_2.png';

// defenders
class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;;
    this.shooting = false;
    this.shootNow = false;
    this.health = 100;
    this.projectiles = [];
    this.timer = 0;
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    this.maxFrame = 16;
    this.spriteWidth = 194;
    this.spriteHeight = 194;
    this.chosenDefender = chosenDefender;
  };
  draw() {
    // ctx.fillStyle = 'blue';
    // ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px Orbitron';
    ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 25);
    if (this.chosenDefender === 1) {
      ctx.drawImage(defender1, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    } else if (this.chosenDefender === 2) {
      ctx.drawImage(defender2, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    };
  };
  update() {
    if (frame % 10 === 0) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = this.minFrame;
      if(this.frameX === 15) this.shootNow = true;
    };

    if (chosenDefender === 1) {
      if (this.shooting) {
        this.minFrame = 0;
        this.maxFrame = 16;
      } else {
        this.minFrame = 17;
        this.maxFrame = 23;
      }
    } else if (chosenDefender === 2) {
      if (this.shooting) {
        this.minFrame = 13;
        this.maxFrame = 28;
      } else {
        this.minFrame = 0;
        this.maxFrame = 12;
      }
    };

    if (this.shooting && this.shootNow) {
      projectiles.push(new Projectile(this.x + 70, this.y + 35));
      this.shootNow = false;
    };
  };
};

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

const card1 = {
  x: 10,
  y: 10,
  width: 70,
  height: 85,
  stroke: 'black',
};

const card2 = {
  x: 90,
  y: 10,
  width: 70,
  height: 85,
  stroke: 'black',
};

const chooseDefender = () => {

  if (collision(mouse, card1) && mouse.clicked) {
    chosenDefender = 1;
  } else if (collision(mouse, card2) && mouse.clicked) {
    chosenDefender = 2;
  }

  if (chosenDefender === 1) {
    card1.stroke = 'gold';
    card2.stroke = 'black';
  } else if (chosenDefender === 2) {
    card1.stroke = 'black';
    card2.stroke = 'gold';
  } else {
    card1.stroke = 'black';
    card2.stroke = 'black';
  }

  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(card1.x, card1.y, card1.width, card1.height);
  ctx.strokeStyle = card1.stroke;
  ctx.strokeRect(card1.x, card1.y, card1.width, card1.height);
  ctx.drawImage(defender1, 0, 0, 194, 194, 0, 5, 194/2, 194/2);
  ctx.fillRect(card2.x, card2.y, card2.width, card2.height);
  ctx.strokeStyle = card2.stroke;
  ctx.strokeRect(card2.x, card2.y, card2.width, card2.height);
  ctx.drawImage(defender2, 0, 0, 194, 194, 80, 5, 194/2, 194/2);
};

// floating messages
class FloatingMessage {
  constructor(value, x, y, size, color) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.lifeSpan = 0;
    this.opacity = 1;
  };
  update() {
    this.y -= 0.3;
    this.lifeSpan += 1;
    if (this.opacity > 0.03) this.opacity -= 0.03;
  };
  draw() {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.font = this.size + 'px Orbitron';
    ctx.fillText(this.value, this.x, this.y);
    ctx.globalAlpha = 1;
  };
};

const handleFloatingMessages = () => {
  for (let i = 0; i < floatingMessages.length; i++) {
    floatingMessages[i].update();
    floatingMessages[i].draw();
    if (floatingMessages[i].lifeSpan >= 50) {
      floatingMessages.splice(i, 1);
      i--;
    };
  };
};

// enemies
const enemyTypes = [];
const enemy1 = new Image();
enemy1.src = './assets/alien_1.png';
enemyTypes.push(enemy1);
const enemy2 = new Image();
enemy2.src = './assets/alien_2.png';
enemyTypes.push(enemy2);

class Enemy {
  constructor(verticalPosition) {
    this.x = canvas.width;
    this.y = verticalPosition;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.speed = Math.random() * 0.2 + 0.4;
    this.movement = this.speed;
    this.health = 100;
    this.maxHealth = this.health;
    this.enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    if (this.enemyType === enemy1) {
      this.maxFrame = 4;
      this.spriteWidth = 160;
      this.spriteHeight = 160;
    } else if (this.enemyType === enemy2) {
      this.maxFrame = 7;
      this.spriteWidth = 256;
      this.spriteHeight = 256;
    }
  }
  update() {
    this.x -= this.movement;
    if(frame % 10 === 0) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = this.minFrame;
    };
  };
  draw() {
    // ctx.fillStyle = 'red';
    // ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px Orbitron';
    ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 25);
    ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height)
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
      floatingMessages.push(new FloatingMessage('+' + gainedResources, enemies[i].x, enemies[i].y, 30, 'black'));
      floatingMessages.push(new FloatingMessage('+' + gainedResources,  470, 85, 30, 'gold'));
      numberOfResources += gainedResources;
      score += gainedResources;
      const enemyIndex = enemiesPosition.indexOf(enemies[i].y);
      enemiesPosition.splice(enemyIndex, 1);
      enemies.splice(i, 1);
      i--;
    };
  };
  if(frame % enemiesInterval === 0 && score < winningScore) {
    let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
    enemies.push(new Enemy(verticalPosition));
    enemiesPosition.push(verticalPosition);
    if(enemiesInterval > 120) enemiesInterval -= 50;
  };
};

// resources
class Resource {
  constructor() {
    this.x = Math.random() * (canvas.width - cellSize);
    this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
    this.width = cellSize * 0.6;
    this.height = cellSize * 0.6;
    this.amount = amounts[Math.floor(Math.random() * amounts.length )];
  };
  draw() {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px Orbitron';
    ctx.fillText(this.amount, this.x + 15, this. y + 25);
  };
};

const handleResources = () => {
  if (frame % 500 === 0 && score < winningScore) {
    resources.push(new Resource());
  };

  for (let i = 0; i < resources.length; i++) {
    resources[i].draw();
    if(resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)) {
      numberOfResources += resources[i].amount;
      floatingMessages.push(new FloatingMessage('+' + resources[i].amount, resources[i].x, resources[i].y, 30, 'black'));
      floatingMessages.push(new FloatingMessage('+' + resources[i].amount, 470, 90, 30, 'gold'));
      resources.splice(i, 1);
      i--;
    };
  };
};

// utilities
const handleGameStatus = () => {
  ctx.fillStyle = 'white';
  ctx.font = '30px Orbitron';
  ctx.fillText('Score: ' + score, 180, 40);
  ctx.fillText('Resources: ' + numberOfResources, 180, 80);
  if (gameOver) {
    ctx.fillStyle = 'black';
    ctx.font = '90px Orbitron';
    ctx.fillText('GAME OVER', 135, 330);
  };
  if (score >= winningScore && enemies.length === 0) {
    ctx.fillStyle = 'black';
    ctx.font = '60px Orbitron';
    ctx.fillText('LEVEL COMPLETE', 130, 300);
    ctx.font = '30px Orbitron';
    ctx.fillText('You win with ' + score + ' points!', 134, 340);
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
  handleResources();
  chooseDefender();
  handleGameStatus();
  handleFloatingMessages();
  frame++;
  if (!gameOver) requestAnimationFrame(animate);
};

animate();

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
  } else {
    floatingMessages.push(new FloatingMessage('Need more recources', mouse.x, mouse.y, 20, 'blue'));
  }
});

window.addEventListener('resize', () => {
  canvasPosition = canvas.getBoundingClientRect();
});