//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

;(function() {
  // Baseline setup
  // 基本设置
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  // 建立环境变量 浏览器中是 windows 或者 服务端是 exports
  var root = this

  // Save the previous value of the `_` variable.
  // 保存先前的变量值 `_`
  var previousUnderscore = root._

  // Save bytes in the minified (but not gzipped) version:
  // 为了最大化压缩， 定义简写变量
  var ArrayProto = Array.prototype,
    ObjProto = Object.prototype,
    FuncProto = Function.prototype

  // Create quick reference variables for speed access to core prototypes.
  // 代码压缩
  // 提高效率 避免对原型链的查找次数
  var push = ArrayProto.push,
    slice = ArrayProto.slice,
    toString = ObjProto.toString,
    hasOwnProperty = ObjProto.hasOwnProperty

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  // 所有 ECMAScript 5 原生方法实例 浏览器支持则优先使用
  var nativeIsArray = Array.isArray,
    nativeKeys = Object.keys,
    nativeBind = FuncProto.bind,
    nativeCreate = Object.create

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function() {}

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj
    if (!(this instanceof _)) return new _(obj)
    this._wrapped = obj
  }

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  // 在 nodejs 中导出 underscore 对象，
  // 向后兼容旧的require()
  // 浏览器中 注册 `_` 为全局对象
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _
    }
    exports._ = _
  } else {
    root._ = _
  }

  // Current version.
  // 版本号
  _.VERSION = '1.8.3'

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  // underscore 中内部方法：返回一个快速的回调函数
  // func 用户定义的回调函数
  // context this 指向
  var optimizeCb = function(func, context, argCount) {
    // 没有设置this指向，直接返回用户回调。 void 0 === undefined （避免undefined被重新定义，压缩代码，逼格高）
    if (context === void 0) return func
    switch (argCount == null ? 3 : argCount) {
      case 1:
        return function(value) {
          return func.call(context, value)
        }
      case 2:
        return function(value, other) {
          return func.call(context, value, other)
        }
      case 3:
        return function(value, index, collection) {
          // 改变this指向，返回新的回调函数
          return func.call(context, value, index, collection)
        }
      case 4:
        // accumulator 累加值
        return function(accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection)
        }
    }
    return function() {
      return func.apply(context, arguments)
    }
  }

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  // 识别哪个方法去处理相应的回调
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity
    if (_.isFunction(value)) return optimizeCb(value, context, argCount)
    if (_.isObject(value)) return _.matcher(value)
    return _.property(value)
  }
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity)
  }

  // An internal function for creating assigner functions.
  // 有三个方法用到了这个内部函数
  // _.extend & _.extendOwn & _.defaults
  // _.extend = createAssigner(_.allKeys);
  // _.extendOwn = _.assign = createAssigner(_.keys);
  // _.defaults = createAssigner(_.allKeys, true);
  var createAssigner = function(keysFunc, undefinedOnly) {
    // 返回函数
    return function(obj) {
      // obj 只指传入所有参数的第一个， 更多的用arguments表示
      var length = arguments.length
      // 参数值0～1个 或者 null undefined， 直接返回该参数
      if (length < 2 || obj == null) return obj
      // 枚举各个参数
      for (var index = 1; index < length; index++) {
        // source 对应index的参数对象
        var source = arguments[index],
          // 获取对象参数的属性
          keys = keysFunc(source),
          // 对象keys的长度
          l = keys.length
        // 遍历该对象的所有属性
        for (var i = 0; i < l; i++) {
          // 具体key值
          var key = keys[i]
          // 第一种情况: 允许覆盖已有的
          // _.extend 和 _.extendOwn 没有传undefinedOnly
          // 故 !undefinedOnly 为 true， 执行条件。 这里的obj就是第一个参数对象
          // 后面对象的属性值覆盖第一个参数对象的属性值。
          // ================
          // 第二种情况: 不允许覆盖已有的
          // _.defaults ！undefinedOnly 为false ,
          // 则判断第一个对象中有该属性吗？没有则添加。
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key]
        }
      }
      return obj
    }
  }

  // An internal function for creating a new object that inherits from another.
  // 创建继承自另一个对象原型的新对象
  var baseCreate = function(prototype) {
    // prototype 是对象吗？
    if (!_.isObject(prototype)) return {}
    // 原生 ES5
    if (nativeCreate) return nativeCreate(prototype)
    // Ctor 空的 constructor
    // 原型赋值
    Ctor.prototype = prototype
    var result = new Ctor()
    Ctor.prototype = null // 清除以便下次重用
    return result // 新的对象已继承参数prototype
  }

  // 闭包
  var property = function(key) {
    return function(obj) {
      // 返回对象的属性值
      return obj == null ? void 0 : obj[key]
    }
  }

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  // 限制数组的最大长度
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1
  var getLength = property('length') // 闭包
  // 是不是类数组类型
  var isArrayLike = function(collection) {
    // 获取长度 array 返回数字 否则返回 undefined
    var length = getLength(collection)
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX
  }

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  // obj 数组、类数组、对象
  // iteratee 迭代方法 回调 （item, index, array） 或者 (value, key, object)
  // context 确定 iteratee 中 this 指向，可省略
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context)
    var i, length
    if (isArrayLike(obj)) {
      // 如果是数组
      for (i = 0, length = obj.length; i < length; i++) {
        // 出发迭代方法（item, index, array）
        iteratee(obj[i], i, obj)
      }
    } else {
      // 如果是对象
      // 获取所有键
      var keys = _.keys(obj)
      // 遍历 键
      for (i = 0, length = keys.length; i < length; i++) {
        // 回调参数(属性值， 键， 该对象) / (value, key, obj)
        iteratee(obj[keys[i]], keys[i], obj)
      }
    }
    return obj
  }

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context)
    // 是 Object 则输出所有属性，否则 undefined
    var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length, // 获取长度
      results = Array(length) // 创建一个长度为length的新空数组
    // 遍历
    for (var index = 0; index < length; index++) {
      // currentKey keys == true ? 获取对象属性值 : 数组序号
      var currentKey = keys ? keys[index] : index
      // 出发迭代方法
      // Object (value, key, obj)
      // Array (item, index, obj)
      results[index] = iteratee(obj[currentKey], currentKey, obj)
    }
    return results
  }

  // Create a reducing function iterating left or right.
  // dir 方向 1, -1(from right)
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index
        // (accumulator 累加值, value 值, index 键, collection 原始对象)
        // 执行回调， 返回累加值memo
        memo = iteratee(memo, obj[currentKey], currentKey, obj)
      }
      // 返回最终结果
      return memo
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4) // (accumulator, value, index, collection)
      // _.map 相同
      var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        // 1: 正向遍历  -1: 反向遍历
        index = dir > 0 ? 0 : length - 1
      // Determine the initial value if none is provided.
      // 如果传入的参数 0 ~ 2 个
      if (arguments.length < 3) {
        // memo 设置初始值，如果没有提供，则用obj第一个遍历的值
        memo = obj[keys ? keys[index] : index]
        // 确定已遍历了一次
        index += dir
      }
      return iterator(obj, iteratee, memo, keys, index, length)
    }
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1)

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1)

  // Return the first value which passes a truth test. Aliased as `detect`.
  // 返回匹配 predicate 为 true 找到的第一个值，并终止函数
  _.find = _.detect = function(obj, predicate, context) {
    var key
    if (isArrayLike(obj)) {
      // Array
      key = _.findIndex(obj, predicate, context)
    } else {
      // Object
      key = _.findKey(obj, predicate, context)
    }
    // key 不等于 undefined 并且 key 不等于 -1， 则返回值
    // 否则返回 undefined
    if (key !== void 0 && key !== -1) return obj[key]
  }

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  // 过滤数组或对象 返回所有满足( predicate 为 true )的新数组
  _.filter = _.select = function(obj, predicate, context) {
    var results = []
    predicate = cb(predicate, context)
    // 遍历
    _.each(obj, function(value, index, list) {
      // 符合条件的存入新数组 result
      if (predicate(value, index, list)) results.push(value)
    })
    //
    return results
  }

  // Return all the elements for which a truth test fails.
  // 返回与 (predicate 返回条件)相反的新数组
  // 相同的 callback， _.filter 返回符合条件的， _.reject (返回 _.filter 剩余的)
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context)
  }

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  // 判断是否所有的元素都满足条件，只要又一个不满足则为false
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context)
    var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index
      // predicate 函数中只要有一个不满足条件 返回 false， 并终止循环
      if (!predicate(obj[currentKey], currentKey, obj)) return false
    }
    // 所有条件都通过
    return true
  }

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  // 至少有一个满足条件则 返回true
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context)
    var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index
      // 满足条件 返回 true，终止循环
      if (predicate(obj[currentKey], currentKey, obj)) return true
    }
    // 没有一个满足条件的
    return false
  }

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  // 判断(数组或对象) obj 中是否包含给定值 item， === 全等判断
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    // 是对象 obj 为属性值数组
    if (!isArrayLike(obj)) obj = _.values(obj)
    if (typeof fromIndex != 'number' || guard) fromIndex = 0
    // 索引 >=0 值存在，返回 true；否则 false
    return _.indexOf(obj, item, fromIndex) >= 0
  }

  // Invoke a method (with arguments) on every item in a collection.
  // TODO:
  _.invoke = function(obj, method) {
    // method 之后的参数 args
    var args = slice.call(arguments, 2)
    // method 是函数吗?
    var isFunc = _.isFunction(method)
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method]
      return func == null ? func : func.apply(value, args)
    })
  }

  // Convenience version of a common use case of `map`: fetching a property.
  // map 的简化版本
  // 萃取`数组对象`中某属性值
  _.pluck = function(obj, key) {
    // _.property(key) 锁定 key 值 闭包
    // 遍历 返回指定key的属性值
    return _.map(obj, _.property(key))
  }

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  // filter 的简化版本
  // obj(数组对象) 找到所有匹配条件的数组对象， 所有相同键值对的对象
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs))
  }

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  // obj(数组对象) 找到第一个匹配条件的对象索引
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs))
  }

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity,
      lastComputed = -Infinity,
      value,
      computed
    // 单纯的找出最大值
    if (iteratee == null && obj != null) {
      // Array or Object values
      obj = isArrayLike(obj) ? obj : _.values(obj)
      for (var i = 0, length = obj.length; i < length; i++) {
        // 当前值
        value = obj[i]
        if (value > result) {
          // 最大值result
          result = value
        }
      }
    } else {
      // iteratee 为排序依据
      iteratee = cb(iteratee, context)
      _.each(obj, function(value, index, list) {
        // 返回需要比对的属性值
        computed = iteratee(value, index, list)
        if (computed > lastComputed || (computed === -Infinity && result === -Infinity)) {
          // result 该对象
          result = value
          lastComputed = computed
        }
      })
    }
    return result
  }

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity,
      lastComputed = Infinity,
      value,
      computed
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj)
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i]
        if (value < result) {
          result = value
        }
      }
    } else {
      iteratee = cb(iteratee, context)
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list)
        if (computed < lastComputed || (computed === Infinity && result === Infinity)) {
          result = value
          lastComputed = computed
        }
      })
    }
    return result
  }

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj)
    var length = set.length
    var shuffled = Array(length)
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index)
      if (rand !== index) shuffled[index] = shuffled[rand]
      shuffled[rand] = set[index]
    }
    return shuffled
  }

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj)
      return obj[_.random(obj.length - 1)]
    }
    return _.shuffle(obj).slice(0, Math.max(0, n))
  }

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context)
    return _.pluck(
      _.map(obj, function(value, index, list) {
        return {
          value: value,
          index: index,
          criteria: iteratee(value, index, list)
        }
      }).sort(function(left, right) {
        var a = left.criteria
        var b = right.criteria
        if (a !== b) {
          if (a > b || a === void 0) return 1
          if (a < b || b === void 0) return -1
        }
        return left.index - right.index
      }),
      'value'
    )
  }

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {}
      iteratee = cb(iteratee, context)
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj)
        behavior(result, value, key)
      })
      return result
    }
  }

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value)
    else result[key] = [value]
  })

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value
  })

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++
    else result[key] = 1
  })

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return []
    if (_.isArray(obj)) return slice.call(obj)
    if (isArrayLike(obj)) return _.map(obj, _.identity)
    return _.values(obj)
  }

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0
    return isArrayLike(obj) ? obj.length : _.keys(obj).length
  }

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context)
    var pass = [],
      fail = []
    _.each(obj, function(value, key, obj) {
      ;(predicate(value, key, obj) ? pass : fail).push(value)
    })
    return [pass, fail]
  }

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0
    if (n == null || guard) return array[0]
    return _.initial(array, array.length - n)
  }

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)))
  }

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0
    if (n == null || guard) return array[array.length - 1]
    return _.rest(array, Math.max(0, array.length - n))
  }

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n)
  }

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity)
  }

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [],
      idx = 0
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i]
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict)
        var j = 0,
          len = value.length
        output.length += len
        while (j < len) {
          output[idx++] = value[j++]
        }
      } else if (!strict) {
        output[idx++] = value
      }
    }
    return output
  }

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false)
  }

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1))
  }

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee
      iteratee = isSorted
      isSorted = false
    }
    if (iteratee != null) iteratee = cb(iteratee, context)
    var result = []
    var seen = []
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
        computed = iteratee ? iteratee(value, i, array) : value
      if (isSorted) {
        if (!i || seen !== computed) result.push(value)
        seen = computed
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed)
          result.push(value)
        }
      } else if (!_.contains(result, value)) {
        result.push(value)
      }
    }
    return result
  }

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true))
  }

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = []
    var argsLength = arguments.length
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i]
      if (_.contains(result, item)) continue
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break
      }
      if (j === argsLength) result.push(item)
    }
    return result
  }

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1)
    return _.filter(array, function(value) {
      return !_.contains(rest, value)
    })
  }

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments)
  }

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = (array && _.max(array, getLength).length) || 0
    var result = Array(length)

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index)
    }
    return result
  }

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {}
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i]
      } else {
        result[list[i][0]] = list[i][1]
      }
    }
    return result
  }

  // Generator function to create the findIndex and findLastIndex functions
  // dir = 1 正向查找； = -1 反向查找
  // use _.findIndex , _.findLastIndex
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context)
      var length = getLength(array)
      var index = dir > 0 ? 0 : length - 1
      for (; index >= 0 && index < length; index += dir) {
        // 执行 predicate 返回布尔值 找到匹配值后，立即返回。
        if (predicate(array[index], index, array)) return index
      }
      // 未找到值
      return -1
    }
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1)
  _.findLastIndex = createPredicateIndexFinder(-1)

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  // 二进制搜索算法
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1)
    var value = iteratee(obj)
    var low = 0,
      high = getLength(array)
    // 二分查找
    // https://zh.wikipedia.org/wiki/%E4%BA%8C%E5%88%86%E6%90%9C%E7%B4%A2%E7%AE%97%E6%B3%95
    while (low < high) {
      // 取中间值
      var mid = Math.floor((low + high) / 2)
      // 中间值小于给定值
      if (iteratee(array[mid]) < value) {
        // true => 搜索范围 (mid + 1) ～ high 之间
        low = mid + 1
      } else {
        // false => 范围 0 ～ mid 之间，所以 high = mid
        // 范围每次都缩小一半
        high = mid
      }
    }
    return low
  }

  // Generator function to create the indexOf and lastIndexOf functions
  // 生成查看索引函数
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      // 传进来的idx永远都是数字？？
      // fixed: 如果单独使用_.indexOf 第三个参数 idx = true, 采用二进制搜索
      var i = 0,
        length = getLength(array)
      // idx 是数字 idx > length return -1;
      if (typeof idx == 'number') {
        if (dir > 0) {
          // 重置查找的起始位置 idx可能为负值
          i = idx >= 0 ? idx : Math.max(idx + length, i)
        } else {
          // 反向查找的时候重新定义length
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item)
        return array[idx] === item ? idx : -1
      }
      // NaN !== NaN => true
      // 如果查找的是NaN类型
      if (item !== item) {
        // slice.call(array, i, length) 切割需要匹配的数组
        // 判断是否是NaN
        idx = predicateFind(slice.call(array, i, length), _.isNaN)
        return idx >= 0 ? idx + i : -1
      }
      // 上面已经判断了NaN特殊情况
      // 下面的判断可以用 ===
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        // 符合条件 则返回索引
        if (array[idx] === item) return idx
      }
      return -1
    }
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  // 返回第一个在数组中存在该值的索引index
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex)
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex)

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0
      start = 0
    }
    step = step || 1

    var length = Math.max(Math.ceil((stop - start) / step), 0)
    var range = Array(length)

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start
    }

    return range
  }

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args)
    var self = baseCreate(sourceFunc.prototype)
    var result = sourceFunc.apply(self, args)
    if (_.isObject(result)) return result
    return self
  }

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind)
      return nativeBind.apply(func, slice.call(arguments, 1))
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function')
    var args = slice.call(arguments, 2)
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)))
    }
    return bound
  }

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1)
    var bound = function() {
      var position = 0,
        length = boundArgs.length
      var args = Array(length)
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i]
      }
      while (position < arguments.length) args.push(arguments[position++])
      return executeBound(func, bound, this, this, args)
    }
    return bound
  }

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i,
      length = arguments.length,
      key
    if (length <= 1) throw new Error('bindAll must be passed function names')
    for (i = 1; i < length; i++) {
      key = arguments[i]
      obj[key] = _.bind(obj[key], obj)
    }
    return obj
  }

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache
      var address = '' + (hasher ? hasher.apply(this, arguments) : key)
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments)
      return cache[address]
    }
    memoize.cache = {}
    return memoize
  }

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2)
    return setTimeout(function() {
      return func.apply(null, args)
    }, wait)
  }

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1)

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result
    var timeout = null
    var previous = 0
    if (!options) options = {}
    var later = function() {
      previous = options.leading === false ? 0 : _.now()
      timeout = null
      result = func.apply(context, args)
      if (!timeout) context = args = null
    }
    return function() {
      var now = _.now()
      if (!previous && options.leading === false) previous = now
      var remaining = wait - (now - previous)
      context = this
      args = arguments
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        previous = now
        result = func.apply(context, args)
        if (!timeout) context = args = null
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining)
      }
      return result
    }
  }

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result

    var later = function() {
      var last = _.now() - timestamp

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last)
      } else {
        timeout = null
        if (!immediate) {
          result = func.apply(context, args)
          if (!timeout) context = args = null
        }
      }
    }

    return function() {
      context = this
      args = arguments
      timestamp = _.now()
      var callNow = immediate && !timeout
      if (!timeout) timeout = setTimeout(later, wait)
      if (callNow) {
        result = func.apply(context, args)
        context = args = null
      }

      return result
    }
  }

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func)
  }

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments)
    }
  }

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments
    var start = args.length - 1
    return function() {
      var i = start
      var result = args[start].apply(this, arguments)
      while (i--) result = args[i].call(this, result)
      return result
    }
  }

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments)
      }
    }
  }

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments)
      }
      if (times <= 1) func = null
      return memo
    }
  }

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2)

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString')
  var nonEnumerableProps = [
    'valueOf',
    'isPrototypeOf',
    'toString',
    'propertyIsEnumerable',
    'hasOwnProperty',
    'toLocaleString'
  ]

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length
    var constructor = obj.constructor
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto

    // Constructor is a special case.
    var prop = 'constructor'
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop)

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx]
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop)
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    // 非对象 返回空数组
    if (!_.isObject(obj)) return []
    // ES5 方法获取所有 key
    if (nativeKeys) return nativeKeys(obj)
    var keys = []
    // 如果上面不支持
    // 遍历对象key
    for (var key in obj) if (_.has(obj, key)) keys.push(key)
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys)
    return keys
  }

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return []
    var keys = []
    for (var key in obj) keys.push(key)
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys)
    return keys
  }

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj)
    var length = keys.length
    var values = Array(length)
    for (var i = 0; i < length; i++) {
      // 属性值
      values[i] = obj[keys[i]]
    }
    // 属性值组成的新数组
    return values
  }

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context)
    var keys = _.keys(obj),
      length = keys.length,
      results = {},
      currentKey
    for (var index = 0; index < length; index++) {
      currentKey = keys[index]
      results[currentKey] = iteratee(obj[currentKey], currentKey, obj)
    }
    return results
  }

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj)
    var length = keys.length
    var pairs = Array(length)
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]]
    }
    return pairs
  }

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {}
    var keys = _.keys(obj)
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i]
    }
    return result
  }

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = []
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key)
    }
    return names.sort()
  }

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys)

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys)

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context)
    // 获取所有的键
    var keys = _.keys(obj),
      key
    // 遍历
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i]
      // 执行回调
      if (predicate(obj[key], key, obj)) return key
    }
  }

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {},
      obj = object,
      iteratee,
      keys
    if (obj == null) return result
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj)
      iteratee = optimizeCb(oiteratee, context)
    } else {
      keys = flatten(arguments, false, false, 1)
      iteratee = function(value, key, obj) {
        return key in obj
      }
      obj = Object(obj)
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i]
      var value = obj[key]
      if (iteratee(value, key, obj)) result[key] = value
    }
    return result
  }

  // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee)
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String)
      iteratee = function(value, key) {
        return !_.contains(keys, key)
      }
    }
    return _.pick(obj, iteratee, context)
  }

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true)

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype)
    if (props) _.extendOwn(result, props)
    return result
  }

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj)
  }

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj)
    return obj
  }

  // Returns whether an object has a given set of `key:value` pairs.
  // 判断是否有给定`key:value`
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs),
      length = keys.length
    if (object == null) return !length
    var obj = Object(object)
    for (var i = 0; i < length; i++) {
      // key 键
      var key = keys[i]
      // 给定的 attrs 与 obj 中的不匹配
      // 或者 key 键在 obj 中没有，则返回 false
      if (attrs[key] !== obj[key] || !(key in obj)) return false
    }
    // 全匹配到
    return true
  }

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped
    if (b instanceof _) b = b._wrapped
    // Compare `[[Class]]` names.
    var className = toString.call(a)
    if (className !== toString.call(b)) return false
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b
    }

    var areArrays = className === '[object Array]'
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor,
        bCtor = b.constructor
      if (
        aCtor !== bCtor &&
        !(
          _.isFunction(aCtor) &&
          aCtor instanceof aCtor &&
          _.isFunction(bCtor) &&
          bCtor instanceof bCtor
        ) &&
        ('constructor' in a && 'constructor' in b)
      ) {
        return false
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || []
    bStack = bStack || []
    var length = aStack.length
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a)
    bStack.push(b)

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length
      if (length !== b.length) return false
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a),
        key
      length = keys.length
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false
      while (length--) {
        // Deep compare each member
        key = keys[length]
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop()
    bStack.pop()
    return true
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b)
  }

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)))
      return obj.length === 0
    return _.keys(obj).length === 0
  }

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1)
  }

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray =
    nativeIsArray ||
    function(obj) {
      return toString.call(obj) === '[object Array]'
    }

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj
    return type === 'function' || (type === 'object' && !!obj)
  }

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']'
    }
  })

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee')
    }
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false
    }
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj))
  }

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj
  }

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]'
  }

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null
  }

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0
  }

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  // 是否存在该属性 非原型链上的
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key)
  }

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore
    return this
  }

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value
  }

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value
    }
  }

  _.noop = function() {}

  _.property = property

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null
      ? function() {}
      : function(key) {
          return obj[key]
        }
  }

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  // 判断对象中是否有给定`键值对`
  _.matcher = _.matches = function(attrs) {
    // 复制一个版本
    attrs = _.extendOwn({}, attrs)
    return function(obj) {
      return _.isMatch(obj, attrs)
    }
  }

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n))
    iteratee = optimizeCb(iteratee, context, 1)
    for (var i = 0; i < n; i++) accum[i] = iteratee(i)
    return accum
  }

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min
      min = 0
    }
    return min + Math.floor(Math.random() * (max - min + 1))
  }

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now =
    Date.now ||
    function() {
      return new Date().getTime()
    }

  // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  }
  var unescapeMap = _.invert(escapeMap)

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match]
    }
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')'
    var testRegexp = RegExp(source)
    var replaceRegexp = RegExp(source, 'g')
    return function(string) {
      string = string == null ? '' : '' + string
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string
    }
  }
  _.escape = createEscaper(escapeMap)
  _.unescape = createEscaper(unescapeMap)

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property]
    if (value === void 0) {
      value = fallback
    }
    return _.isFunction(value) ? value.call(object) : value
  }

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0
  _.uniqueId = function(prefix) {
    var id = ++idCounter + ''
    return prefix ? prefix + id : id
  }

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  }

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  }

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g

  var escapeChar = function(match) {
    return '\\' + escapes[match]
  }

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings
    settings = _.defaults({}, settings, _.templateSettings)

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp(
      [
        (settings.escape || noMatch).source,
        (settings.interpolate || noMatch).source,
        (settings.evaluate || noMatch).source
      ].join('|') + '|$',
      'g'
    )

    // Compile the template source, escaping string literals appropriately.
    var index = 0
    var source = "__p+='"
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar)
      index = offset + match.length

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'"
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'"
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='"
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match
    })
    source += "';\n"

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n'

    source =
      "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source +
      'return __p;\n'

    try {
      var render = new Function(settings.variable || 'obj', '_', source)
    } catch (e) {
      e.source = source
      throw e
    }

    var template = function(data) {
      return render.call(this, data, _)
    }

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj'
    template.source = 'function(' + argument + '){\n' + source + '}'

    return template
  }

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj)
    instance._chain = true
    return instance
  }

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj
  }

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = (_[name] = obj[name])
      _.prototype[name] = function() {
        var args = [this._wrapped]
        push.apply(args, arguments)
        return result(this, func.apply(_, args))
      }
    })
  }

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_)

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name]
    _.prototype[name] = function() {
      var obj = this._wrapped
      method.apply(obj, arguments)
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0]
      return result(this, obj)
    }
  })

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name]
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments))
    }
  })

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped
  }

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value

  _.prototype.toString = function() {
    return '' + this._wrapped
  }

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _
    })
  }
}.call(this))
