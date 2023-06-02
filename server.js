const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./src/utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./src/utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

require("dotenv").config();

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "./public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New WebSocket connection");
  // console.log(socket);

  socket.on("join", (options, callback) => {
    var address = socket.handshake.address;
    const { error, user } = addUser({ id: socket.id, ...options, address });
    if (error) {
      return callback(error);
    } else {
      socket.join(user.room);

      socket.emit(
        "message",
        generateMessage("Admin", "Welcome!", "", "adminMsg")
      );
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          generateMessage("", `${user.username} has joined!`, "", "adminMsg")
        );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });

      callback();
    }
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    } else {
      io.to(user.room).emit(
        "message",
        generateMessage(user.username, message, user.address)
      );
      callback();
    }
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
  // socket.on("upload", (file, callback) => {
  //   console.log(file); // <Buffer 25 50 44 ...>

  //   // save the content to the disk, for example
  //   fs.writeFile("./src/tmp/upload.docx", file, (err) => {
  //     callback({ message: err ? "failure" : "success" });
  //   });
  // });

  socket.on("base64 file", function (msg) {
    console.log("received base64 file from" + msg.username);
    const user = getUser(socket.id);
    socket.username = msg.username;
    // socket.broadcast.emit('base64 image', //exclude sender
    io.to(user.room).emit(
      "base64 file", //include sender
      {
        username: socket.username,
        file: msg.file,
        fileName: msg.fileName,
      }
    );
  });
});

var os = require("os");
const e = require("express");

var networkInterfaces = os.networkInterfaces();

const localIPv4Address = networkInterfaces["Wi-Fi"]?.find((ip) => {
  if (ip.family === "IPv4") {
    return ip;
  }
});

if (localIPv4Address) {
  server.listen(
    port,
    localIPv4Address.address ? localIPv4Address.address : "0.0.0.0",
    () => {
      console.log(`Server is up on port ${port}!`);
      console.log(
        "\x1b[36m%s\x1b[0m",
        `Please open the client at http://${localIPv4Address.address}:3000/ on any browser on your network to access this app`
      );
    }
  );
} else {
  server.listen(port, () => {
    console.log(`Server is up on port ${port}!`);
  });
}
