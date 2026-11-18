const numbers = [10,20,30,40,50];

const key = 30;

let isFound = false;

for(let i = 0; i < numbers.length; i++) {
    if(numbers[i] == key){
        isFound = true;
        break;
    }
}

if(isFound == true){
    console.log(`${key} is found in the array`);
}
else{
    console.log(`${key} is not found in the array`);
}