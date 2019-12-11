# [huawei-obs-plugin](https://github.com/staven630/huawei-obs-plugin)

> 静态资源一键上传华为云 obs 插件。可单独作为 node.js 库使用，也可作为 webpack 插件 （兼容 webpack3.x 以上版本）

# 安装

```
npm i huawei-obs-plugin --save-dev
```

# 参数

| 选项名          | 类型                 | 是否必填 | 默认值 | 描述                                                                                                                  |
| :-------------- | :------------------- | :------- | :----- | :-------------------------------------------------------------------------------------------------------------------- |
| accessKeyId     | String               | √        |        | 华为云 Access Key Id（AK）：访问密钥 ID                                                                               |
| secretAccessKey | String               | √        |        | 华为云 Secret Access Key（SK）：与访问密钥 ID 结合使用的私有访问密钥                                                  |
| bucket          | String               | √        |        | 华为云 bucket                                                                                                         |
| server          | String               | √        | ''     | [终端节点（Endpoint)](https://developer.huaweicloud.com/endpoint?OBS)                                                 |
| prefix          | String               | ×        | ''     | 自定义路径前缀，通常使用项目目录名，文件将存放在 obs 的 bucket/prefix 目录下                                          |
| format          | Number               | ×        | ''     | 可用时间戳来生成 obs 目录版本号，每次会保留最近的版本文件做零宕机发布。可以通过插件自身提供的静态方法 getFormat()获得 |
| deleteAll       | Boolean              | ×        |        | 是否删除 bucket 或 bucket/prefix 中所有旧文件。                                                                       |
| local           | Boolean              | ×        | false  | 默认每次上传 webpack 构建流中文件，设为 true 可上传打包后 webpack output 指向目录里的文件                             |
| output          | String               | ×        | ''     | 读取本地目录的路径，如果 local 为 true，output 为空，默认为读取 webpack 输出目录                                      |
| exclude         | ExpReg/Array<ExpReg> | ×        | null   | 可传入正则，或正则组成的数组，来排除上传的文件                                                                        |

# 静态方法

> static getFormat()

&emsp;&emsp;参数又由 YYYY|YY|MM|DD|HH|hh|mm|SS|ss 组合而成，返回一个纯数字。
|

```javascript
const OBSPlugin = require("huawei-obs-plugin");

OBSPlugin.getFormat();
OBSPlugin.getFormat("YYYY");
```

# 实例

- 使用 webpack 构建流文件上传，并删原有所有资源

```javascript
const OBSPlugin = require("huawei-obs-plugin");

new OBSPlugin({
  accessKeyId: "2****************9",
  secretAccessKey: "z**************=",
  bucket: "staven",
  prefix: "nuxt-doc", // "staven/nuxt-doc/icon_696aaa22.ttf"
  exclude: [/.*\.html$/], // 或者 /.*\.html$/,排除.html文件的上传
  deleteAll: true // 删除旧文件
});
```

- 使用打包后的本地文件上传

```javascript
const OBSPlugin = require("huawei-obs-plugin");
const path = require("path");

new OBSPlugin({
  accessKeyId: "2****************9",
  secretAccessKey: "z**************=",
  server: "https://obs.cn-east-2.myhuaweicloud.com",
  bucket: "staven",
  prefix: "nuxt-doc", // "staven/nuxt-doc/icon_696aaa22.ttf"
  exclude: [/.*\.html$/], // 或者 /.*\.html$/,排除.html文件的上传
  local: true,
  output: path.resolve(__dirname, "./build") // 此项不填，将默认指向webpack/vue-cli等工具输出目录
});
```

- 使用 format 做版本备份

```javascript
const OBSPlugin = require('huawei-obs-plugin')
const time = OBSPlugin.getFormat('YYMMDD')

new OBSPlugin({
  accessKeyId: "2****************9",
  secretAccessKey: "z**************=",
  server: "https://obs.cn-east-2.myhuaweicloud.com",
  bucket: "staven",
  prefix: 'nuxt-doc',   // "staven/nuxt-doc/icon_696aaa22.ttf"
  exclude: [/.*\.html$/], // 或者 /.*\.html$/,排除.html文件的上传
  deleteAll: false,	  // 不删除旧文件
  format: time， // 备份最近版本的obs文件
  local: true,   // 上传打包输出目录里的文件
  limit: 10  // 备份版本数量
})
```

# 单独使用

&emsp;&emsp;可以不结合 webpack，单独作为 node.js 库使用。

```javascript
const OBSPlugin = require("huawei-obs-plugin");
const path = require("path");

new OBSPlugin({
  accessKeyId: "2****************9",
  secretAccessKey: "z**************=",
  server: "https://obs.cn-east-2.myhuaweicloud.com",
  bucket: "staven",
  exclude: null,
  deleteAll: true,
  output: path.resolve(__dirname, "./src"),
  local: true
}).upload();
```
