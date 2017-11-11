var _ = require('./underscore')

// function log(val) {
//   console.log(val)
//   return val
// }
// _(['a', 3]).each(log)
// _.extend({ name: 'moe' }, { age: 50 })

// var names = ['Rebeka', 'Roxanne', 'Annalise', 'Devon', 'Sibyl']
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
// console.log(_.flatten([1, [2], [3, [[4]]]]))
// console.log(_.union([1, 2, 3], [101, [3, 4], 2, 1, 10], [2, 1]) + '')
// _.unzip([['moe', 'larry', 'curly'], [30, 40, 50], [true, false, false]])
// var func = function(greeting) {
//   console.log(arguments)
//   return greeting + ': ' + this.name
// }
// func = new _.bind(func, { name: 'moe' }, 'hi')

// // console.log(func())
// var add = function(a, b) {
//   return a + b
// }
// add5 = _.partial(add, 5)
// add5(10)
// var fibonacci = _.memoize(function(n) {
//   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2)
// })
// fibonacci(4)

// var store = {
//   nextId: 1,
//   cache: {},
//   add: function(fn) {
//     if (!fn.id) {
//       fn.id = this.nextId++
//       return !!(this.cache[fn.id] = fn)
//     }
//   }
// }
// function ninja() {}
// console.log(store.add(ninja), 1)
// console.log(store.add(ninja), 2)
// _.delay(function() {
//   console.log(1)
// }, 1000)
// var count = 0
// var doCount = _.before(3, function() {
//   return ++count
// })
// console.log(doCount())
// console.log(doCount())
// console.log(doCount())
// console.log(doCount())
// var count = 0
// console.log(_.now())
// var deb = _.debounce(
//   function() {
//     console.log(++count)
//     console.log(_.now())
//   },
//   2000,
//   false
// )
// deb()
// deb()
// deb()
// deb()
// deb()
// console.log(NaN !== NaN)
// console.log(isNaN(NaN))
// console.log(isFinite(NaN))

console.log(_.isObject(undefined))
