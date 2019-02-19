# LuxTag Public Chain Anchoring Service

The goal of chain anchoring is to secure the data integrity of a smaller private chain to a larger public chain for audibility without the high cost of transactions on a public chain.

Private chains provide the ability to scale number of transactions, lowering the cost per transaction and protects the privacy of the data. Public chains are more resilient to manipulation, where every transactions are validated.

The use of blockchain is mainly to show two things:

  1. That the data exists at a certain point of time; and
  2. That the data did not change after that point of time.

Placing all transactions on a public blockchain will guarantee that every single transaction existed at a certain point of time and did not change after that time. However, in most cases it is sufficient to show prove that data up to a certain point of time (at the time of anchoring) is valid and did not change.

We will designate the public blockchain as islands and the private blockchain as ships.

## Quick start

Copy `.env.example` to `.env`

Run `docker-compose up`

## How to build

Make sure you have go installed (https://golang.org/doc/install)

Download the repository
```
go get -u github.com/luxtagofficial/chain-anchoring-service
```

To use the default settings, rename `.env.example` to `.env`, then
```
export $(grep -v '^#' .env | xargs -d '\n')
```

Start the server
```
make island
```

Start the client
```
make ship
```