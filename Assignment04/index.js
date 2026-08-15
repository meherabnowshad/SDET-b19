import { User, Blog, initDB, closeDB } from './db.js'
import { Op } from 'sequelize'
import readline from 'readline/promises'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

async function question(prompt) {
    try {
        const answer = await rl.question(prompt)
        return answer.trim()
    } catch (err) {
        if (err.code === 'ERR_USE_AFTER_CLOSE') {
            console.log("\nGoodbye!")
            process.exit(0)
        }
        throw err
    }
}

async function allBlog() {
    const blogs = await Blog.findAll({ include: [{ model: User, attributes: ['firstName', 'lastName'] }] })
    if (blogs.length === 0) {
        console.log("\nNo blogs are found")
        return
    }
    console.log("\n========== ALL BLOGS ==========")
    blogs.forEach(b => {
        console.log(`ID: ${b.id} | Title: ${b.blogTitle} | Category: ${b.category}`)
        console.log(`Author: ${b.User.firstName} ${b.User.lastName}`)
        console.log(`Content: ${b.blog}`)
        console.log("--------------------------------")
    })
}

async function allUsers() {
    const users = await User.findAll()
    if (users.length === 0) {
        console.log("\nNo users are found")
        return
    }
    console.log("\n========== ALL USERS ==========")
    users.forEach(u => {
        console.log(`ID: ${u.id} | Name: ${u.firstName} ${u.lastName} | Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive}`)
    })
}

async function allUsersBlog() {
    const blogs = await Blog.findAll({ include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }] })
    if (blogs.length === 0) {
        console.log("\nNo blogs are found")
        return
    }
    console.log("\n========== ALL USERS' BLOGS ==========")
    blogs.forEach(b => {
        console.log(`ID: ${b.id} | Title: ${b.blogTitle} | Category: ${b.category} | Author: ${b.User.firstName} ${b.User.lastName} (${b.User.email})`)
        console.log(`Content: ${b.blog}`)
        console.log("--------------------------------")
    })
}

async function register() {
    console.log("\n===== REGISTER =====")
    const firstName = await question("First Name: ")
    const lastName = await question("Last Name: ")
    const email = await question("Email: ")
    const password = await question("Password: ")
    const role = await question("Role (user/admin) [user]: ") || 'user'
    try {
        await User.create({ firstName, lastName, email, password, role })
        console.log("\nRegistration successful! You can now login.")
    } catch (err) {
        console.log(`\nRegistration failed: ${err.message}`)
    }
}

async function login() {
    console.log("\n===== LOGIN =====")
    const email = await question("Email: ")
    const password = await question("Password: ")
    const user = await User.findOne({ where: { email } })
    if (!user || user.password !== password) {
        console.log("\nInvalid email or password")
        return null
    }
    if (!user.isActive) {
        console.log("\nUser is deactivated")
        return null
    }
    console.log(`\nWelcome back, ${user.firstName} ${user.lastName}!`)
    return user
}

async function searchBlog(user) {
    const input = await question("\nEnter blog ID or blog title: ")
    let blog = null
    if (/^\d+$/.test(input)) {
        const where = user ? { id: input, userId: user.id } : { id: input }
        blog = await Blog.findOne({ where, include: [{ model: User, attributes: ['firstName', 'lastName'] }] })
    } else {
        const where = user ? { blogTitle: { [Op.like]: `%${input}%` }, userId: user.id } : { blogTitle: { [Op.like]: `%${input}%` } }
        blog = await Blog.findAll({ where, include: [{ model: User, attributes: ['firstName', 'lastName'] }] })
    }
    if (!blog || (Array.isArray(blog) && blog.length === 0)) {
        console.log("\nNo blog found")
        return
    }
    const list = Array.isArray(blog) ? blog : [blog]
    console.log("\n===== SEARCH RESULT =====")
    list.forEach(b => {
        console.log(`ID: ${b.id} | Title: ${b.blogTitle} | Category: ${b.category}`)
        console.log(`Author: ${b.User.firstName} ${b.User.lastName}`)
        console.log(`Content: ${b.blog}`)
        console.log("--------------------------------")
    })
}

async function createBlog(user) {
    console.log("\n===== CREATE BLOG =====")
    const blogTitle = await question("Blog Title: ")
    const blog = await question("Blog Content: ")
    const category = await question("Category: ")
    await Blog.create({ userId: user.id, blogTitle, blog, category })
    console.log("\nBlog created successfully!")
}

