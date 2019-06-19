CAS Inspector can be used as grpc or rest. If `skipper` param passed without `http` or `https` prefix, it's considered as grpc endpoint and the inspector will use grpc skipper.

staging example:

Example 2: POST
curl 'https://cas-inspector.luxtagofficial.now.sh/api/anchors' -d \
'{
  "inspector": {
    "name": "IIUM Private Chain",
    "type": "NEM2",
    "island": "https://api.iium.luxtag.io",
    "meta": {
      "networkType": "MIJIN_TEST",
      "account": "397A6BF3CA20A37DAA4A53C7BD0FFD3AE3824F1F2F956255543C8C15B141840D"
    }
  },
  "skipper": {
    "name": "BCM Private Chain",
    "type": "NEM2",
    "endpoint": "https://cas-skipper.luxtagofficial.now.sh/bcm"
  }
}'

Example 3: POST (with different meta)
curl 'https://cas-inspector.luxtagofficial.now.sh/api/anchors' -d \
'{
  "inspector": {
    "name": "NEM Public Chain",
    "type": "NEM",
    "island": "http://bigalice2.nem.ninja:7890",
    "meta": {
      "address": "TAW4I4GOJEAAZX7K3MDPW4MWB25VLGOLRFZLPVRY"
    }
  },
  "skipper": {
    "name": "BCM Private Chain",
    "type": "NEM2",
    "endpoint": "https://cas-skipper.luxtagofficial.now.sh/bcm"
  }
}'


Chain info example:

curl -XPOST localhost:3000/api/chain/info -d '{"type":"nem2","endpoint":"https://api.iium.luxtag.io"}'

Each POST has GET equivalent in same path. Pass the json as `payload` param, ie.

```
http://localhost:3000/api/chain/info?payload={"type":"nem","endpoint":"http://bigalice2.nem.ninja:7890"}
```