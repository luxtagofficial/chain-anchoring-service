FROM golang:alpine as builder
RUN apk update && apk add --no-cache git
WORKDIR /build
COPY ship.go .
RUN go get -d -v
RUN go build -o /go/bin/ship
CMD ["/go/bin/ship"]