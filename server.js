const path = require("path");
const fastify = require("fastify")({ logger: true });
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "frontend"),
  prefix: "/",
});

const start = async () => {
  try {
    await fastify.listen(8081, "0.0.0.0");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
