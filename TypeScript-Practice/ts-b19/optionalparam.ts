function mycalc(a:number, b?:number):number{
    if(a&&b){
        return a+b 
    }
    return a+a;
}

let res = mycalc(5,10)

console.log(res)