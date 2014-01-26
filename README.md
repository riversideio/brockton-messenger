### Brockton Messenger

This is a simple node app that talks to [Arlington Access](https://github.com/riversideio/arlington-access) and [Victoria Club](https://github.com/riversideio/victoria-club) and helps our doors talk to our databases.

### Install

First you will need [nodeJs](http://nodejs.org), there are some good examples of how to install all dependencies besides node on the [serialport.js](https://npmjs.org/package/serialport) readme.

```
git clone https://github.com/riversideio/brockton-messenger.git
cd brockton-messenger
npm install
```

Once that is setup create a `.env` file with a configuration in that file like the example below, but using your enviroments settings.

```
API=https://victoria-club.herokuapp.com/api/v0/
SERIALPORT=/dev/ttyUSB0
SERIALAUTH=logincreds
```
### Running

```
[sudo] node index.js
```

you might need sudo depending on you install of `node`

### What does it do

Not a whole lot right now, right now its mostly getting setup to allow for differnt end points. You can use this to debug the RFID card reader. 

TODO: Serial Events from Serial lib.

