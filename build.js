const esbuild = require('esbuild');

const entryPoint = './src/index.js';

const buildConfig = {
  entryPoints: [entryPoint],
  bundle: true,
  minify: true,
  write: true,
  platform: 'browser',
  outfile: 'static/game.min.js',
  treeShaking: true,
  splitting: false,
  format: 'iife',
  plugins: [],
};

const isWatching = true;

(async () => {
  const watchPlugin = {
    name: 'watch-plugin',
    setup(build) {
      build.onStart(() => {
        console.log('Starting build...');
      });
      build.onEnd(() => {
        console.log('Build complete.');
      });
    }
  };

  const config = {
    ...buildConfig,
    plugins: isWatching ? [...buildConfig.plugins, watchPlugin] : buildConfig.plugins
  };

  const ctx = await esbuild.context(config);

  if (isWatching) {
    await ctx.watch();
  } else {
    await ctx.dispose();
  }
})();