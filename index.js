const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const HapiSwagger = require("hapi-swagger");
const Pack = require("./package");

(async () => {
  const server = Hapi.server({
    port: 3000,
    host: "localhost",
  });

  const swaggerOptions = {
    info: {
      title: "Test API Documentation",
      version: Pack.version,
    },
  };

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
  ]);

  try {
    await server.start();
    console.log("Server running on %s", server.info.uri);
  } catch (err) {
    console.log(err);
  }

  server.route({
    method: "POST",
    path: "/",
    handler: (request, h) => {
      return h
        .response({ message: "Successfully sent message to queue" })
        .code(201);
    },
  });
})();
