.PHONY: install island ship

include .env

# VARIABLES
PACKAGE="github.com/luxtagofficial/chain-anchoring-service"

# Compile .proto files
# usage: make proto
proto:
	protoc -I anchor --go_out=plugins=grpc:anchor anchor/anchor.proto

# Install go modules
# usage: make install
install:
	@go mod vendor

# Run island service
# usage: make run island type=<island endpoint type>
# example: make run island type=nem2
island:
	@go run island/${type}/island.go

# Run ship service
# usage: make run ship type=<island endpoint type>
# example: make run ship type=nem2
ship:
	@go run ship/${type}/ship.go
