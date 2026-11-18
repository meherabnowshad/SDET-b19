let cart = [
    {
        name: "Shirt", price: 1200, quantity: 2
    },
    {
        name: "Pants", price: 1800, quantity: 1
    },
    {
        name: "Socks", price: 150, quantity: 3
    }
]
total_bill = 0
for(let p in cart){
    total_bill += cart[p]['price'] * cart[p]['quantity']
}

console.log(total_bill)