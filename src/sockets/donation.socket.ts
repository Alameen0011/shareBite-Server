import { Socket} from "socket.io";

export const handleDonationSocket = ( socket: Socket) => {


    socket.on("donation:picked",(data) => {
        console.log("claimed Data: ",data)
    })




}


