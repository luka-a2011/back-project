
module.exports = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "My Blog API",
        version: "1.0.0",
        description: "API documentation for blog posts and users",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    apis: [
        "./auth/*.js",
        "./users/*.js",
        "./posts/*.js",
        "./main/*.js"
    ], 
  };