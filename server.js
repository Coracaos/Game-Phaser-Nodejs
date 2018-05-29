var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io").listen(server);

var players = {};
var bullets = [];

app.use(express.static(__dirname + "/static"));

app.get("/", function(req, res){
	res.sendFile(__dirname + "/index.html");			
});

io.on("connection", function(socket){

	console.log("nuevo usuario conectado");

	//cuando se conecte un usuario creamos un jugador
	players[socket.id] = {
		rotation: 0,		
		x: Math.floor(Math.random() * 700) + 50,
		y: Math.floor(Math.random() * 500) + 50,
		playerId: socket.id,
		health: 3
	};

	//enviar todos los jugadores al cliente
	socket.emit("currentPlayers", players);

	//enviar a los demas jugadores mis datos de jugador 
	socket.broadcast.emit("newPlayer", players[socket.id]);

	//usuario desconectado
	socket.on("disconnect", function(){

		console.log("Un usuario se desconecto");
		//removemos el jugador de players
		delete players[socket.id];
		//emitimos a todos el id del jugador que se desconecto
		io.emit("disconnect", socket.id);
	});


	socket.on("playerMovement", function(movementData){

		players[socket.id].x = movementData.x;
		players[socket.id].y = movementData.y;
		players[socket.id].rotation = movementData.rotation;
		
		socket.broadcast.emit("playerMoved", players[socket.id]);
	});

	socket.on("shootBullet", function(bulletInfo){

		if(players[socket.id]){

			bulletInfo.ownerId = socket.id;	
			bullets.push(bulletInfo);
		}	
	});

});

setInterval(function(){
	updateBullets();
	io.emit("bulletsUpdate", bullets);
}, 16)

server.listen(8080, function(){

	console.log("servidor corriendo en el puerto 8080");
});


function updateBullets(){
	
	bullets.forEach(function(bullet, i){

		bullet.x += bullet.speed_x;	
		bullet.y += bullet.speed_y;
		
		for( id in players){
			if(bullet.ownerId != id  && Math.abs(players[id].x - bullet.x) < 21 && Math.abs(players[id].y - bullet.y) < 21){
				bullets.splice(i,1);	
			}
		}

		if(bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600){
			bullets.splice(i,1);	
		}
		
	});

}

























