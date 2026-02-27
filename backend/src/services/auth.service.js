const db = require("../database/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

class AuthService {
  static async signup(name, email, password) {
    const hashed = await bcrypt.hash(password, 10);

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (name, email, password)
         VALUES (?, ?, ?)`,
        [name, email, hashed],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, name, email });
        },
      );
    });
  }

  static async login(email, password) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        async (err, user) => {
          if (err) return reject(err);
          if (!user) return reject(new Error("Usuário não encontrado"));

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return reject(new Error("Senha inválida"));

          const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1d" },
          );

          resolve({ token });
        },
      );
    });
  }
}

module.exports = AuthService;
