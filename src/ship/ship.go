package main

import (
	"context"
	"fmt"
	"log"
	"time"

	pb "github.com/luxtagofficial/chain-anchoring-service/anchor"
	"github.com/proximax-storage/nem2-sdk-go/sdk"
	"google.golang.org/grpc"
)

const (
	wsURL       = "wss://api.iium.luxtag.io/ws"
	networkType = sdk.MijinTest
	address     = "localhost:50051"
)

func main() {
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
	ws, err := sdk.NewConnectWs(wsURL, 0)
	if err != nil {
		panic(err)
	}

	fmt.Println("websocket negotiated uid:", ws.Uid)
	// The block channel notifies for every new block.
	// The message contains the block information.
	chBlock, err := ws.Subscribe.Block()
	if err != nil {
		panic(err)
	}

	fmt.Println("Height\tTxs\tSigner\tBlock Hash\tPrevious Hash\tTime Elapsed")
	for {
		data := <-chBlock.Ch
		elapsed := time.Since(start)
		fmt.Printf(
			"%v\t%v\t%v\t%v\t%v\t%s\n",
			data.Height,
			data.NumTransactions,
			data.Signer.PublicKey[0:5],
			data.Hash[0:8],
			data.PreviousBlockHash[0:8],
			elapsed)
		lock := &pb.Lock{
			Type:    pb.IslandType_nem,
			Version: "0.2.0.2",
			Name:    "LuxTag X Chain",
			Block: &pb.Block{
				Height:    data.Height.String(),
				Hash:      data.Hash,
				Timestamp: data.Timestamp.String(),
			},
		}
		_, err := c.Location(context.Background(), lock)
		if err != nil {
			log.Fatalf("could not greet: %v", err)
		}
		start = time.Now()
	}
}
