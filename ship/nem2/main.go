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
	"math/big"
	"time"

	pb "github.com/luxtagofficial/chain-anchoring-service/anchor"
	"github.com/luxtagofficial/nem2-sdk-go/sdk"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"google.golang.org/grpc"
)

var (
	ws          *sdk.ClientWebsocket
	wsURL       string
	name        string
	networkType sdk.NetworkType
	version     string
	checkpoint  = big.NewInt(0)
	targetBlock = big.NewInt(0)
)

func main() {
	// Fetch variables
	viper.SetEnvPrefix("ship_nem2")
	viper.AutomaticEnv()
	pflag.String("dock", "", "Island gRPC url")
	pflag.String("name", "", "Ship Blockchain name")
	pflag.String("version", "", "Ship Blockchain version")
	pflag.String("wsendpoint", "", "Endpoint url")
	pflag.String("networktype", "", "Endpoint network type")
	pflag.Int("checkpoint", 1, "Checkpoint every X blocks")
	pflag.Parse()
	viper.BindPFlags(pflag.CommandLine)

	viper.SetDefault("dock", "localhost:50051")
	viper.SetDefault("name", "")
	viper.SetDefault("version", "")
	viper.SetDefault("wsendpoint", "ws://localhost:3000/ws")
	viper.SetDefault("networktype", "MIJIN_TEST")
	viper.SetDefault("checkpoint", 1)

	address := viper.GetString("dock")
	wsURL = viper.GetString("wsendpoint")
	name = viper.GetString("name")
	networkType = sdk.NetworkTypeFromString(viper.GetString("networktype"))
	version = viper.GetString("version")
	checkpoint = big.NewInt(viper.GetInt64("checkpoint"))

	// Set up a connection to the server.
	conn, err := grpc.Dial(address, grpc.WithInsecure())
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	c := pb.NewAnnounceClient(conn)

	// Timing
	start := time.Now()

	// Websocket
	ws, err = sdk.NewConnectWs(wsURL, 0)
	if err != nil {
		panic(err)
	}
	log.Println("websocket negotiated uid:", ws.Uid)
	// The block channel notifies for every new block.
	// The message contains the block information.
	chBlock, err := ws.Subscribe.Block()
	if err != nil {
		panic(err)
	}
	for {
		data := <-chBlock.Ch
		elapsed := time.Since(start)

		log.Printf("New block height %v\n", data.Height)
		log.Printf("Time since last block %v\n", elapsed)
		if targetBlock.Cmp(data.Height) > 0 {
			log.Printf("Skip sending block %v, next target block is %v\n", data.Height, targetBlock)
		} else {
			lock := &pb.Lock{
				Type:    pb.IslandType_nem2,
				Version: version,
				Name:    name,
				Block: &pb.Block{
					Hash:      data.Hash,
					Timestamp: data.Timestamp.String(),
					Height:    data.Height.String(),
				},
			}
			txHash, err := c.Location(context.Background(), lock)
			if err != nil {
				log.Fatalf("could not greet: %v", err)
			}
			targetBlock = data.Height.Add(data.Height, checkpoint)
			log.Printf("Received hash: %v\n", txHash.Id)
			log.Printf("Next target block is %v\n", targetBlock)
		}
		start = time.Now()
	}
}
