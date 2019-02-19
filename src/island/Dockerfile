FROM golang:alpine as builder
RUN apk update && apk add --no-cache git
WORKDIR /build
COPY island.go .
RUN go get -d -v
RUN go build -o /go/bin/island
CMD ["/go/bin/island"]