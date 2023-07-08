/** User class for message.ly */

const { BCRYPT_WORK_FACTOR } = require("../config")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const db = require("../db")

/** User of the site. */

class User {

  constructor({ username, password, first_name, last_name, phone }) {
    this.username = username;
    this.password = password
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
  }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    try {
      // TODO: move to /register
      // if (!username || !password) {
      //   throw new ExpressError("Username and password required", 400);
      // }

      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

      const results = await db.query(`
      INSERT INTO users (username, password, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone])
      return new User(results.rows[0])
    } catch (error) {
      console.log(error)
    }
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {}

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`
      SELECT username, first_name, last_name, phone
      FROM users`
    )
    return results.rows
  }

  /** Get: get user by username
   *
   * returns {username, first_name, last_name, phone, join_at, last_login_at } */

  static async get(username) {
    const results = await db.query(`
      SELECT username, first_name, last_name, phone, join_at, last_login_at 
      FROM users WHERE username = $1`,
      [username]
    )

    const user = results.rows[0]

    if (user === undefined) {
      const err = new Error(`User not found: ${username}`)
      err.status = 404
      throw err
    }

    return user
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { }
}


module.exports = User;