FROM golang:alpine as builder
RUN apk update && apk add --no-cache ca-certificates git
WORKDIR /build
COPY ship.go .
RUN go get -d -v
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -ldflags '-w -s' -o /go/bin/ship

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /go/bin/ship /go/bin/ship
CMD ["/go/bin/ship"]