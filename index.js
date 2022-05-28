const express = require('express'),
	bodyParser = require('body-parser'),
	cors = require('cors'),
	jwt = require('jsonwebtoken'),
	jwkToPem = require('jwk-to-pem'),
	{ Pool } = require('pg');

const packageJson = require('./package.json'),
	port = process.env.PORT || 3000,
	expiry = process.env.EXPIRY_MINUTES || 240,
	jwk = process.env.PRIVATE_JWK;

if (!jwk) {
	console.error('You must declare "PRIVATE_JWK" env. variable, using a private JWK object as a single line string:');
	console.error('  $ export PRIVATE_JWK=\'{ "alg": "RS256", ... }\'');
	process.exit(1);
}
const rsaPrivateKey = jwkToPem(JSON.parse(jwk), { private: true });

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.route('/health')
	.get((_req, res) => res.sendStatus(200));

app.route('/login')
	.post(loginCallback);

app.route('/change-password')
	.post(changePasswordCallback);

app.listen(port, () => {

	console.log('Tajinaste Auth v%s', packageJson.version);
	console.log('Listening on port %d', port);
});

const pool = new Pool();

pool.on('error', (err) => {

	console.error('Unexpected error on idle client', err);
});

function loginCallback(req, res) {

	const email = req.body.email,
		password = req.body.password;

	validateEmailAndPassword(email, password)
		.then(onValidUserReturnToken.bind(null, res), () => res.sendStatus(401));
}

function validateEmailAndPassword(email, password) {

	return new Promise((resolve, reject) => {

		pool.connect((connectErr, client, done) => {

			if (connectErr) {
				console.error('Database connection error', connectErr);
				reject(connectErr);
				return;
			}

			client.query(`SELECT * FROM login('${email}', '${password}')`, (queryErr, res) => {

				done();

				if (queryErr) {
					console.error(queryErr.stack);
					reject(queryErr);
					return;
				}

				const result = res.rows[0];
				if (result) {
					resolve(result);
				} else {
					console.error('Got no user data', res);
					reject(res);
				}
			});
		});
	});
}

function onValidUserReturnToken(res, validUserData) {

	const role = validUserData.role,
		email = validUserData.email,
		uuid = validUserData.uuid,
		name = validUserData.name,
		photo = validUserData.photo;

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

function changePasswordCallback(req, res) {

	const email = req.body.email,
		oldPassword = req.body.oldPassword,
		newPassword = req.body.newPassword;

	validateEmailAndPassword(email, oldPassword)
		.then(onValidUserChangePassword.bind(null, newPassword))
		.then(() => res.sendStatus(200))
		.catch(() => res.sendStatus(401));
}

function onValidUserChangePassword(newPassword, validUserData) {

	const email = validUserData.email;

	return new Promise((resolve, reject) => {

		pool.connect((connectErr, client, done) => {

			if (connectErr) {
				console.error('Database connection error', connectErr);
				reject(connectErr);
				return;
			}

			client.query(`UPDATE auth.users SET password = '${newPassword}' WHERE email = '${email}'`, (queryErr, res) => {

				done();

				if (queryErr) {
					console.error(queryErr.stack);
					reject(queryErr);
					return;
				}

				if (res.rowCount === 1) {
					resolve(res);
				} else {
					console.error('User not found', res);
					reject(res);
				}
			});
		});
	});
}
