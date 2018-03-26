let alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
let base = alphabet.length;

exports.encode = (id) => {
    let token="";
    while(id>0){
        token=token+alphabet[id % base];
        id= parseInt(id / base, 10);
    }
    return token.split("").reverse().join("");

}

exports.decode= (token) => {
    let id=0;
    for(let i=0; i<token.length;i++){
        id=id*base+alphabet.indexOf(token[i]);
    }
    return id;
}