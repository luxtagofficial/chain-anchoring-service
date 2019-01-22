package main

import (
	"context"
	"log"
	"net"

	pb "github.com/luxtagofficial/chain-anchoring-service/anchor"
	"google.golang.org/grpc"
	"google.golang.org/grpc/peer"
)

const (
	port = ":50051"
)

// server is used to implement helloworld.GreeterServer.
type server struct{}

// SayHello implements helloworld.GreeterServer
func (s *server) Location(ctx context.Context, in *pb.Lock) (*pb.CallSign, error) {
	p, _ := peer.FromContext(ctx)
	log.Printf("From [%v]: %v", p.Addr, in)
	return &pb.CallSign{Id: p.Addr.String()}, nil
}

func main() {
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterAnnounceServer(s, &server{})
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
