const GeoJsonGenerator = require('geojson-random');
const prompt = require('prompt');
const request = require('request');

// Bounding box for US
var usBoundingBox = [-124.0576171875, 47.69497434186282, -80.4638671875, 26.15543796871355];

var uploadStatusArr = [];
// inputs to be collected
const properties = [{
        name: 'noOfSamples',
        validator: /^[0-9]+$/,
        warning: 'must be a number'
    },
    {
        name: 'subscriptionKey',
    }
];

try {

    prompt.start();

    prompt.get(properties, function (err, result) {
        if (err) {
            console.error(err);
            return 1;
        }
        console.log('  No of desired UDIds: ' + result.noOfSamples);

        for (let i = 0; i < result.noOfSamples; i++) {
            var noOfVertices = Math.floor(10 + (Math.random() * 10));
            var randomGeoJson = GeoJsonGenerator.polygon(1, noOfVertices, 2, usBoundingBox);
            randomGeoJson.features[0].properties.geometryId = Math.floor((Math.random() * 100) + 1000).toString();
            uploadGeoJson(randomGeoJson, result.subscriptionKey);
        }

        setTimeout(() => {
            uploadStatusArr.forEach(element => {
                request(element, (error, udidResponse, udidBody) => {
                    if (error) {
                        return console.error('Get failed:', error);
                    }
                    var udidBodyObject = JSON.parse(udidBody);
                    console.log(`${udidBodyObject.udid}`);
                });
            });

        }, 1500);

    });
} catch (e) {
    console.error(e);
}

function uploadGeoJson(geoJson, subscriptionKey) {
    request({
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        uri: `https://t-azmaps.azurelbs.com/mapData/upload?subscription-key=${subscriptionKey}&api-version=1.0&dataFormat=geojson`,
        body: JSON.stringify(geoJson)
    }, (err, response, body) => {
        if (err) {
            return console.error('upload failed:', err);
        }

        if (response.statusCode != 202) {
            return console.error('upload failed:', body);
        }

        uploadStatusArr.push(`${response.headers.location}&subscription-key=${subscriptionKey}`);

    });
}