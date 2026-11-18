let number = 11;

isPrime = true;
for(let i=2;i<number;i++){
    if(number%i==0){
        isPrime=false;
        break;
    }
}

if(isPrime){
    console.log(`${number} is prime`)
}
else{
    console.log(`${number} is not a prime `)
}