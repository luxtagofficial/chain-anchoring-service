## Anchoring

### Prerequisites

Requires a minimum version of `go@1.11`

### Quick start

```sh
# Copy `.env.example` to `.env`
cp .env.example .env

# Install go dependencies
make install

# Start docker compose
docker-compose up
```

### How to build

Make sure you have go installed (https://golang.org/doc/install)

Install dependencies (Ubuntu)
```
sudo apt install make gcc
```

Clone the repository
```
git clone https://github.com/luxtagofficial/chain-anchoring-service.git
```

To use the default settings, rename `.env.example` to `.env`
```
cp .env.example .env
```

Then export the variables to shell
```
export $(grep -v '^#' .env | xargs -d '\n')
# or
make export
```

Start the server
```
make island type=nem2
```

Start the client
```
make ship type=nem2
```
