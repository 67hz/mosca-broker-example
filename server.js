var mosca = require('mosca'),
    redis = require('redis'),
    redisClient = redis.createClient();

var pubsubSettings = {
    type: 'redis',
    redis: redis,
    db: 7,
    port: 6379,
    return_buffers: true,
    host: 'localhost'
};

var moscaSettings = {
    port: 1883,
    backend: pubsubSettings,
    persistence: {
        factory: mosca.persistence.Redis
    }
};

var server = new mosca.Server(moscaSettings);
server.on('ready', setup);

server.on('clientConnected', function(client) {
    console.log('client connected client.id: ', client.id);
    console.log('client connected client: ', client);
});

function deviceInHandler(packet, client) {
    var appId = packet.topic.split('/')[1];

    console.log('deviceIn: clientId', client.id);
    console.log('deviceIn: topic: ', packet.topic);
    console.log('deviceIn: topicId: ', packet.topic.split('/')[1]);
    
    // add user to redis and serialized payload
    redisClient.sadd('user:' + appId, packet.payload);

    redisClient.publish('add user', 'user:'+ appId);
}

function deviceOutHandler(packet, client) {
    var appId = packet.topic.split('/')[1];
    console.log('deviceOut: clientId', client.id);
    console.log('deviceOut: topic: ', packet.topic);


    // @TODO: check if id existed before delete
    // if not return error
    redisClient.del('user:' + appId);
    
    redisClient.publish('remove user', 'user:' + appId);
}

server.on('clientDisconnected', function(client) {
    console.log('client disconnected client.id: ', client.id);
});

// fired when message received
server.on('published', function(packet, client) {
    console.log('published packet: ', packet);

    //match in/out topics

    // device in : connected
    if (packet.topic.match(/in\/\d+/)) {
        deviceInHandler(packet, client);
    }

    // device out: disconnected
    if (packet.topic.match(/out\/\d+/)) {
        deviceOutHandler(packet, client);
    }


});


// fired when mqtt server is ready
function setup() {
    console.log('mosca server up and running');
}

// test if string is parseable as JSON obj
function tryParseJSON (jsonString) {
    try {
        var o = JSON.parse(jsonString);

        if (o && typeof(o) === 'object' && o !== null) {
            return o;
        }
    }
    catch (e) {
        console.log('caught non obj string', jsonString);
        console.log('error: ', e);
    }

    return false;
}
