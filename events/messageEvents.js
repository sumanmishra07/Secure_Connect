
const EventEmitter = require("events");

// Create EventEmitter instance
const messageEmitter = new EventEmitter();

// Register event listener
messageEmitter.on("messageSent", (data) => {
  console.log("--------------------------------");
  console.log("CUSTOM EVENT: MESSAGE SENT");
  console.log("Sender:", data.sender);
  console.log("Receiver:", data.receiver);
  console.log("Message:", data.message);
  console.log("--------------------------------");
});

// Export emitter
module.exports = messageEmitter;
