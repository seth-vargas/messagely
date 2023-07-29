/** User class for message.ly */

const { BCRYPT_WORK_FACTOR } = require("../config")
const bcrypt = require("bcrypt")
const db = require("../db")
const ExpressError = require("../expressError")

/** User of the site. */

class User {

    /** register new user -- returns
     *    {username, password, first_name, last_name, phone}
     */

    static async register({ username, password, first_name, last_name, phone }) {
        try {
            const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

            const result = await db.query(`
                INSERT INTO users (
                    username, 
                    password, 
                    first_name, 
                    last_name, 
                    phone,
                    last_login_at
                )
                VALUES (
                    $1, 
                    $2, 
                    $3, 
                    $4, 
                    $5,
                    $6
                )
                RETURNING 
                    username, 
                    password,
                    first_name,
                    last_name, 
                    phone
                `,
                [username, hashedPassword, first_name, last_name, phone, new Date()]
            )
            return result.rows[0]
        } catch (error) {
            console.log(error)
            process.exit(1)
        }
    }

    /** Authenticate: is this username/password valid? Returns boolean. */

    static async authenticate(username, password) {
        try {
            const { rows } = await db.query(`
      SELECT password FROM users
      WHERE username = $1`, [username])

            const found = rows[0]

            if (found !== undefined) {
                const passwordIsValid = await bcrypt.compare(password, found.password)

                return passwordIsValid
            }
            return false
        } catch (error) {
            console.log(error)
            process.exit(1)
        }
    }

    /** Update last_login_at for user */

    static async updateLoginTimestamp(username) {
        try {
            await db.query(`
                    UPDATE users 
                    SET last_login_at = CURRENT_TIMESTAMP 
                    WHERE username = $1
                `,
                [username]
            )
        } catch (error) {
            console.log(error)
            process.exit(1)
        }
    }

    /** All: basic info on all users:
     * [{username, first_name, last_name, phone}, ...] */

    static async all() {
        const { rows } = await db.query(`
      SELECT username, first_name, last_name, phone
      FROM users`
        )
        return rows
    }

    /** Get: get user by username
     *
     * returns {username, first_name, last_name, phone, join_at, last_login_at } */

    static async get(username) {
        const { rows } = await db.query(`
            SELECT 
                username,
                first_name, 
                last_name, 
                phone, 
                join_at, 
                last_login_at 
            FROM users 
            WHERE username = $1`,
            [username]
        )

        const user = rows[0]

        if (!user) {
            throw new ExpressError(`No such user: ${username}`, 404);
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

    static async messagesFrom(username) {
        const request = await db.query(`
            SELECT 
                id, 
                to_username, 
                body, 
                sent_at,
                read_at
            FROM messages
            WHERE from_username = $1
        `, [username])

        const messages = []
        for (let row of request.rows) {
            const user = await User.get(row.to_username)
            const { first_name, last_name, phone, username } = user
            const { id, body, sent_at, read_at } = row
            messages.push({ id, to_user: { first_name, last_name, phone, username }, body, sent_at, read_at })
        }
        return messages
    }

    /** Return messages to this user.
     *
     * [{id, from_user, body, sent_at, read_at}]
     *
     * where from_user is
     *   {username, first_name, last_name, phone}
     */

    static async messagesTo(username) {
        const request = await db.query(`
          SELECT id, from_username, body, sent_at, read_at
          FROM messages
          WHERE to_username = $1
          `,
            [username])
        const messages = []
        for (let row of request.rows) {
            const user = await User.get(row.from_username)
            const { first_name, last_name, phone, username } = user
            const { id, body, sent_at, read_at } = row
            messages.push({ id, from_user: { first_name, last_name, phone, username }, body, sent_at, read_at })

        }
        return messages
    }
}


module.exports = User;
