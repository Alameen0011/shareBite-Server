import { Socket, Server} from "socket.io";

export const handleDonationSocket = ( socket: Socket, io: Server) => {



//IF donor instantiate a call - socket.emit from support.tsx event ---> server will listen here and forward to admin
    socket.on("call_Request", (data) => {
        console.log("call_Request from:", socket.data.user.role, data);
      
        // Forward to admin-room
        io.to("admin-room").emit("call_Request", data);       
    })




}


