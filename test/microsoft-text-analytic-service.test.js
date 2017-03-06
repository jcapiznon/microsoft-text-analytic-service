'use strict'

const amqp = require('amqplib')

let _app = null
let _channel = null
let _conn = null

describe('Microsoft Text Analytic Service', function () {
  this.slow(5000)

  before('init', () => {
    process.env.OUTPUT_PIPES = 'Op1,Op2'
    process.env.LOGGERS = 'logger1,logger2'
    process.env.EXCEPTION_LOGGERS = 'exlogger1,exlogger2'
    process.env.BROKER = 'amqp://guest:guest@127.0.0.1/'
    process.env.CONFIG = '{"apiKey": "41d85f79072d43c6b42c91c40dbd04f0", "operationType": "Detect Language", "apiEndPoint":"https://westus.api.cognitive.microsoft.com/text/analytics/v2.0"}'
    process.env.INPUT_PIPE = 'demo.pipe.service'
    process.env.OUTPUT_SCHEME = 'RESULT'
    process.env.OUTPUT_NAMESPACE = 'RESULT'
    process.env.ACCOUNT = 'demo account'

    amqp.connect(process.env.BROKER)
      .then((conn) => {
        _conn = conn
        return conn.createChannel()
      }).then((channel) => {
      _channel = channel
    }).catch((err) => {
      console.log(err)
    })
  })

  after('terminate child process', function (done) {
    _conn.close()
    done()
  })

  describe('#start', function () {
    it('should start the app', function (done) {
      this.timeout(8000)
      _app = require('../app')
      _app.once('init', done)
    })
  })

  describe('#data', () => {
    it('should process the data and send back a result', function (done) {
      this.timeout(11000)

      let requestId = (new Date()).getTime().toString()
      let dummyData = { documents: [{ id: `${requestId}`, 'text': 'How will the holding prophet poke a directive? A south rushs toward a business girl. The crunched intimate swallows underneath the synonymous bite. How does the rotten swallow indulge before the exhibit? The leaning neighbor thinks. The contributor reflects the lasting visit against the resemblance.'}] }
      _channel.sendToQueue('demo.pipe.service', new Buffer(JSON.stringify(dummyData)))

      setTimeout(done, 10000)
    })
  })
})
