const gulp = require('gulp');
const prefix = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass')(require('sass'));
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const argv = require("yargs").argv;

/* ----------------------------------------- */
/*  Compile Sass
/* ----------------------------------------- */

// Small error handler helper function.
function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}

const SYSTEM_SCSS = ["scss/**/*.scss"];
function compileScss() {
  // Configure options for sass output. For example, 'expanded' or 'nested'
  let options = {
    outputStyle: 'expanded'
  };
  return gulp.src(SYSTEM_SCSS)
    .pipe(sourcemaps.init())
    .pipe(
      sass(options)
        .on('error', handleError)
    )
    .pipe(prefix({
      cascade: false
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("./public/css"))
}
const css = gulp.series(compileScss);

/* ----------------------------------------- */
/*  Watch Updates
/* ----------------------------------------- */

function watchUpdates() {
  gulp.watch(SYSTEM_SCSS, css);
}



/********************/
/*		LINK		*/
/********************/

/**
 * Link build to User Data folder
 */
async function linkUserData() {
  const name = path.basename(path.resolve("."));
  const config = fs.readJSONSync("foundryconfig.json");

  let destDir;
  try {
    if (
      fs.existsSync(path.resolve(".", "dist", "module.json")) ||
      fs.existsSync(path.resolve(".", "src", "module.json"))
    ) {
      destDir = "modules";
    } else if (
      fs.existsSync(path.resolve(".", "dist", "system.json")) ||
      fs.existsSync(path.resolve(".", "src", "system.json"))
    ) {
      destDir = "systems";
    } else {
      throw Error(`Could not find ${chalk.blueBright("module.json")} or ${chalk.blueBright("system.json")}`);
    }

    let linkDir;
    if (config.dataPath) {
      if (!fs.existsSync(path.join(config.dataPath, "Data")))
        throw Error("User Data path invalid, no Data directory found");

      linkDir = path.join(config.dataPath, "Data", destDir, config.systemName);
    } else {
      throw Error("No User Data path defined in foundryconfig.json");
    }

    if (argv.clean || argv.c) {
      console.log(chalk.yellow(`Removing build in ${chalk.blueBright(linkDir)}`));

      await fs.remove(linkDir);
    } else if (!fs.existsSync(linkDir)) {
      console.log(chalk.green(`Copying build to ${chalk.blueBright(linkDir)}`));
      await fs.symlink(path.resolve("./dist"), linkDir, "junction");
    }
    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
}

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

exports.link = linkUserData
exports.default = gulp.series(
  compileScss,
  watchUpdates
);
exports.build = gulp.series(
  compileScss
);
exports.css = css;
