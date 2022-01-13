const github = require("@actions/github");
const core = require("@actions/core");
const io = require("@actions/io");
const axios = require("axios");

async function run() {
  const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { context = {} } = github;
  const { pull_request } = context.payload;
  const commits = (await axios.get(pull_request.commits_url)).data;
  const notes = commits
    .map((value) => `${value.commit.message}[@${value.author.login}]`)
    .join("\n");
  await octokit.rest.issues.createComment({
    ...context.repo,
    issue_number: pull_request.number,
    body: `Hey @${pull_request.user.login}. Your PR has been created with these commits. \n ${notes}`,
  });
}
run();
