const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')

const app = express()
const httpServer = createServer(app)

// creating socket server
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "https://movie-watching-app.vercel.app"]
    }
})

// user1 = {socketId => username}
const users = new Map()
// room1 = {roomId => members}
const rooms = new Map()

io.on('connection', (socket) => {
    // logging unique socket id
    console.log(`Connection id: ${socket.id}`)

    // listen for creat room event
    socket.on('create-room', (username, callback) => {
        let roomId = generatecode()
        while (rooms.has(roomId)) roomId = generatecode()

        rooms.set(roomId, {
            members: new Map([[socket.id, {
                username,
                memberStatus: 'host'
            }]])
        })

        socket.join(roomId)
        socket.roomId = roomId
        users.set(socket.id, username)
        callback({ roomId, memberStatus: 'host' })

        const room = rooms.get(roomId)
        const membersList = Array.from(room.members.values())

        socket.emit('system-message', `room ${roomId} created! share this code.`)
        socket.emit('update-members', membersList)
    })

    // listen for join room event
    socket.on('join-room', ({ username, roomId }, callback) => {
        const room = rooms.get(roomId)

        if (!room) return callback({ error: `room ${roomId} is not found, check the code` })
        room.members.set(socket.id, {
            username,
            memberStatus: 'guest'
        })

        socket.join(roomId)
        socket.roomId = roomId
        users.set(socket.id, username)
        callback({ success: true, memberStatus: 'guest' })

        const membersList = Array.from(room.members.values())

        io.to(socket.roomId).emit('system-message', `${username} has joined`)
        io.to(socket.roomId).emit('update-members', membersList)
    })

    // listen for send message event
    socket.on('send-message', (username, message) => {
        io.to(socket.roomId).emit('receive-message', {
            username,
            message,
            time: new Date().toLocaleTimeString()
        })
    })

    socket.on('peer-id', ({peerId}) => {
        socket.to(socket.roomId).emit('peer-joined', {peerId})
    })

    // listen for disconnection event
    socket.on('disconnect', () => {
        const username = users.get(socket.id)
        users.delete(socket.id)

        if (!socket.roomId) return
        const room = rooms.get(socket.roomId)

        if (!room) return
        room.members.delete(socket.id)
        const membersList = Array.from(room.members.values())

        if (room.members.size === 0) {
            rooms.delete(socket.roomId)
        }

        io.to(socket.roomId).emit(`system-message`, `${username} has disconnected`)
        io.to(socket.roomId).emit('update-members', membersList)
    })
})

function generatecode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}

httpServer.listen(4001, () => {
    console.log(`server is running at http://localhost:${4001}`)
})
