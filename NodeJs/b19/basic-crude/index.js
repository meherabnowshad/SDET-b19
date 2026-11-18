import { User } from './db.js';

async function userRegistration(name, email, phoneNumber, password) {
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
        console.log('User with this email already exists');
        throw new Error('User with this email already exists');
        return null;
    }

    try {
        const user = await User.create({
            name,
            email,
            phoneNumber,
            password
        });

        console.log('User registered successfully:', user.toJSON());
        return user;
    } catch (error) {
        console.error('Error registering user:', error.message);
        throw error;
    } 
}

async function updateUser(id, updatedFields) {
    const user = await User.findByPk(id);

    if (!user) {
        console.log('User not found for ID:', id);
        return null;
    }

    try {
        await user.update(updatedFields);
        console.log('User updated successfully:', user.toJSON());
        return user;
    } catch (error) {
        console.error('Error updating user:', error.message);
        throw error;
    }
}

async function listUsers() {
    const users = await User.findAll();
    console.log('All users:', users.map(user => user.toJSON()));
    return users;
}

export { userRegistration, updateUser, listUsers };