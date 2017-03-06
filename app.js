'use strict'

const reekoh = require('reekoh')
const _plugin = new reekoh.plugins.Service()

const isPlainObject = require('lodash.isplainobject')
const isEmpty = require('lodash.isempty')
const get = require('lodash.get')
const request = require('request')
const isNan = require('lodash.isnan')

_plugin.on('data', (data) => {
  if (!isPlainObject(data)) {
    _plugin.log(JSON.stringify({
      title: 'Microsoft Text Analytics Service',
      message: 'Invalid data received.'
    }))
    return _plugin.logException(new Error(`Invalid data received. Must be a valid JSON Object. Data: ${data}`))
  }

  if (isEmpty(data) || isEmpty(get(data, 'documents'))) {
    _plugin.log(JSON.stringify({
      title: 'Microsoft Text Analytics Service',
      message: 'No documents.'
    }))
    return _plugin.logException(new Error(`Invalid data received. Data must have a documents fields. Data: ${data}`))
  }

  let sendRequest = (url, body) => {
    request.post({
      url: url,
      json: body,
      headers: {
        'Ocp-Apim-Subscription-Key': _plugin.config.apiKey
      }
    }, (error, response, body) => {
      if (error) {
        console.error(error)
        _plugin.logException(error)
      }
      _plugin.pipe(data, JSON.stringify({result: body}))
        .then(() => {
          _plugin.log(JSON.stringify({
            title: 'Microsoft Text Analytics Service',
            data: data,
            result: body
          }))
        })
        .catch((error) => {
          _plugin.logException(error)
        })
    })
  }

  if (_plugin.config.operationType === 'Detect Language') {
    let url = data.numberOfLanguagesToDetect || 1
    let numberOfLanguages = data.numberOfLanguagesToDetect || 1

    url = `${_plugin.config.apiEndPoint}/languages?numberOfLanguagesToDetect=${numberOfLanguages}`
    sendRequest(url, {documents: data.documents})
  } else if (_plugin.config.operationType === 'Detect Topics') {
    let url = `${_plugin.config.apiEndPoint}/topics`

    if (!isNan(get(data.minDocumentsPerWord))) {
      url += `?minDocumentsPerWord=${data.minDocumentsPerWord}`
      if (!isNan(get(data.maxDocumentsPerWord))) {
        url += `&maxDocumentsPerWord=${data.maxDocumentsPerWord}`
      }
    } else if (!isNan(get(data.maxDocumentsPerWord))) {
      url += `?maxDocumentsPerWord=${data.maxDocumentsPerWord}`
    }

    if (isEmpty(get(data, 'stopWords'))) {
      data.stopWords = []
    }

    if (isEmpty(get(data, 'topicsToExclude'))) {
      data.topicsToExclude = []
    }

    sendRequest(url, {
      stopWords: data.stopWords,
      topicsToExclude: data.topicsToExclude,
      documents: data.documents
    })
  } else if (_plugin.config.operationType === 'Key Phrases') {
    sendRequest(`${_plugin.config.apiEndPoint}/keyPhrases`, {documents: data.documents})
  } else {
    sendRequest(`${_plugin.config.apiEndPoint}/sentiment`, {documents: data.documents})
  }
})

_plugin.once('ready', () => {
  _plugin.log('Microsoft Text Analytics Service has been initialized.')
  _plugin.emit('init')
})

module.exports = _plugin
