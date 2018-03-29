'use strict';

const Hapi = require('hapi');
const Boom = require('boom');
const Inert = require('inert');
const Dao = require('./modules/dao');

const server = Hapi.server({
    port: 80,
    host:'localhost'
});

const init = async () => {

    await server.register(Inert);

    server.route({
        method: 'GET',
        path: '/',
        handler: {
            file: {
                path: 'public/index.html'
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/app/{p*}',
        handler: {
            file: {
                path: 'public/index.html'
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/links/{token}',
        handler: async (request, h) => {
            let link = await Dao.findLinkByToken(encodeURIComponent(request.params.token));
            return 'Requested full link: ' + JSON.stringify(link);
        }
    });

    server.route({
        method: 'GET',
        path: '/api/links',
        handler: async (request, h) => {
            let links = await Dao.findLinks();
            return JSON.stringify(links);
        }
    });

    server.route({
        method: 'POST',
        path: '/api/links',
        options: {
            payload: {
                output: 'data',
                parse: true
            }
        },
        handler: async (request, h) => {
            let fullLink=request.payload.full_link;
            if(fullLink) {
                fullLink=fullLink.replace("https://","").replace("http://","").trim().replace(/ /g,"");
                if(fullLink.length != 0){
                    let tokenInfo=await Dao.findTokenByFullLink(fullLink);
                    if(!tokenInfo) {
                        tokenInfo= await Dao.insert(fullLink).then((tokenInfo)=>tokenInfo);
                    }
                    return { url: tokenInfo.token, hits: tokenInfo.hits};
                } else{
                    throw Boom.badRequest("The link cannot be empty string");
                }
            } else {
                throw Boom.badRequest("Payload error. The full_link parameter is missing. Body must be similar to { full_link: 'www.example.com' }") 
            }
        }
    });

    // used to treat clicking on the link and redirect to full link
    server.route({
        method: 'GET',
        path: '/{token}',
        handler: async (request, h) => {
            let encodedToken=encodeURIComponent(request.params.token);
            if(!/[^0-9a-zA-Z]/.test(encodedToken)){
                let link = await Dao.findLinkByTokenAndUpdateHits(encodedToken);
                if(link) {
                    return h.redirect('http://' + link); //302
                }else{
                    throw Boom.notFound("SHORT LINK NOT FOUND"); //404  
                }
             } else {
                    return h.file('public/'+encodedToken);
            }
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
