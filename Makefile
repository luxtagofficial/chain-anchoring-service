# VARIABLES
PACKAGE="github.com/luxtagofficial/chain-anchoring-service"

default: usage

island: ## Run server
	@go run src/island/island.go

ship: ## Run client
	@go run src/ship/ship.go

proto: ## Compile .proto files
	protoc -I anchor --go_out=plugins=grpc:anchor anchor/anchor.proto

usage: ## List available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
