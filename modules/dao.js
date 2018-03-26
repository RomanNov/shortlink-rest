const mongoose = require('mongoose');
let fs = require('fs');
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
    return Link.findOne({'full_link': fullLink},'count', (err, link) => {
        if(err) throw err; 
    }).then(link => {
        if(link) {
            return Codec.encode(link.count);
        }
        return null;
    })
}

exports.findTokenByFullLink = _findTokenByFullLink

exports.insert = (fullLink) => {
    return _findTokenByFullLink(fullLink)
            .then(token =>{
                if(token){
                    return token;
                }
                else{
                    let link = new Link({ full_link:fullLink, hits: 0 });
                    link.save(function (err) {
                        if (err) throw err;
                    });
                }
            })

}

exports.findLinkByTokenAndUpdate = (token) => {
    let count=Codec.decode(token);
    return Link.findOne({'count': count},'full_link count hits', (err, link) => {
        if(err) throw err;
    }).then(link => {
        if(link){
          return  Link.update({ _id: link.id}, { $set: { hits: link.hits+1, updated_at: new Date() } })
            .then(()=> link.full_link);
        }
        return null;
    })
}

