const github = require("@actions/github");
const core = require("@actions/core");
const io = require("@actions/io");

async function run() {
  const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { context = {} } = github;
  const { pull_request } = context.payload;
  console.log(pull_request.sender);
  await octokit.rest.issues.createComment({
    ...context.repo,
    issue_number: pull_request.number,
    body: `Hey Bennett, we are up on a good path`,
  });
}
run();
