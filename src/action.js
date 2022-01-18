/* eslint-disable camelcase */
const github = require('@actions/github');
const core = require('@actions/core');
const axios = require('axios');
const fs = require('fs');

async function run() {
  const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
  const FILE_LOCATION = core.getInput('FILE_LOCATION');
  const ASSET_NAME = core.getInput('ASSET_NAME');
  const ASSET_TYPE = core.getInput('ASSET_TYPE');
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { context = {} } = github;
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

  const lastestRelease = await octokit.request(
    `GET /repos/${pull_request.head.repo.owner.login}/${pull_request.head.repo.name}/releases/latest`,
    {
      owner: pull_request.head.repo.owner.login,
      repo: pull_request.head.repo.name,
    },
  );

  const releases = await octokit.request(
    `POST /repos/${pull_request.head.repo.owner.login}/${pull_request.head.repo.name}/releases`,
    {
      owner: pull_request.head.repo.owner.login,
      repo: pull_request.head.repo.name,
      tag_name: 'TEST-3',
      body: `## New from last release\n * ${(commits || [])
        .map((value) => `${value.commit.message} ${value.html_url}`)
        .join('\n* ')}`,
      generate_release_notes: true,
    },
  );
  const headers = {
    'content-type': ASSET_TYPE,
    'content-length': contentLength(FILE_LOCATION),
  };

  const uploadAssetResponse = await github.repos.uploadReleaseAsset({
    url: releases.upload_url,
    headers,
    name: ASSET_NAME || 'CUSTOM_ASSET',
    file: fs.readFileSync(FILE_LOCATION),
  });
  console.log(JSON.stringify(uploadAssetResponse));
}
run();
