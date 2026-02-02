const http = require('http');

const app = require('./app');
const socket = require("./socket");
const CONSTANTS = require("./src/constants/constants");
const port = CONSTANTS.PORT;

const server = http.createServer(app);
let io; // Declare io at module level

// Initialize socket.io with Redis support
async function initializeServer() {
  try {
    io = await socket.init(server); // Assign to module-level variable
    
    server.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
      console.log(`📡 Socket.IO initialized with Redis lock support`);
    });
    
    return io; // Return io instance
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start the server
initializeServer();

// Export server instance if needed by other modules
// To access io from other files, use: const socket = require('./socket'); socket.getIo()
module.exports = server;

