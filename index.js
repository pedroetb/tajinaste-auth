const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const { Pool } = require('pg');

const port = process.env.PORT || 3000;
const expiry = process.env.EXPIRY_MINUTES || 240;
const jwk = process.env.PRIVATE_JWK;

if (!jwk) {
	console.error('You must declare "PRIVATE_JWK" env. variable, using a private JWK object as a single line string:');
	console.error('  $ export PRIVATE_JWK=\'{ "alg": "RS256", ... }\'');
	process.exitCode = 1;
	return;
}
const rsaPrivateKey = jwkToPem(JSON.parse(jwk), { private: true });

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.route('/login')
	.post(loginCallback);

app.listen(port);

const pool = new Pool();

pool.on('error', (err, client) => {

	console.error('Unexpected error on idle client', err);
});

function loginCallback(req, res) {

	const email = req.body.email;
	const password = req.body.password;

	validateEmailAndPassword(email, password)
		.then(onValidUser.bind(null, res), () => res.sendStatus(401));
}

function validateEmailAndPassword(email, password) {

	return new Promise((resolve, reject) => {

		pool.connect((err, client, done) => {

			if (err) {
				console.error('Database connection error', err);
				reject(err);
				return;
			}

			client.query(`SELECT * FROM login('${email}', '${password}')`, (err, res) => {

				done();

				if (err) {
					console.error(err.stack);
					reject(err);
					return;
				}

				const result = res.rows[0];
				if (result) {
					resolve(result);
				} else {
					console.error('Got no user data', result);
					reject(res);
				}
			});
		});
	});
}

function onValidUser(res, validUserData) {

	const role = validUserData.role;
	const email = validUserData.email;
	const uuid = validUserData.uuid;
	const name = validUserData.name;
	const photo = validUserData.photo;

	const jwtBearerToken = jwt.sign({
		role, email
	}, rsaPrivateKey, {
		algorithm: 'RS256',
		expiresIn: `${expiry}m`,
		subject: uuid
	});

	res.status(200).json({
		token: jwtBearerToken,
		expiresIn: expiry,
		role, email, name, photo
	});
}
