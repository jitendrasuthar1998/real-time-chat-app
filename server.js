const express = require('express')
const path = require('path')
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const app = express();
const server = http.createServer(app);
const io = socketio(server)

const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
//set static folder

const botName = 'ChatCord Bot';

app.use(express.static(path.join(__dirname, 'public')))

const port = 3000 || process.env.PORT;

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})

//run when a client connect

io.on('connection', socket => {
    // console.log('New Web Socket Connection ... ');

    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room)

        //welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord app'));

        // broadcast when a user connects
        //broadcasting to a room from a given socket.

        socket.broadcast.
            to(user.room).
            emit('message',
                formatMessage(botName, `${user.username} has joined the chat.`))

        //send users and room info

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })

    })

    //Listen for chatMessage

    socket.on('chatMessage', (msg) => {
        // console.log('chat message is == ', msg);
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })

    // run when a client disconnects.

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat.`));
        }

        //send users and room info

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })

})