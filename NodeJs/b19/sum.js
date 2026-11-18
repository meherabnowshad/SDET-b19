// const prompt = require("prompt-sync")();

// let number1 = parseInt(prompt("Input first number: "));
// let number2 = parseInt(prompt("Input second number: "));

// let sum = number1 + number2;

// console.log(`Sum of ${number1} and ${number2} is ${sum}.`);



const prompt = require("prompt-sync")();

const correctPassword = "admin123";

let password = "";

while (password !== correctPassword) {
    password = prompt("Enter password: ");

    if (password !== correctPassword) {
        console.log("Wrong password. Try again.");
    }
}

console.log("Login successful.");
