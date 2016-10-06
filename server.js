"use strict";
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var LOG_LOOP = false;
const PLAYER_ONE_WIN = 'Player 1 wins';
const PLAYER_TWO_WIN = 'Player 2 wins';
const TIE            = 'Tie';

var roomDict = {};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/game.html');
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket){
  socket.on('room', function(room) {
     if (!roomDict[room]) {
        // TODO constructor for this
        roomDict[room] = {
           turnNumber : 0,
           players : [socket.id],
           turnData : []
        }
        socket.join(room);
     } else {
        roomDict[room].players.push(socket.id);
        socket.join(room);
        // Start the game :)
        io.to(room).emit('roomReady');
     }
  });
  socket.on('moves', function(moves) {
     // console.log(socket.rooms[moves.room]);
     let roomId = moves.room;
     let roomData = roomDict[roomId];
     let turnNum = roomData.turnNumber;
     if (!hasGottenDataThisTurn(roomData)) {
        // First move data  we got for this turn
        // TODO constructor for this
        roomData.turnData.push({poop: 'poop'});
        let turn = roomData.turnData[turnNum];
        turn[socket.id] = moves.moves
     } else {
        roomData.turnData[turnNum][socket.id] = moves.moves
        // We got both moves
        // Process and send results
        let turn = roomData.turnData[turnNum];
        let players = roomDict[roomId].players;
        let p1 = turn[players[0]];
        let p2 = turn[players[1]];
        let result = processTurn(p1, p2);
        if (result === PLAYER_ONE_WIN) {
           io.sockets.connected[players[0]].emit('result', 'win');
           io.sockets.connected[players[1]].emit('result', 'lose');
        } else if (result === PLAYER_TWO_WIN) {
           io.sockets.connected[players[0]].emit('result', 'lose');
           io.sockets.connected[players[1]].emit('result', 'win');
        } else if (result === TIE) {
           io.sockets.connected[players[0]].emit('result', 'tie');
           io.sockets.connected[players[1]].emit('result', 'tie');
        }
        roomData.turnNumber += 1;
     }
  });
  socket.on('disconnect', function() {
  });
});

http.listen(8000, function(){
  console.log('listening on *:8000');
});

/*
 * Looks at each players moves to decide what happens
 */
function processTurn(oneMoves, twoMoves) {
   if (oneMoves === twoMoves) {
      return TIE;
   } else if (oneMoves === 'scissors') {
      if (twoMoves === 'paper') {
         return PLAYER_ONE_WIN;
      } else return PLAYER_TWO_WIN;
   } else if (oneMoves === 'paper') {
      if (twoMoves === 'rock') {
         return PLAYER_ONE_WIN;
      } else return PLAYER_TWO_WIN;
   } else if (oneMoves === 'rock') {
      if (twoMoves === 'scissors') {
         return PLAYER_ONE_WIN;
      } else return PLAYER_TWO_WIN;
   }
}

function hasGottenDataThisTurn(roomData) {
   let turnNum = roomData.turnNumber;
   return roomData.turnData[turnNum];
}

function logLoop() {
   let connected = io.sockets.connected
   for (let id in connected) {
      if (connected.hasOwnProperty(id)) {
         console.log(id);
      }
   }
   setTimeout(logLoop, 5000);
}

if (LOG_LOOP) logLoop();
