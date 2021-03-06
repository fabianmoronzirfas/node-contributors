var exec = require('child_process').exec
  , uniq = require('lodash.uniq')

var LogStream = require('./log_stream')

exports.authors = function (dir, callback) {
  var emails = []
    , names = {}

  var standardError

  var log = exec('git log --pretty="%an <%ae>"', { cwd: dir })
  .once('error', function (err) {
    callback(err)
  })
  .once('close', function () {
    if (standardError) {
      return callback(errorException(standardError, 'GITError'))
    }

    var authors = uniq(emails)
    .map(function (email) {
      return {
        name: names[email]
      , email: email
      }
    })

    callback(null, authors)
  })

  log.stdout.pipe(new LogStream())
  .on('data', function (author) {
    emails.unshift(author.email)
    names[author.email] = author.name
  })
  .once('error', function (err) {
    callback(err)
  })

  log.stderr.setEncoding('utf8')
  log.stderr.once('data', function (err) {
    standardError = err
    log.kill()
  })
}

function errorException(message, code) {
  var e = new Error(message)
  if (code) e.name = e.code = e.errno = code
  return e
}
