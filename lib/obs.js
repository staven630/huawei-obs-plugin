const fs = require("fs");
const path = require("path");
const ObsClient = require("esdk-obs-nodejs");
const colors = require("ansi-colors");
const log = require("fancy-log");
const utils = require('./utils');
const regexp = utils.regexp;

class OBS {
  constructor(options) {
    if (Object.prototype.toString.call(options) !== '[object Object]') {
      throw new Error(`配置信息应该是Object`)
    }

    this.config = Object.assign({
      prefix: '',
      exclude: null,
      format: null,
      deleteAll: false,
      output: '',
      local: false,
      limit: 5
    }, options)

    if (['accessKeyId', 'secretAccessKey', 'bucket', 'server'].some(key => !options[key])
    ) {
      throw new Error(`请填写正确的accessKeyId、secretAccessKey、bucket、server`)
    }

    if (this.config.format && !/[0-9]+/.test(this.config.format)) {
      throw new Error(`format应该是纯数字`)
    }
    const { accessKeyId, secretAccessKey, server } = this.config;
    this.client = new ObsClient({
      access_key_id: accessKeyId,
      secret_access_key: secretAccessKey,
      server
    });

    this.fileList = {};
  }

  static getFormat(format = 'YYYYMMDDhhmm') {
    if (!regexp.test(format)) {
      throw new Error(`参数格式由纯数字或YYYY、YY、MM、DD、HH、hh、mm、SS、ss组成`)
    }
    return utils.formatDate(new Date(), format);
  }

  upload() {
    this.uploadAssets()
  }

  async asyncForEach(arr, cb) {
    for (let i = 0; i < arr.length; i++) {
      await cb(arr[i], i)
    }
  }

  async delAssets() {
    try {
      const { prefix, bucket } = this.config;
      let options = prefix ? {
        Prefix: prefix
      } : {};

      const result = await this.client.listObjects({
        Bucket: bucket,
        MaxKeys: 1000,
        ...options
      });

      if (result.InterfaceResult.Contents) {
        const filters = result.InterfaceResult.Contents.filter(name => {
          return !this.fileList[name.Key]
        });
        if (filters.length) {
          const delRes = await this.client.deleteObjects({
            Bucket: bucket,
            Quiet: false,
            Objects: filters
          })
          if (delRes.CommonMsg.Status < 300 && delRes.InterfaceResult) {
            // 获取删除成功的对象 
            for (let i = 0; i < delRes.InterfaceResult.Deleteds.length; i++) {
              log(colors.blue(`删除 ${delRes.InterfaceResult.Deleteds[i]['Key']} 成功!`));
            }
            // 获取删除失败的对象 
            for (let i = 0; i < delRes.InterfaceResult.Errors.length; i++) {
              log(colors.red(`删除 ${delRes.InterfaceResult.Errors[i]['Key']} 失败!`));
            }
          } else {
            log(colors.red(`删除旧文件失败!`));
          }
        }

      }
    } catch (error) {
    }

  }

  async uploadAssets() {
    const { local, output, deleteAll } = this.config;
    if (local) {
      await this.uploadLocale(output);
    } else {
      await this.asyncForEach(Object.keys(this.assets), async (name) => {
        if (this.filterFile(name)) {
          await this.updateContent(name, Buffer.from(this.assets[name].source(), "utf8"));
        }
      })
    }
    if (deleteAll) {
      await this.delAssets()
    }
  }

  filterFile(name) {
    const { exclude } = this.config;
    return (
      !exclude ||
      ((Array.isArray(exclude) && !exclude.some(item => item.test(name))) ||
        (!Array.isArray(exclude) && !exclude.test(name)))
    );
  }

  getFileName(name) {
    const { config } = this;
    const prefix = config.format
      ? path.join(config.prefix, config.format.toString())
      : config.prefix;
    let fileName = path.join(prefix, name).replace(/\\/g, "/");
    return fileName && fileName[0] === '/' ? fileName.substr(1) : fileName;
  }

  async update(name, content) {
    const fileName = this.getFileName(name);
    if (this.config.deleteAll) {
      this.fileList[fileName] = true;
    }

    try {
      const result = await this.client.putObject({
        Bucket: this.config.bucket,
        Key: fileName,
        SourceFile: content
      });

      if (+result.CommonMsg.Status === 200) {
        log(colors.green(`${fileName}上传成功!`));
      } else {
        log(colors.red(`${fileName}上传失败!`));
      }
    } catch (error) {
      log(colors.red(`${fileName}上传失败!`));
    }
  }

  async updateContent(name, content) {
    const fileName = this.getFileName(name);
    if (this.config.deleteAll) {
      this.fileList[fileName] = true;
    }

    try {
      const result = await this.client.putObject({
        Bucket: this.config.bucket,
        Key: fileName,
        Body: content
      });

      if (+result.CommonMsg.Status === 200) {
        log(colors.green(`${fileName}上传成功!`));
      } else {
        log(colors.red(`${fileName}上传失败!`));
      }
    } catch (error) {
      log(colors.red(`${fileName}上传失败!`));
    }
  }

  async uploadLocale(dir) {
    const { output } = this.config;
    const result = fs.readdirSync(dir);
    await this.asyncForEach(result, async file => {
      const filePath = path.join(dir, file);
      if (this.filterFile(filePath)) {
        if (fs.lstatSync(filePath).isDirectory()) {
          await this.uploadLocale(filePath);
        } else {
          const fileName = filePath.slice(output.length);
          await this.update(fileName, filePath);
        }
      }
    })
  }
}

module.exports = OBS;