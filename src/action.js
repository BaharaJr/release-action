/* eslint-disable camelcase */
import github, { getOctokit } from '@actions/github';
import { getInput } from '@actions/core';
import { get } from 'axios';

async function run() {
  const GITHUB_TOKEN = getInput('GITHUB_TOKEN');
  const octokit = getOctokit(GITHUB_TOKEN);
  const { context = {} } = github;
  const { pull_request } = context.payload;
  const commits = (
    await get(pull_request.commits_url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': pull_request.head.repo.name,
      },
    })
  ).data;
  await octokit.rest.issues.createComment({
    ...context.repo,
    issue_number: pull_request.number,
    body: `Hey @${
      pull_request.user.login
    }. Your PR has been created with these commits. \n ${(commits || [])
      .map((value) => `${value.commit.message}  [@${value.author.login}]`)
      .join('\n')}`,
  });
}
run();
