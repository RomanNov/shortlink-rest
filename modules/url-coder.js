let alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
let base = alphabet.length;

exports.encode = (count) => {
    let token="";
    while(count>0){
        token=token+alphabet[count % base];
        count= parseInt(count / base, 10);
    }
    return token.split("").reverse().join("");

}

exports.decode= (token) => {
    let count=0;
    for(let i=0; i<token.length;i++){
        count=count*base+alphabet.indexOf(token[i]);
    }
    return count;
}