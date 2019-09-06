const fs = require('fs');
const Octokit = require('@octokit/rest');
const path = require('path');

const { getArguments } = require(path.resolve(__dirname, './common'));

// @ts-ignore
const packageJson = require(path.resolve(__dirname, '../package.json'));

const args = getArguments(process);

const octokit = new Octokit({
  auth: args.token,
  userAgent: 'ESGST'
});

const defaultParams = {
  owner: packageJson.author,
  repo: packageJson.name
};

async function generateChangelog() {
  const featureChangelog = ['### ⭐ Features / Enhancements', ''];
  const bugChangelog = ['### 🐛 Bug Fixes', ''];
  const removalChangelog = ['### ❌ Removals / Rollbacks', ''];

  const milestones = await octokit.issues.listMilestonesForRepo(Object.assign({}, defaultParams, {
    direction: 'desc',
    sort: 'completeness'
  }));

  const milestoneNumber = milestones.data[0].number;

  const issues = await octokit.issues.listForRepo(Object.assign({}, defaultParams, {
    milestone: milestoneNumber.toString(),
    state: 'closed'
  }));

  for (const issue of issues.data) {
    const issueTitle = issue.title
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');

    const change = `* #${issue.number} ${issueTitle}`;

    for (const label of issue.labels) {
      if (label.name === 'Feature Request' || label.name === 'Enhancement') {
        featureChangelog.push(change);

        break;
      } else if (label.name === 'Bug' || label.name === 'Conflict' || label.name === 'Typo' || label.name === 'Visual Bug') {
        bugChangelog.push(change);

        break;
      } else if (label.name === 'Removal' || label.name === 'Rollback') {
        removalChangelog.push(change);

        break;
      }
    }
  }

  await octokit.issues.updateMilestone(Object.assign({}, defaultParams, {
    milestone_number: milestoneNumber,
    state: /** @type {'closed'} */ ('closed')
  }));

  return [
    ...(featureChangelog.length > 2 ? featureChangelog : []),
    ...(bugChangelog.length > 2 ? bugChangelog : []),
    ...(removalChangelog.length > 2 ? removalChangelog : [])
  ].join('\n');
}

async function generateRelease() {
  if (args.dev) {
    const releases = await octokit.repos.listReleases(Object.assign({}, defaultParams));

    const preRelease = releases.data.filter(release => release.prerelease)[0];

    if (preRelease) {
      await octokit.repos.deleteRelease(Object.assign({}, defaultParams, {
        release_id: preRelease.id
      }));

      await octokit.git.deleteRef(Object.assign({}, defaultParams, {
        ref: `tags/${preRelease.tag_name}`
      }));
    }
  }

  const body = args.dev ? '' : (await generateChangelog());

  const name = `v${packageJson.devVersion}`;
  
  const release = await octokit.repos.createRelease(Object.assign({}, defaultParams, {
    body,
    name,
    prerelease: !!args.dev,
    tag_name: name
  }));
  
  const url = release.data.upload_url;

  const files = [
    {
      content: fs.readFileSync(path.resolve(__dirname, '../dist/chrome.zip')),
      name: 'chrome.zip',
      type: 'application/zip'
    },
    {
      content: fs.readFileSync(path.resolve(__dirname, '../dist/firefox.zip')),
      name: 'firefox.zip',
      type: 'application/zip'
    },
    {
      content: fs.readFileSync(path.resolve(__dirname, '../dist/palemoon.xpi')),
      name: 'palemoon.xpi',
      type: 'application/zip'
    },
    {
      content: fs.readFileSync(path.resolve(__dirname, '../dist/userscript.meta.js')),
      name: 'userscript.meta.js',
      type: 'application/javascript'
    },
    {
      content: fs.readFileSync(path.resolve(__dirname, '../dist/userscript.user.js')),
      name: 'userscript.user.js',
      type: 'application/javascript'
    }
  ];

  const promises = [];

  for (const file of files) {
    promises.push(octokit.repos.uploadReleaseAsset({
      headers: {
        'content-length': file.content.byteLength,
        'content-type': file.type
      },
      file: file.content,
      name: file.name,
      url
    }));
  }
}

generateRelease();