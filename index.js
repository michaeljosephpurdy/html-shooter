function newEntity() {
  return {
    type: 'enemy',
    x: 0,
    dx: 0,
    width: 10,
    y: 0,
    dy: 0,
    height: 10,
    speed: 3,
  };
}

function newPlayer() {
  const player = newEntity();
  player.type = 'player';
  player.color = 'blue';
  return player;
}

function randomEnemy() {
  const enemy = newEntity();
  enemy.type = 'enemy';
  enemy.color = 'red';
  enemy.x = (Math.random() * (200 - enemy.width)) + 100;
  enemy.y = Math.random() * (100 - enemy.height);
  return enemy;
}

function closeTo(e1, e2) {
  const xDistance = Math.abs(e1.x - e2.x);
  const yDistance = Math.abs(e1.y - e2.y);
  return (xDistance <= 10 && yDistance <= 10);
}

function collide(e1, e2) {
  const insideX = (e1.x + e1.width >= e2.x) && (e1.x <= e2.x + e2.width);
  const insideY = (e1.y + e1.height >= e2.y) && (e1.y <= e2.y + e2.height);
  return (insideX && insideY);
}

function quadrant(e1, e2) {
  const leftOf = e1.x < e2.x;
  const rightOf = e1.x > e2.x;
  const above = e1.y < e2.y;
  const below = e1.y > e2.y;
  if (rightOf && above) {
    return 1;
  } else if (leftOf && above) {
    return 2;
  } else if (leftOf && below) {
    return 3;
  } else if (rightOf && below) {
    return 4;
  }
}

function lerp(e1, e2) {
  const quad = quadrant(e1, e2);
  if (quad === 1) {
    const adjacent = e2.x - e1.x;
    const opposite = e2.y - e1.y;
    const angle = Math.tan(opposite / adjacent);
    return { lerpDx: -Math.cos(angle), lerpDy: -Math.sin(angle) };
  } else if (quad === 2 ) {
    const adjacent = e1.x - e2.x;
    const opposite = e2.y - e1.y;
    const angle = Math.tan(opposite / adjacent);
    return { lerpDx: Math.cos(angle), lerpDy: -Math.sin(angle) };
  } else if (quad === 3 ) {
    const adjacent = e1.x - e2.x;
    const opposite = e1.y - e2.y;
    const angle = Math.tan(opposite / adjacent);
    return { lerpDx: Math.cos(angle), lerpDy: Math.sin(angle) };
  } else {
    const adjacent = e2.x - e1.x;
    const opposite = e1.y - e2.y;
    const angle = Math.tan(opposite / adjacent);
    return { lerpDx: -Math.cos(angle), lerpDy: Math.sin(angle) };
  }
}

class Game {
  context;
  canvas;

  screenWidth = 500;
  screenHeight = 100;
  fps = 1000 / 60;
  intervalId;

  player;
  anEnemy = randomEnemy();

  entities = [];

  constructor() {
    this.player = newPlayer();
    this.entities.push(this.player);
    this.entities.push(this.anEnemy);
    this.entities.push(randomEnemy());
    this.entities.push(randomEnemy());
    this.entities.push(randomEnemy());
    this.entities.push(randomEnemy());
    this.entities.push(randomEnemy());
    this.entities.push(randomEnemy());
    this.entities.push(randomEnemy());
    this.canvas = document.getElementById('canvas');
    this.canvas.focus();
    this.context = this.canvas.getContext('2d');
    document.addEventListener('keyup', (event) => {
      this.onKeyupHandler(event);
    })
    document.addEventListener('keydown', (event) => {
      this.onKeydownHandler(event);
    })
  }

  run() {
      this.context.fillStyle = 'lightgrey';
      this.context.fillRect(0, 0, this.screenWidth, this.screenHeight);
      this.context.moveTo(0, 0);
      this.entities.forEach(ent => this.updateEntity(ent));
      this.keepEntityInBounds(this.player);
      this.entities.forEach(ent => this.drawEntity(ent));
      this.context.stroke();
  }

  maybeShoot(entity) {
    if (entity.type === 'enemy') {
      if (Math.random() < 0.002) {
        const { lerpDx, lerpDy } = lerp(entity, this.player);
        this.entities.push({
          x: entity.x,
          y: entity.y + (entity.height / 2),
          color: 'purple',
          dx: lerpDx,
          dy: lerpDy,
          speed: 5,
          height: 3,
          width: 4,
          type: 'weapon',
          owner: 'enemy',
        });
      }
    }
  }

  updateEntity(entity) {
    entity.x = entity.x + (entity.dx * entity.speed);
    entity.y = entity.y + (entity.dy * entity.speed);
    this.maybeShoot(entity);
    if (entity.type === 'weapon') {
      if (entity.x + entity.width > this.screenWidth) {
        this.entities = this.entities.filter(ent => ent !== entity);
        return;
      }
      this.entities
        .filter(ent => ent.type === 'enemy' && ent.type !== entity.owner)
        .filter(ent => closeTo(entity, ent))
        .filter(ent => collide(entity, ent))
        .map(entToDelete => {
          this.entities = this.entities
            .filter(ent => entToDelete !== ent)
            .filter(ent => ent !== entity);
        });
    }
  }

  drawEntity(entity) {
    const fillStyle = (entity.color) ? entity.color : '#FF0000';
    this.context.fillStyle = fillStyle;
    if (!entity.path) {
      this.context.fillRect(entity.x, entity.y, entity.width, entity.height);
    } else {
      this.context.fill(entity.path);
    }
    this.context.stroke();
  }

  keepEntityInBounds(entity) {
    if (entity.y < 0) { entity.y = 0; }
    if (entity.y > this.screenHeight - entity.height) { entity.y = this.screenHeight - entity.height; }
    if (entity.x < 0) { entity.x = 0; }
    if (entity.x > this.screenWidth - entity.width) { entity.x = this.screenWidth - entity.width; }
  }

  onKeyupHandler(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      this.player.dy = 0;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      this.player.dx = 0;
    }
    if (event.key === ' ') {
      this.entities.push({
        x: this.player.x,
        y: this.player.y + (this.player.height / 2),
        color: 'green',
        dx: 1,
        dy: 0,
        speed: 5,
        height: 3,
        width: 4,
        type: 'weapon',
      });
    }
  }

  onKeydownHandler(event) {
    if (event.key === 'ArrowUp') {
      this.player.dy = -1;
    } else if (event.key === 'ArrowDown') {
      this.player.dy = 1;
    }

    if (event.key === 'ArrowRight') {
      this.player.dx = 1;
    } else if (event.key === 'ArrowLeft') {
      this.player.dx = -1;
    }
  }
}

const game = new Game();
setInterval(() => {
  game.run();
}, 1_000/60);
