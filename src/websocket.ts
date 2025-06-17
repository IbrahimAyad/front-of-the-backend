// ... existing code ...
// Example fix for Fastify WebSocket handler:
// fastify.get('/ws', { websocket: true }, (connection, req) => {
//   // connection is the WebSocket instance
//   // req is the Fastify request
//   // To get query params: req.query
//   // To send: connection.send(...)
//   // To receive: connection.on('message', ...)
// });
// ... existing code ... 