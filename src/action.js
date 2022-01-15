/* eslint-disable camelcase */
const github = require('@actions/github');
const core = require('@actions/core');
const axios = require('axios');

async function run() {
  const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
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

  const releases = await octokit.request(
    `POST /repos/${pull_request.head.repo.owner.login}/${pull_request.head.repo.name}/releases`,
    {
      owner: pull_request.head.repo.owner.login,
      repo: pull_request.head.repo.name,
      tag_name: 'TEST-RELEASE',
      generate_release_notes: true,
    },
  );

  console.log(JSON.stringify(releases));

  await octokit.rest.issues.createComment({
    ...context.repo,
    issue_number: pull_request.number,
    body: `${(commits || [])
      .map((value) => `${value.commit.message} SHA-${value.sha}`)
      .join('\n')}`,
  });
}
run();
