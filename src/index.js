const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
    generateMessage,
    generateLocationMessage,
} = require("./utils/messages");
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.port || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));
//if I have five clients connecting to the server, this function is going to run five different times, one time for each new connection.
io.on("connection", (socket) => {
    console.log("new webSocket Connection");

    socket.on("join", ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) {
            return callback(error);
        }
        socket.join(user.room); // join into that room

        socket.emit("message", generateMessage("Admin", "welcome!"));
        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                generateMessage("Admin", `${user.username} has joined!`)
            );
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room),
        });
        callback();
        // socket.emit , io.emit ,  socket.broadcast.emit  -> normal
        // io.to('room_name').emit, socket.broadcast.to('room_name').emit ->for rooms
    });

    socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback("profinity not allowed");
        }
        io.to(user.room).emit(
            "message",
            generateMessage(user.username, message)
        );
        callback();
    });
    socket.on("sendlocation", (location, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit(
            "locationMessage",
            generateLocationMessage(
                user.username,
                `https://google.com/maps?q=${location.latitude},${location.longitude}`
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
});

server.listen(port, () => {
    console.log(`server is up on port ${port}`);
});

//socket.emit => to emit it to that particular connection.
//socket.broadcast.emit => to emit it to everybody but not that particular connection.
//io.emit => to send it to everyone.
