var _ = require('./underscore')

// function log(val) {
//   console.log(val)
//   return val
// }
// _(['a', 3]).each(log)
// _.extend({ name: 'moe' }, { age: 50 })

var names = ['Rebeka', 'Roxanne', 'Annalise', 'Devon', 'Sibyl']
// _.reduce(
//   names,
//   function(memo, value, index, arr) {
//     return memo + ' ' + value
//   },
//   'a'
// )

// var findKeyValue = _.find(
//   { name: 23 },
//   function(val, key, obj) {
//     var z = this
//     return obj[key] === '89'
//   },
//   { other: 343 }
// )
// _.contains(names, 'Jack', -4)
var sorted = [3, 43, 54, 56, 77, 88, 99]
_.contains(sorted, 54, true)
