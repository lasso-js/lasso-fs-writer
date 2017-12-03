module.exports = exports = plugin;
import { ok } from "assert";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as sprom from "sprom";
import * as url from "url";
export default plugin;

/**
 * A lasso plugin which accepts a file system and writes to it instead of the default fs.
 *
 * @param lasso The current lasso instance.
 * @param config The config for the plugin.
 */
function plugin(lasso, config) {
  ok(config && config.fileSystem, "You must specify a file system option.");

  const { fileSystem: fs } = config;
  const { projectRoot, fileWriterConfig } = lasso.config;
  const { outputDir, urlPrefix } = fileWriterConfig;

  lasso.config.writer = {
    async writeBundle(reader, ctx, done) {
      try {
        const { bundle } = ctx;
        const filename = getRelativeBundlePath(projectRoot, ctx);
        const outputFile = path.join(outputDir, filename);
        const outputURL = url.resolve(urlPrefix + "/", filename);

        await writeStream(fs, outputFile, reader.readBundle());
        bundle.setWritten(true);
        bundle.url = outputURL;
        bundle.urlPrefix = urlPrefix;
        bundle.outputDir = outputDir;
        bundle.outputFile = outputURL;
        bundle.getUrl = getUrl.bind(bundle, bundle.getUrl);
        if (done) {
          done();
        }
      } catch (err) {
        // istanbul ignore next
        if (done) {
          return done(err);
        } else {
          throw err;
        }
      }
    },

    async writeResource(reader, ctx, done) {
      try {
        const filename = getRelativeResourcePath(projectRoot, ctx);
        const outputFile = path.join(outputDir, filename);
        const outputURL = url.resolve(urlPrefix + "/", filename);
        const result = { outputFile, url: outputURL };
        await writeStream(fs, outputFile, reader.readResource());

        if (done) {
          done(null, result);
        }

        return result;
      } catch (err) {
        // istanbul ignore next
        if (done) {
          return done(err);
        } else {
          throw err;
        }
      }
    }
  };
}

/**
 * Patch for getting bundle urls when processed by this plugin.
 */
function getUrl(original) {
  // istanbul ignore next
  return this.url || original.apply(this, arguments);
}

/**
 * Extracts and normalizes the relative path for a lasso bundle.
 */
function getRelativeBundlePath(dir, { bundle }) {
  if (bundle.relativeOutputPath) {
    const relativePath = bundle.relativeOutputPath.split("//").pop();
    const ext = path.extname(relativePath);
    return ext ? relativePath : `${relativePath}.${bundle.contentType}`;
  } else {
    return `${bundle.name}.${bundle.contentType}`;
  }
}

/**
 * Extracts and normalizes the relative path for a lasso resource.
 */
function getRelativeResourcePath(dir, ctx) {
  return ctx.path.replace(dir, ".");
}

/**
 * Writes a stream to the provided path at with the provided fs and makes sure the directory exists.
 */
function writeStream(fs, outputFile, stream) {
  return new Promise((resolve, reject) => {
    mkdirp(path.parse(outputFile).dir, { fs }, err1 => {
      if (err1) {
        return reject(err1);
      }

      sprom.buf(stream).then(data => {
        fs.writeFile(outputFile, data, err2 => {
          if (err2) {
            return reject(err2);
          }

          resolve();
        });
      }, reject);
    });
  });
}
