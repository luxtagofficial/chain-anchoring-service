# Anchor proto

## Anchor object schema

| Name                   | Description                                        |
| ---------------------- | -------------------------------------------------- |
| description (optional) | Generic identifier                                 |
| version                | Anchor schema version                              |
| target                 | Target island type. One of `nem`, `btc`, or `eth`  |
| locks                  | Array of `Lock` objects. ***Minimum length of 1*** |

## Lock object schema

| Name                         | Description                                                 |
| ---------------------------- | ----------------------------------------------------------- |
| type                         | Ship type. One of `nem` or `eth`                            |
| version (optional)           | Current version of ship. Eg. NEM catapult will be `0.2.0.2` |
| name (optional)              | Ship identifier                                             |
| block                        | Object containing ship's data                               |
| lastKnownPosition (optional) | Transaction hash of the last anchor point to an island      |

## Block object schema

| Name           | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| height         | Current block height                                         |
| hash           | Block hash at current height                                 |
| timestamp      | Timestamp at current height                                  |
| uri (optional) | Array of uri's to check the validity of the block. It should provide a direct link to the block resource |

### Example anchor message in JSON format

```json
{
    "description": "LuxTag Chain Anchoring Service",
    "version": "1.0.0",
    "target": "eth",
    "locks": [
    {
        "type": "nem",
        "version": "0.2.0.2",
            "name": "LuxTag Private Chain X",
            "block": {
                "height": 1,
                "hash": "FAD4265E038881BC9772E69A…DD4FF86F191FD5F8C3AD566",
                "timestamp": 0,
                "uri": [
                    "http://localhost:3000/block/1"
                ]
            },
        "lastKnownPosition": ""
    },
    ... Anchor multiple private chains at once
    ]
}
```
