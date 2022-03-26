const shell = require('shelljs')
const conventionalRecommendedBump = require('conventional-recommended-bump')

const { code } = shell.exec('npm whoami --registry=https://registry.npmjs.org/')

if (code) {
  shell.exec('npm login --registry=https://registry.npmjs.org/')
}

conventionalRecommendedBump(
  {
    preset: `angular`
  },
  (error, recommendation) => {
    if (error) {
      process.exit(1)
    }
    shell
      .exec('pnpm install')
      .exec('pnpm run test')
      .exec('npm version ' + recommendation.releaseType)
      .exec(
        `conventional-changelog -p angular -i CHANGELOG.md -s && git add CHANGELOG.md && git commit -m "docs(CHANGELOG): ${
          require('./package.json').version
        }"`
      )
      .exec('npm publish')
      .exec('git push')
      .exec('git push --tags')
  }
)
