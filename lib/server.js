// Built in node core requires
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;

// Local requires
const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');

// tmp testing
/*
helpers.sendTwilioSms('15005550007', 'Hello world!', err => {
  console.error({ 'ERROR': err });
});
*/

const server = {};

// HTTP server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

// HTTPS server
server.httpsServerOps = {
  'key': fs.readFileSync(path.join(__dirname, '../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOps, (req, res) => {
  server.unifiedServer(req, res);
});

server.unifiedServer = (req, res) => {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+s/g, '');

  // Get the query string as an object
  const queryStringObj = parsedUrl.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload if there is any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', data => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler the request should go to
    const chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined'
      ? server.router[trimmedPath]
      : handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObj,
      method,
      headers,
      'payload': helpers.parseJsonToObj(buffer)
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, (err, status, payload) => {
      if (err) {
        console.error(err);
      }
      status = typeof (status) === 'number' ? status : 200;

      payload = typeof (payload) === 'object' ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Send the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(status);
      res.end(payloadString);

      // Log the request
      console.log({
        'status': status,
        'request_path': trimmedPath,
        'method': method,
        'query_params': queryStringObj,
        'headers': headers,
        'payload': payloadString
      });
    });
  });
};

// Request router
server.router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks
};

server.init = () => {
  // HTTP server
  server.httpServer.listen(config.httpPort, () => {
    console.log(`server listening for requests on port ${config.httpPort}
in the ${config.envName} environment`);
  });
  // HTTPS server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(`server listening for requests on port ${config.httpsPort}
in the ${config.envName} environment`);
  });
};

module.exports = server;
