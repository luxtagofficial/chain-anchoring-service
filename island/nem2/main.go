//  Copyright 2019 Luxtag Sdn.Bhd. (Malaysia)

//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

package main

import (
	"context"
	"log"
	"net"
	"time"

	"github.com/golang/protobuf/jsonpb"
	pb "github.com/luxtagofficial/chain-anchoring-service/anchor"
	"github.com/luxtagofficial/nem2-sdk-go/sdk"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"google.golang.org/grpc"
	"google.golang.org/grpc/peer"
)

type server struct{}

var config *sdk.Config
var client *sdk.Client
var privateKey string
var endpoint string
var networkType sdk.NetworkType
var signer *sdk.Account
var port string

func (s *server) generateAnchor(lock *pb.Lock) (anchor *pb.Anchor) {
	anchor = &pb.Anchor{
		Description: "LuxTag Chain Anchoring Service",
		Version:     "1.0.1",
		Target:      pb.IslandType_nem2,
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
	viper.SetEnvPrefix("island_nem2")
	viper.AutomaticEnv()
	pflag.String("endpoint", "", "Endpoint url")
	pflag.String("privatekey", "", "Private key of account to send the transaction from")
	pflag.String("networktype", "", "Endpoint network type")
	pflag.String("port", ":50051", "Endpoint network type")
	pflag.Parse()
	viper.BindPFlags(pflag.CommandLine)

	viper.SetDefault("endpoint", "http://localhost:3000/")
	viper.SetDefault("privatekey", "")
	viper.SetDefault("networktype", "MIJIN_TEST")
	viper.SetDefault("port", ":50051")

	privateKey = viper.GetString("privatekey")
	endpoint = viper.GetString("endpoint")
	networkType = sdk.NetworkTypeFromString(viper.GetString("networktype"))
	signer, _ = sdk.NewAccountFromPrivateKey(privateKey, networkType)
	port := viper.GetString("port")

	// Start grpc server
	config, _ = sdk.NewConfig(endpoint, networkType)
	client = sdk.NewClient(nil, config)
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
