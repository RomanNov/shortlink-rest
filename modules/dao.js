const mongoose = require('mongoose');
const fs = require('fs');
const Codec = require('./url-coder');

let connect= JSON.parse(fs.readFileSync('./db_properties.json', 'utf8'));

mongoose.connect(connect.uri);

let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

let linkSchema = mongoose.Schema({
    count: { type: Number, index: { unique: true }},
    full_link: { type: String, index: { unique: true }},
    hits: Number,
    updated_at: Date,
    created_at: Date
});

let Link = mongoose.model('links', linkSchema);


linkSchema.pre('save', function(next) {
    let currentDate = new Date();
    this.updated_at = currentDate;

    if (!this.created_at)
        this.created_at = currentDate;

    let count = 1;
    let link = this;
    Link.find({}, function(err, links) {
    if (err) throw err;
        count = links.length + 1;
        link.count = count;
        next();
    });
});

function _findTokenByFullLink  (fullLink) {
    return Link.findOne({'full_link': fullLink},'count hits', (err, link) => {
        if(err) throw err; 
    }).then(link => {
        if(link) {
            return { token: Codec.encode(link.count), hits: link.hits } ;
        }
        return null;
    }).catch((reason)=> { console.error(reason) });
}

exports.findTokenByFullLink = _findTokenByFullLink

exports.insert = async (fullLink) => {
    return _findTokenByFullLink(fullLink)
            .then(tokenInfo =>{
                if(tokenInfo){
                    return tokenInfo;
                }
                else{
                    let link = new Link({ full_link:fullLink, hits: 0 });
                    return link.save().then((savedLink) => savedLink?{ token: Codec.encode(savedLink.count), hits:savedLink.hits }:null);                
                }
            }).catch((reason)=> { console.error(reason) });

}

exports.findLinkByToken = (token) => {
    let count=Codec.decode(token);
    return Link.findOne({'count': count},'full_link hits created_at', (err, link) => {
        if(err) throw err;
    }).then(link => link).catch((reason)=> { console.error(reason) });
}

exports.findLinks = () => {
    return Link.find({},'full_link hits created_at updated_at', (err, link) => {
        if(err) throw err;
    }).then(links => links).catch((reason)=> { console.error(reason) });
}

exports.findLinkByTokenAndUpdateHits = (token) => {
    let count=Codec.decode(token);
    return Link.findOne({'count': count},'full_link hits', (err, link) => {
        if(err) throw err;
    }).then(link => {
        if(link){
          link.hits=link.hits+1  ;
          return  Link.update({ _id: link.id}, { $set: { hits: link.hits, updated_at: new Date() } })
            .then(()=> link.full_link);
        }
        return null;
    }).catch((reason)=> { console.error(reason) });
}

