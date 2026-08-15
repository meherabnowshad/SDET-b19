# Blog Management System (CLI)

A console-based blog management application built with **Node.js**, **JavaScript**, **Sequelize ORM** and **MySQL**. It supports three journeys: **Reader**, **User**, and **Admin**.

## Features

### Reader Journey
- View all blogs without logging in (`allBlog()`)

### User Journey
- Register and login
- Create multiple blogs (one-to-many relationship with User)
- View own blogs (shows "No blogs are found" if empty)
- Search a blog by ID or title
- Update own blog by ID
- Delete own blog by ID

### Admin Journey
- Login with an admin account
- View the complete user list (`allUsers()`)
- View all blogs from all users (`allUsersBlog()`)
- Search any blog by ID or title
- Update a user's `isActive` status (deactivated users cannot login — shows "User is deactivated")
- Delete any user (and their blogs)
- Delete any blog

## Tech Stack

- Node.js
- JavaScript (ES Modules)
- MySQL
- Sequelize ORM
- dotenv

## Database

- Database name: `blogdb` (configurable via `.env`)
- Tables created automatically by `sequelize.sync()`:

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto increment |
| firstName | VARCHAR(255) | NOT NULL |
| lastName | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, unique |
| password | VARCHAR(255) | NOT NULL |
| isActive | BOOLEAN | Default `true` |
| role | ENUM('admin','user') | Default `user` |
| createdAt / updatedAt | DATETIME | Auto managed |

### blogs
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto increment |
| userId | INT | Foreign key → users.id |
| blogTitle | VARCHAR(255) | NOT NULL |
| blog | TEXT | NOT NULL |
| category | VARCHAR(255) | NOT NULL |
| createdAt / updatedAt | DATETIME | Auto managed |

### Relationship
- **One-to-many**: one user can create many blogs; each blog belongs to one user (`User.hasMany(Blog)`, `Blog.belongsTo(User)`).

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd Assignment04
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=blogdb
   DB_USER=root
   DB_PASSWORD=your_password
   ```

4. Make sure MySQL is running and the database exists (or let Sequelize create the tables):
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS blogdb;"
   ```

5. Run the application:
   ```bash
   node index.js
   ```

## Usage

On start, the console shows the main menu:

```
===== MAIN MENU =====
1. View All Blogs
2. Login
3. Register
4. Exit
```

### Register
- Any user can register with first name, last name, email, password and role (default `user`).

### Login
- Enter email and password.
- If the account is deactivated (`isActive = false`), the console shows: `User is deactivated`.

### User Menu (after login as `user`)
```
1. View Your Blogs
2. Search Blog by ID/Title
3. Create Blog
4. Update Blog
5. Delete Blog
6. Logout
```

### Admin Menu (after login as `admin`)
```
1. View All Users
2. View All Blogs
3. Search Blog by ID/Title
4. Update User
5. Delete User
6. Delete Blog
7. Logout
```

## Creating an Admin Account

Register normally, then set the role to `admin` during registration, or update the role directly in the database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## Project Structure

```
Assignment04/
├── db.js        # Sequelize connection, models and sync
├── index.js     # CLI application (menus and all logic)
├── package.json
├── .env         # (gitignored)
└── .gitignore   # ignores node_modules and .env
```

## Demo Video

[Click here to watch the project demo](https://drive.google.com/drive/folders/17yahq4M9M2PDpNHgS85Zay-gnirXODyo?usp=sharing)

## Note

`node_modules` and `.env` are added to `.gitignore` and are not pushed to GitHub.