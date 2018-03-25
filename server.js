'use strict';

const Hapi = require('hapi');
const Inert = require('inert');

const server = Hapi.server({
    port: 3000,
    host:'localhost'
});



const init = async () => {

    await server.register(Inert);

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path:'public',
                index: ['index.html']
            }
        }
    });
    
    server.route({
        method: 'GET',
        path: '/api/{token}',
        handler: (request, h) => {
    
            return 'Requested token: ' + encodeURIComponent(request.params.token);
        }
    });

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
