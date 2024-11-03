const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 4000;
const { v4: uuidv4 } = require('uuid');
const { ExpressPeerServer } = require('peer');

const peer = ExpressPeerServer(server, {
  debug: true
});

app.use('/peerjs', peer);
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect(`/${uuidv4()}`); // Redirect to a new room
});

app.get('/:room', (req, res) => {
  res.render('index', { RoomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("newUser", (id, room) => {
    socket.join(room);
    socket.broadcast.to(room).emit("userJoined", id);
    
    // Notify other users of the current user count
    const userList = Array.from(io.sockets.adapter.rooms.get(room) || []);
    socket.broadcast.to(room).emit("updateUserCount", userList);

    socket.on("disconnect", () => {
      socket.broadcast.to(room).emit("userDisconnect", id);
      const userList = Array.from(io.sockets.adapter.rooms.get(room) || []);
      socket.broadcast.to(room).emit("updateUserCount", userList);
    });
  });
});

server.listen(port, () => {
  console.log("Server running on port: " + port);
});
