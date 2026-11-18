const cart =[
    {item: "Laptop", price: 1000},
    {item: "Mouse", price: 1500},
    {item: "Keyboard", price: 800},
    {item: "Monitor", price: 2000}
]

const totalPrice = cart.reduce((acc,curr) => acc+curr.price, 0)
console.log(totalPrice)

export {cart}
