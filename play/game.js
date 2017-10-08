var gameWidth = window.innerWidth;
var gameHeight = window.innerHeight - document.querySelector('header').offsetHeight;

console.log('hello')

for (var species in SpeciesAll) {
  SpeciesAll[species].key = species;
}

var game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, 'content');

var gameState = {
  human: null,
  traps: null,
  hunterLocs: null,
  species: Object.values(SpeciesAll), // create array based on level
  addTrap: function(special = false) {
    var img = game.cache.getImage('pit');
    var x = getRandomInt(0 + img.width, gameWidth - img.width);
    var y = getRandomInt(0 + img.height, gameHeight - img.height);
    var trap = new Animal(x, y, special ? SpeciesAll.rhino : this.species[getRandomInt(0, this.species.length - 1)]);
    trap.special = special;
    var collided = trap.overlap(this.traps);
    if (collided) {
      trap.health.kill(); 
      trap.destroy();
    } else {
      console.log('add', trap.key)
      this.traps.add(trap);
    }
  },
  score: {
    score: 0,
    saves: 0,
    killed: 0,
  },
  stats: null,
  updateStats: function () {
    this.stats.text = `Score: ${this.score.score}\tSaves: ${this.score.saves}\tLost: ${this.score.killed}`;
  },
  preload: function(){
    var self = this;
    this.game.load.spritesheet('human','images/human.png',64,64);
    this.game.load.spritesheet('hunter','images/hunter.png',200,200);
    this.game.load.image('grass','images/grass2.jpg');
    this.load.image('tree1','images/tree1.png');
    this.load.image('tree2','images/tree2.png');
    this.load.image('tree3','images/tree3.png');
    this.load.image('tree4','images/tree4.png');
    this.load.image('wood1','images/wood1.png');
    this.load.image('wood2','images/wood2.png');
    this.load.image('water','images/water.png');
    this.load.image('pit','images/pit.png');
    for (var species of self.species) {
      this.load.image(species.key, 'images/species/' + species.image);
    }

  },

  create: function(){
    var self = this;
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.add.tileSprite(0, 0, gameWidth, gameHeight, 'grass');
    self.human = new Human(100,100, 'human');

    self.humanReached = function(trap) {
      return self.human.overlap(trap);
    };
    self.hunterReached = function(trap) {
      return self.hunter.overlap(trap);
    };

    // set trees and stuff
    new Environment(self);

    // traps
    self.traps = game.add.group();

    // addTrap();
    // var hunterPos = self.traps.getRandom();
    // self.hunter = new Human(hunterPos.x,hunterPos.y, 'hunter');
    // self.hunter.onway = false;
    // self.hunter.scale.setTo(0.5);


    game.time.events.repeat(Phaser.Timer.SECOND * 0.1, 3, self.addTrap, self);
    game.time.events.loop(Phaser.Timer.SECOND * 2, self.addTrap, self);

    // stats
    var bar = game.add.graphics();
    bar.beginFill(0x000000, 0.2);
    bar.drawRect(0, 0, gameWidth, 60);
    var style = { font: "24px cursive", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    self.stats = game.add.text(0, 0, '', style);
    self.stats.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
    self.stats.setTextBounds(0, 0, gameWidth, 60);
    self.updateStats();

    game.input.activePointer.capture = true;

  },

  update: function(){
    var self = this;

    // move player
    if (game.input.activePointer.isDown) {
      var xd = game.input.x - game.world.worldPosition.x;
      var yd = game.input.y - game.world.worldPosition.y

      var xDiff = xd - self.human.xDest;
      var yDiff = yd - self.human.yDest;

      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) self.human.animations.play("right");
        else if (xDiff < 0) self.human.animations.play("left");
      } else {
        if (yDiff > 0) self.human.animations.play("down");
        else if (yDiff < 0) self.human.animations.play("up");
      }

      self.human.setDest(xd, yd);
      self.human.update();
    }


    if (self.score.saves > 3 && self.score.saves % 10 === 0) {
      self.addTrap(true);
    }
    // if (!self.hunter.onway) {
    //   var target = self.traps.getRandom();
    //   console.log(target)
    //   self.hunter.setDest(target.position.x, target.position.y);
    //   self.hunter.update();
    //   self.hunter.onway = true;
    // } else {
    //   self.hunter.update();
    // }

    var hitPlatform = game.physics.arcade.collide(self.human, self.traps);
    if (hitPlatform) console.log(hitPlatform)

    self.traps.forEach(function (trap) {
      trap.lifeLeft -= trap.lifeDecrement;
      trap.health.setPercent(trap.lifeLeft*100/trap.life)
    });
    var deadTraps = self.traps.filter(function(child) {
      return child.lifeLeft < 0;
    }, true).list;
    for (var i = 0; i < deadTraps.length; i++) {
      var trap = deadTraps[i];
      self.traps.remove(trap);
      trap.health.kill();
      trap.destroy();
      self.score.killed += 1;
      self.updateStats();
    }

    // rescue
    var humanReachedTraps = self.traps.filter(self.humanReached);
    if (humanReachedTraps.list.length > 0) {
      var trap = humanReachedTraps.list[0];
      self.score.score += parseInt(trap.score - trap.score*trap.lifeLeft/trap.life);
      self.score.saves += 1;

      if (trap.special) {
        console.log('huhuhu');
        document.getElementById('gameover').classList.add('active');
      }

      self.traps.remove(trap);
      trap.health.kill();
      trap.destroy();
      self.updateStats();
    }

    // kill :(
    // var hunterReachedTrap = self.traps.filter(self.hunterReached);
    // if (hunterReachedTrap.list.length > 0) {
    //   var trap = hunterReachedTrap.list[0];
    //   self.score.killed += 1;
    //   self.traps.remove(trap);
    //   trap.health.kill();
    //   trap.destroy();
    //   self.updateStats();
    // }
  },
};

