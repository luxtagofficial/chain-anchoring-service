CAS Inspector can be used as grpc or rest. If `skipper` param passed without `http` or `https` prefix, it's considered as grpc endpoint and the inspector will use grpc skipper.

staging example:

[GET]
https://cas-inspector.luxtagofficial.now.sh/nem2/1?endpoint=https://api.iium.luxtag.io&publicKey=397A6BF3CA20A37DAA4A53C7BD0FFD3AE3824F1F2F956255543C8C15B141840D&networkType=MIJIN_TEST&skipper=https://cas-skipper-bcm.luxtagofficial.now.sh/nem2

[POST]
curl 'https://cas-inspector.luxtagofficial.now.sh/api/anchors' -d \
'{
  "inspector": {
    "name": "IIUM Private Chain",
    "type": "NEM2",
    "endpoint": "https://api.iium.luxtag.io",
    "networkType": "MIJIN_TEST",
    "account": "397A6BF3CA20A37DAA4A53C7BD0FFD3AE3824F1F2F956255543C8C15B141840D"
  },
  "skipper": {
    "name": "BCM Private Chain",
    "type": "NEM2",
    "endpoint": "https://cas-skipper-bcm.luxtagofficial.now.sh/nem2"
  }
}'