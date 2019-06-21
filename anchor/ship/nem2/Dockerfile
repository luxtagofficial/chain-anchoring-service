FROM golang:alpine as builder
ARG SRC_DIR="."
RUN apk update && apk add --no-cache ca-certificates git protobuf
WORKDIR /build
COPY go.mod go.sum ./
COPY anchor anchor
COPY vendor vendor
COPY ${SRC_DIR}/main.go ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -mod=vendor -a -ldflags '-w -s' -o /go/bin/ship main.go

FROM scratch
LABEL MAINTAINER="Jonathan Tey <jonathan@luxtag.io>"
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /go/bin/ship /go/bin/ship
CMD ["/go/bin/ship"]