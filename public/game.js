var width = 800;
var height = 600;
var renderer = Phaser.AUTO;
var parent = '';
var state = { preload: preload, create: create, update: update };
var transparent = false;

var game = new Phaser.Game(width, height, renderer, parent, state, transparent);

var socket = io();

var player;
var speed = 1;
var keys;
var keyW;
var keyA;
var keyS;
var keyD;

var roomName;
var gameState = 'CONNECTING';
var gameStateText;

function preload() {
   game.load.image('guy', 'guy.png');
   game.load.image('gameStart', 'gameStart.png');
   game.load.image('rock', 'rock.png');
   game.load.image('paper', 'paper.png');
   game.load.image('scissors', 'scissors.png');
}

function create() {
   player = game.add.sprite(0, 0, 'guy');
   var style = { font: "bold 32px Arial", fill: "#fff" };
   gameStateText = game.add.text(400, 300, gameState, style);
   roomName = 'asdf';


   keys = game.input.keyboard;
   keyW = keys.addKey(Phaser.KeyCode.W);
   keyA = keys.addKey(Phaser.KeyCode.A);
   keyS = keys.addKey(Phaser.KeyCode.S);
   keyD = keys.addKey(Phaser.KeyCode.D);

   socket.emit('room', roomName);
   socket.on('msg', function(msg) {
      console.log(msg);
   });
   socket.on('disconnect', function(error) {
      console.log(error);
   });
   socket.on('roomReady', function() {
      startFight( () => {
         getMovesFromUser( moves => {
            console.log(moves);
            socket.emit('moves', {room: roomName, moves: moves});
            // send the moves to the server
         });
      });
   });
}

function update() {
   if (keyA.isDown) {
      player.x -= speed;
   }
   if (keyD.isDown) {
      player.x += speed;
   }
   if (keyW.isDown) {
      player.y -= speed;
   }
   if (keyS.isDown) {
      player.y += speed;
   }
}

function startFight(cb) {
   // create actors ready to fight
   // game.add.sprite(0, 0, 'gameStart');
   cb();
}

function getMovesFromUser(cb) {
   gameStateText.text = "WAITING FOR MOVES"
   // present available moves
   var rockButton = game.add.sprite(0, 400, 'rock');
   var paperButton = game.add.sprite(50, 400, 'paper');
   var scissorButton = game.add.sprite(100, 400, 'scissors');
   var buttonList = [rockButton, paperButton, scissorButton];
   function addShit(button) {
      button.inputEnabled = true;
      // Send the move and then get rid of everything
      button.events.onInputDown.add( () => {
         cb(button.key);
         for (let but in buttonList) {
            buttonList[but].destroy();
         }
      }, this);
   }
   addShit(rockButton);
   addShit(paperButton);
   addShit(scissorButton);
}
