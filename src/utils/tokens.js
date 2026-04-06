const jwt = require("jsonwebtoken");
 require("dotenv").config();

class TokenService {
    static generateAccessToken(payload) {
        return jwt.sign({ payload }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: `${process.env.ACCESS_TOKEN_EXPIRES_MINS}m`,
        algorithm: 'HS256',
        });
    }

    static verifyAccessToken(token) {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        console.log("Decoded Access Token:", decoded);
        console.log ("Decoded Access Token Payload:", decoded.payload)
        return decoded.payload;
    }

    static generateRefreshToken(payload) {
        return jwt.sign({ payload }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${process.env.REFRESH_TOKEN_EXPIRES_DAYS}d` });
    }

    static verifyRefreshToken(token) {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        return decoded.payload;
    }

    static decodeAccessToken(token)  {
        const decoded = jwt.decode(token) ;
        return decoded ? decoded.payload : null;
    }
}

module.exports = TokenService;
