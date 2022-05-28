# Tajinaste Auth

Authentication provider service for [Tajinaste Manager](https://github.com/pedroetb/tajinaste-manager).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Sponsor](https://img.shields.io/badge/-Sponsor-fafbfc?logo=GitHub%20Sponsors)](https://github.com/sponsors/pedroetb)

## Variables

### Preset variables

These variables already have a default value set, but you can overwrite it in your environment before running the service:

* **PGHOST**: Remote PostgreSQL database host (default: `db`).
* **PGPORT**: Remote PostgreSQL database port (default: `5432`).
* **PGUSER**: Remote PostgreSQL database user (default: `postgres`).
* **PGDATABASE**: Remote PostgreSQL database name (default: `tajinaste`).
* **EXPIRY_MINUTES**: Generated tokens lifetime, expressed in minutes (default: `240`, 4 hours).

### Secret variables

You must set these variables in your environment before running the service:

* **PGPASSWORD**: PostgreSQL database password for user *PGUSER* (default: `changeme`).
* **PRIVATE_JWK**: Private key used to sign the JWT provided to users. It must be a single-lined valid JWK.

## Key generation (JWK)

To generate a public/private key pair in JWK format, use a utility like [latchset/jose](https://github.com/latchset/jose).

Install and use it from shell:

```sh
apt install jose

jose jwk gen -i '{"alg": "RS256"}' -o rsa.jwk
jose jwk pub -i rsa.jwk -o rsa.jwk.pub

# now rsa.jwk.pub contains the public key, and rsa.jwk the private key
```

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

This project is released under the [MIT License](LICENSE).
