var game = new Phaser.Game(800, 600, Phaser.AUTO, "phaser-example", {preload: preload, create: create, update: update, render: render});

var socket;
var ship;
var otherPlayers;
var cursors;
var speed = 0;
var bullets = [];
var bulletsTime = 0;
var spaceBar;


//todos los recursos que vamos usar (imagenes)
function preload(){
	this.load.image("ship", "assets/ship_blue.png");
	this.load.image("bullet", "assets/bullet.png");
}

//creacion de objetos y conexiones con sockets al servidor
function create(){

	game.physics.startSystem(Phaser.Physics.ARCADE);
				
  socket = io.connect();
		
	otherPlayers = game.add.group();
	otherPlayers.enableBody = true;
	otherPlayers.physicsBodyType = Phaser.Physics.ARCADE;


  socket.on('currentPlayers', function (players) {

    Object.keys(players).forEach(function (id) {

      if (id === socket.id) {

        addPlayer(players[id]);

      }else{

				addOtherPlayers(players[id]);	
			}
    });
  });

	socket.on("newPlayer", function(playerInfo){

		addOtherPlayers(playerInfo);	
	});

	socket.on("disconnect", function(playerId){

		otherPlayers.forEach(function(otherPlayer){
			if(playerId === otherPlayer.playerId){
				otherPlayer.destroy();
			}
		});
	});

	cursors = game.input.keyboard.createCursorKeys();
	
	spaceBar = game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

	game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);

	socket.on("playerMoved", function(playerInfo){

		otherPlayers.forEach(function(otherPlayer){

			if (playerInfo.playerId === otherPlayer.playerId){
				
				otherPlayer.rotation = playerInfo.rotation;
				otherPlayer.position.x = playerInfo.x;
				otherPlayer.position.y = playerInfo.y;
			}
		});
	});

	socket.on("bulletsUpdate", function(bulletsInfo){
		
		for(var i=0; i<bulletsInfo.length; i++){
			
			var bullet = bulletsInfo[i];

			if(bullets[i] === undefined){

				bullets[i] = game.add.sprite(bullet.x, bullet.y, "bullet");	
				bullets[i].rotation = bullet.rotation;

			}else{

				bullets[i].x = bullet.x;	
        bullets[i].y = bullet.y;
			}
		}

		for(var i = bulletsInfo.length; i<bullets.length; i++){
				
				bullets[i].destroy();
				bullets.splice(i,1);
				i--;
		}
		
	});
}

function update(){

	if (ship) {
 
		if (cursors.left.isDown){

			ship.body.angularVelocity = -300;	

		}	else if (cursors.right.isDown){

			ship.body.angularVelocity = 300;

		} else {

			ship.body.angularVelocity = 0;

		}
		
		if(cursors.up.isDown){
			
			game.physics.arcade.accelerationFromRotation(ship.rotation, 200, ship.body.acceleration);

		} else {
			
			ship.body.acceleration.set(0);

		} 

		if(spaceBar.isDown && !ship.shoot){
				
			var speed_x = Math.cos(ship.rotation) * 20;
			var speed_y = Math.sin(ship.rotation) * 20;

			ship.shoot = true;

			socket.emit("shootBullet", {x: ship.x, y: ship.y, rotation: ship.rotation, speed_x: speed_x, speed_y: speed_y});
		}

		if(!spaceBar.isDown) ship.shoot = false;
		
		game.world.wrap(ship, 5);

		var x = ship.x;
		var y = ship.y;
		var r = ship.rotation;

		if (ship.oldPosition && (x !== ship.oldPosition.x || y !== ship.oldPosition.y || r !== ship.oldPosition.rotation)){

			socket.emit("playerMovement", {x: ship.x, y: ship.y, rotation: ship.rotation});	
		}
			
		ship.oldPosition = {

			x: ship.x,
			y: ship.y,
			rotation: ship.rotation
		};	

	}
}

function render(){

}

function addPlayer(playerInfo) {

  ship = game.add.sprite(playerInfo.x, playerInfo.y, "ship");
		
	game.physics.enable(ship, Phaser.Physics.ARCADE);

	ship.anchor.set(0.5);
	ship.scale.setTo(0.5, 0.5);
  ship.body.drag.set(100);
  ship.body.maxVelocity.set(200);

}

function addOtherPlayers(playerInfo) {

  var otherPlayer = game.add.sprite(playerInfo.x, playerInfo.y, "ship")

	game.physics.enable(otherPlayer, Phaser.Physics.ARCADE);
	
	otherPlayer.anchor.set(0.5);
	otherPlayer.scale.setTo(0.5, 0.5);
	otherPlayer.playerId = playerInfo.playerId;
  otherPlayers.add(otherPlayer);
}

		
