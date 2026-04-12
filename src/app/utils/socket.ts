/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from "socket.io";

let io: Server;

export const socketHelper = {
    setupSocket: (server: any) => {
        io = new Server(server, {
            cors: { origin: "*" }
        });

        io.on("connection", (socket) => {
            const userId = socket.handshake.query.userId as string;
            if (userId) {
                socket.join(userId);
                console.log(`User joined room: ${userId}`);
            }
        });
    },
    emitNotification: (userId: string, data: any) => {
        if (io) {
            io.to(userId).emit("notification", data);
        }
    }
};