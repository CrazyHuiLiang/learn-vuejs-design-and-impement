# 非原始值的响应式方案

> https://www.processon.com/v/693a2b4b03c7d01fdf9ffe73

## 5.3

has() 拦截 in 操作，ownKeys() 拦截 for...in 操作，deleteProperty() 拦截 delete 操作
因为 for...in 操作不涉及特定key的操作，所以使用 ITERATE_KEY 进行依赖捕获，添加新属性和删除属性时会影响 for...in 的结果，所以此情况应该 trigger ITERATE_KEY 相关的副作用函数的执行


