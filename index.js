const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const HapiSwagger = require("hapi-swagger");
const Pack = require("./package");
const Mongoose = require("mongoose");
require("dotenv/config");
const Joi = require("joi");

(async () => {
  const server = Hapi.server({
    port: 3000,
    host: "localhost",
  });

  /**SWAGGER---------------------------------------------- */
  const swaggerOptions = {
    info: {
      title: "API Documentation Services Analysis",
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
  /**SWAGGER---------------------------------------------- */

  /**PODATKOVNA BAZA-------------------------------------- */
  Mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Connected to databse %s", process.env.MONGO_URI);
    })
    .catch((err) => {
      console.log(err);
    });

  const AnalysisSchema = Mongoose.Schema({
    url: {
      type: String,
      required: true,
    },
    last_called: {
      type: Date,
      required: true,
    },
    calls: {
      type: Number,
      required: true,
    },
  });

  const AnalysisModel = Mongoose.model("Analysis", AnalysisSchema);
  /**PODATKOVNA BAZA-------------------------------------- */

  /**STREŽNIK---------------------------------------------- */
  try {
    await server.start();
    console.log("Server running on %s", server.info.uri);
  } catch (err) {
    console.log(err);
  }
  /**STREŽNIK----------------------------------------------- */

  /**KONČNE TOČKE------------------------------------------- */
  const routes = [
    {
      method: "GET",
      path: "/",
      options: {
        tags: ["api"], //SWAGGER
      },
      handler: (request, h) => {
        try {
          const analysis = AnalysisModel.find();
          return h.response(analysis).code(201);
        } catch (error) {
          return h
            .response({ content: "Server error." + error, error: true })
            .code(500);
        }
      },
    },
    {
      method: "GET",
      path: "/last",
      options: {
        tags: ["api"], //SWAGGER
      },
      handler: (request, h) => {
        try {
          let analysis = AnalysisModel.find();
          analysis = analysis.sort({ calls: -1 });
          return h.response(analysis[0]).code(201);
        } catch (error) {
          return h
            .response({ content: "Server error." + error, error: true })
            .code(500);
        }
      },
    },
    {
      method: "GET",
      path: "/latest",
      options: {
        tags: ["api"], //SWAGGER
      },
      handler: (request, h) => {
        try {
          let analysis = AnalysisModel.find();
          analysis = analysis.sort({ last_called: -1 });
          return h.response(analysis[0]).code(201);
        } catch (error) {
          return h
            .response({ content: "Server error." + error, error: true })
            .code(500);
        }
      },
    },
    {
      method: "POST",
      path: "/",
      options: {
        tags: ["api"], //SWAGGER
        validate: {
          payload: Joi.object({
            url: Joi.string().required(),
          }),
        },
      },
      handler: (request, h) => {
        try {
          const url = request.body.url;
          const data = AnalysisModel.findOne({ url: url });
          if (data == undefined)
            return h
              .response({ message: "Url not found", error: true })
              .code(404);
          AnalysisModel.updateOne(
            { url: url },
            {
              $set: {
                calls: data.calls++,
                last_called: new Date(),
              },
            }
          );
          return h.response({ message: "Updated", error: false }).code(201);
        } catch (error) {
          return h
            .response({ content: "Server error." + error, error: true })
            .code(500);
        }
      },
    },
  ];

  server.route(routes);
  /**KONČNE TOČKE------------------------------------------- */
})();
