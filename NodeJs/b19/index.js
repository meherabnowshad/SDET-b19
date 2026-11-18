// // // console.log("Hello, World!");


// // // const name = "Hello! Meherab Nowshad";
// // // console.log(name);


// // let firstName = "Meherab";
// // firstName = "Hossain "
// // let lastName = "Nowshad";

// // console.log(firstName + " Hossain " + lastName);


// // let fullName = "Meherab Hossain Nowshad";
// // let en = fullName.indexOf("No");
// // console.log(fullName.slice(en)); 



// let age = 18;
// if (age >= 18) 
// {
//     console.log("You are a voter ")
// }
// else
// {
//     console.log("You are not a voter")
// }

// let result = (age>=   18)?"Voter":"Not a Voter"
// console.log(result)


// number = 25.6
// console.log(typeof number)


import {readFileSync} from 'fs'

const users = JSON.parse(readFileSync('./student.json', 'utf-8'))

console.log(users[0].name)