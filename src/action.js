/* eslint-disable camelcase */
const github = require('@actions/github');
const core = require('@actions/core');
const axios = require('axios');
const fs = require('fs');

const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
const FILE_LOCATION = core.getInput('FILE_LOCATION');
const ASSET_NAME = core.getInput('ASSET_NAME');
const ASSET_TYPE = core.getInput('ASSET_TYPE');
const LABEL_NAME = core.getInput('LABE_NAME');
const octokit = github.getOctokit(GITHUB_TOKEN);
const { context = {} } = github;

async function run() {
  core.debug(JSON.stringify(context));
  const eventName = context.eventName;
  switch (eventName) {
    case 'pull_request':
      return pr();
    case 'push':
      core.setFailed(
        `Event ${context.eventName} is still WIP and will be available soon. Please submit an issue to the repo for quick delivery.`,
      );
    default:
      core.setFailed(
        `Event ${context.eventName} is still WIP and will be available soon. Please submit an issue to the repo for quick delivery.`,
      );
  }
}
const pr = async () => {
  const { pull_request } = context.payload;

  const commits = (
    await axios.get(pull_request.commits_url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': pull_request.head.repo.name,
      },
    })
  ).data;

  const contentLength = (filePath) => fs.statSync(filePath).size;

  await octokit.rest.issues.createComment({
    ...context.repo,
    issue_number: pull_request.number,
    body: `${(commits || [])
      .map((value) => `${value.commit.message} ${value.html_url}`)
      .join('\n* ')}`,
  });

  const releases = await octokit.request(
    `POST /repos/${pull_request.head.repo.owner.login}/${pull_request.head.repo.name}/releases`,
    {
      owner: pull_request.head.repo.owner.login,
      repo: pull_request.head.repo.name,
      tag_name: `${new Date().getTime()}`,
      body: `## New from last release\n * ${(commits || [])
        .map((value) => `${value.commit.message} ${value.html_url}`)
        .join('\n* ')}`,
      generate_release_notes: true,
    },
  );
  const headers = {
    'content-type': ASSET_TYPE,
    'content-length': contentLength(FILE_LOCATION),
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  };
  try {
    const assets = await axios.post(
      releases.data.upload_url
        .split('{?name,')
        .join(`?name=${ASSET_NAME || 'CUSTOM_ASSET'}`)
        .split('label}')
        .join(`&label=${LABEL_NAME || 'release'}`),
      fs.readFileSync(FILE_LOCATION),
      {
        headers,
      },
    );
  } catch (e) {
    console.log(e);
  }
};
run();
