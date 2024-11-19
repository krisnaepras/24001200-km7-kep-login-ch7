const { Server } = require("socket.io");

let io;

module.exports = {
  init: (server) => {
    io = new Server(server);

    io.on("connection", (socket) => {
      console.log("A user connected");

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.io has not been initialized!");
    }
    return io;
  }
};