async function updateBlog(user) {
    const id = await question("\nEnter blog ID to update: ")
    const blog = await Blog.findOne({ where: { id, userId: user.id } })
    if (!blog) {
        console.log("\nBlog not found")
        return
    }
    console.log(`\nCurrent title: ${blog.blogTitle}`)
    const blogTitle = await question("New Blog Title (enter to keep): ") || blog.blogTitle
    console.log(`Current content: ${blog.blog}`)
    const content = await question("New Blog Content (enter to keep): ") || blog.blog
    const category = await question(`New Category (${blog.category}): `) || blog.category
    await blog.update({ blogTitle, blog: content, category })
    console.log("\nBlog updated successfully!")
}

async function deleteBlog(user) {
    const id = await question("\nEnter blog ID to delete: ")
    const where = user ? { id, userId: user.id } : { id }
    const blog = await Blog.findOne({ where })
    if (!blog) {
        console.log("\nBlog not found")
        return
    }
    await blog.destroy()
    console.log("\nBlog deleted successfully!")
}

async function userMenu(user) {
    while (true) {
        console.log("\n===== USER MENU =====")
        console.log("1. View Your Blogs")
        console.log("2. Search Blog by ID/Title")
        console.log("3. Create Blog")
        console.log("4. Update Blog")
        console.log("5. Delete Blog")
        console.log("6. Logout")
        const choice = await question("Choose an option: ")
        switch (choice) {
            case "1": {
                const blogs = await Blog.findAll({ where: { userId: user.id } })
                if (blogs.length === 0) {
                    console.log("\nNo blogs are found")
                } else {
                    console.log("\n===== YOUR BLOGS =====")
                    blogs.forEach(b => console.log(`ID: ${b.id} | Title: ${b.blogTitle} | Category: ${b.category}`))
                }
                break
            }
            case "2": await searchBlog(user); break
            case "3": await createBlog(user); break
            case "4": await updateBlog(user); break
            case "5": await deleteBlog(user); break
            case "6": console.log("\nLogged out"); return
            default: console.log("\nInvalid option")
        }
    }
}

async function updateUser() {
    const id = await question("\nEnter user ID: ")
    const user = await User.findByPk(id)
    if (!user) {
        console.log("\nUser not found")
        return
    }
    const isActive = await question(`Set isActive (true/false) [${user.isActive}]: `)
    if (isActive === 'true' || isActive === 'false') {
        await user.update({ isActive: isActive === 'true' })
        console.log(`\nUser ${user.email} isActive set to ${isActive}`)
    } else {
        console.log("\nInvalid value")
    }
}

async function deleteUser() {
    const id = await question("\nEnter user ID to delete: ")
    const user = await User.findByPk(id)
    if (!user) {
        console.log("\nUser not found")
        return
    }
    await Blog.destroy({ where: { userId: user.id } })
    await user.destroy()
    console.log("\nUser and their blogs deleted successfully!")
}

async function adminMenu() {
    while (true) {
        console.log("\n===== ADMIN MENU =====")
        console.log("1. View All Users")
        console.log("2. View All Blogs")
        console.log("3. Search Blog by ID/Title")
        console.log("4. Update User")
        console.log("5. Delete User")
        console.log("6. Delete Blog")
        console.log("7. Logout")
        const choice = await question("Choose an option: ")
        switch (choice) {
            case "1": await allUsers(); break
            case "2": await allUsersBlog(); break
            case "3": await searchBlog(null); break
            case "4": await updateUser(); break
            case "5": await deleteUser(); break
            case "6": await deleteBlog(null); break
            case "7": console.log("\nLogged out"); return
            default: console.log("\nInvalid option")
        }
    }
}

async function mainMenu() {
    while (true) {
        console.log("\n===== MAIN MENU =====")
        console.log("1. View All Blogs")
        console.log("2. Login")
        console.log("3. Register")
        console.log("4. Exit")
        const choice = await question("Choose an option: ")
        switch (choice) {
            case "1": await allBlog(); break
            case "2": {
                const user = await login()
                if (user) {
                    if (user.role === 'admin') {
                        await adminMenu()
                    } else {
                        await userMenu(user)
                    }
                }
                break
            }
            case "3": await register(); break
            case "4": console.log("\nGoodbye!"); return
            default: console.log("\nInvalid option")
        }
    }
}

async function start() {
    await initDB()
    await mainMenu()
    rl.close()
    await closeDB()
}

start()