require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
app.use(cors());

app.get('/', (req, res) => {
    res.send('Running');
});

const users = {};
const chatUsers ={};
const roomUsersNames = {};
const userName = {};
const socketToRoom = {};
const userReaction = {};
const polls = {};
const userPollResponse = {};
const chatMessages = {};

io.on('connection', socket => {
    socket.on("join room", roomID => {
        socket.join(roomID);
        if (users[roomID]) {
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
        userReaction[socket.id] = '';
        socket.emit("all users", usersInThisRoom);
    });

	socket.on("join chat room", roomID => {
        socket.join(roomID);
		console.log(socket.id +" joined chat room")
        if (chatUsers[roomID]) {
            chatUsers[roomID].push(socket.id);
        } else {
            chatUsers[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
		console.log(socket.id + " disconnected")
		if(chatUsers[socketToRoom[socket.id]]!==undefined && typeof chatUsers[socketToRoom[socket.id]].find(ele => ele==socket.id) != 'undefined'){
			const roomID = socketToRoom[socket.id];
			let room = chatUsers[roomID];
			let roomNames = roomUsersNames[roomID];
			if (room) {
				room = room.filter(id => id !== socket.id);
				roomNames = roomNames.filter(id => id.id !== socket.id);
				delete userReaction[socket.id]
				chatUsers[roomID] = room;
			}
		}
        else {
			const roomID = socketToRoom[socket.id];
			let room = users[roomID];
			if (room) {
				room = room.filter(id => id !== socket.id);
				delete userReaction[socket.id]
				users[roomID] = room;
			}
			socket.broadcast.emit("userDisconnected", socket.id);
		}
    });

    socket.on('user name', (UserName) => {
        userName[socket.id] = UserName;
		const temp={id:socket.id,name:UserName}
		if (typeof roomUsersNames[socketToRoom[socket.id]] !== "undefined")
			roomUsersNames[socketToRoom[socket.id]].push(temp);
        else
			roomUsersNames[socketToRoom[socket.id]] = [temp];
		io.to(socketToRoom[socket.id]).emit('setroomUserNames', roomUsersNames[socketToRoom[socket.id]]);
    });

    socket.on('sendText', (payload) => {   //["\nAnushka:hiiiii", "\nAnushka:hello"]
        // const temp = userName[socket.id] + "~" + payload;
		console.log(socket.id)
		console.log(userName[socket.id]);
        const temp={name: userName[socket.id], msg: payload}
        if (typeof chatMessages[socketToRoom[socket.id]] !== "undefined")
            chatMessages[socketToRoom[socket.id]].push(temp);
        else
            chatMessages[socketToRoom[socket.id]] = [temp];
        io.to(socketToRoom[socket.id]).emit('sendPreviousMsg', chatMessages[socketToRoom[socket.id]]);
        console.log(payload);
    });
    socket.on('getPreviousMsg', () => {
        io.to(socketToRoom[socket.id]).emit('sendPreviousMsg', chatMessages[socketToRoom[socket.id]]);
    });
    socket.on('setReactions', (reactions) => {
        userReaction[socket.id] = reactions;
        console.log(userReaction);
        socket.to(socketToRoom[socket.id]).broadcast.emit('allUserReactions', userReaction);
    });
    socket.on('getReactions', () => {
        socket.to(socketToRoom[socket.id]).broadcast.emit('allUserReactions', userReaction);
    });
    socket.on('getPolls', () => {
		console.log( polls[socketToRoom[socket.id]])
		
        io.to(socketToRoom[socket.id]).emit('sendPoll', polls[socketToRoom[socket.id]]);
    });
    socket.on('selectUser', (res) => {
        userPollResponse[socket.id] = { id: res.id, option: res.option };
        polls[socketToRoom[socket.id]].find((polls) => polls.id === res.id)[res.option] += 1;
        io.to(socketToRoom[socket.id]).emit('sendPoll', polls[socketToRoom[socket.id]]);
    });
    socket.on('AddPoll', (payload) => {
        payload["voteOption1"] = 0;
        payload["voteOption2"] = 0;
        payload["voteOption3"] = 0;
        payload["id"] = uuidv4();
        if (typeof polls[socketToRoom[socket.id]] !== "undefined")
            polls[socketToRoom[socket.id]].push(payload);
        else
            polls[socketToRoom[socket.id]] = [payload];
        io.to(socketToRoom[socket.id]).emit('sendPoll', polls[socketToRoom[socket.id]]);
        console.log(polls);
    });
});

server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));