function Human(x,y, type){
  var human = game.add.sprite(x, y, type);

  human.xDest = x;
  human.yDest = y;
  human.anchor.setTo(0.5);
  human.speed = 100;

  human.setDest = function(x, y) {
    human.xDest = x;
    human.yDest = y;
  }

  human.update = function() {
    move(human);
  }

  game.physics.enable(human, Phaser.Physics.ARCADE);
  human.animations.add('up', [0, 1, 2, 3, 4, 5, 6, 7, 8], 9, true);
  human.animations.add('left', [10, 11, 12, 13, 14, 15, 16, 17], 9, true);
  human.animations.add('down', [19, 20, 21, 22, 23, 24, 25, 26], 9, true);
  human.animations.add('right', [28, 29, 30, 31, 32, 33, 34, 35], 9, true);

  return human;
}

function Environment(self) {
  self.hunterLocs = game.add.group();
  var obstaclesList = ['tree1', 'tree2', 'tree3', 'tree4', 'wood1', 'wood2', 'water']
  var Obstacle = function(x, y) {
    var picked = obstaclesList[getRandomInt(0, obstaclesList.length - 1)];
    var obstacle = game.add.sprite(x, y, picked);
    obstacle.scale.setTo(0.5)
    return obstacle;
  }
  var create = function() {
    var x = getRandomInt(0 + 20, gameWidth - 40);
    var y = getRandomInt(0 + 20, gameHeight - 50);
    var obstacle = new Obstacle(x, y);
    self.hunterLocs.add(obstacle);
  }

  var obstacleCount = getRandomInt(4, 9);
  game.time.events.repeat(Phaser.Timer.SECOND * 0.01, obstacleCount, create, self);
}


// trapped animal
function Animal(x, y, species) {
  var animal = game.add.sprite(x, y, species.key);
  var life = 10*getRandomInt(60, species.life);
  var barConfig = {x: x + 25, y: y - 5, width: Math.min(50, 0.5*animal.width), height: 5};
  animal.width = animal.height = 50;
  animal.x = x;
  animal.y = y;
  animal.life = life;
  animal.lifeLeft = life;
  animal.score = species.score;
  animal.lifeDecrement = species.decrement;

  animal.health = new HealthBar(game, barConfig);

  return animal;
}


game.state.add('gameState',gameState);
game.state.start('gameState');


function move(self) {
  if (Math.floor(self.x / 10) == Math.floor(self.xDest / 10)) {
    self.body.velocity.x = 0;
  }
  if (Math.floor(self.x) < Math.floor(self.xDest)) {
    self.body.velocity.x = self.speed;
  } else if (Math.floor(self.x) > Math.floor(self.xDest)) {
    self.body.velocity.x = -self.speed;
  }

  if (Math.floor(self.x / 10) == Math.floor(self.xDest / 10) && Math.floor(self.y / 10) === Math.floor(self.yDest / 10))
    self.animations.stop();

  if (Math.floor(self.y / 10) === Math.floor(self.yDest / 10)) {
    self.body.velocity.y = 0;
  }
  if (Math.floor(self.y) < Math.floor(self.yDest)) {
    self.body.velocity.y = self.speed;
  } else if (Math.floor(self.y) > Math.floor(self.yDest)) {
    self.body.velocity.y = -self.speed;
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}