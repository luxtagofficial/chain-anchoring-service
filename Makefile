.PHONY: install island ship export

include .env
export

# VARIABLES
PACKAGE="github.com/luxtagofficial/chain-anchoring-service"

# Compile .proto files
# usage: make proto
proto:
	protoc -I anchor --go_out=plugins=grpc:anchor anchor/anchor.proto

export:
	export $(cat .env | sed -e /^$/d -e /^#/d | xargs)

# Install go modules
# usage: make install
install:
	@go mod vendor

# Run island service
# usage: make run island type=<island endpoint type>
# example: make run island type=nem2
island:
	@go run island/${type}/main.go

# Run ship service
# usage: make run ship type=<island endpoint type>
# example: make run ship type=nem2
ship:
	@go run ship/${type}/main.go
