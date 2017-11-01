var _ = require('./underscore')

function log(val) {
  console.log(val)
  return val
}
_(['a', 3]).each(log)
