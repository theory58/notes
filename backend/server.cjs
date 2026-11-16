const Hapi = require('@hapi/hapi');
const routes = require('./routes.cjs');

const createServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  server.route(routes);

  return server;
};

if (require.main === module) {
  const init = async () => {
    const server = await createServer();
    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
  };

  init();
}

module.exports = createServer;
