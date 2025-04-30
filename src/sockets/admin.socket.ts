import { Socket, Server } from "socket.io";
import { getIndividualSocketId } from ".";

export const handleAdminSocket = ( socket: Socket, io: Server) => {

    socket.join("admin-room");


    socket.on("call_declined",(data) => {

        const { from } = data

        const targetSocketId = getIndividualSocketId(from);

        if (targetSocketId) {
          io.to(targetSocketId).emit("call_declined", {
            message: "Busy",
          });

        } else {
          console.log("Target client not connected");
        }
    })


    socket.on("disconnect", () => {
        console.log(`Admin disconnected from the room: admin-room`);
        socket.leave("admin-room");
      });

}