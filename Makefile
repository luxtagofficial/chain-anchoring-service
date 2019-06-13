include .env
export

# VARIABLES
PACKAGE="github.com/luxtagofficial/chain-anchoring-service"

# Compile .proto files
# usage: make proto
proto: proto-go proto-island-nem proto-inspector-nem proto-inspector-nem2 proto-skipper-nem2

proto-go:
	@echo "*****Generating proto go files*****"
	protoc -I anchor --go_out=plugins=grpc:anchor anchor/anchor.proto

# Ensure installation of protoc-gen-grpc-web plugin
# https://github.com/grpc/grpc-web#code-generator-plugin
proto-web:
	@echo "*****Generating proto grpc-web files*****"
	protoc -I=./anchor anchor.proto --js_out=import_style=commonjs:./anchor --grpc-web_out=import_style=commonjs+dts,mode=grpcweb:./anchor

proto-island-nem:
	@echo "*****Island nem package*****"
	@cd ${PWD}/island/nem/ && \
	yarn run proto

proto-inspector-nem:
	@echo "*****Inspector nem package*****"
	@cd ${PWD}/inspector/nem/ && \
	yarn run proto

proto-inspector-nem2:
	@echo "*****Inspector nem2 package*****"
	@cd ${PWD}/inspector/nem2/ && \
	yarn run proto

proto-skipper-nem2:
	@echo "*****Skipper nem2 package*****"
	@cd ${PWD}/skipper/nem2/ && \
	yarn run proto

export:
	export $(cat .env | sed -e /^$/d -e /^#/d | xargs)

# Install go modules
# usage: make install
install: install-go-mod install-island-nem install-inspector-nem install-inspector-nem2

install-go-mod:
	@echo "*****Fetching go packages*****"
	go mod vendor

install-island-nem:
	@echo "*****Island nem package*****"
	@cd ${PWD}/island/nem/ && \
	yarn install

install-inspector-nem:
	@echo "*****Inspector nem package*****"
	@cd ${PWD}/inspector/nem/ && \
	yarn install

install-inspector-nem2:
	@echo "*****Inspector nem2 package*****"
	@cd ${PWD}/inspector/nem2/ && \
	yarn install

# Run island service
# usage: make run island type=<island endpoint type>
# example: make run island type=nem2
island: island-${type}

# Run ship service
# usage: make run ship type=<ship endpoint type>
# example: make run ship type=nem2
ship:
	@go run ship/${type}/main.go

# Run inspector service
# usage: make run ship type=<inspector endpoint type>
# example: make run inspector type=nem2
inspector: inspector-${type}

# Run skipper service
# usage: make run ship type=<skipper endpoint type>
# example: make run skipper type=nem2
skipper: skipper-${type}

island-nem:
	@echo "*****Running Island nem package*****"
	@cd ${PWD}/island/nem/ && \
	yarn run dev

island-nem2:
	@echo "*****Running Island nem2 package*****"
	@go run ${PWD}/island/nem2/main.go

inspector-nem:
	@echo "*****Running Inspector nem package*****"
	@cd ${PWD}/inspector/nem/ && \
	yarn run dev

inspector-nem2:
	@echo "*****Running Inspector nem2 package*****"
	@cd ${PWD}/inspector/nem2/ && \
	yarn run dev

skipper-nem2:
	@echo "*****Running Skipper nem2 package*****"
	@cd ${PWD}/skipper/nem2/ && \
	yarn run dev

.PHONY: install install-go-mod install-island-nem install-inspector-nem install-inspector-nem2
.PHONY: ship export
.PHONY: island island-nem island-nem2
.PHONY: inspector inspector-nem inspector-nem2
.PHONY: skipper skipper-nem skipper-nem2
