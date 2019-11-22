const colors = require("ansi-colors");
const log = require("fancy-log");
const OBS = require('./obs')


class OBSPlugin extends OBS {
  constructor(options) {
    super(options)
  }

  apply(compiler) {
    if (this.config.accessKeyId && this.config.secretAccessKey) {
      if (!this.config.output && this.config.local) {
        const output = compiler.outputPath || compiler.options.output.path;
        if (output) {
          this.config.output = output
        } else {
          throw new Error(`请配置配置output`)
        }
      }
      if (compiler.hooks) {
        compiler.hooks.done.tapAsync("OBSPlugin", this.upload.bind(this));
      } else {
        compiler.plugin("done", this.upload.bind(this));
      }
    } else {
      log(colors.red(`请填写正确的accessKeyId、secretAccessKey和bucket`));
    }
  }

  upload(compilation, callback) {
    const { format, deleteAll } = this.config;
    if (compilation) {
      this.assets = compilation.compilation.assets;
    }
    this.uploadAssets();
    if (typeof callback === "function") {
      callback();
    }
  }
}

exports.OBS = OBS;

module.exports = OBSPlugin;