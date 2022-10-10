const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
    generateMessage,
    generateLocationMessage,
} = require("./utils/messages");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.port || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));
let count = 0;
//if I have five clients connecting to the server, this function is going to run five different times, one time for each new connection.
io.on("connection", (socket) => {
    console.log("new webSocket Connection");

    socket.emit("message", generateMessage("welcome!"));
    socket.broadcast.emit("message", generateMessage("A new user has joined!"));

    socket.on("sendMessage", (message, callback) => {
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback("profinity not allowed");
        }
        io.emit("message", generateMessage(message));
        callback();
    });
    socket.on("sendlocation", (location, callback) => {
        io.emit(
            "locationMessage",
            generateLocationMessage(
                `https://google.com/maps?q=${location.latitude},${location.longitude}`
            )
        );
        callback();
    });

    socket.on("disconnect", () => {
        io.emit("message", generateMessage("A user has left!"));
    });
    //);
});

server.listen(port, () => {
    console.log(`server is up on port ${port}`);
});

//socket.emit => to emit it to that particular connection.
//socket.broadcast.emit => to emit it to everybody but not that particular connection.
//io.emit => to send it to everyone.

// const app = require("express")();
// const http = require("http").Server(app);
// const io = require("socket.io")(http);
// const port = process.env.PORT || 3000;

// const publicDirectoryPath = path.join(__dirname, "../public");
// app.get("/", (req, res) => {
//   res.sendFile(publicDirectoryPath + "/index.html");
// });

// io.on("connection", (socket) => {
//   socket.on("chat message", (msg) => {
//     io.emit("chat message", msg);
//   });
// });

// http.listen(port, () => {
//   console.log(`Socket.IO server running at http://localhost:${port}/`);
// });
