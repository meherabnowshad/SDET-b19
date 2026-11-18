let products = [
  { id: 1, title: "Mouse", price: 500, category: "Accessories", inStock: true },
  { id: 2, title: "Keyboard", price: 1200, category: "Accessories", inStock: false },
  { id: 3, title: "Monitor", price: 8000, category: "Display", inStock: true },
  { id: 4, title: "Laptop", price: 55000, category: "Computer", inStock: true },
  { id: 5, title: "Headphone", price: 1500, category: "Accessories", inStock: true }
];


let stock_check = products.filter((m) => m.inStock).sort((a,b) => a.price - b.price).map((m) => `Title:${m.title} - Price:${m.price}`)

let total_price = products.filter((m) => m.inStock).reduce((acc,curr) => acc + curr.price,0)

console.log(stock_check)
console.log(total_price)