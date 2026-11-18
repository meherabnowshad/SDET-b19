// import {cart} from './reduce.js'
// console.log(cart[0])

import {readFileSync, writeFileSync} from 'fs'

const users = JSON.parse(readFileSync('./student.json', 'utf-8'))


const newUser = {
    name: "Karim",
    id: 104,
    department: "CSE",
}

users.push(newUser)

console.log(users)

writeFileSync('jsObject/users.json', JSON.stringify(users, null, 2), 'utf-8')