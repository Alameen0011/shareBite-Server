import { Server } from "socket.io";
import { handleVolunteerSockets } from "./volunteer.socket";
import { handleDonationSocket } from "./donation.socket";
import { handleAdminSocket } from "./admin.socket";

// Store online users (userId -> socketId)
const userSocketMap: Record<string, string> = {};

// Expose socket map to get individual socket ID
export const getIndividualSocketId = (userId: string): string | undefined => {
  return userSocketMap[userId];
};

export const registerSocketHandlers = (io: Server) => {

  io.on("connection", (socket) => {

    const user = socket.data.user;
    if (!user || !user.id || !user.role) {
      console.log("Invalid user data during socket connection");
      return socket.disconnect();
    }

    console.log("User Connected :", socket.id);
    console.log("user :", user);

    // Save mapping
    userSocketMap[user.id] = socket.id;
    console.log(`✅ User connected: ${user.id} -> Socket ID: ${socket.id}`);

    // Clean up on disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${user.id}`);
      delete userSocketMap[user.id];
    });

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
        console.log("Unknown role: ", user.role);
        socket.disconnect(true); // Disconnect unrecognized roles
        break;
    }
  });
};
