import { Socket, Server } from "socket.io";
import { getDistanceFromLatLonInKm } from "../utils/harvasine";
import Donation from "../models/donation.model";


const connectedVolunteers = new Map<string, {lat: number; lng: number}>();



export const handleVolunteerSockets = (socket: Socket) => {


    //1. volunteer joins with location (recieved in server)
    socket.on("volunteer:join",async({lat,lng}) => {
        console.log(lat,lng,"ltaatattalnggg")
        connectedVolunteers.set(socket.id, { lat,lng })

        console.log(connectedVolunteers,"connected volunteers on joining ==================")

        const allDonations = await Donation.find({
            status: "pending",
            volunteer: null,
        }).lean()


        const nearby = allDonations.map((donation) => {
            const [lon, lat2] = donation.pickupLocation.coordinates;

            const distance = getDistanceFromLatLonInKm(lat,lng,lat2, lon)
            return { ...donation, distance };
        })
        .filter((d) => d.distance <= 5)
        .sort((a,b) => a.distance - b.distance);

        console.log(nearby,"nearbySorted")

        socket.emit("donations:nearby",nearby)



    })

    //2.Volunteer pickup the donation -- emit to donor for toast
   

    
    //Clean up when the volunteer closes their tab or loses connection.
    socket.on("disconnect", () => {
        connectedVolunteers.delete(socket.id);
      });


        

}


export const notifyDonationClaimToDonor = (socket) => {

}




// Trigger this from the create Donation controller
export const notifyNearbyVolunteers = (io:Server, donation: any) => {
    const [donLng,donLat] = donation.pickupLocation.coordinates;

    console.log(connectedVolunteers,"connected volunteers ==================")


    connectedVolunteers.forEach(({lat,lng},socketId) => {
        const distance = getDistanceFromLatLonInKm(lat,lng,donLat,donLng);
        console.log(distance,"emiting the new donation to sotred maped volunteers in range of 5 km")
        if(distance <= 5){
            io.to(socketId).emit("donation:new", donation);
        }

    })
}