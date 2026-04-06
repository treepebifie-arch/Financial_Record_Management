const bcrypt = require("bcryptjs");
require ("dotenv").config()


class AuthHash {
    static async hashPassword(password ) {
    return bcrypt.hash(password, 12);
    }

    static async comparePassword(password , hashedPassword ) {
    return bcrypt.compare(password, hashedPassword);
    }
}

module.exports =  AuthHash;
