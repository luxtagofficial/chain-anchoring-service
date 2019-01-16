package anchor

import (
	"fmt"
	"time"

	"github.com/proximax-storage/nem2-sdk-go/sdk"
)

const (
	wsURL       = "wss://api.iium.luxtag.io/ws"
	networkType = sdk.MijinTest
)

func main() {
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
		start = time.Now()
	}
}
