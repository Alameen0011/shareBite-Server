import { Socket } from "socket.io";

export const handleAdminSocket = ( socket: Socket) => {

    socket.on("admin",(data) => {
        console.log("Admin Data: ",data)
    })

}