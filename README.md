# LuxTag Chain Anchoring Service

## Anchoring

The goal of chain anchoring is to secure the data integrity of a smaller private chain to a larger public chain for audibility without the high cost of transactions on a public chain.

Private chains provide the ability to scale number of transactions, lowering the cost per transaction and protects the privacy of the data. Public chains are more resilient to manipulation, where every transactions are validated.

The use of blockchain is mainly to show two things:

  1. That the data exists at a certain point of time; and
  2. That the data did not change after that point of time.

Placing all transactions on a public blockchain will guarantee that every single transaction existed at a certain point of time and did not change after that time. However, in most cases it is sufficient to show prove that data up to a certain point of time (at the time of anchoring) is valid and did not change.

We will designate the public blockchain as **islands** and the private blockchain as **ships**.

## Verifying

Verification service will run in two parts, an **inspector** service that generates a list of block headers stored on the public blockchain, and a **skipper** that fetches block headers from the private blockchain for the inspector to verify.

### Generic overview of verifier functions

1. Fetch transaction payload
2. Parse payload to anchor format
3. Show list of locks found
4. Sort by height and chain
5. For each anchor, ask ship for anchor at height
6. Compare and display

## How to run

For details on how to use this project see [HOW-TO-BUILD.md](./HOW-TO-BUILD.md)