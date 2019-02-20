package main

import (
	"context"
	"log"
	"net"
	"os"
	"time"

	"github.com/golang/protobuf/jsonpb"
	pb "github.com/luxtagofficial/chain-anchoring-service/anchor"
	"github.com/luxtagofficial/nem2-sdk-go/sdk"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"google.golang.org/grpc"
	"google.golang.org/grpc/peer"
)

const (
	port = ":50051"
)

type server struct{}

var config *sdk.Config
var client *sdk.Client
var privateKey string
var endpoint string
var networkType sdk.NetworkType
var signer *sdk.Account

func (s *server) generateAnchor(lock *pb.Lock) (anchor *pb.Anchor) {
	anchor = &pb.Anchor{
		Description: "LuxTag Chain Anchoring Service",
		Version:     "1.0.0",
		Target:      pb.IslandType_nem,
		Locks: []*pb.Lock{
			lock,
		},
	}
	return
}

func (s *server) announceAnchor(anchor *pb.Anchor) *sdk.SignedTransaction {
	m := jsonpb.Marshaler{}

	// Convert to JSON
	result, _ := m.MarshalToString(anchor)

	tx, err := sdk.NewTransferTransaction(
		sdk.NewDeadline(time.Hour*2),
		signer.Address,
		[]*sdk.Mosaic{},
		sdk.NewPlainMessage(result),
		networkType,
	)
	if err != nil {
		log.Fatalf("NewTransferTransaction throw: %v", err)
	}
	signedTx, err := signer.Sign(tx)
	if err != nil {
		log.Fatalf("Sign throw: %v", err)
	}
	resp, _ := client.Transaction.Announce(context.Background(), signedTx)
	log.Println(resp)
	return signedTx
}

func (s *server) Location(ctx context.Context, lock *pb.Lock) (*pb.CallSign, error) {
	// Diagnostics
	p, _ := peer.FromContext(ctx)
	log.Printf("From [%v]: %v", p.Addr, lock.Block.Height)

	anchor := s.generateAnchor(lock)
	signedTx := s.announceAnchor(anchor)

	return &pb.CallSign{Id: signedTx.Hash.String()}, nil
}

func main() {
	// Fetch variables
	viper.SetEnvPrefix("island")
	viper.AutomaticEnv()
	pflag.String("type", "", "Island Blockchain type")
	pflag.String("endpoint", "", "Endpoint url")
	pflag.String("privatekey", "", "Private key of account to send the transaction from")
	pflag.String("networktype", "", "Endpoint network type")
	pflag.Parse()
	viper.BindPFlags(pflag.CommandLine)

	viper.SetDefault("endpoint", "http://localhost:3000/")
	viper.SetDefault("privatekey", "")
	viper.SetDefault("type", "")
	viper.SetDefault("networktype", "MIJIN_TEST")

	t := viper.GetString("type")

	privateKey = viper.GetString("privatekey")
	endpoint = viper.GetString("endpoint")
	networkType = sdk.NetworkTypeFromString(viper.GetString("networktype"))
	signer, _ = sdk.NewAccountFromPrivateKey(privateKey, networkType)

	switch t {
	case "nem":
		config, _ = sdk.NewConfig(endpoint, networkType)
		client = sdk.NewClient(nil, config)
	default:
		log.Println("Invalid blockchain type.\n\nTry running `island --type nem`")
		os.Exit(1)
	}

	// Start grpc server
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	log.Printf("Island listening on %v", port)
	s := grpc.NewServer()
	pb.RegisterAnnounceServer(s, &server{})
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
