FROM golang:alpine as builder
RUN apk update && apk add --no-cache ca-certificates git protobuf
WORKDIR /build
COPY go.mod go.sum ./
COPY anchor anchor
COPY vendor vendor
COPY ./island/nem2/main.go ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -mod=vendor -a -ldflags '-w -s' -o /go/bin/island main.go

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /go/bin/island /go/bin/island
CMD ["/go/bin/island"]