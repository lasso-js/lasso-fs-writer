module.exports = exports = plugin;
import { ok } from "assert";
import * as _mkdirp from "mkdirp";
import { basename, join, parse, extname } from "path";
import * as sprom from "sprom";
import { resolve } from "url";
import { promisify } from "util";
export default plugin;
const mkdir = promisify(_mkdirp);

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
        const outputFile = join(outputDir, filename);
        const outputURL = resolve(urlPrefix + "/", filename);

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
        const outputFile = join(outputDir, filename);
        const outputURL = resolve(urlPrefix + "/", filename);
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
function getRelativeBundlePath (dir, { bundle }) {
  if (bundle.relativeOutputPath) {
    const relativePath = bundle.relativeOutputPath.split('//').pop();
    const ext = extname(relativePath);
    return ext ? relativePath : `${relativePath}.${bundle.contentType}`
  } else {
    return `${bundle.name}.${bundle.contentType}`;
  }
}

/**
 * Extracts and normalizes the relative path for a lasso resource.
 */
function getRelativeResourcePath (dir, ctx) {
  return ctx.path.replace(dir, ".");
}

/**
 * Writes a stream to the provided path at with the provided fs and makes sure the directory exists.
 */
async function writeStream (fs, outputFile, stream) {
  await mkdir(parse(outputFile).dir, { fs });
  await promisify(fs.writeFile.bind(fs))(outputFile, await sprom.buf(stream));
}
