/* A test client for the mosca broker */

var mqtt = require('mqtt'),
    host = '127.0.0.1',
    client = mqtt.createClient(1883, host);

client.subscribe('messages');

client.on('messages', function(topic, message) {
    console.log(message);

});

var dispatch = setInterval(function() {
    client.publish('messages', 'hello world');
}, 3000);

// client.end();
