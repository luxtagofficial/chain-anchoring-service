# LuxTag Public Chain Anchoring Service

The goal of chain anchoring is to secure the data integrity of a smaller private chain to a larger public chain for audibility without the high cost of transactions on a public chain.

Private chains provide the ability to scale number of transactions, lowering the cost per transaction and protects the privacy of the data. Public chains are more resilient to manipulation, where every transactions are validated.

The use of blockchain is mainly to show two things:

  1. That the data exists at a certain point of time; and
  2. That the data did not change after that point of time.

Placing all transactions on a public blockchain will guarantee that every single transaction existed at a certain point of time and did not change after that time. However, in most cases it is sufficient to show prove that data up to a certain point of time (at the time of anchoring) is valid and did not change.

We will designate the public blockchain as islands and the private blockchain as ships.

## Prerequisites

Requires a minimum version of `go@1.11`

## Quick start

```sh
# Copy `.env.example` to `.env`
cp .env.example .env

# Install go dependencies
make install

# Start docker compose
docker-compose up
```

## How to build

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
```

Start the server
```
make island type=nem2
```

Start the client
```
make ship type=nem2
```