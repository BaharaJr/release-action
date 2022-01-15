/* eslint-disable camelcase */
const github = require('@actions/github');
const core = require('@actions/core');

async function run() {
  const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { context = {} } = github;
  const { pull_request } = context.payload;
  const commits = await octokit.request(
    `GET /repos/${pull_request.head.repo.owner.login}/${pull_request.head.repo.name}/commits`,
    {
      owner: pull_request.head.repo.owner.login,
      repo: pull_request.head.repo.name,
    },
  );

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
      tag_name: 'TEST-1',
      body: `## What's Changed from last release\n * ${(commits || [])
        .map((value) => `${value.commit.message} ${value.html_url}`)
        .join('\n *')}`,
    },
  );


  await octokit.rest.issues.createComment({
    ...context.repo,
    issue_number: pull_request.number,
    body: `${(commits || [])
      .map((value) => `${value.commit.message} ${value.html_url}`)
      .join('\n')}`,
  });
}
run();
