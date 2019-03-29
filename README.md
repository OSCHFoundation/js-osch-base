# Osch Stellar Base

osch-base库是一个更加底层的oschain工具库，它包括读，写，hash，和签名xdr结构。这个实现可以被用在node或者浏览器。

## Quick start

使用npm安装js-osch-base到你的项目：

```shell
npm install --save stellar-base
```

在浏览器中直接引用OschBase包，它将导出一个变量OschBase,实例如下：

```html
<script src="osch-base.js"></script>
<script>
  console.log(OschBase);
</script>
```

## 安装

### 作为一个node模块使用

1. 用npm安装

```shell
npm install --save osch-base
```

2. require/import该包到项目中

```js
var StellarBase = require('osch-base');
```

### 在浏览器中使用

1. 引入浏览器

```html
<script src="osch-base.js"></script>
<script>
  console.log(OschBase);
</script>
```


### To use the [cdnjs](https://cdnjs.com/libraries/stellar-base) hosted script in the browser

1. Instruct the browser to fetch the library from
   [cdnjs](https://cdnjs.com/libraries/stellar-base), a 3rd party service that
   hosts js libraries:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/stellar-base/{version}/stellar-base.js"></script>
<script>
  console.log(StellarBase);
</script>
```