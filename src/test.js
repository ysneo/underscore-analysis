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
// var sorted = [3, 43, 54, 56, 77, 88, 99]
// _.contains(sorted, 54, true)
// var stooges = [{ name: 'moe', age: 40 }, { name: 'larry', age: 50 }, { name: 'curly', age: 60 }]
// _.max(stooges, function(stooge) {
//   return stooge.age
// })

// _.shuffle([1, 2, 3, 4, 5, 6])
// var stooges = [{ name: 'moe', age: 40 }, { name: 'larry', age: 50 }, { name: 'curly', age: 60 }]
// _.sortBy(stooges, 'name')

// console.log(_.last([5, 4, 3, 2, 1], 2))
console.log(_.flatten([1, [2], [3, [[4]]]]))
