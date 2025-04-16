import { Server } from "socket.io"
import { handleVolunteerSockets } from "./volunteer.socket"
import { handleDonationSocket } from "./donation.socket"
import { handleAdminSocket } from "./admin.socket";

export const registerSocketHandlers = (io: Server) => {
    io.on("connection", (socket) => {
     
      const user = socket.data.user;
      console.log("User Connected :", socket.id);
      console.log("user :",user)

  
      // Role-based socket delegation
      switch (user.role) {
        case "volunteer":
          handleVolunteerSockets(socket);
          break;
  
        case "donor":
          handleDonationSocket(socket);
          break;
  
        case "admin":
          handleAdminSocket(socket);
          break;
  
        default:
          console.log("⚠️ Unknown role: ", user.role);
          socket.disconnect(true); // Disconnect unrecognized roles
          break;
      }
    });
  };