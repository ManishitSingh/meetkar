const createServer = require("http").createServer;
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev });
const handler = app.getRequestHandler();

const usernameToSocket = new Map();
const socketToUsername = new Map();

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server(httpServer, {
        cors: {
            origin: `http://${hostname}:${port}`,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("a user connected: ", socket.id);

        socket.on("joinRoom",({name,roomId})=>{
            // console.log(name,roomId);
            const {rooms} = io.sockets.adapter;
            const room = rooms.get(roomId);
            
            if(room == undefined){
                socket.join(roomId);
                socket.emit("created",{roomId});
            }
            else if(room.size == 1){
                socket.join(roomId);
                socket.emit("joined",{roomId});
                io.to(roomId).emit("joined-user",{name,id:socket.id});
            }
            else{
                socket.emit("full");
            }

            // console.log(rooms);
        });

        socket.on("other-user-id",({roomId})=>{
            const {rooms} = io.sockets.adapter;
            const room = rooms.get(roomId);
            console.log("room:",room);
            const otherSocketIds = Array.from(room).filter(socketId => socketId !== socket.id);
            console.log("user:",otherSocketIds);
            socket.emit("other-id",{id:otherSocketIds[0]});
        })
        socket.on("offer",({offer,to})=>{
            socket.to(to).emit("offer",{offer,from:socket.id});
        })



        socket.on("disconnect", () => {
            console.log("user disconnected");
        });

    });

    httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
